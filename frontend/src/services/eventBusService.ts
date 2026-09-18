/**
 * AURA Event Bus Service
 * Central event dispatching system for backend and frontend data synchronization.
 * Follows the Singleton and Pub/Sub (EventEmitter) patterns.
 */

import { realtimeBus, type RealtimeEvent } from './realtimeService';

export type EventBusEventType =
  | 'SCAN_UPLOADED'
  | 'RESULT_REVIEWED'
  | 'BATCH_STATUS_CHANGED'
  | 'NOTIFICATION_NEW'
  | 'USER_STATUS_CHANGED'
  | 'DOCTOR_ASSIGNED';

export interface ScanUploadedPayload {
  scanId: string;
  patientId?: string;
  patientName?: string;
  imageUrl?: string;
  uploadedAt?: number | string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface ResultReviewedPayload {
  screeningId: string;
  doctorId: string;
  doctorName?: string;
  status?: string;
  notes?: string;
  reviewedAt?: number | string;
  agreesWithAi?: boolean;
  [key: string]: any;
}

export interface BatchStatusChangedPayload {
  batchId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  processedCount?: number;
  totalCount?: number;
  progress?: number;
  updatedAt?: number | string;
  [key: string]: any;
}

export interface NotificationNewPayload {
  id?: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  read?: boolean;
  createdAt?: number | string;
  data?: any;
  [key: string]: any;
}

export interface UserStatusChangedPayload {
  userId: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'AWAY' | string;
  lastActive?: number | string;
  role?: string;
  [key: string]: any;
}

export interface DoctorAssignedPayload {
  screeningId?: string;
  patientId?: string;
  doctorId: string;
  doctorName?: string;
  assignedAt?: number | string;
  clinicId?: string;
  [key: string]: any;
}

export interface EventBusPayloadMap {
  SCAN_UPLOADED: ScanUploadedPayload;
  RESULT_REVIEWED: ResultReviewedPayload;
  BATCH_STATUS_CHANGED: BatchStatusChangedPayload;
  NOTIFICATION_NEW: NotificationNewPayload;
  USER_STATUS_CHANGED: UserStatusChangedPayload;
  DOCTOR_ASSIGNED: DoctorAssignedPayload;
}

export type EventBusCallback<T = any> = (payload: T) => void;

export class EventBusService {
  private static instance: EventBusService | null = null;
  private subscribers: Map<string, Set<EventBusCallback<any>>> = new Map();
  private isListeningToRealtime = false;

  private constructor() {
    this.initRealtimeIntegration();
  }

  /**
   * Singleton instance accessor
   */
  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  /**
   * Subscribe to a specific event type. Returns an unsubscribe function.
   */
  public subscribe<K extends EventBusEventType>(
    eventType: K,
    callback: (payload: EventBusPayloadMap[K]) => void
  ): () => void;
  public subscribe(
    eventType: string,
    callback: (payload: any) => void
  ): () => void;
  public subscribe(
    eventType: string,
    callback: (payload: any) => void
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);

    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  /**
   * Unsubscribe a previously registered callback from an event type.
   */
  public unsubscribe<K extends EventBusEventType>(
    eventType: K,
    callback: (payload: EventBusPayloadMap[K]) => void
  ): void;
  public unsubscribe(
    eventType: string,
    callback: (payload: any) => void
  ): void;
  public unsubscribe(
    eventType: string,
    callback: (payload: any) => void
  ): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
  }

  /**
   * Publish an event with payload to all registered subscribers.
   */
  public publish<K extends EventBusEventType>(
    eventType: K,
    payload: EventBusPayloadMap[K]
  ): void;
  public publish(
    eventType: string,
    payload: any
  ): void;
  public publish(
    eventType: string,
    payload: any
  ): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers && handlers.size > 0) {
      handlers.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.warn(`[EventBus] Error in subscriber for event "${eventType}":`, error);
        }
      });
    }

    // Support wildcard subscribers listening to all events ('*')
    const wildcardHandlers = this.subscribers.get('*');
    if (wildcardHandlers && wildcardHandlers.size > 0) {
      wildcardHandlers.forEach((callback) => {
        try {
          callback({ eventType, payload });
        } catch (error) {
          console.warn('[EventBus] Error in wildcard subscriber:', error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket message directly or from realtimeBus
   */
  public handleIncomingMessage(payload: any, source: 'websocket' | 'sse' | 'client' = 'websocket'): void {
    if (!payload) return;

    const rawType = (payload.eventType || payload.type || '').trim();
    const typeUpper = rawType.toUpperCase();
    const data = payload.data !== undefined ? payload.data : payload;

    // 1. Direct standard event matching
    if (typeUpper === 'SCAN_UPLOADED') {
      this.publish('SCAN_UPLOADED', {
        scanId: data.scanId || data.id || data.screeningId || '',
        patientId: data.patientId,
        patientName: data.patientName,
        imageUrl: data.imageUrl,
        uploadedAt: data.uploadedAt || Date.now(),
        ...data,
      });
    } else if (typeUpper === 'RESULT_REVIEWED') {
      this.publish('RESULT_REVIEWED', {
        screeningId: data.screeningId || data.id || '',
        doctorId: data.doctorId || '',
        doctorName: data.doctorName,
        status: data.status || 'REVIEWED',
        notes: data.notes,
        reviewedAt: data.reviewedAt || Date.now(),
        agreesWithAi: data.agreesWithAi,
        ...data,
      });
    } else if (typeUpper === 'BATCH_STATUS_CHANGED') {
      this.publish('BATCH_STATUS_CHANGED', {
        batchId: data.batchId || data.id || '',
        status: data.status || 'PROCESSING',
        processedCount: data.processedCount,
        totalCount: data.totalCount,
        progress: data.progress,
        updatedAt: data.updatedAt || Date.now(),
        ...data,
      });
    } else if (typeUpper === 'NOTIFICATION_NEW') {
      this.publish('NOTIFICATION_NEW', {
        id: data.id,
        title: data.title,
        message: data.message || data.title || 'Thông báo mới',
        type: data.type || 'info',
        read: data.read ?? false,
        createdAt: data.createdAt || Date.now(),
        data: data.data || data,
      });
    } else if (typeUpper === 'USER_STATUS_CHANGED') {
      this.publish('USER_STATUS_CHANGED', {
        userId: data.userId || data.id || '',
        status: data.status || 'ONLINE',
        lastActive: data.lastActive || Date.now(),
        role: data.role,
        ...data,
      });
    } else if (typeUpper === 'DOCTOR_ASSIGNED') {
      this.publish('DOCTOR_ASSIGNED', {
        screeningId: data.screeningId,
        patientId: data.patientId,
        doctorId: data.doctorId || '',
        doctorName: data.doctorName,
        assignedAt: data.assignedAt || Date.now(),
        clinicId: data.clinicId,
        ...data,
      });
    }

    // 2. Integration mapping from legacy/standard realtimeService types
    else if (typeUpper === 'SCREENING_CREATED' || typeUpper === 'SCREENING:NEW') {
      this.publish('SCAN_UPLOADED', {
        scanId: data.id || data.scanId || '',
        patientId: data.patientId,
        patientName: data.patientName,
        imageUrl: data.imageUrl,
        uploadedAt: data.createdAt || Date.now(),
        ...data,
      });
    } else if (
      typeUpper === 'DOCTOR_REVIEWED' ||
      typeUpper === 'DOCTOR_OVERRIDE' ||
      typeUpper === 'SCREENING:REVIEWED'
    ) {
      this.publish('RESULT_REVIEWED', {
        screeningId: data.screeningId || data.id || '',
        doctorId: data.doctorId || '',
        doctorName: data.doctorName,
        status: data.status || 'REVIEWED',
        notes: data.doctorNotes || data.notes,
        reviewedAt: data.reviewedAt || Date.now(),
        agreesWithAi: data.agreesWithAi,
        ...data,
      });
    } else if (typeUpper === 'BATCH_PROGRESS' || typeUpper === 'BATCH:UPDATE') {
      this.publish('BATCH_STATUS_CHANGED', {
        batchId: data.batchId || data.id || '',
        status: data.status || 'PROCESSING',
        processedCount: data.processedCount,
        totalCount: data.totalCount,
        progress: data.progress,
        updatedAt: Date.now(),
        ...data,
      });
    } else if (typeUpper === 'NOTIFICATION_CREATED' || typeUpper === 'NOTIFICATION:NEW') {
      this.publish('NOTIFICATION_NEW', {
        id: data.id,
        title: data.title,
        message: data.message || data.title || '',
        type: data.type || 'info',
        read: false,
        createdAt: data.createdAt || Date.now(),
        data: data.data || data,
      });
    } else if (typeUpper === 'PROFILE:UPDATE') {
      this.publish('USER_STATUS_CHANGED', {
        userId: data.id || data.userId || '',
        status: data.status || 'ONLINE',
        lastActive: Date.now(),
        role: data.role,
        ...data,
      });
    } else if (typeUpper === 'DOCTOR:ASSIGNMENT' || typeUpper === 'DOCTOR_ASSIGNMENT') {
      this.publish('DOCTOR_ASSIGNED', {
        screeningId: data.screeningId,
        patientId: data.patientId || data.deletedId,
        doctorId: data.doctorId || '',
        doctorName: data.doctorName,
        assignedAt: Date.now(),
        clinicId: data.clinicId,
        ...data,
      });
    }
  }

  /**
   * Listen to global realtimeBus for seamless zero-F5 backend synchronization
   */
  private initRealtimeIntegration(): void {
    if (this.isListeningToRealtime) return;
    this.isListeningToRealtime = true;

    try {
      realtimeBus.subscribe('all', (event: RealtimeEvent) => {
        if (!event) return;
        this.handleIncomingMessage(
          {
            eventType: event.type,
            data: event.data,
          },
          (event.source as 'websocket' | 'sse' | 'client') || 'websocket'
        );
      });
    } catch (err) {
      console.warn('[EventBus] Failed to attach realtimeBus subscriber:', err);
    }
  }
}

export const eventBus = EventBusService.getInstance();
export const eventBusService = eventBus;
export default eventBus;
