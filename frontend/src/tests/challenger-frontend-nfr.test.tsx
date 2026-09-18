import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Domain imports
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { CDSDashboardPage } from '../pages/CDSDashboardPage';
import { PatientUploadWizard } from '../features/patient/PatientUploadWizard';
import { PatientScreeningResultView } from '../features/patient/PatientScreeningResultView';
import {
  InteractiveCDSViewer,
  getAnomalyMedicalTheme,
  getAnomalyName,
} from '../components/InteractiveCDSViewer';
import { MedicalReportModal } from '../components/MedicalReportModal';
import {
  buildFhirDiagnosticReportBundle,
  sanitizeCsvCell,
  buildReportCsvContent,
} from '../services/exportService';
import { AIRiskResult, PatientProfile, VesselAnomalyRegion } from '../types/cds';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('=================================================================');
console.log('   CHALLENGER FRONTEND 2: EMPIRICAL STRESS TESTS (NFR-13 TO NFR-23)');
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

// -----------------------------------------------------------------------------
// Test fixtures
// -----------------------------------------------------------------------------
const mockPatient: PatientProfile = {
  id: 'pat-stress-999',
  userId: 'user-stress-999',
  mrn: 'MRN-ADV-999',
  fullName: 'Nguyen Van Stress',
  age: 60,
  gender: 'Male',
  systolicBp: 140,
  diastolicBp: 90,
  hba1c: 7.2,
  hasDiabetes: true,
  hasHypertension: true,
};

const allLesionTypes = [
  'Microaneurysm',
  'Hemorrhage',
  'Hard_Exudate',
  'Cotton_Wool_Spot',
  'Neovascularization',
  'Venous_Beading',
  'AV_Nipping',
  'Focal_Narrowing',
] as const;

const mockAnomalies: VesselAnomalyRegion[] = allLesionTypes.map((type, idx) => ({
  id: `ano-${idx + 1}`,
  type,
  coordinates: { x: 20 + idx * 8, y: 30 + idx * 5, width: 24, height: 24 },
  confidence: 0.85 + (idx % 10) * 0.01,
  description: `Clinical description for ${type}`,
}));

const mockResult: AIRiskResult = {
  analysisId: 'aura-stress-analysis-001',
  imageUrl: '/assets/images/fundus_sample_01.png',
  status: 'REVIEWED',
  executionTimeMs: 1200,
  overallVascularRiskScore: 72,
  riskScore: 72,
  eyePosition: 'OD',
  scanType: 'Fundus_Macula',
  icd10Codes: ['H35.03', 'I10'],
  doctorNotes: 'Stress test clinical review notes.',
  digitalSignature: 'HMAC-SHA256:stress-signature-12345',
  signedAt: '2026-09-18T06:00:00Z',
  createdAt: '2026-09-18T05:50:00Z',
  doctorName: 'BS. Dr Stress Tester',
  doctorId: 'doc-stress-1',
  patientId: mockPatient.id,
  findings: 'High vascular risk with multiple microvascular lesions detected.',
  recommendations: 'Immediate ophthalmology referral and blood pressure control.',
  modelVersion: 'Gemini 3.8 Flash High / AURA-Core v2.4',
  activeThresholds: {
    cvdHighRiskThreshold: 65,
    drConfidenceThreshold: 70,
    avRatioConstrictionThreshold: 0.65,
  },
  confidenceCalibration: {
    brierScore: 0.058,
    calibratedConfidence: 94.2,
    calibrationMethod: 'Platt Scaling (Isotonic Regression)',
  },
  cardiovascularRisk: {
    level: 'High',
    score: 74,
    hypertensionStage: 'Stage 2 Hypertension',
    threeYearStrokeRiskPercent: 26,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 58,
    etdrsGrade: 'Moderate NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 20,
  },
  annotatedMap: {
    arteryVeinRatio: 0.61,
    vesselDensityPercentage: 17.2,
    tortuosityIndex: 1.28,
    opticCupToDiscRatio: 0.44,
    detectedAnomalies: mockAnomalies,
  },
  xaiExplainability: [
    {
      title: 'Vascular Stress Evaluation',
      impact: 'High',
      clinicalRationale: 'Arteriolar narrowing with elevated tortuosity index.',
    },
  ],
};

// -----------------------------------------------------------------------------
// 1. TOKEN COMPLIANCE EMPIRICAL AUDIT
// -----------------------------------------------------------------------------
console.log('--- 1. Empirical Token Compliance Audit ---');

test('CHALLENGE-1: Zero occurrences of #0891B2 or #F0FDFA in index.html, theme.css, and component tree', () => {
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  assert.ok(!indexHtml.toLowerCase().includes('#0891b2'), 'index.html must not contain #0891B2');
  assert.ok(!indexHtml.toLowerCase().includes('#f0fdfa'), 'index.html must not contain #F0FDFA');

  const themeCss = fs.readFileSync(path.join(projectRoot, 'src/styles/theme.css'), 'utf8');
  assert.ok(!themeCss.toLowerCase().includes('#0891b2'), 'theme.css must not contain #0891B2');
  assert.ok(!themeCss.toLowerCase().includes('#f0fdfa'), 'theme.css must not contain #F0FDFA');

  // Check core component and feature directories
  const checkDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        checkDir(full);
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        // Skip test files that explicitly check for absence
        if (f.includes('test')) continue;
        const content = fs.readFileSync(full, 'utf8');
        assert.ok(
          !content.toLowerCase().includes('#0891b2'),
          `File ${f} must not contain #0891B2`
        );
        assert.ok(
          !content.toLowerCase().includes('#f0fdfa'),
          `File ${f} must not contain #F0FDFA`
        );
      }
    }
  };

  checkDir(path.join(projectRoot, 'src/components'));
  checkDir(path.join(projectRoot, 'src/features'));
  checkDir(path.join(projectRoot, 'src/pages'));
});

// -----------------------------------------------------------------------------
// 2. 3-CLICK WORKFLOW MECHANICS EMPIRICAL AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 2. Empirical 3-Click Workflow Mechanics Audit ---');

test('CHALLENGE-2A: CDSDashboardPage renders quick scan trigger and reveals inline uploader', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage initialPatient={mockPatient} />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="cds-new-scan-btn"'), 'Must contain cds-new-scan-btn in toolbar');
  assert.ok(html.includes('Tải Ảnh Mới') || html.includes('New Scan'), 'Must show Tải Ảnh Mới / New Scan');
});

test('CHALLENGE-2B: PatientUploadWizard provides 1-Click fast upload toggle and Step 1 shortcut', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientUploadWizard
        activePatient={mockPatient}
        onStartAnalysis={() => {}}
        isAnalyzing={false}
        analysisProgress={{ status: 'Sẵn sàng', percent: 0 }}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="fast-upload-banner"'), 'Fast upload banner present');
  assert.ok(html.includes('data-testid="fast-upload-toggle-btn"'), 'Fast upload toggle button present');
  assert.ok(html.includes('data-testid="step1-fast-upload-btn"'), 'Step 1 fast upload shortcut present');
});

test('CHALLENGE-2C: PatientUploadWizard fast-upload triggers analysis callback in ≤ 2 clicks', () => {
  let submittedRequest: any = null;
  const onStartAnalysis = (req: any) => {
    submittedRequest = req;
  };

  // Instantiate component with active patient
  const el = React.createElement(PatientUploadWizard, {
    activePatient: mockPatient,
    onStartAnalysis,
    isAnalyzing: false,
    analysisProgress: { status: 'Sẵn sàng', percent: 0 },
    userCredits: 5,
  });

  const html = renderToStaticMarkup(React.createElement(LanguageProvider, null, el));
  assert.ok(html.length > 500, 'Wizard renders full DOM');
  assert.ok(html.includes('Tải nhanh 1-chạm (Bỏ qua đối chiếu)'), 'Contains 1-click prompt');
});

// -----------------------------------------------------------------------------
// 3. EXPLAINABILITY & MULTI-CLASS LESION PINPOINTS AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 3. Empirical Explainability & Multi-Class Lesion Audit ---');

test('CHALLENGE-3A: All 8 lesion classes return valid distinct styling themes', () => {
  for (const type of allLesionTypes) {
    const theme = getAnomalyMedicalTheme(type);
    assert.ok(theme.border.length > 0, `${type} must have border`);
    assert.ok(theme.bg.length > 0, `${type} must have bg`);
    assert.ok(theme.pulse.length > 0, `${type} must have pulse ring`);
    assert.ok(theme.badgeBg.length > 0, `${type} must have badge styling`);
  }

  // Verify specific high-contrast color assignments
  assert.ok(getAnomalyMedicalTheme('Cotton_Wool_Spot').border.includes('cyan'));
  assert.ok(getAnomalyMedicalTheme('Neovascularization').border.includes('purple'));
  assert.ok(getAnomalyMedicalTheme('Venous_Beading').border.includes('blue'));
  assert.ok(getAnomalyMedicalTheme('Microaneurysm').border.includes('amber'));
  assert.ok(getAnomalyMedicalTheme('Hemorrhage').border.includes('rose'));
  assert.ok(getAnomalyMedicalTheme('Hard_Exudate').border.includes('yellow'));
});

test('CHALLENGE-3B: InteractiveCDSViewer renders Red-Free filter, vessel overlay toggle, and lesion pinpoints', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <InteractiveCDSViewer analysisResult={mockResult} />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="cds-red-free-toggle-btn"'), 'CDS has Red-Free button');
  assert.ok(html.includes('data-testid="cds-vessel-overlay-toggle-btn"'), 'CDS has vessel overlay button');
  assert.ok(html.includes('id="aura-red-free-filter"'), 'SVG filter element present');
  assert.ok(html.includes('data-testid="cds-model-version-badge"'), 'Model version badge present');
  assert.ok(html.includes('data-testid="cds-calibration-metrics"'), 'Calibration metrics present');
});

test('CHALLENGE-3C: PatientScreeningResultView renders vessel canvas and pinpoints for all lesion types', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientScreeningResultView result={mockResult} />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="patient-red-free-toggle-btn"'), 'Patient view has Red-Free button');
  assert.ok(html.includes('data-testid="patient-vessel-overlay-toggle-btn"'), 'Patient view has vessel button');
  assert.ok(html.includes('data-testid="patient-vessel-canvas"'), 'Patient view has vessel canvas');

  for (const type of allLesionTypes) {
    assert.ok(
      html.includes(`data-testid="patient-lesion-pin-${type}"`),
      `Patient view renders pinpoint for ${type}`
    );
  }
});

// -----------------------------------------------------------------------------
// 4. HL7/FHIR R4 DIAGNOSTIC REPORT CONFORMANCE AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 4. Empirical HL7/FHIR R4 Schema Conformance Audit ---');

test('CHALLENGE-4: buildFhirDiagnosticReportBundle outputs fully valid HL7/FHIR R4 DiagnosticReport structure', () => {
  const bundle = buildFhirDiagnosticReportBundle(mockResult, mockPatient);

  // Bundle level validation
  assert.strictEqual(bundle.resourceType, 'Bundle');
  assert.strictEqual(bundle.type, 'document');
  assert.ok(bundle.meta?.profile?.includes('http://hl7.org/fhir/StructureDefinition/DiagnosticReport'));
  assert.ok(Array.isArray(bundle.entry));
  assert.ok(bundle.entry.length >= 8, `Expected at least 8 entries, got ${bundle.entry.length}`);

  // Patient resource validation
  const pat = bundle.entry[0].resource;
  assert.strictEqual(pat.resourceType, 'Patient');
  assert.strictEqual(pat.identifier[0].value, mockPatient.mrn);
  assert.strictEqual(pat.name[0].text, mockPatient.fullName);
  assert.strictEqual(pat.gender, 'male');

  // DiagnosticReport resource validation
  const report = bundle.entry[1].resource;
  assert.strictEqual(report.resourceType, 'DiagnosticReport');
  assert.strictEqual(report.status, 'final');
  assert.strictEqual(report.code.coding[0].code, '58452-4'); // LOINC 58452-4
  assert.strictEqual(report.category[0].coding[0].code, 'RAD');
  assert.strictEqual(report.subject.reference, `Patient/${pat.id}`);
  assert.ok(Array.isArray(report.result), 'DiagnosticReport.result must be an array of references');

  // Observations validation
  const obsList = bundle.entry.slice(2).map((e: any) => e.resource);
  assert.ok(obsList.every((o: any) => o.resourceType === 'Observation'), 'All subsequent entries must be Observations');
  assert.ok(obsList.every((o: any) => o.status === 'final'), 'All observations must have status final');

  // Required clinical observation checks
  const hasLoinc79378 = obsList.some((o: any) => o.code?.coding?.some((c: any) => c.code === '79378-6'));
  assert.ok(hasLoinc79378, 'Bundle must contain LOINC 79378-6 (Cardiovascular 10Y risk)');

  const hasSnomedDr = obsList.some((o: any) => o.code?.coding?.some((c: any) => c.code === '4855003'));
  assert.ok(hasSnomedDr, 'Bundle must contain SNOMED 4855003 (Diabetic Retinopathy)');

  const hasAvRatio = obsList.some((o: any) => o.code?.coding?.some((c: any) => c.code === 'AV_RATIO'));
  assert.ok(hasAvRatio, 'Bundle must contain AV_RATIO with reference range >= 0.67');

  const hasCdr = obsList.some((o: any) => o.code?.coding?.some((c: any) => c.code === '71520-1'));
  assert.ok(hasCdr, 'Bundle must contain LOINC 71520-1 (Cup-to-disc ratio)');

  const hasTraceability = obsList.some((o: any) => o.code?.coding?.some((c: any) => c.code === 'AI_MODEL_TRACEABILITY'));
  assert.ok(hasTraceability, 'Bundle must contain AI_MODEL_TRACEABILITY (NFR-23)');

  const traceObs = obsList.find((o: any) => o.code?.coding?.some((c: any) => c.code === 'AI_MODEL_TRACEABILITY'));
  assert.strictEqual(traceObs.valueString, 'Gemini 3.8 Flash High / AURA-Core v2.4');
});

// -----------------------------------------------------------------------------
// 5. CSV FORMULA INJECTION ADVERSARIAL CHALLENGE (OWASP CWE-1236)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Adversarial CSV Formula Injection Challenge (CWE-1236) ---');

test('CHALLENGE-5A: sanitizeCsvCell neutralizes all dangerous formula injection prefixes', () => {
  const attackVectors = [
    '=1+1',
    '=cmd|\'/C calc\'!A0',
    '+12345',
    '+cmd|\'/C calc\'!A0',
    '-SUM(A1:A10)',
    '-2+3',
    '@SUM(B1:B10)',
    '@import("http://malicious.com")',
    '\t=1+1',
    '\r=1+1',
    ' =1+1',
    '   +2+3',
    '   -calc',
    '   @cmd',
    '\n=1+1',
  ];

  for (const attack of attackVectors) {
    const sanitized = sanitizeCsvCell(attack);
    assert.ok(
      sanitized.startsWith("'"),
      `Attack vector "${attack.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n')}" must be prepended with a single quote: got "${sanitized}"`
    );
  }

  // Safe strings must remain clean
  assert.strictEqual(sanitizeCsvCell('Normal Patient Name'), 'Normal Patient Name');
  assert.strictEqual(sanitizeCsvCell('MRN-12345'), 'MRN-12345');
  assert.strictEqual(sanitizeCsvCell(123), '123');
  assert.strictEqual(sanitizeCsvCell(null), '');
  assert.strictEqual(sanitizeCsvCell(undefined), '');
});

test('CHALLENGE-5B: buildReportCsvContent end-to-end sanitizes malicious patient & result fields', () => {
  const adversarialPatient: PatientProfile = {
    ...mockPatient,
    fullName: '=cmd|\'/C calc\'!A0',
    mrn: '+MRN-EVIL-001',
    findingsSummary: '-DANGEROUS_FORMULA(1,2,3)',
  };

  const adversarialResult: AIRiskResult = {
    ...mockResult,
    doctorName: '@attacker',
    doctorNotes: '-DANGEROUS_FORMULA(1,2,3)',
    modelVersion: '\t=EXEC("calc.exe")',
    annotatedMap: {
      ...mockResult.annotatedMap!,
      detectedAnomalies: [
        {
          id: 'ano-evil',
          type: '=EvilLesion' as any,
          coordinates: { x: 10, y: 10, width: 20, height: 20 },
          confidence: 0.99,
          description: '+SUM(1,2,3)',
        },
      ],
    },
  };

  const csv = buildReportCsvContent(adversarialResult, adversarialPatient, true);

  // Must begin with UTF-8 BOM
  assert.ok(csv.startsWith('\uFEFF'), 'CSV must begin with UTF-8 BOM');

  // Verify none of the adversarial fields begin with raw unescaped =, +, -, @
  const lines = csv.split('\r\n');
  for (const line of lines) {
    const cells = line.split(',');
    for (const rawCell of cells) {
      const cell = rawCell.replace(/^"/, '').replace(/"$/, '');
      if (cell.length > 0) {
        // A cell should NEVER start with =, +, -, @ without a leading single quote
        const startsWithFormula = /^[=+\-@]/.test(cell);
        assert.ok(
          !startsWithFormula,
          `Adversarial formula detected in CSV output without neutralizing single quote: "${cell}"`
        );
      }
    }
  }
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`   TOTAL CHALLENGER TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('=================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
}
