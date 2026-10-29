import { EventEmitter } from 'events';

export type EventType = 'order.created' | 'order.updated' | 'menu.updated';

export interface AppEvent<T = any> {
  id: string;
  type: EventType;
  timestamp: string;
  data: T;
}

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow unlimited listeners for SSE clients
    this.setMaxListeners(0);
  }

  public publish<T>(type: EventType, data: T): void {
    const event: AppEvent<T> = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    this.emit(type, event);
    this.emit('all', event);
  }
}

export const eventBus = new AppEventBus();
