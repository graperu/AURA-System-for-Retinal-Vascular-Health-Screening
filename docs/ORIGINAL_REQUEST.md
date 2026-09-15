# Original User Request

## 2026-09-15T03:19:42Z

# Đánh giá toàn diện mã nguồn (Full-Stack Code Review & Security Audit) - Hệ thống AURA

Thực hiện rà soát, đánh giá chuyên sâu và toàn diện toàn bộ mã nguồn hệ thống AURA (Retinal Vascular Health Screening System) trên 3 tầng kiến trúc: Frontend (React 18 + TypeScript), Backend (Spring Boot 3.4 + Java 21) và AI Core Microservice (FastAPI + PyTorch), đối chiếu với 39 Yêu cầu chức năng (SRS FR-1 đến FR-39) và chuẩn bảo mật y tế HIPAA/OWASP.

Working directory: `e:\AURA-System-for-Retinal-Vascular-Health-Screening`
Integrity mode: development

## Requirements

### R1. Rà soát Kiến trúc & Mã nguồn Đa phân tầng (Architecture & Code Quality Audit)
- Rà soát cấu trúc mã nguồn, thiết kế phân lớp (Clean Architecture / Layered Architecture) và luồng giao tiếp giữa Frontend, Backend và AI Microservice.
- Đánh giá chất lượng code, coding conventions, xử lý lỗi (Exception Handling), Logging, và quản lý giao dịch CSDL (Transaction Management).

### R2. Kiểm toán Bảo mật Chuyên sâu & Chống rò rỉ dữ liệu (Deep Security & RBAC/IDOR Audit)
- Kiểm tra toàn bộ cơ chế xác thực JWT, phân quyền theo vai trò (RBAC: `ROLE_USER`, `ROLE_DOCTOR`, `ROLE_CLINIC`, `ROLE_ADMIN`) và cấu hình CORS / SecurityFilterChain.
- Kiểm tra các lỗ hổng IDOR (Insecure Direct Object References) tại các endpoint hồ sơ y tế (`/api/v1/patient/profile`), phân công bác sĩ (`/api/v1/doctor/patients`), và ca sàng lọc (`/api/v1/screenings`).
- Đánh giá tính toàn vẹn dữ liệu (Data Integrity) tại tầng CSDL PostgreSQL (Flyway Migrations V001–V016, ràng buộc khóa ngoại, unique constraints, index).

### R3. Thẩm định Luồng Lâm sàng CDS & Xử lý Dữ liệu Thực (CDS Dashboard & Mock Elimination)
- Kiểm tra giao diện Hỗ trợ ra quyết định lâm sàng (CDS Dashboard), giao diện bệnh nhân (Patient Portal), đảm bảo kết nối 100% với API thật.
- Xác minh không còn dữ liệu giả lập (`MOCK_PATIENTS`, `MOCK_SAMPLE_RESULT`, MRN tự sinh giả) trong các luồng vận hành chính.
- Kiểm tra tính an toàn của state management, đảm bảo không xảy ra hiện tượng giữ dữ liệu cũ khi đổi bệnh nhân (Cross-patient Stale State).

### R4. Đối chiếu Yêu cầu chức năng SRS & Ma trận Truy xuất Nguồn gốc (SRS & Traceability Compliance)
- Đối chiếu mã nguồn thực tế với 39 Yêu cầu chức năng (`FR-1` đến `FR-39`) trong tài liệu SRS (`docs/01-requirements/software-requirements-specification.md`) và `AUDIT_REPORT.md`.
- Đánh giá độ bao phủ của bộ kiểm thử tự động (Unit Tests, Integration Tests, Security Tests với Testcontainers).

### R5. Xuất Báo cáo Đánh giá Chi tiết & Đề xuất Khắc phục (Comprehensive Audit Report Deliverable)
- Lập báo cáo kết quả review có cấu trúc chuẩn:
  1. **Tổng quan hiện trạng hệ thống** (Kiến trúc, Tech stack, Điểm mạnh).
  2. **Danh mục phát hiện lỗi & Lỗ hổng** (Phân loại theo mức độ nghiêm trọng: Critical, High, Medium, Low).
  3. **Đánh giá mức độ tuân thủ 39 FRs** (Bảng ma trận Traceability).
  4. **Đề xuất giải pháp & Mã nguồn sửa lỗi cụ thể (Code Fix Diffs)** kèm đường dẫn file chính xác.

## Acceptance Criteria

### Tính toàn diện & Độ phủ kiểm tra
- [ ] Đã rà soát chi tiết toàn bộ mã nguồn trong `frontend/src/`, `backend/src/main/java/`, `backend/src/main/resources/db/migration/` và các module AI service.
- [ ] Tất cả các REST Controller (`AuthController`, `DoctorPatientController`, `PatientProfileController`, `ScreeningController`, `BillingController`, `ClinicController`, v.v.) được kiểm tra đầy đủ về phân quyền `@PreAuthorize` và validation `@Valid`.
- [ ] Tất cả các trang Frontend cốt lõi (`CDSDashboardPage`, `PatientPortalPage`, `AdminPortalPage`, `ClinicPortalPage`) được kiểm tra về luồng gọi API, quản lý State và Error/Empty State handling.

### Tính chính xác & Bằng chứng thực nghiệm
- [ ] Kiểm tra kết quả thực thi kiểm thử tự động của Backend (`mvn test`) và kiểm tra tính hợp lệ của Frontend build (`npm run build`).
- [ ] Mỗi vấn đề/lỗ hổng được phát hiện phải có dẫn chứng dòng code cụ thể, phân tích rủi ro lâm sàng/bảo mật và đoạn mã sửa chữa (Diff) trực quan.
- [ ] Báo cáo được định dạng Markdown rõ ràng, chuyên nghiệp, phục vụ thẩm định kỹ thuật và nghiệm thu đồ án.
