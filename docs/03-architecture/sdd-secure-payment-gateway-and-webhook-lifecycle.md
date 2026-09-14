# TÀI LIỆU THIẾT KẾ GIẢI PHÁP (SOLUTION DESIGN DOCUMENT - SDD)
## HỆ THỐNG THANH TOÁN BẤT ĐỒNG BỘ, XÁC THỰC CHỮ KÝ SỐ HMAC VÀ XÓA BỎ LỖ HỔNG TỰ KÍCH HOẠT GÓI DỊCH VỤ

- **Mã tài liệu**: SDD-AURA-BILLING-2026-001
- **Dự án**: Hệ thống Sàng lọc Sức khỏe Vi mạch Võng mạc AURA (AURA Retinal Vascular Health Screening)
- **Tác giả**: Kiến Trúc Sư Giải Pháp (Solution Architect - SA)
- **Ngày phê duyệt**: 14/09/2026
- **Trạng thái**: Đã Phê Duyệt Kiến Trúc (Architecturally Approved)
- **Tuân thủ quy chuẩn**: NFR-1 đến NFR-23, HIPAA PHI Security, PCI-DSS Baseline, Coding Standards AURA

---

## 1. TỔNG QUAN VÀ BỐI CẢNH KIẾN TRÚC

### 1.1. Hiện trạng và Phân tích Căn nguyên (Root Cause Analysis - RCA)
Trong phiên bản trước, hệ thống AURA xuất hiện lỗ hổng nghiệp vụ và bảo mật nghiêm trọng:
**"Người dùng chưa quét mã QR chuyển khoản thực tế nhưng tài khoản vẫn được cộng thêm lượt khám sàng lọc thành công."**

Qua quá trình thẩm tra kiến trúc và rà soát mã nguồn thực tế tại:
- `backend/src/main/java/com/aura/billing/service/BillingService.java`
- `backend/src/main/java/com/aura/billing/service/AuraPaymentGatewayProvider.java`
- `frontend/src/components/CreditPurchaseModal.tsx`

Kiến Trúc Sư Giải Pháp xác định 3 căn nguyên kiến trúc cốt lõi:
1. **Kiến trúc đồng bộ sai bản chất thanh toán (Flawed Synchronous Flow)**:
   - Giao dịch thanh toán trực tuyến qua mã QR (VietQR, VNPay-QR, MoMo) về bản chất là giao tiếp **Bất đồng bộ hai chặng (Asynchronous Two-Legged Process)**.
   - Tuy nhiên, phương thức `BillingService.purchaseOrRenew` đang xử lý đồng bộ: khi gọi `paymentGateway.charge()`, lớp `AuraPaymentGatewayProvider.charge()` chỉ sinh ra chuỗi URL thanh toán hoặc chuỗi VietQR và trả về `GatewayResult(success=true)`.
   - `BillingService` thấy `result.success() == true` thì ngay lập tức coi là đã thu tiền thành công, chuyển trạng thái sang `SUCCEEDED`, ghi nhận `paidAt = now()` và gọi `grantOrExtendCredits()` ngay trong cùng một Transaction!
2. **Giao diện người dùng cho phép Tự Kích Hoạt (Client Self-Activation)**:
   - Tại `CreditPurchaseModal.tsx` (bước `QR_SCAN`), giao diện hiển thị nút bấm: *"Xác Nhận Đã Chuyển Khoản (Kích Hoạt Gói)"*.
   - Nút bấm này liên kết trực tiếp với hàm `handleConfirmPurchase` gọi API `POST /api/v1/me/packages/{id}/purchase`.
   - Người dùng không cần mở ứng dụng ngân hàng, không cần chuyển tiền, chỉ cần click nút này là hệ thống tự động cộng credits.
3. **Thiếu hạ tầng Webhook / IPN và Thẩm định Chữ ký số (Checksum)**:
   - Backend hoàn toàn chưa có controller hay handler tiếp nhận thông báo thanh toán tức thời (Instant Payment Notification - IPN) từ VNPay, MoMo hay VietQR Napas 24/7.
   - Không có cơ chế kiểm tra tính toàn vẹn (HMAC SHA512 / SHA256), không có cơ chế Idempotency chống cộng trùng, và không có API cho Client Polling trạng thái giao dịch.

---

## 2. MỤC TIÊU VÀ CÁC TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

Thiết kế giải pháp kỹ thuật mới phải đáp ứng triệt để 6 tiêu chí chấp nhận (AC-1 đến AC-6):
- **AC-1 (Khởi tạo phiên PENDING)**: Luồng Checkout khởi tạo giao dịch ở trạng thái `PENDING`, sinh mã tham chiếu duy nhất (`providerReference`), mã nội dung chuyển khoản duy nhất (`transferContent`) và URL/QR thanh toán. **Tuyệt đối KHÔNG cộng credit tại bước này**.
- **AC-2 (Xóa bỏ nút tự kích hoạt trên UI)**: Loại bỏ 100% nút cho phép người dùng tự bấm để kích hoạt gói ở màn hình hiển thị QR. Thay thế bằng trạng thái chờ ngân hàng tự động kèm hiệu ứng radar/spinner và bộ đếm ngược 15 phút.
- **AC-3 (Xử lý Webhook/IPN an toàn)**: Thiết kế Webhook/IPN handler cho VNPay, MoMo và VietQR. Bắt buộc thẩm định chữ ký số HMAC, kiểm tra Idempotency, đối soát số tiền khớp 100% với giá gói trong CSDL. Chỉ chuyển `SUCCEEDED` và gọi `grantOrExtendCredits` khi chữ ký và dữ liệu hợp lệ 100%.
- **AC-4 (API Polling có bảo vệ chống IDOR)**: Cung cấp endpoint `GET /api/v1/me/payments/{id}/status`. Kiểm tra quyền sở hữu nghiêm ngặt (`buyer.id == principal.id`). Frontend Polling định kỳ mỗi 3 giây để tự động chuyển màn hình khi nhận tiền thành công.
- **AC-5 (Thông báo đẩy Thời gian thực Realtime Push)**: Khi IPN thành công, Backend bắn sự kiện qua `UserNotificationService` (SSE và STOMP `/ws-aura`) giúp Frontend phản ứng tức thì mà không cần chờ hết chu kỳ poll.
- **AC-6 (Xử lý Timeout 15 phút & Cơ chế Fail-Closed)**: Phiên quét mã QR hết hạn sau 15 phút. Nếu cổng thanh toán thiếu cấu hình khóa bảo mật (Secret Key rỗng/null), hệ thống chuyển sang chế độ Fail-closed an toàn, từ chối tạo giao dịch và báo lỗi rõ ràng.

---

## 3. THIẾT KẾ KIẾN TRÚC TỔNG THỂ (TARGET ARCHITECTURE)

### 3.1. Sơ đồ Tuần tự Giao tiếp Đa Thành phần (Component Sequence Diagram)

```
[Bệnh nhân / Clinic UI]       [AURA Backend API]        [PostgreSQL DB]       [Cổng Thanh Toán / Ngân Hàng]
         |                             |                       |                         |
         | 1. POST /packages/{id}/checkout                     |                         |
         |---------------------------->|                       |                         |
         |                             | 2. Kiểm tra Scope &   |                         |
         |                             |    Fail-closed Secret |                         |
         |                             | 3. Sinh Unique TxnRef |                         |
         |                             |    & transferContent  |                         |
         |                             | 4. INSERT Transaction |                         |
         |                             |    (status = PENDING) |                         |
         |                             |---------------------->|                         |
         | 5. HTTP 201 Created         |                       |                         |
         |    { txnId, status: PENDING,|                       |                         |
         |      transferContent, QR }  |                       |                         |
         |<----------------------------|                       |                         |
         |                             |                       |                         |
         | === HIỂN THỊ MÀN HÌNH QR ===|                       |                         |
         | [Đếm ngược 15:00 bắt đầu]   |                       |                         |
         | [Radar Chờ Ngân Hàng quay]  |                       |                         |
         |                             |                       |                         |
         | 6. Short Polling (mỗi 3s)   |                       |                         |
         |    GET /payments/{id}/status|                       |                         |
         |---------------------------->| 7. Chống IDOR         |                         |
         |                             |    Query DB Status    |                         |
         | 8. { status: "PENDING" }    |---------------------->|                         |
         |<----------------------------|                       |                         |
         |                             |                       |                         |
         | ~~~ KHÁCH HÀNG MỞ APP NGÂN HÀNG QUÉT QR VÀ CHUYỂN TIỀN THẬT ~~~               |
         |                                                     |  9. Khách chuyển tiền   |
         |                                                     |------------------------>|
         |                             |                       |                         |
         |                             | 10. Server-to-Server Webhook / IPN Call         |
         |                             |<------------------------------------------------|
         |                             | 11. BƯỚC THẨM ĐỊNH CHỮ KÝ SỐ (HMAC Checksum)    |
         |                             |     -> Sai chữ ký? HTTP 400 / Fail-closed       |
         |                             | 12. BƯỚC KIỂM TRA IDEMPOTENCY                   |
         |                             |     -> Đã SUCCEEDED? Bỏ qua credit, trả 200     |
         |                             | 13. BƯỚC ĐỐI SOÁT SỐ TIỀN KHỚP 100%             |
         |                             | 14. BEGIN @Transactional                        |
         |                             |     - UPDATE status = 'SUCCEEDED'               |
         |                             |     - SET paid_at = NOW()                       |
         |                             |     - grantOrExtendCredits(buyer, pkg)          |
         |                             |     COMMIT                                      |
         |                             |---------------------->|                         |
         |                             | 15. Bắn thông báo SSE / WebSocket Realtime      |
         |                             | 16. Phản hồi xác nhận cho Cổng (RspCode="00")   |
         |                             |------------------------------------------------>|
         |                             |                       |                         |
         | 17. Polling lần tiếp theo   |                       |                         |
         |     GET /payments/{id}/status                       |                         |
         |---------------------------->| 18. DB Status:        |                         |
         |                             |     SUCCEEDED         |                         |
         | 19. { status: "SUCCEEDED",  |<----------------------|                         |
         |       creditsAdded: 5 }     |                       |                         |
         |<----------------------------|                       |                         |
         |                             |                       |                         |
         | === TỰ ĐỘNG CHUYỂN BƯỚC SUCCESS ===                 |                         |
         | Cập nhật Credits UI tức thì |                       |                         |
```

---

### 3.2. Đặc tả 4 Pha Kiến Trúc Thanh Toán

#### PHA 1: Khởi Tạo Giao Dịch An Toàn (Transaction Initiation - PENDING)
- **Nguyên tắc**: Không có bất kỳ khoản tín dụng (credits) nào được cấp phát khi chưa có xác thực từ ngân hàng.
- **Quy trình**:
  1. Người dùng chọn gói dịch vụ (`packageId`) và phương thức thanh toán (`paymentMethod`: `VIETQR`, `VNPAY`, `MOMO`, `CREDIT_CARD`).
  2. Bấm nút *"Tiến hành quét mã QR thanh toán"* tại Step 2 của Modal.
  3. Frontend gửi request: `POST /api/v1/me/packages/{packageId}/checkout?paymentMethod={paymentMethod}`.
  4. Backend thẩm định:
     - `AuraUserPrincipal`: Người dùng hợp lệ và tài khoản đang hoạt động.
     - `ServicePackage`: Gói cước tồn tại và `active == true`.
     - Phù hợp phân quyền (`Scope`): Gói `INDIVIDUAL` chỉ dành cho tài khoản có vai trò `USER`; Gói `CLINIC` chỉ dành cho tài khoản có vai trò `CLINIC`.
     - Kiểm tra Fail-closed: Đảm bảo cổng thanh toán có đủ cấu hình khóa bí mật. Nếu cổng chưa cấu hình (`UnavailablePaymentGateway`), ném ngay ngoại lệ HTTP 503 SERVICE_UNAVAILABLE.
  5. Sinh định danh duy nhất:
     - `providerReference`: Chuỗi định danh giao dịch duy nhất, cấu trúc: `<PROVIDER>_<YYYYMMDDHHmmss>_<RANDOM8_HEX>`.
     - `transferContent`: Cú pháp chuyển khoản VietQR duy nhất: `AURA NAP <PACKAGE_ID> <PATIENT_CLEAN_MRN> <RANDOM6_ALPHANUMIC>`.
  6. Khởi tạo bản ghi `PaymentTransaction`:
     - `status = PaymentStatus.PENDING`
     - `amount = servicePackage.getPrice()`
     - `provider = paymentMethod`
     - `providerReference = txnRef`
     - `transferContent = transferContent`
     - `expiresAt = LocalDateTime.now().plusMinutes(15)`
     - `paidAt = null`
  7. **TUYỆT ĐỐI KHÔNG GỌI `grantOrExtendCredits()`**.
  8. Trả về cho Client mã HTTP 201 Created cùng toàn bộ dữ liệu phiên thanh toán.

#### PHA 2: Hiển Thị Màn Hình Chờ Ngân Hàng & Polling (Frontend Waiting State)
- **Nguyên tắc**: Người dùng là bên thụ động chờ ngân hàng, không thể tự bấm nút kích hoạt.
- **Quy trình**:
  1. Frontend chuyển sang Step `QR_SCAN`:
     - Hiển thị ảnh VietQR thật hoặc chuyển hướng thanh toán VNPay/MoMo.
     - Hiển thị đầy đủ thông tin số tài khoản MBBank, tên chủ tài khoản, số tiền và nội dung chuyển khoản với nút Sao chép 1 chạm.
     - **LOẠI BỎ HOÀN TOÀN nút "Xác Nhận Đã Chuyển Khoản (Kích Hoạt Gói)"**.
     - Bật thanh trạng thái xoay radar: *"Đang chờ hệ thống ngân hàng xác nhận giao dịch... Gói khám sẽ tự động kích hoạt ngay khi nhận được tiền."*
  2. Frontend kích hoạt chu kỳ Polling:
     - Sử dụng `setInterval` gọi `GET /api/v1/me/payments/{id}/status` mỗi 3000ms.
     - Kiểm tra trạng thái:
       - Nếu nhận `status === "SUCCEEDED"`: Dừng Polling, phát âm thanh/hiệu ứng thành công, gọi callback cập nhật số dư credits trên UI, chuyển sang Step `SUCCESS`.
       - Nếu nhận `status === "FAILED"`: Dừng Polling, hiển thị thông báo lỗi chi tiết.
       - Nếu thời gian đếm ngược 15:00 về `00:00`: Dừng Polling, chuyển trạng thái giao dịch sang `EXPIRED`, hiển thị nút *"Tạo giao dịch mới"*.
  3. Dọn dẹp an toàn: Khi Modal đóng (`onClose`) hoặc Component unmount, xóa bỏ toàn bộ interval timer để tránh rò rỉ bộ nhớ (Memory Leak).

#### PHA 3: Tiếp Nhận Webhook / IPN & Thẩm Định Chữ Ký Số HMAC (Backend Webhook Handler)
- **Nguyên tắc**: Zero-Trust đối với dữ liệu từ Internet. Mọi Webhook phải được chứng minh tính toàn vẹn thông qua chữ ký mật.
- **Endpoint**:
  - `GET /api/v1/billing/ipn/vnpay` (Cổng VNPay IPN)
  - `POST /api/v1/billing/ipn/momo` (Ví điện tử MoMo IPN)
  - `POST /api/v1/billing/ipn/bank-transfer` (Hệ thống VietQR / Napas Webhook)
- **Cấu hình Security**: Được khai báo `permitAll()` trong `SecurityConfig.java` vì là cuộc gọi Server-to-Server không mang JWT Bearer token của người dùng.
- **Quy trình thẩm định 5 bước bắt buộc**:
  1. **Thẩm định Checksum HMAC**:
     - VNPay: Lấy tất cả params bắt đầu bằng `vnp_` (loại trừ `vnp_SecureHash` và `vnp_SecureHashType`), sắp xếp key theo thứ tự bảng chữ cái ASCII, URL encode và ghép chuỗi chuẩn, sau đó tính HMAC-SHA512 với `vnpay.hashSecret`. So sánh chuỗi băm với `vnp_SecureHash`.
     - MoMo: Ghép chuỗi chuẩn MoMo và tính HMAC-SHA256 với `momo.secretKey`. So sánh với `signature`.
     - VietQR/Bank: Tính HMAC-SHA256 trên body với `webhookSecret`.
     - **Nếu Checksum không khớp**: Ghi log an ninh cảnh báo giả mạo mức `WARN`, lập tức trả về mã lỗi phản hồi cho cổng (VNPay: `RspCode = "97"`), không thực hiện bất kỳ thao tác nào với CSDL.
  2. **Kiểm tra sự tồn tại của đơn hàng**:
     - Tìm kiếm `PaymentTransaction` trong CSDL theo `providerReference` hoặc `transferContent`.
     - Nếu không tìm thấy: Trả về mã lỗi (VNPay: `RspCode = "01"` - Order Not Found).
  3. **Kiểm tra Idempotency (Chống xử lý lặp lại / Double Credit)**:
     - Nếu `transaction.getStatus() == PaymentStatus.SUCCEEDED`:
       - Đây là gói tin IPN gửi lặp lại do cơ chế retry của cổng thanh toán.
       - Trả về ngay lập tức mã thành công cho cổng (VNPay: `RspCode = "02"` - Order already confirmed).
       - **Tuyệt đối KHÔNG gọi `grantOrExtendCredits()` lần thứ hai!**
  4. **Đối soát số tiền (Amount Verification)**:
     - Kiểm tra số tiền cổng thanh toán báo về có khớp 100% với `transaction.getAmount()`.
     - Với VNPay: `vnp_Amount` cần chia cho 100 trước khi so sánh.
     - Nếu sai lệch số tiền: Đánh dấu giao dịch `FAILED`, `failureReason = "Số tiền thanh toán không khớp"`, trả về VNPay: `RspCode = "04"` - Invalid Amount.
  5. **Cập nhật Trạng thái Nguyên tử & Cấp Tín Dụng (Atomic Credit Granting)**:
     - Mở `@Transactional`:
       - Cập nhật `transaction.setStatus(PaymentStatus.SUCCEEDED)`.
       - Ghi nhận thời điểm thanh toán thực tế: `transaction.setPaidAt(LocalDateTime.now())`.
       - Ghi nhận mã tham chiếu đối soát ngân hàng: `transaction.setGatewayTransactionNo(...)`.
       - Gọi `grantOrExtendCredits(transaction.getBuyer(), transaction.getServicePackage())`:
         - Tìm hoặc tạo `Subscription`.
         - Cộng dồn credits: `remainingCredits += servicePackage.getCredits()`.
         - Gia hạn ngày hết hạn: `expiresAt = max(now, expiresAt) + validityDays`.
         - Cập nhật trạng thái `SubscriptionStatus.ACTIVE`.
       - Ghi nhận Audit Log hệ thống vào bảng `audit_logs`.
     - Sau khi Commit DB:
       - Bắn thông báo đẩy thời gian thực qua `UserNotificationService` (SSE và STOMP).
       - Trả về mã xác nhận thành công cho cổng thanh toán (VNPay: `RspCode = "00"` - Confirm Success; MoMo: `resultCode = 0`).

#### PHA 4: Cơ Chế Fail-Closed Bảo Vệ An Toàn Tài Chính
- Nếu hệ thống chạy trong môi trường triển khai (Production) nhưng thiếu cấu hình khóa bảo mật (`VNPAY_HASH_SECRET` hoặc `MOMO_SECRET_KEY` bị null hoặc chuỗi trắng hoặc giá trị demo):
  - Hệ thống áp dụng nguyên tắc an toàn cao nhất **Fail-Closed**.
  - Từ chối khởi tạo giao dịch (`initiateCheckout` ném ngoại lệ `PaymentConfigurationException`).
  - Trả về HTTP 503 SERVICE_UNAVAILABLE kèm thông điệp: *"Cổng thanh toán chưa được cấu hình khóa bảo mật an toàn. Vui lòng liên hệ quản trị viên."*
  - Ngăn chặn hoàn toàn nguy cơ kẻ gian lợi dụng bypass checksum.

---

## 4. ĐẶC TẢ HỢP ĐỒNG API (API SPECIFICATION CONTRACT)

### 4.1. Khởi Tạo Giao Dịch Thanh Toán (Checkout Initiation)
- **Endpoint**: `POST /api/v1/me/packages/{packageId}/checkout`
  *(Hỗ trợ alias: `POST /api/v1/me/packages/{packageId}/purchase` để tương thích ngược)*
- **Xác thực**: Yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.
- **Phân quyền**:
  - Vai trò `USER` đối với gói `INDIVIDUAL`.
  - Vai trò `CLINIC` đối với gói `CLINIC`.
- **Query Parameters**:
  - `paymentMethod` (string, optional, mặc định: `"VIETQR"`): Giá trị hợp lệ: `VIETQR`, `VNPAY`, `MOMO`, `CREDIT_CARD`.
- **HTTP Response Codes**:
  - `201 CREATED`: Khởi tạo giao dịch thành công (Trạng thái `PENDING`).
  - `400 BAD_REQUEST`: Scope gói cước không phù hợp hoặc gói cước không hoạt động (`PackageInactiveException`).
  - `404 NOT_FOUND`: Không tìm thấy gói cước (`ServicePackageNotFoundException`).
  - `503 SERVICE_UNAVAILABLE`: Cổng thanh toán chưa sẵn sàng hoặc thiếu khóa cấu hình (`PaymentFailedException`).
- **Response Payload Format**:
```json
{
  "success": true,
  "message": "Khởi tạo giao dịch thanh toán thành công qua cổng VIETQR. Vui lòng hoàn tất chuyển khoản.",
  "data": {
    "id": 105,
    "servicePackageId": 2,
    "servicePackageName": "Gói Tiêu Chuẩn (Cá Nhân)",
    "amount": 200000.00,
    "status": "PENDING",
    "provider": "VIETQR",
    "providerReference": "VNP_20260914113000_B8A1C2D3",
    "transferContent": "AURA NAP 2 KHAM B8A1C2",
    "qrCodeUrl": "https://img.vietqr.io/image/MB-0399882026-compact2.png?amount=200000&addInfo=AURA%20NAP%202%20KHAM%20B8A1C2&accountName=CONG%20TY%20AI%20Y%20TE%20AURA",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "merchantId": "AURA_VNPAY_TMN_DEMO",
    "createdAt": "2026-09-14T11:30:00",
    "expiresAt": "2026-09-14T11:45:00",
    "paidAt": null,
    "failureReason": null
  }
}
```

---

### 4.2. Tra Cứu Trạng Thái Giao Dịch Phục Vụ Polling (Status Polling & IDOR Protected)
- **Endpoint**: `GET /api/v1/me/payments/{id}/status`
- **Xác thực**: Yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.
- **Kiểm soát Truy cập (IDOR Defense)**:
  - Backend so sánh `transaction.getBuyer().getId().equals(principal.id())`.
  - Nếu không trùng khớp: Ném `AccessDeniedException` (HTTP 403) hoặc `ResourceNotFoundException` (HTTP 404).
- **HTTP Response Codes**:
  - `200 OK`: Tra cứu trạng thái thành công.
  - `401 UNAUTHORIZED`: Chưa đăng nhập hoặc token hết hạn.
  - `403 FORBIDDEN`: Không có quyền truy cập giao dịch của người khác (IDOR blocked).
  - `404 NOT_FOUND`: Không tìm thấy giao dịch.
- **Response Payload Format**:
```json
{
  "success": true,
  "message": "Tra cứu trạng thái thanh toán thành công",
  "data": {
    "transactionId": 105,
    "providerReference": "VNP_20260914113000_B8A1C2D3",
    "status": "SUCCEEDED",
    "amount": 200000.00,
    "creditsAdded": 5,
    "paidAt": "2026-09-14T11:32:15",
    "expiresAt": "2026-09-14T11:45:00",
    "failureReason": null
  }
}
```

---

### 4.3. Webhook Tiếp Nhận IPN VNPay (Server-to-Server)
- **Endpoint**: `GET /api/v1/billing/ipn/vnpay`
- **Xác thực**: Public (`permitAll()`), xác thực bằng chữ ký số `vnp_SecureHash` (HMAC-SHA512).
- **Tham số nhận từ VNPay Query String**:
  - `vnp_TxnRef`: Mã tham chiếu giao dịch AURA (tương ứng `providerReference`).
  - `vnp_Amount`: Số tiền (đã nhân 100).
  - `vnp_ResponseCode`: Mã kết quả giao dịch (`"00"` là thành công).
  - `vnp_TransactionNo`: Mã giao dịch ghi nhận tại cổng VNPay.
  - `vnp_PayDate`: Thời gian thanh toán yyyyMMddHHmmss.
  - `vnp_SecureHash`: Chữ ký HMAC-SHA512 của VNPay.
- **Response trả về cho VNPay (JSON Format)**:
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```
*Bảng mã phản hồi VNPay chuẩn*:
- `00`: Xác nhận giao dịch thành công, cập nhật CSDL thành công.
- `01`: Không tìm thấy đơn hàng (`Order not found`).
- `02`: Đơn hàng đã được cập nhật trước đó (`Order already confirmed` - Idempotency).
- `04`: Số tiền không hợp lệ (`Invalid Amount`).
- `97`: Chữ ký số không hợp lệ (`Invalid Checksum`).

---

### 4.4. Webhook Tiếp Nhận IPN MoMo (Server-to-Server)
- **Endpoint**: `POST /api/v1/billing/ipn/momo`
- **Xác thực**: Public (`permitAll()`), xác thực bằng chữ ký số `signature` (HMAC-SHA256).
- **Request Body Payload Format**:
```json
{
  "partnerCode": "MOMO_AURA_MERCHANT_2026",
  "orderId": "MOMO_20260914113000_C4D5E6F7",
  "requestId": "REQ_20260914113000_C4D5E6F7",
  "amount": 200000,
  "orderInfo": "Thanh toan goi cuoc AURA",
  "transId": 230914889912,
  "resultCode": 0,
  "message": "Successful.",
  "responseTime": 1757859120000,
  "signature": "a8f5c9e2b1d3..."
}
```
- **Response trả về cho MoMo**:
```json
{
  "partnerCode": "MOMO_AURA_MERCHANT_2026",
  "orderId": "MOMO_20260914113000_C4D5E6F7",
  "resultCode": 0,
  "message": "Xác nhận giao dịch thành công"
}
```

---

### 4.5. Webhook Tiếp Nhận VietQR / Chuyển Khoản Ngân Hàng (Bank Transfer IPN)
- **Endpoint**: `POST /api/v1/billing/ipn/bank-transfer`
- **Xác thực**: Header `X-AURA-WEBHOOK-SIGNATURE` xác thực HMAC-SHA256.
- **Request Body Payload Format**:
```json
{
  "transferContent": "AURA NAP 2 KHAM B8A1C2",
  "amount": 200000.00,
  "bankCode": "MB",
  "gatewayTransactionNo": "FT2625890123984",
  "paidAt": "2026-09-14T11:31:40",
  "status": "PAID"
}
```

---

## 5. LƯỢC ĐỒ CƠ SỞ DỮ LIỆU & FLYWAY MIGRATION V033

Tệp migration: `backend/src/main/resources/db/migration/V033__enhance_payment_transactions_for_qr_and_ipn.sql`

```sql
-- V033: Mở rộng bảng payment_transaction hỗ trợ thanh toán QR bất đồng bộ, tra cứu IPN và đối soát ngân hàng (FR-11, FR-28)

-- 1. Bổ sung các cột thông tin phục vụ QR code, Webhook IPN và thời gian hết hạn
ALTER TABLE payment_transaction
    ADD COLUMN IF NOT EXISTS transfer_content VARCHAR(255),
    ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
    ADD COLUMN IF NOT EXISTS payment_url TEXT,
    ADD COLUMN IF NOT EXISTS gateway_transaction_no VARCHAR(255),
    ADD COLUMN IF NOT EXISTS checksum VARCHAR(255),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;

-- 2. Cập nhật expires_at mặc định cho các bản ghi cũ (created_at + 15 phút)
UPDATE payment_transaction
SET expires_at = created_at + INTERVAL '15 minutes'
WHERE expires_at IS NULL;

-- 3. Tạo Unique Index cho provider_reference để chống trùng lặp mã đơn và bảo đảm Idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uk_payment_transaction_provider_ref
    ON payment_transaction (provider_reference)
    WHERE provider_reference IS NOT NULL;

-- 4. Tạo Index cho transfer_content phục vụ tra cứu cực nhanh khi nhận Webhook/IPN chuyển khoản ngân hàng
CREATE INDEX IF NOT EXISTS idx_payment_transaction_transfer_content
    ON payment_transaction (transfer_content);

-- 5. Tạo Index cho expires_at phục vụ tác vụ kiểm tra giao dịch hết hạn
CREATE INDEX IF NOT EXISTS idx_payment_transaction_expires_at
    ON payment_transaction (expires_at);
```

---

## 6. HƯỚNG DẪN TRIỂN KHAI CHO CÁC ĐỘI NGŨ PHÁT TRIỂN

### 6.1. Hướng Dẫn Chi Tiết Cho Backend Developer (`backend-lead`)

#### Danh sách tệp cần cập nhật & tạo mới:
1. **Flyway Script**: `backend/src/main/resources/db/migration/V033__enhance_payment_transactions_for_qr_and_ipn.sql`
2. **Entity & Enum**:
   - `backend/src/main/java/com/aura/billing/entity/PaymentStatus.java`:
     Bổ sung các trạng thái: `EXPIRED`, `CANCELLED`.
   - `backend/src/main/java/com/aura/billing/entity/PaymentTransaction.java`:
     Bổ sung các trường: `transferContent`, `qrCodeUrl`, `paymentUrl`, `gatewayTransactionNo`, `checksum`, `expiresAt`.
3. **Repository**:
   - `backend/src/main/java/com/aura/billing/repository/PaymentTransactionRepository.java`:
     Thêm phương thức tìm kiếm:
     ```java
     Optional<PaymentTransaction> findByProviderReference(String providerReference);
     Optional<PaymentTransaction> findByTransferContent(String transferContent);
     ```
4. **DTOs**:
   - `backend/src/main/java/com/aura/billing/dto/PaymentTransactionResponse.java`:
     Bổ sung các trường `transferContent`, `qrCodeUrl`, `expiresAt`.
   - `backend/src/main/java/com/aura/billing/dto/PaymentStatusResponse.java`: (Tạo mới)
     ```java
     public record PaymentStatusResponse(
         Long transactionId,
         String providerReference,
         PaymentStatus status,
         BigDecimal amount,
         int creditsAdded,
         LocalDateTime paidAt,
         LocalDateTime expiresAt,
         String failureReason
     ) {}
     ```
   - `backend/src/main/java/com/aura/billing/dto/MomoIpnRequest.java`, `BankTransferIpnRequest.java`.
5. **Service Layer (`BillingService.java`)**:
   - **Tách bạch 2 pha nghiệp vụ**:
     - `initiateCheckout(UUID ownerId, Long servicePackageId, String paymentMethod)`:
       - Kiểm tra user, package, scope.
       - Sinh `providerReference` và `transferContent` duy nhất.
       - Lưu `PaymentTransaction` trạng thái `PaymentStatus.PENDING`.
       - **TUYỆT ĐỐI KHÔNG GỌI `grantOrExtendCredits()`**.
       - Trả về `PaymentTransactionResponse`.
     - `processPaymentSuccess(String providerReference, String gatewayTxnNo, BigDecimal amount)`:
       - Tìm giao dịch theo `providerReference`.
       - Kiểm tra Idempotency: Nếu đã `SUCCEEDED`, thoát ngay lập tức.
       - Kiểm tra số tiền khớp 100%.
       - Gán `status = PaymentStatus.SUCCEEDED`, `paidAt = LocalDateTime.now()`, `gatewayTransactionNo = gatewayTxnNo`.
       - Gọi `grantOrExtendCredits(transaction.getBuyer(), transaction.getServicePackage())`.
       - Gửi thông báo đẩy qua `userNotificationService.sendNotificationToUser(...)`.
     - `getTransactionStatus(UUID ownerId, Long transactionId)`:
       - Tìm `PaymentTransaction` theo ID.
       - Kiểm tra IDOR: `if (!transaction.getBuyer().getId().equals(ownerId)) throw new AccessDeniedException(...)`.
       - Trả về `PaymentStatusResponse`.
6. **Controller Layer**:
   - `BillingController.java`:
     - Sửa endpoint `/api/v1/me/packages/{packageId}/purchase` (và bổ sung `/checkout`) gọi `billingService.initiateCheckout(...)`.
     - Bổ sung endpoint `GET /api/v1/me/payments/{id}/status` gọi `billingService.getTransactionStatus(...)`.
   - `BillingWebhookController.java`: (Tạo mới)
     - Khai báo `@RestController`, `@RequestMapping("/api/v1/billing/ipn")`.
     - Triển khai `GET /vnpay`, `POST /momo`, `POST /bank-transfer`.
     - Thẩm định chữ ký số HMAC và gọi `billingService.processPaymentSuccess(...)`.
7. **Security Configuration (`SecurityConfig.java`)**:
   - Khai báo `.requestMatchers("/api/v1/billing/ipn/**").permitAll()` để các cổng thanh toán ngoại vi có thể gọi Webhook thành công.

---

### 6.2. Hướng Dẫn Chi Tiết Cho Frontend Developer (`frontend-lead`)

#### Danh sách tệp cần cập nhật:
1. **API Client (`frontend/src/services/api.ts`)**:
   - Thêm interface `PaymentStatusResponse`:
     ```typescript
     export interface PaymentStatusResponse {
       transactionId: number;
       providerReference: string;
       status: "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED";
       amount: number;
       creditsAdded: number;
       paidAt?: string;
       expiresAt?: string;
       failureReason?: string;
     }
     ```
   - Bổ sung method trong `billingApi`:
     ```typescript
     checkout: (packageId: number, paymentMethod = "VIETQR") =>
       apiFetch<PaymentTransactionResponse>(
         `/api/v1/me/packages/${packageId}/checkout?paymentMethod=${paymentMethod}`,
         { method: "POST" }
       ),
     getTransactionStatus: (transactionId: number | string) =>
       apiFetch<PaymentStatusResponse>(
         `/api/v1/me/payments/${transactionId}/status`,
         { method: "GET" }
       ),
     ```
2. **Modal Giao Diện Thanh Toán (`frontend/src/components/CreditPurchaseModal.tsx`)**:
   - **Thay đổi tại Step 2 (CONFIRM)**:
     - Khi bấm *"Tiến hành quét mã QR thanh toán"*, gọi `billingApi.checkout(selectedPackage.id, paymentMethod)`.
     - Lưu `currentTransactionId = res.data.id`, lưu `transferContent` và `qrCodeUrl` từ backend trả về.
     - Chuyển sang Step `QR_SCAN`.
   - **Thay đổi triệt để tại Step 3 (QR_SCAN)**:
     - **XÓA BỎ HOÀN TOÀN nút *"Xác Nhận Đã Chuyển Khoản (Kích Hoạt Gói)"***.
     - Thay thế bằng **Card Trạng Thái Chờ Ngân Hàng**:
       - Icon Radar xoay hoặc Spinner mượt mà: *"Hệ thống đang kết nối ngân hàng để kiểm tra giao dịch chuyển khoản... Xin vui lòng giữ nguyên màn hình này."*
       - Đồng hồ đếm ngược 15 phút (`countdownSec`).
     - Thiết lập cơ chế Polling:
       ```typescript
       useEffect(() => {
         if (paymentStep !== "QR_SCAN" || !activeTxnId) return;
         const interval = setInterval(async () => {
           try {
             const res = await billingApi.getTransactionStatus(activeTxnId);
             if (res.success && res.data) {
               if (res.data.status === "SUCCEEDED") {
                 clearInterval(interval);
                 setPaymentStep("SUCCESS");
                 onPurchaseSuccess?.(activeCredits + res.data.creditsAdded);
               } else if (res.data.status === "FAILED" || res.data.status === "EXPIRED") {
                 clearInterval(interval);
                 setPurchaseError(res.data.failureReason || "Giao dịch đã hết hạn hoặc bị từ chối.");
               }
             }
           } catch (err) {
             // Polling retry an toàn
           }
         }, 3000);
         return () => clearInterval(interval);
       }, [paymentStep, activeTxnId]);
       ```
     - Xử lý khi đếm ngược về 0: Hiển thị cảnh báo hết hạn và nút *"Khởi tạo lại giao dịch"*.
3. **Cập Nhật Unit Tests (`frontend/src/tests/credit-purchase-modal.test.ts`)**:
   - Xác nhận rằng không còn bất kỳ nút bấm nào mang nội dung *"Xác Nhận Đã Chuyển Khoản (Kích Hoạt Gói)"*.
   - Kiểm thử trạng thái chờ ngân hàng (Waiting Radar) hiển thị rõ ràng.

---

## 7. ĐÁNH GIÁ RỦI RO & MA TRẬN PHÒNG VỆ KIẾN TRÚC

| Rủi Ro Kỹ Thuật / Nghiệp Vụ | Mức Độ | Cơ Chế Phòng Vệ Kiến Trúc (Architectural Mitigation) |
|---|:---:|---|
| **Người dùng bypass bằng cách gọi trực tiếp API cũ** | **CRITICAL** | Backend xóa bỏ hành vi tự động cấp credit trong `purchaseOrRenew`. Mọi request tạo đơn chỉ trả về trạng thái `PENDING`. |
| **Kẻ gian giả mạo Webhook IPN từ Internet** | **CRITICAL** | Thẩm định chữ ký số HMAC-SHA512 (VNPay) / HMAC-SHA256 (MoMo/Bank) với khóa bí mật lưu trong môi trường an toàn. Sai 1 ký tự từ chối ngay lập tức (Fail-Closed). |
| **Tấn công lặp lại gói tin (Replay Attack / Double Credit)** | **HIGH** | Ràng buộc Unique trên `provider_reference`. Kiểm tra trạng thái `SUCCEEDED` trước khi xử lý: nếu đã thành công thì chỉ trả về phản hồi 200 mà không cộng thêm credits. |
| **Truy vấn trạng thái giao dịch của người khác (IDOR)** | **HIGH** | Endpoint `/api/v1/me/payments/{id}/status` kiểm tra chặt chẽ `buyer.id == principal.id`. Nếu không trùng, từ chối với HTTP 403 Forbidden. |
| **Khách hàng chuyển sai số tiền so với gói cước** | **HIGH** | Webhook kiểm tra so sánh chính xác số tiền thực chuyển với giá gói lưu trong CSDL. Nếu không khớp, đánh dấu giao dịch `FAILED` và không cộng credit. |
| **Rò rỉ kết nối Polling gây nghẽn máy chủ** | **MEDIUM** | Chu kỳ Polling giãn cách 3 giây, tự động hủy bỏ khi component unmount hoặc khi trạng thái đã đạt `SUCCEEDED`/`EXPIRED`. Kết hợp SSE Realtime đẩy tức thì. |

---

## 8. KẾT LUẬN & KIẾN NGHỊ KIẾN TRÚC

Bản đặc tả thiết kế kiến trúc này giải quyết triệt để và toàn diện lỗi "thanh toán chưa quét QR vẫn thành công", khôi phục 100% tính toàn vẹn tài chính và bảo mật cho hệ thống AURA, đáp ứng trọn vẹn các tiêu chí chấp nhận AC-1 đến AC-6.

Kiến Trúc Sư Giải Pháp kính chuyển tài liệu này đến:
- **Product Owner & CEO**: Phê duyệt triển khai chính thức.
- **Backend Lead & Team**: Triển khai Flyway V033, Webhook Controller và tái cấu trúc BillingService.
- **Frontend Lead & Team**: Cập nhật `CreditPurchaseModal.tsx`, xóa bỏ nút tự kích hoạt và bổ sung Polling 3s.
- **Security & Medical Safety Reviewer**: Giám sát kiểm thử hộp đen và kiểm toán an ninh sau triển khai.
