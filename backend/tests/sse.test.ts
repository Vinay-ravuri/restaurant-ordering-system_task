import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { eventBus } from '../src/events/eventBus.js';
import type { FastifyInstance } from 'fastify';

describe('Server-Sent Events (SSE) Stream Lifecycle & Isolation', () => {
  let app: FastifyInstance;
  let serverUrl: string;

  beforeAll(async () => {
    app = buildApp();
    // Bind to ephemeral port for authentic HTTP stream lifecycle testing
    serverUrl = await app.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('correctly sets SSE streaming headers, transmits handshake, and cleans up on client disconnect', async () => {
    const controller = new AbortController();

    // 1. Initiate SSE connection
    const res = await fetch(`${serverUrl}/events/menu`, {
      signal: controller.signal,
    });

    // 2. Validate stream headers
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('cache-control')).toContain('no-cache');
    expect(res.headers.get('connection')).toContain('keep-alive');

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    // 3. Read initial connected handshake
    const firstChunk = await reader!.read();
    const handshakeText = new TextDecoder().decode(firstChunk.value);
    expect(handshakeText).toContain(': connected');

    // 4. Trigger an event and read the streamed event chunk
    setTimeout(() => {
      eventBus.publish('menu.updated', { action: 'stock_change', itemId: 'item-test-123' });
    }, 20);

    const eventChunk = await reader!.read();
    const eventText = new TextDecoder().decode(eventChunk.value);
    expect(eventText).toContain('event: menu.updated');
    expect(eventText).toContain('stock_change');

    // 5. Clean client disconnect & release reader
    reader!.releaseLock();
    controller.abort();
  });

  it('isolates customer order stream so updates for order A do not leak to order B', async () => {
    const controllerA = new AbortController();

    const resA = await fetch(`${serverUrl}/events/orders/order-A-uuid`, {
      signal: controllerA.signal,
    });

    expect(resA.status).toBe(200);
    const readerA = resA.body?.getReader();
    expect(readerA).toBeDefined();

    // Consume initial handshake
    await readerA!.read();

    // Publish Order B (should be ignored) and Order A (should be delivered)
    setTimeout(() => {
      eventBus.publish('order.updated', { id: 'order-B-uuid', status: 'PREPARING' });
      eventBus.publish('order.updated', { id: 'order-A-uuid', status: 'PREPARING' });
    }, 20);

    const orderAChunk = await readerA!.read();
    const textA = new TextDecoder().decode(orderAChunk.value);

    expect(textA).toContain('order-A-uuid');
    expect(textA).not.toContain('order-B-uuid');

    readerA!.releaseLock();
    controllerA.abort();
  });
});
