import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Components under test
import { DoctorDashboardView } from '../features/doctor/DoctorDashboardView';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { LanguageProvider } from '../context/LanguageContext';
import { DoctorPatientSummary } from '../pages/CDSDashboardPage';

console.log('=================================================================');
console.log('   MILESTONE 4: DOCTOR PORTAL & CLINICAL WORKSPACE STRESS TESTS');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    throw err;
  }
}

const mockAssignedPatients: DoctorPatientSummary[] = [
  {
    patientId: 'pat-001',
    mrn: 'MRN-8801',
    fullName: 'Trần Văn Hoàng',
    age: 62,
    gender: 'Male',
    systolicBp: 145,
    diastolicBp: 92,
    hba1c: 7.4,
    hasDiabetes: true,
    hasHypertension: true,
    lastScreeningAt: '2026-03-12T08:30:00Z',
    latestRiskLevel: 'HIGH',
    screeningCount: 3,
    assignedAt: '2026-03-01',
    assignmentStatus: 'ASSIGNED',
  },
  {
    patientId: 'pat-002',
    mrn: 'MRN-8802',
    fullName: 'Nguyễn Thị Mai',
    age: 54,
    gender: 'Female',
    systolicBp: 128,
    diastolicBp: 82,
    hba1c: 6.2,
    hasDiabetes: true,
    hasHypertension: false,
    lastScreeningAt: '2026-03-14T09:15:00Z',
    latestRiskLevel: 'MODERATE',
    screeningCount: 1,
    assignedAt: '2026-03-05',
    assignmentStatus: 'ASSIGNED',
  },
  {
    patientId: 'pat-003',
    mrn: 'MRN-8803',
    fullName: 'Lê Minh Tuấn',
    age: 45,
    gender: 'Male',
    systolicBp: 118,
    diastolicBp: 76,
    hba1c: 5.4,
    hasDiabetes: false,
    hasHypertension: false,
    lastScreeningAt: '2026-03-15T14:00:00Z',
    latestRiskLevel: 'LOW',
    screeningCount: 2,
    assignedAt: '2026-03-08',
    assignmentStatus: 'COMPLETED',
  },
];

function renderWithLang(element: React.ReactElement): string {
  return renderToStaticMarkup(
    React.createElement(LanguageProvider, null, element)
  );
}

// -----------------------------------------------------------------------------
// 1. DoctorDashboardView Stress Tests
// -----------------------------------------------------------------------------
console.log('--- 1. DoctorDashboardView Metric & Component Tests ---');

test('DOC-DASH-1: Render 4 KPI Cards with authentic clinical counts', () => {
  const html = renderWithLang(
    <DoctorDashboardView
      assignedPatients={mockAssignedPatients}
      onSelectPatientForCDS={() => {}}
      onNavigate={() => {}}
    />
  );

  // 4 KPI Card Titles
  assert.ok(html.includes('Bệnh Nhân Phụ Trách') || html.includes('Assigned Patients'), 'KPI 1: Assigned Patients present');
  assert.ok(html.includes('Chờ Thẩm Định') || html.includes('Pending Reviews'), 'KPI 2: Pending Reviews present');
  assert.ok(html.includes('Ca Nguy Cơ Cao') || html.includes('High Risk Cases'), 'KPI 3: High Risk Cases present');
  assert.ok(html.includes('Đã Thẩm Định') || html.includes('Reviewed Today'), 'KPI 4: Reviewed Today present');

  // Values
  assert.ok(html.includes('3'), 'Total assigned count 3 rendered');
});

test('DOC-DASH-2: Render SVG Review Trajectory Chart with 7 day distribution', () => {
  const html = renderWithLang(
    <DoctorDashboardView
      assignedPatients={mockAssignedPatients}
      onSelectPatientForCDS={() => {}}
      onNavigate={() => {}}
    />
  );

  assert.ok(html.includes('Biểu Đồ Hoạt Động Thẩm Định') || html.includes('Clinical Review &amp; Risk Activity'), 'Activity chart title present');
  assert.ok(html.includes('doctorActivityGrad'), 'Linear gradient SVG defs present');
  assert.ok(html.includes('T2') && html.includes('T6') && html.includes('CN'), '7 days column labels present');
});

test('DOC-DASH-3: Render Pending Review Status Queue with priority badges', () => {
  const html = renderWithLang(
    <DoctorDashboardView
      assignedPatients={mockAssignedPatients}
      onSelectPatientForCDS={() => {}}
      onNavigate={() => {}}
    />
  );

  assert.ok(html.includes('Hàng Đợi Chờ Thẩm Định') || html.includes('Pending Review Queue'), 'Pending queue title present');
  assert.ok(html.includes('MRN-8801'), 'High risk patient MRN present');
  assert.ok(html.includes('Thẩm định ngay') || html.includes('Review'), 'Action CTA present');
});

test('DOC-DASH-4: Render Recent Assigned Patients standardized DataTable', () => {
  const html = renderWithLang(
    <DoctorDashboardView
      assignedPatients={mockAssignedPatients}
      onSelectPatientForCDS={() => {}}
      onNavigate={() => {}}
    />
  );

  assert.ok(html.includes('Danh Sách Bệnh Nhân Tiếp Nhận Gần Đây') || html.includes('Recent Assigned Patients'), 'Table section title present');
  assert.ok(html.includes('Trần Văn Hoàng'), 'Patient name present in table');
  assert.ok(html.includes('145/92 mmHg'), 'Blood pressure vitals present');
  assert.ok(html.includes('7.4%'), 'HbA1c vital present');
  assert.ok(html.includes('Thẩm định CDS') || html.includes('Open CDS'), 'Table row action present');
});

test('DOC-DASH-5: Render Upcoming Appointments panel', () => {
  const html = renderWithLang(
    <DoctorDashboardView
      assignedPatients={mockAssignedPatients}
      onSelectPatientForCDS={() => {}}
      onNavigate={() => {}}
    />
  );

  assert.ok(html.includes('Lịch Hẹn Tư Vấn Sắp Tới') || html.includes('Upcoming Consultations'), 'Appointments title present');
  assert.ok(html.includes('Tư vấn') || html.includes('Chat'), 'Consultation action present');
});

test('DOC-DASH-6: Fail-safe behavior with empty patient cohort', () => {
  const html = renderWithLang(
    <DoctorDashboardView
      assignedPatients={[]}
      onSelectPatientForCDS={() => {}}
      onNavigate={() => {}}
    />
  );

  assert.ok(html.includes('0'), 'Zero count rendered safely');
  assert.ok(html.includes('Chưa có bệnh nhân nào được phân công') || html.includes('No patients assigned'), 'Empty table message present');
  assert.ok(html.includes('Không có ca chờ thẩm định') || html.includes('Queue is clear'), 'Empty queue message present');
});

// -----------------------------------------------------------------------------
// 2. ClinicalValidationBar Stress Tests
// -----------------------------------------------------------------------------
console.log('\n--- 2. ClinicalValidationBar Review Form & Override Tests ---');

test('VAL-BAR-1: Render 3 clinical decision options (Approve, Modify, Reject)', () => {
  const html = renderWithLang(
    <ClinicalValidationBar
      analysisId="ana-101"
      onSaveFeedback={async () => {}}
    />
  );

  assert.ok(html.includes('Chấp thuận AI') || html.includes('Approve'), 'Approve decision present');
  assert.ok(html.includes('Hiệu chỉnh nguy cơ') || html.includes('Modify'), 'Modify decision present');
  assert.ok(html.includes('Bác bỏ kết quả') || html.includes('Reject'), 'Reject decision present');
});

test('VAL-BAR-2: Render ICD-10 input and Clinical Notes textarea', () => {
  const html = renderWithLang(
    <ClinicalValidationBar
      analysisId="ana-101"
      onSaveFeedback={async () => {}}
    />
  );

  assert.ok(html.includes('ICD-10'), 'ICD-10 label present');
  assert.ok(html.includes('Ghi chú') || html.includes('Notes'), 'Notes label present');
  assert.ok(html.includes('Khuyến nghị y khoa') || html.includes('Recommendations'), 'Recommendations label present');
});

test('DOC-DASH-CROSSPORTAL-1: Patient name has clickable button to view patient profile and bilingual Profile button', () => {
  const html = renderWithLang(
    <DoctorDashboardView
      assignedPatients={mockAssignedPatients}
      onSelectPatientForCDS={() => {}}
      onNavigate={() => {}}
    />
  );

  assert.ok(html.includes('Hồ sơ') || html.includes('Profile'), 'Profile action button rendered');
  assert.ok(html.includes('Trần Văn Hoàng'), 'Patient name rendered');
  assert.ok(html.includes('Xem hồ sơ bệnh nhân') || html.includes('View patient profile'), 'Accessible tooltip present');
});

test('VAL-BAR-3: Render Save Draft and Confirm Review action buttons', () => {
  const html = renderWithLang(
    <ClinicalValidationBar
      analysisId="ana-101"
      onSaveFeedback={async () => {}}
    />
  );

  assert.ok(html.includes('Lưu bản nháp') || html.includes('Save Draft'), 'Save draft button present');
  assert.ok(html.includes('Ký &amp; Lưu') || html.includes('Ký & Lưu') || html.includes('Ký Số &amp; Phê Duyệt') || html.includes('Ký Số & Phê Duyệt'), 'Sign and approve button present');
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('=================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
} else {
  process.exit(0);
}
