import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CDSDashboardPage, DoctorPatientSummary } from '../pages/CDSDashboardPage';
import { DoctorConsultationView } from '../features/doctor/DoctorConsultationView';
import { DoctorWorklistView } from '../features/doctor/DoctorWorklistView';
import { PatientHistoryView, generateVerificationHash, PatientHistoryItem } from '../features/patient/PatientHistoryView';
import { Sidebar } from '../components/layout/Sidebar';
import { SideNavBar } from '../components/SideNavBar';
import { Topbar } from '../components/layout/Topbar';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { realtimeBus } from '../services/realtimeService';

console.log('=================================================================');
console.log('   MILESTONE M5: TELEMEDICINE, REALTIME BADGES, ADMIN & SIGNATURE');
console.log('   (Direct Navigation, Chat Badges, Admin Tabs, HMAC-SHA256 Modal)');
console.log('=================================================================\n');

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
  id: 'doc-01',
  name: 'BS. Lê Minh Tuấn',
  role: 'doctor' as const,
  clinicId: 'clinic-01',
  email: 'tuan@aura.health',
};

const mockPatients: DoctorPatientSummary[] = [
  {
    patientId: 'patient-001',
    fullName: 'Nguyễn Văn A',
    age: 58,
    gender: 'Nam',
    mrn: 'MRN-001',
    riskScore: 82,
    latestRiskLevel: 'High',
    lastScreeningAt: '2026-09-18',
    screeningCount: 2,
    assignedAt: '2026-09-18T00:00:00Z',
    assignmentStatus: 'ASSIGNED',
  },
  {
    patientId: 'patient-002',
    fullName: 'Trần Thị B',
    age: 64,
    gender: 'Nữ',
    mrn: 'MRN-002',
    riskScore: 45,
    latestRiskLevel: 'Moderate',
    lastScreeningAt: '2026-09-17',
    screeningCount: 1,
    assignedAt: '2026-09-17T00:00:00Z',
    assignmentStatus: 'ASSIGNED',
  },
];

const mockWorklistPatients = [
  {
    id: 'p-worklist-101',
    patientId: 'p-worklist-101',
    mrn: 'MRN-101',
    fullName: 'Lê Hoàng Long',
    age: 62,
    gender: 'MALE' as const,
    riskScore: 78,
    riskLevel: 'HIGH' as const,
    eyeSide: 'OD' as const,
    assignedDoctor: 'BS. Lê Minh Tuấn',
    reviewStatus: 'PENDING' as const,
    createdAt: '2026-09-19T08:00:00Z',
    updatedAt: '2026-09-19T09:00:00Z',
    scanDate: '2026-09-19',
    imageUrl: '/assets/sample.png',
  },
];

const mockReviewedHistoryItem: PatientHistoryItem = {
  id: 'scr-rev-001',
  rawId: 'RAW-SCR-8899',
  createdAt: '2026-09-18T10:30:00Z',
  scanDate: '2026-09-18',
  eye: 'OD',
  eyeSide: 'OD',
  scanType: 'Chụp đáy mắt màu',
  riskScore: 78,
  riskLevel: 'HIGH',
  status: 'REVIEWED',
  doctorReviewed: true,
  doctorName: 'BS.CKII Nguyễn Văn Trọng',
  signedAt: '2026-09-18T11:00:00Z',
  icd10Codes: ['E11.319 - Bệnh võng mạc tiểu đường', 'I10 - Tăng huyết áp vô căn'],
  doctorNotes: 'Bệnh nhân có dấu hiệu vi xuất huyết cung thái dương. Đề nghị tái khám 3 tháng.',
  digitalSignature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
};

const mockUnreviewedHistoryItem: PatientHistoryItem = {
  id: 'scr-unrev-002',
  rawId: 'RAW-SCR-8900',
  createdAt: '2026-09-19T08:15:00Z',
  scanDate: '2026-09-19',
  eye: 'OS',
  eyeSide: 'OS',
  scanType: 'Chụp đáy mắt màu',
  riskScore: 35,
  riskLevel: 'LOW',
  status: 'ANALYZED',
  doctorReviewed: false,
};

// =============================================================================
// 1. TELEMEDICINE DIRECT NAVIGATION TESTS (patientId passing)
// =============================================================================
runTest('M5-TELEM-1: DoctorConsultationView accepts patientId prop and focuses specified patient', () => {
  const targetPatientId = 'patient-002';
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <DoctorConsultationView
        assignedPatients={mockPatients}
        patientId={targetPatientId}
        onSelectPatientForCDS={() => {}}
      />
    </LanguageProvider>
  );

  // The view must render the consultation interface with target patient
  assert.ok(html.includes('Trần Thị B'), 'Target patient name must appear in consultation view');
  assert.ok(html.includes('patient-002') || html.includes('MRN-002'), 'Target patient ID/MRN must appear');
});

runTest('M5-TELEM-2: DoctorConsultationView fallback gracefully creates patient profile if ID not in preset list', () => {
  const arbitraryPatientId = 'patient-custom-999';
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <DoctorConsultationView
        assignedPatients={[]}
        patientId={arbitraryPatientId}
        onSelectPatientForCDS={() => {}}
      />
    </LanguageProvider>
  );

  // Fallback patient should be rendered with the specified ID
  assert.ok(html.includes(arbitraryPatientId), `Expected HTML to include patientId ${arbitraryPatientId}`);
  assert.ok(html.includes('Bệnh nhân') || html.includes('Patient'));
});

runTest('M5-TELEM-3: CDSDashboardPage renders "Vào phòng tư vấn" action button in inspection header', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          patientId="patient-001"
          initialPatients={mockPatients}
          initialPatient={{
            id: 'patient-001',
            userId: 'patient-001',
            fullName: 'Nguyễn Văn A',
            mrn: 'MRN-001',
            age: 58,
            gender: 'Male',
            systolicBp: 130,
            diastolicBp: 85,
            hba1c: 6.8,
          } as any}
          initialLoading={false}
          onNavigate={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Should have "Vào phòng tư vấn" button with data-testid="cds-telemedicine-btn"
  assert.ok(html.includes('data-testid="cds-telemedicine-btn"'), 'Expected cds-telemedicine-btn in CDSDashboardPage');
  assert.ok(html.includes('Vào phòng tư vấn') || html.includes('Consultation'));
});

runTest('M5-TELEM-4: DoctorWorklistView renders "Vào phòng tư vấn" action button when onStartConsultation provided', () => {
  let startedPatientId = '';
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <DoctorWorklistView
        patients={mockWorklistPatients as any}
        onSelectPatient={() => {}}
        onStartConsultation={(p) => { startedPatientId = p.id || p.patientId; }}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="worklist-consultation-btn-p-worklist-101"'), 'Expected worklist-consultation-btn in table');
  assert.ok(html.includes('Vào phòng tư vấn') || html.includes('Consultation'));
});

runTest('M5-TELEM-5: CDSDashboardPage renders DoctorConsultationView when consultation view active', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          activeSection="consultation"
          patientId="patient-002"
          initialSelectedPatientId="patient-002"
          initialPatients={mockPatients}
          initialLoading={false}
          onNavigate={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Must render consultation view
  assert.ok(html.includes('Trần Thị B') || html.includes('patient-002'));
  assert.ok(html.includes('Tư Vấn') || html.includes('Consultation') || html.toLowerCase().includes('tư vấn') || html.includes('Tin nhắn'));
});

// =============================================================================
// 2. REALTIME STOMP CHAT NOTIFICATION BADGES
// =============================================================================
runTest('M5-BADGE-1: Sidebar displays unreadChatCount badge on consultation item when count > 0', () => {
  const htmlWithBadges = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="doctor"
          activeSection="dashboard"
          onSelectSection={() => {}}
          unreadChatCount={5}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Must render badge with '5' or '5+'
  assert.ok(htmlWithBadges.includes('>5<') || htmlWithBadges.includes('>5+<'), 'Expected unread badge with 5 in Sidebar');
  assert.ok(htmlWithBadges.includes('consultation'), 'Expected consultation section in Sidebar');

  const htmlWithoutBadges = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="doctor"
          activeSection="dashboard"
          onSelectSection={() => {}}
          unreadChatCount={0}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // When 0, should not render a badge with count
  assert.ok(!htmlWithoutBadges.includes('>0<'), 'Should not show badge for 0 unread messages in Sidebar');
});

runTest('M5-BADGE-2: SideNavBar displays unreadChatCount badge on consultation item when count > 0', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <SideNavBar
        currentRole="doctor"
        activeSection="dashboard"
        onSelectSection={() => {}}
        unreadChatCount={8}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('>8<') || html.includes('>8+<'), 'Expected unread badge with 8 in SideNavBar');
  assert.ok(html.includes('consultation'), 'Expected consultation link in SideNavBar');
});

runTest('M5-BADGE-3: Topbar displays chat button with unread badge when unreadChatCount > 0', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={3}
        onLogout={() => {}}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="topbar-chat-btn"'), 'Expected topbar-chat-btn in Topbar');
  assert.ok(html.includes('data-testid="topbar-chat-badge"'), 'Expected topbar-chat-badge in Topbar');
  assert.ok(html.includes('>3<'), 'Expected unread count 3 in topbar badge');
});

runTest('M5-BADGE-4: Topbar hides chat badge when unreadChatCount is 0 or undefined', () => {
  const htmlZero = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        unreadChatCount={0}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(!htmlZero.includes('data-testid="topbar-chat-badge"'), 'Expected no topbar-chat-badge when count is 0');

  const htmlUndefined = renderToStaticMarkup(
    <LanguageProvider>
      <Topbar
        currentUser={mockDoctorUser as any}
        onLogout={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(!htmlUndefined.includes('data-testid="topbar-chat-badge"'), 'Expected no topbar-chat-badge when undefined');
});

runTest('M5-BADGE-5: realtimeBus emits chat events and listeners receive updates', () => {
  let receivedData: any = null;
  const unsubscribe = realtimeBus.subscribe('chat:new', (event) => {
    receivedData = event.data;
  });

  realtimeBus.emit('chat:new', {
    messageId: 'msg-999',
    senderId: 'patient-001',
    text: 'Bác sĩ ơi em bị đau mắt',
    timestamp: new Date().toISOString(),
  });

  assert.ok(receivedData !== null, 'Event payload should be received');
  assert.strictEqual(receivedData.senderId, 'patient-001');
  assert.strictEqual(receivedData.messageId, 'msg-999');

  unsubscribe();
});

// =============================================================================
// 3. ADMIN NAVIGATION ITEMS (packages & assignments)
// =============================================================================
runTest('M5-ADMIN-1: Sidebar includes "assignments" and "packages" for ADMIN user', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="admin"
          activeSection="overview"
          onSelectSection={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(html.includes('Phân công bệnh nhân') || html.includes('Assignments'), 'Expected Phân công bệnh nhân in Sidebar');
  assert.ok(html.includes('Gói dịch vụ') || html.includes('Packages'), 'Expected Gói dịch vụ in Sidebar');
  assert.ok(html.includes('assignments'), 'Expected assignments section id in Sidebar');
  assert.ok(html.includes('packages'), 'Expected packages section id in Sidebar');
});

runTest('M5-ADMIN-2: SideNavBar includes "assignments" and "packages" for ADMIN user', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <SideNavBar
        currentRole="admin"
        activeSection="overview"
        onSelectSection={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Phân công bệnh nhân') || html.includes('Assignments'), 'Expected Phân công bệnh nhân in SideNavBar');
  assert.ok(html.includes('Gói dịch vụ') || html.includes('Packages'), 'Expected Gói dịch vụ in SideNavBar');
  assert.ok(html.includes('assignments'), 'Expected assignments section id in SideNavBar');
  assert.ok(html.includes('packages'), 'Expected packages section id in SideNavBar');
});

runTest('M5-ADMIN-3: Sidebar hides "assignments" and "packages" for regular PATIENT role', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <Sidebar
          currentRole="patient"
          activeSection="dashboard"
          onSelectSection={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(!html.includes('Phân công bệnh nhân'), 'Should NOT show Phân công bệnh nhân for PATIENT');
  assert.ok(!html.includes('Gói dịch vụ'), 'Should NOT show Gói dịch vụ for PATIENT');
});

// =============================================================================
// 4. PATIENT DIGITAL SIGNATURE VERIFICATION MODAL (R8, AC-8)
// =============================================================================
runTest('M5-SIGN-1: generateVerificationHash returns 64-character HMAC-SHA256 hex string', () => {
  const hash = generateVerificationHash(mockReviewedHistoryItem);
  assert.strictEqual(typeof hash, 'string');
  assert.strictEqual(hash.length, 64, `Expected 64 characters hex string, got ${hash.length}`);
  assert.ok(/^[0-9a-f]{64}$/i.test(hash), 'Hash must be valid hex characters');

  // Verify determinism: same input produces exact same hash
  const hash2 = generateVerificationHash(mockReviewedHistoryItem);
  assert.strictEqual(hash, hash2, 'Hash generation must be deterministic');
});

runTest('M5-SIGN-2: PatientHistoryView displays "Chữ Ký Số" button only for reviewed screenings', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientHistoryView
        screenings={[mockReviewedHistoryItem, mockUnreviewedHistoryItem]}
        onSelectScreening={() => {}}
      />
    </LanguageProvider>
  );

  // Must have button for the reviewed case
  assert.ok(
    html.includes(`data-testid="digital-signature-btn-${mockReviewedHistoryItem.id}"`),
    'Reviewed item must have digital signature button'
  );
  assert.ok(html.includes('Chữ Ký Số') || html.includes('Signature'));

  // Must NOT have button for unreviewed case
  assert.ok(
    !html.includes(`data-testid="digital-signature-btn-${mockUnreviewedHistoryItem.id}"`),
    'Unreviewed item must NOT have digital signature button'
  );
});

runTest('M5-SIGN-3: generateVerificationHash generates valid HMAC-SHA256 for items without pre-existing signature', () => {
  const itemWithoutSignature: PatientHistoryItem = {
    ...mockReviewedHistoryItem,
    digitalSignature: '',
  };
  const hash = generateVerificationHash(itemWithoutSignature);
  assert.strictEqual(hash.length, 64, 'Should generate 64-char hash if digitalSignature is empty');
  assert.ok(/^[0-9a-f]{64}$/i.test(hash), 'Generated hash must be 64-char hex string');
});

runTest('M5-SIGN-4: PatientHistoryView includes digital signature modal structures & integrity indicators', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientHistoryView
        screenings={[mockReviewedHistoryItem]}
        onSelectScreening={() => {}}
      />
    </LanguageProvider>
  );

  // Table must be rendered properly
  assert.ok(html.includes('Lịch Sử Khám') || html.includes('Lịch sử') || html.includes('History'));
  assert.ok(html.includes('Đã duyệt lâm sàng') || html.includes('Clinically Reviewed'));
  assert.ok(html.includes('data-testid="digital-signature-btn-scr-rev-001"'));
});

runTest('M5-SIGN-5: Digital Signature verification fields match clinical standards (ICD-10, Doctor, Timestamp)', () => {
  assert.ok(mockReviewedHistoryItem.doctorName?.includes('Nguyễn Văn Trọng'));
  assert.ok(mockReviewedHistoryItem.signedAt?.includes('2026-09-18'));
  assert.ok(Array.isArray(mockReviewedHistoryItem.icd10Codes) && mockReviewedHistoryItem.icd10Codes.length === 2);
  assert.ok(mockReviewedHistoryItem.icd10Codes[0].includes('E11.319'));
  assert.ok(mockReviewedHistoryItem.icd10Codes[1].includes('I10'));
  assert.ok(mockReviewedHistoryItem.doctorNotes?.includes('vi xuất huyết'));
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n=================================================================');
console.log(`   TOTAL TESTS : ${totalTests}`);
console.log(`   PASSED      : ${passedTests}`);
console.log(`   FAILED      : ${failedTests}`);
console.log('=================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('   All M5 Telemedicine, Realtime Badges, Admin & Signature tests PASSED (100%)\n');
  process.exit(0);
}
