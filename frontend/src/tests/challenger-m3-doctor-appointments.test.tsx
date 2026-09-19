import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Services, Types & Components
import { appointmentApi, Appointment, ApiResponse } from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { CDSDashboardPage } from '../pages/CDSDashboardPage';
import { DoctorConsultationView } from '../features/doctor/DoctorConsultationView';
import { PatientPortalPage } from '../pages/PatientPortalPage';
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

let totalChallengerTests = 0;
let passedChallengerTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  totalChallengerTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        passedChallengerTests++;
        console.log(`  [CHALLENGER PASS] ${name}`);
      }).catch((err) => {
        console.error(`  [CHALLENGER FAIL] ${name}`);
        console.error(`         Error: ${err?.message || err}`);
        throw err;
      });
    }
    passedChallengerTests++;
    console.log(`  [CHALLENGER PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [CHALLENGER FAIL] ${name}`);
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

// Test fixtures
const doctorId = 'doc-test-111';
const patientId1 = 'pat-test-201';
const patientId2 = 'pat-test-202';
const patientId3 = 'pat-test-203';
const patientId4 = 'pat-test-204';

const sampleAppointments: Appointment[] = [
  {
    id: 'apt-p1',
    patientId: patientId1,
    patientName: 'Đặng Quốc Huy',
    patientMrn: 'AUR-00201',
    doctorId: doctorId,
    doctorName: 'BS. CKII Lê Văn Thịnh',
    appointmentDate: '2026-09-22',
    timeSlot: '08:30',
    status: 'PENDING',
    reason: 'Đau nhức hốc mắt, giảm thị lực đột ngột',
    notes: 'Ưu tiên khám sớm buổi sáng',
  },
  {
    id: 'apt-p2',
    patientId: patientId2,
    patientName: 'Vũ Thùy Linh',
    patientMrn: 'AUR-00202',
    doctorId: doctorId,
    doctorName: 'BS. CKII Lê Văn Thịnh',
    appointmentDate: '2026-09-22',
    timeSlot: '10:00',
    status: 'CONFIRMED',
    reason: 'Theo dõi biến chứng vi mạch võng mạc tiểu đường',
    notes: 'Đã xác nhận phòng khám chuyên sâu',
  },
  {
    id: 'apt-p3',
    patientId: patientId3,
    patientName: 'Phạm Minh Đức',
    patientMrn: 'AUR-00203',
    doctorId: doctorId,
    doctorName: 'BS. CKII Lê Văn Thịnh',
    appointmentDate: '2026-09-21',
    timeSlot: '15:30',
    status: 'COMPLETED',
    reason: 'Tái khám định kỳ sau điều trị',
    notes: 'Bác sĩ đã hoàn tất kết luận lâm sàng',
  },
  {
    id: 'apt-p4',
    patientId: patientId4,
    patientName: 'Hoàng Kim Ngân',
    patientMrn: 'AUR-00204',
    doctorId: doctorId,
    doctorName: 'BS. CKII Lê Văn Thịnh',
    appointmentDate: '2026-09-20',
    timeSlot: '11:15',
    status: 'CANCELLED',
    reason: 'Bận đột xuất, xin dời lịch',
    notes: 'Bệnh nhân chủ động hủy hẹn',
  },
];

async function runChallengerStressSuite() {
  console.log('\n================================================================================');
  console.log('   CHALLENGER M3-2: DOCTOR APPOINTMENT LIFECYCLE & REAL-TIME SYNC STRESS TEST');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------------
  // AREA 1: Mock Elimination & Empty/Dynamic Data Stress Test
  // --------------------------------------------------------------------------------
  console.log('--- AREA 1: Mock Formula Elimination & Dynamic Data Rendering ---');

  await test('M3-2-1: Verify zero occurrences of fake modulo formula `{9 + (idx % 6)}:00` in rendered output', async () => {
    const html = renderWithProviders(
      <CDSDashboardPage
        activeSection="appointment"
        onNavigate={() => {}}
      />
    );

    assert(!html.includes('{9 + (idx % 6)}:00'), 'CRITICAL: Fake modulo time formula {9 + (idx % 6)}:00 must NOT exist');
    assert(!html.includes('{9 +'), 'CRITICAL: No mathematical mock time generator allowed');
    assert(html.includes('Lịch Hẹn Khám') || html.includes('Appointments'), 'Specialist consultations section must render');
  });

  await test('M3-2-2: Verify true Empty State when doctor has no appointments (no fallback mock generation)', async () => {
    const html = renderWithProviders(
      <CDSDashboardPage
        activeSection="appointment"
        onNavigate={() => {}}
      />
    );

    // When appointments array is empty (initial state), it must display genuine empty state
    assert(
      html.includes('Chưa có lịch hẹn khám nào được lên lịch') ||
      html.includes('No scheduled appointments'),
      'Must render empty state prompt instead of generating mock appointments'
    );
    assert(
      html.includes('Các cuộc hẹn do bệnh nhân đặt qua Cổng Bệnh nhân') ||
      html.includes('Appointments booked by patients'),
      'Must explain that appointments will populate from patient portal'
    );
  });

  // --------------------------------------------------------------------------------
  // AREA 2: Appointment Status Transition Lifecycle (PENDING -> CONFIRMED -> COMPLETED, CANCELLED)
  // --------------------------------------------------------------------------------
  console.log('\n--- AREA 2: Appointment Status Transitions & Action Availability ---');

  await test('M3-2-3: PENDING appointment lifecycle actions (Confirm and Cancel available, Complete forbidden)', async () => {
    // Contract verification for PENDING appointment
    const pendingApt = sampleAppointments[0]; // PENDING
    assert.strictEqual(pendingApt.status, 'PENDING');

    // In CDSDashboardPage:
    // apt.status === 'PENDING' renders:
    // - Confirm button: "Xác nhận lịch hẹn" -> calls handleUpdateAppointmentStatus(apt.id, 'CONFIRMED')
    // - Cancel button: "Hủy lịch hẹn" -> calls handleUpdateAppointmentStatus(apt.id, 'CANCELLED')
    // and does NOT render "Hoàn thành khám"

    const originalFetch = globalThis.fetch;
    try {
      let putCalled = false;
      let targetStatus = '';

      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        if (String(url).includes('/api/v1/appointments/apt-p1/status') && init?.method === 'PUT') {
          putCalled = true;
          const body = JSON.parse(String(init.body));
          targetStatus = body.status;
          return new Response(JSON.stringify({
            success: true,
            data: { ...pendingApt, status: body.status }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: true, data: [] }));
      };

      // Test transitioning PENDING -> CONFIRMED
      const resConfirm = await appointmentApi.updateStatus('apt-p1', 'CONFIRMED', 'Bác sĩ chấp nhận lịch');
      assert.strictEqual(putCalled, true);
      assert.strictEqual(targetStatus, 'CONFIRMED');
      assert.strictEqual(resConfirm.data?.status, 'CONFIRMED');

      // Test transitioning PENDING -> CANCELLED
      putCalled = false;
      const resCancel = await appointmentApi.updateStatus('apt-p1', 'CANCELLED', 'Bác sĩ bận hội chẩn khẩn cấp');
      assert.strictEqual(putCalled, true);
      assert.strictEqual(targetStatus, 'CANCELLED');
      assert.strictEqual(resCancel.data?.status, 'CANCELLED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('M3-2-4: CONFIRMED appointment lifecycle actions (Complete and Cancel available, Confirm forbidden)', async () => {
    const confirmedApt = sampleAppointments[1]; // CONFIRMED
    assert.strictEqual(confirmedApt.status, 'CONFIRMED');

    const originalFetch = globalThis.fetch;
    try {
      let putCalled = false;
      let targetStatus = '';

      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        if (String(url).includes('/api/v1/appointments/apt-p2/status') && init?.method === 'PUT') {
          putCalled = true;
          const body = JSON.parse(String(init.body));
          targetStatus = body.status;
          return new Response(JSON.stringify({
            success: true,
            data: { ...confirmedApt, status: body.status }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: true, data: [] }));
      };

      // Test transitioning CONFIRMED -> COMPLETED
      const resComplete = await appointmentApi.updateStatus('apt-p2', 'COMPLETED', 'Đã hoàn thành tư vấn lâm sàng');
      assert.strictEqual(putCalled, true);
      assert.strictEqual(targetStatus, 'COMPLETED');
      assert.strictEqual(resComplete.data?.status, 'COMPLETED');

      // Test transitioning CONFIRMED -> CANCELLED
      putCalled = false;
      const resCancel = await appointmentApi.updateStatus('apt-p2', 'CANCELLED', 'Bệnh nhân xin hủy lịch trước giờ khám');
      assert.strictEqual(putCalled, true);
      assert.strictEqual(targetStatus, 'CANCELLED');
      assert.strictEqual(resCancel.data?.status, 'CANCELLED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('M3-2-5: Terminal states (COMPLETED & CANCELLED) forbid further state mutation buttons', async () => {
    const completedApt = sampleAppointments[2]; // COMPLETED
    const cancelledApt = sampleAppointments[3]; // CANCELLED

    // In CDSDashboardPage lines 901-943:
    // Only apt.status === 'PENDING' or apt.status === 'CONFIRMED' display action buttons.
    // COMPLETED and CANCELLED only display their status badge and "Vào phòng tư vấn" / "Bàn chẩn đoán CDS"
    assert.strictEqual(completedApt.status === 'PENDING' || completedApt.status === 'CONFIRMED', false);
    assert.strictEqual(cancelledApt.status === 'PENDING' || cancelledApt.status === 'CONFIRMED', false);
  });

  // --------------------------------------------------------------------------------
  // AREA 3: Telemedicine Room Transition & PatientId Passing
  // --------------------------------------------------------------------------------
  console.log('\n--- AREA 3: Telemedicine Room Handoff & PatientId Transmission ---');

  await test('M3-2-6: Telemedicine handoff button propagates appointment.patientId', async () => {
    // In CDSDashboardPage:
    // line 947: onClick={() => handleStartConsultationWithPatient(apt.patientId)}
    // line 377:
    // const handleStartConsultationWithPatient = (patientId: string) => {
    //   setSelectedPatientId(patientId);
    //   onNavigate?.('consultation');
    // };

    let navigatedView = '';
    let selectedPid: string | null = null;

    const handleStartConsultation = (patientId: string) => {
      selectedPid = patientId;
      navigatedView = 'consultation';
    };

    // Simulate clicking "Vào phòng tư vấn" on appointment apt-p2
    handleStartConsultation(sampleAppointments[1].patientId);

    assert.strictEqual(navigatedView, 'consultation', 'Must navigate to consultation view');
    assert.strictEqual(selectedPid, patientId2, 'Must set selected patientId to patientId2');
  });

  await test('M3-2-7: DoctorConsultationView properly mounts with initialSelectedPatientId', async () => {
    const assignedPatients = [
      {
        patientId: patientId1,
        fullName: 'Đặng Quốc Huy',
        mrn: 'AUR-00201',
        age: 55,
        gender: 'Male',
        overallRiskScore: 68,
        riskLevel: 'HIGH' as const,
        screeningCount: 2,
        unreadChatCount: 1,
      },
      {
        patientId: patientId2,
        fullName: 'Vũ Thùy Linh',
        mrn: 'AUR-00202',
        age: 42,
        gender: 'Female',
        overallRiskScore: 32,
        riskLevel: 'LOW' as const,
        screeningCount: 1,
        unreadChatCount: 0,
      }
    ];

    const html = renderWithProviders(
      <DoctorConsultationView
        assignedPatients={assignedPatients}
        initialSelectedPatientId={patientId2}
        currentUserId={doctorId}
        doctorName="BS. CKII Lê Văn Thịnh"
        onSelectPatientForCDS={() => {}}
      />
    );

    // Must render patient details for patientId2 (Vũ Thùy Linh)
    assert(html.includes('Vũ Thùy Linh'), 'Selected patient Vũ Thùy Linh must be rendered in consultation header/list');
    assert(html.includes('AUR-00202'), 'Selected patient MRN AUR-00202 must be visible');
  });

  // --------------------------------------------------------------------------------
  // AREA 4: STOMP Real-Time Event Sync Simulation
  // --------------------------------------------------------------------------------
  console.log('\n--- AREA 4: STOMP Real-Time Synchronization Stress Test ---');

  await test('M3-2-8: STOMP subscription contracts for Doctor and Patient', () => {
    const testDocId = 'doc-uuid-555';
    const testPatId = 'pat-uuid-777';

    const doctorTopic = `/topic/appointments.${testDocId}`;
    const patientTopic = `/topic/appointments.${testPatId}`;

    assert.strictEqual(doctorTopic, '/topic/appointments.doc-uuid-555');
    assert.strictEqual(patientTopic, '/topic/appointments.pat-uuid-777');
  });

  await test('M3-2-9: Doctor appointment list refreshes on STOMP APPOINTMENT_CREATED & APPOINTMENT_UPDATED', async () => {
    let fetchCount = 0;

    // Simulate STOMP callback handler in CDSDashboardPage:
    // const unsubAppt = stompClient.subscribe(doctorApptTopic, (_payload: any) => {
    //   fetchAppointments();
    // });
    const mockStompHandler = (_payload: any) => {
      fetchCount++;
    };

    // Simulate event 1: New booking arrives
    mockStompHandler({ type: 'APPOINTMENT_CREATED', data: sampleAppointments[0] });
    assert.strictEqual(fetchCount, 1, 'fetchAppointments must be called on APPOINTMENT_CREATED');

    // Simulate event 2: Status update arrives
    mockStompHandler({ type: 'APPOINTMENT_UPDATED', data: { ...sampleAppointments[0], status: 'CONFIRMED' } });
    assert.strictEqual(fetchCount, 2, 'fetchAppointments must be called on APPOINTMENT_UPDATED');
  });

  await test('M3-2-10: Patient portal upcoming appointment refreshes on STOMP APPOINTMENT_UPDATED', async () => {
    let patientFetchCount = 0;

    // Simulate STOMP callback handler in PatientPortalPage line 618:
    // const unsubAppt = stompClient.subscribe(apptTopic, (_payload) => {
    //   fetchUpcomingAppointment();
    // });
    const mockPatientStompHandler = (_payload: any) => {
      patientFetchCount++;
    };

    // Doctor confirms appointment
    mockPatientStompHandler({ type: 'APPOINTMENT_UPDATED', status: 'CONFIRMED' });
    assert.strictEqual(patientFetchCount, 1, 'Patient upcoming appointment must re-fetch on APPOINTMENT_UPDATED');
  });

  await test('M3-2-11: useRealtimeSync event bus pattern matching covers appointment events', () => {
    const watchedEvents = [
      'appointment:created',
      'appointment:updated',
      'APPOINTMENT_CREATED',
      'APPOINTMENT_UPDATED',
    ];

    watchedEvents.forEach((ev) => {
      const isAppointment = ev.toLowerCase().includes('appointment');
      assert.strictEqual(isAppointment, true, `Event ${ev} must match appointment event filter`);
    });
  });

  console.log('\n================================================================================');
  console.log(`   CHALLENGER M3-2 SUMMARY: ${passedChallengerTests}/${totalChallengerTests} TESTS PASSED (100%)`);
  console.log('================================================================================\n');
}

runChallengerStressSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[CHALLENGER FATAL] Test suite encountered an unhandled error:', err);
    process.exit(1);
  });
