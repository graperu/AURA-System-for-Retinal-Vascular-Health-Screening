# ADR-007: KIẾN TRÚC THANH TOÁN BẤT ĐỒNG BỘ HAI CHẶNG, XÁC THỰC CHỮ KÝ SỐ HMAC VÀ XÓA BỎ LỖ HỔNG TỰ KÍCH HOẠT GÓI DỊCH VỤ

## 1. Trạng Thái
Đã Chấp Thuận (Approved) - Ngày: 14/09/2026

## 2. Ngữ Cảnh (Context)
1. **Lỗ hổng thực tế**: Người dùng khi mở Modal nạp gói khám và chọn quét mã QR có thể nhấn nút *"Xác Nhận Đã Chuyển Khoản (Kích Hoạt Gói)"* để tự động nhận thêm credits mà không cần chuyển tiền thực tế qua ứng dụng ngân hàng.
2. **Nguyên nhân kiến trúc**:
   - `BillingService.purchaseOrRenew` xử lý đồng bộ: Ngay khi `AuraPaymentGatewayProvider.charge()` tạo URL hoặc mã QR thành công, hệ thống coi là giao dịch đã thanh toán thành công (`PaymentStatus.SUCCEEDED`) và gọi hàm cộng lượt khám `grantOrExtendCredits()`.
   - Hệ thống hoàn toàn thiếu cơ chế Webhook / IPN để nhận thông báo xác thực từ ngân hàng/cổng thanh toán.
   - Frontend hiển thị nút cho phép người dùng tự khẳng định đã chuyển khoản và trực tiếp gọi API cộng gói.

## 3. Quyết Định Kiến Trúc (Architecture Decisions)
1. **Chuyển đổi sang Chu trình Thanh toán Bất đồng bộ Hai chặng (Asynchronous Two-Legged Flow)**:
   - **Chặng 1 (Khởi tạo)**: API `/api/v1/me/packages/{id}/checkout` chỉ khởi tạo bản ghi giao dịch ở trạng thái `PENDING`, sinh `providerReference` và `transferContent` duy nhất, trả về QR code và URL thanh toán. **Tuyệt đối KHÔNG cộng credit tại chặng này**.
   - **Chặng 2 (Xác nhận qua Webhook/IPN)**: Chỉ khi nhận được Webhook IPN từ cổng thanh toán (VNPay, MoMo, VietQR) kèm chữ ký số HMAC hợp lệ và số tiền khớp 100%, Backend mới chuyển trạng thái sang `SUCCEEDED` và gọi `grantOrExtendCredits()`.
2. **Xóa bỏ hoàn toàn nút Tự Kích Hoạt trên Frontend**:
   - Loại bỏ nút *"Xác Nhận Đã Chuyển Khoản (Kích Hoạt Gói)"* trên `CreditPurchaseModal.tsx`.
   - Thay thế bằng trạng thái Chờ Ngân Hàng tự động (Radar/Spinner), đếm ngược 15 phút và cơ chế Polling 3 giây gọi `GET /api/v1/me/payments/{id}/status`.
3. **Thẩm định Chữ ký số HMAC và Phòng vệ Idempotency (Fail-Closed Zero-Trust)**:
   - Tất cả Webhook phải được xác thực bằng HMAC-SHA512 (VNPay) hoặc HMAC-SHA256 (MoMo/Bank) với khóa bí mật lưu trong môi trường an toàn. Sai chữ ký từ chối ngay lập tức.
   - Kiểm tra Idempotency: Giao dịch đã `SUCCEEDED` không được phép cộng credit lần thứ hai.
4. **Bảo vệ IDOR cho Endpoint Polling**:
   - Endpoint tra cứu trạng thái kiểm tra nghiêm ngặt `buyer.id == principal.id`. Không cho phép bất kỳ ai xem trạng thái giao dịch của người khác.
5. **Cơ chế Fail-Closed khi thiếu cấu hình**:
   - Nếu hệ thống thiếu Secret Key của cổng thanh toán, từ chối tạo giao dịch với HTTP 503 SERVICE_UNAVAILABLE thay vì chạy giả lập bỏ qua kiểm tra.

## 4. Hệ Quả & Đánh Giá Tác Động (Consequences)
- **Tích cực**:
  - Khắc phục triệt để và vĩnh viễn lỗ hổng nhận credit miễn phí.
  - Bảo đảm an toàn tài chính 100% cho hệ thống AURA và các cơ sở y tế đối tác.
  - Chuẩn hóa kiến trúc thanh toán theo chuẩn công nghiệp (PCI-DSS, VNPay, MoMo, VietQR Napas).
  - Ngăn ngừa tấn công IDOR và giả mạo gói tin Webhook.
- **Ràng buộc triển khai**:
  - Backend cần áp dụng Flyway migration `V033` để bổ sung các trường siêu dữ liệu (`transfer_content`, `qr_code_url`, `gateway_transaction_no`, `expires_at`).
  - Frontend phải loại bỏ nút cũ và cập nhật bộ test suite tương ứng.
