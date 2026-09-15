# Project: AURA Retinal Vascular Health Screening System — Full-Stack Audit

## Architecture
- **Frontend**: React 18.2 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Vitest (`frontend/src/`)
  - Portals: `CDSDashboardPage`, `PatientPortalPage`, `ClinicPortalPage`, `AdminAuditLogsPage`
  - Real API Client: `frontend/src/services/api.ts` with Axios interceptors and bearer token management
  - Optical Analysis: Client-side canvas hemoglobin separation & Grad-CAM simulation (`frontend/src/utils/dynamicHeatmapEngine.ts`)
- **Backend**: Spring Boot 3.5.3 + Java 21 LTS + Spring Security 6 + Spring Data JPA + Flyway + JJWT 0.13.0 (`backend/src/main/java/com/aura/`)
  - 20 REST Controllers across layered domain packages (auth, patient, doctor, screening, billing, clinic, chat, feedback, admin)
  - Security: JWT stateless filter chain, `@PreAuthorize` authorization expressions, `PatientAccessService`
  - Asynchronous & Batch: PostgreSQL relational tables `bulk_screening_batches` & `bulk_screening_items` (V027-V028), `BatchJobQueue`
  - Database: PostgreSQL 16 managed via 35 Flyway migrations (`backend/src/main/resources/db/migration/V001__...` to `V035__...`)
- **AI Integration**:
  - Remote VLM Integration: `GeminiRetinalAiService.java` calling Gemini 3.7 Flash High API
  - Legacy microservice `ai-service/` (FastAPI + PyTorch) deprecated/removed in git commit `f2c624754` due to absence of local weights
  - Safety & Fallback: `ScreeningService.java` marks screening as `FAILED` (preserving image without synthetic scores) upon AI outage

---

## Feature Inventory
| # | Feature Category | Description | Milestone | Source |
|---|------------------|-------------|-----------|--------|
| 1 | Patient Authentication & Profile | User registration, login, JWT issuance, profile management (FR-1, FR-2, FR-5) | M2 | SRS §2.1 |
| 2 | Biometric Fundus Image Ingestion | Single & multi-eye retinal image upload, format validation (FR-6, FR-7) | M3 | SRS §2.1 |
| 3 | AI Risk Screening & Biomarkers | Retinal vascular risk analysis, arteriolar narrowing, AVR, nicking (FR-8) | M3 | SRS §2.1 |
| 4 | Explainable AI & Optical Heatmap | Heatmap overlay, optical color filter isolation, Grad-CAM (FR-9) | M3 | SRS §2.1 |
| 5 | Telemedicine & Doctor-Patient Chat | Real-time messaging, STOMP WebSocket broker, access guard (FR-10, FR-20) | M2 | SRS §2.1, §2.2 |
| 6 | Doctor Patient Worklist & Management | Assigned patient dashboard, clinical triage, medical history (FR-13, FR-14) | M2 | SRS §2.2 |
| 7 | Doctor Second Opinion & Annotations | Medical diagnosis, risk reassessment, clinical feedback (FR-15, FR-16, FR-17) | M2 | SRS §2.2 |
| 8 | Clinic Multi-tenant & Member Mgmt | Clinic profile, doctor/staff invites, member role assignment (FR-22, FR-23) | M2 | SRS §2.3 |
| 9 | Bulk Screening & Queue Processing | High-throughput batch image upload, batch status tracking (FR-24, FR-25) | M2 | SRS §2.3 |
| 10 | Clinic Analytics & Epidemiological | Population health statistics, risk distribution, export (FR-27, FR-28) | M4 | SRS §2.3 |
| 11 | Billing & Credit System | Screening packages, balance top-up, payment transactions (FR-12, FR-26) | M2 | SRS §2.1, §2.3 |
| 12 | Admin System Governance & Audit Logs | Global user management, immutable audit trail, HIPAA logging (FR-31, FR-32) | M2 | SRS §2.4 |
| 13 | Admin AI Configuration | Dynamic sensitivity thresholds for AI detection models (FR-33) | M1 | SRS §2.4 |
| 14 | Error Handling & System Resilience | Global exception handler, error boundaries, failure state handling | M1 | SRS §3.2 |
| 15 | Code Quality & Mock Elimination | Removal of dead mock files, legacy code cleanup, architectural purity | M1 | SRS §3.1 |
| 16 | Verification & Test Coverage | Automated test suites (`mvn test`, `npm test`, `npm run build`, Testcontainers) | M4 | SRS §3.2 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Architecture & Code Quality Audit (R1) | Multi-tier architecture, Clean architecture, exception handling, error boundaries, mock code elimination | Survey complete | IN_PROGRESS |
| M2 | Deep Security & RBAC/IDOR Audit (R2) | Social login auth bypass, clinic cross-tenant IDOR, doctor feedback IDOR, public endpoint 401, Flyway integrity | Survey complete | PLANNED |
| M3 | Clinical CDS Flow & Real Data Verification (R3) | Cross-patient stale state in PatientUploader, Gemini relative path hallucination, Grad-CAM synthesis | Survey complete | PLANNED |
| M4 | SRS Compliance & Traceability Matrix (R4) | Traceability of all 39 FRs (FR-1 to FR-39), gap analysis vs baseline audit, test suite verification | M1, M2, M3 | PLANNED |
| M5 | Comprehensive Audit Report Deliverable (R5) | Synthesis of formal markdown audit report, executive summary, vulnerability catalog, remediation diffs | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts
### Frontend ↔ Backend REST API
- Base URL: `/api/v1`
- Authentication Header: `Authorization: Bearer <jwt_access_token>`
- Response Envelope: `ApiResponse<T> { success: boolean, data?: T, error?: { code: string, message: string } }`
- Error Format: `ApiError { code: ErrorCode, message: string, details?: Map<String, String>, timestamp: Instant }`

### Backend ↔ Gemini Cloud VLM
- Protocol: HTTP/1.1 POST JSON (OpenAI-compatible chat completions or native Google REST)
- Request: User prompt + Base64 encoded JPEG/PNG image bytes
- Response: Strict JSON schema containing `overallVascularRiskScore`, `predictions`, `biomarkers`, `detectedAnomalies`, `recommendations`
- Error Protocol: Exception caught, screening marked `FAILED`, zero synthetic diagnosis generated

### WebSocket Realtime Chat
- Endpoint: `/ws-aura`
- Broker: STOMP over SockJS
- Topic: `/topic/chat/{patientId}/{doctorId}`
- Auth Guard: Handshake interceptor + `@PreAuthorize("@patientAccessService.canChatBetween(principal, #receiverId)")`

---

## Code Layout
- `backend/src/main/java/com/aura/`:
  - `auth/`: SecurityConfig, JwtService, AuthService, PatientAccessService
  - `patient/`: PatientProfileController, PatientMedicalProfile
  - `doctor/`: DoctorPatientController, DoctorProfile
  - `screening/`: ScreeningController, ScreeningService, GeminiRetinalAiService
  - `clinic/`: ClinicProfileController, ClinicMemberController, BulkScreeningController
  - `chat/`: ChatController, ChatService, WebSocketConfig
  - `feedback/`: DoctorFeedbackController, DoctorFeedbackService
  - `billing/`: BillingController, ServicePackageController
  - `admin/`: AdminUserController, AdminAuditController, AdminRoleController
  - `common/`: GlobalExceptionHandler, ApiResponse, ErrorCode
- `backend/src/main/resources/db/migration/`: Flyway migrations `V001__init.sql` to `V035__...sql`
- `frontend/src/`:
  - `pages/`: `CDSDashboardPage`, `PatientPortalPage`, `ClinicPortalPage`, `AdminAuditLogsPage`
  - `components/`: `PatientUploader`, `InteractiveCDSViewer`, `RetinalImageAnalysis`, etc.
  - `services/`: `api.ts`, `authApi.ts`, `screeningApi.ts`, `doctorApi.ts`, `clinicApi.ts`
  - `utils/`: `dynamicHeatmapEngine.ts`, `exportReport.ts`
- `docs/`: `01-requirements/software-requirements-specification.md`, `AUDIT_REPORT.md`
