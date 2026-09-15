import { useEffect, useRef, useCallback } from 'react';
import { realtimeBus, RealtimeEventType, RealtimeEvent } from '../services/realtimeService';

export interface RealtimeSyncOptions {
  /** Optional background polling interval in milliseconds (e.g. 15000). Set to 0 or null to disable. */
  pollIntervalMs?: number | null;
  /** Whether to sync when window/tab regains focus. Defaults to true. */
  syncOnFocus?: boolean;
  /** Whether this sync hook is currently enabled. Defaults to true. */
  enabled?: boolean;
}

/**
 * React hook to synchronize data in real-time across components and portals
 * without ever requiring a manual page refresh (F5).
 */
export function useRealtimeSync(
  topics: (RealtimeEventType | string)[] | RealtimeEventType | string,
  onSync: (event?: RealtimeEvent) => void | Promise<void>,
  options: RealtimeSyncOptions = {}
) {
  const { pollIntervalMs = 15000, syncOnFocus = true, enabled = true } = options;

  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const isSyncingRef = useRef(false);

  const triggerSync = useCallback(
    async (event?: RealtimeEvent) => {
      if (!enabled || isSyncingRef.current) return;
      try {
        isSyncingRef.current = true;
        await onSyncRef.current(event);
      } catch (err) {
        console.warn('Error during realtime synchronization:', err);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    // 1. Subscribe to realtime event bus
    const unsubscribe = realtimeBus.subscribe(topics, (event) => {
      triggerSync(event);
    });

    // 2. Tab focus listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && syncOnFocus) {
        triggerSync();
      }
    };

    const handleWindowFocus = () => {
      if (syncOnFocus) {
        triggerSync();
      }
    };

    if (typeof window !== 'undefined' && syncOnFocus) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);
    }

    // 3. Periodic quiet background sync timer (only when active tab)
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    if (pollIntervalMs && pollIntervalMs > 0) {
      pollTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          triggerSync();
        }
      }, pollIntervalMs);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined' && syncOnFocus) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
      }
      if (pollTimer !== null) {
        clearInterval(pollTimer);
      }
    };
  }, [topics, triggerSync, pollIntervalMs, syncOnFocus, enabled]);
}
