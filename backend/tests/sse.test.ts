import { describe, it, expect } from 'vitest';
import { eventBus, type AppEvent } from '../src/events/eventBus.js';

describe('Real-Time Event Bus Infrastructure', () => {
  it('publishes order.created events with unique ID, timestamp, and payload', () => {
    let captured: AppEvent | null = null;
    const handler = (event: AppEvent) => {
      captured = event;
    };

    eventBus.once('order.created', handler);

    eventBus.publish('order.created', {
      id: 'ord-123',
      orderNumber: '#101',
      totalPaise: 45000,
    });

    expect(captured).not.toBeNull();
    expect(captured!.type).toBe('order.created');
    expect(captured!.id).toBeDefined();
    expect(captured!.timestamp).toBeDefined();
    expect(captured!.data.id).toBe('ord-123');
    expect(captured!.data.totalPaise).toBe(45000);
  });

  it('publishes order.updated and menu.updated events to specific listeners', () => {
    const events: string[] = [];

    const orderHandler = (e: AppEvent) => events.push(`order:${e.data.status}`);
    const menuHandler = (e: AppEvent) => events.push(`menu:${e.data.action}`);

    eventBus.once('order.updated', orderHandler);
    eventBus.once('menu.updated', menuHandler);

    eventBus.publish('order.updated', { id: 'ord-123', status: 'PREPARING' });
    eventBus.publish('menu.updated', { action: 'availability_changed', itemId: 'item-1' });

    expect(events).toContain('order:PREPARING');
    expect(events).toContain('menu:availability_changed');
  });
});
