# Software Requirements Specification (SRS)

**Status:** Synchronized with the current source code  
(Spring Boot backend, React frontend prototype, AI service not yet implemented)

## 1. Introduction

### 1.1 Purpose

This document specifies the functional requirements (FRs) and non-functional
requirements (NFRs) for the retinal vascular health screening and Clinical
Decision Support (CDS) system.

The SRS serves as the baseline for system design, implementation, testing, and
requirements traceability through `traceability-matrix.md`.

### 1.2 Product Scope

AURA consists of the following components:

- **Web Client** (React and TypeScript): provides portals for patients, doctors,
  clinic managers, and system administrators.
- **Backend API** (Java 21 and Spring Boot 3): provides authentication,
  authorization, screening workflows, data storage integration, and future AI
  service orchestration.
- **AI Service** (Python and FastAPI — planned): analyzes fundus/OCT images and
  produces heatmaps, annotations, and health risk indicators.
- **PostgreSQL Database** managed through Flyway migrations.
- **Private Object Storage** through Supabase Storage — planned.

**Clinical boundary:** AURA is intended to support health screening and clinical
decision-making. It does **not** replace a professional medical diagnosis.

### 1.3 Definitions and Abbreviations

| Term | Definition |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| CDS | Clinical Decision Support |
| Fundus Image | An image of the interior surface of the eye |
| OCT | Optical Coherence Tomography |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| API | Application Programming Interface |
| MVP | Minimum Viable Product |
| UI | User Interface |
| AI | Artificial Intelligence |
| CV | Computer Vision |

### 1.4 Reference Documents

- `mvp-scope.md` — MVP scope and boundaries
- `traceability-matrix.md` — implementation status of each FR and NFR
- `../03-architecture/system-context.md`
- `../03-architecture/component-diagram.puml`
- `../03-architecture/deployment-diagram.puml`
- `../04-database/database-design.md`
- `../05-api/backend-api.md`

## 2. Overall Description

### 2.1 System Context

Users, including patients, doctors, clinic managers, and administrators, access
AURA through the web application.

The browser communicates **only** with the Backend API. The backend is
responsible for:

- Authentication and authorization
- Business logic processing
- Database access
- Generation of short-lived signed URLs for private storage
- Internal communication with the AI service

The client application must not communicate directly with the AI service.

### 2.2 User Classes and Actors

| Actor | Description |
| **Patient (USER)** | Uploads images, views screening results and history, receives health alerts, and purchases subscription plans — planned. |
| **Doctor (DOCTOR)** | Reviews the screening queue, AI results annotated images, and confirms or corrects screening results. |
| **Clinic Manager** | Manages clinic information, internal doctors and patients, assignments, and reports — planned, with UI prototype only. |
| **Administrator (ADMIN)** | Manages system accounts, audit records, screening campaigns, and system monitoring — planned, with UI prototype only. |
| **AI Service** | Internal service used for image analysis; it is not directly exposed to the public internet. |

### 2.3 Assumptions and Constraints

- The current backend is implemented using **Spring Boot**, not .NET.
- An Architecture Decision Record may be added if the technology stack changes.
- Public registration assigns only the `USER` role.
- The `DOCTOR` and `ADMIN` roles must be assigned by an administrator through
  database seed data, migration scripts, or future administration features.
- The MVP excludes: Production payment processing, Production real-time chat, OAuth2 and social login, Bulk image upload, Backend PDF/CSV export, Native mobile applications, Detailed MVP boundaries are defined in `mvp-scope.md`.

## 3. Functional Requirements

Implementation statuses:

- **Completed**
- **Partially Implemented**
- **Planned**
- **Out of MVP Scope**

| ID | Requirement Description | Status | Implementation Notes |
| **FR-1** | The system shall support email/password registration and login, JWT-based sessions, token refresh, logout, and current-user retrieval. | **Completed** | Implemented in `AuthController`, `AuthService`, and integration tests. |
| **FR-2** | The system shall allow patients to upload fundus images, validate them, and store them in private object storage. | **Partially Implemented** | Upload UI exists. The API currently accepts `imageUrl`; multipart upload and Supabase integration are not implemented. |
| **FR-3** | The system shall perform AI analysis and return risk levels, confidence scores, detected abnormalities, and health risk indicators such as cardiovascular, diabetes, and stroke risks. | **Partially Implemented** | Mock results are generated in `ScreeningService`; the AI service is not integrated. |
| **FR-4** | The system shall generate blood-vessel segmentation, heatmaps, and annotated images. | **Partially Implemented** | Doctor UI supports overlay controls; actual AI-generated output is unavailable. |
| **FR-5** | Patients shall be able to view screening reports and health alerts. | **Partially Implemented** | Available in `PatientDashboardPage` with static or offline data. |
| **FR-6** | The system shall store and retrieve screening analysis history. | **Partially Implemented** | The `screenings` table and list/detail GET APIs are implemented. |
| **FR-7** | Users shall be able to export reports in PDF and CSV formats. | **Planned** | UI buttons and alerts exist; backend report generation is not implemented. |
| **FR-8** | The system shall support bulk image upload. | **Out of MVP Scope** | Not included in the current MVP. |
| **FR-9** | The system shall provide in-app or push notifications for analysis events and health alerts. | **Partially Implemented** | Notification UI icon exists; the notification module is not implemented. |
| **FR-10** | The system shall support doctor–patient messaging. | **Partially Implemented** | Mock chat is available in `PatientDashboardPage`. |
| **FR-11** | Users shall be able to view, select, and renew subscription plans. | **Planned** | Mock content exists in the clinic and administration interfaces; no API is available. |
| **FR-12** | The system shall support subscription payment processing. | **Out of MVP Scope** | Not included in the current MVP. |
| **FR-13** | The system shall support OAuth2 and social login. | **Out of MVP Scope** | Not included in the current MVP. |
| **FR-14** | Doctors shall be able to view AI screening results through the Clinical Decision Support interface. | **Partially Implemented** | Available through `DoctorAnalysisPage` and the screenings API. |
| **FR-15** | Doctors shall be able to view AI-annotated images showing vessels and detected lesions. | **Partially Implemented** | UI toggles are implemented; AI-generated images are unavailable. |
| **FR-16** | Doctors shall be able to confirm or correct screening results and add clinical notes. | **Partially Implemented** | Implemented through `POST /api/v1/screenings/{id}/review`. |
| **FR-17** | The system shall store and retrieve screening history in chronological order. | **Partially Implemented** | The `screenings` table contains `created_at`; AI model versioning is not implemented. |
| **FR-18** | Doctors shall only be able to access patients assigned to them. | **Planned** | Doctors can currently view all screening records. |
| **FR-19** | The system shall support account email verification. | **Planned** | The `email_verified` column exists, but the verification workflow is not implemented. |
| **FR-20** | The system shall support consultation sessions associated with screening cases. | **Planned** | Only a mock chat interface currently exists. |
| **FR-21** | Clinic managers shall have a dashboard for managing patients. | **Partially Implemented** | `ClinicManagementPage` uses mock data. |
| **FR-22** | The system shall support clinic registration and onboarding. | **Planned** | Not implemented. |
| **FR-23** | Clinic managers shall be able to manage internal doctor and patient accounts. | **Planned** | Not implemented. |
| **FR-24** | Clinic managers shall be able to assign doctors to patients. | **Planned** | Not implemented. |
| **FR-25** | The system shall provide aggregated health-risk statistics for clinics and administrators. | **Partially Implemented** | Mock KPI data is displayed in the UI. |
| **FR-26** | The system shall provide clinic activity reports. | **Partially Implemented** | UI prototype exists; supporting APIs are not implemented. |
| **FR-27** | Clinic managers shall be able to update clinic profiles, including clinic name, address, and subscription plan. | **Planned** | Not implemented. |
| **FR-28** | The system shall provide transaction and invoice history. | **Out of MVP Scope** | Not included in the current MVP. |
| **FR-29** | Users shall be able to configure notification channels such as email, SMS, and in-app notifications. | **Planned** | Not implemented. |
| **FR-30** | Clinic managers shall be able to export consolidated clinic-level reports in PDF and CSV formats. | **Planned** | Not implemented. |
| **FR-31** | Administrators shall be able to manage user accounts. | **Planned** | Public registration currently creates `USER` accounts only. |
| **FR-32** | The system shall enforce Role-Based Access Control according to assigned user roles. | **Partially Implemented** | JWT roles are supported; endpoint-level `@PreAuthorize` authorization is incomplete. |
| **FR-33** | The system shall send subscription renewal reminders. | **Planned** | Not implemented. |
| **FR-34** | The system shall integrate with an external payment gateway. | **Out of MVP Scope** | Not included in the current MVP. |
| **FR-35** | Administrators shall be able to view screening campaign reports. | **Partially Implemented** | Mock implementation exists in `GlobalAdminPage`. |
| **FR-36** | Administrators shall be able to view screening volume and system load statistics. | **Partially Implemented** | Mock statistics are displayed in the UI. |
| **FR-37** | The system shall maintain audit logs of system activities. | **Partially Implemented** | `AdminAuditLogsPage` contains mock data; database tables and APIs are not implemented. |
| **FR-38** | Administrators shall be able to monitor service health. | **Partially Implemented** | Supported through `GET /api/v1/system/health`. |
| **FR-39** | The system shall generate security event notifications for unusual login attempts and account lockouts. | **Planned** | Not implemented. |

### 3.1 Additional MVP Capabilities

| MVP Capability (`mvp-scope.md`) | Related Requirements | Status |
| View and update user profile | FR-1 current-user endpoint; profile update is planned | Only `GET /auth/me` is implemented |
| Mock AI analysis with risk, confidence, and findings | FR-3, FR-17 | **Partially Implemented** |
| Basic doctor review workflow | FR-16 | **Partially Implemented** |
| Assigned-patient access control | FR-18, FR-24 | **Planned** |

## 4. Non-Functional Requirements

| ID | Requirement Desciption | Status | Notes |
| **NFR-1** | AI inference shall complete within 10–20 seconds per image under normal operating conditions. | **Planned** | The current mock implementation returns synchronously. |
| **NFR-11** | Sensitive data shall be de-identified before being stored or used for AI training. | **Planned** | Not implemented. |
| **NFR-12** | The system shall enforce deny-by-default Role-Based Access Control. | **Partially Implemented** | Authentication is implemented; fine-grained authorization is incomplete. |
| **NFR-13** | The system shall provide an intuitive and usable user interface. | **Partially Implemented** | A Tailwind-based frontend prototype is available. |
| **NFR-14** | The system shall meet basic accessibility requirements. | **Planned** | Not implemented. |
| **NFR-17** | The AI functionality shall be deployed as a separate microservice and accessed through an internal REST API. | **Planned** | The `ai-service` directory is currently a placeholder. |
| **NFR-18** | The system shall maintain an immutable audit trail for security-sensitive and clinical activities. | **Planned** | Not implemented. |
| **NFR-20** | Generated PDF and CSV reports shall follow an approved healthcare-reporting format. | **Planned** | Not implemented. |
| **NFR-21** | The backend shall orchestrate all AI requests, and the AI service shall not be directly exposed to client applications. | **Partially Implemented** | The architecture follows this rule, but AI integration is not implemented. |
| **NFR-22** | Computer vision outputs, including segmentation and heatmaps, shall meet defined quality and accuracy thresholds. | **Planned** | Quality metrics have not been implemented. |
| **NFR-23** | The system shall record the AI model version and decision thresholds used for each screening result. | **Planned** | The current `Screening` entity does not contain these fields. |

## 5. External Interface Requirements

### 5.1 Backend API

Refer to `../05-api/backend-api.md`. The API documentation must remain
synchronized with the current implementation.

#### Screening API

- `POST /api/v1/screenings`- Creates a screening record, Currently generates mock AI analysis results.

- `GET /api/v1/screenings` - Returns a list of screening records, A `USER` can access only their own records, A `DOCTOR` or `ADMIN` can currently access all records.

- `GET /api/v1/screenings/{id}` - Returns the details of a specific screening record.

- `POST /api/v1/screenings/{id}/review` - Adds a doctor's review, Updates the risk assessment, Changes the screening status to `REVIEWED`.

### 5.2 AI Service

- `GET /health` - Returns the health status of the AI service.

- `POST /predict` - Accepts an image reference, Returns risk levels, findings, annotated-image URLs, confidence scores, model version, and threshold information.

### 5.3 Frontend

- Proxy dev: `/api` → `http://localhost:8080` (`vite.config.ts`).

## 6. Logic Data Model

- The main entities currently implemented are: `user`, `role`, `user_roles`, `refresh_tokens`, and `screening`.
