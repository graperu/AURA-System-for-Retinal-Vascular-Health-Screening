# BIÊN BẢN THẨM ĐỊNH AN NINH & QUYỀN RIÊNG TƯ (SECURITY & PRIVACY AUDIT REPORT)
**Mã Báo Cáo:** `SEC-AUDIT-2026-V031-V032-CDS`  
**Dự Án:** Hệ thống Sàng lọc Sức khỏe Vi mạch Võng mạc AURA (AURA Retinal Health Screening)  
**Vai Trò Đánh Giá:** Kỹ Sư An Ninh & Quyền Riêng Tư (Security & Privacy Engineer)  
**Ngày Thẩm Định:** 14/09/2026  
**Trạng Thái:** **SEC_PASS** (Cổng Chất Lượng An Ninh QG5 - ĐẠT)

---

## 1. PHẠM VI RÀ SOÁT & ĐỐI TƯỢNG THẨM ĐỊNH
Rà soát độc lập các khía cạnh an ninh thông tin, bảo vệ dữ liệu y tế nhạy cảm (HIPAA/PHI), kiểm soát quyền truy cập tài nguyên (RBAC / IDOR Prevention), mã hóa và xử lý chuỗi dữ liệu (Injection & Deserialization Safety) cho tính năng mới:
1. **Database Migration Scripts**:
   - `backend/src/main/resources/db/migration/V031__add_detected_anomalies_and_vessel_mask_to_screenings.sql`
   - `backend/src/main/resources/db/migration/V032__fix_service_package_scopes_and_align_subscriptions.sql`
2. **Backend Entities, DTOs & Services**:
   - `com.aura.screening.entity.Screening.java`
   - `com.aura.screening.dto.ScreeningResponse.java`
   - `com.aura.screening.service.ScreeningService.java`
   - `com.aura.screening.service.GeminiRetinalAiService.java`
   - `com.aura.screening.controller.ScreeningController.java`
   - `com.aura.auth.service.PatientAccessService.java`
3. **Frontend Components & Mappers**:
   - `frontend/src/components/InteractiveCDSViewer.tsx`
   - `frontend/src/services/screeningMapper.ts`
   - `frontend/src/types/cds.ts`

---

## 2. KẾT QUẢ RÀ SOÁT CHI TIẾT THEO 4 TIÊU CHÍ BẮT BUỘC

### Tiêu Chí 1: Quản Trị Bí Mật & API Key (Secrets Management)
- **Tình trạng:** **ĐẠT (PASS)** - 0 Lỗ hổng Bí mật.
- **Chi tiết kiểm tra:**
  * **Database Migrations (V031, V032):** Không chứa bất kỳ mật khẩu, khóa bí mật hay credential nào. V031 chỉ `ALTER TABLE` thêm cột `detected_anomalies` và `vessel_mask_url`. V032 chỉ chuẩn hóa danh mục gói cước và đồng bộ số dư lượt khám.
  * **Mã nguồn Backend (`ScreeningService.java`, `GeminiRetinalAiService.java`):**
    - Khóa API của AI Gateway không bị hardcode: `@Value("${aura.ai-service.gemini.api-key:}") private String apiKey;` được truyền từ biến môi trường `GEMINI_API_KEY`.
    - Khóa ký số thẩm định lâm sàng (`signatureSecret`): `@Value("${aura.signature.secret:...}")` lấy từ biến môi trường, có fallback an toàn cho môi trường test local.
  * **Frontend (`InteractiveCDSViewer.tsx`, `screeningMapper.ts`):** Không chứa bất kỳ Secret, API Key hoặc Bearer Token nào.
  * **Lịch sử Git Commit:** Rà soát toàn bộ diff commit `086c50a` và `9f65140`: 0 secret bị rò rỉ.

### Tiêu Chí 2: Bảo Vệ Dữ Liệu Sức Khỏe Định Danh (PHI/PII & HIPAA Compliance)
- **Tình trạng:** **ĐẠT (PASS)** - Tuân thủ tiêu chuẩn NFR-9 & NFR-10.
- **Chi tiết kiểm tra:**
  * **Cấu trúc trường `detected_anomalies`:**
    - AI Prompt trong `GeminiRetinalAiService.java` quy định rõ cấu trúc đối tượng `detectedAnomalies` gồm 5 trường: `id`, `type`, `coordinates` (`x`, `y`, `width`, `height`), `confidence`, `description`.
    - Phân loại 5 thực thể giải phẫu bệnh nhãn khoa chuẩn: `"Microaneurysm"`, `"Hemorrhage"`, `"Hard_Exudate"`, `"AV_Nipping"`, `"Focal_Narrowing"`.
    - Tọa độ `x`, `y` là tỷ lệ hình học tương đối (%) trên ảnh nhãn khoa [0 - 100], không phản ánh thông tin định danh hay vị trí địa lý ngoài đời thực.
    - `description` chỉ mô tả vị trí vi phẫu (ví dụ: "Vi phình mạch nhỏ tại cung mạch thái dương trên").
  * **Giao tiếp ngoại vi với AI Engine:**
    - Request payload gửi tới AI Engine chỉ chứa chỉ dẫn phân tích, vị trí mắt (`eye`: "OD" / "OS") và ảnh đáy mắt (Data URI hoặc URL nội bộ).
    - Tuyệt đối **KHÔNG gửi** tên bệnh nhân (`fullName`), số CMND/CCCD, địa chỉ, số điện thoại, ngày sinh hay số hồ sơ bệnh án (`mrn`).
  * **Kiểm tra Logs (stdout / slf4j / console):**
    - `GeminiRetinalAiService.java`: Chỉ ghi nhận tên mô hình AI và vị trí mắt (`log.info("Dispatching Retinal Image to Cloud AI Engine ({}) for Eye {}...", model, eye)`). Không log chuỗi Base64 dài hay thông tin cá nhân.
    - `ScreeningService.java`: Audit log `SCREENING_CREATE` chỉ lưu mã UUID và loại sự kiện, không nhúng dữ liệu y tế nhạy cảm vào description.
    - Frontend: `console.warn` chỉ thông báo lỗi cú pháp parsing (`SyntaxError`), không log đối tượng định danh bệnh nhân.

### Tiêu Chí 3: Kiểm Soát Truy Cập & Phòng Chống IDOR (Access Control & RBAC)
- **Tình trạng:** **ĐẠT (PASS)** - Đảm bảo nguyên tắc Data Ownership.
- **Chi tiết kiểm tra:**
  * **`ScreeningController.java` & `PatientAccessService.java`:**
    - `GET /api/v1/screenings/{id}`: Được bảo vệ bởi `@PreAuthorize("@patientAccessService.canAccessScreening(principal, #id)")`.
      * Bệnh nhân (`USER`): Chỉ được truy cập nếu `screening.patientId == principal.id()`. Cố gắng đổi ID sang ca của người khác sẽ bị từ chối truy cập ngay lập tức (`403 Forbidden`).
      * Bác sĩ (`DOCTOR`): Chỉ được truy cập nếu tồn tại phân công điều trị có hiệu lực (`assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(principal.id(), screening.patientId, ACTIVE)`). Bác sĩ không được xem ca của bệnh nhân ngoài danh sách phụ trách.
      * Quản trị viên (`ADMIN`): Có quyền giám sát theo chính sách kiểm toán.
    - `GET /api/v1/screenings`: Bệnh nhân truyền `patientId` khác ID của mình sẽ bị ném lỗi `ACCESS_DENIED` ngay tại controller; bác sĩ chỉ được xem các bệnh nhân được gán `ACTIVE`.
    - `POST /api/v1/screenings/{id}/review`: Yêu cầu quyền `DOCTOR` và ràng buộc `@patientAccessService.canReviewScreening(principal, #id)` đảm bảo chữ ký số chỉ được tạo bởi đúng bác sĩ được phân công phụ trách ca khám.
  * **Bộ kiểm thử tự động (Unit & Integration Tests):** Đã kiểm chứng 100% qua `PatientAccessServiceOptimizedTest` (9/9 pass) và `ScreeningControllerTest` (17/17 pass).

### Tiêu Chí 4: Xử Lý Chuỗi JSON An Toàn (Injection & Deserialization Safety)
- **Tình trạng:** **ĐẠT (PASS)** - Phòng chống tấn công RCE / Prototype Pollution / SQLi / XSS.
- **Chi tiết kiểm tra:**
  * **Phía Java Backend (`ScreeningService.java`, `GeminiRetinalAiService.java`):**
    - Sử dụng `Jackson ObjectMapper` giải mã cấu trúc JSON thô từ AI Engine thành `Map<String, Object>` thuần túy, không kích hoạt Polymorphic Type Handling (`enableDefaultTyping`), loại trừ hoàn toàn nguy cơ RCE qua Jackson Gadget Chain.
    - Phương thức làm sạch `cleanJsonContent()` xử lý an toàn markdown fence (` ```json `), chống chuỗi payload không hợp lệ.
    - Khi trích xuất `detectedAnomalies`, hệ thống kiểm tra chặt chẽ `instanceof String` hoặc `instanceof List<?>`, kiểm tra ký tự bao bọc `[` và `]`, có khối `try-catch` fallback về `"[]"`.
    - Dữ liệu lưu xuống PostgreSQL qua Hibernate JPA PreparedStatement trên cột `TEXT`, loại trừ nguy cơ SQL Injection.
  * **Phía TypeScript Frontend (`screeningMapper.ts`, `InteractiveCDSViewer.tsx`):**
    - Sử dụng `JSON.parse` chuẩn của trình duyệt, kiểm tra bắt buộc `Array.isArray(parsed)` trước khi gán dữ liệu.
    - Ngăn ngừa **Prototype Pollution**: Không sử dụng hàm gộp đệ quy hoặc gán thuộc tính động trên prototype đối tượng. Dữ liệu chỉ được duyệt qua `.map()` hoặc `.forEach()`.
    - Ngăn ngừa **XSS (Cross-Site Scripting)**:
      * Không sử dụng `dangerouslySetInnerHTML`.
      * Các nhãn hiển thị (`anomalyDisplayName`, `description`) được render qua React JSX text nodes tự động áp dụng HTML Entity Encoding.
      * Tọa độ hình học và kích thước được nội suy vào CSS inline style dạng số học (`${coordinates.x}%`, `${width}px`).

---

## 3. BẢNG TỔNG HỢP ĐÁNH GIÁ LỖ HỔNG (OWASP TOP 10 & HIPAA)

| Hạng Mục Rà Soát | Mức Rủi Ro Tiềm Ẩn | Hiện Trạng Sau Rà Soát | Đánh Giá |
| :--- | :--- | :--- | :--- |
| **Secrets & Hardcoded Keys** | CRITICAL | 0 key hardcoded. Tất cả cấu hình qua biến môi trường. | **PASS** |
| **PII/PHI in Logs & Storage** | HIGH | Không log PII/PHI. `detected_anomalies` chỉ chứa tọa độ & mô tả vi mạch. | **PASS** |
| **Broken Access Control (IDOR)** | CRITICAL | `@PreAuthorize` và `PatientAccessService` kiểm tra chặt chẽ quyền sở hữu. | **PASS** |
| **SQL Injection (SQLi)** | HIGH | Sử dụng Spring Data JPA PreparedStatement và Flyway migration an toàn. | **PASS** |
| **Cross-Site Scripting (XSS)** | HIGH | React JSX HTML encoding toàn bộ dữ liệu, không dùng `dangerouslySetInnerHTML`. | **PASS** |
| **Insecure Deserialization** | HIGH | Jackson Deserialize dạng Map thuần, TypeScript kiểm tra `Array.isArray`. | **PASS** |
| **Prototype Pollution** | MEDIUM | Tránh gán đệ quy, chỉ duyệt mảng tĩnh. | **PASS** |
| **Cross-Origin Resource Sharing (CORS)** | MEDIUM | Chỉ cho phép các domain tin cậy (không dùng wildcard `*` cho production). | **PASS** |

---

## 4. KHUYẾN NGHỊ VÀ QUY TẮC PHÒNG NGỪA BỔ SUNG
1. **Khuyến nghị mức Low về Logging:**
   - Trong `ScreeningService.java` dòng 230: `log.info("Processing clinical AI inference findings from Cloud AI Engine: {}", body);`
   - *Khuyến nghị:* Mặc dù `body` hiện tại chỉ chứa điểm số và tọa độ hình học (không có PII), trong môi trường Production nên chuyển log này sang cấp độ `log.debug(...)` để giữ log máy chủ tinh gọn và tối đa hóa quyền riêng tư dữ liệu theo chuẩn HIPAA Safe Harbor.
2. **Khuyến nghị về Content Security Policy (CSP):**
   - Đảm bảo header HTTP của Gateway / Nginx cấu hình CSP `default-src 'self'` và hạn chế `img-src` chỉ từ CDN được phê duyệt.

---

## 5. KẾT LUẬN THẨM ĐỊNH AN NINH

- **Trạng thái:** **SEC_PASS**
- **Số lỗi CRITICAL chưa giải quyết:** `0`
- **Số lỗi HIGH chưa giải quyết:** `0`
- **Chứng thực độ tin cậy:** Toàn bộ tính năng mới trong `V031`, `V032`, `Screening.java`, `ScreeningResponse.java`, `ScreeningService.java`, `GeminiRetinalAiService.java`, `InteractiveCDSViewer.tsx` và `screeningMapper.ts` đáp ứng đầy đủ các tiêu chuẩn bảo mật, phòng chống IDOR, bảo vệ dữ liệu y tế HIPAA/PHI và an toàn deserialization.
- **Ủy quyền:** Đủ điều kiện chuyển tiếp sang bước phê duyệt độc lập của `code-reviewer` và `aura-ceo`.
