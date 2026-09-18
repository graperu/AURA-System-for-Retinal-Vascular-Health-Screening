Bạn là worker agent cho dự án AURA Retinal Screening. Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening

Hãy thực hiện các tác vụ sau TUẦN TỰ:

## Tác vụ 1: Tạo Real-Time Event Hook cho Frontend

Tạo file mới: frontend/src/hooks/useRealtimeEvents.ts

Hook này sử dụng EventSource (SSE) hoặc WebSocket để lắng nghe sự kiện real-time từ backend. Cần:
- Kết nối tới endpoint /api/events/stream (SSE) hoặc /ws (WebSocket STOMP)
- Auto-reconnect khi mất kết nối (exponential backoff)
- Dispatch các event types: SCAN_UPLOADED, RESULT_REVIEWED, BATCH_STATUS_CHANGED, NOTIFICATION_NEW
- Export hook useRealtimeEvents() trả về { lastEvent, isConnected, connectionStatus }
- Sử dụng React context pattern để share state across components
- Phải import đúng kiểu TypeScript

Tham khảo cấu trúc project:
- Context pattern: xem frontend/src/context/LanguageContext.tsx
- Auth context: xem frontend/src/context/AuthContext.tsx

## Tác vụ 2: Tạo Notification Context

Tạo file mới: frontend/src/context/NotificationContext.tsx

Context này quản lý notifications cho tất cả portals:
- State: notifications[] (id, type, title, message, timestamp, read, link, portal)
- Actions: addNotification, markAsRead, markAllAsRead, clearNotification
- Tích hợp với useRealtimeEvents hook - khi nhận NOTIFICATION_NEW event thì tự động thêm vào state
- Bilingual support - dùng useLanguage() hook (import từ ../context/LanguageContext)
- Export: useNotifications() hook và NotificationProvider component

## Tác vụ 3: Tạo NotificationBell Component

Tạo file mới: frontend/src/components/ui/NotificationBell.tsx

Component bell icon cho Topbar:
- Hiển thị badge count (số notifications chưa đọc)
- Click mở dropdown với danh sách notifications
- Mỗi notification item có: icon theo type, title, message, timestamp, nút mark as read
- Click notification item navigate tới link tương ứng
- Animation pulse khi có notification mới
- Bilingual (vi/en) dùng useLanguage()
- Style theo MediRoom design system: primary #3478F6, border #EAECF0, bg white

## Tác vụ 4: Tạo Cross-Portal Navigation Service

Tạo file mới: frontend/src/services/navigationService.ts

Service quản lý navigation giữa các portals:
- Functions: navigateToPatient(patientId), navigateToDoctorCase(caseId), navigateToClinicBatch(batchId), navigateToAdminAudit(logId)
- Mỗi function trả về URL path tương ứng
- Export constant PORTAL_ROUTES với tất cả routes cho 4 portals
- TypeScript strict types cho tất cả params

## Tác vụ 5: Chạy npm run build

Chạy trong thư mục frontend/:
  npm run build

Nếu có lỗi TypeScript thì sửa cho đến khi build thành công.

## Tác vụ 6: Chạy npm test

Chạy trong thư mục frontend/:
  npm test

Đảm bảo tất cả test pass. Nếu có test fail thì sửa.
