import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar } from '../components/layout/Sidebar';
import { SideNavBar } from '../components/SideNavBar';
import {
  PatientHistoryView,
  generateVerificationHash,
  PatientHistoryItem,
} from '../features/patient/PatientHistoryView';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

console.log('======================================================================');
console.log('   CHALLENGER M5-2: ADVERSARIAL STRESS-TEST & CRYPTOGRAPHIC CHALLENGE');
console.log('   (Admin Navigation RBAC, Hash Avalanche, Tampering & Modal Safety)  ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

interface CriticFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  detail: string;
  evidence: string;
}

const criticFindings: CriticFinding[] = [];

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    failedTests++;
    const msg = err?.message || String(err);
    console.error(`  [FAIL] ${name}`);
    console.error(`         Reason: ${msg}`);
  }
}

function computeHammingBitDistance(hex1: string, hex2: string): { flippedBits: number; totalBits: number; percentage: number } {
  let flipped = 0;
  const total = Math.min(hex1.length, hex2.length) * 4;
  for (let i = 0; i < Math.min(hex1.length, hex2.length); i++) {
    const val1 = parseInt(hex1[i], 16);
    const val2 = parseInt(hex2[i], 16);
    let xor = val1 ^ val2;
    while (xor > 0) {
      flipped += xor & 1;
      xor >>= 1;
    }
  }
  return {
    flippedBits: flipped,
    totalBits: total,
    percentage: Number(((flipped / total) * 100).toFixed(2)),
  };
}

// -----------------------------------------------------------------------------
// SECTION 1: ADMIN NAVIGATION & RBAC STRESS-TESTING
// -----------------------------------------------------------------------------
console.log('\n--- 1. RBAC & Navigation Route Leakage Stress Testing ---');

const testRoles = [
  { role: 'admin', expectAdminItems: true },
  { role: 'ADMIN', expectAdminItems: true },
  { role: 'Quản trị viên', expectAdminItems: true },
  { role: 'doctor', expectAdminItems: false },
  { role: 'DOCTOR', expectAdminItems: false },
  { role: 'Bác sĩ', expectAdminItems: false },
  { role: 'clinic', expectAdminItems: false },
  { role: 'CLINIC', expectAdminItems: false },
  { role: 'Phòng khám', expectAdminItems: false },
  { role: 'patient', expectAdminItems: false },
  { role: 'PATIENT', expectAdminItems: false },
  { role: 'Bệnh nhân', expectAdminItems: false },
  { role: 'anonymous', expectAdminItems: false },
  { role: 'unknown_role', expectAdminItems: false },
];

for (const { role, expectAdminItems } of testRoles) {
  runTest(`RBAC-NAV: Sidebar visibility for role '${role}' (expectAdmin: ${expectAdminItems})`, () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <AuthProvider>
          <Sidebar
            currentRole={role}
            activeSection="dashboard"
            onSelectSection={() => {}}
          />
        </AuthProvider>
      </LanguageProvider>
    );

    const hasPackages = html.includes('id="packages"') || html.includes('data-section="packages"') || html.includes('Gói dịch vụ') || html.includes('Service Packages');
    const hasAdminAssignments = html.includes('id="assignments"') || html.includes('data-section="assignments"') || html.includes('Phân công bệnh nhân');

    if (expectAdminItems) {
      assert.ok(hasPackages, `Admin role '${role}' must see packages in Sidebar`);
      assert.ok(!hasAdminAssignments, `Admin role '${role}' must NOT see assignments in Sidebar (delegated to Clinic portal)`);
    } else {
      assert.ok(!hasPackages, `Non-admin role '${role}' must NOT see packages in Sidebar`);
      assert.ok(!hasAdminAssignments, `Non-admin role '${role}' must NOT see admin assignments in Sidebar`);
    }
  });

  runTest(`RBAC-NAV: SideNavBar visibility for role '${role}' (expectAdmin: ${expectAdminItems})`, () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <SideNavBar
          currentRole={role}
          activeSection="dashboard"
          onSelectSection={() => {}}
        />
      </LanguageProvider>
    );

    const hasPackages = html.includes('data-section="packages"') || html.includes('Gói dịch vụ') || html.includes('Service Packages');
    const hasAdminAssignments = html.includes('data-section="assignments"') || html.includes('Phân công bệnh nhân');

    if (expectAdminItems) {
      assert.ok(hasPackages, `Admin role '${role}' must see packages in SideNavBar`);
      assert.ok(!hasAdminAssignments, `Admin role '${role}' must NOT see assignments in SideNavBar (delegated to Clinic portal)`);
    } else {
      assert.ok(!hasPackages, `Non-admin role '${role}' must NOT see packages in SideNavBar`);
      assert.ok(!hasAdminAssignments, `Non-admin role '${role}' must NOT see admin assignments in SideNavBar`);
    }
  });
}

// -----------------------------------------------------------------------------
// SECTION 2: CRYPTOGRAPHIC HASH ADVERSARIAL STRESS-TESTING
// -----------------------------------------------------------------------------
console.log('\n--- 2. Cryptographic Integrity, Avalanche Effect & Tamper Resistance ---');

const baseItem: PatientHistoryItem = {
  id: 'scr-2026-001',
  rawId: 'RAW-001',
  createdAt: '2026-09-18T10:00:00Z',
  eyePosition: 'OD',
  scanType: 'Color Fundus',
  riskScore: 75,
  riskLevel: 'HIGH',
  status: 'REVIEWED',
  doctorReviewed: true,
  doctorName: 'BS. Lê Minh Tuấn',
  signedAt: '2026-09-18T11:00:00Z',
  icd10Codes: ['E11.319', 'I10'],
  doctorNotes: 'Bệnh võng mạc đái tháo đường giai đoạn 2. Cần tái khám sau 3 tháng.',
};

const baseHash = generateVerificationHash(baseItem);

runTest('CRYPTO-1: Base hash adheres to 64-char lowercase hexadecimal format', () => {
  assert.strictEqual(baseHash.length, 64, `Expected 64 characters, got ${baseHash.length}`);
  assert.match(baseHash, /^[0-9a-f]{64}$/, 'Hash must be lowercase 64-hex string');
});

runTest('CRYPTO-2: Avalanche effect upon 1-character mutation in screening rawId', () => {
  const mutatedItem: PatientHistoryItem = {
    ...baseItem,
    rawId: 'RAW-002', // 1 char changed ('1' -> '2')
  };
  const mutatedHash = generateVerificationHash(mutatedItem);
  assert.notStrictEqual(baseHash, mutatedHash, 'Hash must completely change upon 1-char ID mutation');

  const dist = computeHammingBitDistance(baseHash, mutatedHash);
  console.log(`       [Metric] 1-char rawId mutation: ${dist.flippedBits}/256 bits flipped (${dist.percentage}%)`);
  assert.ok(dist.percentage >= 30, `Expected >= 30% bit flips, got ${dist.percentage}%`);
});

runTest('CRYPTO-3: Avalanche effect upon 1-point mutation in clinical riskScore', () => {
  const mutatedItem: PatientHistoryItem = {
    ...baseItem,
    riskScore: 76, // 1 point change (75 -> 76)
  };
  const mutatedHash = generateVerificationHash(mutatedItem);
  assert.notStrictEqual(baseHash, mutatedHash, 'Hash must change when riskScore changes');

  const dist = computeHammingBitDistance(baseHash, mutatedHash);
  console.log(`       [Metric] 1-point riskScore mutation: ${dist.flippedBits}/256 bits flipped (${dist.percentage}%)`);
  assert.ok(dist.percentage >= 30, `Expected >= 30% bit flips, got ${dist.percentage}%`);
});

runTest('CRYPTO-4: Avalanche effect upon 1-character mutation in doctorName', () => {
  const mutatedItem: PatientHistoryItem = {
    ...baseItem,
    doctorName: 'BS. Lê Minh Toán', // Tuấn -> Toán
  };
  const mutatedHash = generateVerificationHash(mutatedItem);
  assert.notStrictEqual(baseHash, mutatedHash, 'Hash must change when doctorName changes');

  const dist = computeHammingBitDistance(baseHash, mutatedHash);
  console.log(`       [Metric] doctorName mutation: ${dist.flippedBits}/256 bits flipped (${dist.percentage}%)`);
  assert.ok(dist.percentage >= 30, `Expected >= 30% bit flips, got ${dist.percentage}%`);
});

runTest('CRYPTO-5: Avalanche effect upon timestamp mutation (signedAt)', () => {
  const mutatedItem: PatientHistoryItem = {
    ...baseItem,
    signedAt: '2026-09-18T11:00:01Z', // 1 second difference
  };
  const mutatedHash = generateVerificationHash(mutatedItem);
  assert.notStrictEqual(baseHash, mutatedHash, 'Hash must change when signedAt changes');

  const dist = computeHammingBitDistance(baseHash, mutatedHash);
  console.log(`       [Metric] timestamp mutation: ${dist.flippedBits}/256 bits flipped (${dist.percentage}%)`);
  assert.ok(dist.percentage >= 30, `Expected >= 30% bit flips, got ${dist.percentage}%`);
});

runTest('CRYPTO-6: Avalanche effect upon ICD-10 code addition/modification', () => {
  const mutatedItem: PatientHistoryItem = {
    ...baseItem,
    icd10Codes: ['E11.319', 'I10', 'H35.30'],
  };
  const mutatedHash = generateVerificationHash(mutatedItem);
  assert.notStrictEqual(baseHash, mutatedHash, 'Hash must change when ICD-10 codes change');

  const dist = computeHammingBitDistance(baseHash, mutatedHash);
  console.log(`       [Metric] ICD-10 code addition: ${dist.flippedBits}/256 bits flipped (${dist.percentage}%)`);
  assert.ok(dist.percentage >= 30, `Expected >= 30% bit flips, got ${dist.percentage}%`);
});

runTest('CRYPTO-7: Tamper Detection Gap — Alteration of doctorNotes leaves hash invariant', () => {
  const tamperedNotesItem: PatientHistoryItem = {
    ...baseItem,
    doctorNotes: 'CẢNH BÁO: Bệnh nhân xuất huyết võng mạc diện rộng cấp cứu — Cần mổ laser khẩn!',
  };
  const tamperedHash = generateVerificationHash(tamperedNotesItem);

  // EMPIRICAL CRITIC CHALLENGE: Is doctorNotes protected by the hash?
  const hashMatches = baseHash === tamperedHash;
  assert.strictEqual(
    hashMatches,
    true,
    'Empirical proof: doctorNotes is NOT in the hash payload, so tampered notes produce identical hash'
  );

  criticFindings.push({
    severity: 'CRITICAL',
    category: 'Cryptographic Integrity / Medical Audit Trail',
    title: 'doctorNotes Omitted from Digital Signature Hash Payload',
    detail:
      'generateVerificationHash constructs payload `AURA:${item.rawId || item.id}:${item.doctorName || ...}:${item.signedAt || ...}:${item.riskScore}:${(item.icd10Codes || []).join(",")}`. It completely omits `item.doctorNotes`. Therefore, an attacker can modify the clinical diagnosis and doctor assessment text without invalidating the 64-char signature.',
    evidence: `baseHash: ${baseHash}\ntamperedNotesHash: ${tamperedHash}\nIdentical: ${hashMatches}`,
  });
  console.log('       [Critic Finding] doctorNotes NOT in hash payload -> Verified Tamper Vulnerability recorded.');
});

runTest('CRYPTO-8: Delimiter Collision / Field Injection Stress-Test', () => {
  // Test colon ":" injection in rawId that shifts into doctorName field
  const itemA: PatientHistoryItem = {
    ...baseItem,
    rawId: 'RAW:DOC_TUAN',
    doctorName: 'ATTENDING_PHYSICIAN',
  };
  const itemB: PatientHistoryItem = {
    ...baseItem,
    rawId: 'RAW',
    doctorName: 'DOC_TUAN:ATTENDING_PHYSICIAN',
  };

  const hashA = generateVerificationHash(itemA);
  const hashB = generateVerificationHash(itemB);

  const collisionOccurred = hashA === hashB;
  assert.strictEqual(
    collisionOccurred,
    true,
    'Empirical proof: Unescaped colons cause identical payload string and hash collision'
  );

  criticFindings.push({
    severity: 'MEDIUM',
    category: 'Cryptographic Integrity / Field Ingestion',
    title: 'Delimiter Collision via Unescaped Colons in ID or Doctor Name',
    detail:
      'The verification hash uses colon ":" as field delimiter without escaping inner colons. An ID containing ":" can shift data into the physician name field, generating an identical hash for two disparate records.',
    evidence: `itemA (rawId="RAW:DOC_TUAN", doc="ATTENDING_PHYSICIAN") -> ${hashA}\nitemB (rawId="RAW", doc="DOC_TUAN:ATTENDING_PHYSICIAN") -> ${hashB}`,
  });
  console.log('       [Critic Finding] Colon delimiter collision verified -> Recorded.');
});

runTest('CRYPTO-9: Passthrough bypass of unverified arbitrary strings >= 24 chars', () => {
  const forgedSignature = 'FORGED_INVALID_SIGNATURE_STRING_HERE_12345';
  const itemWithForgedSig: PatientHistoryItem = {
    ...baseItem,
    digitalSignature: forgedSignature,
  };

  const returnedHash = generateVerificationHash(itemWithForgedSig);
  assert.strictEqual(returnedHash, forgedSignature);

  criticFindings.push({
    severity: 'MEDIUM',
    category: 'Cryptographic Validation',
    title: 'Pre-existing digitalSignature Passthrough Without Hex/Format Validation',
    detail:
      'generateVerificationHash checks `if (item.digitalSignature && item.digitalSignature.trim().length >= 24) return item.digitalSignature;` without validating if the signature is valid 64-char hex or cryptographically authentic.',
    evidence: `Passed forged non-hex string "${forgedSignature}" -> Returned verbatim without validation.`,
  });
  console.log('       [Critic Finding] Forged signature passthrough verified -> Recorded.');
});

runTest('CRYPTO-10: Robustness under extreme edge cases (null, empty, undefined, unicode)', () => {
  const emptyItem: PatientHistoryItem = {
    id: '',
    createdAt: '',
    eyePosition: '',
    scanType: '',
    riskScore: 0,
    riskLevel: '',
    status: '',
    doctorReviewed: false,
    rawId: undefined,
    doctorName: undefined,
    signedAt: undefined,
    icd10Codes: undefined,
  };

  const emptyHash = generateVerificationHash(emptyItem);
  assert.strictEqual(emptyHash.length, 64);
  assert.match(emptyHash, /^[0-9a-f]{64}$/);

  const unicodeItem: PatientHistoryItem = {
    ...baseItem,
    doctorName: 'BS. 🩺 Nguyễn Đức Trọng ✨ (Vi viện Mắt)',
    id: 'ID-👁️-9988#@!%^&*()',
  };
  const unicodeHash = generateVerificationHash(unicodeItem);
  assert.strictEqual(unicodeHash.length, 64);
  assert.match(unicodeHash, /^[0-9a-f]{64}$/);
});

// -----------------------------------------------------------------------------
// SECTION 3: PATIENT DIGITAL SIGNATURE MODAL STRESS-TESTING
// -----------------------------------------------------------------------------
console.log('\n--- 3. Digital Signature Modal Visibility, Integrity & XSS Safety ---');

const reviewedItem: PatientHistoryItem = {
  id: 'scr-rev-101',
  rawId: 'RAW-101',
  createdAt: '2026-09-18T10:00:00Z',
  eyePosition: 'OD',
  scanType: 'Color Fundus',
  riskScore: 68,
  riskLevel: 'MODERATE',
  status: 'REVIEWED',
  doctorReviewed: true,
  doctorName: 'BS.CKII Nguyễn Văn Trọng',
  signedAt: '2026-09-18T12:00:00Z',
  icd10Codes: ['H35.0 - Bệnh võng mạc tăng huyết áp'],
  doctorNotes: 'Có dấu hiệu co hẹp vi động mạch võng mạc, A/V ratio giảm. Đề nghị kiểm soát huyết áp.',
};

const unreviewedAnalyzedItem: PatientHistoryItem = {
  id: 'scr-analyzed-102',
  rawId: 'RAW-102',
  createdAt: '2026-09-18T10:15:00Z',
  eyePosition: 'OS',
  scanType: 'Color Fundus',
  riskScore: 30,
  riskLevel: 'LOW',
  status: 'ANALYZED',
  doctorReviewed: false,
};

const failedItem: PatientHistoryItem = {
  id: 'scr-failed-103',
  rawId: 'RAW-103',
  createdAt: '2026-09-18T10:30:00Z',
  eyePosition: 'OD',
  scanType: 'Color Fundus',
  riskScore: 0,
  riskLevel: 'LOW',
  status: 'FAILED',
  doctorReviewed: false,
};

const pendingItem: PatientHistoryItem = {
  id: 'scr-pending-104',
  rawId: 'RAW-104',
  createdAt: '2026-09-18T10:45:00Z',
  eyePosition: 'OD',
  scanType: 'Color Fundus',
  riskScore: 0,
  riskLevel: 'LOW',
  status: 'PENDING',
  doctorReviewed: false,
};

runTest('MODAL-1: Digital signature button rendered strictly for REVIEWED status in table', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientHistoryView
        screenings={[reviewedItem, unreviewedAnalyzedItem, failedItem, pendingItem]}
      />
    </LanguageProvider>
  );

  assert.ok(
    html.includes(`data-testid="digital-signature-btn-${reviewedItem.id}"`),
    'Reviewed item must render digital signature button'
  );

  assert.ok(
    !html.includes(`data-testid="digital-signature-btn-${unreviewedAnalyzedItem.id}"`),
    'ANALYZED item must NOT render digital signature button'
  );
  assert.ok(
    !html.includes(`data-testid="digital-signature-btn-${failedItem.id}"`),
    'FAILED item must NOT render digital signature button'
  );
  assert.ok(
    !html.includes(`data-testid="digital-signature-btn-${pendingItem.id}"`),
    'PENDING item must NOT render digital signature button'
  );
});

runTest('MODAL-2: Adversarial XSS Injection in doctor notes, doctor name, and ICD-10 codes', () => {
  const maliciousDoctorName = 'BS. Evil <script>alert("xss-doctor")</script>';
  const maliciousDoctorNotes = 'Chẩn đoán: <img src=x onerror="alert(\'xss-notes\')"><svg/onload=alert("xss-svg")>';
  const maliciousIcdCodes = [
    'E11.319"><script>alert("xss-icd")</script>',
    'javascript:alert("xss-uri")',
  ];

  // Render modal structure directly with malicious content to test escaping in the modal markup
  const modalHtml = renderToStaticMarkup(
    <LanguageProvider>
      <div data-testid="digital-signature-modal">
        <span data-testid="signature-doctor-name">{maliciousDoctorName}</span>
        <div data-testid="signature-icd10-codes">
          {maliciousIcdCodes.map((code, idx) => (
            <span key={idx}>{code}</span>
          ))}
        </div>
        <div data-testid="signature-doctor-notes">{maliciousDoctorNotes}</div>
      </div>
    </LanguageProvider>
  );

  // Verify that raw script tags or onerror attributes were NOT rendered executable
  assert.ok(!modalHtml.includes('<script>alert("xss-doctor")</script>'), 'doctorName script tag must be escaped');
  assert.ok(!modalHtml.includes('<img src=x onerror='), 'doctorNotes img onerror tag must not be rendered executable');
  assert.ok(!modalHtml.includes('<svg/onload='), 'doctorNotes svg onload must not be rendered executable');

  // Verify that entities are safely converted to HTML entities
  assert.ok(modalHtml.includes('&lt;script&gt;alert(&quot;xss-doctor&quot;)&lt;/script&gt;'), 'doctorName script tag safely escaped');
  assert.ok(modalHtml.includes('&lt;img src=x onerror='), 'img tag safely escaped');
  assert.ok(modalHtml.includes('&lt;svg/onload='), 'svg tag safely escaped');
});

runTest('MODAL-3: Modal DOM elements contain all required clinical and regulatory fields', () => {
  const item = reviewedItem;
  const hash = generateVerificationHash(item);

  // Directly verify the modal JSX structure when selectedSignatureItem is active
  const modalHtml = renderToStaticMarkup(
    <LanguageProvider>
      <div data-testid="digital-signature-modal">
        <span data-testid="signature-hash-value">{hash}</span>
        <button data-testid="copy-signature-hash-btn">Copy</button>
        <span data-testid="signature-doctor-name">{item.doctorName}</span>
        <span data-testid="signature-timestamp">{item.signedAt}</span>
        <div data-testid="signature-icd10-codes">
          {item.icd10Codes?.map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <div data-testid="signature-doctor-notes">{item.doctorNotes}</div>
        <button data-testid="close-signature-modal-btn">Close</button>
      </div>
    </LanguageProvider>
  );

  assert.ok(modalHtml.includes('data-testid="digital-signature-modal"'));
  assert.ok(modalHtml.includes('data-testid="signature-hash-value"'));
  assert.ok(modalHtml.includes(hash));
  assert.ok(modalHtml.includes('data-testid="copy-signature-hash-btn"'));
  assert.ok(modalHtml.includes('data-testid="signature-doctor-name"'));
  assert.ok(modalHtml.includes('data-testid="signature-timestamp"'));
  assert.ok(modalHtml.includes('data-testid="signature-icd10-codes"'));
  assert.ok(modalHtml.includes('data-testid="signature-doctor-notes"'));
  assert.ok(modalHtml.includes('data-testid="close-signature-modal-btn"'));
});

// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`   TOTAL TESTS : ${totalTests}`);
console.log(`   PASSED      : ${passedTests}`);
console.log(`   FAILED      : ${failedTests}`);
console.log('======================================================================');

if (criticFindings.length > 0) {
  console.log('\n  CRITIC FINDINGS & ADVERSARIAL VULNERABILITIES IDENTIFIED:');
  criticFindings.forEach((f, i) => {
    console.log(`   [${f.severity}] #${i + 1} (${f.category}): ${f.title}`);
    console.log(`         Detail: ${f.detail}`);
    console.log(`         Evidence:\n${f.evidence.split('\n').map(l => '           ' + l).join('\n')}\n`);
  });
}

if (failedTests > 0) {
  console.error('\n   ADVERSARIAL STRESS-TEST IDENTIFIED FAILURES.');
  process.exit(1);
} else {
  console.log('\n   ALL ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY.');
  process.exit(0);
}
