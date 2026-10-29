import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireRole } from '../middleware/auth.js';
import { formatZodError, AppError } from '../utils/errors.js';
import { eventBus } from '../events/eventBus.js';

// Schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  sortOrder: z.coerce.number().int().default(0),
  description: z.string().max(200).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  sortOrder: z.coerce.number().int().optional(),
  description: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

const createItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Item name is required').max(80),
  description: z.string().min(1, 'Description is required').max(300),
  imageUrl: z.string().url('Must be a valid URL').nullable().optional(),
  dietary: z.enum(['VEG', 'NON_VEG', 'VEGAN', 'CONTAINS_EGG']).nullable().optional(),
  isAvailable: z.boolean().default(true),
});

const updateItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().min(1).max(300).optional(),
  imageUrl: z.string().url().nullable().optional(),
  dietary: z.enum(['VEG', 'NON_VEG', 'VEGAN', 'CONTAINS_EGG']).nullable().optional(),
  isAvailable: z.boolean().optional(),
});

const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const createVariantSchema = z.object({
  label: z.string().min(1, 'Label is required (e.g. Regular, Half, Full)').max(30),
  pricePaise: z.coerce.number().int().positive('Price must be greater than 0 paise'),
  isAvailable: z.boolean().default(true),
});

const updateVariantSchema = z.object({
  label: z.string().min(1).max(30).optional(),
  pricePaise: z.coerce.number().int().positive().optional(),
  isAvailable: z.boolean().optional(),
});

export async function adminMenuRoutes(fastify: FastifyInstance) {
  // Guard all admin menu routes for ADMIN role
  fastify.addHook('preHandler', requireRole('ADMIN'));

  // GET /admin/menu
  fastify.get('/admin/menu', async (request, reply) => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            variants: {
              orderBy: { pricePaise: 'asc' },
            },
          },
        },
      },
    });

    return reply.status(200).send({ categories });
  });

  // POST /admin/categories
  fastify.post('/admin/categories', async (request, reply) => {
    const parse = createCategorySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const category = await prisma.category.create({
      data: parse.data,
    });

    eventBus.publish('menu.updated', { action: 'category_created', categoryId: category.id });
    return reply.status(201).send({ category });
  });

  // PATCH /admin/categories/:id
  fastify.patch('/admin/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = updateCategorySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Category not found' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: parse.data,
    });

    eventBus.publish('menu.updated', { action: 'category_updated', categoryId: category.id });
    return reply.status(200).send({ category });
  });

  // DELETE /admin/categories/:id
  fastify.delete('/admin/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Category not found' });
    }

    await prisma.category.delete({ where: { id } });
    eventBus.publish('menu.updated', { action: 'category_deleted', categoryId: id });
    return reply.status(200).send({ message: 'Category deleted successfully' });
  });

  // POST /admin/items
  fastify.post('/admin/items', async (request, reply) => {
    const parse = createItemSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const category = await prisma.category.findUnique({
      where: { id: parse.data.categoryId },
    });
    if (!category) {
      return reply.status(404).send({ error: 'Assigned category does not exist' });
    }

    const item = await prisma.menuItem.create({
      data: parse.data,
      include: { variants: true },
    });

    eventBus.publish('menu.updated', { action: 'item_created', itemId: item.id });
    return reply.status(201).send({ item });
  });

  // PATCH /admin/items/:id
  fastify.patch('/admin/items/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = updateItemSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Menu item not found' });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: parse.data,
      include: { variants: true },
    });

    eventBus.publish('menu.updated', { action: 'item_updated', itemId: item.id });
    return reply.status(200).send({ item });
  });

  // PATCH /admin/items/:id/availability (Stretch Feature & Core Rule)
  fastify.patch('/admin/items/:id/availability', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = toggleAvailabilitySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Menu item not found' });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: parse.data.isAvailable },
      include: { variants: true },
    });

    // Broadcast menu.updated so customer carts can automatically drop out-of-stock items
    eventBus.publish('menu.updated', {
      action: 'availability_changed',
      itemId: item.id,
      itemName: item.name,
      isAvailable: item.isAvailable,
    });

    return reply.status(200).send({ item });
  });

  // DELETE /admin/items/:id
  fastify.delete('/admin/items/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Menu item not found' });
    }

    await prisma.menuItem.delete({ where: { id } });
    eventBus.publish('menu.updated', { action: 'item_deleted', itemId: id });
    return reply.status(200).send({ message: 'Menu item deleted successfully' });
  });

  // POST /admin/items/:id/variants
  fastify.post('/admin/items/:id/variants', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = createVariantSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return reply.status(404).send({ error: 'Parent menu item not found' });
    }

    const variant = await prisma.itemVariant.create({
      data: {
        itemId: id,
        label: parse.data.label,
        pricePaise: parse.data.pricePaise,
        isAvailable: parse.data.isAvailable,
      },
    });

    eventBus.publish('menu.updated', { action: 'variant_created', itemId: id, variantId: variant.id });
    return reply.status(201).send({ variant });
  });

  // PATCH /admin/variants/:id
  fastify.patch('/admin/variants/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = updateVariantSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send(formatZodError(parse.error));
    }

    const existing = await prisma.itemVariant.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Variant not found' });
    }

    const variant = await prisma.itemVariant.update({
      where: { id },
      data: parse.data,
    });

    eventBus.publish('menu.updated', { action: 'variant_updated', variantId: variant.id, itemId: variant.itemId });
    return reply.status(200).send({ variant });
  });

  // DELETE /admin/variants/:id
  fastify.delete('/admin/variants/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.itemVariant.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Variant not found' });
    }

    await prisma.itemVariant.delete({ where: { id } });
    eventBus.publish('menu.updated', { action: 'variant_deleted', variantId: id, itemId: existing.itemId });
    return reply.status(200).send({ message: 'Variant deleted successfully' });
  });
}
