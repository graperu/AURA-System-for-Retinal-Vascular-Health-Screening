Bạn là frontend test agent cho dự án AURA Retinal Screening. Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening

Nhiệm vụ: Viết bộ Test Suite kiểm thử tích hợp Cross-Portal Real-time Synchronization.

## Bước 1: Tạo file test mới
Tạo file: `frontend/src/tests/cross-portal-realtime-sync.test.ts`

## Bước 2: Viết các test cases theo yêu cầu Acceptance Criteria:
1. **TEST-SYNC-1**: Mô phỏng sự kiện `SCAN_UPLOADED` -> Kiểm tra subscriber của Bác sĩ nhận được thông tin ca khám mới với đầy đủ mã MRN và ảnh mắt.
2. **TEST-SYNC-2**: Mô phỏng sự kiện `RESULT_REVIEWED` -> Kiểm tra subscriber của Bệnh nhân nhận được thông báo trạng thái "Đã duyệt" từ bác sĩ.
3. **TEST-SYNC-3**: Mô phỏng sự kiện `BATCH_STATUS_CHANGED` -> Kiểm tra Admin/Clinic nhận được thông báo tiến độ batch.
4. **TEST-SYNC-4**: Kiểm thử EventBus hoặc DataSyncContext cập nhật số lượng `unreadCount` trong Notification Context khi có event mới.
5. **TEST-SYNC-5**: Kiểm thử tính chịu lỗi và auto-reconnection của Realtime Event Client khi kết nối bị ngắt quãng.

## Bước 3: Chạy test
Chạy trong thư mục frontend/:
  npm test
Đảm bảo test suite mới này cùng 11 test suites trước đó đều đạt 100% PASS.
