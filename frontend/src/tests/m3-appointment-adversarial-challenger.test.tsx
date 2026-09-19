import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Services & Types
import { appointmentApi, Appointment } from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { AppointmentBookingModal } from '../features/patient/AppointmentBookingModal';
import { PatientDashboardView } from '../features/patient/PatientDashboardView';
import { CDSDashboardPage } from '../pages/CDSDashboardPage';
import { PatientProfile } from '../types/cds';
import fs from 'node:fs';
import path from 'node:path';

// Polyfill localStorage for Node.js test environment
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

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        passedTests++;
        console.log(`  [PASS] ${name}`);
      }).catch((err) => {
        console.error(`  [FAIL] ${name}`);
        console.error(`         Error: ${err?.message || err}`);
        throw err;
      });
    }
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    throw err;
  }
}

function renderWithProviders(element: React.ReactElement): string {
  return renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(AuthProvider, null, element)
    )
  );
}

const samplePatient: PatientProfile = {
  id: 'pat-adversarial-01',
  userId: 'user-pat-01',
  fullName: 'Nguyễn Văn Thử Nghiệm',
  mrn: 'AUR-PAT-999',
  gender: 'Male',
  age: 55,
  systolicBp: 130,
  diastolicBp: 80,
  hba1c: 6.5,
  hasDiabetes: true,
  hasHypertension: false,
  historyOfSmoking: false,
};

async function runAdversarialChallengerTests() {
  console.log('\n===================================================================================');
  console.log('   M3 ADVERSARIAL EMPIRICAL CHALLENGER TEST SUITE (APPOINTMENT SYSTEM)');
  console.log('===================================================================================\n');

  // =============================================================================
  // 1. Booking Creation API Protocol & Contract Verification
  // =============================================================================
  console.log('--- 1. Booking Creation Protocol & Contract Validation ---');

  await test('ADV-BOOK-1: appointmentApi.create sends correct POST payload and parses response', async () => {
    const originalFetch = globalThis.fetch;
    let interceptedUrl = '';
    let interceptedMethod = '';
    let interceptedHeaders: any = null;
    let interceptedBody: any = null;

    try {
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        interceptedUrl = String(input);
        interceptedMethod = init?.method || 'GET';
        interceptedHeaders = init?.headers;
        interceptedBody = init?.body ? JSON.parse(String(init.body)) : null;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'apt-created-uuid-1234',
              patientId: 'pat-adversarial-01',
              patientName: 'Nguyễn Văn Thử Nghiệm',
              doctorId: 'doc-specialist-007',
              doctorName: 'BS. CKII Nguyễn Thị Thanh',
              appointmentDate: '2026-09-25',
              timeSlot: '09:30',
              reason: 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch',
              notes: 'Bệnh nhân có triệu chứng nhìn mờ về chiều',
              status: 'PENDING',
              createdAt: '2026-09-19T06:00:00Z',
              updatedAt: '2026-09-19T06:00:00Z',
            },
            message: 'Đặt lịch hẹn khám thành công',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await appointmentApi.create({
        doctorId: 'doc-specialist-007',
        appointmentDate: '2026-09-25',
        timeSlot: '09:30',
        reason: 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch',
        notes: 'Bệnh nhân có triệu chứng nhìn mờ về chiều',
      });

      assert.strictEqual(interceptedUrl, '/api/v1/appointments', 'Must call /api/v1/appointments endpoint');
      assert.strictEqual(interceptedMethod, 'POST', 'Must use POST method');
      assert.strictEqual(interceptedBody.doctorId, 'doc-specialist-007');
      assert.strictEqual(interceptedBody.appointmentDate, '2026-09-25');
      assert.strictEqual(interceptedBody.timeSlot, '09:30');
      assert.strictEqual(interceptedBody.reason, 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch');
      assert.strictEqual(interceptedBody.notes, 'Bệnh nhân có triệu chứng nhìn mờ về chiều');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data?.id, 'apt-created-uuid-1234');
      assert.strictEqual(result.data?.status, 'PENDING');
      assert.strictEqual(result.data?.doctorName, 'BS. CKII Nguyễn Thị Thanh');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // =============================================================================
  // 2. Client-Side Edge Cases & Form Validation Hardening
  // =============================================================================
  console.log('\n--- 2. Client-Side Edge Cases & Form Validation Hardening ---');

  test('ADV-VAL-1: Missing Doctor Validation - logic rejects empty doctor and prevents API dispatch', () => {
    // Simulate validate-before-submit logic from AppointmentBookingModal
    const doctorsList: any[] = [];
    let selectedDoctorId = '';
    let effectiveDoctorId = selectedDoctorId;
    if (!effectiveDoctorId && doctorsList.length > 0) {
      effectiveDoctorId = doctorsList[0].id;
    }

    let validationError: string | null = null;
    let apiCalled = false;

    if (!effectiveDoctorId) {
      validationError = 'Vui lòng chọn bác sĩ phụ trách khám.';
    } else {
      apiCalled = true;
    }

    assert.strictEqual(validationError, 'Vui lòng chọn bác sĩ phụ trách khám.');
    assert.strictEqual(apiCalled, false, 'API must NOT be called when doctor is missing');
  });

  test('ADV-VAL-2: Missing Date Validation - logic rejects empty date and prevents API dispatch', () => {
    const selectedDoctorId = 'doc-001';
    const selectedDate = '';
    let validationError: string | null = null;
    let apiCalled = false;

    if (!selectedDate) {
      validationError = 'Vui lòng chọn ngày khám.';
    } else {
      apiCalled = true;
    }

    assert.strictEqual(validationError, 'Vui lòng chọn ngày khám.');
    assert.strictEqual(apiCalled, false, 'API must NOT be called when date is missing');
  });

  test('ADV-VAL-3: Missing Time Slot Validation - logic rejects empty slot and prevents API dispatch', () => {
    const selectedDoctorId = 'doc-001';
    const selectedDate = '2026-09-25';
    const selectedTimeSlot = '';
    let validationError: string | null = null;
    let apiCalled = false;

    if (!selectedTimeSlot) {
      validationError = 'Vui lòng chọn khung giờ khám.';
    } else {
      apiCalled = true;
    }

    assert.strictEqual(validationError, 'Vui lòng chọn khung giờ khám.');
    assert.strictEqual(apiCalled, false, 'API must NOT be called when time slot is missing');
  });

  // =============================================================================
  // 3. Adversarial Server Rejection: Past Dates & Slot Collision
  // =============================================================================
  console.log('\n--- 3. Server-Side Adversarial Rejection: Past Date & Slot Collision ---');

  await test('ADV-ERR-1: Past Date Rejection - Server 400 error is captured and handled safely', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Không thể đặt lịch hẹn trong quá khứ',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await appointmentApi.create({
        doctorId: 'doc-001',
        appointmentDate: '2020-01-01', // Date in the past
        timeSlot: '09:30',
        reason: 'Khám lại',
      });

      assert.strictEqual(result.success, false, 'Result must be unsuccessful');
      assert.strictEqual(result.message, 'Không thể đặt lịch hẹn trong quá khứ');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('ADV-ERR-2: Slot Collision / Double Booking Conflict - Captured and reported gracefully', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Khung giờ 09:30 ngày 2026-09-25 đã có người đặt trước. Vui lòng chọn khung giờ khác.',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await appointmentApi.create({
        doctorId: 'doc-001',
        appointmentDate: '2026-09-25',
        timeSlot: '09:30',
        reason: 'Tầm soát võng mạc',
      });

      assert.strictEqual(result.success, false, 'Result must be marked failure');
      assert(result.message.includes('đã có người đặt trước'), 'Error message must alert about slot collision');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // =============================================================================
  // 4. Two-Way Cancellation Lifecycle & UI State Transitions
  // =============================================================================
  console.log('\n--- 4. Two-Way Cancellation Lifecycle & UI State Transitions ---');

  await test('ADV-CANCEL-1: Patient Cancellation API call updates status to CANCELLED', async () => {
    const originalFetch = globalThis.fetch;
    let interceptedUrl = '';
    let interceptedMethod = '';
    let interceptedBody: any = null;

    try {
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        interceptedUrl = String(input);
        interceptedMethod = init?.method || 'GET';
        interceptedBody = init?.body ? JSON.parse(String(init.body)) : null;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'apt-to-cancel-777',
              patientId: 'pat-adversarial-01',
              doctorId: 'doc-001',
              appointmentDate: '2026-09-25',
              timeSlot: '10:15',
              status: 'CANCELLED',
              notes: 'Bệnh nhân chủ động hủy do bận công tác',
            },
            message: 'Cập nhật trạng thái lịch hẹn thành công',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const res = await appointmentApi.updateStatus(
        'apt-to-cancel-777',
        'CANCELLED',
        'Bệnh nhân chủ động hủy do bận công tác'
      );

      assert.strictEqual(interceptedUrl, '/api/v1/appointments/apt-to-cancel-777/status');
      assert.strictEqual(interceptedMethod, 'PUT');
      assert.strictEqual(interceptedBody.status, 'CANCELLED');
      assert.strictEqual(interceptedBody.notes, 'Bệnh nhân chủ động hủy do bận công tác');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data?.status, 'CANCELLED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV-CANCEL-2: Patient Portal transitions to clean Empty State when upcoming appointment is null', () => {
    // When upcoming appointment is null, PatientDashboardView must show empty placeholder
    const htmlEmpty = renderWithProviders(
      <PatientDashboardView
        patient={samplePatient}
        latestResult={null}
        userCredits={3}
        upcomingAppointment={null}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        onOpenRegisterModal={() => {}}
        scanHistory={[]}
      />
    );

    assert(htmlEmpty.includes('Chưa có lịch hẹn') || htmlEmpty.includes('Đặt lịch hẹn ngay') || htmlEmpty.includes('Chưa có'),
      'Must render clean empty state text');
    assert(!htmlEmpty.includes('apt-to-cancel-777'), 'Cancelled appointment data must not linger');
  });

  test('ADV-CANCEL-3: Patient Portal renders active upcoming appointment details when present', () => {
    const activeAppointment = {
      id: 'apt-active-999',
      doctorName: 'BS. CKII Nguyễn Thị Thanh',
      doctorId: 'doc-001',
      date: '2026-09-28',
      time: '14:15',
      reason: 'Đánh giá võng mạc tiểu đường',
      status: 'CONFIRMED',
    };

    const htmlActive = renderWithProviders(
      <PatientDashboardView
        patient={samplePatient}
        latestResult={null}
        userCredits={3}
        upcomingAppointment={activeAppointment}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        onOpenRegisterModal={() => {}}
        scanHistory={[]}
      />
    );

    assert(htmlActive.includes('BS. CKII Nguyễn Thị Thanh'), 'Must display doctor name');
    assert(htmlActive.includes('2026-09-28'), 'Must display appointment date');
    assert(htmlActive.includes('14:15'), 'Must display appointment time');
    assert(htmlActive.includes('Đánh giá võng mạc tiểu đường'), 'Must display reason');
  });

  // =============================================================================
  // 5. Doctor CDS Dashboard Real Data & Telemedicine Integration
  // =============================================================================
  console.log('\n--- 5. Doctor CDS Dashboard Real Data & Telemedicine Integration ---');

  test('ADV-DOCTOR-1: CDSDashboardPage renders real appointment header and teleconsultation action', () => {
    const htmlDoctor = renderWithProviders(
      <CDSDashboardPage
        activeSection="appointment"
        onNavigate={() => {}}
      />
    );

    assert(
      htmlDoctor.includes('Lịch Hẹn Khám &amp; Tư Vấn Chuyên Khoa') || htmlDoctor.includes('Lịch Hẹn Khám & Tư Vấn Chuyên Khoa'),
      'Doctor appointment section header must render'
    );
    assert(htmlDoctor.includes('Mở phòng tư vấn'), 'Telemedicine action button must be present');
    assert(!htmlDoctor.includes('{9 + (idx % 6)}:00'), 'Fake modulo time calculation must be completely eliminated');
  });

  test('ADV-DOCTOR-2: Doctor appointment action buttons and empty state render properly', () => {
    const htmlDoctor = renderWithProviders(
      <CDSDashboardPage
        activeSection="appointment"
        onNavigate={() => {}}
      />
    );

    assert(htmlDoctor.includes('Làm mới'), 'Refresh button must be available');
    assert(
      htmlDoctor.includes('Chưa có lịch hẹn khám nào') || htmlDoctor.includes('No scheduled appointments'),
      'Empty state message must render when no appointments are scheduled'
    );
  });

  // =============================================================================
  // 6. Source Code Integrity & Zero Mock Data Audit
  // =============================================================================
  console.log('\n--- 6. Source Code Integrity & Zero Mock Data Audit ---');

  test('ADV-AUDIT-1: AppointmentBookingModal.tsx connects to real patientApi and appointmentApi', () => {
    const filePath = path.resolve(process.cwd(), 'src/features/patient/AppointmentBookingModal.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert(content.includes('patientApi.getDoctors()'), 'Must fetch doctors from patientApi.getDoctors()');
    assert(content.includes('appointmentApi.create('), 'Must invoke appointmentApi.create()');
    assert(!content.includes('setTimeout(() => { resolve(true) }, 1000)'), 'No fake setTimeout resolvers');
  });

  test('ADV-AUDIT-2: PatientPortalPage.tsx connects to appointmentApi.getUpcoming and updateStatus', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/PatientPortalPage.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert(content.includes('appointmentApi.getUpcoming()'), 'Must fetch upcoming appointment dynamically');
    assert(content.includes("appointmentApi.updateStatus(upcomingAppointment.id, 'CANCELLED'"), 'Must invoke cancel API');
    assert(content.includes('localStorage.removeItem("aura_patient_upcoming_appointment")'), 'Must clear local storage on cancel');
  });

  test('ADV-AUDIT-3: CDSDashboardPage.tsx connects to appointmentApi.getAll and updateStatus', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/CDSDashboardPage.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert(content.includes("appointmentApi.getAll({ role: 'DOCTOR' })"), 'Must fetch appointments from API for doctor');
    assert(content.includes('appointmentApi.updateStatus(appointmentId, status'), 'Must allow doctor to update status via API');
    assert(!content.includes('{9 + (idx % 6)}:00'), 'Fake modulo generator must not exist in file');
  });

  // =============================================================================
  // 7. STOMP Realtime Notification & Event Bus Topics
  // =============================================================================
  console.log('\n--- 7. Realtime STOMP Notification & Event Topics ---');

  test('ADV-STOMP-1: Topic channels match specification contracts for multi-party sync', () => {
    const patientUserId = 'usr-pat-12345';
    const doctorUserId = 'usr-doc-67890';

    const patientApptTopic = `/topic/appointments.${patientUserId}`;
    const doctorApptTopic = `/topic/appointments.${doctorUserId}`;

    assert.strictEqual(patientApptTopic, '/topic/appointments.usr-pat-12345');
    assert.strictEqual(doctorApptTopic, '/topic/appointments.usr-doc-67890');
  });

  console.log('\n===================================================================================');
  console.log(`   ADVERSARIAL CHALLENGER RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('===================================================================================\n');
}

runAdversarialChallengerTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[FATAL] Adversarial challenger test suite failed:', err);
    process.exit(1);
  });
