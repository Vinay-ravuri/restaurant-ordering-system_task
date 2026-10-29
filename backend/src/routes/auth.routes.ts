import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { verifyPassword, signToken, COOKIE_NAME } from '../utils/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { formatZodError } from '../utils/errors.js';
import { env } from '../config/env.js';

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/login
  fastify.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send(formatZodError(parseResult.error));
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'Invalid email or password',
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({
        error: 'Invalid email or password',
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const isProd = env.NODE_ENV === 'production';

    // Set secure HTTP-only cookie
    reply.setCookie(COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return reply.status(200).send({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token, // Also provided for clients/testing that prefer bearer auth
    });
  });

  // POST /auth/logout
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie(COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
    });

    return reply.status(200).send({
      message: 'Logged out successfully',
    });
  });

  // GET /auth/me
  fastify.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        error: 'User account not found',
      });
    }

    return reply.status(200).send({ user });
  });
}
