import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eventBus, type AppEvent } from '../events/eventBus.js';
import { requireRole } from '../middleware/auth.js';

function setupSSE(request: FastifyRequest, reply: FastifyReply) {
  // Set SSE response headers
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Accel-Buffering', 'no');
  reply.raw.flushHeaders();

  // Initial connection acknowledgement
  reply.raw.write(': connected\n\n');

  // Heartbeat comment every 25 seconds to keep proxies/browsers alive
  const heartbeatTimer = setInterval(() => {
    if (!reply.raw.writableEnded) {
      reply.raw.write(': heartbeat\n\n');
    }
  }, 25000);

  const writeEvent = (event: string, data: any, id?: string) => {
    if (reply.raw.writableEnded) return;
    let payload = `event: ${event}\n`;
    if (id) payload += `id: ${id}\n`;
    payload += `data: ${JSON.stringify(data)}\n\n`;
    reply.raw.write(payload);
  };

  const cleanup = (listener: (...args: any[]) => void, eventName?: string) => {
    clearInterval(heartbeatTimer);
    if (eventName) {
      eventBus.off(eventName, listener);
    } else {
      eventBus.off('all', listener);
    }
  };

  return { writeEvent, cleanup, heartbeatTimer };
}

export async function sseRoutes(fastify: FastifyInstance) {
  // 1. GET /events/kitchen - Protected SSE stream for Kitchen KDS and Admin
  fastify.get(
    '/events/kitchen',
    { preHandler: [requireRole('KITCHEN', 'ADMIN')] },
    async (request, reply) => {
      const { writeEvent, cleanup } = setupSSE(request, reply);

      const onKitchenEvent = (event: AppEvent) => {
        // Forward order creation and order update events
        if (event.type === 'order.created' || event.type === 'order.updated') {
          writeEvent(event.type, event.data, event.id);
        }
      };

      eventBus.on('all', onKitchenEvent);

      request.raw.on('close', () => {
        cleanup(onKitchenEvent);
      });
    }
  );

  // 2. GET /events/orders/:id - Public SSE stream for customer tracking page
  fastify.get('/events/orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { writeEvent, cleanup } = setupSSE(request, reply);

    const onOrderUpdate = (event: AppEvent) => {
      // Only stream updates matching this specific customer order
      if (event.type === 'order.updated' && event.data?.id === id) {
        writeEvent('order.updated', event.data, event.id);
      }
    };

    eventBus.on('order.updated', onOrderUpdate);

    request.raw.on('close', () => {
      cleanup(onOrderUpdate, 'order.updated');
    });
  });

  // 3. GET /events/menu - Public SSE stream for menu updates (stretch: out-of-stock toast)
  fastify.get('/events/menu', async (request, reply) => {
    const { writeEvent, cleanup } = setupSSE(request, reply);

    const onMenuUpdate = (event: AppEvent) => {
      writeEvent('menu.updated', event.data, event.id);
    };

    eventBus.on('menu.updated', onMenuUpdate);

    request.raw.on('close', () => {
      cleanup(onMenuUpdate, 'menu.updated');
    });
  });
}
