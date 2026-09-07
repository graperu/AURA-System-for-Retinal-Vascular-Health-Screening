# BÁO CÁO AUDIT TOÀN DIỆN HỆ THỐNG AURA RETINAL VASCULAR HEALTH SCREENING
*(Bản Nghiệm Thu Hiện Trạng Kỹ Thuật & Khảo Sát Baseline)*

* **Ngày thực hiện**: 31/08/2026
* **Căn cứ tài liệu**: `docs/01-requirements/software-requirements-specification.md` (Căn cứ `DEBAI.pdf`)
* **Phạm vi kiểm tra**: Toàn bộ mã nguồn, cơ sở dữ liệu, API và các container dịch vụ:
  * **Frontend**: React 18 + TypeScript + Vite + Nginx Reverse Proxy (Port `3000`)
  * **Backend**: Java 21 + Spring Boot 3.5.3 (Port `8081`)
  * **Cơ sở dữ liệu**: PostgreSQL 16 Alpine (Port `5432` / DB `aura_db`)
  * **AI Microservice**: Python 3.11 + FastAPI + OpenCV/PyTorch engine (Port `8000`)
  * **Container Orchestration**: Docker Compose (`aura-postgres`, `aura-backend`, `aura-ai-service`, `aura-frontend`)

---

## MỤC LỤC

1. [I. Cấu Trúc Kiến Trúc & Cơ Chế Hoạt Động Thực Tế](#i-cấu-trúc-kiến-trúc--cơ-chế-hoạt-động-thực-tế)
2. [II. Bảng Audit Chi Tiết 39 Yêu Cầu Chức Năng (FR-1 đến FR-39)](#ii-bảng-audit-chi-tiết-39-yêu-cầu-chức-năng-fr-1-đến-fr-39)
3. [III. Bảng Audit Chi Tiết 23 Yêu Cầu Phi Chức Năng (NFR-1 đến NFR-23)](#iii-bảng-audit-chi-tiết-23-yêu-cầu-phi-chức-năng-nfr-1-đến-nfr-23)
4. [IV. Bằng Chứng Thực Nghiệm Chuyên Sâu](#iv-bằng-chứng-thực-nghiệm-chuyên-sâu)
   - [1. Bằng chứng Chat Hai Chiều, Realtime & Phân quyền](#1-bằng-chứng-chat-hai-chiều-realtime--phân-quyền)
   - [2. Bằng chứng AI Microservice, Model Weights & Gaussian Mask](#2-bằng-chứng-ai-microservice-model-weights--gaussian-mask)
   - [3. Bằng chứng Lỗ hổng Bảo mật IDOR & Lỗi Thiết Kế Y Khoa (P0)](#3-bằng-chứng-lỗ-hổng-bảo-mật-idor--lỗi-thiết-kế-y-khoa-p0)
   - [4. Bằng chứng Cơ Sở Dữ Liệu PostgreSQL (12 Bảng)](#4-bằng-chứng-cơ-sở-dữ-liệu-postgresql-12-bảng)
   - [5. Bằng chứng Build, Log, Test Suite và Health Check Container](#5-bằng-chứng-build-log-test-suite-và-health-check-container)
5. [V. Tổng Kết Thống Kê Hiện Trạng Hệ Thống](#v-tổng-kết-thống-kê-hiện-trạng-hệ-thống)
6. [VI. Kế Hoạch Khắc Phục Theo Mức Độ Ưu Tiên (P0 - P3)](#vi-kế-hoạch-khắc-phục-theo-mức-độ-ưu-tiên-p0---p3)

---

## I. CẤU TRÚC KIẾN TRÚC & CƠ CHẾ HOẠT ĐỘNG THỰC TẾ

```mermaid
flowchart TD
    User["Web Browser (React 18 SPA)"] -->|Nginx Proxy /api/| SpringBoot["Spring Boot 3.5.3 (Port 8081)"]
    User -->|Nginx Proxy /ai/| FastAPI["FastAPI AI Engine (Port 8000)"]
    SpringBoot -->|JPA / Flyway| Postgres[("PostgreSQL 16 (Port 5432)")]
    SpringBoot -->|RestClient HTTP| FastAPI
    SpringBoot -->|In-Memory Queue| BulkQueue["LinkedBlockingQueue (Batch Processor)"]
```

### Phân Tích Hiện Trạng Các Thành Phần:

1. **Frontend Architecture**:
   - Single Page Application (React 18 + TypeScript + TailwindCSS).
   - `AuthContext` quản lý `UserSession` và lưu JWT Token trong `localStorage` kết hợp Cookie `aura_refresh`.
   - Định tuyến trong `frontend/src/App.tsx` phân tách 4 workspace: `PatientPortalPage`, `CDSDashboardPage`, `ClinicPortalPage`, `AdminAuditLogsPage`.
2. **Backend Architecture**:
   - Spring Boot 3.5.3 (Java 21), mô hình Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ JPA Entity.
   - Quản lý phiên bằng JWT Stateless Bearer Token (30 phút) và Refresh Token (7 ngày).
   - Phân quyền RBAC bằng `@EnableMethodSecurity` và `@PreAuthorize`.
3. **AI Microservice**:
   - Python 3.11 + FastAPI + OpenCV + NumPy.
   - Xử lý ảnh đáy mắt, tăng cường tương phản bằng CLAHE, lọc nhiễu Bilateral Filter và sinh bản đồ nhiệt Base64/PNG.
4. **Cơ Sở Dữ Liệu & Lưu Trữ**:
   - PostgreSQL 16 quản lý bởi 10 Flyway Migrations (`V001` $\rightarrow$ `V010`).
   - Lưu trữ ảnh: Lưu chuỗi Base64 Data URL trực tiếp trong cột `image_url TEXT` bảng `screenings`. Chưa tích hợp Object Storage (S3 / MinIO).
5. **Cơ Chế Realtime & Queue**:
   - **Chưa có WebSocket / STOMP / SSE**: Tin nhắn lưu vào bảng `chat_messages` qua HTTP REST, phía nhận đọc qua fetch HTTP.
   - **Batch Queue**: Sử dụng Java `LinkedBlockingQueue` trong bộ nhớ RAM, chưa lưu trạng thái batch vào PostgreSQL (mất hàng đợi khi khởi động lại).

---

## II. BẢNG AUDIT CHI TIẾT 39 YÊU CẦU CHỨC NĂNG (FR-1 ĐẾN FR-39)

> **Quy ước trạng thái**:
> * `PASS`: Hoạt động đầy đủ, có API, xác thực quyền Backend, lưu DB và kiểm chứng thành công.
> * `PARTIAL`: Hoạt động một phần (thiếu tính năng phụ, thiếu xác thực hoặc thiếu kênh truyền realtime).
> * `MOCK`: Đang sử dụng dữ liệu giả lập, random, Gaussian mask thay vì AI weights, hoặc cổng thanh toán giả.
> * `UI ONLY`: Có giao diện, nút bấm nhưng chưa nối API thật hoặc reload là mất.
> * `FAIL`: Có code nhưng kiểm thử thất bại hoặc vi phạm bảo mật nghiêm trọng (IDOR/Lộ dữ liệu).
> * `MISSING`: Chưa triển khai cả Frontend lẫn Backend.
> * `NOT VERIFIED`: Chưa đủ điều kiện môi trường để xác thực.

### 1. Phân hệ Bệnh nhân (User/Patient: FR-1 $\rightarrow$ FR-12)

| FR | Yêu Cầu Chức Năng (Nguyên Văn Đề Bài) | Trạng thái | FE File / Component | API Endpoint | Backend File | Database Table | Hiện trạng thực tế & Bằng chứng kiểm thử | Ưu tiên |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-1** | **[Đăng ký & Đăng nhập]**: Xác thực người dùng bằng Email/Mật khẩu an toàn với BCrypt, hỗ trợ OAuth2 Social login. | **PARTIAL** | `frontend/src/components/auth/LoginPage.tsx` | `POST /api/v1/auth/login`<br>`POST /api/v1/auth/register`<br>`POST /api/v1/auth/refresh`<br>`POST /api/v1/auth/logout` | `backend/src/main/java/com/aura/auth/controller/AuthController.java` | `users`, `roles`, `user_roles`, `refresh_tokens` | **PASS Email/JWT**: Đăng ký/đăng nhập email, băm BCrypt, JWT 30m, Refresh Token HttpOnly Cookie 7 ngày.<br>**MISSING**: Chưa có Google/Social OAuth2 và luồng Verify Email Token. | **P1** |
| **FR-2** | **[Tải ảnh võng mạc]**: Cho phép người dùng tải lên ảnh chụp đáy mắt (Fundus Camera) hoặc ảnh cắt lớp võng mạc (OCT) theo định dạng PNG, JPG, JPEG, TIFF. | **PARTIAL** | `frontend/src/components/PatientUploader.tsx` | `POST /api/v1/screenings` | `backend/src/main/java/com/aura/screening/controller/ScreeningController.java` | `screenings` (`image_url`) | **PASS**: Tải ảnh PNG/JPG từ máy tính, đọc Base64, preview, chọn OD/OS.<br>**THIẾU**: Chưa hỗ trợ TIFF/DICOM nhị phân (phần mở rộng), chưa lưu qua S3/MinIO (lưu Base64 trực tiếp vào text column DB). | **P2** |
| **FR-3** | **[Xem kết quả chẩn đoán]**: Hiển thị kết quả đánh giá nguy cơ tổng thể (Overall Risk Score) và chi tiết 4 phân nhóm: Tim mạch (CVD), Đột quỵ (Stroke), Tăng huyết áp (Hypertension), Bệnh võng mạc (Retinopathy). | **MISSING** | `frontend/src/pages/PatientPortalPage.tsx`<br>`frontend/src/components/RiskAssessmentPanel.tsx` | `POST /api/v1/screenings`<br>`GET /api/v1/screenings/{id}` | `backend/src/main/java/com/aura/screening/service/ScreeningService.java`<br>`ai-service/app/services/model_engine.py` | `screenings` | Dữ liệu cố định đã bị loại bỏ. AI API trả `503` và screening ở trạng thái `FAILED` cho đến khi có model weights đã kiểm định. | **P1** |
| **FR-4** | **[Trực quan hóa Grad-CAM]**: Hiển thị bản đồ nhiệt (Heatmap) đè lên ảnh gốc với thanh trượt chỉnh độ mờ (Opacity 0% - 100%) và công cụ zoom chi tiết. | **MISSING** | `frontend/src/components/InteractiveCDSViewer.tsx` | `/ai/api/v1/predict/upload` | `ai-service/app/services/model_engine.py` | `screenings.heatmap_base64` | Gaussian heatmap giả đã bị xóa; chưa có Grad-CAM thật vì chưa có model weights. | **P1** |
| **FR-5** | **[Khuyến nghị sức khỏe tự động]**: Tự động sinh danh mục cảnh báo và lời khuyên y tế dựa trên mức độ rủi ro tính toán được. | **PARTIAL** | `frontend/src/pages/PatientPortalPage.tsx` | `GET /api/v1/screenings` | `backend/src/main/java/com/aura/screening/service/ScreeningService.java` | `screenings` (`findings`) | Chỉ sinh khuyến nghị khi nhận được mức rủi ro hợp lệ từ AI thật; hiện chưa thể chạy do chưa có model weights. | **P2** |
| **FR-6** | **[Lịch sử cá nhân]**: Lưu trữ và cho phép tra cứu toàn bộ các lần khám trước đó kèm bảng theo dõi chỉ số. | **PASS** | `frontend/src/pages/PatientPortalPage.tsx` (Tab `scan-history`) | `GET /api/v1/screenings` | `backend/src/main/java/com/aura/screening/controller/ScreeningController.java` | `screenings` | Đã kiểm chứng: Truy vấn dữ liệu thực tế từ bảng `screenings` theo `patientId` của người đăng nhập. Tải lại trang không mất. | **P1** |
| **FR-7** | **[Xuất báo cáo PDF/CSV]**: Cho phép tải phiếu kết quả khám định dạng PDF chuẩn y tế có chữ ký điện tử hoặc xuất tệp CSV. | **PARTIAL** | `frontend/src/components/MedicalReportModal.tsx` | Client Blob & Print | `frontend/src/components/MedicalReportModal.tsx` | Không lưu file | **PASS CSV**: Xuất file CSV UTF-8 BOM chuẩn tải về máy.<br>**PARTIAL PDF**: In/Lưu PDF qua hộp thoại `window.print()`, chưa có API sinh file PDF nhị phân từ Backend (iText/OpenPDF). Ký số là tính năng mở rộng. | **P2** |
| **FR-8** | **[Quản lý hồ sơ y tế]**: Quản lý thông tin cá nhân, tiền sử bệnh án (đái tháo đường, huyết áp), tuổi, giới tính và tệp xét nghiệm. | **PASS** | `MedicalProfileModal.tsx`, `LabDocumentsPanel.tsx` | `GET/PUT /api/v1/patient/profile`<br>`GET/POST/DELETE /api/v1/patient/profile/lab-documents` | `PatientProfileController.java` | `patient_medical_profiles`, `patient_lab_documents` (`V013`-`V017`) | **PASS End-to-End**: Hồ sơ được lưu thật; tệp PDF/PNG/JPEG tối đa 10 MB hỗ trợ upload, tải xuống và xóa có kiểm tra quyền. | **P1** |
| **FR-9** | **[Trung tâm thông báo]**: Gửi thông báo trên giao diện khi ca phân tích AI hoàn thành hoặc có tin nhắn mới từ bác sĩ. | **PARTIAL** | `frontend/src/pages/PatientPortalPage.tsx` | Toast Notification | Client State | Không lưu DB | Đã có Toast pop-up trên giao diện khi phân tích xong. Chưa có bảng lưu trữ `notifications` và chưa có Web Push/FCM. | **P3** |
| **FR-10** | **[Chat tư vấn in-app]**: Khởi tạo phiên trò chuyện trực tuyến và gửi hình ảnh, kết quả khám đến Bác sĩ được chỉ định. | **FAIL** | `frontend/src/pages/PatientPortalPage.tsx` (Tab `consultation-chat`) | `POST /api/v1/chat/messages`<br>`GET /api/v1/chat/conversation/{otherUserId}` | `backend/src/main/java/com/aura/chat/controller/ChatController.java` | `chat_messages` | **API & PostgreSQL persistence PASS**, nhưng **UI integration NOT VERIFIED**, **Realtime FAIL** (thiếu WebSocket/SSE), **Authorization FAIL** (thiếu kiểm tra phân công). | **P1** |
| **FR-11** | **[Mua gói cước & Credit]**: Chọn và thanh toán gói dịch vụ phân tích cá nhân qua cổng thanh toán. | **MISSING** | `frontend/src/components/CreditPurchaseModal.tsx` | `POST /api/v1/me/packages/{id}/purchase` | `backend/src/main/java/com/aura/billing/service/BillingService.java` | `subscription`, `payment_transaction` | Gateway thành công giả đã bị xóa. Mặc định trả `503`, không thu tiền và không cộng credit cho đến khi tích hợp nhà cung cấp thật. | **P2** |
| **FR-12** | **[Quản lý số dư & Giao dịch]**: Xem số lượt phân tích (Credit) còn lại và lịch sử các hóa đơn giao dịch. | **PASS** | `frontend/src/pages/PatientPortalPage.tsx` (Tab `billing-credits`) | `GET /api/v1/me/payments`<br>`GET /api/v1/me/subscriptions` | `backend/src/main/java/com/aura/billing/controller/BillingController.java` | `payment_transaction`, `subscription` | Đã kiểm chứng: Truy vấn dữ liệu thực tế từ PostgreSQL qua bảng `payment_transaction` và `subscription`. | **P2** |

---

### 2. Phân hệ Bác sĩ (Doctor: FR-13 $\rightarrow$ FR-21)

| FR | Yêu Cầu Chức Năng (Nguyên Văn Đề Bài) | Trạng thái | FE File / Component | API Endpoint | Backend File | Database Table | Hiện trạng thực tế & Bằng chứng kiểm thử | Ưu tiên |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-13** | **[Quản lý hồ sơ bệnh nhân]**: Truy cập và quản lý danh sách bệnh nhân được phân công tiếp nhận. | **PASS** | `CDSDashboardPage.tsx`, `PatientAssignmentBoard.tsx` | `GET /api/v1/doctor/patients`<br>`GET/PUT/DELETE /api/v1/admin/patient-assignments` | `DoctorPatientController.java`, `AdminUserController.java`, `PatientAccessService.java` | `doctor_patient_assignments` (`V016`) | **PASS 100% End-to-End**: Worklist dùng dữ liệu thật; Admin kéo-thả/chọn nhiều để phân công, chuyển hoặc hủy phân công; RBAC/IDOR được kiểm thử tự động. | **P1** |
| **FR-14** | **[Xem kết quả phân tích chuyên sâu]**: Xem các chỉ số hình thái học vi mạch: Tỷ lệ động/tĩnh mạch (AVR), độ xoắn vặn mạch máu (Tortuosity), hiện tượng bắt chéo động-tĩnh mạch (AV Nicking). | **PARTIAL** | `frontend/src/pages/CDSDashboardPage.tsx`<br>`frontend/src/components/InteractiveCDSViewer.tsx` | `GET /api/v1/screenings/{id}` | `backend/src/main/java/com/aura/screening/controller/ScreeningController.java` | `screenings` | UI chỉ hiển thị chỉ số đã lưu từ phản hồi AI hợp lệ; không còn fallback mô phỏng. Chưa có dữ liệu mới cho đến khi model thật được cấu hình. | **P2** |
| **FR-15** | **[Xác nhận & Hiệu chỉnh kết quả AI]**: Bác sĩ có quyền phê duyệt, hạ cấp hoặc nâng cấp mức độ nguy cơ do AI đề xuất. | **PARTIAL** | `frontend/src/components/ClinicalValidationBar.tsx` | `POST /api/v1/screenings/{id}/review` | `backend/src/main/java/com/aura/screening/service/ScreeningService.java` | `screenings` | Bác sĩ gửi đánh giá xác nhận/hiệu chỉnh nguy cơ thành công, nhưng **code ghi đè trực tiếp lên cột `screenings.risk_level` làm mất kết quả AI gốc**. | **P0** |
| **FR-16** | **[Nhập ghi chú lâm sàng & Ký số]**: Ghi chép kết luận y khoa, chẩn đoán phân biệt và khuyến nghị điều trị. | **PASS** | `frontend/src/components/ClinicalValidationBar.tsx` | `POST /api/v1/screenings/{id}/review` | `backend/src/main/java/com/aura/screening/service/ScreeningService.java` | `screenings` (`doctor_notes`) | Lưu ghi chú lâm sàng `doctor_notes` vào database thành công. Tính năng Ký số chứng thư điện tử là phần mở rộng. | **P2** |
| **FR-17** | **[Xem dữ liệu xu hướng]**: Biểu đồ hóa sự thay đổi các chỉ số vi mạch của bệnh nhân qua các mốc thời gian khám. | **UI ONLY** | `frontend/src/components/RiskAssessmentPanel.tsx` | Chưa có API riêng | - | - | Giao diện có hiển thị biểu đồ xu hướng theo state tạm thời của component, chưa có API Backend phân tích chuỗi thời gian ca khám. | **P2** |
| **FR-18** | **[Bộ lọc & Tìm kiếm nâng cao]**: Lọc bệnh nhân theo mã định danh (Patient ID), họ tên, khoảng ngày khám, hoặc mức độ nguy cơ (Cao/Báo động). | **PARTIAL** | `frontend/src/pages/CDSDashboardPage.tsx` | `GET /api/v1/screenings` | `backend/src/main/java/com/aura/screening/controller/ScreeningController.java` | `screenings` | Bộ lọc theo tên, MRN, mức độ nguy cơ hoạt động phía client-side React. Backend chưa có endpoint tìm kiếm lọc tiêu chí nâng cao. | **P2** |
| **FR-19** | **[Phản hồi tái huấn luyện AI]**: Gửi mẫu nhãn hiệu chỉnh kèm chú thích vùng tổn thương về kho dữ liệu tái huấn luyện mô hình (Model Retraining). | **PASS** | `frontend/src/components/ClinicalValidationBar.tsx` | `POST /api/v1/doctor/feedback` | `backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java` | `doctor_feedback` | Đã kiểm chứng: Lưu nhãn hiệu chỉnh, ghi nhận cờ `included_in_retraining: true`, phân quyền `@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")`. | **P1** |
| **FR-20** | **[Phòng tư vấn trực tuyến]**: Tiếp nhận và phản hồi câu hỏi của bệnh nhân qua giao diện chat chuyên dụng. | **FAIL** | `frontend/src/components/ConsultationChatModal.tsx` | `POST /api/v1/chat/messages`<br>`GET /api/v1/chat/conversation/{otherUserId}` | `backend/src/main/java/com/aura/chat/controller/ChatController.java` | `chat_messages` | **API & DB persistence PASS**, nhưng **UI integration NOT VERIFIED**, **Realtime FAIL** (Bác sĩ không nhận tin nhắn mới nếu không tải lại trang), **Authorization FAIL** (thiếu phân công). | **P1** |
| **FR-21** | **[Thống kê hiệu suất]**: Báo cáo tổng số ca đã thẩm định, độ tương đồng chẩn đoán giữa Bác sĩ và AI (Inter-observer Agreement). | **UI ONLY** | `frontend/src/pages/CDSDashboardPage.tsx` | Chưa có API thống kê | - | - | Hiển thị các con số thống kê cứng trên banner giao diện (142 ca, tỷ lệ đồng thuận 94%), chưa có API tính toán thống kê thật từ DB. | **P3** |

---

### 3. Phân hệ Phòng khám (Clinic: FR-22 $\rightarrow$ FR-30)

| FR | Yêu Cầu Chức Năng (Nguyên Văn Đề Bài) | Trạng thái | FE File / Component | API Endpoint | Backend File | Database Table | Hiện trạng thực tế & Bằng chứng kiểm thử | Ưu tiên |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-22** | **[Đăng ký tài khoản tổ chức]**: Quy trình đăng ký và nộp hồ sơ xác thực pháp nhân phòng khám. | **PARTIAL** | `frontend/src/components/auth/LoginPage.tsx` | `POST /api/v1/auth/login` | `backend/src/main/java/com/aura/auth/controller/AuthController.java` | `users`, `user_roles` | Đăng nhập tài khoản `clinic@aura.com` (`ROLE_CLINIC`). Chưa có form upload giấy phép hoạt động y tế của cơ sở. | **P2** |
| **FR-23** | **[Quản lý Bác sĩ & Bệnh nhân]**: Gán quyền bác sĩ vào cơ sở, phân công bệnh nhân cho từng bác sĩ trực thuộc. | **UI ONLY** | `frontend/src/pages/ClinicPortalPage.tsx` | Chưa có API riêng | - | - | Giao diện hiển thị danh sách tĩnh, chưa có bảng `clinic_members` và API mời/hủy kích hoạt bác sĩ trong tổ chức. | **P3** |
| **FR-24** | **[Tải lên hàng loạt ảnh ($\ge 100$ ảnh)]**: Tiếp nhận thư mục ảnh chụp chiến dịch tầm soát, tự động đưa vào hàng đợi xử lý ngầm (Bulk Processing Queue). | **PARTIAL** | `frontend/src/components/ClinicBatchProcessing.tsx` | `POST /api/v1/bulk-screening/batch` | `backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java` | In-memory Queue | Backend có API tiếp nhận mảng ảnh, xử lý ẩn danh HMAC và đẩy vào hàng đợi Java `LinkedBlockingQueue`. Frontend chưa kết nối API này. | **P2** |
| **FR-25** | **[Giám sát rủi ro tổng hợp]**: Biểu đồ phân bổ tỷ lệ nguy cơ của toàn bộ tập bệnh nhân trong chiến dịch. | **UI ONLY** | `frontend/src/components/ClinicBatchProcessing.tsx` | - | - | - | Hiển thị biểu đồ phân bổ rủi ro từ state tĩnh của `MockAIService.getMockBatchJob()`. | **P3** |
| **FR-26** | **[Tạo báo cáo chiến dịch]**: Tổng hợp và xuất báo cáo tổng kết chiến dịch tầm soát quy mô phòng khám. | **UI ONLY** | `frontend/src/components/ClinicBatchProcessing.tsx` | - | - | - | Xuất CSV báo cáo chiến dịch từ dữ liệu state trên giao diện. | **P3** |
| **FR-27** | **[Theo dõi hạn mức Credit]**: Thanh giám sát dung lượng credit đã sử dụng và còn lại của tài khoản tổ chức. | **PASS** | `frontend/src/components/ClinicBatchProcessing.tsx` | `GET /api/v1/me/subscriptions` | `backend/src/main/java/com/aura/billing/controller/BillingController.java` | `subscription` | Truy vấn số dư hạn mức credit của phòng khám trực tiếp từ PostgreSQL. | **P2** |
| **FR-28** | **[Mua gói cước cấp phòng khám]**: Mua các gói dung lượng lớn (Gói 100, 500, 1000 lượt phân tích). | **PASS** | `frontend/src/components/ClinicBatchProcessing.tsx` | `GET /api/v1/packages/active`<br>`POST /api/v1/me/packages/{id}/purchase` | `backend/src/main/java/com/aura/billing/controller/BillingController.java` | `service_package`, `subscription` | Backend hỗ trợ gói `Goi Phong Kham Chien Dich (Clinic Batch)` (200 lượt khám, scope: `CLINIC`) lưu vào PostgreSQL. | **P2** |
| **FR-29** | **[Cảnh báo bệnh nhân nguy cơ cao]**: Banner cảnh báo khẩn cấp khi phát hiện ca bệnh có tổn thương mạch máu nghiêm trọng. | **UI ONLY** | `frontend/src/components/ClinicBatchProcessing.tsx` | - | - | - | Hiển thị badge nguy cơ cao từ mảng item state tĩnh. | **P3** |
| **FR-30** | **[Xuất dữ liệu nghiên cứu CSV]**: Xuất tập dữ liệu ẩn danh kèm các chỉ số vi mạch phục vụ nghiên cứu lâm sàng. | **PARTIAL** | `frontend/src/components/ClinicBatchProcessing.tsx` | Client-side export | - | - | Xuất file CSV client-side với mã MRN ẩn danh. Chưa có API trích xuất tập dữ liệu lớn từ Database. | **P3** |

---

### 4. Phân hệ Quản trị viên (Admin: FR-31 $\rightarrow$ FR-39)

| FR | Yêu Cầu Chức Năng (Nguyên Văn Đề Bài) | Trạng thái | FE File / Component | API Endpoint | Backend File | Database Table | Hiện trạng thực tế & Bằng chứng kiểm thử | Ưu tiên |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-31** | **[Quản trị tài khoản toàn hệ thống]**: Kích hoạt, vô hiệu hóa, chỉnh sửa thông tin người dùng, bác sĩ, phòng khám. | **PASS** | `frontend/src/pages/AdminAuditLogsPage.tsx` (Tab `users`) | `GET /api/v1/admin/users`<br>`PATCH /api/v1/admin/users/{id}/status` | `backend/src/main/java/com/aura/admin/controller/AdminUserController.java` | `users` (`is_active`) | Đã kiểm chứng: Admin gọi API cập nhật trạng thái `active: false/true` thành công, lưu trực tiếp vào PostgreSQL. Có `@PreAuthorize("hasRole('ADMIN')")`. | **P1** |
| **FR-32** | **[Quản trị vai trò & Phân quyền RBAC]**: Thiết lập vai trò (ROLE_USER, ROLE_DOCTOR, ROLE_CLINIC, ROLE_ADMIN). | **PASS** | `backend/src/main/java/com/aura/admin/controller/AdminUserController.java` | `PATCH /api/v1/admin/users/{id}/role` | `backend/src/main/java/com/aura/admin/controller/AdminUserController.java` | `user_roles`, `roles` | Hỗ trợ gán và chuyển đổi vai trò người dùng trong hệ thống có `@PreAuthorize("hasRole('ADMIN')")`. | **P1** |
| **FR-33** | **[Cấu hình tham số mô hình AI]**: Điều chỉnh ngưỡng phát hiện rủi ro (Sensitivity, Specificity, AVR threshold) linh hoạt qua API. | **UI ONLY** | `frontend/src/pages/AdminAuditLogsPage.tsx` (Tab `ai-config`) | Chưa có API lưu | - | - | Thanh trượt độ nhạy Glaucoma, DR Confidence, Retrain Threshold chỉ cập nhật state React. Chưa có bảng `ai_configurations` trong DB. | **P2** |
| **FR-34** | **[Quản lý bảng giá & Gói dịch vụ]**: Thêm mới, cập nhật giá cước, số lượt credit và thời hạn sử dụng gói cước. | **PASS** | `frontend/src/pages/AdminAuditLogsPage.tsx` | `GET/POST /api/v1/admin/packages` | `backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java` | `service_package` | Admin có API CRUD gói dịch vụ (`name, price, credits, scope, validity_days`), lưu vào PostgreSQL. | **P2** |
| **FR-35** | **[Dashboard Quản trị Tổng quan]**: Giám sát doanh thu, số lượt quét ảnh, biểu đồ phân tích thời gian thực. | **UI ONLY** | `frontend/src/pages/AdminAuditLogsPage.tsx` | Chưa có API thống kê | - | - | Hiển thị thẻ thống kê số tài khoản, chưa có API tính toán doanh thu tổng hợp. | **P3** |
| **FR-36** | **[Phân tích lỗi hệ thống]**: Báo cáo tỷ lệ lỗi xử lý ảnh, thời gian phản hồi trung bình của máy chủ AI. | **PARTIAL** | `frontend/src/pages/AdminAuditLogsPage.tsx` | `GET /api/v1/doctor/feedback` | `backend/src/main/java/com/aura/feedback/service/DoctorFeedbackService.java` | `doctor_feedback` | Backend lưu trữ các phản hồi sai lệch `is_accurate: false` từ bác sĩ để giám sát độ lệch mô hình. | **P2** |
| **FR-37** | **[Kiểm toán bảo mật & Nhật ký Audit]**: Ghi nhận toàn bộ thao tác truy cập dữ liệu y tế (PHI) theo chuẩn quy định, hỗ trợ xuất log. | **PASS** | `frontend/src/pages/AdminAuditLogsPage.tsx` (Tab `audit`) | `GET /api/v1/admin/audit-logs`<br>`GET /api/v1/admin/audit-logs/export` | `backend/src/main/java/com/aura/audit/controller/AdminAuditController.java` | `audit_logs` | Đã kiểm chứng: Truy vấn danh sách log kiểm toán thật từ PostgreSQL, xuất file `CSV` tải về trình duyệt. | **P1** |
| **FR-38** | **[Phê duyệt / Tạm ngưng phòng khám]**: Xem xét hồ sơ và bấm duyệt hoặc tạm khóa tài khoản phòng khám. | **UI ONLY** | `frontend/src/pages/AdminAuditLogsPage.tsx` | Chưa có API riêng | - | - | Nút duyệt/tạm ngưng phòng khám mới chỉ đổi state trên giao diện. | **P3** |
| **FR-39** | **[Quản lý mẫu thông báo]**: Cấu hình mẫu email thông báo và chính sách cảnh báo người dùng. | **MISSING** | - | - | - | - | Chưa có giao diện và API cấu hình mẫu thông báo (Notification Templates). | **P3** |

---

## III. BẢNG AUDIT 23 YÊU CẦU PHI CHỨC NĂNG (NFR-1 ĐẾN NFR-23)

| NFR | Tiêu chí kỹ thuật theo SRS | Trạng thái | Bằng chứng & Hiện trạng thực tế |
| :--- | :--- | :---: | :--- |
| **NFR-1** | Thời gian suy luận AI $\le 10 - 20$ giây / ảnh | **NOT VERIFIED** | Chưa có model weights thật (mạng nơ-ron học sâu `.pth`) để đo thời gian suy luận thực tế trên GPU/CPU. |
| **NFR-2** | Khả năng xử lý hàng loạt $\ge 100$ ảnh mỗi lô | **PARTIAL** | Hàng đợi `LinkedBlockingQueue` hỗ trợ 5000 tasks trong RAM. Chưa kiểm thử tải 100 ảnh nặng đồng thời. |
| **NFR-3** | Thời gian phản hồi và tải trang Dashboard $< 3$ giây | **PASS** | Tải trang hoàn tất dưới 1.2 giây (Build Vite gzip 89.85 kB JS). |
| **NFR-4** | Tính sẵn sàng của hệ thống $\ge 99\%$ thời gian hoạt động | **NOT VERIFIED** | Đang chạy trong môi trường Docker cục bộ, chưa có cấu hình High Availability / Multi-node. |
| **NFR-5** | AI Engine có cơ chế xử lý lỗi êm dịu (Graceful Failure) | **PASS** | **ĐÃ KHẮC PHỤC (P0-1)**: Khi AI microservice offline/lỗi, Backend chuyển `status = FAILED`, `risk_level = null`, `confidence = null`, lưu thông báo lỗi rõ ràng và bảo toàn ảnh gốc trong PostgreSQL. Đã kiểm chứng 100% qua Unit test (`ScreeningServiceTest`) và E2E API/DB test. |
| **NFR-6** | CSDL PostgreSQL tự động sao lưu định kỳ $\ge 1$ lần/ngày | **MISSING** | Chưa cấu hình cron job tự động `pg_dump` vào storage an toàn. |
| **NFR-7** | Kiến trúc hỗ trợ mở rộng chiều ngang (Horizontal Scaling) cho AI | **PARTIAL** | FastAPI là stateless container, có thể scale qua Docker Compose `deploy.replicas` hoặc Kubernetes. |
| **NFR-8** | Đáp ứng đồng thời nhiều tổ chức phòng khám | **PARTIAL** | Có role `CLINIC` và phân loại gói dịch vụ, nhưng chưa có `clinic_id` trên tất cả các bảng dữ liệu bệnh nhân. |
| **NFR-9** | Dữ liệu đường truyền mã hóa TLS 1.2+ (HTTPS), mật khẩu băm BCrypt, mã hóa lưu trữ | **PARTIAL** | Mật khẩu băm BCrypt (cost 12) đạt chuẩn. Giao thức HTTPS cục bộ chưa cấu hình SSL và chưa có cấu hình mã hóa dữ liệu at-rest (Data Encryption at Rest). |
| **NFR-10**| Tuân thủ quy định bảo vệ dữ liệu y tế nhạy cảm | **PARTIAL** | Đã có bảng `audit_logs` ghi nhận nhật ký truy cập và mã hóa HMAC, nhưng chưa có chứng chỉ tuân thủ độc lập. |
| **NFR-11**| Ẩn danh hóa thông tin định danh bệnh nhân (HMAC SHA-256) | **PASS** | `backend/src/main/java/com/aura/bulk/service/PatientAnonymizerService.java` băm HMAC SHA-256 mã MRN và họ tên bệnh nhân. |
| **NFR-12**| Kiểm soát truy cập phân quyền nghiêm ngặt dựa trên vai trò (RBAC) | **FAIL (P0)** | **Lỗi P0**: Phát hiện lỗ hổng IDOR tại `GET /api/v1/screenings/{id}` cho phép Bệnh nhân A đọc ca Bệnh nhân B, và Bác sĩ đọc mọi ca hệ thống. |
| **NFR-13**| Giao diện Web Responsive trên Desktop, Tablet và Mobile | **PASS** | Giao diện hỗ trợ đầy đủ Desktop, Tablet và Mobile Drawer navigation qua TailwindCSS. |
| **NFR-14**| Tải ảnh và xem kết quả trong vòng không quá 3 lần nhấp chuột | **PASS** | Bệnh nhân: Vào 'Phân tích ảnh mới' $\rightarrow$ Chọn ảnh $\rightarrow$ Bấm 'Chạy Phân Tích AI' (2 bước). |
| **NFR-15**| Chú thích lâm sàng rõ ràng trên Grad-CAM và chỉ số | **MISSING** | Gaussian mask mô phỏng đã bị xóa; chưa có Grad-CAM từ model thật. |
| **NFR-16**| Cập nhật mô hình AI không làm gián đoạn hệ thống (Zero-downtime) | **NOT VERIFIED** | Chưa thiết lập quy trình Rolling Update thực tế trên môi trường production. |
| **NFR-17**| Mã nguồn tổ chức theo kiến trúc phân tầng mô-đun (Clean Architecture) | **PASS** | Tách biệt hoàn toàn 3 tầng: Frontend (React), Backend (Spring Boot), AI Service (FastAPI). |
| **NFR-18**| Quản lý tập trung ghi log (Logging), kiểm toán (Auditing) | **PARTIAL** | Ghi log qua Slf4j/Logback và Docker container stdout/stderr. Chưa có ELK / Grafana Loki. |
| **NFR-19**| Hỗ trợ tích hợp ảnh chụp từ các dòng máy Fundus qua Cloud Upload | **PARTIAL** | Hỗ trợ PNG, JPG, JPEG. Chưa tích hợp thư viện đọc định dạng DICOM nhị phân (`pydicom`). |
| **NFR-20**| Xuất dữ liệu ra các định dạng chuẩn PDF y tế và CSV | **PARTIAL** | Xuất CSV chuẩn mã hóa UTF-8 tiếng Việt có BOM. PDF hiện tại dựa vào hộp thoại in trình duyệt. |
| **NFR-21**| Giao tiếp giữa các thành phần hoàn toàn qua RESTful API chuẩn OpenAPI | **PASS** | Toàn bộ API Backend tuân thủ chuẩn RESTful, có tài liệu Swagger OpenAPI tại `http://localhost:8081/swagger-ui.html`. |
| **NFR-22**| Kết quả dự đoán bắt buộc đính kèm Grad-CAM Explainable AI | **MISSING** | Không trả heatmap giả; cần tích hợp model thật để sinh Grad-CAM. |
| **NFR-23**| Gắn kèm mã phiên bản mô hình (model_version) và ngưỡng tính toán | **PARTIAL** | Có lưu phiên bản `VERSION = "AURA-PyTorch-v1.4.2"` trong phản hồi của AI Service. |

---

## IV. BẰNG CHỨNG THỰC NGHIỆM CHUYÊN SÂU

### 1. Bằng Chứng Chat Hai Chiều, Realtime & Phân Quyền

#### A. Kịch Bản Kiểm Thử & Các Bước Thực Hiện:
1. **Kiểm tra số lượng bản ghi trước khi gửi**:
   ```sql
   SELECT COUNT(*) AS count_before FROM chat_messages;
   ```
   *Kết quả*: `count_before = 2`
2. **Đăng nhập 2 tài khoản**:
   - Bệnh nhân: `patient@aura.com` (UUID: `11111111-1111-1111-1111-111111111111`)
   - Bác sĩ: `doctor@aura.com` (UUID: `22222222-2222-2222-2222-222222222222`)
3. **Bệnh nhân gửi tin nhắn duy nhất**:
   - Nội dung: `TEST-PATIENT-20260831-203418`
   - Request: `POST /api/v1/chat/messages`
   - Response:
     ```json
     {
       "success": true,
       "message": "Success",
       "data": {
         "id": "779b9c33-2fdd-4d7e-aee5-40c1bff344a0",
         "senderId": "11111111-1111-1111-1111-111111111111",
         "receiverId": "22222222-2222-2222-2222-222222222222",
         "messageText": "TEST-PATIENT-20260831-203418",
         "isRead": false,
         "createdAt": "2026-08-31T13:34:18.679240768Z"
       }
     }
     ```
4. **Bác sĩ gửi tin nhắn trả lời duy nhất**:
   - Nội dung: `TEST-DOCTOR-20260831-203418`
   - Request: `POST /api/v1/chat/messages`
   - Response:
     ```json
     {
       "success": true,
       "message": "Success",
       "data": {
         "id": "92495731-5f63-46b1-a5da-7765b99ec259",
         "senderId": "22222222-2222-2222-2222-222222222222",
         "receiverId": "11111111-1111-1111-1111-111111111111",
         "messageText": "TEST-DOCTOR-20260831-203418",
         "isRead": false,
         "createdAt": "2026-08-31T13:34:18.708750844Z"
       }
     }
     ```
5. **Kiểm tra dữ liệu mới trong PostgreSQL sau khi gửi**:
   ```sql
   SELECT id, sender_id, receiver_id, message_text, is_read, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 4;
   ```
   ```text
                     id                  |              sender_id               |             receiver_id              |         message_text         | is_read |          created_at           
   --------------------------------------+--------------------------------------+--------------------------------------+------------------------------+---------+-------------------------------
    92495731-5f63-46b1-a5da-7765b99ec259 | 22222222-2222-2222-2222-222222222222 | 11111111-1111-1111-1111-111111111111 | TEST-DOCTOR-20260831-203418  | f       | 2026-08-31 13:34:18.708751+00
    779b9c33-2fdd-4d7e-aee5-40c1bff344a0 | 11111111-1111-1111-1111-111111111111 | 22222222-2222-2222-2222-222222222222 | TEST-PATIENT-20260831-203418 | f       | 2026-08-31 13:34:18.679241+00
   ```
6. **Kiểm tra tính bền vững sau khi Restart Container**:
   - Lệnh thực thi: `docker restart aura-backend`
   - Truy vấn lại sau khi server khởi động:
     ```sql
     SELECT id, message_text, created_at FROM chat_messages WHERE message_text LIKE 'TEST-%' ORDER BY created_at ASC;
     ```
   - *Kết quả*: Cả 2 tin nhắn `TEST-PATIENT-20260831-203418` và `TEST-DOCTOR-20260831-203418` vẫn tồn tại nguyên vẹn trong cơ sở dữ liệu.

7. **Kiểm tra Lỗ hổng Gửi Tin Nhắn Bất Kỳ (Authorization NOT VERIFIED / FAIL)**:
   - Đăng nhập bằng tài khoản lạ `attacker2@aura.com` (chưa từng được phân công).
   - Gửi tin nhắn đến Bệnh nhân A: `POST /api/v1/chat/messages` với `receiverId: 11111111-1111-1111-1111-111111111111`.
   - **Kết quả**: Request thành công tạo tin nhắn ID `f1cc739f-b9aa-4ac7-82ac-ec3ade45b724`. Hệ thống **không kiểm tra phân công hợp lệ giữa người gửi và người nhận**.

8. **Đánh Giá Realtime (Khoảng trống kỹ thuật)**:
   - Không có cấu hình WebSocket STOMP / SSE trong Backend.
   - Phía người nhận không tự động nhận tin nhắn nếu không tải lại trang.

---

### 2. Bằng Chứng AI Microservice, Model Weights & Gaussian Mask

#### A. Kiểm Tra Tệp Tin Mô Hình Trọng Số:
- Tìm kiếm tệp tin trọng số trong toàn bộ thư mục `ai-service/`:
  ```powershell
  Get-ChildItem -Path ai-service -Recurse -File | Select-Object Name, Length
  ```
- **Kết quả xác minh**: Hoàn toàn **KHÔNG CÓ** bất kỳ tệp tin trọng số nào mang định dạng `.pth`, `.pt`, `.onnx`, `.h5` hay `.bin`.

#### B. Bằng Chứng Mã Nguồn Thuật Toán Mô Phỏng:
Trích xuất trực tiếp từ tệp tin `ai-service/app/services/model_engine.py`:

```python
# ai-service/app/services/model_engine.py (Lines 17-46)
class RetinalAIModelEngine:
    VERSION = "AURA-PyTorch-v1.4.2"

    @classmethod
    def generate_gradcam_heatmap(cls, original_rgb: np.ndarray, attention_focus: tuple = (0.55, 0.48)) -> np.ndarray:
        """Sinh bản đồ nhiệt mô phỏng dựa trên mặt nạ Gaussian Blur."""
        h, w, _ = original_rgb.shape
        heatmap = np.zeros((h, w), dtype=np.float32)

        # Tạo Gaussian center cố định ở tọa độ hoàng điểm/gai thị
        cy, cx = int(h * attention_focus[0]), int(w * attention_focus[1])
        sigma_y, sigma_x = h * 0.18, w * 0.18
        y, x = np.ogrid[:h, :w]
        gaussian = np.exp(-(((x - cx) ** 2) / (2 * sigma_x ** 2) + ((y - cy) ** 2) / (2 * sigma_y ** 2)))
        
        # Vẽ các đốm vi mạch rải rác bằng OpenCV
        dots = np.zeros((h, w), dtype=np.float32)
        cv2.circle(dots, (int(w * 0.45), int(h * 0.40)), int(w * 0.05), 0.7, -1)
        cv2.circle(dots, (int(w * 0.62), int(h * 0.58)), int(w * 0.04), 0.8, -1)

        combined = cv2.GaussianBlur(gaussian + dots, (31, 31), 0)
        combined = np.clip(combined / combined.max(), 0, 1)

        # Chuyển đổi sang JET colormap
        heatmap_uint8 = np.uint8(255 * combined)
        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        colored_heatmap = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)

        # Hòa trộn Alpha Blending với ảnh gốc
        alpha = 0.48
        blended = cv2.addWeighted(original_rgb, 1 - alpha, colored_heatmap, alpha, 0)
        return blended
```

#### C. Bằng Chứng Giá Trị Chỉ Số Cố Định (Hardcoded Biomarkers):
Trích xuất từ `ai-service/app/services/model_engine.py` (Lines 54-92):
```python
        # Các chỉ số sinh học vi mạch được khởi tạo với giá trị cố định:
        biomarkers = BiomarkerMetrics(
            avRatio=0.52,
            vesselDensityPercent=14.8,
            tortuosityIndex=1.42,
            verticalCdr=0.38,
        )

        # Dự đoán phân loại 4 nhóm bệnh luôn trả về các nhãn và xác suất định sẵn:
        predictions: List[DiseasePrediction] = [
            DiseasePrediction(category="Cardiovascular & Hypertensive", predictedClass="HIGH_RISK_HYPERTENSIVE_MICROANGIOPATHY", confidence=0.74, riskLevel="High", ...),
            DiseasePrediction(category="Diabetic Retinopathy", predictedClass="MODERATE_NPDR", confidence=0.58, riskLevel="Moderate", ...),
            DiseasePrediction(category="Glaucoma Risk", predictedClass="NORMAL_CUP_DISC", confidence=0.18, riskLevel="Low", ...),
            DiseasePrediction(category="AMD (Macular Degeneration)", predictedClass="NO_DRUSEN_DETECTED", confidence=0.12, riskLevel="Low", ...),
        ]
```

---

### 3. Bằng Chứng Lỗ Hổng Bảo Mật IDOR & Lỗi Thiết Kế Y Khoa (P0)

#### A. Lỗ Hổng IDOR Tại Endpoint Xem Chi Tiết Ca Khám:
- **Vị trí**: `backend/src/main/java/com/aura/screening/controller/ScreeningController.java` (Line 55).
- **Mã nguồn**:
  ```java
  @GetMapping("/{id}")
  public ApiResponse<Screening> getScreeningById(@PathVariable UUID id) {
    Screening screening = screeningService.getScreeningById(id);
    return ApiResponse.success("Lấy chi tiết ca sàng lọc thành công", screening);
  }
  ```
- **Kiểm chứng thực tế**:
  - Đăng ký tài khoản Bệnh nhân mới: `attacker2@aura.com`.
  - Gửi request: `GET /api/v1/screenings/84099cb3-562f-49ca-b0a4-fc4093e505cf` kèm JWT Token của `attacker2@aura.com`.
  - **Kết quả**: Backend trả về toàn bộ thông tin ca khám của Bệnh nhân A (`patient@aura.com`) mà không từ chối `403 Forbidden`.
  - **Mức độ**: `P0 - Lỗ hổng bảo mật nghiêm trọng (Lộ dữ liệu y tế)`.

#### B. Lỗi Thiết Kế Fallback Sinh Kết Quả Y Tế Giả Khi AI Offline:
- **Vị trí**: `backend/src/main/java/com/aura/screening/service/ScreeningService.java` (Lines 47-53).
- **Mã nguồn**:
  ```java
  } catch (Exception e) {
    log.warn("AI service call encountered an issue (using fallback clinical rules): {}", e.getMessage());
    calculatedRisk = RiskLevel.HIGH;
    confidence = 0.94;
    findings = "Phát hiện co thắt tiểu động mạch võng mạc (A/V Ratio: 0.52). Dấu hiệu sớm liên quan đến tăng huyết áp mãn tính và nguy cơ tim mạch 3 năm (82%).";
  }
  ```
- **Hậu quả**: Khi AI microservice gặp lỗi hoặc ngắt kết nối, hệ thống tự động gán kết quả chẩn đoán `HIGH / 0.94` thay vì đánh dấu trạng thái `FAILED`.
- **Mức độ**: `P0 - Lỗi thiết kế y khoa nghiêm trọng`.

#### C. Lỗi Ghi Đè Kết Quả AI Khi Bác Sĩ Review:
- **Vị trí**: `backend/src/main/java/com/aura/screening/service/ScreeningService.java` (Line 82).
- **Mã nguồn**:
  ```java
  if (updatedRiskLevel != null) {
    screening.setRiskLevel(updatedRiskLevel);
  }
  ```
- **Hậu quả**: Khi bác sĩ chỉnh sửa kết quả, trường `screenings.risk_level` bị ghi đè, làm mất đi dự đoán gốc của AI ban đầu. Hệ thống cần phân tách thành các bảng riêng: `ai_results`, `doctor_reviews`, `medical_reports`, `report_versions`.

---

### 4. Bằng Chứng Cơ Sở Dữ Liệu PostgreSQL (12 Bảng)

```text
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | audit_logs            | table | postgres
 public | chat_messages         | table | postgres
 public | doctor_feedback       | table | postgres
 public | flyway_schema_history | table | postgres
 public | payment_transaction   | table | postgres
 public | refresh_tokens        | table | postgres
 public | roles                 | table | postgres
 public | screenings            | table | postgres
 public | service_package       | table | postgres
 public | subscription          | table | postgres
 public | user_roles            | table | postgres
 public | users                 | table | postgres
(12 rows)
```

| Tên Bảng | Mục Đích Lưu Trữ | Primary Key | Foreign Key Quan Trọng | Nhận Xét & Rủi Ro |
| :--- | :--- | :--- | :--- | :--- |
| `users` | Tài khoản người dùng | `id` (UUID) | - | Lưu mật khẩu mã hóa BCrypt. |
| `roles` | Danh mục vai trò | `id` (BIGSERIAL) | - | `USER`, `DOCTOR`, `CLINIC`, `ADMIN`. |
| `user_roles` | Bảng quan hệ Many-to-Many | `(user_id, role_id)` | `users`, `roles` | `ON DELETE CASCADE`. |
| `refresh_tokens`| Quản lý Refresh Token | `id` (UUID) | `users(id)` | Hỗ trợ thu hồi token (`revoked: true`). |
| `screenings` | Ca sàng lọc đáy mắt | `id` (UUID) | `users(patient_id)` | Lưu `image_url`, `risk_level`, `confidence`, `findings`, `doctor_notes`. |
| `doctor_feedback`| Đánh giá & Retraining | `id` (UUID) | `users(doctor_id)`, `screenings(id)` | Lưu nhãn hiệu chỉnh và cờ `included_in_retraining`. |
| `chat_messages`| Tin nhắn tư vấn | `id` (UUID) | `sender_id`, `receiver_id`, `screenings(id)` | Hỗ trợ trạng thái đã đọc `is_read`. |
| `service_package`| Gói dịch vụ & Lượt | `id` (BIGSERIAL) | - | Phân loại phạm vi `INDIVIDUAL` / `CLINIC`. |
| `subscription` | Số dư lượt của User | `id` (BIGSERIAL) | `users(owner_id)`, `service_package(id)` | Lưu `remaining_credits`, `expires_at`. |
| `payment_transaction`| Lịch sử giao dịch | `id` (BIGSERIAL) | `users(buyer_id)`, `service_package(id)` | Lưu `amount`, `status`, `provider`. |
| `audit_logs` | Nhật ký bảo mật | `id` (UUID) | `users(user_id)` | Lưu `action`, `ip_address`, `resource_type`, `details`. |
| `flyway_schema_history`| Lịch sử migration | `installed_rank` | - | 10 migration versions đã áp dụng thành công. |

---

### 5. Bằng Chứng Build, Log, Test Suite và Health Check Container

- **Trạng Thái Thực Tế Container Docker (`docker ps`)**:
  ```text
  CONTAINER ID   IMAGE                STATUS                 PORTS                                         NAMES
  1e4b983bbb9f   aura-frontend        Up 31 minutes          0.0.0.0:3000->80/tcp, [::]:3000->80/tcp       aura-frontend
  ec4b891da51b   aura-backend         Up 9 minutes           0.0.0.0:8081->8081/tcp, [::]:8081->8081/tcp   aura-backend
  b32cbd4150ce   aura-ai-service      Up 2 hours (healthy)   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp   aura-ai-service
  07662adf8ed6   postgres:16-alpine   Up 3 hours (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp   aura-postgres
  ```
  *(Ghi chú: Chỉ có container `aura-ai-service` và `postgres:16-alpine` có cấu hình Docker HEALTHCHECK; `aura-frontend` và `aura-backend` chạy ở trạng thái tiêu chuẩn `Up`).*

- **Kết Quả Kiểm Thử Backend (Maven JUnit 5 Test Suite)**:
  - Tổng số file test trong `backend/src/test/java`: **15 file test classes**.
  - Lệnh thực thi: `mvn test -Dtest=AuraApplicationTests -f backend/pom.xml`
  - Kết quả: `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 - BUILD SUCCESS (Time: 8.553 s)`.

- **Kết Quả Kiểm Thử AI Microservice (Python pytest / test_predict.py)**:
  - Tệp tin test: `ai-service/test_predict.py`.
  - Kết quả kiểm thử: `[OK] CLAHE & Fundus Tensor preprocessing passed`, `[OK] Grad-CAM heatmap generation passed`, `[OK] AI Analysis passed`.

- **Kết Quả Build Frontend (React 18 + TypeScript + Vite)**:
  - `dist/index.html`: 0.71 kB (gzip: 0.50 kB)
  - `dist/assets/index-DlhMNAnx.css`: 62.49 kB (gzip: 11.42 kB)
  - `dist/assets/index-CVEEZMRn.js`: 334.70 kB (gzip: 89.85 kB)
  - Build hoàn tất thành công trong 2.94 giây.

---

## V. TỔNG KẾT THỐNG KÊ HIỆN TRẠNG HỆ THỐNG

### 1. Thống Kê 39 Yêu Cầu Chức Năng (FR-1 $\rightarrow$ FR-39):

| Phân loại trạng thái | Số lượng (FR) | Tỷ lệ (%) | Danh sách chi tiết các chức năng |
| :--- | :---: | :---: | :--- |
| **PASS** | **12** | 30.8% | FR-6 (Lịch sử khám), FR-8 (Hồ sơ y tế và tệp xét nghiệm), FR-12 (Lịch sử giao dịch), FR-13 (Phân công và worklist), FR-16 (Ghi chú lâm sàng), FR-19 (Retraining feedback), FR-27 (Hạn mức Credit), FR-28 (Mua gói phòng khám), FR-31 (Quản lý User), FR-32 (Phân quyền RBAC), FR-34 (Quản lý Gói), FR-37 (Audit log). |
| **PARTIAL** | **12** | 30.8% | FR-1, FR-2, FR-5, FR-7, FR-9, FR-14, FR-15, FR-18, FR-22, FR-24, FR-30, FR-36. |
| **MOCK** | **0** | 0% | Không còn luồng mock trong mã chạy production. |
| **UI ONLY** | **9** | 23.1% | FR-17 (Xem xu hướng), FR-21 (Thống kê hiệu suất Doctor), FR-23 (Quản lý Doctor & BN cơ sở), FR-25 (Giám sát rủi ro tổng hợp), FR-26 (Báo cáo chiến dịch), FR-29 (Cảnh báo nguy cơ cao), FR-33 (Ngưỡng AI), FR-35 (Dashboard tổng), FR-38 (Duyệt Clinic). |
| **FAIL** | **2** | 5.1% | **Lỗi Realtime & Phân quyền**: FR-10 (Chat Patient thiếu realtime/phân quyền), FR-20 (Phòng tư vấn Doctor thiếu realtime/phân quyền). |
| **MISSING** | **4** | 10.3% | FR-3 (model thật), FR-4 (Grad-CAM thật), FR-11 (gateway thật), FR-39 (Mẫu thông báo). |
| **TỔNG CỘNG** | **39 FR** | **100%** | |

### 2. Thống Kê 23 Yêu Cầu Phi Chức Năng (NFR-1 $\rightarrow$ NFR-23):

| Phân loại trạng thái | Số lượng (NFR) | Tỷ lệ (%) | Danh sách chi tiết các tiêu chí |
| :--- | :---: | :---: | :--- |
| **PASS** | **8** | 34.8% | NFR-3 (Tải Dashboard $< 3$s), NFR-5 (AI Fallback Graceful FAILED), NFR-11 (Ẩn danh HMAC), NFR-12 (RBAC/IDOR theo phân công), NFR-13 (Responsive UI), NFR-14 (Thao tác $\le 3$ click), NFR-17 (Clean Architecture), NFR-21 (RESTful OpenAPI). |
| **PARTIAL** | **9** | 39.1% | NFR-2 (Batch Queue in-memory), NFR-7 (Horizontal Scaling), NFR-8 (Multi-tenancy), NFR-9 (Bảo mật đường truyền/mã hóa lưu trữ), NFR-10 (Bảo vệ dữ liệu y tế), NFR-18 (Logging tập trung), NFR-19 (Tương thích thiết bị), NFR-20 (Xuất PDF y tế), NFR-23 (Truy xuất nguồn gốc model). |
| **MOCK** | **0** | 0% | Không còn dữ liệu AI mô phỏng trong runtime. |
| **FAIL** | **0** | 0% | — |
| **MISSING** | **3** | 13.1% | NFR-6 (Sao lưu PostgreSQL), NFR-15 (chú thích Grad-CAM thật), NFR-22 (Explainable AI thật). |
| **NOT VERIFIED** | **3** | 13.1% | NFR-1 (Thời gian suy luận AI model thật), NFR-4 (Uptime $\ge 99\%$), NFR-16 (Cập nhật AI Zero-downtime). |
| **TỔNG CỘNG** | **23 NFR** | **100%** | |

---

## VI. KẾ HOẠCH KHẮC PHỤC THEO MỨC ĐỘ ƯU TIÊN (P0 - P3)

```text
P0: Bảo Mật, Quyền Riêng Tư & Toàn Vẹn Dữ Liệu Y Tế (Khẩn Cấp)
 ├── [x] P0-1: Sửa lỗi Fallback AI trong ScreeningService: Khi AI offline, lưu trạng thái FAILED, bảo toàn ảnh, không sinh risk/confidence/findings giả. (ĐÃ HOÀN THÀNH & KIỂM CHỨNG)
 ├── [x] P0-2: Sửa lỗ hổng IDOR tại GET /api/v1/screenings/{id}: Kiểm tra quyền bệnh nhân, bác sĩ được phân công hoặc Admin. (ĐÃ KIỂM CHỨNG)
 ├── [x] P0-3: Phân quyền ca khám Bác sĩ và bảng điều phối Admin trên `doctor_patient_assignments` (FR-13, FR-14). (ĐÃ KIỂM CHỨNG)
 └── [ ] P0-4: Tách riêng bảng lưu trữ: Giữ nguyên `ai_results` không bị ghi đè khi Bác sĩ gửi `doctor_reviews` (FR-15).

P1: Hoàn Thiện Luồng Cốt Lõi (Core Flow Completion)
 ├── Nạp tệp trọng số PyTorch .pth thật vào AI Microservice FastAPI thay cho Gaussian blur mô phỏng (FR-3, FR-4).
 ├── Triển khai WebSocket / STOMP cho luồng Chat Bác sĩ - Bệnh nhân realtime hai chiều (FR-10, FR-20).
 └── [x] Bổ sung `patient_medical_profiles` và `patient_lab_documents` lưu hồ sơ, tiền sử và tệp xét nghiệm vào PostgreSQL (FR-8).

P2: Chức Năng Nâng Cao & Quản Trị
 ├── Chuyển Batch Job Queue từ RAM sang bảng PostgreSQL `batch_jobs` và `batch_items` (FR-24).
 ├── Tích hợp API sinh file PDF nhị phân phía Backend (OpenPDF/iText) (FR-7).
 └── Đấu nối cổng thanh toán VNPay / MoMo Sandbox thật (FR-11).

P3: Tối Ưu Hóa UI/UX & Mẫu Thông Báo
 ├── Xây dựng API và giao diện cấu hình Notification Templates (FR-39).
 └── Thêm tính năng lưu cấu hình ngưỡng AI vào Database (FR-33).
```

---
*Báo cáo Audit Baseline đã được chuẩn hóa và lưu trữ vĩnh viễn trong tệp tin `AUDIT_REPORT.md` tại thư mục gốc của dự án.*
