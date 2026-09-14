# BIÊN BẢN THẨM ĐỊNH AN NINH & QUYỀN RIÊNG TƯ TOÀN DIỆN (COMPREHENSIVE SECURITY & PRIVACY AUDIT REPORT)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL SCREENING SYSTEM)

**Mã văn bản:** `AURA-SEC-2026-006-FULL`  
**Ngày thẩm định:** 14/09/2026  
**Chuyên gia thẩm định:** Kỹ Sư An Ninh & Quyền Riêng Tư AURA (Security & Privacy Engineer)  
**Phạm vi rà soát:**
- Backend: `backend/src/main/java/com/aura/` (auth, screening, doctor, clinic, patient, audit, notification, billing, chat, feedback) & `application.yml`
- Frontend: `frontend/src/` (api.ts, services, features, context, components)
**Tiêu chuẩn đối chiếu:** OWASP Top 10:2021, HIPAA Safe Harbor (45 CFR § 164.514), NFR-9, NFR-10, Medical Safety Rules, Cổng Chất Lượng An Ninh QG5  

---

## 1. TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ

| Mức độ rủi ro | Số lượng phát hiện | Trạng thái |
| :--- | :---: | :--- |
| **CRITICAL** | **1** | **BÁO ĐỘNG ĐỎ - BẮT BUỘC KHẮC PHỤC NGAY (Lộ Live API Key)** |
| **HIGH** | **4** | **CẦN KHẮC PHỤC TRƯỚC KHI TRIỂN KHAI PRODUCTION (IDOR, PII trong Logs, Silent Mock AI)** |
| **MEDIUM** | **4** | **CẦN KHẮC PHỤC (Origin Bypass, WebSocket STOMP Auth, CSV Injection, DICOM Strip No-op)** |
| **LOW** | **2** | **KHUYẾN NGHỊ TỐI ƯU HÓA (DoctorFeedback PreAuthorize, Endpoint Packages Auth Inconsistency)** |
| **TỔNG CỘNG** | **11** | **KẾT LUẬN: KHÔNG ĐẠT (REJECTED / NEEDS REMEDIATION)** |

---

## 2. MA TRẬN DANH SÁCH CÁC PHÁT HIỆN AN NINH & QUYỀN RIÊNG TƯ

| ID | Tên lỗ hổng / Vấn đề phát hiện | File và vị trí dòng | Mức độ rủi ro | Danh mục |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-F01** | Lộ cứng API Key Gemini trong file cấu hình và mã nguồn | `application.yml`: L59<br/>`GeminiRetinalAiService.java`: L32 | **CRITICAL** | Secrets Management |
| **SEC-F02** | Ghi mã OTP thô và PII người dùng vào nhật ký log máy chủ | `OtpService.java`: L64–70 | **HIGH** | HIPAA / PII in Logs |
| **SEC-F03** | Lỗ hổng IDOR cho phép cập nhật hồ sơ bệnh nhân ngoài phân công | `DoctorPatientController.java`: L110–117 | **HIGH** | Broken Access Control / IDOR |
| **SEC-F04** | Bác sĩ xem và tìm kiếm được toàn bộ bệnh nhân toàn viện | `DoctorPatientController.java`: L49–99 | **HIGH** | Broken Access Control / HIPAA |
| **SEC-F05** | IDOR & Vi phạm cô lập đa người thuê (Multi-Tenancy) trong Bulk Screening | `BulkScreeningController.java`: L67, 173–266 | **HIGH** | Multi-Tenancy Isolation / IDOR |
| **SEC-F06** | Trả về kết quả AI giả mạo âm thầm (Silent Mock Fallback) khi AI lỗi | `AiServiceClient.java`: L81–98 | **HIGH** | Medical Safety & System Integrity |
| **SEC-F07** | Bỏ qua kiểm tra nguồn gốc yêu cầu qua kiểm tra chuỗi `contains("localhost")` | `TrustedOriginFilter.java`: L37–38 | **MEDIUM** | Origin Validation Flaw / CSRF |
| **SEC-F08** | Kênh WebSocket STOMP thiếu Interceptor xác thực & phân quyền Subscribe | `WebSocketConfig.java`: L1–33 | **MEDIUM** | Real-time Access Control |
| **SEC-F09** | Nguy cơ CSV Formula Injection (CWE-1236) khi xuất báo cáo | `ClinicAnalyticsService.java`: L67–80<br/>`ClinicBatchProcessing.tsx`: L588–616 | **MEDIUM** | CSV Injection (CWE-1236) |
| **SEC-F10** | Hàm bóc tách thông tin DICOM Metadata (`stripDicomMetadataHeaders`) là hàm rỗng | `PatientAnonymizerService.java`: L74–80 | **MEDIUM** | HIPAA Safe Harbor De-identification |
| **SEC-F11** | Thiếu kiểm tra sở hữu ca khám khi xem phản hồi AI của bác sĩ | `DoctorFeedbackController.java`: L62–68 | **LOW** | Access Control |

---

## 3. CHI TIẾT TỪNG PHÁT HIỆN VÀ BIỆN PHÁP KHẮC PHỤC

### 3.1. SEC-F01 [CRITICAL]: Lộ cứng API Key Gemini trong mã nguồn và file cấu hình
- **Vị trí**:
  * `backend/src/main/resources/application.yml`: dòng 59:
    ```yaml
    api-key: ${GEMINI_API_KEY:sk-7b0cdba71ad7d98c-r1c29o-13878c62}
    ```
  * `backend/src/main/java/com/aura/screening/service/GeminiRetinalAiService.java`: dòng 32:
    ```java
    @Value("${aura.ai-service.gemini.api-key:sk-7b0cdba71ad7d98c-r1c29o-13878c62}")
    private String apiKey;
    ```
- **Hậu quả an ninh**: Khóa định danh API `sk-***8c62` bị lộ trực tiếp trong mã nguồn Git. Kẻ tấn công hoặc bất kỳ bên nào tiếp cận repository có thể sử dụng khóa để gọi mô hình Gemini, làm cạn kiệt hạn ngạch (quota exhaustion), phát sinh chi phí trái phép và gián đoạn dịch vụ AI chẩn đoán của toàn viện.
- **Biện pháp khắc phục**:
  1. **Lập tức thu hồi (Revoke)** khóa `sk-***8c62` tại nhà cung cấp / cổng 9router và phát hành khóa mới.
  2. Xóa bỏ giá trị fallback cứng trong `application.yml` thành: `api-key: ${GEMINI_API_KEY:}`.
  3. Xóa bỏ giá trị fallback cứng trong `GeminiRetinalAiService.java`: `@Value("${aura.ai-service.gemini.api-key:}")`.
  4. Cấu hình ứng dụng báo lỗi rõ ràng nếu biến môi trường `GEMINI_API_KEY` chưa được thiết lập trên môi trường sản xuất.

---

### 3.2. SEC-F02 [HIGH]: Ghi mã OTP dạng thô và PII người dùng vào log máy chủ
- **Vị trí**: `backend/src/main/java/com/aura/auth/service/OtpService.java`: dòng 64–70:
  ```java
  log.info("\n=======================================================\n"
      + "🔑 [AURA OTP SERVICE] MÃ XÁC THỰC EMAIL:\n"
      + "📧 Email: {}\n"
      + "👤 Người nhận: {}\n"
      + "🔢 Mã OTP (Hiệu lực 5 phút): {}\n"
      + "=======================================================",
      email, (fullName != null ? fullName : "Người dùng AURA"), otp);
  ```
- **Hậu quả an ninh**:
  * Vi phạm HIPAA và OWASP A09 (Security Logging Failures / CWE-532).
  * Trong hệ thống phân tán có log collector (ELK Stack, CloudWatch, Datadog), nhân viên vận hành hoặc bên thứ ba có quyền đọc log có thể đọc được mã OTP đang hoạt động để đăng nhập/đăng ký tài khoản trái phép mà không cần truy cập email người dùng.
  * In họ tên đầy đủ (`fullName`) và địa chỉ email bệnh nhân vi phạm chính sách cấm log PII.
- **Biện pháp khắc phục**:
  1. Loại bỏ việc in mã OTP thô ở mức `log.info`.
  2. Chỉ cho phép in OTP khi biến môi trường hoặc profile là `dev`/`local`.
  3. Che giấu email và PII khi log: `email.replaceAll("(^[^@]{2})(.*)(@.*$)", "$1***$3")`.

---

### 3.3. SEC-F03 [HIGH]: IDOR trong thao tác cập nhật thông tin bệnh nhân
- **Vị trí**: `backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java`: dòng 110–117:
  ```java
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Update patient profile")
  public ApiResponse<PatientProfileDto> updatePatient(
      @PathVariable UUID id, @RequestBody PatientProfile patient) {
    PatientProfileDto updated = profileService.updatePatient(id, patient);
    return ApiResponse.success("Cập nhật hồ sơ bệnh nhân thành công", updated);
  }
  ```
- **Hậu quả an ninh**:
  * Lỗ hổng Insecure Direct Object Reference (CWE-639 / OWASP A01).
  * Bất kỳ Bác sĩ hoặc Phòng khám nào cũng có thể gửi `PUT /api/v1/doctor/patients/{id}` với `id` là UUID của một bệnh nhân bất kỳ và ghi đè toàn bộ hồ sơ lâm sàng (`fullName`, `phone`, `systolicBp`, `diastolicBp`, `hba1c`, `hasDiabetes`, `riskScore`, `assignedDoctor`).
  * Không có bước kiểm tra xem bệnh nhân có thuộc quyền phụ trách của bác sĩ đó hay không.
- **Biện pháp khắc phục**:
  Bổ sung phương thức xác thực phân công trong `PatientProfileService` hoặc `@PreAuthorize`:
  ```java
  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN') || (hasRole('DOCTOR') && @patientAccessService.canDoctorAccessPatientProfile(principal, #id))")
  ```
  Trong service, kiểm tra `assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(...)` trước khi thực thi `updatePatient`.

---

### 3.4. SEC-F04 [HIGH]: Bác sĩ truy cập và tra cứu thông tin toàn bộ bệnh nhân trong hệ thống
- **Vị trí**: `backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java`: dòng 49–99:
  ```java
  @GetMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  public ApiResponse<?> getPatients(...) {
    if (page != null || size != null || search != null || ...) {
      // Gọi searchPatients không lọc theo doctorId!
      Page<PatientProfileDto> patientPage = profileService.searchPatients(
          search, risk, minScore, maxScore, hasDiabetes, hasHypertension, historyOfSmoking, doctorName, reviewStatus, pageable);
      return ApiResponse.success(PageResponse.from(patientPage));
    }
    ...
    // Fallback khi bác sĩ chưa có phân công:
    Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<PatientProfileDto> patientPage = profileService.searchPatients(null, ..., pageable);
    return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage));
  }
  ```
- **Hậu quả an ninh**:
  * Bác sĩ mở giao diện `DoctorPatientListPage` (mặc định gửi `page=0&size=10`) sẽ nhận được danh sách bệnh nhân của TOÀN BỘ hệ thống, bao gồm số điện thoại, tiền sử bệnh, kết quả khám của các bác sĩ khác.
  * Khi bác sĩ chưa có bệnh nhân nào, hệ thống trả về 100 bệnh nhân đầu tiên của toàn hệ thống.
  * Vi phạm nguyên tắc bảo mật tối thiểu (Least Privilege) và HIPAA Safe Harbor.
- **Biện pháp khắc phục**:
  Khi người dùng có vai trò `DOCTOR`, bắt buộc phải áp dụng điều kiện lọc phân công:
  - Lấy danh sách `assignedPatientIds` từ `DoctorPatientAssignmentRepository`.
  - Trong `PatientSpecification`, bổ sung `root.get("userId").in(assignedPatientIds)`.
  - Nếu danh sách phân công rỗng, trả về trang rỗng (`Page.empty()`), tuyệt đối không fallback trả về bệnh nhân toàn viện.

---

### 3.5. SEC-F05 [HIGH]: IDOR & Thiếu cô lập đa người thuê (Multi-Tenancy) trong Bulk Screening
- **Vị trí**: `backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java`:
  * Dòng 67–83: `createBulkBatchJob` lấy `request.clinicId()` từ JSON body thay vì lấy từ `principal.id()`.
  * Dòng 173–177: `listBatches` trả về `jobQueue.getAllBatches()` — toàn bộ batch của mọi phòng khám.
  * Dòng 182–266: Các API `getBatchStatus`, `getBatchRiskStatistics`, `getBatchAlerts`, `getBatchItemResult`, `cancelBatchJob` chỉ nhận `batchId` từ URL và không kiểm tra quyền sở hữu của phòng khám.
- **Hậu quả an ninh**:
  * Phòng khám A có thể xem danh sách lô khám, tiến độ xử lý, cảnh báo bệnh nhân nguy kịch và thông tin chi tiết từng ảnh khám của Phòng khám B.
  * Phòng khám A có thể gọi `POST /batch/{batchId}/cancel` để hủy ngang đợt khám của Phòng khám B (Denial of Service).
- **Biện pháp khắc phục**:
  1. Trong `createBulkBatchJob`, ép buộc `clinicId = principal.id()`.
  2. Trong `listBatches`, nếu không phải `ADMIN`, chỉ trả về các batch có `clinicId.equals(principal.id())`.
  3. Trong `getBatchStatus`, `cancelBatchJob`, v.v., kiểm tra quyền sở hữu batch trước khi xử lý:
     ```java
     if (!isAdmin(principal) && !batch.getClinicId().equals(principal.id())) {
         throw new AuthException(ErrorCode.ACCESS_DENIED, "Không có quyền truy cập đợt khám của phòng khám khác");
     }
     ```

---

### 3.6. SEC-F06 [HIGH]: Trả về kết quả AI giả mạo âm thầm (Silent Mock Fallback) khi có lỗi
- **Vị trí**: `backend/src/main/java/com/aura/bulk/service/AiServiceClient.java`: dòng 81–98:
  ```java
  } catch (Exception ex) {
      log.warn("[AI Client] Cloud Gemini API inference exception: {}", ex.getMessage());
  }

  // Fallback default safe metric if API temporary timeout
  return new AiInferenceResultDto(
          UUID.randomUUID().toString(),
          System.currentTimeMillis() - startTime,
          45,
          45,
          "MODERATE",
          ...
  );
  ```
- **Hậu quả an ninh & an toàn y khoa**:
  * Vi phạm Quy tắc An toàn Y khoa AURA Medical Safety Rule 3.1: *"Tuyệt đối cấm sử dụng Mock AI để tuyên bố hoàn thành tính năng. Nếu AI offline hoặc lỗi kết nối, hệ thống phải thông báo trạng thái FAILED / CHỜ XỬ LÝ LẠI, không được âm thầm trả về số liệu giả lập"*.
  * Nếu AI bị lỗi mạng hoặc quá tải, ca bệnh có tổn thương nguy kịch (CRITICAL) sẽ bị gán điểm giả lập 45 (MODERATE) và đánh dấu là COMPLETED, dẫn đến nguy cơ bỏ sót bệnh nhân đột quỵ/mù lòa (False Negative nghiêm trọng).
- **Biện pháp khắc phục**:
  Xóa bỏ khối fallback giả mạo. Ném ngoại lệ `AiServiceException` để `BulkProcessingWorker` bắt lỗi, cập nhật trạng thái item là `FAILED` và lưu thông báo lỗi rõ ràng để bác sĩ/kỹ thuật viên xử lý lại.

---

### 3.7. SEC-F07 [MEDIUM]: Lỗ hổng Bypass kiểm tra nguồn gốc yêu cầu (Origin Check Bypass)
- **Vị trí**: `backend/src/main/java/com/aura/auth/security/TrustedOriginFilter.java`: dòng 37–38:
  ```java
  boolean isLocal = origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1"));
  ```
- **Hậu quả an ninh**: Việc kiểm tra chuỗi con `origin.contains("localhost")` cho phép kẻ tấn công sở hữu tên miền như `https://attacker-localhost.com` hoặc `https://localhost.evil.org` vượt qua bộ lọc `TrustedOriginFilter`. Kẻ tấn công có thể thực hiện tấn công CSRF tới `/api/v1/auth/refresh` và `/api/v1/auth/logout`.
- **Biện pháp khắc phục**:
  Trích xuất hostname chuẩn từ URI và so sánh chính xác:
  ```java
  String host = URI.create(origin).getHost();
  boolean isLocal = "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host);
  ```

---

### 3.8. SEC-F08 [MEDIUM]: Kênh WebSocket STOMP thiếu Interceptor xác thực & phân quyền Subscribe
- **Vị trí**: `backend/src/main/java/com/aura/config/WebSocketConfig.java`: dòng 1–33
- **Hậu quả an ninh**:
  Frontend gửi `Authorization: Bearer <token>` trong khung STOMP `CONNECT`. Tuy nhiên, `WebSocketConfig.java` không triển khai `configureClientInboundChannel(ChannelRegistration registration)` với `ChannelInterceptor`. Bất kỳ client nào kết nối đều có thể gửi lệnh STOMP `SUBSCRIBE` tới topic `/topic/chat.{receiverId}` của người khác và nghe lén toàn bộ nội dung tin nhắn tư vấn y tế nhạy cảm.
- **Biện pháp khắc phục**:
  Thêm `ChannelInterceptor` vào `WebSocketConfig`:
  - Xác thực JWT token tại lệnh `StompCommand.CONNECT`.
  - Kiểm tra quyền truy cập đích đến (`destination`) tại lệnh `StompCommand.SUBSCRIBE`: đảm bảo người dùng chỉ được subscribe vào topic chat hoặc ca khám mà mình có quyền truy cập.

---

### 3.9. SEC-F09 [MEDIUM]: Nguy cơ CSV Formula Injection (CWE-1236) khi xuất báo cáo
- **Vị trí**:
  * `backend/src/main/java/com/aura/clinic/service/ClinicAnalyticsService.java`: dòng 67–80
  * `frontend/src/components/ClinicBatchProcessing.tsx`: dòng 588–616
- **Hậu quả an ninh**:
  - Tại backend `ClinicAnalyticsService.generateExportDataCsv`: Các trường `scanType`, `eyePosition` do người dùng nhập không được lọc các ký tự khởi đầu công thức (`=`, `+`, `-`, `@`, `\t`, `\r`).
  - Tại frontend `ClinicBatchProcessing.tsx`: Tên bệnh nhân `it.patientName`, tên file `it.fileName`, mã `it.mrn` chỉ được bọc trong dấu ngoặc kép `""` mà không thêm tiền tố `'`. Dấu ngoặc kép không vô hiệu hóa việc thực thi công thức trong Microsoft Excel.
  - Hậu quả: Kẻ tấn công đặt tên file hoặc tên bệnh nhân dạng `=cmd|'/c calc'!A0` để thực thi mã khi nhân viên y tế mở file CSV bằng Excel.
- **Biện pháp khắc phục**:
  Áp dụng chuẩn khử trùng `sanitizeCsvCell(val)` (như đã có tại `MedicalReportModal.tsx`): nếu chuỗi bắt đầu bằng `^[=+\-@\t\r]`, thêm ký tự `'` ở đầu chuỗi trước khi đóng gói CSV.

---

### 3.10. SEC-F10 [MEDIUM]: Xử lý bóc tách DICOM Metadata là hàm rỗng (No-op)
- **Vị trí**: `backend/src/main/java/com/aura/bulk/service/PatientAnonymizerService.java`: dòng 74–80:
  ```java
  public String stripDicomMetadataHeaders(String base64ImagePayload) {
      if (base64ImagePayload == null || base64ImagePayload.isBlank()) {
          return "";
      }
      return base64ImagePayload; // Trả về nguyên bản, không bóc tách gì!
  }
  ```
- **Hậu quả an ninh**: Tạo ảo tưởng an toàn (False Sense of Security). Tài liệu ghi tuân thủ HIPAA NFR-9/NFR-10, nhưng thực tế hàm trả về nguyên vẹn dữ liệu ảnh nhị phân DICOM chứa đầy đủ metadata PII (họ tên bệnh nhân, ngày sinh, cơ sở y tế).
- **Biện pháp khắc phục**:
  Triển khai giải mã nhị phân DICOM và bóc tách các tag nhóm `0x0010` (Patient Identification) hoặc chuyển đổi tệp DICOM sang PNG/JPEG thuần trước khi gửi đến AI.

---

### 3.11. SEC-F11 [LOW]: Thiếu kiểm tra sở hữu ca khám trong DoctorFeedbackController
- **Vị trí**: `backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java`: dòng 62–68
- **Hậu quả an ninh**: Bác sĩ có thể gọi `GET /api/v1/doctor/feedback/screening/{screeningId}` để đọc nhận xét và hiệu chỉnh lâm sàng của ca khám do bác sĩ khác phụ trách.
- **Biện pháp khắc phục**:
  Bổ sung `@PreAuthorize("hasRole('ADMIN') || (hasRole('DOCTOR') && @patientAccessService.canAccessScreening(principal, #screeningId))")`.

---

## 4. ĐÁNH GIÁ CÁC CƠ CHẾ BẢO MẬT ĐÃ TRIỂN KHAI TỐT

1. **Quản lý Refresh Token an toàn**:
   - Sử dụng `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth` cookie cho Refresh Token tại `AuthController.java`.
   - Frontend (`api.ts`, `AuthContext.tsx`) hoàn toàn không lưu trữ Refresh Token trong `localStorage`, ngăn chặn triệt để nguy cơ trộm token qua XSS.
2. **Bảo vệ XSS trên Frontend**:
   - Không sử dụng `dangerouslySetInnerHTML`, `innerHTML` hay `eval()` trong toàn bộ thư mục `frontend/src`.
   - Toàn bộ dữ liệu hiển thị (kết quả AI, tin nhắn chat, nhận xét bác sĩ) đều được React tự động encode HTML entity.
3. **Chữ ký số HMAC-SHA256 bất biến**:
   - Chữ ký số thẩm định lâm sàng được tạo lập hoàn toàn ở Backend trong `ScreeningService.createReviewSignature`, ngăn chặn giả mạo kết luận y khoa.
4. **Kiểm soát truy cập ca khám đơn lẻ**:
   - `ScreeningController.java` và `PatientAccessService.java` bảo vệ chặt chẽ quyền xem ca khám cá nhân và quyền ký duyệt chẩn đoán (`canAccessScreening`, `canReviewScreening`).
5. **Mật khẩu cơ sở dữ liệu**:
   - Mật khẩu được băm bằng BCrypt cost factor 10, đáp ứng tiêu chuẩn.

---

## 5. KẾT LUẬN & ĐIỀU KIỆN NGHIỆM THU

### 5.1. Quyết định thẩm định
**KHÔNG ĐẠT (FAILED / REJECTED)**

### 5.2. Căn cứ quyết định
Theo Quy chuẩn An ninh AURA và Tiêu chí Cổng Chất lượng An Ninh QG5:
> *"Một phiên bản chỉ được nghiệm thu khi có 0 lỗi ở mức CRITICAL và 0 lỗi ở mức HIGH chưa được giải quyết."*

Hiện tại hệ thống còn tồn đọng:
- **01 lỗi CRITICAL**: Lộ live API Key trong mã nguồn (`SEC-F01`).
- **04 lỗi HIGH**: Lộ OTP trong Log (`SEC-F02`), IDOR sửa hồ sơ bệnh nhân (`SEC-F03`), Rò rỉ bệnh nhân toàn viện cho bác sĩ (`SEC-F04`), IDOR và mất cô lập đa người thuê trong Bulk Screening (`SEC-F05`), Trả kết quả Mock AI âm thầm (`SEC-F06`).

### 5.3. Điều kiện để chuyển trạng thái DONE
1. Thu hồi ngay lập tức API key `sk-***8c62` và xóa bỏ hardcoded fallback trong cấu hình.
2. Khắc phục triệt để 04 lỗ hổng mức độ `HIGH` nêu trên.
3. Chạy lại bộ kiểm thử tự động xác minh không còn đường dẫn bypass phân quyền.
