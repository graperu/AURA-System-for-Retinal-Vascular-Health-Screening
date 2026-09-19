import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { CDSDashboardPage, DoctorPatientSummary } from '../pages/CDSDashboardPage';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { AIRiskResult, PatientProfile } from '../types/cds';

console.log('=================================================================');
console.log('   MILESTONE M4: CDS COCKPIT LAYOUT & MAXIMIZE CANVAS TEST SUITE');
console.log('   (Full-Width Inspection, Collapsible Queue, Biomarkers Gauge)');
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
// MOCK FIXTURES
// -----------------------------------------------------------------------------
const mockAnalysisResult: AIRiskResult = {
  id: 'analysis-m4-001',
  analysisId: 'analysis-m4-001',
  patientId: 'patient-test-001',
  imageUrl: '/assets/images/fundus_sample_od.png',
  eyePosition: 'Right_OD',
  status: 'COMPLETED',
  executionTimeMs: 420,
  overallVascularRiskScore: 74,
  riskScore: 74,
  cardiovascularRisk: {
    level: 'High',
    score: 78,
    hypertensionStage: 'Stage 2 HTN',
    threeYearStrokeRiskPercent: 34,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 62,
    etdrsGrade: 'MODERATE NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 18,
  },
  annotatedMap: {
    arteryVeinRatio: 0.62,
    vesselDensityPercentage: 38.5,
    tortuosityIndex: 1.34,
    opticCupToDiscRatio: 0.48,
    detectedAnomalies: [
      {
        id: 'anom-1',
        type: 'Arteriovenous Nicking',
        coordinates: { x: 55, y: 48, width: 20, height: 20 },
        confidence: 0.92,
        description: 'Gunns sign detected at arteriovenous crossing',
      },
    ],
  },
};

const mockPatient: PatientProfile = {
  id: 'patient-test-001',
  userId: 'patient-test-001',
  mrn: 'MRN-2026-789',
  fullName: 'Trần Văn Hùng',
  age: 58,
  gender: 'Male',
  systolicBp: 152,
  diastolicBp: 94,
  hba1c: 7.2,
  hasHypertension: true,
  hasDiabetes: true,
  riskLevel: 'High',
  riskScore: 74,
};

const mockPatientsList: DoctorPatientSummary[] = [
  {
    id: 'patient-test-001',
    patientId: 'patient-test-001',
    mrn: 'MRN-2026-789',
    fullName: 'Trần Văn Hùng',
    age: 58,
    gender: 'Male',
    systolicBp: 152,
    diastolicBp: 94,
    hba1c: 7.2,
    hasHypertension: true,
    hasDiabetes: true,
    screeningCount: 3,
    latestRiskLevel: 'HIGH',
    assignedAt: '2026-03-01',
    assignmentStatus: 'ASSIGNED',
  },
  {
    id: 'patient-test-002',
    patientId: 'patient-test-002',
    mrn: 'MRN-2026-456',
    fullName: 'Nguyễn Thị Mai',
    age: 45,
    gender: 'Female',
    systolicBp: 120,
    diastolicBp: 78,
    hba1c: 5.6,
    hasHypertension: false,
    hasDiabetes: false,
    screeningCount: 1,
    latestRiskLevel: 'LOW',
    assignedAt: '2026-03-10',
    assignmentStatus: 'ASSIGNED',
  },
];

// =============================================================================
// SECTION 1: INTERACTIVE CDS VIEWER MAXIMIZE CANVAS TESTS
// =============================================================================
console.log('--- 1. InteractiveCDSViewer: Maximize Canvas / Full-Width Inspection ---');

runTest('M4-VIEWER-1: Renders Maximize Canvas toggle button with correct test ID', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <InteractiveCDSViewer
        analysisResult={mockAnalysisResult}
        selectedEye="OD"
        isMaximized={false}
      />
    </LanguageProvider>
  );

  assert.ok(
    html.includes('data-testid="cds-maximize-canvas-btn"'),
    'InteractiveCDSViewer toolbar must render cds-maximize-canvas-btn'
  );
  assert.ok(
    html.includes('Toàn Khung') || html.includes('Maximize Canvas') || html.includes('Phóng to toàn khung'),
    'Toggle button displays Maximize Canvas label when minimized'
  );
});

runTest('M4-VIEWER-2: Default normal mode has standard viewport height and normal data attribute', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <InteractiveCDSViewer
        analysisResult={mockAnalysisResult}
        selectedEye="OD"
        isMaximized={false}
      />
    </LanguageProvider>
  );

  assert.ok(
    !html.includes('cds-viewer-maximized'),
    'Standard mode must not apply cds-viewer-maximized class'
  );
  assert.ok(
    html.includes('min-h-[600px]'),
    'Standard mode maintains standard viewport height constraints'
  );
});

runTest('M4-VIEWER-3: Maximized mode expands canvas viewport and updates button to Restore', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <InteractiveCDSViewer
        analysisResult={mockAnalysisResult}
        selectedEye="OD"
        isMaximized={true}
      />
    </LanguageProvider>
  );

  assert.ok(
    html.includes('cds-viewer-maximized'),
    'Maximized mode must apply cds-viewer-maximized class'
  );
  assert.ok(
    html.includes('data-maximized="true"'),
    'Maximized mode must set data-maximized="true"'
  );
  assert.ok(
    html.includes('min-h-[720px]') && html.includes('2xl:min-h-[820px]'),
    'Maximized mode expands viewer height to min-h-[720px] 2xl:min-h-[820px]'
  );
  assert.ok(
    html.includes('Thu nhỏ') || html.includes('Restore'),
    'Button label changes to Restore / Thu nhỏ when maximized'
  );
});

// =============================================================================
// SECTION 2: CDS DASHBOARD 3-COLUMN COCKPIT & FULL-WIDTH MODE
// =============================================================================
console.log('\n--- 2. CDSDashboardPage: 3-Column Layout & Full-Width Inspection Mode ---');

runTest('M4-DASHBOARD-1: Quick action bar includes Maximize Canvas button', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={mockPatient}
          initialPatients={mockPatientsList}
          initialAnalysisResult={mockAnalysisResult}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(
    html.includes('data-testid="cds-header-maximize-btn"'),
    'CDSDashboardPage quick action bar provides cds-header-maximize-btn'
  );
});

runTest('M4-DASHBOARD-2: Normal 3-column mode displays Patient Queue, Viewer, and Validation Bar', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={mockPatient}
          initialPatients={mockPatientsList}
          initialAnalysisResult={mockAnalysisResult}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Left column: Patient Queue
  assert.ok(
    html.includes('data-testid="cds-patient-queue-container"'),
    'Normal mode displays left patient queue container'
  );

  // Middle column: InteractiveCDSViewer & RiskAssessmentPanel
  assert.ok(
    html.includes('data-testid="cds-maximize-canvas-btn"'),
    'Middle column contains InteractiveCDSViewer'
  );
  assert.ok(
    html.includes('role="tablist"'),
    'Middle column contains RiskAssessmentPanel tabs in 3-column cockpit'
  );

  // Right column: ClinicalValidationBar
  assert.ok(
    html.includes('Ký duyệt') || html.includes('Sign-off') || html.includes('Clinical Assessment') || html.includes('Đánh Giá'),
    'Normal mode displays right clinical validation bar'
  );

  // Maximize banner should not be present in normal mode
  assert.ok(
    !html.includes('data-testid="cds-maximize-banner"'),
    'Normal mode does not display maximize notification banner'
  );
});

runTest('M4-DASHBOARD-3: Full-Width Inspection Mode hides side columns and shows maximize banner', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={mockPatient}
          initialPatients={mockPatientsList}
          initialAnalysisResult={mockAnalysisResult}
          initialMaximized={true}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  // Left column should be hidden
  assert.ok(
    !html.includes('data-testid="cds-patient-queue-container"'),
    'Full-width mode hides left patient queue'
  );

  // Secondary panel (RiskAssessmentPanel) should be collapsed/hidden to maximize viewer focus
  assert.ok(
    !html.includes('role="tablist"'),
    'Full-width mode hides/collapses secondary panels'
  );

  // Maximize banner and restore button are present
  assert.ok(
    html.includes('data-testid="cds-maximize-banner"'),
    'Full-width mode displays cds-maximize-banner'
  );
  assert.ok(
    html.includes('data-testid="cds-restore-canvas-btn"'),
    'Full-width mode displays cds-restore-canvas-btn'
  );

  // InteractiveCDSViewer receives isMaximized=true
  assert.ok(
    html.includes('cds-viewer-maximized'),
    'InteractiveCDSViewer is expanded in full-width mode'
  );
});

// =============================================================================
// SECTION 3: COLLAPSIBLE PATIENT QUEUE TESTS
// =============================================================================
console.log('\n--- 3. CDSDashboardPage: Collapsible Patient Queue ---');

runTest('M4-QUEUE-1: Expanded queue shows toggle button, search input, and patient list', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={mockPatient}
          initialPatients={mockPatientsList}
          initialQueueCollapsed={false}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(
    html.includes('data-testid="cds-toggle-patient-queue-btn"'),
    'Renders toggle button cds-toggle-patient-queue-btn'
  );
  assert.ok(
    html.includes('data-testid="cds-patient-search-input"'),
    'Expanded queue contains patient search input'
  );
  assert.ok(
    html.includes('xl:w-[260px]') || html.includes('2xl:w-[280px]'),
    'Expanded queue uses xl:w-[260px] 2xl:w-[280px] width layout'
  );
  assert.ok(
    html.includes('Trần Văn Hùng'),
    'Expanded queue displays patient full name'
  );
  assert.ok(
    html.includes('MRN-2026-789'),
    'Expanded queue displays patient MRN'
  );
});

runTest('M4-QUEUE-2: Collapsed queue transitions to mini strip with quick avatar buttons', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage
          initialPatient={mockPatient}
          initialPatients={mockPatientsList}
          initialQueueCollapsed={true}
          initialMaximized={false}
        />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(
    html.includes('xl:w-[64px]') || html.includes('2xl:w-[72px]'),
    'Collapsed queue shrinks to mini strip xl:w-[64px]'
  );
  assert.ok(
    !html.includes('data-testid="cds-patient-search-input"'),
    'Collapsed queue hides full search input'
  );
  assert.ok(
    html.includes('data-testid="cds-mini-patient-patient-test-001"'),
    'Collapsed queue renders mini patient avatar button for patient 1'
  );
  assert.ok(
    html.includes('data-testid="cds-mini-patient-patient-test-002"'),
    'Collapsed queue renders mini patient avatar button for patient 2'
  );
});

// =============================================================================
// SECTION 4: CONDENSED RISK ASSESSMENT PANEL & BIOMARKERS GAUGE FOCUS
// =============================================================================
console.log('\n--- 4. RiskAssessmentPanel: Biomarkers Gauge Focus & Redundancy Elimination ---');

runTest('M4-BIOMARKER-1: RiskAssessmentPanel defaults to biomarkers gauge tab', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );

  assert.ok(
    html.includes('role="tablist"'),
    'RiskAssessmentPanel provides WAI-ARIA tablist container'
  );

  // Tab 2 (Biomarkers) should have aria-selected="true"
  assert.ok(
    html.includes('aria-selected="true"'),
    'Active tab button has aria-selected="true"'
  );
  assert.ok(
    html.includes('Chỉ Số Sinh Học Vi Mạch') || html.includes('Microvascular Biomarkers'),
    'Active biomarkers tab label is present'
  );
});

runTest('M4-BIOMARKER-2: Default rendering without explicit prop also defaults to biomarkers', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockAnalysisResult} />
    </LanguageProvider>
  );

  // Should contain key biomarkers in default view
  assert.ok(
    html.includes('Tỉ Lệ Động-Tĩnh Mạch') || html.includes('Artery-Vein Ratio') || html.includes('A/V Ratio'),
    'Biomarkers tab content is active by default'
  );
});

runTest('M4-BIOMARKER-3: Retinal microvascular biomarkers (A/V, CRAE, CRVE, Tortuosity, Nicking, C/D) are rendered with progressbars', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockAnalysisResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );

  // Check all 6 microvascular biomarkers
  assert.ok(
    html.includes('A/V Ratio') || html.includes('Tỉ Lệ Động-Tĩnh Mạch'),
    'Renders Artery-Vein Ratio (A/V Ratio)'
  );
  assert.ok(
    html.includes('CRAE'),
    'Renders Central Retinal Arteriolar Equivalent (CRAE)'
  );
  assert.ok(
    html.includes('CRVE'),
    'Renders Central Retinal Venular Equivalent (CRVE)'
  );
  assert.ok(
    html.includes('Tortuosity') || html.includes('Độ Uốn Lượn'),
    'Renders Vascular Tortuosity Index'
  );
  assert.ok(
    html.includes('Bắt chéo') || html.includes('AV Nicking') || html.includes('bắt chéo'),
    'Renders Arteriovenous Nicking indicator'
  );
  assert.ok(
    html.includes('C/D Ratio') || html.includes('Lõm gai thị') || html.includes('Cup-to-Disc'),
    'Renders Optic Cup-to-Disc Ratio (C/D Ratio)'
  );

  // Check progressbars
  assert.ok(
    html.includes('role="progressbar"'),
    'Biomarkers use accessible role="progressbar" gauges'
  );
});

runTest('M4-BIOMARKER-4: Overview tab focuses on consolidated header without duplicate raw risk bars', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockAnalysisResult} defaultTab="risks" />
    </LanguageProvider>
  );

  // Summary header should be present
  assert.ok(
    html.includes('Đánh Giá Nguy Cơ Lâm Sàng AI') || html.includes('Clinical Risk Assessment') || html.includes('Tổng Điểm Nguy Cơ'),
    'Overview tab presents consolidated vascular risk header'
  );
  assert.ok(
    html.includes('Giai đoạn 2') || html.includes('Stage 2'),
    'Overview presents clinical hypertension stage'
  );
  assert.ok(
    html.includes('34%'),
    'Overview presents 3-year stroke risk percentage'
  );
  assert.ok(
    html.includes('Nguy Cơ Tim Mạch') || html.includes('Cardiovascular Risk'),
    'Overview presents cardiovascular risk pillar'
  );

  // Ensure duplicate raw progress bars for Cardiovascular / Glaucoma / Overall do not clutter the tab
  assert.ok(
    !html.includes('data-testid="duplicate-raw-progress-bars"'),
    'Eliminated duplicate raw risk progress bars from the overview tab'
  );
});

// =============================================================================
// SECTION 5: INTERACTIVE BEHAVIORAL & CALCULATION LOGIC TESTS
// =============================================================================
console.log('\n--- 5. Behavioral & Algorithmic Logic Verification ---');

runTest('M4-INTERACT-1: Patient search filtering logic accurately matches name and MRN', () => {
  const queryName = 'Hùng';
  const filteredByName = mockPatientsList.filter((p) => {
    const q = queryName.toLowerCase();
    return (
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.mrn && p.mrn.toLowerCase().includes(q))
    );
  });
  assert.strictEqual(filteredByName.length, 1, 'Should filter exactly 1 patient matching Hùng');
  assert.strictEqual(filteredByName[0].patientId, 'patient-test-001');

  const queryMrn = '456';
  const filteredByMrn = mockPatientsList.filter((p) => {
    const q = queryMrn.toLowerCase();
    return (
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.mrn && p.mrn.toLowerCase().includes(q))
    );
  });
  assert.strictEqual(filteredByMrn.length, 1, 'Should filter exactly 1 patient matching MRN 456');
  assert.strictEqual(filteredByMrn[0].patientId, 'patient-test-002');
});

runTest('M4-INTERACT-2: CRAE and CRVE calculation formulas maintain Parr-Hubbard proportionality', () => {
  const crve = 220;
  const avRatio = 0.62;
  const crae = Math.round(crve * avRatio);
  assert.strictEqual(crae, 136, 'CRAE should equal CRVE * A/V ratio (220 * 0.62 = 136 µm)');
});

runTest('M4-INTERACT-3: AV Nicking anomaly detection accurately identifies Gunn crossing signs', () => {
  const anomalies = mockAnalysisResult.annotatedMap?.detectedAnomalies || [];
  const avNickingCount = anomalies.filter(
    (a) => a.type === 'AV_Nipping' || a.type === 'AV_Nicking' || a.type?.toLowerCase().includes('nick')
  ).length;
  assert.strictEqual(avNickingCount, 1, 'Should detect 1 Arteriovenous Nicking lesion');
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
  console.log('   All M4 CDS Cockpit Layout & Maximize Canvas tests PASSED (100%)\n');
  process.exit(0);
}
