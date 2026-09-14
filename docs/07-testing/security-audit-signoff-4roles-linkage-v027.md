# BIÊN BẢN THẨM ĐỊNH AN NINH & QUYỀN RIÊNG TƯ (SECURITY & PRIVACY AUDIT REPORT)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL SCREENING SYSTEM)

**Mã thẩm định:** `AURA-SEC-2026-005`  
**Ngày thẩm định:** 14/09/2026  
**Chuyên gia thẩm định:** Kỹ Sư An Ninh & Quyền Riêng Tư AURA (Security & Privacy Engineer)  
**Phạm vi:** Đợt cập nhật liên kết dữ liệu 4 vai trò (USER, DOCTOR, CLINIC, ADMIN), Flyway Migration `V027`, và triệt tiêu Mock Data  
**Tiêu chuẩn đối chiếu:** OWASP Top 10:2021 (A01 - Broken Access Control, A02 - Cryptographic Failures, A03 - Injection, A09 - Security Logging and Monitoring Failures), HIPAA Safe Harbor (45 CFR § 164.514), NFR-9, NFR-10, Cổng Chất Lượng An Ninh QG5  
**Đánh giá rủi ro tổng thể:** **HIGH (CẦN KHẮC PHỤC TRƯỚC KHI TRIỂN KHAI PRODUCTION)**  

---

## 1. TỔNG QUAN KẾT QUẢ RÀ SOÁT THEO 4 NỘI DUNG YÊU CẦU

| Hạng mục | Đối tượng rà soát | Mức độ rủi ro | Trạng thái tuân thủ |
| :--- | :--- | :---: | :---: |
| **1. Migration V027** | BCrypt Hash, Ràng buộc Khóa ngoại (FK), Dữ liệu mồ côi | **LOW** | **PASS (Có khuyến nghị)** |
| **2.1. Phân quyền Screening** | Gán `doctorId` và `clinicId` trong `ScreeningService.java` | **MEDIUM** | **NEEDS REMEDIATION** |
| **2.2. Đa người thuê (Multi-Tenancy)** | Cô lập dữ liệu giữa các phòng khám trong `ClinicAnalyticsController` & `BulkScreeningController` | **HIGH** | **NEEDS REMEDIATION** |
| **2.3. Nhật ký kiểm toán** | Lưu vết `user_role`, `module` trong `AuditLogService.java`, rà soát rò rỉ PII/PHI & Secret | **LOW** | **PASS (Có khuyến nghị)** |
| **3. An ninh Giao diện Frontend** | WebSocket STOMP, Phòng chống XSS, Toàn vẹn Tên Bác sĩ & Chữ ký số điện tử | **LOW** | **PASS (Có khuyến nghị)** |

---

## 2. CHI TIẾT RÀ SOÁT TỪNG HẠNG MỤC

### 2.1. Rà soát Migration `V027__unify_4roles_data_linkage_and_bulk_persistence.sql`

#### A. Kiểm tra Hash Mật khẩu Tài khoản Hạt giống (Seed Accounts)
- **Thực tế kiểm tra:**
  - File migration `V027` không thực thi thao tác chèn hoặc sửa đổi cột mật khẩu của bảng `users`.
  - Các tài khoản hạt giống của 4 vai trò (`patient@aura.com`, `doctor@aura.com`, `clinic@aura.com`, `admin@aura.com`) được khởi tạo tại migration `V022` với chuỗi hash:
    `$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu`
- **Đánh giá thuật toán:**
  - Định dạng `$2a$`: Chuẩn thuật toán BCrypt.
  - Cost factor `10`: Tương đương $2^{10} = 1.024$ vòng băm, đáp ứng chính xác tiêu chuẩn an ninh dự án ($\ge 10$).
  - Sử dụng cơ chế `ON CONFLICT (id) DO UPDATE / DO NOTHING`, bảo đảm không ghi đè mật khẩu của người dùng thật nếu tài khoản đã tồn tại trong môi trường sản xuất.
- **Khuyến nghị an ninh:** Mật khẩu hạt giống phục vụ kiểm thử cục bộ/staging tuyệt đối không được sử dụng trên Production. Hệ thống phải kích hoạt cờ `must_change_password = true` khi triển khai chính thức.

#### B. Kiểm tra Toàn vẹn Khóa Ngoại (Foreign Keys) & Chống Rò Rỉ Dữ Liệu
- `doctor_profiles`:
  `user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE`
  $\rightarrow$ Ràng buộc `UNIQUE` đảm bảo quan hệ 1-1 chặt chẽ, không trùng lặp; `ON DELETE CASCADE` dọn dẹp sạch sẽ hồ sơ chuyên môn khi xóa tài khoản bác sĩ.
- `screenings.clinic_id`:
  `clinic_id UUID REFERENCES users(id) ON DELETE SET NULL`
  $\rightarrow$ Cơ chế `ON DELETE SET NULL` là thiết kế an toàn y khoa: khi một tài khoản phòng khám bị vô hiệu hóa hoặc xóa, ca khám võng mạc của bệnh nhân không bị xóa theo dây chuyền, bảo tồn toàn vẹn hồ sơ bệnh án.
- `screenings.batch_id`:
  Cột được tạo dưới dạng `UUID` độc lập kèm chỉ mục `idx_screenings_batch_id`, không có ràng buộc khóa ngoại cứng tới `bulk_screening_batches(id)`.
  $\rightarrow$ Thiết kế này giúp lỏng khớp (loose coupling), tránh lỗi cascade khi xử lý hàng loạt, tuy nhiên thiếu tính toàn vẹn tham chiếu ở tầng CSDL (được kiểm soát bởi tầng ứng dụng).
- `bulk_screening_batches` & `bulk_screening_items`:
  Có ràng buộc `ON DELETE CASCADE` chuẩn xác từ batch đến items.
- **Xóa bỏ dữ liệu mồ côi:**
  Câu lệnh `DELETE FROM patient_profiles WHERE user_id IS NULL;` đã loại bỏ hoàn toàn các hồ sơ bệnh nhân giả lập, ngăn chặn việc hiển thị dữ liệu rác trên danh sách công việc (worklist).
- **Lưu ý HIPAA Safe Harbor đối với `bulk_screening_items`:**
  Bảng `bulk_screening_items` có lưu `patient_name VARCHAR(150)` và `raw_mrn VARCHAR(64)` song song với `pseudonym_patient_id`. Nếu lô ảnh được tải lên phục vụ nghiên cứu hoặc xử lý ẩn danh, các trường PII/PHI này cần được mã hóa hoặc loại bỏ tại nguồn.

---

### 2.2. Rà soát Backend: Phân Quyền, IDOR và Cô Lập Đa Người Thuê (Multi-Tenancy)

#### A. Rà soát `ScreeningService.java` (Gán `doctorId` và `clinicId`)
1. **Cơ chế gán `doctorId`:**
   ```java
   var activeAssignments = assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE);
   if (activeAssignments != null && !activeAssignments.isEmpty()) {
       screening.setDoctorId(firstAssignment.getDoctor().getId());
   }
   ```
   - **Đánh giá:** **AN TOÀN (SAFE)**.
   - Bệnh nhân không thể truyền `doctorId` tùy ý từ client để gán cho bác sĩ khác. Hệ thống tự động truy vấn từ bảng phân công hợp lệ `doctor_patient_assignments`. Ngăn chặn hoàn toàn nguy cơ IDOR.
2. **Cơ chế gán `clinicId`:**
   ```java
   if (request.clinicId() != null) {
       screening.setClinicId(request.clinicId());
   }
   ```
   - **Đánh giá:** **RỦI RO TRUNG BÌNH (MEDIUM RISK)**.
   - Khi client gửi yêu cầu `POST /api/v1/screenings` kèm `clinicId`, hệ thống chấp nhận trực tiếp mà không kiểm tra xem bệnh nhân hoặc bác sĩ phụ trách có quan hệ thành viên/chỉ định với phòng khám đó hay không.
   - *Khuyến nghị:* Chỉ gán `request.clinicId()` nếu tồn tại liên kết hợp lệ giữa bệnh nhân/bác sĩ và phòng khám, hoặc chỉ cho phép hệ thống tự động suy ra qua bác sĩ phụ trách (`clinicMemberRepository.findByDoctorId(doctorId)`).

#### B. Rà soát `ClinicMemberService.java` & `ClinicAnalyticsService.java` (Nguy cơ rò rỉ dữ liệu giữa các phòng khám)
1. **Trong `ClinicMemberService.java`:**
   - Các phương thức `getMembers`, `addDoctor`, `removeDoctor` đều kiểm tra chặt chẽ quyền sở hữu `member.getClinic().getId().equals(clinicId)` và trạng thái phê duyệt `requireApprovedClinic`.
   - $\rightarrow$ Phòng khám không thể quản lý hoặc gỡ bác sĩ của phòng khám khác.
2. **LỖ HỔNG NGHIÊM TRỌNG TRONG `ClinicAnalyticsController.java` & `ClinicAnalyticsService.java`:**
   - **Phân loại lỗ hổng:** **CWE-284 (Improper Access Control) / OWASP A01:2021 - Broken Access Control / IDOR & Data Leakage (Mức độ: HIGH)**.
   - **Hiện trạng mã nguồn:**
     ```java
     // ClinicAnalyticsController.java
     @GetMapping("/campaigns")
     public ResponseEntity<Map<String, Object>> getCampaignAnalytics() {
         ...
         response.put("data", analyticsService.getCampaignAnalytics()); // Gọi hàm không tham số!
         return ResponseEntity.ok(response);
     }

     @GetMapping(value = "/export", produces = "text/csv")
     public ResponseEntity<String> exportData() {
         String csvData = analyticsService.generateExportDataCsv(); // Gọi hàm không tham số!
         ...
     }
     ```
     Trong `ClinicAnalyticsService.java`:
     ```java
     public static final UUID DEFAULT_CLINIC_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

     public Map<String, Object> getCampaignAnalytics() {
         return getCampaignAnalytics(DEFAULT_CLINIC_ID); // Hardcode!
     }

     public String generateExportDataCsv() {
         return generateExportDataCsv(DEFAULT_CLINIC_ID); // Hardcode!
     }
     ```
   - **Hậu quả an ninh:**
     * `ClinicAnalyticsController` không inject `@AuthenticationPrincipal AuraUserPrincipal principal`.
     * Khi bất kỳ tài khoản phòng khám nào (ví dụ Phòng khám B, Phòng khám C) đăng nhập và gọi API `/api/v1/clinic/analytics/campaigns` hoặc tải file xuất dữ liệu `/api/v1/clinic/analytics/export`, hệ thống luôn luôn trả về số liệu thống kê và tệp CSV chứa danh sách ca khám, mã bệnh nhân (`patientId`), mức độ nguy cơ, điểm rủi ro của **Phòng khám AURA mặc định (`33333333-...`)**.
     * Đây là vi phạm rò rỉ dữ liệu y tế nhạy cảm giữa các cơ sở khám chữa bệnh độc lập (Tenant Cross-Talk).
3. **LỖ HỔNG TRONG `SecurityConfig.java` LIÊN QUAN ĐẾN `bulk-screening`:**
   - **Phân loại:** **OWASP A01:2021 - Missing Function Level Access Control (Mức độ: HIGH)**.
   - **Hiện trạng:**
     `SecurityConfig.java` (dòng 85):
     `.requestMatchers("/api/v1/bulk-screening/**").permitAll()`
   - **Hậu quả an ninh:**
     * Toàn bộ API sàng lọc hàng loạt: `GET /api/v1/bulk-screening/batches`, `GET /api/v1/bulk-screening/batch/{batchId}`, `GET /api/v1/bulk-screening/batch/{batchId}/items/{itemId}` đều mở công khai không cần xác thực JWT.
     * Kẻ tấn công ẩn danh có thể liệt kê toàn bộ các đợt khám của các phòng khám và đọc thông tin chi tiết từng ảnh khám.

#### C. Rà soát `AuditLogService.java` (Lưu vết an ninh & Rò rỉ PII/PHI/Secrets)
- **Cấu trúc trường:**
  - Bổ sung `user_role VARCHAR(50)` và `module VARCHAR(64)` vào bảng `audit_logs` kèm chỉ mục truy vấn.
  - Entity `AuditLog` và DTO `AuditLogDto` đã ánh xạ chuẩn xác.
- **Sự kiện ghi nhật ký trong `ScreeningService.java`:**
  - Ghi nhận đầy đủ: `userId`, `userEmail`, `userRole = "USER"`, `module = "SCREENING"`, `action = "SCREENING_CREATE"`, `resourceType = "SCREENING"`, `resourceId = screening.getId()`.
- **Kiểm tra rò rỉ:**
  - Chuỗi `details` chỉ chứa thông báo trạng thái tĩnh: `"Tạo phiên sàng lọc võng mạc và thực thi phân tích AI thành công"`.
  - **Không chứa** mật khẩu, mã token JWT, API key của AI engine.
  - **Không chứa** họ tên thật, số điện thoại, số MRN hay chuỗi base64 của ảnh võng mạc.
  - $\rightarrow$ **ĐẠT TIÊU CHUẨN BẢO MẬT NHẬT KÝ KIỂM TOÁN (HIPAA & OWASP A09)**.
- **Cảnh báo bổ sung đối với `OtpService.java`:**
  - Dòng 64–70 của `OtpService.java` in mã OTP dạng thô ra `log.info`. Cần cấu hình ẩn mã OTP trên môi trường Production để ngăn chặn rò rỉ mã xác thực qua hệ thống thu thập log tập trung (ELK/Datadog).

---

### 2.3. Rà soát Frontend: WebSocket, XSS và Tính Toàn Vẹn Danh Tính / Chữ Ký Số

#### A. Rà soát Lỗ hổng XSS (Cross-Site Scripting)
- **Thực tế kiểm tra:**
  - Không phát hiện bất kỳ vị trí nào sử dụng `dangerouslySetInnerHTML` trong toàn bộ thư mục `frontend/src`.
  - Toàn bộ nội dung tin nhắn tư vấn (`msg.text`, `msg.senderName`), nhận xét bác sĩ (`doctorNotes`), kết luận AI (`findings`, `recommendations`) đều được React render trong các thẻ JSX tiêu chuẩn, tự động mã hóa thực thể HTML (HTML entity encoding).
- **Phòng chống CSV Formula Injection (CWE-1236):**
  - Trong `MedicalReportModal.tsx`, hàm `sanitizeCsvCell(val)` kiểm tra regex `/^[=+\-@\t\r]/` và tự động thêm dấu nháy đơn `'` trước các ký tự kích hoạt công thức tính toán. Đảm bảo an toàn tuyệt đối khi bác sĩ xuất báo cáo sang Excel.
- $\rightarrow$ **KẾT LUẬN: AN TOÀN (SAFE) TRƯỚC LỖ HỔNG XSS VÀ INJECTION**.

#### B. Rà soát Toàn Vẹn Chữ Ký Số Điện Tử (Digital Signature) & Danh Tính Bác Sĩ
- **Tạo lập chữ ký số:**
  - Chữ ký số HMAC-SHA256 được tạo lập **hoàn toàn ở tầng Backend** trong `ScreeningService.createReviewSignature()` bằng cách băm tập hợp bất biến:
    `screeningId | doctorId | decision | doctorNotes | adjustedCardioRisk | adjustedDrRisk | icd10Codes | signedAt`.
  - Frontend chỉ đóng vai trò hiển thị và in ấn (`result.digitalSignature`), hoàn toàn không có khả năng tự sinh hoặc giả mạo chữ ký số.
- **Tên hiển thị bác sĩ:**
  - Được ánh xạ từ dữ liệu xác thực thực tế trong cơ sở dữ liệu (`doctor_patient_assignments` $\rightarrow$ `User.fullName`).
  - Giao diện `PatientPortalPage.tsx` và `CDSDashboardPage.tsx` không cho phép người dùng tự ý ghi đè tên bác sĩ hoặc mã MRN qua API cập nhật hồ sơ (`PatientProfileService.updateProfile` loại trừ hoàn toàn các trường này).

#### C. Rà soát Kênh WebSocket STOMP (`websocketService.ts` & `WebSocketConfig.java`)
- **Điểm cần lưu ý:**
  - Frontend gửi khung STOMP `CONNECT` kèm header `Authorization: Bearer <token>`.
  - Tuy nhiên, tại Backend `WebSocketConfig.java`, chưa có cấu hình `ChannelInterceptor` trong `configureClientInboundChannel` để xác thực quyền đăng ký chủ đề (`/topic/chat.{receiverId}`).
  - *Khuyến nghị:* Bổ sung bộ chặn xác thực STOMP subscription để đảm bảo một người dùng kết nối WebSocket không thể tự ý đăng ký (subscribe) lắng nghe trộm chủ đề chat của cặp bác sĩ - bệnh nhân khác.

---

## 3. KHUYẾN NGHỊ VÁ LỖI AN NINH DÀNH CHO BACKEND LEAD

### Bản vá 1: Cô lập Đa Người Thuê trong `ClinicAnalyticsController.java` (Khắc phục lỗi HIGH)
Cần truyền `principal.id()` từ token xác thực vào Service thay vì gọi hàm không đối số:

```java
// Sửa đổi trong ClinicAnalyticsController.java:
@GetMapping("/campaigns")
@PreAuthorize("hasRole('CLINIC')")
public ResponseEntity<Map<String, Object>> getCampaignAnalytics(
    @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
        throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Phòng khám");
    }
    Map<String, Object> response = new HashMap<>();
    response.put("success", true);
    response.put("data", analyticsService.getCampaignAnalytics(principal.id()));
    return ResponseEntity.ok(response);
}

@GetMapping(value = "/export", produces = "text/csv")
@PreAuthorize("hasRole('CLINIC')")
public ResponseEntity<String> exportData(
    @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
        throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Phòng khám");
    }
    String csvData = analyticsService.generateExportDataCsv(principal.id());
    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aura_clinic_export.csv\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csvData);
}
```

### Bản vá 2: Siết chặt phân quyền Bulk Screening trong `SecurityConfig.java` (Khắc phục lỗi HIGH)
Chuyển đổi các endpoint bulk screening từ `permitAll()` sang yêu cầu xác thực vai trò `CLINIC` hoặc `ADMIN`:

```java
// Sửa đổi trong SecurityConfig.java:
// Thay thế:
// .requestMatchers("/api/v1/bulk-screening/**").permitAll()
// Bằng:
.requestMatchers("/api/v1/bulk-screening/**").hasAnyRole("CLINIC", "ADMIN")
```

---

## 4. KẾT LUẬN THẨM ĐỊNH AN NINH & ĐIỀU KIỆN NGHIỆM THU

1. **Đánh giá rủi ro tổng thể:** **HIGH**
   - Không có lỗ hổng mức `CRITICAL` đe dọa trực tiếp đến tính khả dụng hệ thống hoặc lộ mật mã gốc (secrets leak).
   - Tuy nhiên, tồn tại **02 lỗ hổng mức độ HIGH** liên quan đến kiểm soát truy cập (Broken Access Control) trong chức năng Phòng khám (`ClinicAnalyticsController` rò rỉ dữ liệu phân tích giữa các phòng khám) và phân quyền mở (`permitAll`) đối với API sàng lọc hàng loạt (`bulk-screening`).
2. **Quyết định thẩm định:** **CHƯA ĐẠT (CONDITIONAL REJECTION / NEEDS REMEDIATION)**
   - Theo tiêu chuẩn Cổng Chất Lượng An Ninh QG5 và Tiêu chí Hoàn thành (DONE): *"0 lỗi ở mức CRITICAL và 0 lỗi ở mức HIGH chưa được giải quyết"*.
   - Đợt cập nhật liên kết 4 vai trò chưa thể chuyển trạng thái **DONE** cho đến khi `backend-lead` áp dụng 2 bản vá nêu tại Mục 3.
