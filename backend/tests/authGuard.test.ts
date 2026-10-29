import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { signToken, COOKIE_NAME } from '../src/utils/auth.js';
import type { FastifyInstance } from 'fastify';

describe('Authentication & Role Authorization Guards', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  it('12a. unauthenticated request to change order status returns 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/orders/00000000-0000-0000-0000-000000000001/status',
      payload: { status: 'PREPARING' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/Authentication required/i);
  });

  it('12b. non-admin user (e.g. KITCHEN role) attempting admin action returns 403 Forbidden', async () => {
    const kitchenToken = signToken({
      userId: 'user-kitchen-1',
      email: 'kitchen@demo.com',
      role: 'KITCHEN',
    });

    // Kitchen staff attempts to create a category
    const res = await app.inject({
      method: 'POST',
      url: '/admin/categories',
      cookies: {
        [COOKIE_NAME]: kitchenToken,
      },
      payload: {
        name: 'Secret Category',
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/Forbidden/i);
  });

  it('12c. unauthenticated request to kitchen or admin routes returns 401', async () => {
    const resKitchen = await app.inject({
      method: 'GET',
      url: '/kitchen/orders',
    });
    expect(resKitchen.statusCode).toBe(401);

    const resAdmin = await app.inject({
      method: 'GET',
      url: '/admin/today',
    });
    expect(resAdmin.statusCode).toBe(401);
  });
});
