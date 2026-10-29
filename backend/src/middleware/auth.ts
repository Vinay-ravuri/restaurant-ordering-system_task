import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, COOKIE_NAME, type TokenPayload } from '../utils/auth.js';
import type { Role } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[COOKIE_NAME] || request.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return reply.status(401).send({
      error: 'Authentication required. Please sign in.',
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return reply.status(401).send({
      error: 'Invalid or expired session. Please sign in again.',
    });
  }

  request.user = payload;
}

export function requireRole(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden. You do not have permission to perform this action.',
      });
    }
  };
}
