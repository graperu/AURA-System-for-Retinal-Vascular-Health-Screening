Bạn là backend worker agent cho dự án AURA Retinal Screening (Spring Boot 3.4). Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening

Nhiệm vụ: Xây dựng Real-Time Event Publisher và SSE Controller cho Backend.

## Bước 1: Khảo sát cấu trúc backend
Đọc các file:
- backend/src/main/java/com/aura/config/WebSocketConfig.java (hoặc tìm kiếm file config WebSocket)
- backend/src/main/java/com/aura/service/ (kiểm tra các service phân tích, upload, screening)

## Bước 2: Tạo Domain Events
Tạo package backend/src/main/java/com/aura/event/ với các class:
1. `CrossPortalEvent.java` (abstract/interface có eventId, eventType, timestamp, portalSource, targetRole, payload)
2. `ScanUploadedEvent.java` (khi bệnh nhân upload ảnh: scanId, patientId, patientName, eye, riskScore)
3. `ClinicalReviewEvent.java` (khi bác sĩ duyệt: reviewId, scanId, doctorName, status, notes)
4. `BatchJobEvent.java` (khi clinic gửi batch: batchId, clinicId, totalScans, status)

## Bước 3: Tạo RealTimeEventPublisher Service
Tạo `RealTimeEventPublisher.java` trong package `com.aura.service`:
- Inject `SimpMessagingTemplate` để gửi tới WebSocket topic:
  - `/topic/portal-sync` (tổng hợp)
  - `/topic/doctor/scans` (cho bác sĩ)
  - `/topic/patient/{patientId}` (cho bệnh nhân cá nhân)
  - `/topic/admin/activity` (cho admin)
- Có method `publish(CrossPortalEvent event)`

## Bước 4: Tạo RealtimeSseController
Tạo `RealtimeSseController.java` trong `com.aura.controller`:
- Endpoint: `GET /api/v1/events/stream`
- Trả về `SseEmitter` hỗ trợ client kết nối nhận stream sự kiện real-time
- Quản lý danh sách emitter active, timeout, completion, gửi ping heartbeat mỗi 25s

## Bước 5: Kiểm tra biên dịch
Chạy trong thư mục backend/:
  mvn test-compile -DskipTests
Đảm bảo 0 lỗi biên dịch Java.
