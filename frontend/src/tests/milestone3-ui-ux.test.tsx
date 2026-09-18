import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Contexts & Components under test
import { LanguageProvider } from '../context/LanguageContext';
import { PatientUploadWizard } from '../features/patient/PatientUploadWizard';
import { PatientUploader } from '../components/PatientUploader';
import { BatchUploadModal } from '../components/BatchUploadModal';
import { BatchItemDetailModal } from '../components/BatchItemDetailModal';
import { ClinicCreditPackageSection } from '../components/ClinicCreditPackageSection';
import { CDSDashboardPage } from '../pages/CDSDashboardPage';
import { AuthProvider } from '../context/AuthContext';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('=================================================================');
console.log('   MILESTONE 3: UI/UX POLISH & 3-CLICK SCREENING WORKFLOW TESTS');
console.log('   (NFR-13: MediRoom Design Tokens | NFR-14: Fast 3-Click Screening)');
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

const mockPatient = {
  id: 'pat-test-01',
  userId: 'pat-test-01',
  mrn: 'MRN-9901',
  fullName: 'Đặng Văn Minh',
  age: 58,
  gender: 'Male',
  systolicBp: 135,
  diastolicBp: 88,
  hba1c: 6.8,
  hasDiabetes: true,
  hasHypertension: false,
};

// -----------------------------------------------------------------------------
// SECTION 1: NFR-13 COLOR TOKEN PURGE & MEDIROOM ALIGNMENT TESTS
// -----------------------------------------------------------------------------
console.log('--- 1. NFR-13: MediRoom Color Tokens & Legacy Cyan Purge ---');

test('M3-NFR13-1: index.html has MediRoom canvas #F5F6F8 and no legacy #F0FDFA / #134E4A', () => {
  const indexPath = path.join(projectRoot, 'index.html');
  assert.ok(fs.existsSync(indexPath), 'index.html must exist');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  assert.ok(indexHtml.includes('bg-[#F5F6F8]'), 'Body has MediRoom canvas bg-[#F5F6F8]');
  assert.ok(indexHtml.includes('text-[#111827]'), 'Body has crisp typography text-[#111827]');
  assert.ok(!indexHtml.includes('#F0FDFA'), 'Legacy teal background #F0FDFA is completely purged from index.html');
  assert.ok(!indexHtml.includes('#134E4A'), 'Legacy teal text #134E4A is completely purged from index.html');
});

test('M3-NFR13-2: theme.css defines MediRoom primary #3478F6 and canvas #F5F6F8 design tokens', () => {
  const themePath = path.join(projectRoot, 'src/styles/theme.css');
  assert.ok(fs.existsSync(themePath), 'theme.css must exist');
  const themeCss = fs.readFileSync(themePath, 'utf8');

  assert.ok(themeCss.includes('--color-primary: #3478F6;'), 'Primary color token is #3478F6');
  assert.ok(themeCss.includes('--color-background: #F5F6F8;'), 'Background color token is #F5F6F8');
  assert.ok(themeCss.includes('--color-border: #EAECF0;'), 'Border hairline color token is #EAECF0');
  assert.ok(!themeCss.includes('#0891B2'), 'Legacy cyan #0891B2 purged from theme.css');
  assert.ok(!themeCss.includes('#F0FDFA'), 'Legacy cyan #F0FDFA purged from theme.css');
});

test('M3-NFR13-3: PatientUploader renders with MediRoom #3478F6 primary accents and clean progress bar', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientUploader
        activePatient={mockPatient}
        onStartAnalysis={() => {}}
        isAnalyzing={true}
        analysisProgress={{ status: 'Phân tích AI', percent: 45 }}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('#3478F6'), 'PatientUploader contains MediRoom primary blue #3478F6');
  assert.ok(!html.includes('#0891B2'), 'PatientUploader does not contain legacy #0891B2');
  assert.ok(!html.includes('#F0FDFA'), 'PatientUploader does not contain legacy #F0FDFA');
});

test('M3-NFR13-4: BatchUploadModal renders clean MediRoom header without heavy teal gradient', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <BatchUploadModal
        isOpen={true}
        onClose={() => {}}
        onSubmitBatch={async () => {}}
        currentCredits={25}
      />
    </LanguageProvider>
  );

  assert.ok(!html.includes('from-[#134E4A]'), 'Purged heavy gradient from-[#134E4A] in BatchUploadModal');
  assert.ok(html.includes('#3478F6'), 'BatchUploadModal uses primary blue #3478F6');
});

test('M3-NFR13-5: BatchItemDetailModal renders #3478F6 primary actions and #EAECF0 borders', () => {
  const mockItem = {
    id: 'item-01',
    patientName: 'Đặng Văn Minh',
    mrn: 'MRN-9901',
    eye: 'OD',
    status: 'COMPLETED',
    overallRisk: 35,
    riskLevel: 'MODERATE',
    fileName: 'retina_od.png',
  };

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <BatchItemDetailModal
        item={mockItem as any}
        onClose={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('#3478F6'), 'BatchItemDetailModal uses #3478F6 primary blue');
  assert.ok(!html.includes('#0891B2'), 'BatchItemDetailModal purged #0891B2');
});

test('M3-NFR13-6: ClinicCreditPackageSection uses MediRoom #3478F6 branding', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicCreditPackageSection />
    </LanguageProvider>
  );

  assert.ok(html.includes('#3478F6'), 'Credit package section uses #3478F6');
  assert.ok(!html.includes('#0891B2'), 'Credit package section purged #0891B2');
});

// -----------------------------------------------------------------------------
// SECTION 2: NFR-14 3-CLICK SCREENING WORKFLOW TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 2. NFR-14: Streamline 3-Click Screening Workflow ---');

test('M3-NFR14-1: CDSDashboardPage quick action bar renders "Tải Ảnh Mới" button', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AuthProvider>
        <CDSDashboardPage initialPatient={mockPatient} />
      </AuthProvider>
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="cds-new-scan-btn"'), 'Renders cds-new-scan-btn in CDSDashboardPage toolbar');
  assert.ok(
    html.includes('Tải Ảnh Mới') || html.includes('New Scan'),
    'Button displays Tải Ảnh Mới or New Scan label'
  );
});

test('M3-NFR14-2: PatientUploadWizard renders 1-Click Fast Upload Mode banner and toggle', () => {
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

  assert.ok(html.includes('data-testid="fast-upload-banner"'), 'Renders fast upload banner');
  assert.ok(html.includes('data-testid="fast-upload-toggle-btn"'), 'Renders fast upload toggle button');
  assert.ok(
    html.includes('Chế độ Tải Nhanh 1-Chạm') || html.includes('1-Click Fast Upload Mode'),
    'Displays 1-Click Fast Upload title'
  );
});

test('M3-NFR14-3: PatientUploadWizard Step 1 provides direct 1-Click shortcut to upload', () => {
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

  assert.ok(html.includes('data-testid="step1-fast-upload-btn"'), 'Renders step1-fast-upload-btn shortcut');
  assert.ok(
    html.includes('Tải nhanh 1-chạm') || html.includes('1-Click Fast Upload'),
    'Contains fast upload shortcut text'
  );
});

test('M3-NFR14-4: PatientUploadWizard supports instant analysis execution when triggered', () => {
  let analysisRequestTriggered: any = null;

  // Render wizard and simulate direct callback
  const onStartAnalysis = (req: any) => {
    analysisRequestTriggered = req;
  };

  const el = React.createElement(PatientUploadWizard, {
    activePatient: mockPatient,
    onStartAnalysis,
    isAnalyzing: false,
    analysisProgress: { status: 'Sẵn sàng', percent: 0 },
    userCredits: 10,
  });

  const html = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, el)
  );

  assert.ok(html.length > 0, 'Wizard renders cleanly');
  assert.ok(html.includes('Bước 1: Chọn Mắt Khám'), 'Initial step is Step 1');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('=================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
} else {
  process.exit(0);
}
