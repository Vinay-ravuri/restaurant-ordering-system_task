import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma.js';

export async function menuRoutes(fastify: FastifyInstance) {
  // GET /menu - Public menu with categories, available items, and available variants
  fastify.get('/menu', async (request, reply) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'asc' },
          include: {
            variants: {
              where: { isAvailable: true },
              orderBy: { pricePaise: 'asc' },
            },
          },
        },
      },
    });

    return reply.status(200).send({
      categories,
    });
  });

  // GET /categories - Public list of active categories
  fastify.get('/categories', async (request, reply) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return reply.status(200).send({ categories });
  });
}
