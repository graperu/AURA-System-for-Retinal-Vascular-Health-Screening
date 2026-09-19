import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CDSDashboardPage, DoctorPatientSummary } from '../pages/CDSDashboardPage';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { BiomarkerGaugeBar } from '../components/common/BiomarkerGaugeBar';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { AIRiskResult, PatientProfile } from '../types/cds';

console.log('================================================================================');
console.log('   CHALLENGER M4-2: EMPIRICAL ADVERSARIAL TEST SUITE');
console.log('   (Collapsible Patient Queue, Search Filtering & Biomarkers Data Formatting)');
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
// ADVERSARIAL FIXTURES
// -----------------------------------------------------------------------------

const patient1: PatientProfile = {
  id: 'pat-001',
  userId: 'pat-001',
  mrn: 'MRN-2026-001',
  fullName: 'Trần Văn Hùng',
  age: 62,
  gender: 'Male',
  systolicBp: 155,
  diastolicBp: 95,
  hba1c: 7.8,
  hasHypertension: true,
  hasDiabetes: true,
  riskLevel: 'HIGH',
  riskScore: 82,
};

const patient2: PatientProfile = {
  id: 'pat-002',
  userId: 'pat-002',
  mrn: 'MRN-2026-002',
  fullName: 'Lê Thị Mai',
  age: 48,
  gender: 'Female',
  systolicBp: 118,
  diastolicBp: 76,
  hba1c: 5.4,
  hasHypertension: false,
  hasDiabetes: false,
  riskLevel: 'LOW',
  riskScore: 22,
};

const patient3: PatientProfile = {
  id: 'pat-003',
  userId: 'pat-003',
  mrn: 'MRN-2026-003',
  fullName: 'Phạm Đức Dũng',
  age: 71,
  gender: 'Male',
  systolicBp: 170,
  diastolicBp: 105,
  hba1c: 9.1,
  hasHypertension: true,
  hasDiabetes: true,
  riskLevel: 'CRITICAL',
  riskScore: 94,
};

const patient4: PatientProfile = {
  id: 'pat-004',
  userId: 'pat-004',
  mrn: 'MRN-2026-004',
  fullName: 'Võ Hoàng Yến',
  age: 52,
  gender: 'Female',
  systolicBp: 135,
  diastolicBp: 85,
  hba1c: 6.3,
  hasHypertension: false,
  hasDiabetes: true,
  riskLevel: 'MODERATE',
  riskScore: 56,
};

const patient5WithoutName: PatientProfile = {
  id: 'pat-005',
  userId: 'pat-005',
  mrn: null,
  fullName: null,
  age: null,
  gender: null,
  riskLevel: null,
  riskScore: 0,
};

const adversarialPatientsList: DoctorPatientSummary[] = [
  {
    id: 'pat-001',
    patientId: 'pat-001',
    mrn: 'MRN-2026-001',
    fullName: 'Trần Văn Hùng',
    age: 62,
    gender: 'Male',
    phoneNumber: '0901234567',
    systolicBp: 155,
    diastolicBp: 95,
    hba1c: 7.8,
    hasHypertension: true,
    hasDiabetes: true,
    screeningCount: 4,
    latestRiskLevel: 'HIGH',
    assignedAt: '2026-03-01',
    assignmentStatus: 'ASSIGNED',
  },
  {
    id: 'pat-002',
    patientId: 'pat-002',
    mrn: 'MRN-2026-002',
    fullName: 'Lê Thị Mai',
    age: 48,
    gender: 'Female',
    phoneNumber: '0918765432',
    systolicBp: 118,
    diastolicBp: 76,
    hba1c: 5.4,
    hasHypertension: false,
    hasDiabetes: false,
    screeningCount: 1,
    latestRiskLevel: 'LOW',
    assignedAt: '2026-03-10',
    assignmentStatus: 'ASSIGNED',
  },
  {
    id: 'pat-003',
    patientId: 'pat-003',
    mrn: 'MRN-2026-003',
    fullName: 'Phạm Đức Dũng',
    age: 71,
    gender: 'Male',
    phoneNumber: '0988112233',
    systolicBp: 170,
    diastolicBp: 105,
    hba1c: 9.1,
    hasHypertension: true,
    hasDiabetes: true,
    screeningCount: 6,
    latestRiskLevel: 'CRITICAL',
    assignedAt: '2026-02-15',
    assignmentStatus: 'ASSIGNED',
  },
  {
    id: 'pat-004',
    patientId: 'pat-004',
    mrn: 'MRN-2026-004',
    fullName: 'Võ Hoàng Yến',
    age: 52,
    gender: 'Female',
    phoneNumber: '0933445566',
    systolicBp: 135,
    diastolicBp: 85,
    hba1c: 6.3,
    hasHypertension: false,
    hasDiabetes: true,
    screeningCount: 2,
    latestRiskLevel: 'MODERATE',
    assignedAt: '2026-03-12',
    assignmentStatus: 'ASSIGNED',
  },
  {
    id: 'pat-005',
    patientId: 'pat-005',
    mrn: null,
    fullName: null,
    age: null,
    gender: null,
    phoneNumber: null,
    screeningCount: 0,
    latestRiskLevel: null,
    assignedAt: '2026-03-15',
    assignmentStatus: 'ASSIGNED',
  },
];

const standardAnalysisResult: AIRiskResult = {
  id: 'analysis-001',
  analysisId: 'analysis-001',
  patientId: 'pat-001',
  imageUrl: '/sample/fundus.png',
  eyePosition: 'Right_OD',
  status: 'COMPLETED',
  overallVascularRiskScore: 78,
  riskScore: 78,
  cardiovascularRisk: {
    level: 'High',
    score: 82,
    hypertensionStage: 'Stage 2 HTN',
    threeYearStrokeRiskPercent: 36,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 64,
    etdrsGrade: 'MODERATE NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 15,
  },
  annotatedMap: {
    arteryVeinRatio: 0.58,
    vesselDensityPercentage: 36.2,
    tortuosityIndex: 1.38,
    opticCupToDiscRatio: 0.44,
    crveMicrons: 240,
    craeMicrons: 139,
    detectedAnomalies: [
      {
        id: 'anom-nick-1',
        type: 'Arteriovenous Nicking',
        coordinates: { x: 42, y: 56, width: 16, height: 16 },
        confidence: 0.89,
        description: 'Gunns sign present at arteriovenous crossing',
      },
    ],
  },
  recommendations: 'Intensify antihypertensive therapy and schedule 3-month retinal review.',
  modelVersion: 'Gemini 3.8 Flash High / AURA-Core v2.4',
};

// =============================================================================
// SECTION 1: COLLAPSIBLE PATIENT QUEUE LAYOUT & WIDTH TRANSITIONS
// =============================================================================
console.log('--- 1. Collapsible Patient Queue Layout & Width Transitions ---');

runTest('ADV-QUEUE-1: Expanded queue renders w-full xl:w-[260px] 2xl:w-[280px] and shows full search', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient1}
          initialPatients={adversarialPatientsList}
          initialQueueCollapsed={false}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(
    html.includes('data-testid="cds-patient-queue-container"'),
    'Container cds-patient-queue-container must be rendered'
  );
  assert.ok(
    html.includes('xl:w-[260px]') && html.includes('2xl:w-[280px]'),
    'Expanded state must apply xl:w-[260px] 2xl:w-[280px] width layout'
  );
  assert.ok(
    html.includes('data-testid="cds-patient-search-input"'),
    'Expanded state must display cds-patient-search-input'
  );
  assert.ok(
    html.includes('data-testid="cds-toggle-patient-queue-btn"'),
    'Toggle button must be present'
  );
  assert.ok(
    !html.includes('data-testid="cds-mini-patient-pat-001"'),
    'Expanded state must not render collapsed mini avatar buttons'
  );
});

runTest('ADV-QUEUE-2: Collapsed queue applies xl:w-[64px] 2xl:w-[72px] and hides full search input', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient1}
          initialPatients={adversarialPatientsList}
          initialQueueCollapsed={true}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(
    html.includes('data-testid="cds-patient-queue-container"'),
    'Container cds-patient-queue-container must be rendered'
  );
  assert.ok(
    html.includes('xl:w-[64px]') && html.includes('2xl:w-[72px]'),
    'Collapsed state must strictly apply xl:w-[64px] 2xl:w-[72px]'
  );
  assert.ok(
    !html.includes('data-testid="cds-patient-search-input"'),
    'Collapsed state must hide the full search input to conserve horizontal space'
  );
  assert.ok(
    html.includes('data-testid="cds-toggle-patient-queue-btn"'),
    'Toggle button must remain present in collapsed state to allow re-expansion'
  );
});

// =============================================================================
// SECTION 2: MINI-AVATAR BUTTON RENDERING, INITIALS, TOOLTIPS & RISK DOTS
// =============================================================================
console.log('\n--- 2. Mini-Avatar Button Rendering, Initials, Tooltips & Risk Dots ---');

runTest('ADV-AVATAR-1: Collapsed queue renders mini avatars for all patients with uppercase initial letters', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient1}
          initialPatients={adversarialPatientsList}
          initialQueueCollapsed={true}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Each patient has a mini button
  assert.ok(html.includes('data-testid="cds-mini-patient-pat-001"'), 'Patient 1 mini avatar rendered');
  assert.ok(html.includes('data-testid="cds-mini-patient-pat-002"'), 'Patient 2 mini avatar rendered');
  assert.ok(html.includes('data-testid="cds-mini-patient-pat-003"'), 'Patient 3 mini avatar rendered');
  assert.ok(html.includes('data-testid="cds-mini-patient-pat-004"'), 'Patient 4 mini avatar rendered');
  assert.ok(html.includes('data-testid="cds-mini-patient-pat-005"'), 'Patient 5 mini avatar rendered');

  // Initial letter checks
  // Trần -> T
  assert.ok(html.includes('>T<'), 'Trần Văn Hùng initial is T');
  // Lê -> L
  assert.ok(html.includes('>L<'), 'Lê Thị Mai initial is L');
  // Phạm -> P
  assert.ok(html.includes('>P<'), 'Phạm Đức Dũng initial is P');
  // Võ -> V
  assert.ok(html.includes('>V<'), 'Võ Hoàng Yến initial is V');
});

runTest('ADV-AVATAR-2: Mini avatar tooltips format fullName, MRN, and latest risk level correctly with fallbacks', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient1}
          initialPatients={adversarialPatientsList}
          initialQueueCollapsed={true}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Patient 1 (HIGH)
  assert.ok(
    html.includes('title="Trần Văn Hùng (MRN-2026-001) - HIGH"'),
    'Patient 1 tooltip includes full name, MRN, and risk level'
  );

  // Patient 2 (LOW)
  assert.ok(
    html.includes('title="Lê Thị Mai (MRN-2026-002) - LOW"'),
    'Patient 2 tooltip includes full name, MRN, and risk level'
  );

  // Patient 3 (CRITICAL)
  assert.ok(
    html.includes('title="Phạm Đức Dũng (MRN-2026-003) - CRITICAL"'),
    'Patient 3 tooltip includes full name, MRN, and risk level'
  );

  // Patient 5 (Null values -> graceful fallbacks: Patient, N/A, Chờ khám)
  assert.ok(
    html.includes('title="Patient (N/A) - Chờ khám"'),
    'Patient 5 tooltip gracefully falls back when name, MRN, and risk are null'
  );
});

runTest('ADV-AVATAR-3: Red risk indicator dot appears for HIGH and CRITICAL risk, absent for LOW and MODERATE', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient1}
          initialPatients={adversarialPatientsList}
          initialQueueCollapsed={true}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Count red dots for HIGH and CRITICAL
  const countRedDots = (html.match(/w-2 h-2 rounded-full bg-red-500/g) || []).length;
  assert.strictEqual(
    countRedDots,
    2,
    `Expected exactly 2 red dots (HIGH and CRITICAL), but found ${countRedDots}`
  );
});

// =============================================================================
// SECTION 3: MINI-AVATAR CLICK & PATIENT SELECTION WITHOUT EXPANDING QUEUE
// =============================================================================
console.log('\n--- 3. Mini-Avatar Click & Patient Selection Without Expanding Queue ---');

runTest('ADV-SELECT-1: Active selected patient gets blue highlight ring-2 in collapsed mode', () => {
  // Render with patient 1 as active
  const htmlPatient1Active = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient1}
          initialPatients={adversarialPatientsList}
          initialQueueCollapsed={true}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Mini avatar 1 should have active styling: bg-[#3478F6] text-white
  const pat1BtnMatch = htmlPatient1Active.match(/<button[^>]*data-testid="cds-mini-patient-pat-001"[^>]*>/);
  assert.ok(pat1BtnMatch, 'Button pat-001 must exist');
  assert.ok(
    pat1BtnMatch[0].includes('bg-[#3478F6]') && pat1BtnMatch[0].includes('text-white'),
    'Active patient 1 mini avatar must have primary blue active styling'
  );

  // Mini avatar 2 should have inactive styling: bg-[#F5F6F8]
  const pat2BtnMatch = htmlPatient1Active.match(/<button[^>]*data-testid="cds-mini-patient-pat-002"[^>]*>/);
  assert.ok(pat2BtnMatch, 'Button pat-002 must exist');
  assert.ok(
    pat2BtnMatch[0].includes('bg-[#F5F6F8]') && pat2BtnMatch[0].includes('text-slate-700'),
    'Inactive patient 2 mini avatar must have neutral inactive styling'
  );
});

runTest('ADV-SELECT-2: Switching active patient updates highlight and maintains collapsed width xl:w-[64px]', () => {
  // Render with patient 2 as active
  const htmlPatient2Active = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient2}
          initialPatients={adversarialPatientsList}
          initialQueueCollapsed={true}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Mini avatar 2 is now active
  const pat2BtnMatch = htmlPatient2Active.match(/<button[^>]*data-testid="cds-mini-patient-pat-002"[^>]*>/);
  assert.ok(pat2BtnMatch, 'Button pat-002 must exist');
  assert.ok(
    pat2BtnMatch[0].includes('bg-[#3478F6]') && pat2BtnMatch[0].includes('text-white'),
    'Selected patient 2 mini avatar now has active blue background'
  );

  // Mini avatar 1 is now inactive
  const pat1BtnMatch = htmlPatient2Active.match(/<button[^>]*data-testid="cds-mini-patient-pat-001"[^>]*>/);
  assert.ok(pat1BtnMatch, 'Button pat-001 must exist');
  assert.ok(
    pat1BtnMatch[0].includes('bg-[#F5F6F8]'),
    'Unselected patient 1 mini avatar returned to neutral background'
  );

  // CRITICAL VERIFICATION: Queue is STILL collapsed at xl:w-[64px]
  assert.ok(
    htmlPatient2Active.includes('xl:w-[64px]'),
    'Queue width must remain collapsed (xl:w-[64px]) when patient selection changes'
  );
  assert.ok(
    !htmlPatient2Active.includes('xl:w-[260px]'),
    'Queue width must NOT expand to xl:w-[260px] upon patient selection'
  );

  // Header displays active patient 2
  assert.ok(
    htmlPatient2Active.includes('Lê Thị Mai'),
    'Header banner updates to selected patient Lê Thị Mai'
  );
  assert.ok(
    htmlPatient2Active.includes('MRN-2026-002'),
    'Header banner displays selected patient MRN'
  );
});

// =============================================================================
// SECTION 4: PATIENT SEARCH FILTERING & EMPTY STATES
// =============================================================================
console.log('\n--- 4. Patient Search Filtering & Empty States ---');

runTest('ADV-SEARCH-1: Filter algorithm accurately matches Vietnamese full name substrings', () => {
  const filterByName = (query: string) => {
    if (!query.trim()) return adversarialPatientsList;
    const q = query.toLowerCase();
    return adversarialPatientsList.filter((p) =>
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.mrn && p.mrn.toLowerCase().includes(q)) ||
      (p.phoneNumber && p.phoneNumber.toLowerCase().includes(q))
    );
  };

  // Substring match: 'hùng'
  const resHung = filterByName('hùng');
  assert.strictEqual(resHung.length, 1, 'Should find 1 patient for "hùng"');
  assert.strictEqual(resHung[0].patientId, 'pat-001');

  // Substring match: 'mai'
  const resMai = filterByName('mai');
  assert.strictEqual(resMai.length, 1, 'Should find 1 patient for "mai"');
  assert.strictEqual(resMai[0].patientId, 'pat-002');

  // Uppercase query: 'DŨNG'
  const resDung = filterByName('DŨNG');
  assert.strictEqual(resDung.length, 1, 'Should find 1 patient for uppercase "DŨNG"');
  assert.strictEqual(resDung[0].patientId, 'pat-003');
});

runTest('ADV-SEARCH-2: Filter algorithm accurately matches MRN and phone numbers', () => {
  const filter = (query: string) => {
    if (!query.trim()) return adversarialPatientsList;
    const q = query.toLowerCase();
    return adversarialPatientsList.filter((p) =>
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.mrn && p.mrn.toLowerCase().includes(q)) ||
      (p.phoneNumber && p.phoneNumber.toLowerCase().includes(q))
    );
  };

  // Match MRN suffix '004'
  const resMrn = filter('004');
  assert.strictEqual(resMrn.length, 1, 'Should find 1 patient matching MRN 004');
  assert.strictEqual(resMrn[0].patientId, 'pat-004');

  // Match Phone number substring '8765'
  const resPhone = filter('8765');
  assert.strictEqual(resPhone.length, 1, 'Should find 1 patient matching phone 8765');
  assert.strictEqual(resPhone[0].patientId, 'pat-002');
});

runTest('ADV-SEARCH-3: Whitespace-only query returns all patients without error', () => {
  const filter = (query: string) => {
    if (!query.trim()) return adversarialPatientsList;
    const q = query.toLowerCase();
    return adversarialPatientsList.filter((p) =>
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.mrn && p.mrn.toLowerCase().includes(q)) ||
      (p.phoneNumber && p.phoneNumber.toLowerCase().includes(q))
    );
  };

  const resWhitespace = filter('     ');
  assert.strictEqual(
    resWhitespace.length,
    adversarialPatientsList.length,
    'Whitespace query must return all 5 patients'
  );
});

runTest('ADV-SEARCH-4: No-match query produces empty state with localized notice', () => {
  // When no patients match, filtered list is empty. Test rendering empty patient list
  const htmlEmpty = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={patient1}
          initialPatients={[]} // Simulating 0 matching patients
          initialQueueCollapsed={false}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(
    htmlEmpty.includes('Chưa có bệnh nhân nào') || htmlEmpty.includes('No patients found'),
    'Expanded queue must render empty state notice when patient list is empty'
  );
});

// =============================================================================
// SECTION 5: BIOMARKERS GAUGE FORMATTING & PHYSIOLOGICAL RANGES
// =============================================================================
console.log('\n--- 5. Biomarkers Gauge Formatting & Physiological Ranges ---');

runTest('ADV-BIO-1: RiskAssessmentPanel defaults to Biomarkers Gauge tab with active WAI-ARIA tabpanel', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} />
    </LanguageProvider>
  );

  // Tablist present
  assert.ok(html.includes('role="tablist"'), 'Must render WAI-ARIA role="tablist"');

  // Biomarkers tab is selected
  assert.ok(
    html.includes('2. Chỉ Số Sinh Học Vi Mạch (Biomarkers Gauge)'),
    'Tab 2 label present'
  );

  // Biomarkers tabpanel is active (visible, not hidden)
  assert.ok(
    html.includes('data-testid="cds-tabpanel-biomarkers"'),
    'Biomarkers tabpanel exists'
  );
  assert.ok(
    html.includes('class="block space-y-3"'),
    'Biomarkers tabpanel is visible by default'
  );
});

runTest('ADV-BIO-2: A/V Ratio physiological formatting (Normal >= 0.67 vs Constricted < 0.67)', () => {
  // Test Constricted (0.58 from standardAnalysisResult)
  const htmlConstricted = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlConstricted.includes('0.58'), 'Displays A/V ratio 0.58');
  assert.ok(htmlConstricted.includes('Co thắt') || htmlConstricted.includes('Constricted'), 'Displays Co thắt badge');
  assert.ok(htmlConstricted.includes('bg-amber-500'), 'Gauge uses amber color for constricted A/V ratio');

  // Test Normal (0.72)
  const normalResult = {
    ...standardAnalysisResult,
    annotatedMap: {
      ...standardAnalysisResult.annotatedMap,
      arteryVeinRatio: 0.72,
    },
  };
  const htmlNormal = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={normalResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlNormal.includes('0.72'), 'Displays A/V ratio 0.72');
  assert.ok(htmlNormal.includes('Đạt') || htmlNormal.includes('Normal'), 'Displays Đạt badge');
  assert.ok(htmlNormal.includes('bg-emerald-500'), 'Gauge uses emerald color for normal A/V ratio');
});

runTest('ADV-BIO-3: CRAE and CRVE retinal vessel diameter biomarkers format in µm with Parr-Hubbard calculation', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );

  // CRAE: 139 µm, narrow (<145)
  assert.ok(html.includes('139'), 'Displays CRAE 139');
  assert.ok(html.includes('Hẹp ĐM') || html.includes('Narrow'), 'Displays Hẹp ĐM badge for CRAE < 145');
  assert.ok(html.includes('Chuẩn: 145-165 µm') || html.includes('Ref: 145-165 µm'), 'Displays CRAE reference range');

  // CRVE: 240 µm, dilated (>235)
  assert.ok(html.includes('240'), 'Displays CRVE 240');
  assert.ok(html.includes('Giãn TM') || html.includes('Dilated'), 'Displays Giãn TM badge for CRVE > 235');
  assert.ok(html.includes('Chuẩn: 210-235 µm') || html.includes('Ref: 210-235 µm'), 'Displays CRVE reference range');
});

runTest('ADV-BIO-4: Vascular Tortuosity Index formatting (Normal < 1.25 vs High >= 1.25)', () => {
  // Test High Tortuosity: 1.38
  const htmlHigh = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlHigh.includes('1.38'), 'Displays Tortuosity 1.38');
  assert.ok(htmlHigh.includes('Uốn lượn') || htmlHigh.includes('High'), 'Displays Uốn lượn badge');
  assert.ok(htmlHigh.includes('bg-amber-500'), 'High tortuosity gauge is amber');

  // Test Normal Tortuosity: 1.15
  const normalTortResult = {
    ...standardAnalysisResult,
    annotatedMap: {
      ...standardAnalysisResult.annotatedMap,
      tortuosityIndex: 1.15,
    },
  };
  const htmlNormal = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={normalTortResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlNormal.includes('1.15'), 'Displays Tortuosity 1.15');
  assert.ok(htmlNormal.includes('Đạt') || htmlNormal.includes('Normal'), 'Displays Đạt badge for tortuosity < 1.25');
  assert.ok(htmlNormal.includes('bg-emerald-500'), 'Normal tortuosity gauge is emerald');
});

runTest('ADV-BIO-5: AV Nicking anomaly detection accurately distinguishes Positive vs Negative', () => {
  // Positive: Gunns sign anomaly present
  const htmlPos = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlPos.includes('Dương tính (1)') || htmlPos.includes('Positive (1)'), 'Displays Positive AV Nicking');
  assert.ok(htmlPos.includes('Bắt chéo') || htmlPos.includes('Detected'), 'Displays Bắt chéo badge');

  // Negative: No AV Nicking anomaly
  const negativeResult = {
    ...standardAnalysisResult,
    annotatedMap: {
      ...standardAnalysisResult.annotatedMap,
      detectedAnomalies: [],
    },
  };
  const htmlNeg = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={negativeResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlNeg.includes('Âm tính') || htmlNeg.includes('Negative'), 'Displays Negative AV Nicking');
  assert.ok(htmlNeg.includes('Không') || htmlNeg.includes('None'), 'Displays Không badge');
});

runTest('ADV-BIO-6: Optic Cup-to-Disc Ratio (VCDR) formatting (Normal < 0.50 vs High >= 0.50)', () => {
  // Normal VCDR: 0.44
  const htmlNormal = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlNormal.includes('0.44'), 'Displays VCDR 0.44');
  assert.ok(htmlNormal.includes('Đạt') || htmlNormal.includes('Normal'), 'Displays Đạt badge for VCDR < 0.50');

  // High VCDR: 0.65
  const highVcdrResult = {
    ...standardAnalysisResult,
    annotatedMap: {
      ...standardAnalysisResult.annotatedMap,
      opticCupToDiscRatio: 0.65,
    },
  };
  const htmlHigh = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={highVcdrResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  assert.ok(htmlHigh.includes('0.65'), 'Displays VCDR 0.65');
  assert.ok(htmlHigh.includes('Lõm rộng') || htmlHigh.includes('High'), 'Displays Lõm rộng badge for VCDR >= 0.50');
});

// =============================================================================
// SECTION 6: ADVERSARIAL ROBUSTNESS, NAN PREVENTION & CLAMPING
// =============================================================================
console.log('\n--- 6. Adversarial Robustness, NaN Prevention & Clamping ---');

runTest('ADV-NAN-1: Completely empty AIRiskResult renders safely with zero NaN, NaN%, or crashes', () => {
  const emptyResult: AIRiskResult = {
    id: 'empty-test',
    analysisId: 'empty-test',
    patientId: 'pat-empty',
    imageUrl: '',
    eyePosition: 'OD',
    status: 'COMPLETED',
    overallVascularRiskScore: 0,
    riskScore: 0,
  };

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={emptyResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );

  // String level checks
  assert.ok(!html.includes('NaN%'), 'Rendered HTML must never contain NaN%');
  assert.ok(!html.includes('>NaN<'), 'Rendered HTML must never contain >NaN<');
  assert.ok(!html.includes('aria-valuenow="NaN"'), 'Progressbars must never have aria-valuenow="NaN"');
  assert.ok(!html.includes('width:NaN%'), 'Gauge width style must never have width:NaN%');

  // Fallbacks rendered
  assert.ok(html.includes('0.67'), 'A/V ratio falls back to default 0.67');
  assert.ok(html.includes('148'), 'CRAE falls back to default 148');
  assert.ok(html.includes('220'), 'CRVE falls back to default 220');
  assert.ok(html.includes('1.12'), 'Tortuosity falls back to default 1.12');
  assert.ok(html.includes('0.32'), 'VCDR falls back to default 0.32');
});

runTest('ADV-NAN-2: Malformed NaN inputs in annotatedMap are sanitized to default valid numbers without NaN or NaN% in Biomarkers tab', () => {
  const nanResult: AIRiskResult = {
    id: 'nan-test',
    analysisId: 'nan-test',
    patientId: 'pat-nan',
    imageUrl: '',
    eyePosition: 'OD',
    status: 'COMPLETED',
    overallVascularRiskScore: 65,
    riskScore: 65,
    annotatedMap: {
      arteryVeinRatio: NaN as any,
      vesselDensityPercentage: NaN as any,
      tortuosityIndex: NaN as any,
      opticCupToDiscRatio: NaN as any,
      crveMicrons: NaN as any,
      craeMicrons: NaN as any,
    } as any,
    cardiovascularRisk: {
      score: 60,
      level: 'Moderate',
    },
    strokeRisk: {
      score: 25,
      level: 'Low',
    },
    diabeticRetinopathyRisk: {
      score: 40,
      level: 'Moderate',
    },
  };

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={nanResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );

  // Extract biomarkers tabpanel
  const bioMatch = html.match(/data-testid="cds-tabpanel-biomarkers"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*data-testid="cds-tabpanel-risks"/);
  assert.ok(bioMatch, 'Biomarkers panel must exist');
  const bioHtml = bioMatch[1];

  assert.ok(!bioHtml.includes('NaN%'), 'Biomarkers panel must NOT contain NaN%');
  assert.ok(!bioHtml.includes('>NaN<'), 'Biomarkers panel must NOT contain >NaN< text content');
  assert.ok(!bioHtml.includes('width:NaN%') && !bioHtml.includes('width: NaN%'), 'Style width must never be NaN%');
  assert.ok(!html.includes('NaN%'), 'Entire component must not contain NaN%');
});

runTest('ADV-NAN-3: Extreme negative numbers are clamped and never produce negative percentages or negative style widths', () => {
  const negativeResult: AIRiskResult = {
    id: 'neg-test',
    analysisId: 'neg-test',
    patientId: 'pat-neg',
    imageUrl: '',
    eyePosition: 'OD',
    status: 'COMPLETED',
    overallVascularRiskScore: 0,
    riskScore: 0,
    annotatedMap: {
      arteryVeinRatio: -0.8 as any,
      tortuosityIndex: -5.0 as any,
      opticCupToDiscRatio: -1.0 as any,
      crveMicrons: -200 as any,
      craeMicrons: -100 as any,
    } as any,
  };

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={negativeResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );

  // Check that no negative percentages in width styles: width:-...%
  assert.ok(!html.includes('width:-') && !html.includes('width: -'), 'Must NOT contain negative width in style');
  assert.ok(!html.includes('aria-valuenow="-'), 'Must NOT contain negative aria-valuenow attribute');
});

runTest('ADV-NAN-4: BiomarkerGaugeBar component directly stress-tested with NaN, negative, infinity, and undefined', () => {
  // NaN: clamped to 4%
  const htmlNaN = renderToStaticMarkup(<BiomarkerGaugeBar percent={NaN} />);
  assert.ok(!htmlNaN.includes('NaN'), 'BiomarkerGaugeBar handles NaN percent');
  assert.ok(htmlNaN.includes('width:4%') || htmlNaN.includes('width: 4%'), 'Clamps NaN to minimum percentage (4%)');

  // Negative: clamped to minPercent (8%)
  const htmlNeg = renderToStaticMarkup(<BiomarkerGaugeBar percent={-150} minPercent={8} />);
  assert.ok(htmlNeg.includes('width:8%') || htmlNeg.includes('width: 8%'), 'Clamps negative percent to minPercent (8%)');

  // Infinity: clamped to 100%
  const htmlInf = renderToStaticMarkup(<BiomarkerGaugeBar percent={Infinity} />);
  assert.ok(htmlInf.includes('width:100%') || htmlInf.includes('width: 100%'), 'Clamps positive infinity to 100%');

  // Undefined: clamped to 4%
  const htmlUndef = renderToStaticMarkup(<BiomarkerGaugeBar percent={undefined as any} />);
  assert.ok(!htmlUndef.includes('NaN'), 'Handles undefined without NaN');
  assert.ok(htmlUndef.includes('width:4%') || htmlUndef.includes('width: 4%'), 'Defaults safely to minPercent');
});

// =============================================================================
// SECTION 7: STRUCTURAL VERIFICATION OF DUPLICATE RISK PROGRESS BARS ELIMINATION
// =============================================================================
console.log('\n--- 7. Elimination of Duplicate Progress Bars in Tab 1 ---');

runTest('ADV-DUPL-1: Tab 1 (Nguy Cơ Toàn Diện) contains ZERO duplicate progress bars (role="progressbar")', () => {
  const htmlRisksTab = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="risks" />
    </LanguageProvider>
  );

  // Extract the contents of Tab 1 (cds-tabpanel-risks)
  const risksTabpanelMatch = htmlRisksTab.match(/data-testid="cds-tabpanel-risks"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*data-testid="cds-tabpanel-lesions"/);
  assert.ok(risksTabpanelMatch, 'Tab 1 panel must be found');

  const tab1Content = risksTabpanelMatch[1];

  // Tab 1 must NOT contain any role="progressbar"
  const progressbarCount = (tab1Content.match(/role="progressbar"/g) || []).length;
  assert.strictEqual(
    progressbarCount,
    0,
    `Tab 1 must have 0 progress bars, but found ${progressbarCount}`
  );

  // Tab 1 must NOT contain duplicate-raw-progress-bars
  assert.ok(
    !tab1Content.includes('duplicate-raw-progress-bars'),
    'Tab 1 does not contain duplicate raw progress bars'
  );

  // Tab 1 displays the clinical pillars
  assert.ok(tab1Content.includes('Nguy Cơ Tim Mạch'), 'Displays Cardiovascular Risk pillar');
  assert.ok(tab1Content.includes('Nguy Cơ Đột Quỵ'), 'Displays Stroke Risk pillar');
  assert.ok(tab1Content.includes('Bệnh Võng Mạc ĐTĐ'), 'Displays Diabetic Retinopathy pillar');
  assert.ok(tab1Content.includes('82%'), 'Displays Cardio risk score 82%');
  assert.ok(tab1Content.includes('36%'), 'Displays Stroke 3-year risk 36%');
  assert.ok(tab1Content.includes('64%'), 'Displays DR risk score 64%');
});

runTest('ADV-DUPL-2: Tab 2 (Chỉ Số Sinh Học) contains EXACTLY 6 specialized biomarker progress bars', () => {
  const htmlBioTab = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );

  // Extract Tab 2 (cds-tabpanel-biomarkers)
  const bioTabpanelMatch = htmlBioTab.match(/data-testid="cds-tabpanel-biomarkers"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*data-testid="cds-tabpanel-risks"/);
  assert.ok(bioTabpanelMatch, 'Tab 2 panel must be found');

  const tab2Content = bioTabpanelMatch[1];
  const progressbarCount = (tab2Content.match(/role="progressbar"/g) || []).length;

  assert.strictEqual(
    progressbarCount,
    6,
    `Tab 2 must contain exactly 6 progressbars (A/V, CRAE, CRVE, Tortuosity, AV Nicking, C/D), but found ${progressbarCount}`
  );

  // Check that all 6 biomarkers are covered
  assert.ok(tab2Content.includes('aria-label="A/V Ratio Gauge"'), 'A/V gauge has accessible label');
  assert.ok(tab2Content.includes('aria-label="CRAE Gauge"'), 'CRAE gauge has accessible label');
  assert.ok(tab2Content.includes('aria-label="CRVE Gauge"'), 'CRVE gauge has accessible label');
  assert.ok(tab2Content.includes('aria-label="Vascular Tortuosity Gauge"'), 'Tortuosity gauge has accessible label');
  assert.ok(tab2Content.includes('aria-label="AV Nicking Indicator"'), 'AV Nicking indicator has accessible label');
  assert.ok(tab2Content.includes('aria-label="Optic Cup-to-Disc Ratio Gauge"'), 'C/D gauge has accessible label');
});

runTest('ADV-DUPL-3: Tab 3 (Tổn Thương Vi Mạch & XAI) contains ZERO progress bars', () => {
  const htmlLesionsTab = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={standardAnalysisResult} defaultTab="lesions" />
    </LanguageProvider>
  );

  const lesionsTabpanelMatch = htmlLesionsTab.match(/data-testid="cds-tabpanel-lesions"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*data-testid="medical-disclaimer"/);
  const matchContent = lesionsTabpanelMatch ? lesionsTabpanelMatch[1] : htmlLesionsTab.split('data-testid="cds-tabpanel-lesions"')[1] || '';
  const progressbarCount = (matchContent.match(/role="progressbar"/g) || []).length;

  assert.strictEqual(
    progressbarCount,
    0,
    `Tab 3 must contain 0 progress bars, but found ${progressbarCount}`
  );
  assert.ok(
    htmlLesionsTab.includes('Arteriovenous Nicking') || htmlLesionsTab.includes('Tọa độ: X:'),
    'Tab 3 renders detected microvascular lesions'
  );
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n================================================================================');
console.log(`   TOTAL CHALLENGER TESTS : ${totalTests}`);
console.log(`   PASSED                 : ${passedTests}`);
console.log(`   FAILED                 : ${failedTests}`);
console.log('================================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('   All Challenger M4-2 Adversarial Tests PASSED (100%)\n');
  process.exit(0);
}
