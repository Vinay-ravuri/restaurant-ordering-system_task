import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { calcOrderTotal } from '../domain/calcOrderTotal.js';
import { assertValidTransition, getStatusTimestampField } from '../domain/statusMachine.js';
import { requireRole } from '../middleware/auth.js';
import { formatZodError, AppError } from '../utils/errors.js';
import { eventBus } from '../events/eventBus.js';
import type { OrderStatus } from '@prisma/client';

const createOrderSchema = z
  .object({
    orderType: z.enum(['DINE_IN', 'TAKEAWAY']),
    tableNumber: z.coerce.number().int().optional().nullable(),
    customerName: z.string().max(60).optional().nullable(),
    idempotencyKey: z.string().max(100).optional().nullable(),
    items: z
      .array(
        z.object({
          variantId: z.string().uuid('Invalid variant ID'),
          qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(20, 'Quantity cannot exceed 20'),
        })
      )
      .min(1, 'At least one item is required')
      .max(30, 'Cannot exceed 30 items per order'),
  })
  .superRefine((data, ctx) => {
    if (data.orderType === 'DINE_IN') {
      if (!data.tableNumber || data.tableNumber < 1 || data.tableNumber > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tableNumber'],
          message: 'Dine-in orders require a valid table number between 1 and 200',
        });
      }
    } else if (data.orderType === 'TAKEAWAY') {
      if (data.tableNumber !== undefined && data.tableNumber !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tableNumber'],
          message: 'Table number must not be specified for takeaway orders',
        });
      }
    }
  });

const updateStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'READY', 'SERVED']),
});

export async function orderRoutes(fastify: FastifyInstance) {
  // POST /orders - Public customer order creation
  fastify.post('/orders', async (request, reply) => {
    const parse = createOrderSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const { orderType, tableNumber, customerName, items: rawLines, idempotencyKey } = parse.data;

    // Check for idempotent duplicate submission
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true },
      });
      if (existing) {
        return reply.status(200).send({
          order: existing,
          isDuplicate: true,
        });
      }
    }

    // Extract unique variant IDs
    const variantIds = Array.from(new Set(rawLines.map((l) => l.variantId)));

    // Fetch authoritative variant data and related items from database
    const dbVariants = await prisma.itemVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            isAvailable: true,
          },
        },
      },
    });

    // Pure server-side pricing and stock validation
    const calculated = calcOrderTotal(dbVariants as any, rawLines);

    // Generate short human-readable order number (e.g. #101)
    const todayOrdersCount = await prisma.order.count();
    const orderNumber = `#${101 + (todayOrdersCount % 900)}`;

    // Create Order and snapshot OrderItems inside a database transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          orderType,
          tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
          customerName: customerName ? customerName.trim() : null,
          totalPaise: calculated.totalPaise,
          idempotencyKey: idempotencyKey || null,
          status: 'RECEIVED',
          items: {
            create: calculated.items.map((item) => ({
              itemId: item.itemId,
              variantId: item.variantId,
              nameSnapshot: item.nameSnapshot,
              variantLabelSnapshot: item.variantLabelSnapshot,
              unitPricePaise: item.unitPricePaise,
              qty: item.qty,
              lineTotalPaise: item.lineTotalPaise,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    });

    // Publish real-time event to SSE listeners
    eventBus.publish('order.created', newOrder);

    return reply.status(201).send({
      order: newOrder,
    });
  });

  // GET /orders/:id - Public customer tracking endpoint
  fastify.get('/orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return reply.status(404).send({
        error: `Order ${id} not found. Please verify your tracking link.`,
      });
    }

    return reply.status(200).send({ order });
  });

  // PATCH /orders/:id/status - Kitchen / Admin status progression
  fastify.patch(
    '/orders/:id/status',
    { preHandler: [requireRole('KITCHEN', 'ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parse = updateStatusSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send(formatZodError(parse.error));
      }

      const targetStatus = parse.data.status as OrderStatus;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      // Assert status transition rules
      assertValidTransition(order.status, targetStatus);

      // Determine timestamp update
      const tsField = getStatusTimestampField(targetStatus);
      const updateData: Record<string, any> = {
        status: targetStatus,
      };
      if (tsField) {
        updateData[tsField] = new Date();
      }

      const updated = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
        },
      });

      // Publish real-time status update to SSE
      eventBus.publish('order.updated', updated);

      return reply.status(200).send({
        order: updated,
      });
    }
  );

  // GET /kitchen/orders - Live Kitchen orders list
  fastify.get(
    '/kitchen/orders',
    { preHandler: [requireRole('KITCHEN', 'ADMIN')] },
    async (request, reply) => {
      const orders = await prisma.order.findMany({
        where: {
          status: {
            in: ['RECEIVED', 'PREPARING', 'READY', 'SERVED'],
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
        take: 100,
      });

      return reply.status(200).send({ orders });
    }
  );
}
