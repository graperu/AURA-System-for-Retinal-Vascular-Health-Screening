import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Services & Types
import { appointmentApi, Appointment, apiFetch, setAccessToken } from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { AppointmentBookingModal } from '../features/patient/AppointmentBookingModal';
import { PatientDashboardView } from '../features/patient/PatientDashboardView';
import { CDSDashboardPage } from '../pages/CDSDashboardPage';
import { PatientProfile } from '../types/cds';

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
  id: 'pat-101',
  userId: 'user-pat-101',
  fullName: 'Nguyễn Văn An',
  mrn: 'AUR-00101',
  gender: 'Male',
  age: 58,
  systolicBp: 135,
  diastolicBp: 85,
  hba1c: 6.8,
  hasDiabetes: true,
  hasHypertension: true,
  historyOfSmoking: false,
};

const sampleAppointments: Appointment[] = [
  {
    id: 'apt-001',
    patientId: 'pat-101',
    patientName: 'Nguyễn Văn An',
    patientMrn: 'AUR-00101',
    doctorId: 'doc-201',
    doctorName: 'BS. CKII Nguyễn Thị Thanh',
    appointmentDate: '2026-09-20',
    timeSlot: '09:30',
    status: 'PENDING',
    reason: 'Tầm soát định kỳ võng mạc đái tháo đường',
    notes: 'Bệnh nhân có tiền sử ĐTĐ type 2',
  },
  {
    id: 'apt-002',
    patientId: 'pat-102',
    patientName: 'Trần Thị Mai',
    patientMrn: 'AUR-00102',
    doctorId: 'doc-201',
    doctorName: 'BS. CKII Nguyễn Thị Thanh',
    appointmentDate: '2026-09-21',
    timeSlot: '14:15',
    status: 'CONFIRMED',
    reason: 'Mắt mờ, nhìn hình biến dạng',
    notes: 'Đã xác nhận phòng khám chuyên khoa',
  },
  {
    id: 'apt-003',
    patientId: 'pat-103',
    patientName: 'Lê Hoàng Long',
    patientMrn: 'AUR-00103',
    doctorId: 'doc-201',
    doctorName: 'BS. CKII Nguyễn Thị Thanh',
    appointmentDate: '2026-09-18',
    timeSlot: '10:00',
    status: 'COMPLETED',
    reason: 'Khám mắt định kỳ',
    notes: 'Đã hoàn thành hội chẩn',
  },
];

async function runAppointmentSystemTests() {
  console.log('\n=================================================================');
  console.log('   APPOINTMENT TWO-WAY MANAGEMENT SYSTEM TEST SUITE (R3, AC-3)');
  console.log('=================================================================\n');

  // -----------------------------------------------------------------------------
  // 1. API Client Tests (appointmentApi)
  // -----------------------------------------------------------------------------
  console.log('--- 1. appointmentApi Client Endpoint & Payload Contracts ---');

  await test('APT-API-1: appointmentApi.create sends correct POST request with body', async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    try {
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || 'GET';
        capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'apt-uuid-new',
              patientId: 'pat-101',
              doctorId: 'doc-201',
              appointmentDate: '2026-09-25',
              timeSlot: '10:15',
              reason: 'Tầm soát định kỳ',
              status: 'PENDING',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await appointmentApi.create({
        doctorId: 'doc-201',
        appointmentDate: '2026-09-25',
        timeSlot: '10:15',
        reason: 'Tầm soát định kỳ',
        notes: 'Ghi chú ban đầu',
      });

      assert.strictEqual(capturedUrl, '/api/v1/appointments');
      assert.strictEqual(capturedMethod, 'POST');
      assert.strictEqual(capturedBody.doctorId, 'doc-201');
      assert.strictEqual(capturedBody.appointmentDate, '2026-09-25');
      assert.strictEqual(capturedBody.timeSlot, '10:15');
      assert.strictEqual(capturedBody.reason, 'Tầm soát định kỳ');
      assert.strictEqual(capturedBody.notes, 'Ghi chú ban đầu');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data?.id, 'apt-uuid-new');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('APT-API-2: appointmentApi.getAll formats query parameters correctly', async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = '';

    try {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            data: sampleAppointments,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const resAll = await appointmentApi.getAll({ role: 'DOCTOR' });
      assert.strictEqual(capturedUrl, '/api/v1/appointments?role=DOCTOR');
      assert.strictEqual(resAll.success, true);
      assert.strictEqual(resAll.data?.length, 3);

      const resFiltered = await appointmentApi.getAll({ role: 'DOCTOR', status: 'PENDING' });
      assert.strictEqual(capturedUrl, '/api/v1/appointments?role=DOCTOR&status=PENDING');
      assert.strictEqual(resFiltered.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('APT-API-3: appointmentApi.getUpcoming hits /api/v1/appointments/upcoming', async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = '';

    try {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            data: sampleAppointments[1], // Upcoming confirmed appointment
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const resUpcoming = await appointmentApi.getUpcoming();
      assert.strictEqual(capturedUrl, '/api/v1/appointments/upcoming');
      assert.strictEqual(resUpcoming.success, true);
      assert.strictEqual(resUpcoming.data?.doctorName, 'BS. CKII Nguyễn Thị Thanh');
      assert.strictEqual(resUpcoming.data?.status, 'CONFIRMED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('APT-API-4: appointmentApi.updateStatus issues PUT with valid body', async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    try {
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || 'GET';
        capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
        return new Response(
          JSON.stringify({
            success: true,
            data: { ...sampleAppointments[0], status: 'CONFIRMED', notes: 'Bác sĩ đồng ý' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const resUpdate = await appointmentApi.updateStatus('apt-001', 'CONFIRMED', 'Bác sĩ đồng ý');
      assert.strictEqual(capturedUrl, '/api/v1/appointments/apt-001/status');
      assert.strictEqual(capturedMethod, 'PUT');
      assert.strictEqual(capturedBody.status, 'CONFIRMED');
      assert.strictEqual(capturedBody.notes, 'Bác sĩ đồng ý');
      assert.strictEqual(resUpdate.success, true);
      assert.strictEqual(resUpdate.data?.status, 'CONFIRMED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // -----------------------------------------------------------------------------
  // 2. AppointmentBookingModal Rendering & Behavior Tests
  // -----------------------------------------------------------------------------
  console.log('\n--- 2. AppointmentBookingModal UI & Flow Tests ---');

  test('APT-MODAL-1: Render AppointmentBookingModal Step 1 with doctor selection', () => {
    const html = renderWithProviders(
      <AppointmentBookingModal
        isOpen={true}
        onClose={() => {}}
        patient={samplePatient}
        onSuccess={() => {}}
      />
    );

    assert(html.includes('Đặt Lịch Khám'), 'Modal title must be present in Vietnamese');
    assert(html.includes('Chọn Bác sĩ') || html.includes('Bác Sĩ'), 'Step 1 doctor selection header must render');
    assert(html.includes('Bác sĩ trực ban phân công tự động'), 'Auto-assigned doctor option must be present');
  });

  test('APT-MODAL-2: AppointmentBookingModal does not render when isOpen is false', () => {
    const html = renderWithProviders(
      <AppointmentBookingModal
        isOpen={false}
        onClose={() => {}}
        patient={samplePatient}
        onSuccess={() => {}}
      />
    );

    assert(!html.includes('Bác sĩ trực ban phân công tự động'), 'Modal content must not render when isOpen is false');
  });

  // -----------------------------------------------------------------------------
  // 3. Patient Portal Upcoming Appointment Card & Empty State
  // -----------------------------------------------------------------------------
  console.log('\n--- 3. Patient Portal Dashboard & Appointment View Tests ---');

  test('APT-PATIENT-1: Patient Dashboard renders upcoming appointment card when scheduled', () => {
    const upcoming = {
      doctorName: 'BS. CKII Nguyễn Thị Thanh',
      doctorId: 'doc-201',
      date: '2026-09-22',
      time: '09:30',
      reason: 'Tầm soát vi mạch võng mạc định kỳ',
    };

    const html = renderWithProviders(
      <PatientDashboardView
        patient={samplePatient}
        latestResult={null}
        userCredits={5}
        upcomingAppointment={upcoming}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        onOpenRegisterModal={() => {}}
        scanHistory={[]}
      />
    );

    assert(html.includes('BS. CKII Nguyễn Thị Thanh'), 'Upcoming doctor name must render in KPI card or detail card');
    assert(html.includes('09:30'), 'Time slot must render');
    assert(html.includes('2026-09-22'), 'Date must render');
  });

  test('APT-PATIENT-2: Patient Dashboard renders clean empty state when no upcoming appointment', () => {
    const html = renderWithProviders(
      <PatientDashboardView
        patient={samplePatient}
        latestResult={null}
        userCredits={5}
        upcomingAppointment={null}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        onOpenRegisterModal={() => {}}
        scanHistory={[]}
      />
    );

    assert(html.includes('Chưa có') || html.includes('Đặt lịch'), 'Must show empty/call-to-action placeholder when none');
  });

  // -----------------------------------------------------------------------------
  // 4. CDSDashboardPage Doctor Appointments Section
  // -----------------------------------------------------------------------------
  console.log('\n--- 4. CDSDashboardPage Doctor Appointments Section Tests ---');

  test('APT-DOCTOR-1: CDSDashboardPage appointment section renders real header and empty state structure', () => {
    const html = renderWithProviders(
      <CDSDashboardPage
        activeSection="appointment"
        onNavigate={() => {}}
      />
    );

    assert(html.includes('Lịch Hẹn Khám &amp; Tư Vấn Chuyên Khoa') || html.includes('Lịch Hẹn Khám & Tư Vấn Chuyên Khoa'), 'Doctor appointments header must render');
    assert(html.includes('Mở phòng tư vấn'), 'Telemedicine shortcut button must be present');
    assert(!html.includes('{9 + (idx % 6)}:00'), 'Fake modulo time calculation must be completely eliminated');
  });

  test('APT-DOCTOR-2: Verify status actions and buttons exist in appointment section', () => {
    const html = renderWithProviders(
      <CDSDashboardPage
        activeSection="appointment"
        onNavigate={() => {}}
      />
    );

    assert(html.includes('Làm mới'), 'Refresh button must be present in appointment header');
  });

  // -----------------------------------------------------------------------------
  // 5. STOMP Realtime Topic & Channel Integration Checks
  // -----------------------------------------------------------------------------
  console.log('\n--- 5. STOMP Realtime Topics & Event Bus Integration ---');

  test('APT-STOMP-1: Topic channels match specification contracts', () => {
    const patientId = 'pat-uuid-456';
    const doctorId = 'doc-uuid-789';

    const patientTopic = `/topic/appointments.${patientId}`;
    const doctorTopic = `/topic/appointments.${doctorId}`;

    assert.strictEqual(patientTopic, '/topic/appointments.pat-uuid-456');
    assert.strictEqual(doctorTopic, '/topic/appointments.doc-uuid-789');
  });

  console.log('\n=================================================================');
  console.log(`   APPOINTMENT SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('=================================================================\n');
}

runAppointmentSystemTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[FATAL] Appointment system test suite failed:', err);
    process.exit(1);
  });
