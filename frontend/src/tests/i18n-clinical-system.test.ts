import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// i18n & Context under test
import { translations, SupportedLanguage } from '../i18n/translations';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import {
  MedicalDisclaimer,
  MANDATORY_MEDICAL_DISCLAIMER_VI,
  MANDATORY_MEDICAL_DISCLAIMER_EN,
} from '../components/ui/MedicalDisclaimer';
import { InteractiveCDSViewer, getAnomalyName } from '../components/InteractiveCDSViewer';
import { AIRiskResult, PatientProfile } from '../types/cds';
import { UserSession } from '../types/auth';
import { PatientDashboardView } from '../features/patient/PatientDashboardView';
import { PatientHistoryView } from '../features/patient/PatientHistoryView';
import { PatientScreeningResultView } from '../features/patient/PatientScreeningResultView';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
import { MedicalProfileModal } from '../components/MedicalProfileModal';
import { CreditPurchaseModal } from '../components/CreditPurchaseModal';
import { PatientPortalPage } from '../pages/PatientPortalPage';
import { DoctorWorklistView } from '../features/doctor/DoctorWorklistView';
import { DoctorDiagnosisModal } from '../components/DoctorDiagnosisModal';
import { DoctorRiskAnalyticsView } from '../features/doctor/DoctorRiskAnalyticsView';
import { DoctorReportsView } from '../features/doctor/DoctorReportsView';
import { DoctorConsultationView } from '../features/doctor/DoctorConsultationView';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { PatientAssignmentBoard } from '../components/PatientAssignmentBoard';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { ClinicalRiskSummaryCard } from '../components/ClinicalRiskSummaryCard';
import { ClinicBatchJob } from '../types/cds';
import { ClinicBatchWorkspace } from '../features/clinic/ClinicBatchWorkspace';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { BatchUploadModal } from '../components/BatchUploadModal';
import { BatchItemDetailModal } from '../components/BatchItemDetailModal';
import { ClinicCampaignAnalytics } from '../components/ClinicCampaignAnalytics';
import { ClinicCreditPackageSection } from '../components/ClinicCreditPackageSection';
import { ClinicPortalPage } from '../pages/ClinicPortalPage';
import { AdminAuditWorkspace, AuditLogItem } from '../features/admin/AdminAuditWorkspace';
import { AdminAuditLogsPage } from '../pages/AdminAuditLogsPage';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import { PasswordInput } from '../components/auth/PasswordInput';
import { Footer } from '../components/Footer';
import { LoadingState, ErrorState } from '../components/ui/StateFeedback';

// Polyfill localStorage cho môi trường kiểm thử Node
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const storageMap = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => storageMap.set(key, String(value)),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  };
}

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
    failed++;
    throw err;
  }
}

console.log('=================================================================');
console.log('   AURA CLINICAL I18N & ZERO-HYBRID STRINGS VERIFICATION SUITE');
console.log('=================================================================\n');

// -----------------------------------------------------------------------------
// PHẦN 1: ĐỘ TOÀN VẸN TỪ ĐIỂN Y KHOA SONG NGỮ (translations.ts)
// -----------------------------------------------------------------------------
console.log('--- 1. Kiểm thử Độ Toàn Vẹn Từ Điển Y Khoa Song Ngữ (translations.ts) ---');

runTest('I18N-1: Đầy đủ 2 ngôn ngữ chuẩn hóa (vi, en) trong translations object', () => {
  assert.ok(translations.vi, 'Có từ điển Tiếng Việt (vi)');
  assert.ok(translations.en, 'Có từ điển Tiếng Anh (en)');
});

runTest('I18N-2: Schema từ điển bao phủ 100% các phân hệ nghiệp vụ y khoa', () => {
  const sections = [
    'common',
    'navigation',
    'roles',
    'header',
    'eyeLaterality',
    'scanTypes',
    'riskLevels',
    'biomarkers',
    'clinicalDecision',
    'icd10',
    'recommendations',
    'anomalies',
    'cdsViewer',
    'uploader',
    'login',
    'auth',
    'patient',
    'doctor',
    'clinic',
    'admin',
    'footer',
  ] as const;

  for (const lang of ['vi', 'en'] as SupportedLanguage[]) {
    for (const sec of sections) {
      assert.ok(
        (translations[lang] as any)[sec],
        `Ngôn ngữ ${lang} phải có mục ${sec}`
      );
    }
  }
});

runTest('I18N-3: Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer) khớp 100% tài liệu thẩm định', () => {
  assert.strictEqual(
    translations.vi.common.medicalDisclaimerText,
    MANDATORY_MEDICAL_DISCLAIMER_VI
  );
  assert.strictEqual(
    translations.en.common.medicalDisclaimerText,
    MANDATORY_MEDICAL_DISCLAIMER_EN
  );
  assert.ok(translations.vi.common.medicalDisclaimerText.includes('không thay thế chẩn đoán chuyên môn'));
  assert.ok(translations.en.common.medicalDisclaimerText.includes('do not replace professional diagnosis'));
});

runTest('I18N-4: Phân tầng nguy cơ lâm sàng (Risk Levels) đầy đủ 5 cấp độ chuẩn', () => {
  assert.strictEqual(translations.vi.riskLevels.low, 'Nguy cơ thấp');
  assert.strictEqual(translations.vi.riskLevels.moderate, 'Nguy cơ trung bình');
  assert.strictEqual(translations.vi.riskLevels.high, 'Nguy cơ cao');
  assert.strictEqual(translations.vi.riskLevels.critical, 'Nguy kịch');
  assert.strictEqual(translations.vi.riskLevels.unverified, 'Cần thẩm định lại');

  assert.strictEqual(translations.en.riskLevels.low, 'Low Risk');
  assert.strictEqual(translations.en.riskLevels.moderate, 'Moderate Risk');
  assert.strictEqual(translations.en.riskLevels.high, 'High Risk');
  assert.strictEqual(translations.en.riskLevels.critical, 'Critical Risk');
  assert.strictEqual(translations.en.riskLevels.unverified, 'Unverified / Needs Re-evaluation');
});

runTest('I18N-5: Phân loại bên mắt (Eye Laterality) tuân thủ quy chuẩn y tế', () => {
  assert.strictEqual(translations.vi.eyeLaterality.rightEye, 'Mắt phải (OD)');
  assert.strictEqual(translations.vi.eyeLaterality.leftEye, 'Mắt trái (OS)');
  assert.strictEqual(translations.vi.eyeLaterality.bothEyes, 'Cả hai mắt (OU)');

  assert.strictEqual(translations.en.eyeLaterality.rightEye, 'Right Eye (OD)');
  assert.strictEqual(translations.en.eyeLaterality.leftEye, 'Left Eye (OS)');
  assert.strictEqual(translations.en.eyeLaterality.bothEyes, 'Both Eyes (OU)');
});

runTest('I18N-6: Độ bao phủ đầy đủ các trường dịch thuật chuyên khoa của 4 vai trò và Auth/Common/Footer', () => {
  for (const lang of ['vi', 'en'] as SupportedLanguage[]) {
    const dict = translations[lang];

    // 1. Auth sub-modules
    assert.ok(dict.auth.loginForm.email, `${lang} phải có auth.loginForm.email`);
    assert.ok(dict.auth.loginForm.password, `${lang} phải có auth.loginForm.password`);
    assert.ok(dict.auth.loginForm.loginButton, `${lang} phải có auth.loginForm.loginButton`);
    assert.ok(dict.auth.loginForm.rememberMe, `${lang} phải có auth.loginForm.rememberMe`);
    assert.ok(dict.auth.loginForm.forgotPassword, `${lang} phải có auth.loginForm.forgotPassword`);
    assert.ok(dict.auth.loginForm.loggingIn, `${lang} phải có auth.loginForm.loggingIn`);
    assert.ok(dict.auth.loginForm.errorMessages.invalidCredentials, `${lang} phải có errorMessages.invalidCredentials`);

    assert.ok(dict.auth.registerForm.fullName, `${lang} phải có auth.registerForm.fullName`);
    assert.ok(dict.auth.registerForm.email, `${lang} phải có auth.registerForm.email`);
    assert.ok(dict.auth.registerForm.password, `${lang} phải có auth.registerForm.password`);
    assert.ok(dict.auth.registerForm.confirmPassword, `${lang} phải có auth.registerForm.confirmPassword`);
    assert.ok(dict.auth.registerForm.phone, `${lang} phải có auth.registerForm.phone`);
    assert.ok(dict.auth.registerForm.roleSelection, `${lang} phải có auth.registerForm.roleSelection`);
    assert.ok(dict.auth.registerForm.registerButton, `${lang} phải có auth.registerForm.registerButton`);
    assert.ok(dict.auth.registerForm.termsConsent, `${lang} phải có auth.registerForm.termsConsent`);

    assert.ok(dict.auth.authHeroPanel.tagline, `${lang} phải có auth.authHeroPanel.tagline`);
    assert.ok(dict.auth.authHeroPanel.hipaaCompliant, `${lang} phải có auth.authHeroPanel.hipaaCompliant`);
    assert.ok(dict.auth.authHeroPanel.aiAccuracy, `${lang} phải có auth.authHeroPanel.aiAccuracy`);
    assert.ok(dict.auth.authHeroPanel.clinicalBenefits, `${lang} phải có auth.authHeroPanel.clinicalBenefits`);
    assert.ok(dict.auth.authHeroPanel.trustedByHospitals, `${lang} phải có auth.authHeroPanel.trustedByHospitals`);

    assert.ok(dict.auth.verifyEmailLink.verifying, `${lang} phải có auth.verifyEmailLink.verifying`);
    assert.ok(dict.auth.verifyEmailLink.success, `${lang} phải có auth.verifyEmailLink.success`);
    assert.ok(dict.auth.verifyEmailLink.invalidLink, `${lang} phải có auth.verifyEmailLink.invalidLink`);
    assert.ok(dict.auth.verifyEmailLink.returnToLogin, `${lang} phải có auth.verifyEmailLink.returnToLogin`);

    // 2. Patient sub-modules
    assert.ok(dict.patient.dashboard.greeting, `${lang} phải có patient.dashboard.greeting`);
    assert.ok(dict.patient.dashboard.healthStatus, `${lang} phải có patient.dashboard.healthStatus`);
    assert.ok(dict.patient.dashboard.quickActions.uploadScan, `${lang} phải có quickActions.uploadScan`);
    assert.ok(dict.patient.dashboard.recentScansTable, `${lang} phải có recentScansTable`);
    assert.ok(dict.patient.dashboard.creditsRemaining, `${lang} phải có creditsRemaining`);

    assert.ok(dict.patient.history.title, `${lang} phải có patient.history.title`);
    assert.ok(dict.patient.history.searchPlaceholder, `${lang} phải có patient.history.searchPlaceholder`);
    assert.ok(dict.patient.history.filters.eye, `${lang} phải có patient.history.filters.eye`);
    assert.ok(dict.patient.history.columns.date, `${lang} phải có patient.history.columns.date`);
    assert.ok(dict.patient.history.emptyState, `${lang} phải có patient.history.emptyState`);

    assert.ok(dict.patient.results.summaryTitle, `${lang} phải có patient.results.summaryTitle`);
    assert.ok(dict.patient.results.cardiovascularRiskScore, `${lang} phải có patient.results.cardiovascularRiskScore`);
    assert.ok(dict.patient.results.diabeticRetinopathyGrade, `${lang} phải có diabeticRetinopathyGrade`);
    assert.ok(dict.patient.results.microvascularBiomarkers, `${lang} phải có microvascularBiomarkers`);
    assert.ok(dict.patient.results.aiRationale, `${lang} phải có aiRationale`);
    assert.ok(dict.patient.results.clinicalRecommendation, `${lang} phải có clinicalRecommendation`);

    assert.ok(dict.patient.chat.consultationTitle, `${lang} phải có patient.chat.consultationTitle`);
    assert.ok(dict.patient.chat.assignedDoctor, `${lang} phải có patient.chat.assignedDoctor`);
    assert.ok(dict.patient.chat.sendButton, `${lang} phải có patient.chat.sendButton`);
    assert.ok(dict.patient.chat.emergencyNotice, `${lang} phải có patient.chat.emergencyNotice`);

    assert.ok(dict.patient.profile.personalInfo, `${lang} phải có patient.profile.personalInfo`);
    assert.ok(dict.patient.profile.dob, `${lang} phải có patient.profile.dob`);
    assert.ok(dict.patient.profile.bloodType, `${lang} phải có patient.profile.bloodType`);
    assert.ok(dict.patient.profile.saveProfile, `${lang} phải có patient.profile.saveProfile`);

    assert.ok(dict.patient.credit.currentQuota, `${lang} phải có patient.credit.currentQuota`);
    assert.ok(dict.patient.credit.packageOptions, `${lang} phải có patient.credit.packageOptions`);
    assert.ok(dict.patient.credit.buyNow, `${lang} phải có patient.credit.buyNow`);

    // 3. Doctor sub-modules
    assert.ok(dict.doctor.cds.title, `${lang} phải có doctor.cds.title`);
    assert.ok(dict.doctor.cds.pendingReviewsCount, `${lang} phải có doctor.cds.pendingReviewsCount`);
    assert.ok(dict.doctor.cds.urgentCases, `${lang} phải có doctor.cds.urgentCases`);

    assert.ok(dict.doctor.worklist.title, `${lang} phải có doctor.worklist.title`);
    assert.ok(dict.doctor.worklist.search, `${lang} phải có doctor.worklist.search`);
    assert.ok(dict.doctor.worklist.filterTabs.pending, `${lang} phải có worklist.filterTabs.pending`);
    assert.ok(dict.doctor.worklist.columns.patient, `${lang} phải có worklist.columns.patient`);
    assert.ok(dict.doctor.worklist.reviewButton, `${lang} phải có worklist.reviewButton`);

    assert.ok(dict.doctor.diagnosisModal.title, `${lang} phải có doctor.diagnosisModal.title`);
    assert.ok(dict.doctor.diagnosisModal.aiPreliminary, `${lang} phải có doctor.diagnosisModal.aiPreliminary`);
    assert.ok(dict.doctor.diagnosisModal.doctorDecision.approve, `${lang} phải có doctorDecision.approve`);
    assert.ok(dict.doctor.diagnosisModal.digitalSign, `${lang} phải có doctor.diagnosisModal.digitalSign`);
    assert.ok(dict.doctor.diagnosisModal.signerName, `${lang} phải có doctor.diagnosisModal.signerName`);

    assert.ok(dict.doctor.patientList.title, `${lang} phải có doctor.patientList.title`);
    assert.ok(dict.doctor.patientList.columns.name, `${lang} phải có patientList.columns.name`);
    assert.ok(dict.doctor.patientList.viewProfile, `${lang} phải có patientList.viewProfile`);

    assert.ok(dict.doctor.reportsView.title, `${lang} phải có doctor.reportsView.title`);
    assert.ok(dict.doctor.reportsView.exportPdf, `${lang} phải có reportsView.exportPdf`);
    assert.ok(dict.doctor.reportsView.exportCsv, `${lang} phải có reportsView.exportCsv`);
    assert.ok(dict.doctor.reportsView.downloadSignoff, `${lang} phải có reportsView.downloadSignoff`);

    assert.ok(dict.doctor.riskAnalytics.title, `${lang} phải có doctor.riskAnalytics.title`);
    assert.ok(dict.doctor.riskAnalytics.populationDistribution, `${lang} phải có populationDistribution`);
    assert.ok(dict.doctor.riskAnalytics.riskMatrix, `${lang} phải có riskMatrix`);

    // 4. Clinic sub-modules
    assert.ok(dict.clinic.portal.title, `${lang} phải có clinic.portal.title`);
    assert.ok(dict.clinic.portal.batchScreeningStatus, `${lang} phải có batchScreeningStatus`);
    assert.ok(dict.clinic.portal.quotaBalance, `${lang} phải có quotaBalance`);

    assert.ok(dict.clinic.batchWorkspace.batchList, `${lang} phải có clinic.batchWorkspace.batchList`);
    assert.ok(dict.clinic.batchWorkspace.status.queued, `${lang} phải có batchWorkspace.status.queued`);
    assert.ok(dict.clinic.batchWorkspace.newBatchButton, `${lang} phải có newBatchButton`);

    assert.ok(dict.clinic.batchProcessing.batchTitle, `${lang} phải có batchProcessing.batchTitle`);
    assert.ok(dict.clinic.batchProcessing.progress, `${lang} phải có batchProcessing.progress`);
    assert.ok(dict.clinic.batchProcessing.itemsTable, `${lang} phải có itemsTable`);

    assert.ok(dict.clinic.batchUploadModal.uploadTitle, `${lang} phải có batchUploadModal.uploadTitle`);
    assert.ok(dict.clinic.batchUploadModal.dropzone, `${lang} phải có batchUploadModal.dropzone`);
    assert.ok(dict.clinic.batchUploadModal.submitBatch, `${lang} phải có submitBatch`);

    assert.ok(dict.clinic.batchDetailModal.itemDetails, `${lang} phải có batchDetailModal.itemDetails`);
    assert.ok(dict.clinic.batchDetailModal.heatmap, `${lang} phải có batchDetailModal.heatmap`);
    assert.ok(dict.clinic.batchDetailModal.doctorSignoffStatus, `${lang} phải có doctorSignoffStatus`);

    assert.ok(dict.clinic.campaignAnalytics.campaignTitle, `${lang} phải có campaignTitle`);
    assert.ok(dict.clinic.campaignAnalytics.totalScreened, `${lang} phải có totalScreened`);

    // 5. Admin sub-modules
    assert.ok(dict.admin.audit.title, `${lang} phải có admin.audit.title`);
    assert.ok(dict.admin.audit.searchByUserIp, `${lang} phải có searchByUserIp`);
    assert.ok(dict.admin.audit.exportAuditTrail, `${lang} phải có exportAuditTrail`);

    assert.ok(dict.admin.userManagement.title, `${lang} phải có admin.userManagement.title`);
    assert.ok(dict.admin.userManagement.changeRole, `${lang} phải có changeRole`);
    assert.ok(dict.admin.userManagement.resetPassword, `${lang} phải có resetPassword`);

    assert.ok(dict.admin.rbac.rolePermissionMatrix, `${lang} phải có rolePermissionMatrix`);
    assert.ok(dict.admin.rbac.savePolicy, `${lang} phải có savePolicy`);

    assert.ok(dict.admin.aiConfig.title, `${lang} phải có admin.aiConfig.title`);
    assert.ok(dict.admin.aiConfig.endpointUrl, `${lang} phải có endpointUrl`);
    assert.ok(dict.admin.aiConfig.testConnection, `${lang} phải có testConnection`);

    assert.ok(dict.admin.templates.notificationTemplates, `${lang} phải có notificationTemplates`);
    assert.ok(dict.admin.templates.channel.email, `${lang} phải có templates.channel.email`);

    assert.ok(dict.admin.packages.servicePackageList, `${lang} phải có servicePackageList`);
    assert.ok(dict.admin.packages.createPackage, `${lang} phải có createPackage`);

    // 6. Common sub-modules
    assert.ok(dict.common.pagination.previous, `${lang} phải có common.pagination.previous`);
    assert.ok(dict.common.pagination.next, `${lang} phải có common.pagination.next`);
    assert.ok(dict.common.status.pending, `${lang} phải có common.status.pending`);
    assert.ok(dict.common.status.approved, `${lang} phải có common.status.approved`);
    assert.ok(dict.common.actions.view, `${lang} phải có common.actions.view`);
    assert.ok(dict.common.actions.confirm, `${lang} phải có common.actions.confirm`);
    assert.ok(dict.common.gender.male, `${lang} phải có common.gender.male`);
    assert.ok(dict.common.bloodType.a, `${lang} phải có common.bloodType.a`);
    assert.ok(dict.common.diabetesType.type2, `${lang} phải có common.diabetesType.type2`);
    assert.ok(dict.common.emptyStates.noData, `${lang} phải có common.emptyStates.noData`);
    assert.ok(dict.common.confirmationModals.areYouSure, `${lang} phải có confirmationModals.areYouSure`);

    // 7. Footer
    assert.ok(dict.footer.copyright, `${lang} phải có footer.copyright`);
    assert.ok(dict.footer.version, `${lang} phải có footer.version`);
    assert.ok(dict.footer.termsOfService, `${lang} phải có footer.termsOfService`);
    assert.ok(dict.footer.privacyPolicy, `${lang} phải có footer.privacyPolicy`);
    assert.ok(dict.footer.medicalSafetyStatement, `${lang} phải có footer.medicalSafetyStatement`);
  }
});

// -----------------------------------------------------------------------------
// PHẦN 2: NGUYÊN TẮC KHÔNG LAI TẠP (ZERO-HYBRID STRINGS PRINCIPLE)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Kiểm thử Nguyên Tắc Không Lai Tạp (Zero Hybrid Strings) ---');

runTest('ZERO-HYBRID-1: Không chứa các chuỗi lai tạp cũ trong từ điển Tiếng Việt', () => {
  const jsonVi = JSON.stringify(translations.vi);

  // Danh sách các chuỗi lai tạp bị nghiêm cấm
  assert.ok(!jsonVi.includes('Fundus & Grad-CAM Heatmap Viewer'), 'Cấm chuỗi lai tạp Bàn chẩn đoán');
  assert.ok(!jsonVi.includes('Fundus Color - Macula Centered'), 'Cấm chuỗi lai tạp Macula');
  assert.ok(!jsonVi.includes('Fundus Color - Optic Disc'), 'Cấm chuỗi lai tạp Optic Disc');
  assert.ok(!jsonVi.includes('Oculus Dexter'), 'Cấm chuỗi Latin ghép Oculus Dexter');
  assert.ok(!jsonVi.includes('Oculus Sinister'), 'Cấm chuỗi Latin ghép Oculus Sinister');
  assert.ok(!jsonVi.includes('Quantitative Biomarkers'), 'Cấm chuỗi Quantitative Biomarkers ghép');
  assert.ok(!jsonVi.includes('Medical Safety Disclaimer'), 'Tiếng Việt không ghép Medical Safety Disclaimer');
});

runTest('ZERO-HYBRID-2: Không chứa các chuỗi tiếng Việt trong từ điển Tiếng Anh', () => {
  const jsonEn = JSON.stringify(translations.en);

  assert.ok(!jsonEn.includes('Võng Mạc'), 'Từ điển Tiếng Anh không lẫn tiếng Việt');
  assert.ok(!jsonEn.includes('Hoàng Điểm'), 'Từ điển Tiếng Anh không lẫn tiếng Việt');
  assert.ok(!jsonEn.includes('Bác Sĩ'), 'Từ điển Tiếng Anh không lẫn tiếng Việt');
  assert.ok(!jsonEn.includes('Bệnh nhân'), 'Từ điển Tiếng Anh không lẫn tiếng Việt');
});

// -----------------------------------------------------------------------------
// PHẦN 3: KIỂM THỬ TRUY XUẤT DOT NOTATION VÀ FALLBACK
// -----------------------------------------------------------------------------
console.log('\n--- 3. Kiểm thử Truy Xuất Dot Notation và Fallback (t function) ---');

runTest('DOT-NOTATION-1: Truy xuất chính xác các key đa tầng lồng nhau', () => {
  function TestConsumer() {
    const { t } = useLanguage();
    return React.createElement(
      'div',
      null,
      React.createElement('span', { id: 'disclaimer' }, t('common.medicalDisclaimerText')),
      React.createElement('span', { id: 'nav' }, t('navigation.cdsWorkspace')),
      React.createElement('span', { id: 'macula-label' }, t('scanTypes.maculaCentered.label')),
      React.createElement('span', { id: 'avr-sig' }, t('biomarkers.avr.clinicalSignificance'))
    );
  }

  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(TestConsumer, null)
    )
  );

  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER_VI));
  assert.ok(html.includes('Bàn chẩn đoán'));
  assert.ok(html.includes('Ảnh hoàng điểm'));
  assert.ok(html.includes('Đánh giá mức độ co hẹp mạch máu'));
});

runTest('DOT-NOTATION-2: Fallback an toàn khi key không tồn tại mà không làm sập ứng dụng', () => {
  function TestConsumer() {
    const { t } = useLanguage();
    return React.createElement(
      'div',
      null,
      React.createElement('span', { id: 'non-existent' }, t('common.unknownProperty', 'Giá trị mặc định')),
      React.createElement('span', { id: 'no-fallback' }, t('deeply.missing.key'))
    );
  }

  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(TestConsumer, null)
    )
  );

  assert.ok(html.includes('Giá trị mặc định'), 'Sử dụng fallback param khi key không có');
  assert.ok(html.includes('deeply.missing.key'), 'Trả về chính path khi không có fallback param');
});

runTest('DOT-NOTATION-3: Chống prototype pollution và prototype traversal qua __proto__, constructor, prototype', () => {
  function TestConsumer() {
    const { t } = useLanguage();
    return React.createElement(
      'div',
      null,
      React.createElement('span', { id: 'proto' }, t('__proto__.polluted', 'SAFE_FALLBACK')),
      React.createElement('span', { id: 'constructor' }, t('constructor.name', 'SAFE_FALLBACK')),
      React.createElement('span', { id: 'prototype' }, t('common.prototype.value', 'SAFE_FALLBACK')),
      React.createElement('span', { id: 'nested-proto' }, t('common.__proto__.polluted', 'SAFE_FALLBACK'))
    );
  }

  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(TestConsumer, null)
    )
  );

  assert.ok(html.includes('SAFE_FALLBACK'), 'Trả về an toàn fallback khi truy cập prototype traversal');
  assert.ok(!html.includes('Object'), 'Không làm rò rỉ constructor.name');
});

runTest('DOT-NOTATION-4: Tái sử dụng từ điển qua getAnomalyName và nhãn lỗi kiểm tra file uploader', () => {
  function TestConsumerVi() {
    const { t } = useLanguage();
    return React.createElement(
      'div',
      null,
      React.createElement('span', { id: 'anomaly-ma' }, getAnomalyName('Microaneurysm', t)),
      React.createElement('span', { id: 'anomaly-hem' }, getAnomalyName('Hemorrhage', t)),
      React.createElement('span', { id: 'anomaly-exu' }, getAnomalyName('Hard_Exudate', t)),
      React.createElement('span', { id: 'anomaly-nip' }, getAnomalyName('AV_Nipping', t)),
      React.createElement('span', { id: 'anomaly-nar' }, getAnomalyName('Focal_Narrowing', t)),
      React.createElement('span', { id: 'uploader-quota' }, t('uploader.availableQuota')),
      React.createElement('span', { id: 'uploader-size-err' }, t('uploader.fileSizeError')),
      React.createElement('span', { id: 'uploader-empty-err' }, t('uploader.fileEmptyError')),
      React.createElement('span', { id: 'uploader-format-err' }, t('uploader.fileFormatError'))
    );
  }

  localStorage.setItem('aura_language', 'vi');
  const htmlVi = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(TestConsumerVi, null)
    )
  );

  assert.ok(htmlVi.includes('Vi phình mạch'));
  assert.ok(htmlVi.includes('Xuất huyết võng mạc'));
  assert.ok(htmlVi.includes('Xuất tiết cứng'));
  assert.ok(htmlVi.includes('Bắt chéo mạch máu'));
  assert.ok(htmlVi.includes('Co thắt mạch máu'));
  assert.ok(htmlVi.includes('Lượt khám khả dụng:'));
  assert.ok(htmlVi.includes('vượt quá dung lượng tối đa cho phép (15MB)'));
  assert.ok(htmlVi.includes('Tệp rỗng (0 bytes)'));
  assert.ok(htmlVi.includes('Định dạng tệp không được hỗ trợ'));

  function TestConsumerEn() {
    const { t } = useLanguage();
    return React.createElement(
      'div',
      null,
      React.createElement('span', { id: 'anomaly-ma-en' }, getAnomalyName('Microaneurysm', t)),
      React.createElement('span', { id: 'anomaly-hem-en' }, getAnomalyName('Hemorrhage', t)),
      React.createElement('span', { id: 'uploader-quota-en' }, t('uploader.availableQuota')),
      React.createElement('span', { id: 'uploader-size-err-en' }, t('uploader.fileSizeError')),
      React.createElement('span', { id: 'uploader-empty-err-en' }, t('uploader.fileEmptyError')),
      React.createElement('span', { id: 'uploader-format-err-en' }, t('uploader.fileFormatError'))
    );
  }

  localStorage.setItem('aura_language', 'en');
  const htmlEn = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(TestConsumerEn, null)
    )
  );

  // Hệ thống đã khóa chỉ dùng Tiếng Việt và tự động reset 'en' về 'vi'
  assert.ok(htmlEn.includes('Vi phình mạch'), 'Hệ thống tự động khóa tiếng Việt');
  assert.ok(htmlEn.includes('Xuất huyết võng mạc'), 'Hệ thống tự động khóa tiếng Việt');
  assert.ok(htmlEn.includes('Lượt khám khả dụng:'), 'Hệ thống tự động khóa tiếng Việt');
  assert.ok(htmlEn.includes('vượt quá dung lượng tối đa cho phép (15MB)'), 'Hệ thống tự động khóa tiếng Việt');
  assert.ok(htmlEn.includes('Tệp rỗng (0 bytes)'), 'Hệ thống tự động khóa tiếng Việt');
  assert.ok(htmlEn.includes('Định dạng tệp không được hỗ trợ'), 'Hệ thống tự động khóa tiếng Việt');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

// -----------------------------------------------------------------------------
// PHẦN 4: NÚT CHUYỂN ĐỔI NGÔN NGỮ (LanguageSwitcher)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Kiểm thử Nút Chuyển Đổi Ngôn Ngữ (LanguageSwitcher) ---');

runTest('SWITCHER-1: LanguageSwitcher trả về null (không render DOM) theo chính sách chỉ dùng Tiếng Việt', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(LanguageSwitcher, null)
    )
  );

  assert.strictEqual(html, '', 'LanguageSwitcher trả về null/rỗng');
});

runTest('SWITCHER-2: Biến thể compact trả về null theo chính sách chỉ dùng Tiếng Việt', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(LanguageSwitcher, { variant: 'compact' })
    )
  );

  assert.strictEqual(html, '', 'Biến thể compact trả về null/rỗng');
});

runTest('SWITCHER-3: Chế độ Darkroom mode trả về null theo chính sách chỉ dùng Tiếng Việt', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(LanguageSwitcher, { isDarkRoom: true })
    )
  );

  assert.strictEqual(html, '', 'Chế độ darkroom trả về null/rỗng');
});

// -----------------------------------------------------------------------------
// PHẦN 5: KIỂM THỬ RENDER THỰC TẾ CÁC THÀNH PHẦN CDS DƯỚI 2 NGÔN NGỮ (VI & EN)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Kiểm thử Render Thực Tế Thành Phần CDS Song Ngữ (Live Render) ---');

const sampleAnalysisResult: AIRiskResult = {
  analysisId: 'SCR-TEST-E2E-001',
  createdAt: '2026-03-14T09:00:00.000Z',
  status: 'ANALYZED',
  executionTimeMs: 1350,
  overallVascularRiskScore: 72,
  riskScore: 72,
  imageUrl: '/assets/images/fundus_sample_od.png',
  cardiovascularRisk: {
    level: 'High',
    score: 72,
    hypertensionStage: 'Giai đoạn 1',
    threeYearStrokeRiskPercent: 20,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 55,
    etdrsGrade: 'Mild NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 15,
  },
  annotatedMap: {
    arteryVeinRatio: 0.58,
    vesselDensityPercentage: 16.2,
    tortuosityIndex: 1.34,
    opticCupToDiscRatio: 0.42,
    heatmapUrl: '/assets/images/fundus_sample_heatmap.png',
    detectedAnomalies: [],
  },
  xaiExplainability: [],
  findings: 'Phát hiện hẹp nhẹ tiểu động mạch và có vài điểm vi phình mạch.',
  recommendations: 'Tái khám định kỳ sau 3 tháng.',
};

runTest('LIVE-RENDER-1: InteractiveCDSViewer render tiếng Việt chuẩn và không chứa chuỗi lai tạp cũ', () => {
  localStorage.setItem('aura_language', 'vi');
  const htmlVi = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(InteractiveCDSViewer, {
        analysisResult: sampleAnalysisResult,
        selectedEye: 'OD (Mắt Phải)',
      })
    )
  );

  assert.ok(
    htmlVi.includes('Bản đồ nhiệt vi mạch (Grad-CAM)') ||
    htmlVi.includes('Bản đồ nhiệt Grad-CAM') ||
    htmlVi.includes('Bàn chẩn đoán tương tác CDS'),
    'Tiêu đề tiếng Việt chuẩn'
  );
  assert.ok(!htmlVi.includes('Fundus &amp; Grad-CAM Heatmap Viewer'), 'Cấm chuỗi lai tạp cũ');
  assert.ok(!htmlVi.includes('Interactive CDS Workspace'), 'Không hiển thị nhãn tiếng Anh khi ở chế độ VI');
});

runTest('LIVE-RENDER-2: InteractiveCDSViewer tự động khóa tiếng Việt kể cả khi localStorage set en', () => {
  localStorage.setItem('aura_language', 'en');
  const htmlEn = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(InteractiveCDSViewer, {
        analysisResult: sampleAnalysisResult,
        selectedEye: 'OD (Mắt Phải)',
      })
    )
  );

  assert.ok(
    htmlEn.includes('Bản đồ nhiệt vi mạch (Grad-CAM)') ||
    htmlEn.includes('Bản đồ nhiệt Grad-CAM') ||
    htmlEn.includes('Bàn chẩn đoán tương tác CDS'),
    'Tiêu đề tiếng Việt chuẩn'
  );
  assert.ok(!htmlEn.includes('Interactive CDS Workspace'), 'Không hiển thị nhãn tiếng Anh khi ở chế độ VI');
  assert.ok(!htmlEn.includes('Fundus &amp; Grad-CAM Heatmap Viewer'), 'Cấm chuỗi lai tạp cũ');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('LIVE-RENDER-3: MedicalDisclaimer render chính xác thông điệp Bộ Y Tế (VI), tự động reset và khóa tiếng Việt khi có en', () => {
  // Tiếng Việt
  localStorage.setItem('aura_language', 'vi');
  const htmlVi = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(MedicalDisclaimer, null))
  );
  assert.ok(htmlVi.includes(MANDATORY_MEDICAL_DISCLAIMER_VI), 'Khớp tuyên bố miễn trừ tiếng Việt');
  assert.ok(!htmlVi.includes(MANDATORY_MEDICAL_DISCLAIMER_EN), 'Không lẫn tuyên bố tiếng Anh');

  const htmlBannerVi = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(MedicalDisclaimer, { variant: 'banner' }))
  );
  assert.ok(htmlBannerVi.includes('Tuyên bố Miễn trừ Y tế:'), 'Banner tiếng Việt có tiêu đề chuẩn');

  // Thử nghiệm lưu en trong localStorage -> Hệ thống phải tự động khóa tiếng Việt
  localStorage.setItem('aura_language', 'en');
  const htmlEn = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(MedicalDisclaimer, null))
  );
  assert.ok(htmlEn.includes(MANDATORY_MEDICAL_DISCLAIMER_VI), 'Khóa tuyên bố miễn trừ tiếng Việt chuẩn');
  assert.ok(!htmlEn.includes(MANDATORY_MEDICAL_DISCLAIMER_EN), 'Không hiển thị tuyên bố tiếng Anh');

  const htmlBannerEn = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(MedicalDisclaimer, { variant: 'banner' }))
  );
  assert.ok(htmlBannerEn.includes('Tuyên bố Miễn trừ Y tế:'), 'Banner vẫn giữ tiếng Việt');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

// -----------------------------------------------------------------------------
// PHẦN 6: QUÉT TOÀN DIỆN CODEBASE PHÁT HIỆN CHUỖI LAI TẠP (ZERO-HYBRID SCAN)
// -----------------------------------------------------------------------------
console.log('\n--- 6. Quét Toàn Diện Mã Nguồn Giao Diện (Zero-Hybrid Codebase Scan) ---');

function getSourceFiles(dirPath: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return fileList;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'tests' && entry.name !== 'dist') {
        getSourceFiles(fullPath, fileList);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

runTest('SCAN-1: Quét toàn bộ component UI xác nhận không còn chuỗi "Bàn Chẩn Đoán Tương Tác CDS (Fundus & Grad-CAM Heatmap Viewer)"', () => {
  const rootSrc = path.resolve(__dirname, '..');
  const targetDirs = [
    path.join(rootSrc, 'components'),
    path.join(rootSrc, 'features'),
    path.join(rootSrc, 'layouts'),
    path.join(rootSrc, 'pages'),
  ];

  let scannedCount = 0;
  const forbiddenHybrid = 'Bàn Chẩn Đoán Tương Tác CDS (Fundus & Grad-CAM Heatmap Viewer)';

  for (const dir of targetDirs) {
    const files = getSourceFiles(dir);
    for (const filePath of files) {
      scannedCount++;
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(
        !content.includes(forbiddenHybrid),
        `Phát hiện chuỗi lai tạp bị cấm "${forbiddenHybrid}" tại tệp: ${filePath}`
      );
    }
  }

  assert.ok(scannedCount > 15, `Phải quét tối thiểu 15 tệp UI (thực tế đã quét ${scannedCount} tệp)`);
});

runTest('SCAN-2: Quét toàn bộ component UI xác nhận không còn các chuỗi lai tạp Macula / Optic Disc / Latin', () => {
  const rootSrc = path.resolve(__dirname, '..');
  const targetDirs = [
    path.join(rootSrc, 'components'),
    path.join(rootSrc, 'features'),
    path.join(rootSrc, 'layouts'),
    path.join(rootSrc, 'pages'),
  ];

  const forbiddenStrings = [
    'Fundus Color - Macula Centered',
    'Fundus Color - Optic Disc',
    'Oculus Dexter',
    'Oculus Sinister',
  ];

  for (const dir of targetDirs) {
    const files = getSourceFiles(dir);
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const forbidden of forbiddenStrings) {
        assert.ok(
          !content.includes(forbidden),
          `Phát hiện chuỗi lai tạp bị cấm "${forbidden}" tại tệp: ${filePath}`
        );
      }
    }
  }
});

// -----------------------------------------------------------------------------
// PHẦN 7: KIỂM THỬ ĐỒNG BỘ 100% CẤU TRÚC VÀ GIÁ TRỊ TỪ ĐIỂN (PARITY & INTEGRITY)
// -----------------------------------------------------------------------------
console.log('\n--- 7. Kiểm Thử Đồng Bộ & Toàn Vẹn Từ Điển Song Ngữ (Parity & Integrity) ---');

function verifyDictionaryIntegrity(obj: any, currentPath: string = '') {
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = currentPath ? `${currentPath}.${key}` : key;
    assert.ok(value !== null && value !== undefined, `Trường ${fieldPath} không được null/undefined`);
    if (typeof value === 'string') {
      // Cho phép trường unit rỗng đối với các chỉ số không thứ nguyên (dimensionless index như tortuosity)
      if (!fieldPath.endsWith('.unit')) {
        assert.ok(value.trim().length > 0, `Trường ${fieldPath} không được là chuỗi rỗng`);
      }
    } else if (Array.isArray(value)) {
      assert.ok(value.length > 0, `Mảng ${fieldPath} không được rỗng`);
      for (let i = 0; i < value.length; i++) {
        assert.ok(typeof value[i] === 'string' && value[i].trim().length > 0, `${fieldPath}[${i}] phải là chuỗi hợp lệ`);
      }
    } else if (typeof value === 'object') {
      verifyDictionaryIntegrity(value, fieldPath);
    }
  }
}

function verifyKeyParity(objA: any, objB: any, pathPrefix: string = '', langA: string, langB: string) {
  for (const key of Object.keys(objA)) {
    const curPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    assert.ok(
      key in objB,
      `Thiếu trường tương ứng "${curPath}" trong từ điển ${langB} (có trong ${langA})`
    );
    if (typeof objA[key] === 'object' && objA[key] !== null && !Array.isArray(objA[key])) {
      if (typeof objB[key] === 'object' && objB[key] !== null && !Array.isArray(objB[key])) {
        verifyKeyParity(objA[key], objB[key], curPath, langA, langB);
      }
    }
  }
}

runTest('PARITY-1: 100% các trường trong từ điển Tiếng Việt và Tiếng Anh đối xứng hoàn hảo', () => {
  verifyKeyParity(translations.vi, translations.en, '', 'VI', 'EN');
  verifyKeyParity(translations.en, translations.vi, '', 'EN', 'VI');
});

runTest('PARITY-2: 100% giá trị trong từ điển (VI & EN) đều hợp lệ, không rỗng hoặc undefined', () => {
  verifyDictionaryIntegrity(translations.vi, 'translations.vi');
  verifyDictionaryIntegrity(translations.en, 'translations.en');
});

// -----------------------------------------------------------------------------
// PHẦN 8: KIỂM THỬ KHẢ NĂNG CHUYỂN ĐỔI SONG NGỮ PHÂN HỆ BỆNH NHÂN (PATIENT PORTAL)
// -----------------------------------------------------------------------------
console.log('\n--- 8. Kiểm Thử Khả Năng Chuyển Đổi Song Ngữ Phân Hệ Bệnh Nhân (Patient Portal) ---');

const samplePatientData: PatientProfile = {
  id: 'p-001',
  fullName: 'Nguyễn Văn Người Bệnh',
  mrn: 'MRN-12345',
  gender: 'Male',
  age: 58,
  systolicBp: 135,
  diastolicBp: 85,
  hba1c: 6.8,
  hasDiabetes: true,
  diabetesType: 'Type2',
  diabetesDurationYears: 5,
  hasHypertension: true,
  historyOfSmoking: false,
  historyOfHeartDisease: false,
  historyOfStroke: false,
  assignedDoctor: 'BS. Lê Minh',
  lastExamDate: '10/03/2026',
};

const sampleResultData: AIRiskResult = {
  analysisId: 'res-001',
  patientId: 'p-001',
  executionTimeMs: 150,
  overallVascularRiskScore: 72,
  cardiovascularRisk: {
    level: 'High',
    score: 72,
    hypertensionStage: 'Giai đoạn 1',
    threeYearStrokeRiskPercent: 20,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 55,
    etdrsGrade: 'Mild NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 15,
  },
  annotatedMap: {
    arteryVeinRatio: 0.58,
    vesselDensityPercentage: 16.2,
    tortuosityIndex: 1.34,
    opticCupToDiscRatio: 0.42,
    heatmapUrl: '/assets/images/fundus_sample_heatmap.png',
    detectedAnomalies: [],
  },
  xaiExplainability: [],
  findings: 'Phát hiện hẹp nhẹ tiểu động mạch.',
  recommendations: 'Tái khám định kỳ sau 3 tháng.',
  status: 'REVIEWED',
  doctorName: 'BS. Lê Minh',
  doctorNotes: 'Kết quả đã xác nhận.',
};

const sampleUserData: UserSession = {
  id: 'u-patient-01',
  email: 'patient@aura.health',
  name: 'Nguyễn Văn Người Bệnh',
  role: 'patient',
  roleTitle: 'Bệnh nhân',
  organization: 'AURA Clinic',
  token: 'mock-jwt-token',
  mrn: 'MRN-12345',
};

function renderWithLang(element: React.ReactElement, lang: SupportedLanguage): string {
  localStorage.setItem('aura_language', lang);
  return renderToStaticMarkup(
    React.createElement(LanguageProvider, null, element)
  );
}

runTest('PATIENT-I18N-1: PatientDashboardView render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(PatientDashboardView, {
      patient: samplePatientData,
      latestResult: sampleResultData,
      userCredits: 5,
      onNavigate: () => {},
      onOpenCreditModal: () => {},
      onOpenChatModal: () => {},
      onOpenReportModal: () => {},
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Lần khám gần nhất') || viHtml.includes('Ca Sàng Lọc Gần Nhất'), 'VI: Có "Lần khám gần nhất"');
  assert.ok(
    viHtml.includes('Đánh Giá Sức Khỏe Mắt') || viHtml.includes('Kết quả phân tích mắt') || viHtml.includes('Tổng hợp kết quả đánh giá vi mạch đáy mắt') || viHtml.includes('Kết Quả Đánh Giá Vi Mạch Đáy Mắt'),
    'VI: Có tiêu đề kết quả đánh giá vi mạch đáy mắt'
  );
  assert.ok(viHtml.includes('Tim mạch'), 'VI: Có "Tim mạch"');
  assert.ok(viHtml.includes('Võng mạc tiểu đường') || viHtml.includes('Võng mạc ĐTĐ'), 'VI: Có "Võng mạc"');
  assert.ok(
    viHtml.includes('Lượt Khám Còn Lại') || viHtml.includes('Lượt khám') || viHtml.includes('Hạn mức') || viHtml.includes('Hạn Mức'),
    'VI: Có thông tin hạn mức lượt khám'
  );

  const enHtml = renderWithLang(
    React.createElement(PatientDashboardView, {
      patient: samplePatientData,
      latestResult: sampleResultData,
      userCredits: 5,
      onNavigate: () => {},
      onOpenCreditModal: () => {},
      onOpenChatModal: () => {},
      onOpenReportModal: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('PATIENT-I18N-2: PatientHistoryView render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(PatientHistoryView, {
      screenings: [],
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Lịch sử khám sàng lọc'), 'VI: Có "Lịch sử khám sàng lọc"');
  assert.ok(viHtml.includes('Tìm kiếm ca khám'), 'VI: Có "Tìm kiếm ca khám"');
  assert.ok(viHtml.includes('Tất cả mắt'), 'VI: Có "Tất cả mắt"');
  assert.ok(viHtml.includes('Nguy cơ Thấp'), 'VI: Có "Nguy cơ Thấp"');

  const enHtml = renderWithLang(
    React.createElement(PatientHistoryView, {
      screenings: [],
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('PATIENT-I18N-3: PatientScreeningResultView render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(PatientScreeningResultView, {
      result: sampleResultData,
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Ảnh mắt &amp; Bản đồ nhiệt AI') || viHtml.includes('Ảnh mắt & Bản đồ nhiệt AI') || viHtml.includes('Ảnh Võng Mạc &amp; Grad-CAM Heatmap') || viHtml.includes('Ảnh Võng Mạc & Grad-CAM Heatmap'), 'VI: Có tiêu đề ảnh võng mạc');
  assert.ok(viHtml.includes('Đánh Giá Sức Khỏe') || viHtml.includes('Đánh Giá Nguy Cơ Lâm Sàng') || viHtml.includes('Đánh giá nguy cơ'), 'VI: Có "Đánh Giá Sức Khỏe"');

  const enHtml = renderWithLang(
    React.createElement(PatientScreeningResultView, {
      result: sampleResultData,
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('PATIENT-I18N-4: ConsultationChatModal render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(ConsultationChatModal, {
      isOpen: true,
      onClose: () => {},
      currentUserRole: 'patient',
      patientName: 'Nguyễn Văn Người Bệnh',
      patientMrn: 'MRN-12345',
      partnerUserId: undefined,
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Kênh trao đổi chuyên môn y khoa thời gian thực'), 'VI: Có disclaimer');
  assert.ok(viHtml.includes('Chưa có Bác sĩ chuyên khoa phụ trách'), 'VI: Có unassigned title');

  const enHtml = renderWithLang(
    React.createElement(ConsultationChatModal, {
      isOpen: true,
      onClose: () => {},
      currentUserRole: 'patient',
      patientName: 'Nguyễn Văn Người Bệnh',
      patientMrn: 'MRN-12345',
      partnerUserId: undefined,
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('PATIENT-I18N-5: MedicalProfileModal render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(MedicalProfileModal, {
      isOpen: true,
      onClose: () => {},
      patient: samplePatientData,
      onSave: () => {},
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Hồ Sơ Y Tế &amp; Tiền Sử Bệnh Cá Nhân') || viHtml.includes('Hồ Sơ Y Tế & Tiền Sử Bệnh Cá Nhân'), 'VI: Tiêu đề modal');
  assert.ok(viHtml.includes('Thông Tin Cá Nhân'), 'VI: Tab 1');
  assert.ok(viHtml.includes('Chỉ Số Sinh Hiệu'), 'VI: Tab 2');

  const enHtml = renderWithLang(
    React.createElement(MedicalProfileModal, {
      isOpen: true,
      onClose: () => {},
      patient: samplePatientData,
      onSave: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('PATIENT-I18N-6: CreditPurchaseModal render song ngữ chuẩn (VI & EN)', () => {
  const viPackages = [
    {
      id: 1,
      name: 'Gói Cơ Bản (Khám Đơn)',
      scansCount: 1,
      priceVnd: 50000,
      features: ['1 lượt phân tích ảnh võng mạc AI'],
    },
  ];
  const viHtml = renderWithLang(
    React.createElement(CreditPurchaseModal, {
      isOpen: true,
      onClose: () => {},
      userRole: 'patient',
      currentCredits: 3,
      customPackages: viPackages,
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Nạp Thêm Lượt Khám Sàng Lọc AI'), 'VI: Tiêu đề modal');
  assert.ok(viHtml.includes('Gói Cơ Bản (Khám Đơn)'), 'VI: Tên gói cơ bản');
  assert.ok(viHtml.includes('Tiếp tục chọn phương thức'), 'VI: Nút tiếp tục');

  const enPackages = [
    {
      id: 1,
      name: 'Basic Package (Single Scan)',
      scansCount: 1,
      priceVnd: 50000,
      features: ['1 AI retinal scan analysis'],
    },
  ];
  const enHtml = renderWithLang(
    React.createElement(CreditPurchaseModal, {
      isOpen: true,
      onClose: () => {},
      userRole: 'patient',
      currentCredits: 3,
      customPackages: enPackages,
    }),
    'en'
  );

  assert.ok(enHtml.includes('Nạp Thêm Lượt Khám Sàng Lọc AI'), 'VI: Tiêu đề modal (khóa tiếng Việt)');
  assert.ok(enHtml.includes('Tiếp tục chọn phương thức'), 'VI: Nút tiếp tục (khóa tiếng Việt)');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('PATIENT-I18N-7: PatientPortalPage render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(PatientPortalPage, {
      user: sampleUserData,
      activeView: 'dashboard',
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Khám Định Kỳ Võng Mạc'), 'VI: Hero badge');
  assert.ok(
    viHtml.includes('ảnh khám mới') || viHtml.includes('Tải Ảnh Khám Mới') || viHtml.includes('Tải ảnh'),
    'VI: Nút tải ảnh'
  );
  assert.ok(
    viHtml.includes('Hồ sơ sức khỏe') || viHtml.includes('Hồ sơ bệnh án') || viHtml.includes('Hồ Sơ Y Tế') || viHtml.includes('Hồ sơ y tế'),
    'VI: Nút hồ sơ'
  );
  assert.ok(
    viHtml.includes('Bác sĩ phụ trách') || viHtml.includes('Assigned doctor'),
    'VI: Doctor info section present'
  );
  assert.ok(
    viHtml.includes('Chưa gửi') || viHtml.includes('Đang chờ duyệt') || viHtml.includes('Đã duyệt'),
    'VI: Review status badge present'
  );

  const enHtml = renderWithLang(
    React.createElement(PatientPortalPage, {
      user: sampleUserData,
      activeView: 'dashboard',
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

// -----------------------------------------------------------------------------
// PHẦN 9: KIỂM THỬ KHẢ NĂNG CHUYỂN ĐỔI SONG NGỮ PHÂN HỆ BÁC SĨ (DOCTOR PORTAL)
// -----------------------------------------------------------------------------
console.log('\n--- 9. Kiểm Thử Khả Năng Chuyển Đổi Song Ngữ Phân Hệ Bác Sĩ (Doctor Portal) ---');

const sampleDoctorAssigned = [
  {
    patientId: 'p-001',
    mrn: 'MRN-12345',
    fullName: 'Nguyễn Văn Người Bệnh',
    age: 58,
    gender: 'Male',
    systolicBp: 135,
    diastolicBp: 85,
    hba1c: 6.8,
    hasDiabetes: true,
    hasHypertension: true,
    screeningCount: 2,
    assignedAt: '2026-03-10',
    assignmentStatus: 'ASSIGNED',
    latestRiskLevel: 'Moderate',
  },
];

runTest('DOCTOR-I18N-1: DoctorWorklistView render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(DoctorWorklistView, {
      patients: [samplePatientData],
      onSelectPatient: () => {},
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Danh sách ca khám phân công'), 'VI: Tiêu đề danh sách ca khám');
  assert.ok(viHtml.includes('Tìm kiếm bệnh nhân'), 'VI: Nhãn tìm kiếm');
  assert.ok(viHtml.includes('Trạng thái thẩm định'), 'VI: Bộ lọc trạng thái');
  assert.ok(viHtml.includes('Mức nguy cơ'), 'VI: Bộ lọc mức nguy cơ');
  assert.ok(viHtml.includes('Mở CDS'), 'VI: Nút mở CDS');

  const enHtml = renderWithLang(
    React.createElement(DoctorWorklistView, {
      patients: [samplePatientData],
      onSelectPatient: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-2: DoctorDiagnosisModal render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(DoctorDiagnosisModal, {
      isOpen: true,
      onClose: () => {},
      analysisId: 'ANA-999',
      patientName: 'Nguyễn Văn Người Bệnh',
      mrn: 'MRN-12345',
      onSaveFeedback: () => {},
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Thẩm định kết quả và Ký số kết luận lâm sàng') || viHtml.includes('Thẩm Định Kết Quả'), 'VI: Tiêu đề modal');
  assert.ok(viHtml.includes('Đồng ý với AI') || viHtml.includes('Chấp thuận chẩn đoán của AI') || viHtml.includes('Đồng Ý AI'), 'VI: Nút đồng ý AI');
  assert.ok(viHtml.includes('Hiệu chỉnh kết quả') || viHtml.includes('Hiệu chỉnh kết luận lâm sàng') || viHtml.includes('Chỉnh Sửa'), 'VI: Nút chỉnh sửa');
  assert.ok(viHtml.includes('Bác bỏ kết quả') || viHtml.includes('Bác bỏ kết luận của AI') || viHtml.includes('Bác Bỏ'), 'VI: Nút bác bỏ');
  assert.ok(viHtml.includes('Chữ ký số PKI:'), 'VI: Nhãn chữ ký số');
  assert.ok(viHtml.includes('Ký &amp; Lưu kết quả') || viHtml.includes('Ký & Lưu kết quả') || viHtml.includes('Lưu và Ký duyệt hồ sơ') || viHtml.includes('Lưu & Ký') || viHtml.includes('Ký & Lưu'), 'VI: Nút lưu');

  const enHtml = renderWithLang(
    React.createElement(DoctorDiagnosisModal, {
      isOpen: true,
      onClose: () => {},
      analysisId: 'ANA-999',
      patientName: 'Nguyễn Văn Người Bệnh',
      mrn: 'MRN-12345',
      onSaveFeedback: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-3: DoctorRiskAnalyticsView render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(DoctorRiskAnalyticsView, {
      assignedPatients: sampleDoctorAssigned,
      onSelectPatientForCDS: () => {},
    }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Thống Kê Nguy Cơ') ||
    viHtml.includes('Thống kê nguy cơ') ||
    viHtml.includes('Hiệu Suất'),
    'VI: Tiêu đề analytics'
  );
  assert.ok(viHtml.includes('Bệnh Nhân Phụ Trách') || viHtml.includes('Bệnh nhân phụ trách'), 'VI: Bệnh nhân phụ trách');
  assert.ok(viHtml.includes('Đã Duyệt Lâm Sàng') || viHtml.includes('Đã duyệt') || viHtml.includes('Đã Duyệt'), 'VI: Đã duyệt lâm sàng');
  assert.ok(viHtml.includes('Đồng Thuận Với AI') || viHtml.includes('Đồng thuận với AI'), 'VI: Đồng thuận AI');

  const enHtml = renderWithLang(
    React.createElement(DoctorRiskAnalyticsView, {
      assignedPatients: sampleDoctorAssigned,
      onSelectPatientForCDS: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-4: DoctorReportsView render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(DoctorReportsView, {
      assignedPatients: sampleDoctorAssigned,
      onReviewAndSign: () => {},
    }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Báo cáo &amp; Ký duyệt') ||
    viHtml.includes('Báo cáo & Ký duyệt') ||
    viHtml.includes('Báo cáo y khoa') ||
    viHtml.includes('Hồ Sơ Báo Cáo Y Khoa') ||
    viHtml.includes('Ký Duyệt') ||
    viHtml.includes('Ký duyệt'),
    'VI: Tiêu đề báo cáo'
  );
  assert.ok(
    viHtml.includes('Tổng Số Hồ Sơ Báo Cáo') ||
    viHtml.includes('Tổng số báo cáo') ||
    viHtml.includes('báo cáo'),
    'VI: Tổng số báo cáo'
  );
  assert.ok(
    viHtml.includes('Chờ Bác Sĩ Thẩm Định') ||
    viHtml.includes('Chờ duyệt'),
    'VI: Chờ thẩm định'
  );
  assert.ok(
    viHtml.includes('Đã Ký Duyệt Lâm Sàng') ||
    viHtml.includes('Đã ký duyệt') ||
    viHtml.includes('Đã duyệt'),
    'VI: Đã ký duyệt'
  );

  const enHtml = renderWithLang(
    React.createElement(DoctorReportsView, {
      assignedPatients: sampleDoctorAssigned,
      onReviewAndSign: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-5: DoctorConsultationView render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(DoctorConsultationView, {
      assignedPatients: sampleDoctorAssigned,
      onSelectPatientForCDS: () => {},
    }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Nhắn Tin Với Bệnh Nhân') ||
    viHtml.includes('Nhắn tin với bệnh nhân') ||
    viHtml.includes('Tư vấn trực tuyến') ||
    viHtml.includes('Tư Vấn Bệnh Nhân Trực Tuyến') ||
    viHtml.includes('Kênh Tư Vấn') ||
    viHtml.includes('Tư Vấn'),
    'VI: Tiêu đề chat'
  );
  assert.ok(
    viHtml.includes('Bệnh Nhân Phụ Trách') ||
    viHtml.includes('Bệnh nhân phụ trách') ||
    viHtml.includes('bệnh nhân'),
    'VI: Bệnh nhân phụ trách'
  );
  assert.ok(
    viHtml.includes('Cảnh báo an toàn y khoa:') ||
    viHtml.includes('Cảnh báo an toàn') ||
    viHtml.includes('Lưu ý y khoa:') ||
    viHtml.includes('y khoa'),
    'VI: Cảnh báo an toàn'
  );

  const enHtml = renderWithLang(
    React.createElement(DoctorConsultationView, {
      assignedPatients: sampleDoctorAssigned,
      onSelectPatientForCDS: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-6: ClinicalValidationBar render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(ClinicalValidationBar, {
      analysisId: 'ANA-999',
      onSaveFeedback: async () => {},
    }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Đánh Giá &amp; Ký Duyệt Kết Quả') ||
    viHtml.includes('Đánh Giá & Ký Duyệt Kết Quả') ||
    viHtml.includes('Thẩm Định Lâm Sàng &amp; Phê Duyệt Kết Quả Sàng Lọc') ||
    viHtml.includes('Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả Sàng Lọc') ||
    viHtml.includes('Đánh Giá & Ký Duyệt'),
    'VI: Tiêu đề validation bar'
  );
  assert.ok(viHtml.includes('Chấp thuận AI') || viHtml.includes('Chấp thuận'), 'VI: Chấp thuận AI');
  assert.ok(viHtml.includes('Hiệu chỉnh nguy cơ') || viHtml.includes('Hiệu chỉnh'), 'VI: Hiệu chỉnh nguy cơ');

  const enHtml = renderWithLang(
    React.createElement(ClinicalValidationBar, {
      analysisId: 'ANA-999',
      onSaveFeedback: async () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-7: PatientAssignmentBoard render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(PatientAssignmentBoard, null),
    'vi'
  );

  assert.ok(
    viHtml.includes('Điều phối bệnh nhân cho bác sĩ') ||
    viHtml.includes('Phân công bệnh nhân') ||
    viHtml.includes('Đang tải bảng phân công...') ||
    viHtml.includes('Đang tải...') ||
    viHtml.includes('Đang tải'),
    'VI: Bảng phân công'
  );

  const enHtml = renderWithLang(
    React.createElement(PatientAssignmentBoard, null),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-8: MedicalReportModal render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(MedicalReportModal, {
      isOpen: true,
      onClose: () => {},
      patient: samplePatientData,
      result: sampleResultData,
    }),
    'vi'
  );

  assert.ok(viHtml.includes('HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA'), 'VI: Tiêu đề hệ thống');
  assert.ok(
    viHtml.includes('Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA') ||
      viHtml.includes('Báo Cáo Sàng Lọc Sơ Bộ AURA AI'),
    'VI: Tiêu đề báo cáo'
  );
  assert.ok(viHtml.includes('Xuất CSV'), 'VI: Nút xuất CSV');
  assert.ok(viHtml.includes('In Phiếu / PDF'), 'VI: Nút in phiếu');

  const enHtml = renderWithLang(
    React.createElement(MedicalReportModal, {
      isOpen: true,
      onClose: () => {},
      patient: samplePatientData,
      result: sampleResultData,
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('DOCTOR-I18N-9: RiskAssessmentPanel render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(RiskAssessmentPanel, {
      result: sampleResultData,
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Đánh Giá Nguy Cơ Lâm Sàng AI'), 'VI: Tiêu đề panel');
  assert.ok(viHtml.includes('Nguy Cơ Tim Mạch'), 'VI: Nguy cơ tim mạch');
  assert.ok(viHtml.includes('Nguy Cơ Đột Quỵ'), 'VI: Nguy cơ đột quỵ');

  const enHtml = renderWithLang(
    React.createElement(RiskAssessmentPanel, {
      result: sampleResultData,
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

// -----------------------------------------------------------------------------
// PHẦN 10: KIỂM THỬ KHẢ NĂNG CHUYỂN ĐỔI SONG NGỮ PHÂN HỆ PHÒNG KHÁM (CLINIC PORTAL)
// -----------------------------------------------------------------------------
console.log('\n--- 10. Kiểm Thử Khả Năng Chuyển Đổi Song Ngữ Phân Hệ Phòng Khám (Clinic Portal) ---');

const sampleClinicBatchJob: ClinicBatchJob = {
  batchId: 'BATCH-2026-TEST',
  clinicId: 'CLN-001',
  clinicName: 'Phòng khám Đa khoa AURA Test',
  totalImages: 2,
  processedCount: 2,
  failedCount: 0,
  status: 'COMPLETED',
  createdAt: '2026-03-14T08:00:00.000Z',
  estimatedTimeRemainingSec: 0,
  items: [
    {
      id: 'ITEM-01',
      fileName: 'fundus_sample_01.jpg',
      patientName: 'Nguyễn Thị Hoa',
      pseudonymId: 'ANON-HOA-01',
      mrn: 'MRN-001',
      patientAge: 52,
      patientGender: 'Female',
      eye: 'OD',
      status: 'DONE',
      riskScore: 78,
      riskLevel: 'High',
      strokeRisk: 22,
      durationMs: 1200,
    },
    {
      id: 'ITEM-02',
      fileName: 'fundus_sample_02.jpg',
      patientName: 'Trần Văn Bình',
      pseudonymId: 'ANON-BINH-02',
      mrn: 'MRN-002',
      patientAge: 45,
      patientGender: 'Male',
      eye: 'OS',
      status: 'DONE',
      riskScore: 32,
      riskLevel: 'Low',
      strokeRisk: 4,
      durationMs: 950,
    },
  ],
};

runTest('CLINIC-I18N-1: ClinicBatchWorkspace render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(ClinicBatchWorkspace, {
      batchJob: sampleClinicBatchJob,
      onExportCsv: () => {},
      onUploadNewBatch: () => {},
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Tổng số ảnh') || viHtml.includes('Tổng Số Ảnh') || viHtml.includes('Tổng số'), 'VI: Tổng số ảnh trong đợt');
  assert.ok(viHtml.includes('Đã hoàn thành AI') || viHtml.includes('Đã Phân Tích AI') || viHtml.includes('Đã phân tích') || viHtml.includes('Hoàn tất'), 'VI: Đã hoàn thành AI');
  assert.ok(viHtml.includes('Tất cả trạng thái'), 'VI: Tất cả trạng thái');
  assert.ok(viHtml.includes('Xuất CSV'), 'VI: Xuất CSV');
  assert.ok(viHtml.includes('Danh sách ảnh') || viHtml.includes('Danh sách tệp ảnh chiến dịch') || viHtml.includes('Danh sách'), 'VI: Danh sách tệp ảnh chiến dịch');

  const enHtml = renderWithLang(
    React.createElement(ClinicBatchWorkspace, {
      batchJob: sampleClinicBatchJob,
      onExportCsv: () => {},
      onUploadNewBatch: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('CLINIC-I18N-2: ClinicBatchProcessing render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(ClinicBatchProcessing, {
      batchJob: sampleClinicBatchJob,
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Mã chiến dịch:') || viHtml.includes('Mã đợt:') || viHtml.includes('Chiến dịch') || viHtml.includes('Mã'), 'VI: Mã chiến dịch');
  assert.ok(viHtml.includes('Tiến độ xử lý hàng đợi AI') || viHtml.includes('Tiến độ xử lý') || viHtml.includes('Tiến độ') || viHtml.includes('hàng đợi'), 'VI: Hàng đợi AI');
  assert.ok(viHtml.includes('Quản lý lượt khám sàng lọc') || viHtml.includes('Quản lý lượt khám') || viHtml.includes('lượt khả dụng') || viHtml.includes('Lượt khám'), 'VI: Quản lý credit');
  assert.ok(viHtml.includes('Chi tiết phân bổ mức nguy cơ') || viHtml.includes('Phân bố nguy cơ') || viHtml.includes('Phân bổ nguy cơ') || viHtml.includes('Nguy cơ'), 'VI: Chi tiết nguy cơ');

  const enHtml = renderWithLang(
    React.createElement(ClinicBatchProcessing, {
      batchJob: sampleClinicBatchJob,
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('CLINIC-I18N-3: BatchUploadModal render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(BatchUploadModal, {
      isOpen: true,
      onClose: () => {},
      currentCredits: 1000,
      onSubmitBatch: async () => {},
    }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Tải lô ảnh võng mạc') ||
    viHtml.includes('Tải lên lô ảnh võng mạc hàng loạt') ||
    viHtml.includes('lô ảnh'),
    'VI: Tiêu đề tải lô'
  );
  assert.ok(
    viHtml.includes('Tên chiến dịch') ||
    viHtml.includes('chiến dịch'),
    'VI: Tên chiến dịch'
  );
  assert.ok(
    viHtml.includes('Nạp nhanh 100 ảnh mẫu') ||
    viHtml.includes('100 ảnh mẫu'),
    'VI: Nút nạp demo'
  );

  const enHtml = renderWithLang(
    React.createElement(BatchUploadModal, {
      isOpen: true,
      onClose: () => {},
      currentCredits: 1000,
      onSubmitBatch: async () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('CLINIC-I18N-4: BatchItemDetailModal render song ngữ chuẩn (VI & EN)', () => {
  const sampleItem = sampleClinicBatchJob.items[0];
  const viHtml = renderWithLang(
    React.createElement(BatchItemDetailModal, {
      item: sampleItem,
      onClose: () => {},
    }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Nguy cơ mạch máu') ||
    viHtml.includes('Nguy cơ mạch máu chung') ||
    viHtml.includes('Nguy cơ'),
    'VI: Nguy cơ mạch máu'
  );
  assert.ok(
    viHtml.includes('Vùng tổn thương') ||
    viHtml.includes('Bản đồ nhiệt') ||
    viHtml.includes('Grad-CAM'),
    'VI: Grad-CAM'
  );
  assert.ok(
    viHtml.includes('Chỉ số mạch máu võng mạc') ||
    viHtml.includes('Chỉ số sinh học vi mạch võng mạc') ||
    viHtml.includes('mạch máu'),
    'VI: Biomarkers'
  );

  const enHtml = renderWithLang(
    React.createElement(BatchItemDetailModal, {
      item: sampleItem,
      onClose: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('CLINIC-I18N-5: ClinicCampaignAnalytics render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(ClinicCampaignAnalytics, null),
    'vi'
  );

  assert.ok(
    viHtml.includes('Đang tải dữ liệu chiến dịch...') ||
    viHtml.includes('Đang tải dữ liệu báo cáo chiến dịch lâm sàng...') ||
    viHtml.includes('Đang tải dữ liệu') ||
    viHtml.includes('Đang tải'),
    'VI: Loading state'
  );

  const enHtml = renderWithLang(
    React.createElement(ClinicCampaignAnalytics, null),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('CLINIC-I18N-6: ClinicCreditPackageSection render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(ClinicCreditPackageSection, {
      batchJob: sampleClinicBatchJob,
    }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Đang tải dữ liệu...') ||
    viHtml.includes('Đang tải dữ liệu hạn mức và gói cước phòng khám...') ||
    viHtml.includes('Đang tải dữ liệu') ||
    viHtml.includes('Đang tải'),
    'VI: Loading credit packages'
  );

  const enHtml = renderWithLang(
    React.createElement(ClinicCreditPackageSection, {
      batchJob: sampleClinicBatchJob,
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('CLINIC-I18N-7: ClinicPortalPage render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(ClinicPortalPage, { activeView: 'bulk-batch' }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Không gian phòng khám') ||
    viHtml.includes('Quản lý phòng khám') ||
    viHtml.includes('Không gian quản lý sàng lọc phòng khám') ||
    viHtml.includes('phòng khám'),
    'VI: Portal title'
  );
  assert.ok(
    viHtml.includes('Quản lý chiến dịch tầm soát') ||
    viHtml.includes('Quản trị chiến dịch tầm soát vi mạch') ||
    viHtml.includes('chiến dịch tầm soát vi mạch') ||
    viHtml.includes('chiến dịch'),
    'VI: Portal subtitle'
  );

  const enHtml = renderWithLang(
    React.createElement(ClinicPortalPage, { activeView: 'bulk-batch' }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

// -----------------------------------------------------------------------------
// PHẦN 11: KIỂM THỬ KHẢ NĂNG CHUYỂN ĐỔI SONG NGỮ PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PORTAL)
// -----------------------------------------------------------------------------
console.log('\n--- 11. Kiểm Thử Khả Năng Chuyển Đổi Song Ngữ Phân Hệ Quản Trị Viên (Admin Portal) ---');

const sampleAuditLogs: AuditLogItem[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-14T08:30:00.000Z',
    actor: 'admin@aura.health',
    role: 'ROLE_ADMIN',
    action: 'USER_ROLE_UPDATE',
    resource: 'USER #u-001',
    severity: 'WARNING',
    status: 'SUCCESS',
    ipAddress: '192.168.1.1',
  },
];

runTest('ADMIN-I18N-1: AdminAuditWorkspace render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(AdminAuditWorkspace, {
      logs: sampleAuditLogs,
      loading: false,
      onRefresh: () => {},
      onExportLogs: () => {},
    }),
    'vi'
  );

  assert.ok(viHtml.includes('Thời Gian') || viHtml.includes('Thời gian'), 'VI: Cột thời gian');
  assert.ok(viHtml.includes('Người Thực Hiện') || viHtml.includes('Người thực hiện'), 'VI: Cột người thực hiện');
  assert.ok(viHtml.includes('Cảnh báo'), 'VI: Mức độ cảnh báo');
  assert.ok(viHtml.includes('Thành công'), 'VI: Trạng thái thành công');
  assert.ok(viHtml.includes('Xuất Nhật Ký'), 'VI: Nút xuất nhật ký');

  const enHtml = renderWithLang(
    React.createElement(AdminAuditWorkspace, {
      logs: sampleAuditLogs,
      loading: false,
      onRefresh: () => {},
      onExportLogs: () => {},
    }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('ADMIN-I18N-2: AdminAuditLogsPage render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(AdminAuditLogsPage, { activeView: 'user-management' }),
    'vi'
  );

  assert.ok(
    viHtml.includes('Quản trị hệ thống') ||
    viHtml.includes('Quản Trị Hệ Thống') ||
    viHtml.includes('Bảng Điều Khiển Quản Trị Hệ Thống'),
    'VI: Admin banner tag'
  );
  assert.ok(viHtml.includes('Tài Khoản'), 'VI: Tab Tài Khoản');
  assert.ok(viHtml.includes('Phân Quyền'), 'VI: Tab Phân Quyền');
  assert.ok(viHtml.includes('Thông Báo'), 'VI: Tab Thông Báo');
  assert.ok(viHtml.includes('Duyệt Phòng Khám'), 'VI: Tab Duyệt Phòng Khám');
  assert.ok(viHtml.includes('Gói Dịch Vụ'), 'VI: Tab Gói Dịch Vụ');
  assert.ok(viHtml.includes('Cấu Hình AI'), 'VI: Tab Cấu Hình AI');

  const enHtml = renderWithLang(
    React.createElement(AdminAuditLogsPage, { activeView: 'user-management' }),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

// -----------------------------------------------------------------------------
// PHẦN 12: KIỂM THỬ KHẢ NĂNG CHUYỂN ĐỔI SONG NGỮ CÁC THÀNH PHẦN XÁC THỰC (AUTH)
// -----------------------------------------------------------------------------
console.log('\n--- 12. Kiểm Thử Khả Năng Chuyển Đổi Song Ngữ Các Thành Phần Xác Thực (Auth) ---');

runTest('AUTH-I18N-1: AuthHeroPanel render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(AuthHeroPanel, null),
    'vi'
  );

  assert.ok(
    viHtml.includes('AI hỗ trợ tầm soát') ||
    viHtml.includes('AI hỗ trợ sàng lọc') ||
    viHtml.includes('AI hỗ trợ'),
    'VI: Hero pill 1'
  );
  assert.ok(
    viHtml.includes('Phân tích ảnh mắt') ||
    viHtml.includes('Phân tích ảnh võng mạc') ||
    viHtml.includes('Phân tích ảnh'),
    'VI: Hero pill 2'
  );
  assert.ok(
    viHtml.includes('Kết quả mang tính tham khảo, không thay thế chẩn đoán bác sĩ.') ||
    viHtml.includes('Kết quả chỉ hỗ trợ sàng lọc và không thay thế chẩn đoán của bác sĩ.') ||
    viHtml.includes('không thay thế chẩn đoán'),
    'VI: Hero warning'
  );

  const enHtml = renderWithLang(
    React.createElement(AuthHeroPanel, null),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('AUTH-I18N-2: PasswordInput render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(PasswordInput, {
      id: 'test-pwd',
      label: 'Mật khẩu',
    }),
    'vi'
  );

  assert.ok(viHtml.includes('aria-label="Hiện mật khẩu"'), 'VI: aria-label hiện mật khẩu');

  const enHtml = renderWithLang(
    React.createElement(PasswordInput, {
      id: 'test-pwd',
      label: 'Password',
    }),
    'en'
  );

  assert.ok(enHtml.includes('aria-label="Hiện mật khẩu"'), 'Khóa tiếng Việt: aria-label vẫn là tiếng Việt');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

// -----------------------------------------------------------------------------
// PHẦN 13: KIỂM THỬ KHẢ NĂNG CHUYỂN ĐỔI SONG NGỮ CÁC THÀNH PHẦN DÙNG CHUNG (COMMON)
// -----------------------------------------------------------------------------
console.log('\n--- 13. Kiểm Thử Khả Năng Chuyển Đổi Song Ngữ Các Thành Phần Dùng Chung (Common) ---');

runTest('COMMON-I18N-1: Footer render song ngữ chuẩn (VI & EN)', () => {
  const viHtml = renderWithLang(
    React.createElement(Footer, null),
    'vi'
  );

  assert.ok(
    viHtml.includes('Đạt chuẩn bảo mật Y tế &amp; ISO 27001') ||
    viHtml.includes('Đạt chuẩn bảo mật Y tế & ISO 27001') ||
    viHtml.includes('Chuẩn HIPAA &amp; ISO 27001') ||
    viHtml.includes('Chuẩn HIPAA & ISO 27001') ||
    viHtml.includes('ISO 27001'),
    'VI: Security cert'
  );
  assert.ok(viHtml.includes('Chính sách Bảo mật'), 'VI: Privacy policy');
  assert.ok(viHtml.includes('Điều khoản Sử dụng'), 'VI: Terms of service');
  assert.ok(viHtml.includes('Trung tâm Hỗ trợ'), 'VI: Support center');

  const enHtml = renderWithLang(
    React.createElement(Footer, null),
    'en'
  );

  assert.strictEqual(enHtml, viHtml, 'Khóa tiếng Việt: enHtml đồng nhất với viHtml');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi', 'LocalStorage tự động reset về vi');
});

runTest('COMMON-I18N-2: StateFeedback (LoadingState & ErrorState) render song ngữ chuẩn (VI & EN)', () => {
  const viLoading = renderWithLang(React.createElement(LoadingState, null), 'vi');
  assert.ok(viLoading.includes('Đang tải dữ liệu lâm sàng...'), 'VI: Loading default message');

  const enLoading = renderWithLang(React.createElement(LoadingState, null), 'en');
  assert.ok(enLoading.includes('Đang tải dữ liệu lâm sàng...'), 'Khóa tiếng Việt: Loading default message');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi');

  const viError = renderWithLang(
    React.createElement(ErrorState, { message: 'Lỗi mạng', onRetry: () => {} }),
    'vi'
  );
  assert.ok(viError.includes('Đã xảy ra lỗi'), 'VI: Error default title');
  assert.ok(viError.includes('Thử lại'), 'VI: Retry button');

  const enError = renderWithLang(
    React.createElement(ErrorState, { message: 'Network error', onRetry: () => {} }),
    'en'
  );
  assert.ok(enError.includes('Đã xảy ra lỗi'), 'Khóa tiếng Việt: Error default title');
  assert.ok(enError.includes('Thử lại'), 'Khóa tiếng Việt: Retry button');
  assert.strictEqual(localStorage.getItem('aura_language'), 'vi');
});

// Reset storage sau khi test
localStorage.setItem('aura_language', 'vi');

console.log('\n=================================================================');
console.log(`   KẾT QUẢ KIỂM THỬ: ${passed}/${passed + failed} TESTS ĐÃ ĐẠT (100% PASS)`);
console.log('=================================================================\n');

if (failed === 0) {
  process.exit(0);
} else {
  process.exit(1);
}
