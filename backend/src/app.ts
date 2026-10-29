import fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { formatZodError, AppError } from './utils/errors.js';
import { ZodError } from 'zod';

import { menuRoutes } from './routes/menu.routes.js';
import { adminMenuRoutes } from './routes/admin.menu.routes.js';
import { orderRoutes } from './routes/order.routes.js';
import { adminAnalyticsRoutes } from './routes/admin.analytics.routes.js';
import { sseRoutes } from './routes/sse.routes.js';

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: env.NODE_ENV !== 'test',
  });

  // Security headers
  app.register(helmet, {
    contentSecurityPolicy: false,
  });

  // CORS configuration
  app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return cb(null, true);
      const allowed = env.FRONTEND_ORIGIN.split(',').map((o) => o.trim());
      if (allowed.includes(origin) || origin.startsWith('http://localhost:')) {
        return cb(null, true);
      }
      return cb(new Error('CORS policy: origin not allowed'), false);
    },
    credentials: true,
  });

  // Cookies plugin
  app.register(cookie);

  // Rate limiting plugin
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Central error handler
  app.setErrorHandler((error: any, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send(formatZodError(error));
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        fields: error.fields,
      });
    }

    request.log.error(error);
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal server error occurred';

    return reply.status(statusCode).send({
      error: message,
    });
  });

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'restaurantos-backend',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    };
  });

  // Register Auth routes under /auth and /api/auth
  app.register(authRoutes, { prefix: '/auth' });
  app.register(authRoutes, { prefix: '/api/auth' });

  // Register Menu routes (both root and /api prefixed)
  app.register(menuRoutes);
  app.register(menuRoutes, { prefix: '/api' });

  // Register Admin Menu routes
  app.register(adminMenuRoutes);
  app.register(adminMenuRoutes, { prefix: '/api' });

  // Register Order routes
  app.register(orderRoutes);
  app.register(orderRoutes, { prefix: '/api' });

  // Register Admin Analytics routes
  app.register(adminAnalyticsRoutes);
  app.register(adminAnalyticsRoutes, { prefix: '/api' });

  // Register SSE routes
  app.register(sseRoutes);
  app.register(sseRoutes, { prefix: '/api' });

  return app;
}
