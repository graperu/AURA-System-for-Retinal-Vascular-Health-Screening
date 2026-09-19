import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PatientPortalPage } from '../pages/PatientPortalPage';
import { PatientDashboardView } from '../features/patient/PatientDashboardView';
import { PatientUploadWizard } from '../features/patient/PatientUploadWizard';
import { AppointmentBookingModal } from '../features/patient/AppointmentBookingModal';
import { LanguageProvider } from '../context/LanguageContext';
import { PatientProfile, AIRiskResult } from '../types/cds';

// Polyfill localStorage
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    length: 0,
    key: () => null,
  } as Storage;
}

const emptyPatient: PatientProfile = {
  id: 'patient-fresh-01',
  fullName: 'Phan Văn Định',
  mrn: 'MRN-2026-D630',
  age: undefined,
  gender: undefined,
  systolicBp: undefined,
  diastolicBp: undefined,
  hba1c: undefined,
  bmi: undefined,
  hasDiabetes: false,
  hasHypertension: false,
};

const unmeasuredWithDoctor: PatientProfile = {
  ...emptyPatient,
  assignedDoctor: 'BS. CKII Nguyễn Thị Thanh',
};

const measuredPatient: PatientProfile = {
  id: 'patient-measured-01',
  fullName: 'Nguyễn Văn A',
  mrn: 'MRN-2026-A100',
  age: 50,
  gender: 'Male',
  systolicBp: 145,
  diastolicBp: 95,
  hba1c: 7.2,
  bmi: 26.5,
  assignedDoctor: 'BS. CKII Nguyễn Thị Thanh',
  hasDiabetes: true,
  hasHypertension: true,
};

const mockResult: AIRiskResult = {
  id: 'challenger-test-result-001',
  analysisId: 'analysis-stress-001',
  patientId: 'patient-fresh-01',
  imageUrl: '/assets/images/fundus_sample_od.png',
  status: 'COMPLETED',
  executionTimeMs: 420,
  overallVascularRiskScore: 74,
  riskScore: 74,
  cardiovascularRisk: {
    level: 'High',
    score: 78,
    hypertensionStage: 'Stage 2 HTN',
    threeYearStrokeRiskPercent: 32,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 62,
    etdrsGrade: 'MODERATE NPDR',
    macularEdemaPresent: true,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 18,
  },
};

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
  }
}

console.log('\n=================================================================');
console.log('   KIỂM THỬ KHÔNG HIỂN THỊ CHỈ SỐ ẢO KHI BỆNH NHÂN CHƯA SETUP');
console.log('=================================================================\n');

test('TEST-1: PatientPortalPage (medical-profile) - Tài khoản mới chưa setup vitals không được có 120/80 hoặc 5.8%', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientPortalPage
        user={{ id: 'patient-fresh-01', fullName: 'Phan Văn Định', email: 'dinh@example.com', role: 'PATIENT' }}
        activeSection="medical-profile"
        initialPatient={emptyPatient}
      />
    </LanguageProvider>
  );

  // Must NOT have fake numbers
  assert.ok(!html.includes('120/80'), 'Must NOT contain fake 120/80 blood pressure');
  assert.ok(!html.includes('5.8%'), 'Must NOT contain fake 5.8% HbA1c');

  // Must contain neutral unmeasured status
  assert.ok(html.includes('Chưa đo'), 'Must indicate Chưa đo in badge');
  assert.ok(html.includes('Chưa cập nhật'), 'Must indicate Chưa cập nhật in value');
  // Bar width should be 0%
  assert.ok(html.includes('width:0%'), 'Gauge bars should have 0% width');
});

test('TEST-2: PatientPortalPage (medical-profile) - Khi đã đo chỉ số (145/95, 7.2%), hiển thị đúng giá trị thực', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientPortalPage
        user={{ id: 'patient-measured-01', fullName: 'Nguyễn Văn A', email: 'a@example.com', role: 'PATIENT' }}
        activeSection="medical-profile"
        initialPatient={measuredPatient}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('145/95'), 'Must contain actual 145/95 blood pressure');
  assert.ok(html.includes('7.2%'), 'Must contain actual 7.2% HbA1c');
});

test('TEST-3: PatientPortalPage (consultation-chat) - Chỉ số thể trạng & BMI hiển thị Chưa đo khi trống, và giá trị thực khi có', () => {
  const htmlEmpty = renderToStaticMarkup(
    <LanguageProvider>
      <PatientPortalPage
        user={{ id: 'patient-fresh-01', fullName: 'Phan Văn Định', email: 'dinh@example.com', role: 'PATIENT' }}
        activeSection="consultation-chat"
        initialPatient={unmeasuredWithDoctor}
      />
    </LanguageProvider>
  );

  assert.ok(!htmlEmpty.includes('22.4'), 'Must NOT contain fake 22.4 BMI');
  assert.ok(htmlEmpty.includes('Chưa đo'), 'Must indicate Chưa đo for empty BMI');

  const htmlMeasured = renderToStaticMarkup(
    <LanguageProvider>
      <PatientPortalPage
        user={{ id: 'patient-measured-01', fullName: 'Nguyễn Văn A', email: 'a@example.com', role: 'PATIENT' }}
        activeSection="consultation-chat"
        initialPatient={measuredPatient}
      />
    </LanguageProvider>
  );

  assert.ok(htmlMeasured.includes('26.5'), 'Must contain actual 26.5 BMI');
  assert.ok(htmlMeasured.includes('145/95 mmHg'), 'Must contain actual 145/95 mmHg');
});

test('TEST-4: PatientDashboardView - Không hiển thị 120/80 khi bệnh nhân chưa có huyết áp', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientDashboardView
        patient={emptyPatient}
        latestResult={mockResult}
        userCredits={3}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(!html.includes('120/80'), 'Must NOT contain fake 120/80');
  assert.ok(html.includes('Chưa đo'), 'Must show Chưa đo');
  assert.ok(html.includes('width:0%'), 'Progress bar must be 0%');
});

test('TEST-5: PatientUploadWizard - Không hiển thị 120/80 khi bệnh nhân chưa có huyết áp', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientUploadWizard
        activePatient={emptyPatient}
        onStartAnalysis={() => {}}
        isAnalyzing={false}
        analysisProgress={{ status: 'idle', percent: 0 }}
      />
    </LanguageProvider>
  );

  assert.ok(!html.includes('120/80'), 'Wizard must NOT contain fake 120/80');
  assert.ok(html.includes('Chưa đo'), 'Wizard must show Chưa đo');
});

test('TEST-6: AppointmentBookingModal - Không hiển thị 120/80 mmHg (Tiêu chuẩn) khi bệnh nhân chưa có huyết áp', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AppointmentBookingModal
        isOpen={true}
        onClose={() => {}}
        patient={emptyPatient}
        initialStep={4}
        onSuccess={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(!html.includes('120/80'), 'Modal must NOT contain fake 120/80');
  assert.ok(html.includes('Chưa đo'), 'Modal must show Chưa đo');
});

console.log(`\nKết quả: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
process.exit(0);
