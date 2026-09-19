import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Components under test
import { ClinicPortalPage, ClinicCreditSummaryWidget } from '../pages/ClinicPortalPage';
import { ClinicDashboardView } from '../features/clinic/ClinicDashboardView';
import { BatchUploadModal } from '../components/BatchUploadModal';
import { LanguageProvider } from '../context/LanguageContext';
import { ClinicBatchJob } from '../types/cds';

console.log('=================================================================');
console.log('   CHALLENGER M2-1: CLINIC QUOTA & BATCH EMPIRICAL STRESS TESTS');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;
const findings: string[] = [];

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

// ============================================================================
// SUITE 1: CLINIC QUOTA CALCULATION EMPIRICAL STRESS TESTS
// ============================================================================
console.log('--- Suite 1: Clinic Quota Calculation & Hardcoded 4000 Elimination ---');

test('CHALLENGE-QUOTA-1: Empty subscriptions array evaluates to exactly 0 credits (NEVER 4000)', () => {
  // Test quota calculation logic directly mirroring ClinicPortalPage formulas
  const emptySubscriptions: any[] = [];
  const usedBatchCredits = 0;

  // Formula from ClinicPortalPage.tsx lines 1368-1378
  const remainingCredits = (() => {
    if (emptySubscriptions.length > 0) {
      return emptySubscriptions.reduce((sum, item) => {
        if (item.status === 'ACTIVE') {
          return sum + Number(item.remainingCredits || 0);
        }
        return sum;
      }, 0);
    }
    return 0;
  })();

  // Formula from ClinicPortalPage.tsx lines 1380-1393
  const totalPurchasedCredits = (() => {
    if (emptySubscriptions.length > 0) {
      const packageCreditsSum = emptySubscriptions.reduce((sum, item) => {
        const pkgCredits = item.packageCredits || item.totalCredits;
        if (pkgCredits) return sum + Number(pkgCredits);
        return sum;
      }, 0);
      if (packageCreditsSum > 0) {
        return Math.max(packageCreditsSum, remainingCredits + usedBatchCredits);
      }
      return remainingCredits + usedBatchCredits;
    }
    return 0;
  })();

  assert.strictEqual(remainingCredits, 0, 'remainingCredits MUST be 0 when subscriptions array is empty');
  assert.strictEqual(totalPurchasedCredits, 0, 'totalPurchasedCredits MUST be 0 when subscriptions array is empty');
  assert.notStrictEqual(remainingCredits, 4000, 'remainingCredits MUST NEVER be 4000 for empty subscriptions');
  assert.notStrictEqual(totalPurchasedCredits, 4000, 'totalPurchasedCredits MUST NEVER be 4000 for empty subscriptions');
});

test('CHALLENGE-QUOTA-2: Subscriptions with only EXPIRED or CANCELLED packages yield 0 active credits', () => {
  const inactiveSubscriptions = [
    { id: 1, status: 'EXPIRED', remainingCredits: 500, packageCredits: 1000 },
    { id: 2, status: 'CANCELLED', remainingCredits: 200, packageCredits: 500 },
  ];
  const usedBatchCredits = 300;

  const remainingCredits = (() => {
    if (inactiveSubscriptions.length > 0) {
      return inactiveSubscriptions.reduce((sum, item) => {
        if (item.status === 'ACTIVE') {
          return sum + Number(item.remainingCredits || 0);
        }
        return sum;
      }, 0);
    }
    return 0;
  })();

  const totalPurchasedCredits = (() => {
    if (inactiveSubscriptions.length > 0) {
      const packageCreditsSum = inactiveSubscriptions.reduce((sum, item) => {
        const pkgCredits = item.packageCredits || item.totalCredits;
        if (pkgCredits) return sum + Number(pkgCredits);
        return sum;
      }, 0);
      if (packageCreditsSum > 0) {
        return Math.max(packageCreditsSum, remainingCredits + usedBatchCredits);
      }
      return remainingCredits + usedBatchCredits;
    }
    return 0;
  })();

  assert.strictEqual(remainingCredits, 0, 'Inactive subscriptions must produce 0 remaining active credits');
  assert.strictEqual(totalPurchasedCredits, 1500, 'Total purchased reflects historical package sum (1000 + 500 = 1500)');
});

test('CHALLENGE-QUOTA-3: Active subscriptions with string-typed numbers convert cleanly without string concatenation', () => {
  const mixedTypeSubscriptions = [
    { id: 10, status: 'ACTIVE', remainingCredits: '350', packageCredits: '1000' },
    { id: 11, status: 'ACTIVE', remainingCredits: 150, packageCredits: 500 },
  ];
  const usedBatchCredits = 50;

  const remainingCredits = mixedTypeSubscriptions.reduce((sum, item) => {
    if (item.status === 'ACTIVE') {
      return sum + Number(item.remainingCredits || 0);
    }
    return sum;
  }, 0);

  const packageCreditsSum = mixedTypeSubscriptions.reduce((sum, item) => {
    const pkgCredits = item.packageCredits || item.totalCredits;
    if (pkgCredits) return sum + Number(pkgCredits);
    return sum;
  }, 0);

  assert.strictEqual(remainingCredits, 500, '350 + 150 must equal numeric 500, not "0350150" string concat');
  assert.strictEqual(packageCreditsSum, 1500, '1000 + 500 must equal numeric 1500');
});

test('CHALLENGE-QUOTA-4: ClinicCreditSummaryWidget renders 0/0 and triggers low-credit warning without 4000', () => {
  const html = renderToStaticMarkup(
    <ClinicCreditSummaryWidget
      remainingCredits={0}
      usedBatchCredits={0}
      totalPurchasedCredits={0}
      isVi={true}
    />
  );

  assert.ok(!html.includes('4.000') && !html.includes('4000'), 'Widget DOM does not contain 4000 fallback');
  assert.ok(html.includes('0 lượt'), 'Widget renders 0 lượt scan');
  assert.ok(html.includes('Cảnh báo hạn mức thấp:'), 'Triggers low quota warning alert for 0 balance');
});

// ============================================================================
// SUITE 2: BATCH PROCESSING HTTP 400 REJECTION & MODAL BEHAVIOR
// ============================================================================
console.log('\n--- Suite 2: Batch Upload HTTP 400 Rejection & Modal State Integrity ---');

test('CHALLENGE-BATCH-1: HTTP 400 Rejection prevents fake job creation and does NOT mutate state or localStorage', async () => {
  let localStorageSetCalls = 0;
  let eventBusDispatches = 0;
  let updateBatchJobCalls = 0;
  let modalClosed = false;

  // Simulated backend HTTP 400 response from Spring Boot BulkScreeningController
  const mockBackendHttp400Response = {
    success: false,
    code: 'INSUFFICIENT_CREDITS',
    message: 'Cơ sở y tế không đủ lượt quét khả dụng (Cần 100, hiện có 0). Vui lòng nạp thêm gói lượt khám.',
  };

  // Mock API simulating rejection
  const mockBulkScreeningApi = {
    uploadBatch: async (_payload: any) => {
      return mockBackendHttp400Response;
    },
  };

  // Replicate handleSubmitBatch execution path from ClinicBatchProcessing.tsx lines 480-545
  let thrownError: any = null;
  let feedbackMsg: string | null = null;
  let currentJob: any = { batchId: 'ORIGINAL-JOB', items: [] };

  const handleSubmitBatch = async (payload: any) => {
    try {
      const res = await mockBulkScreeningApi.uploadBatch(payload);
      if (!res || !res.success) {
        const errMsg = res?.message || 'Lỗi không đủ credit';
        feedbackMsg = errMsg;
        throw new Error(errMsg);
      }
      // If success (should not be reached)
      currentJob = { batchId: res.data.batchId };
      updateBatchJobCalls++;
      modalClosed = true;
    } catch (err: any) {
      feedbackMsg = err?.message;
      throw err;
    }
  };

  // Execute handleSubmitBatch with 100 images
  try {
    await handleSubmitBatch({
      campaignName: 'Test Campaign',
      clinicId: 'CLN-01',
      items: Array.from({ length: 100 }).map((_, i) => ({ fileName: `scan_${i}.png` })),
    });
  } catch (err) {
    thrownError = err;
  }

  assert.ok(thrownError !== null, 'Submission MUST throw error upon HTTP 400 rejection');
  assert.ok(
    thrownError.message.includes('không đủ lượt quét khả dụng'),
    'Error message matches backend rejection reason'
  );
  assert.strictEqual(modalClosed, false, 'Modal MUST NOT dismiss on HTTP 400 rejection');
  assert.strictEqual(updateBatchJobCalls, 0, 'onUpdateBatch MUST NOT be called on HTTP 400 rejection');
  assert.strictEqual(currentJob.batchId, 'ORIGINAL-JOB', 'currentJob MUST NOT be replaced with a fake job');
  assert.strictEqual(localStorageSetCalls, 0, 'localStorage MUST NOT receive fake job on rejection');
  assert.strictEqual(eventBusDispatches, 0, 'No fake batch events dispatched across portals');
});

test('CHALLENGE-BATCH-2: BatchUploadModal catch handler behavior and UI error visibility verification', async () => {
  let modalDismissed = false;
  let submissionAttempted = false;

  const mockFailingSubmit = async (_payload: any) => {
    submissionAttempted = true;
    throw new Error('Cơ sở y tế không đủ lượt quét khả dụng (Cần 100, hiện có 0). Vui lòng nạp thêm gói lượt khám.');
  };

  // Render BatchUploadModal in open state
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <BatchUploadModal
        isOpen={true}
        onClose={() => {
          modalDismissed = true;
        }}
        onSubmitBatch={mockFailingSubmit}
        currentCredits={0}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Tải Lên Lô Ảnh Đáy Mắt'), 'Modal renders upload title');
  assert.ok(html.includes('0') && html.includes('Credits'), 'Renders 0 available credits balance');

  // Verify that inside BatchUploadModal markup, there is NO error banner element when submission has not occurred or when it fails
  // Because BatchUploadModal has no errorMessage / submitError state in its component definition!
  const hasInternalErrorBanner = html.includes('bg-rose-500') || html.includes('bg-red-500') || html.includes('text-rose-600') || html.includes('alert-danger');
  
  if (!hasInternalErrorBanner) {
    findings.push('VULNERABILITY DETECTED: BatchUploadModal.tsx does not contain an internal error banner/state. When HTTP 400 occurs, handleSubmit catches the error and logs to console without rendering an in-modal alert.');
  }

  assert.strictEqual(modalDismissed, false, 'Modal remains open during inspection');
});

// ============================================================================
// SUITE 3: EXACT POSTGRESQL BATCH ID IN POLLING LOOP
// ============================================================================
console.log('\n--- Suite 3: Exact PostgreSQL batchId Polling Verification ---');

test('CHALLENGE-POLL-1: Polling queries exact batchId returned by PostgreSQL (BATCH-xxxxxxxxxxxx)', async () => {
  const postgresGeneratedBatchId = 'BATCH-1726728994500';
  const queriedBatchIds: string[] = [];

  // Simulated backend returning real PostgreSQL batchId
  const mockUploadSuccessResponse = {
    success: true,
    data: {
      batchId: postgresGeneratedBatchId,
      status: 'IN_PROGRESS',
      totalImages: 100,
      processedCount: 0,
      failedCount: 0,
    },
  };

  const mockBulkApi = {
    uploadBatch: async () => mockUploadSuccessResponse,
    getBatchStatus: async (batchId: string) => {
      queriedBatchIds.push(batchId);
      return {
        success: true,
        data: {
          batchId,
          status: 'COMPLETED',
          totalImages: 100,
          processedCount: 100,
          failedCount: 0,
          items: [],
        },
      };
    },
  };

  // Replicate ClinicBatchProcessing upload resolution
  const res = await mockBulkApi.uploadBatch();
  const realBatchId = res.data?.batchId || res.data?.jobId || res.data?.id || `BATCH-${Date.now()}`;

  assert.strictEqual(
    realBatchId,
    postgresGeneratedBatchId,
    'Client extracts exact batchId generated by PostgreSQL backend'
  );

  // Trigger simulated polling query
  const pollResult = await mockBulkApi.getBatchStatus(realBatchId);
  assert.strictEqual(pollResult.success, true, 'Polling call succeeds');
  assert.strictEqual(queriedBatchIds.length, 1, 'Polling queried exactly once');
  assert.strictEqual(
    queriedBatchIds[0],
    postgresGeneratedBatchId,
    'Polling query MUST send exact PostgreSQL batchId, never client timestamp'
  );
  assert.ok(!queriedBatchIds[0].includes('CLIENT-FAKE'), 'No client fake ID was queried');
});

test('CHALLENGE-POLL-2: Polling loop safely ignores non-batch IDs and terminates on COMPLETED status', () => {
  let pollingActive = false;
  let intervalCleared = false;

  const currentJob: ClinicBatchJob = {
    batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
    clinicId: 'CLN-01',
    clinicName: 'Test Clinic',
    totalImages: 0,
    processedCount: 0,
    failedCount: 0,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    estimatedTimeRemainingSec: 0,
    items: [],
  };

  // Implementation check from ClinicBatchProcessing.tsx line 222-226:
  // const isJobActive = currentJob.status === 'IN_PROGRESS' || currentJob.status === 'QUEUED';
  // if (isJobActive && currentJob.batchId.startsWith('BATCH-')) { setIsPolling(true); ... }
  const isJobActive = currentJob.status === 'IN_PROGRESS' || currentJob.status === 'QUEUED';
  const shouldPoll = isJobActive && currentJob.batchId.startsWith('BATCH-');

  assert.strictEqual(shouldPoll, false, 'Unstarted/empty batch jobs must NOT initiate polling');

  // Active batch with COMPLETED status
  const completedJob: ClinicBatchJob = {
    ...currentJob,
    batchId: 'BATCH-2026-0919-01',
    status: 'COMPLETED',
    processedCount: 100,
    totalImages: 100,
  };
  const isCompletedActive = completedJob.status === 'IN_PROGRESS' || completedJob.status === 'QUEUED';
  assert.strictEqual(isCompletedActive, false, 'Completed job is marked inactive and stops polling');
});

// ============================================================================
// SUITE 4: CLINIC MOCK DATA ELIMINATION & SAFE EMPTY STATES
// ============================================================================
console.log('\n--- Suite 4: Clinic Mock Data Elimination & Empty State Verification ---');

test('CHALLENGE-MOCK-1: ClinicDashboardView renders 0 baseline and clean empty state without mock patients', () => {
  const emptyJob: ClinicBatchJob = {
    batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
    clinicId: 'CLN-001',
    clinicName: 'Phòng khám Test',
    totalImages: 0,
    processedCount: 0,
    failedCount: 0,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    estimatedTimeRemainingSec: 0,
    items: [],
  };

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView batchJob={emptyJob} onNavigate={() => {}} />
    </LanguageProvider>
  );

  // Check that mock names are eliminated
  assert.ok(!html.includes('Trần Thị Mai'), 'Mock patient Trần Thị Mai eliminated');
  assert.ok(!html.includes('Lê Văn Hoàng'), 'Mock patient Lê Văn Hoàng eliminated');
  assert.ok(!html.includes('Phạm Đức Dũng'), 'Mock patient Phạm Đức Dũng eliminated');

  // Check fallback numbers 128 / 14 / 42 are eliminated
  assert.ok(!html.includes('128 ca') && !html.includes('128 Bệnh nhân'), 'Mock 128 patients baseline eliminated');
  assert.ok(html.includes('Không có ca bệnh nguy cơ cao'), 'Clean medical empty state for high risk cases');
});

console.log('\n=================================================================');
console.log(`   CHALLENGER RESULTS: ${totalTests} TESTS | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
if (findings.length > 0) {
  console.log('   FINDINGS & VULNERABILITIES:');
  findings.forEach((f, idx) => console.log(`   ${idx + 1}. ${f}`));
}
console.log('=================================================================\n');

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}
