Bạn là worker agent cho dự án AURA Retinal Screening. Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening

Nhiệm vụ: Tạo Event Bus Service cho backend và frontend data sync.

## Bước 1: Đọc cấu trúc hiện tại

Đọc các file sau:
- frontend/src/services/realtimeService.ts
- frontend/src/services/websocketService.ts
- frontend/src/context/AuthContext.tsx

## Bước 2: Tạo EventBus Service

Tạo file mới: frontend/src/services/eventBusService.ts

Service này là trung tâm dispatch events trong frontend:
- Dùng pattern EventEmitter hoặc pub/sub
- Các event types: SCAN_UPLOADED, RESULT_REVIEWED, BATCH_STATUS_CHANGED, NOTIFICATION_NEW, USER_STATUS_CHANGED, DOCTOR_ASSIGNED
- Mỗi event type có TypeScript interface rõ ràng cho payload
- Methods: subscribe(eventType, callback), unsubscribe(eventType, callback), publish(eventType, payload)
- Singleton pattern - chỉ có 1 instance toàn app
- Tích hợp với realtimeService.ts đã có sẵn - khi nhận message từ WebSocket thì publish lên EventBus

## Bước 3: Tạo useEventBus Hook

Tạo file mới: frontend/src/hooks/useEventBus.ts

React hook wrapper cho EventBus:
- useEventBus(eventType) - subscribe và auto-unsubscribe khi component unmount
- Trả về { lastEvent, subscribe, publish }
- Dùng useEffect cho cleanup

## Bước 4: Tạo Data Sync Context

Tạo file mới: frontend/src/context/DataSyncContext.tsx

Context quản lý data synchronization state:
- Tracks: lastSyncTimestamp, syncStatus (synced/syncing/error), pendingChanges count
- Khi nhận event từ EventBus, cập nhật sync status
- Hiển thị sync indicator (dot xanh = synced, vàng = syncing, đỏ = disconnected)
- Export: useDataSync() hook và DataSyncProvider component

## Bước 5: Build kiểm tra

Chạy trong thư mục frontend/:
  npm run build

Sửa lỗi TypeScript nếu có cho đến khi build thành công.
