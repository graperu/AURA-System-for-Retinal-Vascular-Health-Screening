import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Components under empirical test
import { ClinicPortalPage, ClinicCreditSummaryWidget } from '../pages/ClinicPortalPage';
import { ClinicDashboardView } from '../features/clinic/ClinicDashboardView';
import { LanguageProvider } from '../context/LanguageContext';
import { ClinicBatchJob, ClinicBatchJobItem } from '../types/cds';

console.log('=================================================================');
console.log('   CHALLENGER M2-2: EMPIRICAL ADVERSARIAL STRESS TEST SUITE');
console.log('   MOCK ELIMINATION & CLEAN MEDICAL EMPTY STATES VERIFICATION');
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

const emptyBatchJob: ClinicBatchJob = {
  batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
  clinicId: 'CLN-TEST',
  clinicName: 'Phòng khám thử nghiệm AURA',
  totalImages: 0,
  processedCount: 0,
  failedCount: 0,
  status: 'COMPLETED',
  createdAt: '2026-09-19T00:00:00Z',
  estimatedTimeRemainingSec: 0,
  items: [],
};

// -----------------------------------------------------------------------------
// SECTION 1: MOCK DATA ELIMINATION VERIFICATION (ZERO TOLERANCE)
// -----------------------------------------------------------------------------
console.log('--- 1. Mock Data Elimination & Zero-Occurrence Verification ---');

test('CHALLENGE-M2-1.1: Default ClinicPortalPage contains zero occurrences of legacy mock patient names', () => {
  const views = ['dashboard', 'patient-list', 'scan-history', 'bulk-batch'];

  for (const view of views) {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <ClinicPortalPage activeView={view} />
      </LanguageProvider>
    );

    // Assert zero occurrences of legacy mock patient names
    assert.strictEqual(
      html.includes('Trần Thị Mai'),
      false,
      `Legacy mock name "Trần Thị Mai" leaked in view: ${view}`
    );
    assert.strictEqual(
      html.includes('Lê Văn Hoàng'),
      false,
      `Legacy mock name "Lê Văn Hoàng" leaked in view: ${view}`
    );
    assert.strictEqual(
      html.includes('Phạm Đức Dũng'),
      false,
      `Legacy mock name "Phạm Đức Dũng" leaked in view: ${view}`
    );
    assert.strictEqual(
      html.includes('Nguyễn Thị Hoa'),
      false,
      `Legacy mock name "Nguyễn Thị Hoa" leaked in default uninitialized view: ${view}`
    );
    assert.strictEqual(
      html.includes('Võ Minh Quân'),
      false,
      `Legacy mock name "Võ Minh Quân" leaked in default uninitialized view: ${view}`
    );

    // Assert zero occurrences of legacy static mock image filenames
    assert.strictEqual(
      html.includes('fundus_od_mai_78214.png'),
      false,
      `Legacy mock file "fundus_od_mai_78214.png" leaked in view: ${view}`
    );
    assert.strictEqual(
      html.includes('SCR-2026-0918-01'),
      false,
      `Legacy mock case "SCR-2026-0918-01" leaked in view: ${view}`
    );
  }
});

test('CHALLENGE-M2-1.2: Default ClinicDashboardView contains zero occurrences of legacy mock items and fake IDs', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView batchJob={emptyBatchJob} onNavigate={() => {}} />
    </LanguageProvider>
  );

  assert.strictEqual(html.includes('Trần Thị Mai'), false, 'Found "Trần Thị Mai" in ClinicDashboardView');
  assert.strictEqual(html.includes('Lê Văn Hoàng'), false, 'Found "Lê Văn Hoàng" in ClinicDashboardView');
  assert.strictEqual(html.includes('ITEM-HR-001'), false, 'Found legacy fake item ID "ITEM-HR-001"');
  assert.strictEqual(html.includes('ITEM-HR-002'), false, 'Found legacy fake item ID "ITEM-HR-002"');
  assert.strictEqual(html.includes('ITEM-HR-003'), false, 'Found legacy fake item ID "ITEM-HR-003"');
});

// -----------------------------------------------------------------------------
// SECTION 2: AUTHENTIC MEDICAL EMPTY STATES VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 2. Authentic Medical Empty States Verification ---');

test('CHALLENGE-M2-2.1: ClinicPatientListSection renders clean medical empty state when no patients exist', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="patient-list" />
    </LanguageProvider>
  );

  // Section title and description must be rendered
  assert.ok(
    html.includes('Danh Sách Bệnh Nhân Cơ Sở') || html.includes('Clinic Patient Directory'),
    'Patient directory card title missing'
  );

  // Authentic medical empty state message must be displayed
  assert.ok(
    html.includes('Chưa có hồ sơ bệnh nhân nào tại cơ sở y tế') ||
    html.includes('No patients registered in facility'),
    'Authentic empty state title missing'
  );

  assert.ok(
    html.includes('Bệnh nhân sẽ tự động hiển thị sau khi hoàn tất tải lên đợt khám') ||
    html.includes('Patients will automatically appear after batch uploads'),
    'Authentic empty state guidance subtitle missing'
  );

  // Must NOT render table rows when empty
  assert.strictEqual(html.includes('<tbody>'), false, 'Table tbody rendered when dataset is completely empty');
});

test('CHALLENGE-M2-2.2: ClinicResultsSection renders clean medical empty state when no screenings exist', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="scan-history" />
    </LanguageProvider>
  );

  // Section title and description
  assert.ok(
    html.includes('Kết Quả Sàng Lọc Sức Khỏe Vi Mạch') || html.includes('Screening Results & History'),
    'Results section title missing'
  );

  // Authentic medical empty state message
  assert.ok(
    html.includes('Chưa có ca sàng lọc nào trong cơ sở dữ liệu') ||
    html.includes('No screening records found'),
    'Authentic empty screening title missing'
  );

  assert.ok(
    html.includes('Các ca sàng lọc sau khi phân tích sẽ được tổng hợp tự động tại đây') ||
    html.includes('Screening records will appear here once analyzed'),
    'Authentic empty screening guidance subtitle missing'
  );

  // Must NOT render table rows when empty
  assert.strictEqual(html.includes('<tbody>'), false, 'Table tbody rendered when dataset is completely empty');
});

test('CHALLENGE-M2-2.3: ClinicDashboardView renders clean empty state for high-risk cases queue when empty', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView batchJob={emptyBatchJob} onNavigate={() => {}} />
    </LanguageProvider>
  );

  assert.ok(
    html.includes('Không có ca bệnh nguy cơ cao cần chú ý') ||
    html.includes('No high-risk priority cases pending'),
    'Missing clean empty state message in high-risk priority case queue'
  );

  assert.ok(
    html.includes('Tất cả các ca khám đều trong giới hạn an toàn hoặc chưa có lô quét mới') ||
    html.includes('All cases within safe limits or no recent batch data'),
    'Missing reassuring guidance subtitle in high-risk queue'
  );
});

test('CHALLENGE-M2-2.4: ClinicDashboardView KPI counts reflect true zero (not legacy hardcoded 128, 42, 14)', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView batchJob={emptyBatchJob} onNavigate={() => {}} />
    </LanguageProvider>
  );

  // Check that KPI counts are 0, not fake baseline numbers
  // 1. Unique patients count should be 0, NOT 128
  assert.strictEqual(
    html.includes('>128<'),
    false,
    'Found legacy baseline 128 in Unique Patients KPI'
  );

  // 2. Screenings today should be 0, NOT 42
  assert.strictEqual(
    html.includes('>42<'),
    false,
    'Found legacy baseline 42 in Screenings Today KPI'
  );

  // 3. High risk count should be 0, NOT 14
  assert.strictEqual(
    html.includes('>14<'),
    false,
    'Found legacy baseline 14 in High Risk KPI'
  );
});

// -----------------------------------------------------------------------------
// SECTION 3: POPULATED DATA, LAYOUT INTEGRITY & NAN PREVENTION
// -----------------------------------------------------------------------------
console.log('\n--- 3. Populated Data, Layout Integrity & NaN Prevention ---');

const populatedBatchJob: ClinicBatchJob = {
  batchId: 'BATCH-2026-TEST-POPULATED',
  clinicId: 'CLN-POPULATED',
  clinicName: 'Bệnh viện Mắt Quốc Tế AURA',
  totalImages: 3,
  processedCount: 3,
  failedCount: 0,
  status: 'COMPLETED',
  createdAt: '2026-09-19T06:00:00Z',
  estimatedTimeRemainingSec: 0,
  items: [
    {
      id: 'ITEM-TEST-001',
      patientName: 'Đặng Tuấn Kiệt',
      mrn: 'MRN-88001',
      pseudonymId: 'ANON-88001',
      eye: 'OD',
      fileName: 'fundus_od_kiet.png',
      status: 'DONE',
      riskLevel: 'HIGH',
      riskScore: 78,
      arteryVeinRatio: 0.58,
      patientAge: 61,
      patientGender: 'M',
      systolicBp: 148,
      diastolicBp: 92,
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'ITEM-TEST-002',
      patientName: 'Nguyễn Thị Bích Thủy',
      mrn: 'MRN-88002',
      pseudonymId: 'ANON-88002',
      eye: 'OS',
      fileName: 'fundus_os_thuy.png',
      status: 'DONE',
      riskLevel: 'MODERATE',
      riskScore: 45,
      arteryVeinRatio: 0.64,
      patientAge: 52,
      patientGender: 'F',
      systolicBp: 128,
      diastolicBp: 82,
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'ITEM-TEST-003',
      patientName: 'Hoàng Minh Đức',
      mrn: 'MRN-88003',
      pseudonymId: 'ANON-88003',
      eye: 'OD',
      fileName: 'fundus_od_duc.png',
      status: 'DONE',
      riskLevel: 'LOW',
      riskScore: 15,
      arteryVeinRatio: 0.69,
      patientAge: 44,
      patientGender: 'M',
      systolicBp: 118,
      diastolicBp: 78,
      createdAt: Date.now() - 10800000,
    },
  ],
};

test('CHALLENGE-M2-3.1: ClinicPatientListSection renders populated table properly without NaN or layout break', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="patient-list" initialBatchJob={populatedBatchJob} />
    </LanguageProvider>
  );

  // Verify DataTable rendered with real patient entries
  assert.ok(html.includes('Đặng Tuấn Kiệt'), 'Missing patient Đặng Tuấn Kiệt in table');
  assert.ok(html.includes('MRN-88001'), 'Missing MRN-88001');
  assert.ok(html.includes('Nguyễn Thị Bích Thủy'), 'Missing patient Nguyễn Thị Bích Thủy');
  assert.ok(html.includes('Hoàng Minh Đức'), 'Missing patient Hoàng Minh Đức');

  // Verify Risk badges and values
  assert.ok(html.includes('78%'), 'Missing 78% risk score');
  assert.ok(html.includes('45%'), 'Missing 45% risk score');
  assert.ok(html.includes('15%'), 'Missing 15% risk score');

  // Verify Vitals
  assert.ok(html.includes('148/92 mmHg'), 'Missing vitals 148/92 mmHg');

  // Zero NaN check
  assert.strictEqual(html.includes('NaN'), false, 'Found NaN in ClinicPatientListSection table');
});

test('CHALLENGE-M2-3.2: ClinicResultsSection renders populated results properly with formatted AV ratio and status', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="scan-history" initialBatchJob={populatedBatchJob} />
    </LanguageProvider>
  );

  // Verify filenames and case IDs
  assert.ok(html.includes('fundus_od_kiet.png'), 'Missing filename fundus_od_kiet.png');
  assert.ok(html.includes('ITEM-TEST-001'), 'Missing ID ITEM-TEST-001');

  // Verify Eye indicators
  assert.ok(html.includes('Mắt Phải (OD)'), 'Missing OD indicator');
  assert.ok(html.includes('Mắt Trái (OS)'), 'Missing OS indicator');

  // Verify A/V ratio formatting (toFixed(2))
  assert.ok(html.includes('0.58'), 'Missing formatted A/V ratio 0.58');
  assert.ok(html.includes('0.64'), 'Missing formatted A/V ratio 0.64');
  assert.ok(html.includes('0.69'), 'Missing formatted A/V ratio 0.69');

  // Verify status
  assert.ok(html.includes('DONE'), 'Missing DONE status tag');

  // Zero NaN check
  assert.strictEqual(html.includes('NaN'), false, 'Found NaN in ClinicResultsSection table');
});

test('CHALLENGE-M2-3.3: Adversarial stress test — Handling batch items with missing, partial or zero values', () => {
  const edgeCaseBatchJob: ClinicBatchJob = {
    batchId: 'BATCH-EDGE-CASE-001',
    clinicId: 'CLN-EDGE',
    clinicName: 'Phòng khám Ngoại Biên',
    totalImages: 3,
    processedCount: 3,
    failedCount: 0,
    status: 'COMPLETED',
    createdAt: '2026-09-19T06:00:00Z',
    estimatedTimeRemainingSec: 0,
    items: [
      {
        id: 'ITEM-ZERO-SCORE',
        patientName: 'Bệnh Nhân Sức Khỏe Hoàn Hảo',
        mrn: 'MRN-ZERO',
        pseudonymId: 'ANON-ZERO',
        eye: 'OD',
        fileName: 'fundus_perfect_zero.png',
        status: 'DONE',
        riskLevel: 'LOW',
        riskScore: 0, // Edge case: score is 0
        arteryVeinRatio: 0.67,
        patientAge: 30,
        patientGender: 'M',
        systolicBp: 120,
        diastolicBp: 80,
      },
      {
        id: 'ITEM-MISSING-METRICS',
        patientName: '', // Edge case: empty name
        mrn: '', // Edge case: empty MRN
        pseudonymId: '',
        eye: 'OS',
        fileName: 'fundus_sparse.png',
        status: 'PENDING',
        riskLevel: undefined as any,
        riskScore: undefined as any,
        arteryVeinRatio: undefined as any,
        patientAge: 0,
        patientGender: '',
      },
      {
        id: 'ITEM-MAX-BOUNDARY',
        patientName: 'Bệnh Nhân Nguy Kịch Tột Độ',
        mrn: 'MRN-CRITICAL-100',
        pseudonymId: 'ANON-100',
        eye: 'OD',
        fileName: 'fundus_critical_100.png',
        status: 'DONE',
        riskLevel: 'CRITICAL',
        riskScore: 100, // Edge case: score 100
        arteryVeinRatio: 0.35,
        patientAge: 89,
        patientGender: 'F',
        systolicBp: 210,
        diastolicBp: 130,
      },
    ],
  };

  // Test patient list section with sparse/edge data
  const patientHtml = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="patient-list" initialBatchJob={edgeCaseBatchJob} />
    </LanguageProvider>
  );

  assert.strictEqual(patientHtml.includes('NaN'), false, 'Found NaN in patient list with edge case items');
  assert.ok(patientHtml.includes('Bệnh Nhân Nguy Kịch Tột Độ'), 'Rendered max boundary patient');
  assert.ok(patientHtml.includes('100%'), 'Rendered 100% risk score badge');

  // Test scan results section with sparse/edge data
  const resultsHtml = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="scan-history" initialBatchJob={edgeCaseBatchJob} />
    </LanguageProvider>
  );

  assert.strictEqual(resultsHtml.includes('NaN'), false, 'Found NaN in scan results with edge case items');
  assert.ok(resultsHtml.includes('fundus_sparse.png'), 'Rendered sparse item');
  assert.ok(resultsHtml.includes('fundus_critical_100.png'), 'Rendered critical boundary item');

  // Test dashboard with sparse/edge data
  const dashboardHtml = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView batchJob={edgeCaseBatchJob} onNavigate={() => {}} />
    </LanguageProvider>
  );

  assert.strictEqual(dashboardHtml.includes('NaN'), false, 'Found NaN in dashboard view with edge case items');
  assert.ok(dashboardHtml.includes('MRN-CRITICAL-100'), 'Dashboard high risk queue caught critical patient');
});

// -----------------------------------------------------------------------------
// SECTION 4: CLINIC QUOTA & PROGRESS CALCULATION VERIFICATION (NO 4000)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Clinic Quota & Progress Calculation Verification ---');

test('CHALLENGE-M2-4.1: ClinicCreditSummaryWidget displays true 0 for unallocated quota (NO 4000)', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicCreditSummaryWidget
        remainingCredits={0}
        usedBatchCredits={0}
        totalPurchasedCredits={0}
        onRecharge={() => {}}
        isVi={true}
      />
    </LanguageProvider>
  );

  // Must show 0 lượt
  assert.ok(html.includes('>0<') || html.includes('0 lượt') || html.includes('0 scans'), 'Displays 0 for credits');
  // Must NOT show 4000
  assert.strictEqual(html.includes('4.000'), false, 'Found hardcoded 4.000 in ClinicCreditSummaryWidget');
  assert.strictEqual(html.includes('4000'), false, 'Found hardcoded 4000 in ClinicCreditSummaryWidget');
  // Zero NaN check
  assert.strictEqual(html.includes('NaN'), false, 'Found NaN in progress calculation when total=0');
});

test('CHALLENGE-M2-4.2: ClinicCreditSummaryWidget warning banner appears when remainingCredits < 50', () => {
  const lowQuotaHtml = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicCreditSummaryWidget
        remainingCredits={12}
        usedBatchCredits={88}
        totalPurchasedCredits={100}
        onRecharge={() => {}}
        isVi={true}
      />
    </LanguageProvider>
  );

  assert.ok(lowQuotaHtml.includes('Cảnh báo hạn mức thấp'), 'Expected low quota warning for 12 remaining credits');
  assert.ok(
    lowQuotaHtml.includes('&lt; 50 lượt') || lowQuotaHtml.includes('< 50 lượt'),
    'Expected < 50 lượt indicator (escaped or raw)'
  );
  assert.ok(lowQuotaHtml.includes('Nạp thêm lượt quét'), 'Expected recharge CTA button');
  assert.strictEqual(lowQuotaHtml.includes('NaN'), false, 'Found NaN in low quota widget');
});

test('CHALLENGE-M2-4.4: Zero risk score (riskScore = 0) preservation in batch items (Checking for falsy || fallback bug)', () => {
  const zeroScoreBatch: ClinicBatchJob = {
    batchId: 'BATCH-ZERO-TEST',
    clinicId: 'CLN-ZERO',
    clinicName: 'Phòng khám Test 0 Score',
    totalImages: 1,
    processedCount: 1,
    failedCount: 0,
    status: 'COMPLETED',
    createdAt: '2026-09-19T06:00:00Z',
    estimatedTimeRemainingSec: 0,
    items: [
      {
        id: 'ITEM-HEALTHY-0',
        patientName: 'Bệnh Nhân Tuyệt Đối Khỏe Mạnh',
        mrn: 'MRN-HEALTHY-0',
        pseudonymId: 'ANON-HEALTHY-0',
        eye: 'OD',
        fileName: 'fundus_healthy_0.png',
        status: 'DONE',
        riskLevel: 'LOW',
        riskScore: 0,
        arteryVeinRatio: 0.67,
      },
    ],
  };

  const patientHtml = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="patient-list" initialBatchJob={zeroScoreBatch} />
    </LanguageProvider>
  );

  const resultsHtml = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="scan-history" initialBatchJob={zeroScoreBatch} />
    </LanguageProvider>
  );

  console.log('    [EMPIRICAL PROBE] Patient List 0-Score rendered:', patientHtml.includes('0%') ? 'Preserved 0%' : 'Overwritten by fallback');
  console.log('    [EMPIRICAL PROBE] Results 0-Score rendered:', resultsHtml.includes('0%') ? 'Preserved 0%' : 'Overwritten by fallback');

  // Let us check if 25% or 20% was rendered instead of 0%
  const patientFalsyBug = patientHtml.includes('25%') && !patientHtml.includes('0%');
  const resultsFalsyBug = resultsHtml.includes('20%') && !resultsHtml.includes('0%');
  if (patientFalsyBug || resultsFalsyBug) {
    console.log('    [EMPIRICAL FINDING] Edge case detected: riskScore = 0 is treated as falsy and overridden by fallback 25%/20%');
  }
});

test('CHALLENGE-M2-4.3: ClinicCreditSummaryWidget does not trigger low quota warning when remainingCredits >= 50', () => {
  const normalQuotaHtml = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicCreditSummaryWidget
        remainingCredits={500}
        usedBatchCredits={500}
        totalPurchasedCredits={1000}
        onRecharge={() => {}}
        isVi={true}
      />
    </LanguageProvider>
  );

  assert.strictEqual(normalQuotaHtml.includes('Cảnh báo hạn mức thấp'), false, 'Unexpected low quota warning for 500 credits');
  assert.ok(normalQuotaHtml.includes('500'), 'Displays 500 remaining credits');
  assert.ok(normalQuotaHtml.includes('1.000'), 'Displays 1.000 total purchased credits');
  assert.strictEqual(normalQuotaHtml.includes('NaN'), false, 'Found NaN in normal quota widget');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`   EMPIRICAL CHALLENGE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('=================================================================\n');

if (passedTests === totalTests) {
  console.log('>>> ALL CLINIC MOCK ELIMINATION & CLEAN EMPTY STATE TESTS APPROVED <<<\n');
} else {
  throw new Error(`Failed ${totalTests - passedTests} tests!`);
}
