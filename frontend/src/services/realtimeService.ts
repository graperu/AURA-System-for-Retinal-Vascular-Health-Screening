/**
 * AURA Real-time Synchronization Service
 * Coordinates Server-Sent Events (SSE), WebSocket STOMP, and Client-side Event Buses
 * for instant UI reactivity across Patient, Doctor, Clinic, and Admin portals.
 */

export type StandardRealtimeEventType =
  | 'SCREENING_CREATED'
  | 'SCREENING_PROCESSING'
  | 'SCREENING_COMPLETED'
  | 'SCREENING_FAILED'
  | 'DOCTOR_REVIEWED'
  | 'DOCTOR_OVERRIDE'
  | 'RETAKE_REQUIRED'
  | 'MESSAGE_RECEIVED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_UNREAD'
  | 'NOTIFICATION_CLEARED'
  | 'BATCH_PROGRESS'
  | 'SCAN_UPLOADED'
  | 'RESULT_REVIEWED'
  | 'BATCH_STATUS_CHANGED'
  | 'NOTIFICATION_NEW'
  | 'USER_STATUS_CHANGED'
  | 'DOCTOR_ASSIGNED';

export type RealtimeEventType =
  | StandardRealtimeEventType
  | 'screening:new'
  | 'screening:created'
  | 'screening:completed'
  | 'screening:reviewed'
  | 'screening:deleted'
  | 'screening:update'
  | 'doctor:reviewed'
  | 'batch:created'
  | 'batch:submitted'
  | 'user:role_changed'
  | 'profile:update'
  | 'billing:update'
  | 'credit:change'
  | 'doctor:assignment'
  | 'batch:update'
  | 'audit:new'
  | 'chat:message'
  | 'notification:new'
  | 'all';

export interface RealtimeEvent<T = any> {
  type: RealtimeEventType | string;
  data?: T;
  payload?: T;
  timestamp: number;
  source?: 'sse' | 'websocket' | 'client';
  eventId?: string;
  producer?: string;
  correlationId?: string;
}

export type ClinicalRealtimeEvent<T = any> = RealtimeEvent<T>;

type EventCallback = (event: RealtimeEvent) => void;

class RealtimeEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // 1. Initialize BroadcastChannel bridge for instant cross-tab / cross-window synchronization
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('aura_realtime_bus');
        this.broadcastChannel.onmessage = (e: MessageEvent<RealtimeEvent>) => {
          if (e.data && e.data.type) {
            // Deliver event arriving from another browser tab to local listeners
            this.notifyListeners(e.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization fallback:', err);
        this.broadcastChannel = null;
      }
    }

    // 2. CustomEvent bridge for same-window component communication
    if (typeof window !== 'undefined') {
      window.addEventListener('aura:realtime_event', ((e: CustomEvent<RealtimeEvent>) => {
        if (e.detail && (e.detail as any)._dispatchedByBus !== true) {
          this.notifyListeners(e.detail);
        }
      }) as EventListener);
    }
  }

  public subscribe(eventType: string | string[], callback: EventCallback): () => void {
    const types = Array.isArray(eventType) ? eventType : [eventType];

    types.forEach((t) => {
      if (!this.listeners.has(t)) {
        this.listeners.set(t, new Set());
      }
      this.listeners.get(t)!.add(callback);
    });

    return () => {
      types.forEach((t) => {
        const set = this.listeners.get(t);
        if (set) {
          set.delete(callback);
          if (set.size === 0) {
            this.listeners.delete(t);
          }
        }
      });
    };
  }

  public emit<T = any>(
    type: RealtimeEventType | string,
    data?: T,
    source: 'sse' | 'websocket' | 'client' = 'client'
  ): void {
    const event: RealtimeEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      source,
    };

    this.notifyListeners(event);

    // Multi-tab broadcast via BroadcastChannel across all connected browser tabs immediately
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch {
        // Ignore structured clone issues if non-serializable payload
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('aura:realtime_event', {
          detail: { ...event, _dispatchedByBus: true },
        })
      );
    }
  }

  private notifyListeners(event: RealtimeEvent): void {
    const exactListeners = this.listeners.get(event.type);
    if (exactListeners) {
      exactListeners.forEach((fn) => {
        try {
          fn(event);
        } catch (e) {
          console.warn(`Error in realtime listener for ${event.type}:`, e);
        }
      });
    }

    const allListeners = this.listeners.get('all');
    if (allListeners) {
      allListeners.forEach((fn) => {
        try {
          fn(event);
        } catch (e) {
          console.warn('Error in realtime wildcard listener:', e);
        }
      });
    }
  }

  public handleIncomingPayload(payload: any, source: 'sse' | 'websocket' = 'sse'): void {
    if (!payload) return;

    // Support both envelope format ({ eventType, data, ... }) and flat format ({ type, ... })
    const eventType = (payload.eventType || payload.type || '').trim();
    const eventData = payload.data !== undefined ? payload.data : payload;

    // Always emit the explicit event type if present
    if (eventType) {
      this.emit(eventType, eventData, source);
    }

    const typeUpper = eventType.toUpperCase();

    // Standard 12 Event Routing & Cross-Topic Synchronization
    if (typeUpper === 'SCREENING_CREATED' || typeUpper === 'SCAN_UPLOADED') {
      this.emit('screening:created', eventData, source);
      this.emit('screening:new', eventData, source);
      this.emit('screening:update', eventData, source);
    } else if (typeUpper === 'SCREENING_PROCESSING') {
      this.emit('screening:update', eventData, source);
    } else if (typeUpper === 'SCREENING_COMPLETED') {
      this.emit('screening:completed', eventData, source);
      this.emit('screening:new', eventData, source);
      this.emit('screening:update', eventData, source);
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'SCREENING_FAILED') {
      this.emit('screening:update', eventData, source);
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'DOCTOR_REVIEWED' || typeUpper === 'DOCTOR_OVERRIDE' || typeUpper === 'RESULT_REVIEWED') {
      this.emit('doctor:reviewed', eventData, source);
      this.emit('screening:reviewed', eventData, source);
      this.emit('screening:update', eventData, source);
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'RETAKE_REQUIRED') {
      this.emit('screening:update', eventData, source);
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'MESSAGE_RECEIVED') {
      this.emit('chat:message', eventData, source);
    } else if (typeUpper === 'APPOINTMENT_CREATED' || typeUpper === 'APPOINTMENT_UPDATED') {
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'NOTIFICATION_CREATED') {
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'BATCH_PROGRESS' || typeUpper === 'BATCH_STATUS_CHANGED') {
      this.emit('batch:update', eventData, source);
    } else if (typeUpper === 'BATCH_SUBMITTED' || typeUpper === 'BATCH_CREATED') {
      this.emit('batch:created', eventData, source);
      this.emit('batch:submitted', eventData, source);
      this.emit('batch:update', eventData, source);
      this.emit('audit:new', eventData, source);
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'USER_ROLE_CHANGED' || typeUpper === 'ROLE_CHANGED' || typeUpper === 'USER_STATUS_CHANGED') {
      this.emit('user:role_changed', eventData, source);
      this.emit('profile:update', eventData, source);
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'NOTIFICATION_NEW') {
      this.emit('notification:new', eventData, source);
    } else if (typeUpper === 'DOCTOR_ASSIGNED') {
      this.emit('doctor:assignment', eventData, source);
      this.emit('screening:update', eventData, source);
    }

    // Legacy & Substring Event Routing for Backward Compatibility
    if (
      typeUpper.includes('AI_') ||
      typeUpper.includes('SCREENING_') ||
      typeUpper === 'AI_READY' ||
      typeUpper === 'AI_ANALYSIS_COMPLETED'
    ) {
      if (typeUpper !== 'SCREENING_CREATED' && typeUpper !== 'SCREENING_COMPLETED' && typeUpper !== 'SCREENING_PROCESSING') {
        this.emit('screening:new', payload, source);
        this.emit('screening:update', payload, source);
      }
    }

    if (typeUpper.includes('DOCTOR_REVIEW') || typeUpper.includes('VALIDATION')) {
      if (typeUpper !== 'DOCTOR_REVIEWED' && typeUpper !== 'DOCTOR_OVERRIDE') {
        this.emit('screening:reviewed', payload, source);
        this.emit('screening:update', payload, source);
      }
    }

    if (typeUpper.includes('PAYMENT') || typeUpper.includes('CREDIT') || typeUpper.includes('SUBSCRIPTION')) {
      this.emit('billing:update', payload, source);
      this.emit('credit:change', payload, source);
    }

    if (typeUpper.includes('PROFILE') || typeUpper.includes('PATIENT_UPDATE')) {
      this.emit('profile:update', payload, source);
    }

    if (typeUpper.includes('ASSIGN') || typeUpper.includes('DOCTOR_ASSIGNMENT')) {
      this.emit('doctor:assignment', payload, source);
      this.emit('screening:update', payload, source);
    }

    if (typeUpper.includes('BATCH') && typeUpper !== 'BATCH_PROGRESS') {
      this.emit('batch:update', payload, source);
    }

    if (typeUpper.includes('AUDIT')) {
      this.emit('audit:new', payload, source);
    }

    // Default notification channel emission
    if (typeUpper !== 'SCREENING_PROCESSING' && typeUpper !== 'BATCH_PROGRESS') {
      this.emit('notification:new', payload, source);
    }
  }
}

export const realtimeBus = new RealtimeEventBus();
