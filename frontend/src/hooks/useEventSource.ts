import { useEffect, useRef, useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface UseEventSourceOptions {
  events?: string[];
  onMessage?: (event: { type: string; data: any; id?: string }) => void;
  onReconnect?: () => void;
  enabled?: boolean;
}

export function useEventSource(endpoint: string, options: UseEventSourceOptions = {}) {
  const { events = [], onMessage, onReconnect, enabled = true } = options;
  const [status, setStatus] = useState<SSEConnectionStatus>('disconnected');
  const esRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasConnectedOnceRef = useRef(false);

  // Stable callback references
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const fullUrl = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    setStatus('connecting');

    try {
      const es = new EventSource(fullUrl, { withCredentials: true });
      esRef.current = es;

      es.onopen = () => {
        setStatus('connected');
        const wasReconnecting = retryCountRef.current > 0 || hasConnectedOnceRef.current;
        retryCountRef.current = 0;
        hasConnectedOnceRef.current = true;

        if (wasReconnecting && onReconnectRef.current) {
          onReconnectRef.current();
        }
      };

      // Listen to registered event types
      for (const eventName of events) {
        es.addEventListener(eventName, (e: MessageEvent) => {
          try {
            const parsedData = JSON.parse(e.data);
            if (onMessageRef.current) {
              onMessageRef.current({
                type: eventName,
                data: parsedData,
                id: e.lastEventId,
              });
            }
          } catch {
            if (onMessageRef.current) {
              onMessageRef.current({
                type: eventName,
                data: e.data,
                id: e.lastEventId,
              });
            }
          }
        });
      }

      es.onerror = () => {
        setStatus('disconnected');
        es.close();
        esRef.current = null;

        // Exponential backoff with jitter (max 16 seconds)
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 16000) + Math.random() * 500;
        retryCountRef.current += 1;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      console.warn('Failed to initialize EventSource:', err);
      setStatus('disconnected');
    }
  }, [endpoint, enabled, JSON.stringify(events)]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);

  return { status };
}
