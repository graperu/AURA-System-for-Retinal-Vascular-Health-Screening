# Biên Bản Thẩm Định An Ninh & Quyền Riêng Tư (Security & Privacy Audit Report)
## Chuyên Đề: Thẩm Định Hệ Thống Thanh Toán Đa Kênh, Webhook IPN & Chống Gian Lận Tài Chính (FR-11, FR-28)

- **Người thực hiện thẩm định**: Kỹ Sư An Ninh & Quyền Riêng Tư AURA (Security & Privacy Engineer)
- **Thời gian thẩm định**: 14/09/2026
- **Đối tượng thẩm định**:
  - Máy chủ nghiệp vụ: `backend/src/main/java/com/aura/billing/...`, `backend/src/main/java/com/aura/auth/config/SecurityConfig.java`
  - Cơ sở dữ liệu: `backend/src/main/resources/db/migration/V033__enhance_payment_transactions_for_qr_and_ipn.sql`
  - Giao diện người dùng: `frontend/src/components/CreditPurchaseModal.tsx`, `frontend/src/services/api.ts`
- **Tiêu chuẩn áp dụng**: OWASP Top 10:2021, Chuẩn an toàn bảo mật y tế & thanh toán (HIPAA, PCI-DSS Level 4 alignment, NFR-9, NFR-10, QG5).

---

## 1. Bảng Đánh Giá Rủi Ro An Ninh Theo Các Trục Bắt Buộc (Risk Assessment Table)

| Trục Thẩm Định | Tiêu Chí Kiểm Tra | Hiện Trạng Mã Nguồn | Mức Độ Rủi Ro | Đánh Giá |
| :--- | :--- | :--- | :---: | :---: |
| **1. Gian lận tài chính & Bypass thanh toán** | Không cho phép người dùng tự kích hoạt lượt khám (credits) qua UI hoặc API | `initiateCheckout` trả về `PENDING`; UI đã xóa bỏ 100% nút bấm tự kích hoạt; credit chỉ được cấp tại `processPaymentSuccess` khi có xác nhận IPN | **THẤP** | **ĐẠT (PASS)** |
| **1. Gian lận tài chính & Bypass thanh toán** | Phòng chống Underpayment Attack (trả thiếu tiền để nhận gói lớn) | Kiểm tra `transaction.getAmount().compareTo(amount) > 0`. Tuy nhiên nếu `amount == null`, kiểm tra bị bypass | **CAO (HIGH)** | **CẦN KHẮC PHỤC** |
| **2. Xác thực Webhook & Anti-Spoofing** | Xác thực chữ ký số HMAC-SHA512 (VNPay) & HMAC-SHA256 (MoMo) | Đã triển khai thuật toán băm chuẩn theo đặc tả cổng thanh toán | **THẤP** | **ĐẠT (PASS)** |
| **2. Xác thực Webhook & Anti-Spoofing** | So sánh chữ ký an toàn (Constant-time / Timing attack resistance) | Đang dùng `String.equalsIgnoreCase()` và `String.equals()` -> dễ bị Timing Attack (CWE-208) | **TRUNG BÌNH (MEDIUM)** | **CẦN KHẮC PHỤC** |
| **2. Xác thực Webhook & Anti-Spoofing** | Xác thực Webhook Chuyển khoản ngân hàng (Bank Transfer) | Có điều kiện `(expectedSecret == null \|\| expectedSecret.isBlank())` dẫn đến Fail-Open nếu cấu hình trống | **CAO (HIGH)** | **CẦN KHẮC PHỤC** |
| **2. Xác thực Webhook & Anti-Spoofing** | Chống Replay Attack & Duplicate IPN (Idempotency) | Kiểm tra trạng thái `SUCCEEDED` và Unique Index `provider_reference`; tuy nhiên thiếu Lock phân tán/Pessimistic Lock khi có Race Condition | **TRUNG BÌNH (MEDIUM)** | **TẠM ĐẠT (PASS CÓ LƯU Ý)** |
| **3. Phòng chống IDOR & Bảo vệ dữ liệu** | Kiểm soát quyền truy cập endpoint `GET /api/v1/me/payments/{id}/status` | Kiểm tra nghiêm ngặt `buyer.getId().equals(ownerId)`, ném `AccessDeniedException` (403) nếu không khớp | **THẤP** | **ĐẠT (PASS)** |
| **3. Phòng chống IDOR & Bảo vệ dữ liệu** | Lịch sử giao dịch (`/me/payments`, `/me/subscriptions`, `/me/credits`) | Truy vấn dựa trên `principal.id()` của token JWT đã xác thực | **THẤP** | **ĐẠT (PASS)** |
| **3. Phòng chống IDOR & Bảo vệ dữ liệu** | Không để lộ bí mật hệ thống hoặc PII/PHI bệnh nhân | DTO `PaymentStatusResponse` an toàn; tuy nhiên log `allParams` và `req` có chứa email người dùng | **THẤP** | **TẠM ĐẠT (PASS CÓ LƯU Ý)** |
| **4. Quản lý Secret & Cấu hình môi trường** | Đọc khóa bí mật từ biến môi trường, không commit secret thật | Đã cấu hình placeholder `${VNPAY_HASH_SECRET:...}`, `${MOMO_SECRET_KEY:...}`; thiếu ánh xạ biến môi trường cho `webhook-secret` trong `application.yml` | **TRUNG BÌNH (MEDIUM)** | **CẦN KHẮC PHỤC** |

---

## 2. Đánh Giá Chi Tiết Theo Danh Mục Lỗ Hổng OWASP Top 10

### 2.1. OWASP A01:2021 – Broken Access Control (Kiểm Soát Truy Cập Bị Phá Vỡ)
- **IDOR Check**: Endpoint `GET /api/v1/me/payments/{transactionId}/status` đã có cơ chế kiểm tra quyền sở hữu dữ liệu (Data Ownership) tại tầng `BillingService`:
  ```java
  if (!transaction.getBuyer().getId().equals(ownerId)) {
      throw new AccessDeniedException("Bạn không có quyền truy cập thông tin giao dịch này.");
  }
  ```
  => Ngăn chặn hoàn toàn việc người dùng A xem trạng thái hoặc chi tiết thanh toán của người dùng B.
- **Fail-Open Authentication Vulnerability (SEC-BILLING-03 - Mức độ: HIGH)**:
  Tại `BillingWebhookController.java` (dòng 196-200):
  ```java
  String expectedSecret = properties.getWebhookSecret();
  boolean authenticated = (expectedSecret == null || expectedSecret.isBlank())
          || expectedSecret.equals(headerSecret)
          || expectedSecret.equals(headerSignature)
          || expectedSecret.equals(req.signature());
  ```
  Khi biến môi trường hoặc cấu hình `webhookSecret` bị để trống trên môi trường triển khai thực tế, điều kiện `(expectedSecret == null || expectedSecret.isBlank())` sẽ trả về `true`. Khi đó, bất kỳ kẻ tấn công nào cũng có thể gửi request giả mạo tới `/api/v1/billing/ipn/bank-transfer` mà không cần secret để kích hoạt gói cước thành công.
  => **Yêu cầu khắc phục**: Chuyển ngay sang cơ chế Fail-Closed (từ chối ngay lập tức nếu secret chưa được thiết lập).

### 2.2. OWASP A02:2021 – Cryptographic Failures (Sự Cố Mật Mã & Chữ Ký Số)
- **Timing Attack on Signature Verification (SEC-BILLING-02 - Mức độ: MEDIUM - CWE-208)**:
  Tại `BillingWebhookController.java`:
  - Dòng 82: `!calculatedHash.equalsIgnoreCase(vnpSecureHash)`
  - Dòng 152: `!calculatedSignature.equalsIgnoreCase(req.signature())`
  - Dòng 197: `expectedSecret.equals(headerSecret)`
  Các hàm `equals` và `equalsIgnoreCase` của Java trả về `false` ngay khi gặp ký tự đầu tiên không khớp (short-circuit execution). Kẻ tấn công có thể đo độ trễ nano-giây của mạng để dò từng ký tự chữ ký HMAC (Timing Attack).
  => **Yêu cầu khắc phục**: Bắt buộc sử dụng hàm so sánh thời gian bất biến `java.security.MessageDigest.isEqual(...)`.

### 2.3. OWASP A04:2021 & A08:2021 – Insecure Design & Data Integrity Failures (Thiết Kế Thiếu An Toàn & Toàn Vẹn Dữ Liệu)
- **Underpayment Attack Null-Check Bypass (SEC-BILLING-01 - Mức độ: HIGH)**:
  Tại `BillingService.java` (dòng 189-195):
  ```java
  // Fail-Closed: Xác thực số tiền thanh toán thực tế
  if (amount != null && transaction.getAmount().compareTo(amount) > 0) {
      log.error("Số tiền thanh toán ({}) nhỏ hơn giá trị gói ({}) của giao dịch {}",
              amount, transaction.getAmount(), providerReference);
      transaction.setStatus(PaymentStatus.FAILED);
      transaction.setFailureReason("Số tiền thanh toán không khớp: Yêu cầu " + transaction.getAmount() + " nhưng nhận " + amount);
      return paymentTransactionRepository.save(transaction);
  }
  ```
  Nếu payload từ Webhook bị kẻ tấn công loại bỏ trường `amount` (dẫn tới `amount == null`), điều kiện `amount != null` trả về `false`. Khi đó luồng thực thi bỏ qua khối chặn và tiếp tục cập nhật `status = SUCCEEDED`, cấp toàn bộ credits cho tài khoản.
  => **Yêu cầu khắc phục**: Thiết lập quy tắc Fail-Closed nghiêm ngặt: Nếu `amount == null || transaction.getAmount().compareTo(amount) > 0`, lập tức từ chối và đánh dấu `FAILED`.

- **Race Condition / Concurrency Double-Credit Risk (SEC-BILLING-04 - Mức độ: MEDIUM)**:
  Khi 2 request Webhook/IPN trùng lặp từ đối tác gửi tới máy chủ trong cùng một thời điểm milli-giây, cả hai luồng đồng thời đọc trạng thái `PENDING` trước khi transaction đầu kịp commit `SUCCEEDED`. Điều này có thể dẫn tới việc hàm `grantOrExtendCredits` bị thực thi hai lần.
  => **Khuyến nghị**: Sử dụng khóa bi quan (Pessimistic Write Lock: `SELECT ... FOR UPDATE`) hoặc trường `@Version` (Optimistic Locking) trên thực thể `PaymentTransaction`.

- **Missing Unique Constraint on `transfer_content` (SEC-BILLING-05 - Mức độ: LOW)**:
  Trong Flyway `V033`, `transfer_content` chỉ được tạo Index thường (`CREATE INDEX idx_payment_transaction_transfer_content`). Trong khi đó, `paymentTransactionRepository.findByTransferContent` trả về kiểu `Optional<PaymentTransaction>`. Nếu xảy ra va chạm nội dung chuyển khoản, truy vấn sẽ phát sinh lỗi `IncorrectResultSizeDataAccessException`.
  => **Khuyến nghị**: Đảm bảo `transfer_content` có ràng buộc duy nhất (`UNIQUE INDEX`).

### 2.4. OWASP A05:2021 – Security Misconfiguration (Cấu Hình Sai Lệch Về An Ninh)
- **Thiếu ánh xạ biến môi trường trong `application.yml` (SEC-BILLING-07 - Mức độ: MEDIUM)**:
  Trong `application.yml`, cấu hình cổng thanh toán mới chỉ khai báo:
  - `payment.vnpay.*`
  - `payment.momo.*`
  Chưa khai báo `payment.webhook-secret: ${PAYMENT_WEBHOOK_SECRET:AURA_BILLING_WEBHOOK_SECRET_2026}` và `payment.vietqr.*`. Do đó, nếu môi trường không khai báo đúng cú pháp Spring relaxed binding, hệ thống sẽ rơi vào giá trị mặc định của code Java.

---

## 3. Khuyến Nghị Vá Lỗi Kỹ Thuật (Remediation Code Guidelines)

Kỹ sư An ninh yêu cầu đội ngũ `backend-lead` tiến hành triển khai các bản vá an ninh sau:

### 3.1. Vá lỗi Underpayment Fail-Closed (`BillingService.java`)
```java
// SỬA ĐỔI TẠI BillingService.java - Dòng 189:
// Đảm bảo nguyên tắc Fail-Closed: Số tiền bắt buộc phải hiện diện VÀ phải lớn hơn hoặc bằng giá niêm yết
if (amount == null || transaction.getAmount().compareTo(amount) > 0) {
    log.error("Xác thực thanh toán thất bại: Số tiền nhận được ({}) không hợp lệ hoặc nhỏ hơn giá trị gói ({}) của giao dịch {}",
            amount, transaction.getAmount(), providerReference);
    transaction.setStatus(PaymentStatus.FAILED);
    transaction.setFailureReason("Số tiền thanh toán không hợp lệ: Yêu cầu " + transaction.getAmount() + " nhưng nhận " + (amount != null ? amount : "NULL"));
    return paymentTransactionRepository.save(transaction);
}
```

### 3.2. Vá lỗi Fail-Open Webhook Secret & Timing Attack (`BillingWebhookController.java`)
```java
// SỬA ĐỔI TẠI BillingWebhookController.java:
// 1. So sánh Constant-Time cho VNPay
byte[] expectedHashBytes = calculatedHash.toUpperCase().getBytes(StandardCharsets.UTF_8);
byte[] actualHashBytes = vnpSecureHash.toUpperCase().getBytes(StandardCharsets.UTF_8);
if (!java.security.MessageDigest.isEqual(expectedHashBytes, actualHashBytes)) {
    log.error("VNPay IPN: Checksum không khớp!");
    return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
}

// 2. So sánh Constant-Time cho MoMo
byte[] expectedMomoBytes = calculatedSignature.toLowerCase().getBytes(StandardCharsets.UTF_8);
byte[] actualMomoBytes = req.signature().toLowerCase().getBytes(StandardCharsets.UTF_8);
if (!java.security.MessageDigest.isEqual(expectedMomoBytes, actualMomoBytes)) {
    log.error("MoMo IPN: Chữ ký không hợp lệ!");
    return ResponseEntity.badRequest().body(Map.of("resultCode", 99, "message", "Invalid signature"));
}

// 3. Khắc phục triệt để Fail-Open trên Bank Transfer Webhook
String expectedSecret = properties.getWebhookSecret();
if (expectedSecret == null || expectedSecret.isBlank()) {
    log.error("Bank Transfer webhook: Webhook secret chưa được cấu hình trên máy chủ!");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "success", false,
            "message", "Webhook authentication service not properly configured"
    ));
}

byte[] expectedSecretBytes = expectedSecret.getBytes(StandardCharsets.UTF_8);
boolean authenticated = (headerSecret != null && java.security.MessageDigest.isEqual(expectedSecretBytes, headerSecret.getBytes(StandardCharsets.UTF_8)))
        || (headerSignature != null && java.security.MessageDigest.isEqual(expectedSecretBytes, headerSignature.getBytes(StandardCharsets.UTF_8)))
        || (req.signature() != null && java.security.MessageDigest.isEqual(expectedSecretBytes, req.signature().getBytes(StandardCharsets.UTF_8)));

if (!authenticated) {
    log.error("Bank Transfer webhook: Secret/Signature không hợp lệ");
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "success", false,
            "message", "Invalid webhook signature or secret"
    ));
}
```

### 3.3. Cập nhật `application.yml` hoàn chỉnh
```yaml
payment:
  webhook-secret: ${PAYMENT_WEBHOOK_SECRET:AURA_BILLING_WEBHOOK_SECRET_2026}
  sandbox-mode: ${PAYMENT_SANDBOX_MODE:true}
  vietqr:
    bank-id: ${VIETQR_BANK_ID:MB}
    account-no: ${VIETQR_ACCOUNT_NO:0901234567}
    account-name: ${VIETQR_ACCOUNT_NAME:CONG TY CO PHAN CONG NGHE AURA}
    template: ${VIETQR_TEMPLATE:compact2}
```

---

## 4. Kết Luận Thẩm Định An Ninh

- **Kết Quả Đánh Giá Tổng Thể**: **CẦN KHẮC PHỤC (REMEDIATE)**
- **Lý do**:
  1. Cơ chế phòng chống tự kích hoạt gói cước trên giao diện và REST API đã triển khai rất tốt và đạt yêu cầu kiến trúc.
  2. Phòng chống IDOR tại `GET /api/v1/me/payments/{id}/status` đạt yêu cầu 100%.
  3. **TUY NHIÊN**, tồn tại 02 lỗ hổng an ninh ở mức **CAO (HIGH)** cần xử lý dứt điểm trước khi phát hành phiên bản chính thức (Production):
     - Lỗ hổng **SEC-BILLING-01 (Underpayment check bypass khi `amount == null`)**.
     - Lỗ hổng **SEC-BILLING-03 (Fail-Open bypass tại webhook Bank Transfer khi `webhookSecret` rỗng)**.
     - Kèm theo cải tiến chống Timing Attack (**SEC-BILLING-02**) để đạt chuẩn bảo mật tài chính ngân hàng.

Sau khi `backend-lead` triển khai các bản vá theo đúng mã nguồn mẫu tại Mục 3 và hoàn tất bộ kiểm thử tự động, hệ thống sẽ được cấp thẩm định **ĐẠT (PASS)** theo Cổng Chất Lượng An Ninh QG5.
