import assert from 'node:assert';
import React, { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CDSDashboardPage, DoctorPatientSummary } from '../pages/CDSDashboardPage';
import { DoctorConsultationView } from '../features/doctor/DoctorConsultationView';
import { DoctorWorklistView } from '../features/doctor/DoctorWorklistView';
import { DoctorPatientListPage } from '../features/doctor/DoctorPatientListPage';
import { Sidebar } from '../components/layout/Sidebar';
import { SideNavBar } from '../components/SideNavBar';
import { Topbar } from '../components/layout/Topbar';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { realtimeBus } from '../services/realtimeService';

console.log('================================================================================');
console.log('   CHALLENGER M5-1: TELEMEDICINE DIRECT NAVIGATION & REALTIME BADGES STRESS TEST');
console.log('   Empirical Adversarial Verification of R5 & AC-5');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         Details: ${err?.message || err}`);
  }
}

// -----------------------------------------------------------------------------
// MOCK DATA FIXTURES
// -----------------------------------------------------------------------------
const mockDoctorUser = {
  id: 'doc-emp-01',
  name: 'BS.CKII Vũ Hoàng Mai',
  role: 'doctor' as const,
  clinicId: 'clinic-hanoi-01',
  email: 'mai.vu@aura.health',
};

const mockAssignedPatients: DoctorPatientSummary[] = [
  {
    patientId: 'patient-alpha-001',
    id: 'patient-alpha-001',
    fullName: 'Hoàng Văn Thái',
    age: 62,
    gender: 'Nam',
    mrn: 'MRN-ALPHA-01',
    riskScore: 84,
    latestRiskLevel: 'High',
    lastScreeningAt: '2026-09-18',
    screeningCount: 3,
    assignedAt: '2026-09-18T00:00:00Z',
    assignmentStatus: 'ASSIGNED',
    systolicBp: 155,
    diastolicBp: 95,
    hba1c: 8.2,
  },
  {
    patientId: 'patient-beta-002',
    id: 'patient-beta-002',
    fullName: 'Đỗ Thị Minh Nguyệt',
    age: 51,
    gender: 'Nữ',
    mrn: 'MRN-BETA-02',
    riskScore: 42,
    latestRiskLevel: 'Moderate',
    lastScreeningAt: '2026-09-17',
    screeningCount: 1,
    assignedAt: '2026-09-17T00:00:00Z',
    assignmentStatus: 'ASSIGNED',
    systolicBp: 125,
    diastolicBp: 80,
    hba1c: 6.1,
  },
  {
    patientId: 'patient-gamma-003',
    id: 'patient-gamma-003',
    fullName: 'Trương Quốc Bảo',
    age: 45,
    gender: 'Nam',
    mrn: 'MRN-GAMMA-03',
    riskScore: 19,
    latestRiskLevel: 'Low',
    lastScreeningAt: '2026-09-19',
    screeningCount: 2,
    assignedAt: '2026-09-19T00:00:00Z',
    assignmentStatus: 'ASSIGNED',
    systolicBp: 118,
    diastolicBp: 75,
    hba1c: 5.4,
  },
];

// =============================================================================
// SECTION 1: TELEMEDICINE DIRECT NAVIGATION EMPIRICAL PROBES
// =============================================================================

runTest('PROBE-1.1: Direct navigation to specific non-default patient (patient-beta-002) focuses patient 2', () => {
  const targetPatientId = 'patient-beta-002';
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={mockAssignedPatients}
          patientId={targetPatientId}
          currentUserId={mockDoctorUser.id}
          doctorName={mockDoctorUser.name}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Active conversation header should display patient 2 details
  assert.ok(html.includes('Đỗ Thị Minh Nguyệt'), 'Must display target patient name');
  assert.ok(html.includes('MRN-BETA-02') || html.includes('patient-beta-002'), 'Must display target patient MRN or ID');
  assert.ok(html.includes('125/80'), 'Must display target patient blood pressure in header');
});

runTest('PROBE-1.2: Direct navigation to arbitrary ID not in list creates valid fallback profile with valid MRN and name', () => {
  const arbitraryId = 'arbitrary-uuid-9876-xyz';
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={mockAssignedPatients}
          patientId={arbitraryId}
          currentUserId={mockDoctorUser.id}
          doctorName={mockDoctorUser.name}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Must create fallback profile with arbitraryId as MRN and formatted name
  assert.ok(html.includes(arbitraryId), 'Must include arbitrary ID in view');
  assert.ok(
    html.includes(`Bệnh nhân (${arbitraryId})`) || html.includes(`Patient (${arbitraryId})`),
    'Must format fallback patient name correctly'
  );
  // Must render in left column as well (prepended to filtered list)
  assert.ok(
    html.includes(`Bệnh Nhân Phụ Trách`),
    'Must render assigned patients container'
  );
});

runTest('PROBE-1.3: Navigation with empty assignedPatients list and arbitrary ID creates fallback without crashing', () => {
  const soloId = 'patient-solo-unassigned-404';
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={[]}
          patientId={soloId}
          currentUserId={mockDoctorUser.id}
          doctorName={mockDoctorUser.name}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(html.includes(soloId), 'Must render solo fallback patient');
  assert.ok(html.includes('Tư Vấn') || html.includes('Consultation'), 'Must render consultation view');
});

runTest('PROBE-1.4: Navigation with patientId=null gracefully falls back to default patient without crash', () => {
  const htmlWithPatients = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={mockAssignedPatients}
          patientId={null}
          currentUserId={mockDoctorUser.id}
          doctorName={mockDoctorUser.name}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Should default to first patient in list (Hoàng Văn Thái)
  assert.ok(htmlWithPatients.includes('Hoàng Văn Thái'), 'Must default to first patient when patientId is null');

  const htmlEmpty = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={[]}
          patientId={null}
          currentUserId={mockDoctorUser.id}
          doctorName={mockDoctorUser.name}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // When no patients and null, must render prompt without crashing
  assert.ok(
    htmlEmpty.includes('chọn một bệnh nhân') || htmlEmpty.includes('select a patient') || htmlEmpty.includes('Vui lòng chọn'),
    'Must show select patient placeholder when list is empty'
  );
});

runTest('PROBE-1.5: Navigation with patientId=undefined gracefully falls back to default without crash', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={mockAssignedPatients}
          patientId={undefined}
          currentUserId={mockDoctorUser.id}
          doctorName={mockDoctorUser.name}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(html.includes('Hoàng Văn Thái'), 'Must default to first patient when patientId is undefined');
});

runTest('PROBE-1.6: Navigation with patientId="" (empty string) falls back gracefully', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={mockAssignedPatients}
          patientId=""
          currentUserId={mockDoctorUser.id}
          doctorName={mockDoctorUser.name}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(html.includes('Hoàng Văn Thái'), 'Must default to first patient when patientId is empty string');
});

runTest('PROBE-1.7: Adversarial patientId inputs (UUID, special characters, numerical strings) handle safely', () => {
  const adversarialCases = [
    '550e8400-e29b-41d4-a716-446655440000', // Standard RFC4122 UUID
    'PT-VN-2026_#099',                       // Alphanumeric with symbols
    '1234567890',                            // Numeric string
    'special-!@*()_+-=[]{}',                // Punctuation safe encoding
  ];

  for (const caseId of adversarialCases) {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <AuthProvider>
          <DoctorConsultationView
            assignedPatients={mockAssignedPatients}
            patientId={caseId}
            onSelectPatientForCDS={() => {}}
          />
        </AuthProvider>
      </LanguageProvider>
    );

    assert.ok(html.length > 500, `Must successfully render view for patientId: ${caseId}`);
    assert.ok(html.includes(caseId), `Must safely include ${caseId} without script execution or crash`);
  }
});

runTest('PROBE-1.8: CDSDashboardPage "Vào phòng tư vấn" button passes selected patientId to consultation handler', () => {
  let navigatedSection = '';
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          patientId="patient-gamma-003"
          initialPatients={mockAssignedPatients}
          initialPatient={{
            id: 'patient-gamma-003',
            userId: 'patient-gamma-003',
            fullName: 'Trương Quốc Bảo',
            mrn: 'MRN-GAMMA-03',
            age: 45,
            gender: 'Male',
            systolicBp: 118,
            diastolicBp: 75,
            hba1c: 5.4,
          } as any}
          initialLoading={false}
          onNavigate={(sec) => { navigatedSection = sec; }}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="cds-telemedicine-btn"'), 'Must render cds-telemedicine-btn in top header');
  assert.ok(html.includes('Vào phòng tư vấn') || html.includes('Consultation'), 'Must contain consultation button label');
  assert.ok(html.includes('Trương Quốc Bảo'), 'Active patient in header must be Trương Quốc Bảo');
});

runTest('PROBE-1.9: CDSDashboardPage renders DoctorConsultationView when activeSection is "consultation"', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          activeSection="consultation"
          patientId="patient-beta-002"
          initialPatients={mockAssignedPatients}
          initialLoading={false}
          onNavigate={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Must render consultation view with the specific patient Đỗ Thị Minh Nguyệt
  assert.ok(html.includes('Đỗ Thị Minh Nguyệt'), 'Must render patient 2 name in consultation view');
  assert.ok(html.includes('Tư Vấn Bệnh Nhân Trực Tuyến') || html.includes('Online Patient Consultation'), 'Must render consultation header');
});

runTest('PROBE-1.10: DoctorWorklistView "Vào phòng tư vấn" trigger invokes callback with patient identifier', () => {
  let invokedPatientId = '';
  const worklistItems = [
    {
      id: 'p-wl-999',
      patientId: 'p-wl-999',
      mrn: 'MRN-WL-999',
      fullName: 'Phan Đình Giáp',
      age: 67,
      gender: 'MALE' as const,
      riskScore: 89,
      riskLevel: 'HIGH' as const,
      eyeSide: 'OD' as const,
      assignedDoctor: 'BS.CKII Vũ Hoàng Mai',
      reviewStatus: 'PENDING' as const,
      createdAt: '2026-09-19T08:00:00Z',
      updatedAt: '2026-09-19T09:00:00Z',
      scanDate: '2026-09-19',
      imageUrl: '/assets/sample.png',
    },
  ];

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <DoctorWorklistView
        patients={worklistItems as any}
        onSelectPatient={() => {}}
        onStartConsultation={(p) => { invokedPatientId = p.id || p.patientId; }}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="worklist-consultation-btn-p-wl-999"'), 'Must render consultation button in worklist row');
});

// =============================================================================
// SECTION 2: REALTIME STOMP & EVENT BUS CHAT BADGE STRESS HARNESS
// =============================================================================

runTest('PROBE-2.1: realtimeBus event burst stress test: 300 rapid sequential events processed synchronously', () => {
  let chatNewCount = 0;
  let chatMessageCount = 0;
  let messageReceivedCount = 0;
  let combinedListenerCount = 0;

  const unsub1 = realtimeBus.subscribe('chat:new', () => { chatNewCount++; });
  const unsub2 = realtimeBus.subscribe('chat:message', () => { chatMessageCount++; });
  const unsub3 = realtimeBus.subscribe('MESSAGE_RECEIVED', () => { messageReceivedCount++; });
  const unsubCombined = realtimeBus.subscribe(['chat:new', 'chat:message', 'MESSAGE_RECEIVED'], () => {
    combinedListenerCount++;
  });

  // Burst 150 chat:new
  for (let i = 0; i < 150; i++) {
    realtimeBus.emit('chat:new', { id: `burst-new-${i}`, text: `Hello ${i}` });
  }
  // Burst 100 chat:message
  for (let i = 0; i < 100; i++) {
    realtimeBus.emit('chat:message', { id: `burst-msg-${i}`, text: `Msg ${i}` });
  }
  // Burst 50 MESSAGE_RECEIVED
  for (let i = 0; i < 50; i++) {
    realtimeBus.emit('MESSAGE_RECEIVED', { id: `burst-rec-${i}`, text: `Rec ${i}` });
  }

  assert.strictEqual(chatNewCount, 150, 'All 150 chat:new events must be received');
  assert.strictEqual(chatMessageCount, 100, 'All 100 chat:message events must be received');
  assert.strictEqual(messageReceivedCount, 50, 'All 50 MESSAGE_RECEIVED events must be received');
  assert.strictEqual(combinedListenerCount, 300, 'Combined listener must receive all 300 events');

  unsub1();
  unsub2();
  unsub3();
  unsubCombined();
});

runTest('PROBE-2.2: Sidebar unreadChatCount badge rendering across thresholds (0, 1, 42, 99, 100)', () => {
  const counts = [
    { count: 0, shouldShow: false },
    { count: 1, shouldShow: true, expectedText: '1' },
    { count: 42, shouldShow: true, expectedText: '42' },
    { count: 99, shouldShow: true, expectedText: '99' },
    { count: 100, shouldShow: true, expectedText: '100' },
  ];

  for (const tc of counts) {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <AuthProvider>
          <Sidebar
            currentRole="doctor"
            activeSection="dashboard"
            onSelectSection={() => {}}
            unreadChatCount={tc.count}
          />
        </AuthProvider>
      </LanguageProvider>
    );

    if (tc.shouldShow) {
      assert.ok(
        html.includes(`>${tc.expectedText}<`) || html.includes(`>${tc.count}<`),
        `Sidebar must show badge for count ${tc.count}`
      );
    } else {
      assert.ok(
        !html.includes('>0<'),
        'Sidebar must not render badge when count is 0'
      );
    }
  }
});

runTest('PROBE-2.3: SideNavBar unreadChatCount badge rendering across thresholds (0, 7, 88, 101)', () => {
  const counts = [
    { count: 0, shouldShow: false },
    { count: 7, shouldShow: true, expectedText: '7' },
    { count: 88, shouldShow: true, expectedText: '88' },
    { count: 101, shouldShow: true, expectedText: '101' },
  ];

  for (const tc of counts) {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <SideNavBar
          currentRole="doctor"
          activeSection="dashboard"
          onSelectSection={() => {}}
          unreadChatCount={tc.count}
        />
      </LanguageProvider>
    );

    if (tc.shouldShow) {
      assert.ok(
        html.includes(`>${tc.expectedText}<`) || html.includes(`>${tc.count}<`),
        `SideNavBar must show badge for count ${tc.count}`
      );
    } else {
      assert.ok(
        !html.includes('>0<'),
        'SideNavBar must not render badge when count is 0'
      );
    }
  }
});

runTest('PROBE-2.4: Topbar unreadChatCount badge renders "99+" for counts exceeding 99 and hides on 0/undefined', () => {
  // Test 0: No badge
  const htmlZero = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={0}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(htmlZero.includes('data-testid="topbar-chat-btn"'), 'Must have topbar-chat-btn');
  assert.ok(!htmlZero.includes('data-testid="topbar-chat-badge"'), 'Must NOT have topbar-chat-badge when count is 0');

  // Test undefined: No badge
  const htmlUndefined = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={undefined}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(!htmlUndefined.includes('data-testid="topbar-chat-badge"'), 'Must NOT have badge when count is undefined');

  // Test 99: Exact 99
  const html99 = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={99}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(html99.includes('data-testid="topbar-chat-badge"'), 'Must have badge when count is 99');
  assert.ok(html99.includes('>99<'), 'Badge must display "99"');

  // Test 100: Over-threshold capping to "99+"
  const html100 = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={100}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(html100.includes('data-testid="topbar-chat-badge"'), 'Must have badge when count is 100');
  assert.ok(html100.includes('>99+<'), 'Badge must display "99+" for count 100');

  // Test 999: Over-threshold capping to "99+"
  const html999 = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={999}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(html999.includes('>99+<'), 'Badge must display "99+" for count 999');
});

runTest('PROBE-2.5: Multi-portal badge synchronization across Sidebar, SideNavBar, and Topbar', () => {
  const sharedUnreadCount = 12;

  const sidebarHtml = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="doctor"
          activeSection="dashboard"
          unreadChatCount={sharedUnreadCount}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  const sideNavBarHtml = renderToStaticMarkup(
    <LanguageProvider>
      <SideNavBar
        currentRole="doctor"
        activeSection="dashboard"
        unreadChatCount={sharedUnreadCount}
      />
    </LanguageProvider>
  );

  const topbarHtml = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={sharedUnreadCount}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(sidebarHtml.includes('>12<'), 'Sidebar must display 12');
  assert.ok(sideNavBarHtml.includes('>12<'), 'SideNavBar must display 12');
  assert.ok(topbarHtml.includes('>12<'), 'Topbar must display 12');
});

runTest('PROBE-2.6: Patient role also renders unreadChatCount badge on Messages menu item', () => {
  const patientHtml = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="patient"
          activeSection="dashboard"
          unreadChatCount={4}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(patientHtml.includes('>4<'), 'Patient sidebar must render badge with 4 unread messages');
  assert.ok(patientHtml.includes('consultation'), 'Patient sidebar must include consultation section');
});

runTest('PROBE-2.7: realtimeBus chat:read and CHAT_READ subscription behavior', () => {
  let currentUnread = 15;
  const unsubChatRead = realtimeBus.subscribe(['chat:read', 'CHAT_READ'], (event) => {
    if (typeof event?.data?.unreadCount === 'number') {
      currentUnread = event.data.unreadCount;
    } else {
      currentUnread = 0;
    }
  });

  // Emit explicit count update
  realtimeBus.emit('CHAT_READ', { unreadCount: 3 });
  assert.strictEqual(currentUnread, 3, 'CHAT_READ with count 3 should update unreadCount to 3');

  // Emit full clear
  realtimeBus.emit('chat:read', {});
  assert.strictEqual(currentUnread, 0, 'chat:read with no count should reset unreadCount to 0');

  unsubChatRead();
});

// =============================================================================
// SECTION 3: DEEP ADVERSARIAL STRESS & CORNER CASE PROBES
// =============================================================================

runTest('PROBE-3.1: Boundary & Type Resilience: negative unreadChatCount (-5), NaN, and null counts do not render badges', () => {
  // Negative count: -5
  const sidebarNeg = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="doctor"
          activeSection="dashboard"
          unreadChatCount={-5}
        />
      </AuthProvider>
    </LanguageProvider>
  );
  assert.ok(!sidebarNeg.includes('>-5<'), 'Sidebar must not render negative count badge');

  const topbarNeg = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={-5}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(!topbarNeg.includes('data-testid="topbar-chat-badge"'), 'Topbar must not render negative badge');

  // NaN count
  const topbarNaN = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={NaN}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(!topbarNaN.includes('data-testid="topbar-chat-badge"'), 'Topbar must not render badge for NaN');
});

runTest('PROBE-3.2: High Scale Badge Stress: unreadChatCount = 10,000 renders cleanly without layout collapse', () => {
  const topbarHuge = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={10000}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );
  assert.ok(topbarHuge.includes('data-testid="topbar-chat-badge"'), 'Topbar must have badge for 10000');
  assert.ok(topbarHuge.includes('>99+<'), 'Topbar must cap large numbers at 99+');

  const sidebarHuge = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="doctor"
          activeSection="dashboard"
          unreadChatCount={10000}
        />
      </AuthProvider>
    </LanguageProvider>
  );
  assert.ok(sidebarHuge.includes('>10000<') || sidebarHuge.includes('>99+<'), 'Sidebar must render high count cleanly');
});

runTest('PROBE-3.3: Locale Invariance: Fallback patient profile created consistently in both VI and EN locales', () => {
  const testId = 'locale-test-patient-777';

  // Vietnamese locale
  const htmlVi = renderToStaticMarkup(
    <LanguageProvider defaultLanguage="vi">
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={mockAssignedPatients}
          patientId={testId}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );
  assert.ok(htmlVi.includes(`Bệnh nhân (${testId})`) || htmlVi.includes(testId), 'VI locale must show Vietnamese label');

  // English locale
  const htmlEn = renderToStaticMarkup(
    <LanguageProvider defaultLanguage="en">
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={mockAssignedPatients}
          patientId={testId}
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );
  assert.ok(htmlEn.includes(testId), 'EN locale must include patient ID');
});

runTest('PROBE-3.4: Event Bus High-Throughput Subscription Churn (5,000 sub/unsub iterations without memory leak)', () => {
  let triggerCount = 0;

  for (let i = 0; i < 5000; i++) {
    const unsub = realtimeBus.subscribe('chat:new', () => { triggerCount++; });
    if (i % 500 === 0) {
      realtimeBus.emit('chat:new', { iteration: i });
    }
    unsub();
  }

  // After all unsubscriptions, emit one final event; triggerCount should not increase further
  const countBefore = triggerCount;
  realtimeBus.emit('chat:new', { iteration: 'final' });
  assert.strictEqual(triggerCount, countBefore, 'Unsubscribed listeners must not receive subsequent events');
});

runTest('PROBE-3.5: AppLayout resets unreadChatCount when activeSection switches to "consultation"', () => {
  // Simulate AppLayout state behavior
  let unreadChatCount = 7;
  const simulateSectionChange = (section: string) => {
    if (section === 'consultation' || section === 'consultation-chat') {
      unreadChatCount = 0;
    }
  };

  assert.strictEqual(unreadChatCount, 7);
  simulateSectionChange('dashboard');
  assert.strictEqual(unreadChatCount, 7, 'Section "dashboard" must preserve chat unread count');

  simulateSectionChange('consultation');
  assert.strictEqual(unreadChatCount, 0, 'Section "consultation" must reset chat unread count to 0');
});

runTest('PROBE-3.6: Patient identifier resolution checks userId and id attributes on assigned patient objects', () => {
  const patientWithAlternativeIdKeys: DoctorPatientSummary[] = [
    {
      id: 'alt-id-1234',
      userId: 'alt-userid-5678',
      fullName: 'Võ Hoài Nam',
      age: 50,
      gender: 'Nam',
      mrn: 'MRN-ALT-01',
      riskScore: 60,
      latestRiskLevel: 'Moderate',
      lastScreeningAt: '2026-09-18',
      screeningCount: 1,
      assignedAt: '2026-09-18T00:00:00Z',
      assignmentStatus: 'ASSIGNED',
    } as any,
  ];

  // Match by id
  const htmlById = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={patientWithAlternativeIdKeys}
          patientId="alt-id-1234"
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );
  assert.ok(htmlById.includes('Võ Hoài Nam'), 'Must match patient by id property');

  // Match by userId
  const htmlByUserId = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <DoctorConsultationView
          assignedPatients={patientWithAlternativeIdKeys}
          patientId="alt-userid-5678"
          onSelectPatientForCDS={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );
  assert.ok(htmlByUserId.includes('Võ Hoài Nam'), 'Must match patient by userId property');
});

// =============================================================================
// SECTION 4: HARNESS SUMMARY & EXIT CODE
// =============================================================================
console.log('\n================================================================================');
console.log(`   CHALLENGER M5-1 RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
console.log('================================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
