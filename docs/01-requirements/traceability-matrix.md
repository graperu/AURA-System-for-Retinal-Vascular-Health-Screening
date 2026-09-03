#Traceability matrix

## Infrastructure and Platform

| ID | Description | Status | Evidence |
| Backend Foundation | Spring Boot 3, Java 21, modular packages | Done | `backend/`, `CHANGELOG.md` |
| Database foundation | Flyway, PostgreSQL, UUID entities | Done | `V001`-`V006`, JPA entities |
| Health API | `GET /api/v1/system/health` | Done | `SystemHealthControler ` |
| Error handling | Envelope + secure error codes | Done | `GlobalExceptionHandler`, `errer-codes.md` |
| Frontend shell | React + TS + Vite + multi-portal routing | Partial | `frontend/src/` |
| AI microservice | FastAPI inference | Planned | `ai-service/README.md` only |
| CI / Github Actions | Automated pipeline | Planned | `.github/README.md` |

## Functional requirements (FR-1 .... FR-39)

| FR | Summary | Status | Evidence |
| FR-1 | User registration, login, JWT, refresh, logout, and current-user profile | Done | `AuthController`, `AuthService`, `AuthIntegrationTest` |
| FR-2 | Fundus image upload | Partial | `NewScreeningPage`; `CreateScreeningRequest.imageUrl` - no storage |
| FR-3 | AI analysis and risk assessment | Partial | `ScreeningService` mock random |
| FR-4 | Segmentation / heatmap | Partial | `DoctorAnalysisPage` UI toggles |
| FR-5 | Patient reports and alerts | Partial | `PatientDashboardPage` |
| FR-6 | Analysis history storage | Partial `screening` table + GET APIs |
| FR-7 | Export PDF/CSV | Planned | UI alert only |
| FR-8 | Bulk upload | Out of MVP | `mvp-scope.md` |
| FR-9 | Event-based notifications | Partial | UI only |
| FR-10 | Doctor-patient messaging | Partial | Chat mock `PatientDashboardPage` |
| FR-11 | Subscription plan management | Planned | Mock text admin/ckinic |
| FR-12 | Payment processing | Out of MVP | - |
| FR-13 | OAuth2/social login | Out of MVP | - |
| FR-14 | Clinical Decision Support access to AI results | Partial | `DoctorAnalysisPage` + screenings API |
| FR-15 | AI-generated image annotations | Partial | UI overlay, no AI asset |  
| FR-16 | Result confirmation and correction | Partial | `Post .../ review`,`ScreeningService.addDoctorReview` |
| FR-17 | Time-based patient history retrieval | Partial | `findByPatientIdOrderByCreatedAtDesc` |
| FR-18 | Doctors can only access assigned patients | Doctor sees all in `ScreeningController ` |
| FR-19 | Email verification | Planned | Column `email_verified`, no flow |
| FR-20 | Consulation chat | Planned | UI mock |
| FR-21 | Clinic patient management dashboard | Partial | `ClinicManagementPage` mock |
| FR-22 | Clinic registration | Planned | - |
| FR-23 | Internal doctor and patient management | Planned | - |
| FR-24 | Doctor–patient assignment | Planned | - |
| FR-25 | Aggregated risk statistics | Partial | UI KPI mock |
| FR-26 | Clinic activity reports | Partial | UI mock |
| FR-27 | Clinic profile management | Planned | - |
| FR-28 | Transaction history | Out of MVP | - |
| FR-29 | Notification configuration | Planned | - |
| FR-30 | Clinic-level consolidated report export | Planned | - |
| FR-31 | User account administration | Planned | Register forces `USER` only |
| FR-32 | RBAC | Partial | `RoleName`, JWT authorities ; no method-level on screenings |
| FR-33 | Subscription renewal reminders | Planned | - |
| FR-34 | Payment gateway integration | Out of MVP | - |
| FR-35 | Administrative campaign reports | Partial | `GlobalAdminPage` |
| FR-36 | Screening and infrastructure statistics | Partial | UI mock |
| FR-37 | Audit logging | Partial | `AdminAuditLogsPage` mock |
| FR-38 | Service health monitoring | Partial | `SystemHealthController` |
| FR-39 | Security notifications | Planned | - |

### Functional Requirements Summary

| Status | Count |
| Done | 1 |
| Partial | 20 |
| Planned | 13 |
| Out of MVP | 5 |

## Non-functional requirements (NFR)

| NFR | Description | Status | Evidence |
| NFR-1 | AI 10s-20s/image | Planned | Mock sync |
| NFR-11 | Data anonymization for AI processing | Planned | - |
| NFR-12 | RBAC deny-by-default | Partial | `SecurityConfig`, JWT filter |
| NFR-13 | Usability | Partial | Frontend prototype |
| NFR-14 | Accessibility | Planned | - |
| NFR-17 | AI microservice REST | Planned | Architecture docs |
| NFR-18 | Audit trail | Planned | - |
| NFR-20 | Healthcare-standard PDF and CSV reports | Planned | - |
| NFR-21 | Client applications must not call the AI service directly | Partial | Design enforced; AI not wired |
| NFR-22 | Computer vision output quality | Planned | - |
| NFR-23 | Model/threshold version | Planned | Not in `Screening` entity yet |

## API-to-FR Traceability

| Endpoint | Related Functional Requirements |
| `POST /api/v1/auth/register` | FR-1 |
| `POST /api/v1/auth/login` | FR-1 |
| `POST /api/v1/auth/refresh` | FR-1 |
| `POST /api/v1/auth/logout` | FR-1 |
| `GET /api/v1/auth/me` | FR-1, profile(Partial) |
| `GET /api/v1/system/health` | FR-38 |
| `POST /api/v1/screenings` | FR-2, FR-3, FR-6 |
| `GET /api/v1/screenings` | FR-6, FR-14, FR-17 |
| `GET /api/v1/screenings/{id}` | FR-6, FR-14 |
| `POST /api/v1/screenings/{id}/review` | FR-16 |

## Frontend-to-FR (prototype)

| Route / page | Related FR | Backend |
| `/login` | FR-1 | Yes |
| `/upload` | FR-2, FR-3 | Partial |
| `/patient`, `/patient/history` | FR-5, FR-6, FR-7 | Partial / mock |
| `/doctor` | FR-14, FR-15, FR-16 | Partial |
| `/clinic` | FR-21, FR-25, FR-26, FR-30 | Mock |
| `/admin` | FR-35, FR-36, FR-38 | Mock |
| `/audit` | FR-37 | Mock |
