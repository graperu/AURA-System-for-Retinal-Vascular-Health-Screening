# AURA — Bản đồ source và endpoint

Tạo từ source local ngày 09/09/2026. Dòng code dùng để mở nhanh; tên method và endpoint là mốc bền vững hơn sau khi source thay đổi. Danh sách route dưới đây là khai báo trong code, không phải xác nhận mọi route hoạt động hoặc được phân quyền đúng.

## Các mốc quan trọng

- [frontend/src/App.tsx — dòng 33](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/App.tsx:33>) · `const portal`
- [frontend/src/context/AuthContext.tsx — dòng 60](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/context/AuthContext.tsx:60>) · `const login =`
- [frontend/src/services/api.ts — dòng 30](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/services/api.ts:30>) · `const request =`
- [frontend/src/services/api.ts — dòng 83](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/services/api.ts:83>) · `export async function apiFetch`
- [frontend/src/pages/DoctorPatientListPage.tsx — dòng 32](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/DoctorPatientListPage.tsx:32>) · `const normalizeVietnamese`
- [frontend/src/pages/DoctorPatientListPage.tsx — dòng 206](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/DoctorPatientListPage.tsx:206>) · `const filteredPatients`
- [frontend/src/pages/DoctorPatientListPage.tsx — dòng 590](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/DoctorPatientListPage.tsx:590>) · `value={searchTerm}`
- [frontend/src/pages/DoctorPatientListPage.tsx — dòng 852](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/DoctorPatientListPage.tsx:852>) · `paginatedPatients.map`
- [frontend/src/pages/AdminAuditLogsPage.tsx — dòng 99](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/AdminAuditLogsPage.tsx:99>) · `const loadUsers`
- [frontend/src/pages/AdminAuditLogsPage.tsx — dòng 792](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/AdminAuditLogsPage.tsx:792>) · `value={userSearchQuery}`
- [frontend/src/components/PatientUploader.tsx — dòng 52](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/PatientUploader.tsx:52>) · `const validateFile`
- [frontend/src/pages/PatientPortalPage.tsx — dòng 257](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/PatientPortalPage.tsx:257>) · `const handleStartAnalysis`
- [frontend/src/pages/CDSDashboardPage.tsx — dòng 243](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/CDSDashboardPage.tsx:243>) · `const handleSaveFeedback`
- [frontend/src/services/screeningMapper.ts — dòng 29](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/services/screeningMapper.ts:29>) · `const overallScore`
- [backend/src/main/java/com/aura/auth/service/AuthService.java — dòng 97](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/service/AuthService.java:97>) · `public LoginResult login(`
- [backend/src/main/java/com/aura/auth/service/AuthService.java — dòng 119](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/service/AuthService.java:119>) · `public LoginResult loginWithSocial`
- [backend/src/main/java/com/aura/screening/service/ScreeningService.java — dòng 67](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/service/ScreeningService.java:67>) · `public Screening createScreening(UUID patientId, String`
- [backend/src/main/java/com/aura/screening/service/ScreeningService.java — dòng 245](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/service/ScreeningService.java:245>) · `public Screening addDoctorReview`
- [backend/src/main/java/com/aura/user/repository/UserRepository.java — dòng 21](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/user/repository/UserRepository.java:21>) · `@Query`
- [backend/src/main/java/com/aura/patient/repository/PatientSpecification.java — dòng 11](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/repository/PatientSpecification.java:11>) · `filterPatients`
- [backend/src/main/java/com/aura/auth/service/PatientAccessService.java — dòng 28](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/service/PatientAccessService.java:28>) · `public boolean canAccessPatient`
- [backend/src/main/java/com/aura/billing/service/AuraPaymentGatewayProvider.java — dòng 28](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/service/AuraPaymentGatewayProvider.java:28>) · `public GatewayResult charge(String buyerEmail, BigDecimal amount, String`
- [backend/src/main/java/com/aura/bulk/service/AiServiceClient.java — dòng 70](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/service/AiServiceClient.java:70>) · `simulatePythonAiInference`
- [ai-service/app/services/model_engine.py — dòng 14](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/app/services/model_engine.py:14>) · `def analyze_fundus_image`

## Frontend: entry, state, API, pages và components

- [frontend/src/App.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/App.tsx>)
- [frontend/src/components/auth/AuthHeroPanel.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/auth/AuthHeroPanel.tsx>)
- [frontend/src/components/auth/DoctorArtwork.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/auth/DoctorArtwork.tsx>)
- [frontend/src/components/auth/LoginForm.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/auth/LoginForm.tsx>)
- [frontend/src/components/auth/LoginPage.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/auth/LoginPage.tsx>)
- [frontend/src/components/auth/PasswordInput.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/auth/PasswordInput.tsx>)
- [frontend/src/components/auth/RegisterForm.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/auth/RegisterForm.tsx>)
- [frontend/src/components/BatchItemDetailModal.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/BatchItemDetailModal.tsx>)
- [frontend/src/components/BatchUploadModal.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/BatchUploadModal.tsx>)
- [frontend/src/components/ClinicalValidationBar.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/ClinicalValidationBar.tsx>)
- [frontend/src/components/ClinicBatchProcessing.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/ClinicBatchProcessing.tsx>)
- [frontend/src/components/ClinicCampaignAnalytics.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/ClinicCampaignAnalytics.tsx>)
- [frontend/src/components/ConsultationChatModal.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/ConsultationChatModal.tsx>)
- [frontend/src/components/CreditPurchaseModal.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/CreditPurchaseModal.tsx>)
- [frontend/src/components/DoctorDiagnosisModal.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/DoctorDiagnosisModal.tsx>)
- [frontend/src/components/Footer.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/Footer.tsx>)
- [frontend/src/components/Header.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/Header.tsx>)
- [frontend/src/components/InteractiveCDSViewer.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/InteractiveCDSViewer.tsx>)
- [frontend/src/components/LabDocumentsPanel.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/LabDocumentsPanel.tsx>)
- [frontend/src/components/MedicalProfileModal.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/MedicalProfileModal.tsx>)
- [frontend/src/components/MedicalReportModal.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/MedicalReportModal.tsx>)
- [frontend/src/components/PatientAssignmentBoard.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/PatientAssignmentBoard.tsx>)
- [frontend/src/components/PatientUploader.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/PatientUploader.tsx>)
- [frontend/src/components/RiskAssessmentPanel.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/RiskAssessmentPanel.tsx>)
- [frontend/src/components/SideNavBar.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/components/SideNavBar.tsx>)
- [frontend/src/config/firebase.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/config/firebase.ts>)
- [frontend/src/context/AuthContext.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/context/AuthContext.tsx>)
- [frontend/src/main.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/main.tsx>)
- [frontend/src/pages/AdminAuditLogsPage.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/AdminAuditLogsPage.tsx>)
- [frontend/src/pages/CDSDashboardPage.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/CDSDashboardPage.tsx>)
- [frontend/src/pages/ClinicPortalPage.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/ClinicPortalPage.tsx>)
- [frontend/src/pages/DoctorPatientListPage.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/DoctorPatientListPage.tsx>)
- [frontend/src/pages/PatientPortalPage.tsx](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/pages/PatientPortalPage.tsx>)
- [frontend/src/services/api.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/services/api.ts>)
- [frontend/src/services/mockAiEngine.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/services/mockAiEngine.ts>)
- [frontend/src/services/screeningMapper.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/services/screeningMapper.ts>)
- [frontend/src/types/auth.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/types/auth.ts>)
- [frontend/src/types/cds.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/types/cds.ts>)
- [frontend/src/vite-env.d.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/src/vite-env.d.ts>)

## Backend: tất cả controller và route khai báo

### [AdminRoleController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java>)

- [Dòng 22](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java:22>) · `@RequestMapping("/api/v1/admin/roles")`
- [Dòng 32](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java:32>) · `@GetMapping`
- [Dòng 33](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java:33>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 39](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java:39>) · `@PutMapping("/{roleName}")`
- [Dòng 40](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java:40>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 47](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java:47>) · `@PutMapping("/{roleName}/permissions")`
- [Dòng 48](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminRoleController.java:48>) · `@PreAuthorize("hasRole('ADMIN')")`

### [AdminUserController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java>)

- [Dòng 36](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:36>) · `@RequestMapping("/api/v1/admin")`
- [Dòng 50](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:50>) · `@GetMapping("/users")`
- [Dòng 51](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:51>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 63](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:63>) · `@PutMapping("/users/{userId}")`
- [Dòng 64](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:64>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 71](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:71>) · `@RequestMapping(value = "/users/{userId}/status", method = {RequestMethod.PUT, RequestMethod.PATCH})`
- [Dòng 72](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:72>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 80](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:80>) · `@RequestMapping(value = "/users/{userId}/role", method = {RequestMethod.PUT, RequestMethod.PATCH})`
- [Dòng 81](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:81>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 88](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:88>) · `@PutMapping("/clinics/{clinicId}/approve")`
- [Dòng 89](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:89>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 96](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:96>) · `@PutMapping("/clinics/{clinicId}/suspend")`
- [Dòng 97](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:97>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 104](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:104>) · `@GetMapping("/ai-config")`
- [Dòng 105](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:105>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 111](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:111>) · `@PutMapping("/ai-config")`
- [Dòng 112](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:112>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 118](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:118>) · `@GetMapping("/patient-assignments")`
- [Dòng 119](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:119>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 125](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:125>) · `@PutMapping("/patient-assignments")`
- [Dòng 126](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:126>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 135](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:135>) · `@DeleteMapping("/patient-assignments/{doctorId}/{patientId}")`
- [Dòng 136](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/controller/AdminUserController.java:136>) · `@PreAuthorize("hasRole('ADMIN')")`

### [AdminAuditController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/controller/AdminAuditController.java>)

- [Dòng 20](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/controller/AdminAuditController.java:20>) · `@RequestMapping("/api/v1/admin/audit-logs")`
- [Dòng 30](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/controller/AdminAuditController.java:30>) · `@GetMapping`
- [Dòng 31](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/controller/AdminAuditController.java:31>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 41](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/controller/AdminAuditController.java:41>) · `@GetMapping("/export")`
- [Dòng 42](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/controller/AdminAuditController.java:42>) · `@PreAuthorize("hasRole('ADMIN')")`

### [AuthController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java>)

- [Dòng 17](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:17>) · `@RequestMapping("/api/v1/auth")`
- [Dòng 28](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:28>) · `@PostMapping("/send-otp")`
- [Dòng 37](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:37>) · `@PostMapping("/verify-otp")`
- [Dòng 43](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:43>) · `@PostMapping("/register")`
- [Dòng 49](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:49>) · `@PostMapping("/login")`
- [Dòng 55](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:55>) · `@PostMapping("/google")`
- [Dòng 61](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:61>) · `@PostMapping("/social")`
- [Dòng 67](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:67>) · `@PostMapping("/refresh")`
- [Dòng 76](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:76>) · `@PostMapping("/logout")`
- [Dòng 85](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/controller/AuthController.java:85>) · `@GetMapping("/me")`

### [AdminServicePackageController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java>)

- [Dòng 19](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java:19>) · `@RequestMapping("/api/v1/admin/packages")`
- [Dòng 20](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java:20>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 29](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java:29>) · `@GetMapping`
- [Dòng 34](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java:34>) · `@PostMapping`
- [Dòng 40](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java:40>) · `@PutMapping("/{id}")`
- [Dòng 45](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/AdminServicePackageController.java:45>) · `@PatchMapping("/{id}/status")`

### [BillingController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/BillingController.java>)

- [Dòng 18](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/BillingController.java:18>) · `@RequestMapping("/api/v1/me")`
- [Dòng 27](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/BillingController.java:27>) · `@PostMapping("/packages/{packageId}/purchase")`
- [Dòng 37](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/BillingController.java:37>) · `@GetMapping("/subscriptions")`
- [Dòng 42](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/BillingController.java:42>) · `@GetMapping("/payments")`

### [ServicePackageController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/ServicePackageController.java>)

- [Dòng 16](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/ServicePackageController.java:16>) · `@RequestMapping("/api/v1/packages")`
- [Dòng 25](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/controller/ServicePackageController.java:25>) · `@GetMapping`

### [BulkScreeningController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java>)

- [Dòng 27](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:27>) · `@RequestMapping("/api/v1/bulk-screening")`
- [Dòng 47](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:47>) · `@PostMapping("/batch")`
- [Dòng 122](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:122>) · `@GetMapping("/batches")`
- [Dòng 131](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:131>) · `@GetMapping("/batch/{batchId}")`
- [Dòng 148](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:148>) · `@GetMapping("/batch/{batchId}/statistics")`
- [Dòng 167](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:167>) · `@GetMapping("/batch/{batchId}/alerts")`
- [Dòng 186](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:186>) · `@GetMapping("/batch/{batchId}/items/{itemId}")`
- [Dòng 205](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java:205>) · `@PostMapping("/batch/{batchId}/cancel")`

### [ChatController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java>)

- [Dòng 24](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:24>) · `@RequestMapping("/api/v1/chat")`
- [Dòng 34](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:34>) · `@PostMapping("/messages")`
- [Dòng 35](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:35>) · `@PreAuthorize("isAuthenticated() && @patientAccessService.canChatBetween(principal, #request.receiverId())")`
- [Dòng 44](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:44>) · `@GetMapping("/conversation/{otherUserId}")`
- [Dòng 45](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:45>) · `@PreAuthorize("isAuthenticated() && @patientAccessService.canChatBetween(principal, #otherUserId)")`
- [Dòng 55](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:55>) · `@GetMapping("/screening/{screeningId}")`
- [Dòng 56](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:56>) · `@PreAuthorize("isAuthenticated() && @patientAccessService.canAccessScreening(principal, #screeningId)")`
- [Dòng 63](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:63>) · `@PutMapping("/read/{senderId}")`
- [Dòng 64](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/controller/ChatController.java:64>) · `@PreAuthorize("isAuthenticated() && @patientAccessService.canChatBetween(principal, #senderId)")`

### [ClinicAnalyticsController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicAnalyticsController.java>)

- [Dòng 16](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicAnalyticsController.java:16>) · `@RequestMapping("/api/v1/clinic/analytics")`
- [Dòng 22](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicAnalyticsController.java:22>) · `@GetMapping("/campaigns")`
- [Dòng 30](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicAnalyticsController.java:30>) · `@GetMapping(value = "/export", produces = "text/csv")`

### [ClinicMemberController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java>)

- [Dòng 20](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:20>) · `@RequestMapping("/api/v1/clinic/members")`
- [Dòng 29](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:29>) · `@GetMapping`
- [Dòng 30](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:30>) · `@PreAuthorize("hasRole('CLINIC')")`
- [Dòng 38](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:38>) · `@PostMapping`
- [Dòng 40](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:40>) · `@PreAuthorize("hasRole('CLINIC')")`
- [Dòng 48](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:48>) · `@DeleteMapping("/{memberId}")`
- [Dòng 49](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:49>) · `@PreAuthorize("hasRole('CLINIC')")`
- [Dòng 57](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:57>) · `@PostMapping("/{doctorId}/patients/{patientId}")`
- [Dòng 58](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:58>) · `@PreAuthorize("hasRole('CLINIC')")`
- [Dòng 68](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:68>) · `@DeleteMapping("/{doctorId}/patients/{patientId}")`
- [Dòng 69](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicMemberController.java:69>) · `@PreAuthorize("hasRole('CLINIC')")`

### [ClinicProfileController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java>)

- [Dòng 33](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:33>) · `@PostMapping("/api/v1/clinic/profile")`
- [Dòng 34](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:34>) · `@PreAuthorize("hasRole('CLINIC')")`
- [Dòng 43](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:43>) · `@GetMapping("/api/v1/clinic/profile")`
- [Dòng 44](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:44>) · `@PreAuthorize("hasRole('CLINIC')")`
- [Dòng 53](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:53>) · `@GetMapping("/api/v1/admin/clinics")`
- [Dòng 54](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:54>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 62](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:62>) · `@PutMapping("/api/v1/admin/clinics/{clinicProfileId}")`
- [Dòng 63](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:63>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 72](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:72>) · `@PatchMapping("/api/v1/admin/clinics/{clinicProfileId}/verify")`
- [Dòng 73](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/controller/ClinicProfileController.java:73>) · `@PreAuthorize("hasRole('ADMIN')")`

### [DoctorPatientController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java>)

- [Dòng 32](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:32>) · `@RequestMapping("/api/v1/doctor/patients")`
- [Dòng 49](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:49>) · `@GetMapping`
- [Dòng 50](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:50>) · `@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")`
- [Dòng 101](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:101>) · `@PostMapping`
- [Dòng 102](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:102>) · `@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")`
- [Dòng 110](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:110>) · `@PutMapping("/{id}")`
- [Dòng 111](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:111>) · `@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")`
- [Dòng 119](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:119>) · `@GetMapping("/{patientId}")`
- [Dòng 120](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:120>) · `@PreAuthorize("hasRole('DOCTOR')")`
- [Dòng 127](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:127>) · `@GetMapping("/{patientId}/screenings")`
- [Dòng 128](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:128>) · `@PreAuthorize("hasRole('DOCTOR')")`
- [Dòng 135](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:135>) · `@PostMapping("/{patientId}/screenings")`
- [Dòng 137](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java:137>) · `@PreAuthorize("hasRole('DOCTOR')")`

### [DoctorFeedbackController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java>)

- [Dòng 28](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java:28>) · `@RequestMapping("/api/v1/doctor/feedback")`
- [Dòng 38](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java:38>) · `@PostMapping`
- [Dòng 39](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java:39>) · `@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")`
- [Dòng 49](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java:49>) · `@GetMapping`
- [Dòng 50](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java:50>) · `@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")`
- [Dòng 62](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java:62>) · `@GetMapping("/screening/{screeningId}")`
- [Dòng 63](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/controller/DoctorFeedbackController.java:63>) · `@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")`

### [AdminNotificationController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java>)

- [Dòng 27](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:27>) · `@RequestMapping("/api/v1/admin")`
- [Dòng 37](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:37>) · `@GetMapping("/notification-templates")`
- [Dòng 38](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:38>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 45](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:45>) · `@PostMapping("/notification-templates")`
- [Dòng 46](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:46>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 54](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:54>) · `@PutMapping("/notification-templates/{id}")`
- [Dòng 55](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:55>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 62](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:62>) · `@DeleteMapping("/notification-templates/{id}")`
- [Dòng 63](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:63>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 70](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:70>) · `@GetMapping("/communication-policy")`
- [Dòng 71](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:71>) · `@PreAuthorize("hasRole('ADMIN')")`
- [Dòng 77](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:77>) · `@PutMapping("/communication-policy")`
- [Dòng 78](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/AdminNotificationController.java:78>) · `@PreAuthorize("hasRole('ADMIN')")`

### [UserNotificationController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java>)

- [Dòng 26](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java:26>) · `@RequestMapping("/api/v1/notifications")`
- [Dòng 36](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java:36>) · `@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)`
- [Dòng 42](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java:42>) · `@GetMapping`
- [Dòng 51](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java:51>) · `@GetMapping("/paged")`
- [Dòng 63](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java:63>) · `@GetMapping("/unread-count")`
- [Dòng 71](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java:71>) · `@PutMapping("/{id}/read")`
- [Dòng 79](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/controller/UserNotificationController.java:79>) · `@PutMapping("/read-all")`

### [PatientProfileController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java>)

- [Dòng 28](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:28>) · `@RequestMapping("/api/v1/patient/profile")`
- [Dòng 40](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:40>) · `@GetMapping`
- [Dòng 48](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:48>) · `@PutMapping`
- [Dòng 57](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:57>) · `@GetMapping("/{patientId}")`
- [Dòng 58](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:58>) · `@PreAuthorize("@patientAccessService.canAccessPatient(principal, #patientId)")`
- [Dòng 66](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:66>) · `@GetMapping("/lab-documents")`
- [Dòng 67](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:67>) · `@PreAuthorize("hasRole('USER')")`
- [Dòng 73](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:73>) · `@PostMapping(value = "/lab-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)`
- [Dòng 74](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:74>) · `@PreAuthorize("hasRole('USER')")`
- [Dòng 82](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:82>) · `@DeleteMapping("/lab-documents/{documentId}")`
- [Dòng 83](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:83>) · `@PreAuthorize("hasRole('USER')")`
- [Dòng 91](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:91>) · `@GetMapping("/{patientId}/lab-documents")`
- [Dòng 92](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:92>) · `@PreAuthorize("@patientAccessService.canAccessPatient(principal, #patientId)")`
- [Dòng 98](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:98>) · `@GetMapping("/{patientId}/lab-documents/{documentId}/content")`
- [Dòng 99](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/controller/PatientProfileController.java:99>) · `@PreAuthorize("@patientAccessService.canAccessPatient(principal, #patientId)")`

### [ScreeningController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java>)

- [Dòng 20](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java:20>) · `@RequestMapping("/api/v1/screenings")`
- [Dòng 29](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java:29>) · `@PostMapping`
- [Dòng 41](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java:41>) · `@GetMapping`
- [Dòng 59](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java:59>) · `@GetMapping("/{id}")`
- [Dòng 60](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java:60>) · `@PreAuthorize("@patientAccessService.canAccessScreening(principal, #id)")`
- [Dòng 68](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java:68>) · `@PostMapping("/{id}/review")`
- [Dòng 69](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/controller/ScreeningController.java:69>) · `@PreAuthorize("hasRole('DOCTOR') && @patientAccessService.canReviewScreening(principal, #id)")`

### [SystemHealthController](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/system/controller/SystemHealthController.java>)

- [Dòng 10](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/system/controller/SystemHealthController.java:10>) · `@RequestMapping("/api/v1/system")`
- [Dòng 13](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/system/controller/SystemHealthController.java:13>) · `@GetMapping("/health")`

## Backend: service, repository, entity và cấu hình

### admin

- [AdminPatientAssignmentService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/service/AdminPatientAssignmentService.java>)
- [AdminRoleService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/service/AdminRoleService.java>)
- [AdminUserService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/admin/service/AdminUserService.java>)

### audit

- [AuditLog.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/entity/AuditLog.java>)
- [AuditLogRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/repository/AuditLogRepository.java>)
- [AuditLogService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/audit/service/AuditLogService.java>)

### auth

- [AuthProperties.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/config/AuthProperties.java>)
- [CorsProperties.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/config/CorsProperties.java>)
- [SecurityConfig.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/config/SecurityConfig.java>)
- [RefreshToken.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/entity/RefreshToken.java>)
- [RefreshTokenRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/repository/RefreshTokenRepository.java>)
- [AuraUserPrincipal.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/security/AuraUserPrincipal.java>)
- [CustomUserDetailsService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/security/CustomUserDetailsService.java>)
- [JwtAuthenticationFilter.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/security/JwtAuthenticationFilter.java>)
- [JwtTokenProvider.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/security/JwtTokenProvider.java>)
- [RestAccessDeniedHandler.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/security/RestAccessDeniedHandler.java>)
- [RestAuthenticationEntryPoint.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/security/RestAuthenticationEntryPoint.java>)
- [TrustedOriginFilter.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/security/TrustedOriginFilter.java>)
- [AuthService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/service/AuthService.java>)
- [OtpService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/service/OtpService.java>)
- [PatientAccessService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/service/PatientAccessService.java>)
- [RefreshTokenService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/auth/service/RefreshTokenService.java>)

### billing

- [PackageScope.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/entity/PackageScope.java>)
- [PaymentStatus.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/entity/PaymentStatus.java>)
- [PaymentTransaction.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/entity/PaymentTransaction.java>)
- [ServicePackage.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/entity/ServicePackage.java>)
- [Subscription.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/entity/Subscription.java>)
- [SubscriptionStatus.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/entity/SubscriptionStatus.java>)
- [PaymentTransactionRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/repository/PaymentTransactionRepository.java>)
- [ServicePackageRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/repository/ServicePackageRepository.java>)
- [SubscriptionRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/repository/SubscriptionRepository.java>)
- [AuraPaymentGatewayProvider.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/service/AuraPaymentGatewayProvider.java>)
- [BillingService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/service/BillingService.java>)
- [PaymentGateway.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/service/PaymentGateway.java>)
- [ServicePackageService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/service/ServicePackageService.java>)
- [UnavailablePaymentGateway.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/billing/service/UnavailablePaymentGateway.java>)

### bulk

- [AiServiceClient.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/service/AiServiceClient.java>)
- [PatientAnonymizerService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/bulk/service/PatientAnonymizerService.java>)

### chat

- [ChatMessage.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/entity/ChatMessage.java>)
- [ChatMessageRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/repository/ChatMessageRepository.java>)
- [ChatService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/chat/service/ChatService.java>)

### clinic

- [ClinicMember.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/entity/ClinicMember.java>)
- [ClinicMemberStatus.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/entity/ClinicMemberStatus.java>)
- [ClinicProfile.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/entity/ClinicProfile.java>)
- [VerificationStatus.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/entity/VerificationStatus.java>)
- [ClinicMemberRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/repository/ClinicMemberRepository.java>)
- [ClinicProfileRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/repository/ClinicProfileRepository.java>)
- [ClinicAnalyticsService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/service/ClinicAnalyticsService.java>)
- [ClinicMemberService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/service/ClinicMemberService.java>)
- [ClinicProfileService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/clinic/service/ClinicProfileService.java>)

### common


### doctor

- [AssignmentStatus.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/entity/AssignmentStatus.java>)
- [DoctorPatientAssignment.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/entity/DoctorPatientAssignment.java>)
- [DoctorPatientAssignmentRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/repository/DoctorPatientAssignmentRepository.java>)
- [DoctorPatientAssignmentService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/doctor/service/DoctorPatientAssignmentService.java>)

### feedback

- [DoctorFeedback.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/entity/DoctorFeedback.java>)
- [DoctorFeedbackRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/repository/DoctorFeedbackRepository.java>)
- [DoctorFeedbackService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/feedback/service/DoctorFeedbackService.java>)

### notification

- [CommunicationPolicy.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/entity/CommunicationPolicy.java>)
- [NotificationTemplate.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/entity/NotificationTemplate.java>)
- [UserNotification.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/entity/UserNotification.java>)
- [CommunicationPolicyRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/repository/CommunicationPolicyRepository.java>)
- [NotificationTemplateRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/repository/NotificationTemplateRepository.java>)
- [UserNotificationRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/repository/UserNotificationRepository.java>)
- [NotificationAdminService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/service/NotificationAdminService.java>)
- [UserNotificationService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/notification/service/UserNotificationService.java>)

### patient

- [PatientLabDocument.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/entity/PatientLabDocument.java>)
- [PatientMedicalProfile.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/entity/PatientMedicalProfile.java>)
- [PatientProfile.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/entity/PatientProfile.java>)
- [PatientLabDocumentRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/repository/PatientLabDocumentRepository.java>)
- [PatientMedicalProfileRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/repository/PatientMedicalProfileRepository.java>)
- [PatientProfileRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/repository/PatientProfileRepository.java>)
- [PatientSpecification.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/repository/PatientSpecification.java>)
- [PatientLabDocumentService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/service/PatientLabDocumentService.java>)
- [PatientProfileService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/patient/service/PatientProfileService.java>)

### role

- [Role.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/role/entity/Role.java>)
- [RolePermission.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/role/entity/RolePermission.java>)
- [RolePermissionRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/role/repository/RolePermissionRepository.java>)
- [RoleRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/role/repository/RoleRepository.java>)

### screening

- [ReviewDecision.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/entity/ReviewDecision.java>)
- [RiskLevel.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/entity/RiskLevel.java>)
- [Screening.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/entity/Screening.java>)
- [ScreeningStatus.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/entity/ScreeningStatus.java>)
- [ScreeningRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/repository/ScreeningRepository.java>)
- [ScreeningService.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/screening/service/ScreeningService.java>)

### system


### user

- [User.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/user/entity/User.java>)
- [UserRole.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/user/entity/UserRole.java>)
- [UserRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/user/repository/UserRepository.java>)
- [UserRoleRepository.java](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/java/com/aura/user/repository/UserRoleRepository.java>)

## AI source

- [ai-service/app/api/v1/endpoints/predict.py](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/app/api/v1/endpoints/predict.py>)
- [ai-service/app/core/config.py](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/app/core/config.py>)
- [ai-service/app/main.py](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/app/main.py>)
- [ai-service/app/schemas/prediction.py](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/app/schemas/prediction.py>)
- [ai-service/app/services/image_processor.py](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/app/services/image_processor.py>)
- [ai-service/app/services/model_engine.py](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/app/services/model_engine.py>)

## Cấu hình chạy và kiểm thử

- [frontend/package.json](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/package.json>)
- [frontend/vite.config.ts](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/vite.config.ts>)
- [frontend/nginx.conf](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/frontend/nginx.conf>)
- [backend/pom.xml](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/pom.xml>)
- [backend/src/main/resources/application.yml](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/application.yml>)
- [backend/src/test/resources/application.yml](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/test/resources/application.yml>)
- [ai-service/requirements.txt](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/ai-service/requirements.txt>)
- [docker-compose.yml](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/docker-compose.yml>)
- [start-system.bat](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/start-system.bat>)

## Migration hiện tại

- [V001__create_roles_table.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V001__create_roles_table.sql>)
- [V002__create_users_table.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V002__create_users_table.sql>)
- [V003__create_user_roles_table.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V003__create_user_roles_table.sql>)
- [V004__seed_default_roles.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V004__seed_default_roles.sql>)
- [V005__create_refresh_tokens_table.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V005__create_refresh_tokens_table.sql>)
- [V006__create_screenings_table.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V006__create_screenings_table.sql>)
- [V007__seed_clinic_role.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V007__seed_clinic_role.sql>)
- [V008__create_billing_tables.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V008__create_billing_tables.sql>)
- [V009__create_audit_logs_and_feedback_tables.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V009__create_audit_logs_and_feedback_tables.sql>)
- [V010__create_chat_messages_table.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V010__create_chat_messages_table.sql>)
- [V011__add_failed_to_screening_status_check.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V011__add_failed_to_screening_status_check.sql>)
- [V012__add_ai_analysis_fields_to_screenings.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V012__add_ai_analysis_fields_to_screenings.sql>)
- [V013__create_patient_medical_profiles.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V013__create_patient_medical_profiles.sql>)
- [V014__remove_mock_defaults_from_patient_medical_profiles.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V014__remove_mock_defaults_from_patient_medical_profiles.sql>)
- [V015__allow_null_chronic_conditions.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V015__allow_null_chronic_conditions.sql>)
- [V016__create_doctor_patient_assignments.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V016__create_doctor_patient_assignments.sql>)
- [V017__create_patient_lab_documents.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V017__create_patient_lab_documents.sql>)
- [V018__add_ai_and_doctor_risk_levels_to_screenings.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V018__add_ai_and_doctor_risk_levels_to_screenings.sql>)
- [V019__create_clinic_profiles_and_members.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V019__create_clinic_profiles_and_members.sql>)
- [V021__admin_rbac_and_notification_templates.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V021__admin_rbac_and_notification_templates.sql>)
- [V022__add_clinical_review_and_signature_fields.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V022__add_clinical_review_and_signature_fields.sql>)
- [V023__create_patient_profiles_table.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V023__create_patient_profiles_table.sql>)
- [V024__add_screening_metadata_columns.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V024__add_screening_metadata_columns.sql>)
- [V025__fix_utf8_encoding_and_seed_screenings.sql](<D:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening/backend/src/main/resources/db/migration/V025__fix_utf8_encoding_and_seed_screenings.sql>)
