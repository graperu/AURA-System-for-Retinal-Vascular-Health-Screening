import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { eventBus, type EventBusEventType } from '../services/eventBusService';
import { stompClient } from '../services/websocketService';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'disconnected';

export interface DataSyncContextType {
  syncStatus: SyncStatus;
  lastSyncTimestamp: number | null;
  pendingChanges: number;
  syncError: string | null;
  indicatorColor: 'green' | 'yellow' | 'red';
  indicatorLabel: string;
  triggerSync: (syncFn?: () => Promise<void>) => Promise<void>;
  incrementPending: () => void;
  decrementPending: () => void;
  clearPending: () => void;
  setSyncStatus: (status: SyncStatus) => void;
}

const ALL_EVENT_BUS_TYPES: EventBusEventType[] = [
  'SCAN_UPLOADED',
  'RESULT_REVIEWED',
  'BATCH_STATUS_CHANGED',
  'NOTIFICATION_NEW',
  'USER_STATUS_CHANGED',
  'DOCTOR_ASSIGNED',
];

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

export interface SyncIndicatorProps {
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Sync Indicator component
 * Green dot = synced, Yellow dot = syncing, Red dot = disconnected / error
 */
export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  showLabel = false,
  className = '',
  onClick,
}) => {
  const { syncStatus, indicatorColor, indicatorLabel, triggerSync, pendingChanges } = useDataSync();

  const dotColorClass = useMemo(() => {
    switch (indicatorColor) {
      case 'green':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'yellow':
        return 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]';
      case 'red':
      default:
        return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
    }
  }, [indicatorColor]);

  const statusTitle = `${indicatorLabel}${pendingChanges > 0 ? ` (${pendingChanges} thay đổi chờ gửi)` : ''}`;

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs select-none cursor-pointer ${className}`}
      title={statusTitle}
      onClick={onClick || (() => void triggerSync())}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        {syncStatus === 'syncing' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-300 ${dotColorClass}`}
        />
      </span>

      {showLabel && (
        <span className="text-slate-600 font-medium text-[11px]">
          {indicatorLabel}
          {pendingChanges > 0 && (
            <span className="ml-1 text-amber-600 font-bold">({pendingChanges})</span>
          )}
        </span>
      )}
    </div>
  );
};

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatusState] = useState<SyncStatus>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'disconnected';
    }
    return 'synced';
  });
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(() => Date.now());
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSyncStatus = useCallback((status: SyncStatus) => {
    if (syncingTimerRef.current) {
      clearTimeout(syncingTimerRef.current);
      syncingTimerRef.current = null;
    }
    setSyncStatusState(status);
  }, []);

  // Update sync status upon receiving events from EventBus
  const handleEventBusArrival = useCallback(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatusState('disconnected');
      return;
    }

    setSyncStatusState('syncing');
    setLastSyncTimestamp(Date.now());
    setPendingChanges((prev) => Math.max(0, prev - 1));
    setSyncError(null);

    if (syncingTimerRef.current) {
      clearTimeout(syncingTimerRef.current);
    }

    // Return to 'synced' after brief syncing transition feedback
    syncingTimerRef.current = setTimeout(() => {
      setSyncStatusState('synced');
    }, 450);
  }, []);

  useEffect(() => {
    // 1. Subscribe to all EventBus standard event types
    const unsubs = ALL_EVENT_BUS_TYPES.map((eventType) =>
      eventBus.subscribe(eventType, () => {
        handleEventBusArrival();
      })
    );

    // Also wildcard handler
    const unsubWildcard = eventBus.subscribe('*', () => {
      handleEventBusArrival();
    });

    // 2. Listen to browser network changes
    const handleOnline = () => {
      setSyncStatusState('syncing');
      setSyncError(null);
      setTimeout(() => {
        setLastSyncTimestamp(Date.now());
        setSyncStatusState('synced');
      }, 500);
    };

    const handleOffline = () => {
      setSyncStatusState('disconnected');
      setSyncError('Mất kết nối mạng internet');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // 3. Periodic check for connection health
    const intervalTimer = setInterval(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatusState('disconnected');
      } else if (syncStatus === 'disconnected' && navigator.onLine) {
        setSyncStatusState('synced');
      }
    }, 10000);

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubWildcard();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      clearInterval(intervalTimer);
      if (syncingTimerRef.current) {
        clearTimeout(syncingTimerRef.current);
      }
    };
  }, [handleEventBusArrival, syncStatus]);

  const triggerSync = useCallback(async (syncFn?: () => Promise<void>) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatusState('disconnected');
      setSyncError('Không thể đồng bộ khi ngoại tuyến');
      return;
    }

    setSyncStatusState('syncing');
    setSyncError(null);

    try {
      if (syncFn) {
        await syncFn();
      } else {
        // Re-check or reconnect STOMP if needed
        if (!stompClient.isConnectionActive()) {
          stompClient.connect();
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setLastSyncTimestamp(Date.now());
      setSyncStatusState('synced');
    } catch (err: any) {
      setSyncStatusState('error');
      setSyncError(err?.message || 'Đồng bộ dữ liệu thất bại');
    }
  }, []);

  const incrementPending = useCallback(() => {
    setPendingChanges((prev) => prev + 1);
  }, []);

  const decrementPending = useCallback(() => {
    setPendingChanges((prev) => Math.max(0, prev - 1));
  }, []);

  const clearPending = useCallback(() => {
    setPendingChanges(0);
  }, []);

  // Compute indicator color (green = synced, yellow = syncing, red = disconnected/error)
  const indicatorColor: 'green' | 'yellow' | 'red' = useMemo(() => {
    switch (syncStatus) {
      case 'synced':
        return 'green';
      case 'syncing':
        return 'yellow';
      case 'disconnected':
      case 'error':
      default:
        return 'red';
    }
  }, [syncStatus]);

  const indicatorLabel = useMemo(() => {
    switch (syncStatus) {
      case 'synced':
        return 'Dữ liệu đã đồng bộ';
      case 'syncing':
        return 'Đang đồng bộ...';
      case 'disconnected':
        return 'Mất kết nối (Ngoại tuyến)';
      case 'error':
        return syncError || 'Lỗi đồng bộ';
      default:
        return 'Trạng thái đồng bộ';
    }
  }, [syncStatus, syncError]);

  const value: DataSyncContextType = useMemo(
    () => ({
      syncStatus,
      lastSyncTimestamp,
      pendingChanges,
      syncError,
      indicatorColor,
      indicatorLabel,
      triggerSync,
      incrementPending,
      decrementPending,
      clearPending,
      setSyncStatus,
    }),
    [
      syncStatus,
      lastSyncTimestamp,
      pendingChanges,
      syncError,
      indicatorColor,
      indicatorLabel,
      triggerSync,
      incrementPending,
      decrementPending,
      clearPending,
      setSyncStatus,
    ]
  );

  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>;
};

const defaultContextValue: DataSyncContextType = {
  syncStatus: 'synced',
  lastSyncTimestamp: null,
  pendingChanges: 0,
  syncError: null,
  indicatorColor: 'green',
  indicatorLabel: 'Dữ liệu đã đồng bộ',
  triggerSync: async () => {},
  incrementPending: () => {},
  decrementPending: () => {},
  clearPending: () => {},
  setSyncStatus: () => {},
};

export const useDataSync = (): DataSyncContextType => {
  const context = useContext(DataSyncContext);
  return context || defaultContextValue;
};

export default DataSyncContext;
