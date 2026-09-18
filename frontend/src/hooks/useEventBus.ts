import { useEffect, useState, useRef, useCallback } from 'react';
import {
  eventBus,
  type EventBusEventType,
  type EventBusPayloadMap,
  type EventBusCallback,
} from '../services/eventBusService';

export interface UseEventBusResult<T> {
  lastEvent: T | null;
  subscribe: (callback: (payload: T) => void) => () => void;
  publish: (payload: T) => void;
}

/**
 * React hook wrapper for EventBus.
 * Subscribes to the specified event type, updates lastEvent state,
 * and automatically unsubscribes when the component unmounts.
 *
 * @param eventType Event to listen for
 * @param callback Optional immediate callback to trigger on event reception
 * @returns { lastEvent, subscribe, publish }
 */
export function useEventBus<K extends EventBusEventType>(
  eventType: K,
  callback?: (payload: EventBusPayloadMap[K]) => void
): UseEventBusResult<EventBusPayloadMap[K]>;

export function useEventBus<T = any>(
  eventType: string,
  callback?: (payload: T) => void
): UseEventBusResult<T>;

export function useEventBus<T = any>(
  eventType: string,
  callback?: (payload: T) => void
): UseEventBusResult<T> {
  const [lastEvent, setLastEvent] = useState<T | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!eventType) return;

    const handler: EventBusCallback<T> = (payload: T) => {
      setLastEvent(payload);
      if (callbackRef.current) {
        try {
          callbackRef.current(payload);
        } catch (err) {
          console.warn(`[useEventBus] Error in callback for "${eventType}":`, err);
        }
      }
    };

    const unsubscribe = eventBus.subscribe(eventType, handler);

    return () => {
      unsubscribe();
    };
  }, [eventType]);

  const subscribe = useCallback(
    (cb: (payload: T) => void) => {
      return eventBus.subscribe(eventType, cb);
    },
    [eventType]
  );

  const publish = useCallback(
    (payload: T) => {
      eventBus.publish(eventType, payload);
    },
    [eventType]
  );

  return {
    lastEvent,
    subscribe,
    publish,
  };
}

export default useEventBus;
