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

## 2026-09-17T11:01:30Z

# AURA COMPLETE UI/UX + FEATURE + REALTIME REDESIGN
# REFERENCE STYLE: MEDIROOM-INSPIRED CLINICAL DASHBOARD
# PROJECT: AURA — Retinal Vascular Health Screening

Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening
Integrity mode: development
Requested team: Full multi-agent team (maximum 4 active agents: Orchestrator, UI Agent, Frontend Agent, Backend/Realtime Agent, QA Reviewer)

## Reference Material
- Visual Design Reference Image: C:/Users/ASUS/.gemini/antigravity/brain/b9d834f4-12c4-4873-8c72-f27bbb348681/.user_uploaded/media_1789642151393.png
- Master Prompt Specifications & Execution Rules (Phases 0 through 8, Definition of Done).

## High-Level Goal
Audit and completely redesign the entire AURA application to match the visual language of the reference clinical dashboard (MediRoom-inspired: light mode, minimal, clean healthcare dashboard, high information density, #3478F6 primary blue accent, #F5F6F8 canvas, white cards with #EAECF0 hairline border, 220-240px fixed left sidebar, 72-80px topbar, professional tables, clean forms) across all 4 roles: Patient, Doctor, Clinic, Admin.
Strictly preserve all existing Spring Boot backend APIs, database schemas, Gemini AI analysis integration, and Spring WebSocket/STOMP realtime communication (zero F5 browser reload).

## Key Requirements

### R1. Global Clinical Design System & Design Tokens
- Colors: Global background `#F5F6F8`, Surfaces & Sidebar `#FFFFFF`, Primary Blue `#3478F6` (hover `#2563EB`, dark `#1D4ED8`), Soft blue background `#EEF5FF`, Borders `#EAECF0` / `#E8EBEF`, Text `#111827`, Secondary text `#667085`, Muted `#98A2B3`. Badges: Success `#22C55E` / `#ECFDF3`, Warning `#F59E0B` / `#FFFAEB`, Danger `#EF4444` / `#FEF3F2`, Clinical Info `#0EA5E9`.
- Typography: Inter/Noto Sans/system-ui hierarchy. No heavy gradients, no sci-fi dark modes or neon glows.
- Reusable UI component suite: `AppLayout`, `Sidebar`, `Topbar` with notification center & user dropdown, `KpiCard`, `SectionCard`, `DataTable`, `StatusBadge`, `FilterBar`, `SearchField`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `SkeletonLoading`.

### R2. Global Layout & Role-Based Sidebar Navigation
- Layout hierarchy: Desktop fixed left sidebar (width 220–240px, white background, light border-right), top header (height 72–80px, white background with page title, search, notifications, profile), and main content area (padded 20–28px, grid gap 16–20px).
- Strict role-based sidebar menus with `GENERAL` and `OTHER` groups and bottom Logout:
  - Patient: General (Dashboard, Retinal Screening, Results & History, Appointments, Messages, Medical Profile), Other (Notifications, Settings).
  - Doctor: General (Dashboard, Patients, Pending Reviews, Review History, Messages, Appointments), Other (Notifications, Profile, Settings).
  - Clinic: General (Dashboard, Patients, Batch Screening, Results, Doctors, Analytics), Other (Notifications, Settings).
  - Admin: General (Dashboard, Users, Doctors & Clinics, Screenings, Roles & Permissions, Audit Logs), Other (System Settings, Notifications).
- Active item: primary blue background, white text & icon. Inactive item: `#4B5563`, hover `#F4F6F8`.

### R3. Patient Portal Experience
- Patient Dashboard: 4 KPI cards (Latest Risk Score, Total Screenings, Upcoming Appointments, Unread Messages), Risk trend chart, Latest Result card with OD/OS indicator, Upcoming Appointment card, Assigned Doctor card, and Recent Screening History table.
- Screening Wizard: 4 steps (Patient/Image Info -> Upload -> Review -> Analysis) with clean stepper. Side-by-side upload zone with drag-and-drop and image preview.
- AI Processing State: Real step status sequence (Image Uploaded -> Preparing Analysis -> Gemini Analysis -> Generating Result -> Saving Result) with subtle spinner (no fake percentages, no glowing brains).
- Screening Result: Retinal Viewer side-by-side with Overall Risk score & confidence, 4 individual risk categories (CVD, Stroke, Hypertension, Retinopathy) with clean progress bars, AI findings, clinical indicators, and doctor review status.
- Retinal Viewer: Clean toolbar controls (Original, Overlay/AI Risk Heatmap, Zoom In/Out, Reset, Fullscreen, opacity slider).
- History, Appointments, Messages, Medical Profile: Standardized tables, booking form, two-column chat layout, structured profile cards.

### R4. Doctor Portal & Clinical Review Workspace
- Doctor Dashboard: 4 KPI cards (Assigned Patients, Pending Reviews, High Risk Cases, Reviewed Today), Review activity chart, Pending review status queue, Recent patients table, Upcoming appointments.
- Clinical Review Workspace: 3-column desktop layout (Patient queue 260–300px, Retinal viewer center flex-grow, Doctor assessment & review form 320–360px).
- Review Form: AI Risk review, Doctor Assessment, Review Status, Clinical Notes, Recommendations, Override reason required if modifying AI finding, Save Draft / Confirm Review.

### R5. Clinic & Admin Portals
- Clinic Portal: KPI metrics (Total Patients, Screenings Today, Processing, High Risk), Screening activity chart, Batch Screening queue card with progress bar, Recent batches table, High-risk case queue.
- Admin Portal: KPI cards, user management, screening activity, audit logs table, and role/permission settings adhering to the global table and card standards.

### R6. Realtime WebSocket / STOMP Synchronization (Zero F5)
- Shared `websocketService` instance with auto-reconnect, heartbeat, clean subscription/unsubscription, and auth headers.
- Realtime topics: `/topic/chat.{userId}`, `/topic/notifications.{userId}`, `/topic/screening.{patientId}`, `/topic/appointments.{userId}`, `/topic/clinic.{clinicId}`.
- Event payload standardization: `SCREENING_CREATED`, `SCREENING_PROCESSING`, `SCREENING_COMPLETED`, `SCREENING_FAILED`, `DOCTOR_REVIEWED`, `DOCTOR_OVERRIDE`, `RETAKE_REQUIRED`, `MESSAGE_RECEIVED`, `APPOINTMENT_CREATED`, `APPOINTMENT_UPDATED`, `NOTIFICATION_CREATED`, `BATCH_PROGRESS`.
- Seamless end-to-end event chain: Patient uploads image -> Gemini processing updates step state in realtime -> Result ready triggers WebSocket notification -> Doctor pending queue updates automatically -> Doctor submits review -> Patient view updates to Doctor Reviewed instantly without manual refresh.
- Persistent Notification Center in Topbar with unread count badge and dropdown list.

### R7. UX States, Responsiveness & Project State Tracking
- Comprehensive Empty States (custom icon, message, clear CTA button).
- Skeleton Loading states for cards, tables, and dashboards (no raw spinner walls).
- Error boundaries with friendly clinical messages and retry actions.
- Responsive layouts: Desktop (>= 1280px full fixed sidebar, 3-column doctor review), Tablet (collapsible sidebar, tabbed review), Mobile (drawer navigation, stacked cards).
- Maintain project state at `.kilo/context/AURA_PROJECT_STATE.md` to document architecture, APIs, realtime topics, and migration steps for token efficiency.

## Verification Resources & Acceptance Criteria
- Run `npm test` in `frontend/` (executes clinical-verification, ai-analysis-flow, clinical-ui-components, i18n-clinical-system, credit-purchase-modal, realtime-system tests). Note: fix existing pre-existing compile errors and i18n scan violations in `AppointmentBookingModal.tsx`, `PatientUploadWizard.tsx`, `AdminAuditLogsPage.tsx` during refactoring.
- Run `npm run build` (`tsc && vite build`) in `frontend/` without TypeScript or bundle errors.
- Run `run-automated-tests.bat` (verifies backend Spring Boot unit tests, frontend build, and docker compose configuration).
- All Acceptance Criteria in `prompt_draft.md` must pass 100%.

## 2026-09-18T05:59:27Z

# AURA CLINICAL UI/UX POLISH & 23 NON-FUNCTIONAL REQUIREMENTS (NFR-1 TO NFR-23) IMPLEMENTATION

Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening
Integrity mode: development
Requested team: Full multi-agent team (Orchestrator, UI/UX Polish Agent, Backend/Security Agent, QA/Verification Auditor)

## Goal
Polish and declutter the entire AURA clinical UI/UX (clean typography, breathing room, eliminate visual noise/overcrowded text, professional clinical hierarchy matching modern healthcare SaaS) and verify & implement 100% compliance with all 23 Non-Functional Requirements (NFR-1 through NFR-23).

## Requirements

### R1. UI/UX Polish & Typography Decluttering (Visual Refinement)
- **Declutter & Breathing Room**: Clean up card layouts, reduce wall-of-text sections, ensure proper spacing (4, 8, 12, 16, 20, 24, 32px), prevent overlapping text or cut-off labels across Patient, Doctor, Clinic, and Admin portals.
- **Typography & Hierarchy**: Inter font hierarchy with balanced line-heights, crisp titles, muted secondary labels (`#667085`), clinical risk badges with concise copy, eliminating cluttered or awkward text wrapping.
- **Clinical Ease-of-Use ([NFR-14])**: Clinicians must be able to upload a retinal image and view complete analysis results within **≤ 3 clicks** (Streamlined 3-click screening flow).
- **Responsive & Accessible ([NFR-13])**: Fully accessible web interface conforming to responsive layouts on Desktop, Tablet, and Mobile without horizontal overflow.

### R2. Clinical Explainability, Export & Traceability (NFR-15, NFR-20, NFR-22, NFR-23)
- **Clinical Interpretability & Explainability ([NFR-15, NFR-22])**: Annotated retinal viewer with dynamic AI attention heatmaps, segmented vascular structures, and highlighted microvascular lesions (microaneurysms, hemorrhages, exudates) with clear diagnostic descriptions.
- **Traceability & Versioning ([NFR-23])**: Every screening result and clinical report must track and display the AI model engine version (e.g., Gemini 3.7 Flash High / AURA-Core v2.4), active risk thresholds, and confidence calibration.
- **Standardized Multi-Format Export ([NFR-20])**: Support exporting clinical findings and screening history into formatted PDF medical reports, CSV tabular data, and structured JSON (ready for HL7/FHIR compatibility).

### R3. Performance, Scalability & Graceful Error Handling (NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-7, NFR-8)
- **Processing SLA ([NFR-1])**: Single retinal image AI analysis finishes within 10–20 seconds based on resolution and model latency.
- **Batch Screening Engine ([NFR-2])**: Robust batch processing capability supporting ≥100 images per batch with parallel execution queue, live progress tracking, and batch summary metrics.
- **Sub-3-Second Retrieval ([NFR-3])**: Dashboards and clinical result retrieval load in < 3 seconds under normal network conditions with optimized database indices and paginated queries.
- **High Availability & Horizontal Scalability ([NFR-4, NFR-7, NFR-8])**: Stateless microservice design allowing horizontal scaling, multi-clinic concurrent tenant support, and target ≥99% uptime.
- **Graceful Error Handling & Image Preservation ([NFR-5])**: Fail-safe AI engine that catches exceptions gracefully, returns clear, user-friendly clinical error messages without raw stack traces, and preserves all uploaded images in secure storage.

### R4. Healthcare Security, Encryption & Privacy Compliance (NFR-9, NFR-10, NFR-11, NFR-12)
- **End-to-End Encryption ([NFR-9])**: Patient data encrypted at rest (AES-256) and in transit (TLS 1.2+).
- **Medical Privacy & De-Identification ([NFR-10, NFR-11])**: HIPAA-aligned data governance with automated PII de-identification (anonymization of patient name, MRN, national ID) before data can be used for audit or model retraining pipelines.
- **Strict Role-Based Access Control (RBAC) ([NFR-12])**: Enforce granular role boundaries for Admin, Clinic, Doctor, and Patient across all REST APIs and WebSocket topics.

### R5. Architecture, Logging & Integration Standards (NFR-6, NFR-16, NFR-17, NFR-18, NFR-19, NFR-21)
- **Modular Clean Architecture ([NFR-17, NFR-21])**: Clear separation between AI Core microservice, Spring Boot RESTful API endpoints, Frontend UI modules, and PostgreSQL database layer.
- **Centralized Logging & Observability ([NFR-18])**: Centralized logging, structured error monitoring, and HIPAA-compliant audit logs tracking all clinical access events.
- **Zero-Downtime Configuration & Automated Backup ([NFR-6, NFR-16])**: Daily database automated backup mechanisms and dynamic risk threshold configuration without requiring system restarts.
- **Fundus Device Cloud Integration ([NFR-19])**: Standardized cloud-based upload gateway compatible with common clinical fundus camera outputs (DICOM/JPEG/PNG).

## Verification Resources & Acceptance Criteria
- Run `npm test` in `frontend/` (all test suites passing 100%).
- Run `npm run build` (`tsc && vite build`) in `frontend/` (0 errors).
- Run `mvn test` in `backend/` (all Spring Boot unit & security tests pass).
- NFR Verification Suite: Empirical tests for 3-click workflow, export utilities, batch processing, RBAC security, and error handling.
- All Acceptance Criteria in `prompt_draft.md` must pass 100%.

## 2026-09-18T07:13:53Z

# AURA COMPLETE AUDIT & IMPLEMENTATION: 39 FUNCTIONAL REQUIREMENTS (FR-1 TO FR-39) & 23 NON-FUNCTIONAL REQUIREMENTS (NFR-1 TO NFR-23)

Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening
Integrity mode: development
Requested team: Full multi-agent team (Orchestrator, Full-Stack Feature Implementer, Security/NFR Specialist, QA/Compliance Auditor)

## Goal
Perform an exhaustive end-to-end implementation, verification, and audit of the entire AURA Retinal Vascular Health Screening System against all 39 Functional Requirements (FR-1 through FR-39) across Patient, Doctor, Clinic, and Admin roles, combined with all 23 Non-Functional Requirements (NFR-1 through NFR-23), ensuring flawless clinical UI/UX, robust security, zero-F5 realtime sync, and 100% test pass.

## Requirements

### R1. Patient Portal Functional Suite (FR-1 to FR-12)
- Authentication & Security ([FR-1]): Email/password authentication, Google OAuth / social sign-in integration, email verification.
- Screening & Upload Flow ([FR-2, FR-14-click]): Multi-image Fundus and OCT upload with preview, drag-and-drop, eye laterality (OD/OS/OU), streamlined <= 3-click workflow.
- AI Diagnosis & Explainability ([FR-3, FR-4, FR-5]): Risk score (CVD, Stroke, Hypertension, Retinopathy), confidence metrics, annotated retinal viewer with attention heatmaps, segmented vessels, highlighted lesion markers, and automated clinical recommendations.
- History, Export & Health Profile ([FR-6, FR-7, FR-8]): Comprehensive historical screening table with multi-criteria filters, standardized PDF medical report, CSV export, HL7/FHIR JSON, and editable medical profile (vitals, medical history, emergency contacts).
- Realtime Alerts, Chat & Service Credits ([FR-9, FR-10, FR-11, FR-12]): Instant WebSocket push when AI analysis completes, in-app doctor consultation chat, QR code VietQR subscription packages purchase, and payment transaction history.

### R2. Doctor Portal & Clinical Decision Support Suite (FR-13 to FR-21)
- Assigned Patient Management ([FR-13, FR-18]): Worklist of assigned patients with search, filtering by risk level, ID, name, comorbidities, and quick navigation.
- Clinical Review Workspace ([FR-14, FR-15, FR-16]): 3-column clinical desktop layout, interactive fundus viewer with Red-Free 540nm filter, doctor confirmation or modification of AI findings with required override justification, ICD-10 tagging, and clinical recommendations.
- Patient History, Feedback & Analytics ([FR-17, FR-19, FR-20, FR-21]): Longitudinal patient risk trends, AI model feedback collection for active learning, in-app consultation chat with assigned patients, and doctor workload analytics.

### R3. Clinic Portal & Batch Operations Suite (FR-22 to FR-30)
- Clinic Onboarding & Organization ([FR-22, FR-23]): Clinic registration, credential verification, multi-doctor roster management, and patient assignment to clinic doctors.
- Bulk Screening Operations ([FR-24, FR-25, FR-27]): Batch upload of >= 100 retinal images, asynchronous parallel processing queue with live WebSocket BATCH_PROGRESS, aggregated risk distribution, and credit consumption tracking.
- Reporting, Quotas & Alerts ([FR-26, FR-28, FR-29, FR-30]): Clinic-wide screening campaign report generator, credit package renewal, automated alerts for high-risk cohorts, and aggregated clinical research export.

### R4. Admin Portal & System Governance Suite (FR-31 to FR-39)
- User & Clinic Governance ([FR-31, FR-32, FR-38]): Full lifecycle management of users, doctors, and clinics (activation, deactivation, suspension, approval), role-based permissions management.
- AI Parameters & Calibration ([FR-33]): Dynamic risk threshold configuration, AI model versioning (Gemini 3.7 Flash High / AURA-Core v2.4), and retraining dataset export with HMAC-SHA256 de-identification.
- Billing & Financial Management ([FR-34, FR-35]): Credit tier pricing, service package management, revenue analytics, and system usage dashboards.
- System Monitoring, Audit & Compliance ([FR-36, FR-37, FR-39]): System error rates, image volume analytics, HIPAA-compliant audit logs (AuditLogAspect), privacy controls, and communication/notification template management.

### R5. Comprehensive Non-Functional Requirements Suite (NFR-1 to NFR-23)
- Performance & Scalability: 10–20s AI analysis SLA ([NFR-1]), batch processing >= 100 images ([NFR-2]), sub-3s query retrieval with Pageable ([NFR-3]), >= 99% uptime target ([NFR-4]), horizontal scalability ([NFR-7]), multi-tenant clinic capacity ([NFR-8]).
- Fail-Safe & Security: Graceful error handling with image preservation in DB ([NFR-5]), automated daily PostgreSQL backup ([NFR-6]), TLS 1.2+ & AES-256 GCM encryption at rest ([NFR-9]), HIPAA compliance ([NFR-10]), PII de-identification ([NFR-11]), and granular RBAC ([NFR-12]).
- Usability & Architecture: Responsive desktop/tablet/mobile design ([NFR-13]), <= 3-click clinical flow ([NFR-14]), clinical explainability ([NFR-15, NFR-22]), zero-downtime configuration ([NFR-16]), modular clean architecture ([NFR-17]), centralized MDC logging ([NFR-18]), DICOM camera cloud ingestion ([NFR-19]), multi-format export ([NFR-20]), RESTful APIs ([NFR-21]), and AI model version traceability ([NFR-23]).

## Verification Resources & Acceptance Criteria
- Run npm test -- --run in frontend/ (all test suites passing 100%).
- Run npm run build (tsc && vite build) in frontend/ (0 TypeScript errors).
- Run mvn test in backend/ (all 1,113+ unit and security tests passing 100%).
- Run scripts/verify-backup.bat (automated backup verification).
- Run run-automated-tests.bat (full system regression verification).
- All Acceptance Criteria in prompt_draft.md must pass 100%.

## 2026-09-18T07:25:49Z

USER DIRECTIVE (HIGH PRIORITY):
"với lại mấy cái text được ghi trên ui làm cho nó đồng bộ và đúng với hệ thống nhé, cái nào ghi sai thì sửa lại cái nào lỗi thì sữa lại cái nào không đúng thì sửa lại cho nó đúng."

Yêu cầu chuyển tiếp ngay tới Orchestrator Gen 5 (1a148324-eb98-4259-ad75-c4e0efce5b15) và các subagents:
1. Rà soát toàn diện văn bản giao diện (UI text, headers, labels, placeholders, buttons, tooltips, notification copy, error messages, modal texts) trên tất cả 4 phân hệ (Bệnh nhân, Bác sĩ, Phòng khám, Quản trị viên).
2. Đồng bộ hóa 100% với từ điển y khoa và hệ thống (translations.ts, LanguageContext vi/en).
3. Sửa triệt để mọi lỗi chính tả, câu từ ngô nghê, dịch thuật máy móc hoặc không nhất quán giữa tiếng Việt và tiếng Anh, thuật ngữ giải phẫu/lâm sàng sai chuẩn (ví dụ: Gai thị, Hoàng điểm, Tỷ lệ AVR, Cần thẩm định lâm sàng, Nguy kịch, v.v.).
4. Đảm bảo tuân thủ nghiêm ngặt chính sách Zero-Hybrid Strings (không pha trộn tiếng Việt/tiếng Anh trong cùng một chuỗi như test i18n-clinical-system.test.ts yêu cầu).
5. Sau khi cập nhật, đảm bảo toàn bộ test suites frontend (11 suites) và build (tsc && vite build) vượt qua 100%.

## 2026-09-18T10:05:22Z

# AURA CROSS-PORTAL SYNCHRONIZATION & REAL-TIME EVENT BUS (POC)

Dự án AURA System for Retinal Vascular Health Screening đã có sẵn codebase hoàn chỉnh (39 FRs + 23 NFRs đã implement). Cần đồng bộ hóa và liên kết tất cả chức năng giữa 4 portal (Patient, Doctor, Clinic, Admin) và thêm real-time communication để mọi thay đổi data đều phản ánh ngay lập tức trên tất cả các portal liên quan. Mục đích: proof of concept — chứng minh khả thi, sau đó refine thêm.

Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening
Integrity mode: development

## Existing Codebase Context

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (`frontend/`)
- **Backend**: Spring Boot 3.4 + PostgreSQL + Flyway (`backend/`)
- **AI**: Gemini 3.7 Flash High API for retinal analysis
- **i18n**: Custom LanguageContext, forced Vietnamese
- **Tests**: 11 frontend test suites (284 tests), 1113 backend tests — ALL PASS
- **Build**: `tsc && vite build` — 0 TypeScript errors
- **4 Portals**: Patient (`PatientPortalPage.tsx`), Doctor (`DoctorDashboardView.tsx`), Clinic (`ClinicPortalPage.tsx`), Admin (`AdminAuditLogsPage.tsx`)
- **Existing WebSocket**: Spring WebSocket/STOMP config already exists in backend

## Requirements

### R1. Cross-Portal Data Synchronization

All 4 portals (Patient, Doctor, Clinic, Admin) must share a consistent data flow. When data changes in one portal, all related portals must reflect the change without requiring manual refresh. Specific flows that must work:

- Patient uploads fundus image → Doctor sees new case on their dashboard immediately
- Doctor reviews/approves a result → Patient receives notification and sees updated status
- Clinic submits a batch scan → Admin sees the activity; Doctor sees assigned cases
- Doctor adds clinical notes → Patient and Clinic can see updated notes
- Admin changes user roles/permissions → affected user's portal reflects changes immediately

### R2. Real-Time Event System

Implement a real-time event bus that pushes updates from the backend to all connected frontend clients. The team may choose the technology (WebSocket/STOMP, SSE, or hybrid). Events must include:

- New scan uploaded / analysis completed
- Result reviewed / approved by doctor
- Batch job status changes (processing → completed → reviewed)
- Notification delivery (bell icon badge count updates in real-time)
- User online/offline presence (optional but nice to have)

### R3. Portal Navigation & Cross-Linking

Each portal must have clear navigation paths to related entities across portals:

- Patient can see which doctor is assigned and their review status
- Doctor can navigate to patient profile directly from case review
- Clinic can drill down into individual patient results from batch overview
- Admin can view any user's activity from audit logs
- All cross-references must use consistent IDs and link properly

### R4. Notification System

A unified notification system that works across all portals:

- Bell icon in topbar showing unread count (real-time updated)
- Notification dropdown with categorized items (scan results, reviews, system alerts)
- Mark as read/unread functionality
- Notifications must be bilingual (Vietnamese/English based on language context)

## Acceptance Criteria

### Data Synchronization
- [ ] When a patient uploads a fundus image, the doctor's dashboard shows a new case within 5 seconds without page refresh
- [ ] When a doctor approves a result, the patient's portal shows "Đã duyệt" status within 5 seconds without page refresh
- [ ] When a clinic submits a batch, the admin audit log shows the event within 5 seconds

### Real-Time Events
- [ ] At least 3 distinct event types are pushed from backend to frontend in real-time
- [ ] Multiple browser tabs/windows connected simultaneously all receive events
- [ ] Connection handles reconnection gracefully (auto-reconnect on disconnect)

### Cross-Portal Linking
- [ ] Doctor can click a patient name in their case list and navigate to that patient's profile/history
- [ ] Patient can see assigned doctor's name and review status on their dashboard
- [ ] Clinic batch overview links to individual scan results

### Notifications
- [ ] Bell icon shows unread notification count that updates in real-time
- [ ] Clicking a notification navigates to the relevant page/entity
- [ ] All notification text is bilingual (vi/en) using the existing i18n system

### Build & Test Integrity
- [ ] `npm run build` in `frontend/` completes with 0 TypeScript errors
- [ ] `npm test` in `frontend/` — all existing 11 test suites pass (284+ tests, 0 failures)
- [ ] No existing functionality is broken by the changes

## 2026-09-18T11:47:50Z

Nâng cấp toàn diện giao diện người dùng và hiệu ứng chuyển động tương tác vật lý (Motion Heavy & High-Tech Clinical Animations) cho hệ sinh thái AURA Retinal Health Screening, tích hợp `framer-motion` nhằm mang lại trải nghiệm mượt mà, chiều sâu công nghệ và độ tin cậy y khoa cao.

Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening
Integrity mode: development

## Requirements

### R1. Bộ Chuyển Động Tương Tác Vật Lý (Micro-interactions & Page Transitions)
- Tích hợp hiệu ứng chuyển cảnh mềm mại giữa các tabs và views chính (fade, scale, spring transitions) trên cả 4 cổng (Bệnh nhân, Bác sĩ, Phòng khám, Quản trị viên).
- Cải thiện trạng thái tương tác trên các nút bấm, danh sách thẻ, bảng dữ liệu (hover lifts, press feedback, ripples) với thời gian phản hồi tự nhiên (< 200ms).
- Mở/đóng các Modal (đặt lịch khám, mua lượt khám, chi tiết ca bệnh) và Notification Drawer với hiệu ứng slide-in/spring mượt mà kèm backdrop blur.

### R2. Hiệu Ứng Quét Quang Học & Phân Tích AI Võng Mạc (Clinical AI Laser Scan Sweep)
- Xây dựng hiệu ứng đường quét laser quang học quét dọc ảnh chụp đáy mắt (Laser scan sweep line / pulse grid) hiển thị trong quá trình phân tích 5 bước của AI.
- Hiệu ứng chuyển tiếp mượt mà từ ảnh gốc sang bản đồ nhiệt Grad-CAM khi AI hoàn tất phân tích.
- Hiệu ứng vẽ nét liên tục (SVG stroke dash-array / path draw animation) cho mạng lưới mạch máu vi thể neon xanh khi bật chế độ Chuyên sâu AI (`VesselHeatmapOverlay`).

### R3. Hiệu Ứng Nhảy Số & Trực Quan Hóa Chỉ Số Lâm Sàng (Biomarker Counter & Gauge Animation)
- Hiệu ứng nhảy số linh hoạt (animated count-up counter) cho Điểm nguy cơ mạch máu tổng hợp (`Risk Score`) từ 0 lên điểm số thực tế khi mở kết quả.
- Animation cho các thước đo thanh tiến độ (A/V ratio, mật độ vi mạch, độ uốn lượn tortuosity, cup-to-disc ratio).
- Hiệu ứng pulse sóng lan tỏa (ripple pulse wave) cho các điểm đánh dấu vi tổn thương (Microaneurysm, Hemorrhage) trên võng mạc.

### R4. Tối Ưu Hiệu Năng & Chuẩn Trợ Năng Y Tế (Performance & WCAG 2.1 AA)
- Đảm bảo tốc độ khung hình 60 FPS mượt mà, không gây hiện tượng giật khung hình hay layout shift (CLS = 0).
- Hỗ trợ đầy đủ cờ `prefers-reduced-motion`: tự động chuyển sang chế độ chuyển cảnh tĩnh hoặc giảm thiểu tối đa nếu hệ điều hành hoặc người dùng có cấu hình trợ năng giảm chuyển động.

## Acceptance Criteria

### Visual & Interactive Animations
- [ ] Tất cả các modal và drawer mở/đóng với hiệu ứng chuyển động mượt mà (smooth spring / ease-out).
- [ ] Màn hình quét ảnh AI đáy mắt hiển thị đường quét laser quang học chuyển động trong suốt tiến trình phân tích.
- [ ] Điểm số nguy cơ mạch máu (0-100) và các chỉ số vi mạch chạy hiệu ứng nhảy số tự nhiên khi xem kết quả.
- [ ] Lớp phân đoạn mạch máu neon xanh `#00FF66` hiển thị hiệu ứng vẽ viền (stroke draw animation) khi kích hoạt.

### Accessibility & Performance
- [ ] Tuân thủ tiêu chuẩn `prefers-reduced-motion` mà không làm vỡ giao diện hay gián đoạn chức năng.
- [ ] Không làm suy giảm hiệu năng thao tác lâm sàng của bác sĩ (thao tác phản hồi tức thời).

### Build & Test Integrity
- [ ] `npm run build` trong `frontend/` hoàn thành với 0 lỗi TypeScript.
- [ ] `npm test` trong `frontend/` vượt qua 100% tất cả 15 test suites (không làm hỏng bất kỳ tính năng hay bài kiểm tra nào trước đó).
