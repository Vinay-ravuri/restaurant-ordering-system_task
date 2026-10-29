import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireRole } from '../middleware/auth.js';
import { getDayRangeIST } from '../domain/dayRangeIST.js';
import type { OrderStatus, OrderType } from '@prisma/client';

export async function adminAnalyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireRole('ADMIN'));

  // GET /admin/today - Metrics and orders for current IST day
  fastify.get('/admin/today', async (request, reply) => {
    const { start, end, istDateString } = getDayRangeIST();

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    const orderCount = orders.length;
    const totalRevenuePaise = orders.reduce((sum, order) => sum + order.totalPaise, 0);
    const averageOrderValuePaise = orderCount > 0 ? Math.round(totalRevenuePaise / orderCount) : 0;

    const ordersByStatus: Record<OrderStatus, number> = {
      RECEIVED: 0,
      PREPARING: 0,
      READY: 0,
      SERVED: 0,
    };

    const ordersByType: Record<OrderType, number> = {
      DINE_IN: 0,
      TAKEAWAY: 0,
    };

    for (const order of orders) {
      if (ordersByStatus[order.status] !== undefined) {
        ordersByStatus[order.status]++;
      }
      if (ordersByType[order.orderType] !== undefined) {
        ordersByType[order.orderType]++;
      }
    }

    return reply.status(200).send({
      istDateString,
      dayRange: {
        startUTC: start.toISOString(),
        endUTC: end.toISOString(),
      },
      orderCount,
      totalRevenuePaise,
      averageOrderValuePaise,
      ordersByStatus,
      ordersByType,
      orders,
    });
  });

  // GET /admin/orders - Filterable, searchable order list
  fastify.get('/admin/orders', async (request, reply) => {
    const query = request.query as {
      status?: OrderStatus;
      orderType?: OrderType;
      search?: string;
      limit?: string;
      offset?: string;
    };

    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.orderType) {
      where.orderType = query.orderType;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { id: { contains: term } },
        { orderNumber: { contains: term } },
        { customerName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ]);

    return reply.status(200).send({
      orders,
      total,
      limit,
      offset,
    });
  });
}
