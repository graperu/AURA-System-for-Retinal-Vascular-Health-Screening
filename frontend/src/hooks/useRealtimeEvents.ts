import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '../services/api';
import { realtimeBus, RealtimeEvent } from '../services/realtimeService';

export type RealtimeConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export type KnownRealtimeEventType =
  | 'SCAN_UPLOADED'
  | 'RESULT_REVIEWED'
  | 'BATCH_STATUS_CHANGED'
  | 'NOTIFICATION_NEW';

export interface RealtimeEventPayload<T = any> {
  type: KnownRealtimeEventType | string;
  data?: T;
  timestamp: number;
  id?: string;
  [key: string]: any;
}

export interface RealtimeEventsContextType {
  lastEvent: RealtimeEventPayload | null;
  isConnected: boolean;
  connectionStatus: RealtimeConnectionStatus;
  dispatchEvent: (type: KnownRealtimeEventType | string, data?: any) => void;
  reconnect: () => void;
}

const defaultContextValue: RealtimeEventsContextType = {
  lastEvent: null,
  isConnected: false,
  connectionStatus: 'DISCONNECTED',
  dispatchEvent: () => undefined,
  reconnect: () => undefined,
};

export const RealtimeEventsContext = createContext<RealtimeEventsContextType>(defaultContextValue);

export interface RealtimeEventsProviderProps {
  children: React.ReactNode;
  endpoint?: string;
}

export const RealtimeEventsProvider: React.FC<RealtimeEventsProviderProps> = ({
  children,
  endpoint = '/api/events/stream',
}) => {
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('DISCONNECTED');

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const isManuallyClosedRef = useRef(false);

  const isConnected = connectionStatus === 'CONNECTED';

  const handleIncomingData = useCallback((rawPayload: any, defaultType: string = 'NOTIFICATION_NEW') => {
    try {
      const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      const resolvedType = parsed?.eventType || parsed?.type || defaultType;
      const resolvedData = parsed?.data !== undefined ? parsed.data : parsed;

      const eventPayload: RealtimeEventPayload = {
        type: resolvedType,
        data: resolvedData,
        timestamp: parsed?.timestamp || Date.now(),
        id: parsed?.id || parsed?.eventId,
      };

      setLastEvent(eventPayload);

      // Route into global realtime bus for system-wide zero-F5 UI sync
      realtimeBus.handleIncomingPayload(parsed, 'sse');
    } catch (err) {
      console.warn('Error parsing incoming SSE realtime data:', err);
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {
        // ignore
      }
      eventSourceRef.current = null;
    }

    isManuallyClosedRef.current = false;
    setConnectionStatus(retryCountRef.current > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      const token = getAccessToken();
      const delimiter = endpoint.includes('?') ? '&' : '?';
      const urlWithToken = token ? `${endpoint}${delimiter}token=${encodeURIComponent(token)}` : endpoint;

      const es = new EventSource(urlWithToken, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0;
        setConnectionStatus('CONNECTED');
      };

      // Generic message handler
      es.onmessage = (e) => {
        handleIncomingData(e.data, 'NOTIFICATION_NEW');
      };

      // Standard required event types
      const standardEvents: KnownRealtimeEventType[] = [
        'SCAN_UPLOADED',
        'RESULT_REVIEWED',
        'BATCH_STATUS_CHANGED',
        'NOTIFICATION_NEW',
      ];

      standardEvents.forEach((evtType) => {
        es.addEventListener(evtType, (e: any) => {
          handleIncomingData(e.data, evtType);
        });
      });

      // Additional legacy/case variants
      const additionalEvents = [
        'SCREENING_CREATED',
        'SCREENING_COMPLETED',
        'DOCTOR_REVIEWED',
        'BATCH_PROGRESS',
        'NOTIFICATION_CREATED',
      ];
      additionalEvents.forEach((evtType) => {
        es.addEventListener(evtType, (e: any) => {
          handleIncomingData(e.data, evtType);
        });
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        if (isManuallyClosedRef.current) {
          setConnectionStatus('DISCONNECTED');
          return;
        }

        if (retryCountRef.current < maxRetries) {
          setConnectionStatus('RECONNECTING');
          const delay = Math.min(30000, 1000 * Math.pow(1.5, retryCountRef.current));
          retryCountRef.current += 1;

          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionStatus('DISCONNECTED');
        }
      };
    } catch (err) {
      console.warn('Failed to establish EventSource connection:', err);
      setConnectionStatus('DISCONNECTED');
    }
  }, [endpoint, handleIncomingData]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    // Listen to realtimeBus for cross-topic STOMP/Client events as well
    const unsubBus = realtimeBus.subscribe('all', (busEvent: RealtimeEvent) => {
      // Map bus event to lastEvent if not already from sse
      if (busEvent.source !== 'sse') {
        const payload: RealtimeEventPayload = {
          type: busEvent.type,
          data: busEvent.data,
          timestamp: busEvent.timestamp,
        };
        setLastEvent(payload);
      }
    });

    return () => {
      isManuallyClosedRef.current = true;
      clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {
          // ignore
        }
        eventSourceRef.current = null;
      }
      unsubBus();
    };
  }, [connect]);

  const dispatchEvent = useCallback(
    (type: KnownRealtimeEventType | string, data?: any) => {
      const payload: RealtimeEventPayload = {
        type,
        data,
        timestamp: Date.now(),
      };
      setLastEvent(payload);
      realtimeBus.emit(type, data, 'client');
    },
    []
  );

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    clearTimeout(reconnectTimeoutRef.current);
    connect();
  }, [connect]);

  const contextValue: RealtimeEventsContextType = {
    lastEvent,
    isConnected,
    connectionStatus,
    dispatchEvent,
    reconnect,
  };

  return React.createElement(
    RealtimeEventsContext.Provider,
    { value: contextValue },
    children
  );
};

export const useRealtimeEvents = (): RealtimeEventsContextType => {
  const context = useContext(RealtimeEventsContext);
  return context || defaultContextValue;
};

export default useRealtimeEvents;
