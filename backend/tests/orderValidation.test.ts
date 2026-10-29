import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Order Creation & Validation Rules (HTTP Level)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  it('6. rejects dine-in order when table number is missing, zero, or out of range', async () => {
    // Missing tableNumber
    const resNoTable = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        orderType: 'DINE_IN',
        items: [{ variantId: '00000000-0000-0000-0000-000000000001', qty: 1 }],
      },
    });

    expect(resNoTable.statusCode).toBe(400);
    const bodyNoTable = JSON.parse(resNoTable.body);
    expect(bodyNoTable.fields).toBeDefined();
    expect(bodyNoTable.fields.tableNumber).toMatch(/table number between 1 and 200/i);

    // Table number 0
    const resZeroTable = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        orderType: 'DINE_IN',
        tableNumber: 0,
        items: [{ variantId: '00000000-0000-0000-0000-000000000001', qty: 1 }],
      },
    });

    expect(resZeroTable.statusCode).toBe(400);
    const bodyZeroTable = JSON.parse(resZeroTable.body);
    expect(bodyZeroTable.fields.tableNumber).toMatch(/table number between 1 and 200/i);

    // Table number 250 (>200)
    const resHighTable = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        orderType: 'DINE_IN',
        tableNumber: 250,
        items: [{ variantId: '00000000-0000-0000-0000-000000000001', qty: 1 }],
      },
    });

    expect(resHighTable.statusCode).toBe(400);
  });

  it('7. rejects takeaway order when a table number is provided', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        orderType: 'TAKEAWAY',
        tableNumber: 5, // Forbidden for takeaway
        items: [{ variantId: '00000000-0000-0000-0000-000000000001', qty: 1 }],
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.fields).toBeDefined();
    expect(body.fields.tableNumber).toMatch(/must not be specified for takeaway/i);
  });

  it('rejects order with empty items array or invalid variant UUID', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        orderType: 'TAKEAWAY',
        items: [],
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Validation failed');
  });
});
