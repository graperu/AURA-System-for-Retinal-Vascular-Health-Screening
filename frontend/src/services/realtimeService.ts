/**
 * AURA Real-time Synchronization Service
 * Coordinates Server-Sent Events (SSE), WebSocket STOMP, and Client-side Event Buses
 * for instant UI reactivity across Patient, Doctor, Clinic, and Admin portals.
 */

export type RealtimeEventType =
  | 'screening:new'
  | 'screening:reviewed'
  | 'screening:deleted'
  | 'screening:update'
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
  timestamp: number;
  source?: 'sse' | 'websocket' | 'client';
}

type EventCallback = (event: RealtimeEvent) => void;

class RealtimeEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('aura:realtime_event', ((e: CustomEvent<RealtimeEvent>) => {
        if (e.detail) {
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

  public emit<T = any>(type: RealtimeEventType | string, data?: T, source: 'sse' | 'websocket' | 'client' = 'client'): void {
    const event: RealtimeEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      source,
    };

    this.notifyListeners(event);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('aura:realtime_event', {
          detail: event,
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

    this.emit('notification:new', payload, source);

    const typeStr = (payload.type || payload.eventType || '').toUpperCase();

    if (typeStr.includes('AI_') || typeStr.includes('SCREENING_') || typeStr === 'AI_READY' || typeStr === 'AI_ANALYSIS_COMPLETED') {
      this.emit('screening:new', payload, source);
      this.emit('screening:update', payload, source);
    }

    if (typeStr.includes('DOCTOR_REVIEW') || typeStr.includes('VALIDATION')) {
      this.emit('screening:reviewed', payload, source);
      this.emit('screening:update', payload, source);
    }

    if (typeStr.includes('PAYMENT') || typeStr.includes('CREDIT') || typeStr.includes('SUBSCRIPTION')) {
      this.emit('billing:update', payload, source);
      this.emit('credit:change', payload, source);
    }

    if (typeStr.includes('PROFILE') || typeStr.includes('PATIENT_UPDATE')) {
      this.emit('profile:update', payload, source);
    }

    if (typeStr.includes('ASSIGN') || typeStr.includes('DOCTOR_ASSIGNMENT')) {
      this.emit('doctor:assignment', payload, source);
      this.emit('screening:update', payload, source);
    }

    if (typeStr.includes('BATCH')) {
      this.emit('batch:update', payload, source);
    }

    if (typeStr.includes('AUDIT')) {
      this.emit('audit:new', payload, source);
    }
  }
}

export const realtimeBus = new RealtimeEventBus();
