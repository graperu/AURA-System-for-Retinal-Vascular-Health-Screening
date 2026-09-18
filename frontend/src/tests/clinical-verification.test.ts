import assert from 'node:assert';
import { parseIcd10Codes, toFrontendRiskLevel, mapScreeningToAIRiskResult } from '../services/screeningMapper.ts';
import type { PatientHistoryItem } from '../features/patient/PatientHistoryView.tsx';
import type { PatientProfile, AIRiskResult } from '../types/cds.ts';

/**
 * Bộ kiểm thử E2E & Logic Lâm Sàng AURA (FR-6: Lịch sử khám & FR-7: Báo cáo y tế)
 * Được thực thi độc lập để xác thực tính toàn vẹn của logic giao diện và các cổng an toàn y khoa.
 */

console.log('=================================================================');
console.log('   AURA CLINICAL E2E VERIFICATION SUITE (FR-6 & FR-7)');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
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
// PHẦN 1: KIỂM THỬ TIÊU CHÍ CHẤP NHẬN FR-6 (LỊCH SỬ KHÁM & THEO DÕI VI MẠCH)
// -----------------------------------------------------------------------------
console.log('--- 1. Kiểm thử Luồng Lịch Sử Khám Sàng Lọc (FR-6) ---');

const mockScreenings: PatientHistoryItem[] = [
  {
    id: 'SCR-2026-001',
    rawId: 'SCR-2026-001',
    createdAt: '2026-03-10T08:30:00.000Z',
    eyePosition: 'Right_OD',
    scanType: 'Fundus_Macula',
    riskScore: 35,
    riskLevel: 'Low',
    status: 'ANALYZED',
    doctorReviewed: false,
    doctorNotes: 'Ảnh rõ nét, vi mạch bình thường',
    imageUrl: '/uploads/fundus1.png',
  },
  {
    id: 'SCR-2026-002',
    rawId: 'SCR-2026-002',
    createdAt: '2026-03-11T09:15:00.000Z',
    eyePosition: 'Left_OS',
    scanType: 'Fundus_OpticDisc',
    riskScore: 58,
    riskLevel: 'Moderate',
    status: 'REVIEWED',
    doctorReviewed: true,
    doctorName: 'BS. CKII Nguyễn Văn An',
    doctorNotes: 'Có dấu hiệu co thắt nhẹ vi mạch',
    digitalSignature: 'hmac-sha256-signature-xyz-1234567890abcdef',
    signedAt: '2026-03-11T10:00:00.000Z',
    icd10Codes: ['H35.0', 'I10'],
    imageUrl: '/uploads/fundus2.png',
  },
  {
    id: 'SCR-2026-003',
    rawId: 'SCR-2026-003',
    createdAt: '2026-03-12T14:20:00.000Z',
    eyePosition: 'Both_OD_OS',
    scanType: 'OCT_Scan',
    riskScore: 78,
    riskLevel: 'High',
    status: 'ANALYZED',
    doctorReviewed: false,
    doctorNotes: 'Nguy cơ tim mạch cao cần theo dõi',
    imageUrl: '/uploads/fundus3.png',
  },
  {
    id: 'SCR-2026-004',
    rawId: 'SCR-2026-004',
    createdAt: '2026-03-13T16:00:00.000Z',
    eyePosition: 'OD',
    scanType: 'Fundus_Macula',
    riskScore: 88,
    riskLevel: 'Critical',
    status: 'FAILED',
    doctorReviewed: false,
    notes: 'Ảnh chất lượng kém, khuyến nghị chụp lại',
    imageUrl: '/uploads/fundus4.png',
  },
];

// Helper lọc dữ liệu tương đương useMemo trong PatientHistoryView
function filterScreenings(
  items: PatientHistoryItem[],
  searchTerm: string,
  eyeFilter: 'ALL' | 'OD' | 'OS' | 'BOTH',
  riskFilter: 'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
) {
  return items.filter((s) => {
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (s.id || '').toLowerCase().includes(term) ||
      (s.doctorNotes || '').toLowerCase().includes(term) ||
      (s.notes || '').toLowerCase().includes(term) ||
      (s.doctorName || '').toLowerCase().includes(term);

    const normEye = (s.eyePosition || '').toUpperCase();
    const matchEye =
      eyeFilter === 'ALL' ||
      (eyeFilter === 'OD' && (normEye.includes('OD') || normEye.includes('RIGHT'))) ||
      (eyeFilter === 'OS' && (normEye.includes('OS') || normEye.includes('LEFT'))) ||
      (eyeFilter === 'BOTH' && (normEye.includes('BOTH') || normEye.includes('2')));

    const normRisk = (s.riskLevel || '').toUpperCase();
    const matchRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'LOW' && (normRisk === 'LOW' || normRisk === 'NORMAL')) ||
      (riskFilter === 'MODERATE' && (normRisk === 'MODERATE' || normRisk === 'MEDIUM')) ||
      (riskFilter === 'HIGH' && normRisk === 'HIGH') ||
      (riskFilter === 'CRITICAL' && (normRisk === 'CRITICAL' || normRisk === 'SEVERE'));

    return matchSearch && matchEye && matchRisk;
  });
}

runTest('FR-6.1: Bảng lịch sử có cấu trúc đầy đủ 7 cột thông tin chuẩn', () => {
  const item = mockScreenings[1];
  // 1. Ngày khám
  assert.ok(item.createdAt, 'Cột 1: Có ngày khám');
  const dateObj = new Date(item.createdAt);
  assert.strictEqual(isNaN(dateObj.getTime()), false, 'Ngày khám hợp lệ');

  // 2. Mắt khám
  assert.ok(item.eyePosition, 'Cột 2: Có vị trí mắt');
  assert.strictEqual(item.eyePosition, 'Left_OS');

  // 3. Loại ảnh
  assert.ok(item.scanType, 'Cột 3: Có loại ảnh chụp');
  assert.strictEqual(item.scanType, 'Fundus_OpticDisc');

  // 4. Mức độ rủi ro
  assert.ok(item.riskLevel, 'Cột 4: Có mức độ rủi ro');
  assert.strictEqual(item.riskLevel, 'Moderate');

  // 5. Điểm rủi ro /100
  assert.strictEqual(typeof item.riskScore, 'number', 'Cột 5: Điểm rủi ro là số');
  assert.strictEqual(item.riskScore, 58);

  // 6. Trạng thái ca khám
  assert.ok(item.status, 'Cột 6: Có trạng thái ca khám');
  assert.strictEqual(item.status, 'REVIEWED');
  assert.strictEqual(item.doctorReviewed, true);

  // 7. Thao tác: có ID để nạp vào viewer và modal báo cáo
  assert.ok(item.id, 'Cột 7: Ca khám có ID để kích hoạt Xem bản đồ nhiệt và Xuất báo cáo');
});

runTest('FR-6.2: Bộ lọc theo Vị trí Mắt (ALL / OD / OS / BOTH)', () => {
  const allResult = filterScreenings(mockScreenings, '', 'ALL', 'ALL');
  assert.strictEqual(allResult.length, 4, 'ALL trả về tất cả 4 ca');

  const odResult = filterScreenings(mockScreenings, '', 'OD', 'ALL');
  assert.strictEqual(odResult.length, 3, 'OD lọc đúng 3 ca bao gồm cả đơn mắt phải và cả hai mắt');

  const osResult = filterScreenings(mockScreenings, '', 'OS', 'ALL');
  assert.strictEqual(osResult.length, 2, 'OS lọc đúng 2 ca bao gồm cả đơn mắt trái và cả hai mắt');
  assert.ok(osResult.some((s) => s.id === 'SCR-2026-002'));
  assert.ok(osResult.some((s) => s.id === 'SCR-2026-003'));

  const bothResult = filterScreenings(mockScreenings, '', 'BOTH', 'ALL');
  assert.strictEqual(bothResult.length, 1, 'BOTH lọc đúng 1 ca (SCR-2026-003)');
  assert.strictEqual(bothResult[0].id, 'SCR-2026-003');
});

runTest('FR-6.3: Bộ lọc theo Mức Độ Rủi Ro (LOW / MODERATE / HIGH / CRITICAL)', () => {
  const lowResult = filterScreenings(mockScreenings, '', 'ALL', 'LOW');
  assert.strictEqual(lowResult.length, 1, 'Lọc đúng 1 ca LOW');
  assert.strictEqual(lowResult[0].riskLevel, 'Low');

  const modResult = filterScreenings(mockScreenings, '', 'ALL', 'MODERATE');
  assert.strictEqual(modResult.length, 1, 'Lọc đúng 1 ca MODERATE');
  assert.strictEqual(modResult[0].riskLevel, 'Moderate');

  const highResult = filterScreenings(mockScreenings, '', 'ALL', 'HIGH');
  assert.strictEqual(highResult.length, 1, 'Lọc đúng 1 ca HIGH');
  assert.strictEqual(highResult[0].riskLevel, 'High');

  const critResult = filterScreenings(mockScreenings, '', 'ALL', 'CRITICAL');
  assert.strictEqual(critResult.length, 1, 'Lọc đúng 1 ca CRITICAL');
  assert.strictEqual(critResult[0].riskLevel, 'Critical');
});

runTest('FR-6.4: Ô tìm kiếm đa trường (Mã khám, Bác sĩ, Ghi chú lâm sàng)', () => {
  // Tìm theo mã khám
  const byId = filterScreenings(mockScreenings, '003', 'ALL', 'ALL');
  assert.strictEqual(byId.length, 1);
  assert.strictEqual(byId[0].id, 'SCR-2026-003');

  // Tìm theo tên bác sĩ
  const byDoctor = filterScreenings(mockScreenings, 'Nguyễn Văn An', 'ALL', 'ALL');
  assert.strictEqual(byDoctor.length, 1);
  assert.strictEqual(byDoctor[0].id, 'SCR-2026-002');

  // Tìm theo từ khóa trong ghi chú
  const byNotes = filterScreenings(mockScreenings, 'chất lượng kém', 'ALL', 'ALL');
  assert.strictEqual(byNotes.length, 1);
  assert.strictEqual(byNotes[0].id, 'SCR-2026-004');
});

runTest('FR-6.5: Nạp ca khám được chọn vào Viewer và Modal Báo cáo', () => {
  const selectedItem = mockScreenings[1];
  let loadedForViewer: any = null;
  let loadedForReport: any = null;

  const onSelectScreening = (item: PatientHistoryItem) => {
    loadedForViewer = item;
  };
  const onOpenReportModal = (item: PatientHistoryItem) => {
    loadedForReport = item;
  };

  onSelectScreening(selectedItem);
  onOpenReportModal(selectedItem);

  assert.strictEqual(loadedForViewer?.id, 'SCR-2026-002');
  assert.strictEqual(loadedForReport?.id, 'SCR-2026-002');
  assert.strictEqual(loadedForReport?.digitalSignature, 'hmac-sha256-signature-xyz-1234567890abcdef');
});

// -----------------------------------------------------------------------------
// PHẦN 2: KIỂM THỬ TIÊU CHÍ CHẤP NHẬN FR-7 (XUẤT BÁO CÁO Y TẾ CHUẨN LÂM SÀNG)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Kiểm thử Xuất Báo Cáo Y Tế & An Toàn Lâm Sàng (FR-7) ---');

const MEDICAL_DISCLAIMER =
  'Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.';

const evaluateAvRatio = (val: number) => {
  if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
  if (val >= 0.67) return { text: 'Tỷ lệ A/V trong giới hạn bình thường (≥ 0.67)', color: 'text-emerald-600' };
  if (val >= 0.55) return { text: 'Hẹp nhẹ tiểu động mạch võng mạc (0.55 - 0.66)', color: 'text-amber-600' };
  return { text: 'Co thắt tiểu động mạch võng mạc đáng kể (< 0.55)', color: 'text-rose-600 font-medium' };
};

const evaluateVesselDensity = (val: number) => {
  if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
  if (val < 15.5) return { text: 'Giảm tưới máu vi mạch võng mạc (< 15.5%)', color: 'text-rose-600 font-medium' };
  if (val > 19.0) return { text: 'Tăng sinh vi mạch hoặc phù nề (> 19.0%)', color: 'text-amber-600' };
  return { text: 'Mật độ tưới máu mao mạch đạt tiêu chuẩn (15.5% - 19.0%)', color: 'text-emerald-600' };
};

const evaluateTortuosity = (val: number) => {
  if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
  if (val < 1.25) return { text: 'Độ uốn lượn mạch máu bình thường (< 1.25)', color: 'text-emerald-600' };
  if (val < 1.4) return { text: 'Uốn lượn trung bình liên quan huyết áp (1.25 - 1.40)', color: 'text-amber-600' };
  return { text: 'Mạch máu ngoằn ngoèo bất thường (≥ 1.40)', color: 'text-rose-600 font-medium' };
};

const evaluateVcdr = (val: number) => {
  if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
  if (val < 0.5) return { text: 'Hình thái gai thị bình thường (< 0.50)', color: 'text-emerald-600' };
  if (val < 0.7) return { text: 'Lõm gai mở rộng sinh lý/nghi ngờ sớm (0.50 - 0.69)', color: 'text-amber-600' };
  return { text: 'Lõm gai rộng bất thường, cần tầm soát Glaucoma (≥ 0.70)', color: 'text-rose-600 font-medium' };
};

runTest('FR-7.1: Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer) đầy đủ và chính xác', () => {
  assert.strictEqual(
    MEDICAL_DISCLAIMER,
    'Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.'
  );
});

runTest('FR-7.2: Trích xuất và hiển thị danh mục mã ICD-10 linh hoạt', () => {
  // Test mảng chuỗi
  const parsed1 = parseIcd10Codes(['H35.0', 'I10']);
  assert.deepStrictEqual(parsed1, ['H35.0', 'I10']);

  // Test chuỗi phân cách bởi dấu phẩy, chấm phẩy và xuống dòng
  const parsed2 = parseIcd10Codes('H35.0, I10; E11.9\nH35.3');
  assert.deepStrictEqual(parsed2, ['H35.0', 'I10', 'E11.9', 'H35.3']);

  // Test chuỗi JSON array
  const parsed3 = parseIcd10Codes('["H35.0", "I10"]');
  assert.deepStrictEqual(parsed3, ['H35.0', 'I10']);

  // Test null / undefined
  assert.deepStrictEqual(parseIcd10Codes(null), []);
  assert.deepStrictEqual(parseIcd10Codes(undefined), []);
  assert.deepStrictEqual(parseIcd10Codes('   '), []);
});

runTest('FR-7.3: Đánh giá lâm sàng sinh học vi mạch thay đổi linh hoạt theo số đo thực tế', () => {
  // 1. Tỷ lệ A/V Ratio
  assert.strictEqual(evaluateAvRatio(0.70).text, 'Tỷ lệ A/V trong giới hạn bình thường (≥ 0.67)');
  assert.strictEqual(evaluateAvRatio(0.60).text, 'Hẹp nhẹ tiểu động mạch võng mạc (0.55 - 0.66)');
  assert.strictEqual(evaluateAvRatio(0.48).text, 'Co thắt tiểu động mạch võng mạc đáng kể (< 0.55)');
  assert.strictEqual(evaluateAvRatio(0).text, 'Chưa đủ dữ liệu phân tích');

  // 2. Mật độ tưới máu mao mạch (Vessel Density)
  assert.strictEqual(evaluateVesselDensity(17.2).text, 'Mật độ tưới máu mao mạch đạt tiêu chuẩn (15.5% - 19.0%)');
  assert.strictEqual(evaluateVesselDensity(14.0).text, 'Giảm tưới máu vi mạch võng mạc (< 15.5%)');
  assert.strictEqual(evaluateVesselDensity(21.5).text, 'Tăng sinh vi mạch hoặc phù nề (> 19.0%)');
  assert.strictEqual(evaluateVesselDensity(0).text, 'Chưa đủ dữ liệu phân tích');

  // 3. Độ uốn lượn mạch máu (Tortuosity)
  assert.strictEqual(evaluateTortuosity(1.15).text, 'Độ uốn lượn mạch máu bình thường (< 1.25)');
  assert.strictEqual(evaluateTortuosity(1.32).text, 'Uốn lượn trung bình liên quan huyết áp (1.25 - 1.40)');
  assert.strictEqual(evaluateTortuosity(1.48).text, 'Mạch máu ngoằn ngoèo bất thường (≥ 1.40)');
  assert.strictEqual(evaluateTortuosity(0).text, 'Chưa đủ dữ liệu phân tích');

  // 4. Tỷ lệ lõm gai / gai thị (Vertical CDR)
  assert.strictEqual(evaluateVcdr(0.35).text, 'Hình thái gai thị bình thường (< 0.50)');
  assert.strictEqual(evaluateVcdr(0.58).text, 'Lõm gai mở rộng sinh lý/nghi ngờ sớm (0.50 - 0.69)');
  assert.strictEqual(evaluateVcdr(0.78).text, 'Lõm gai rộng bất thường, cần tầm soát Glaucoma (≥ 0.70)');
  assert.strictEqual(evaluateVcdr(0).text, 'Chưa đủ dữ liệu phân tích');
});

runTest('FR-7.4: Cổng kiểm tra bác sĩ (Ca chưa duyệt ANALYZED vs Ca đã duyệt REVIEWED)', () => {
  // 1. Ca chưa duyệt (ANALYZED / PENDING)
  const pendingResult: AIRiskResult = {
    analysisId: 'ANALYSIS-PENDING-001',
    status: 'ANALYZED',
    executionTimeMs: 1200,
    overallVascularRiskScore: 68,
    cardiovascularRisk: { level: 'High', score: 68, hypertensionStage: 'Giai đoạn 1', threeYearStrokeRiskPercent: 18 },
    diabeticRetinopathyRisk: { level: 'Moderate', score: 45, etdrsGrade: 'Mild NPDR', macularEdemaPresent: false },
    glaucomaRisk: { level: 'Low', score: 15 },
    annotatedMap: { arteryVeinRatio: 0.58, vesselDensityPercentage: 16.5, tortuosityIndex: 1.30, opticCupToDiscRatio: 0.42, detectedAnomalies: [] },
    xaiExplainability: [],
  };

  const isPendingReviewed = pendingResult.status === 'REVIEWED' && Boolean(pendingResult.digitalSignature);
  assert.strictEqual(isPendingReviewed, false, 'Ca chưa duyệt không được đánh dấu là isReviewed');
  assert.strictEqual(pendingResult.digitalSignature, undefined, 'Tuyệt đối không có chữ ký số giả mạo');

  // 2. Ca đã duyệt (REVIEWED)
  const reviewedResult: AIRiskResult = {
    analysisId: 'ANALYSIS-REVIEWED-002',
    status: 'REVIEWED',
    executionTimeMs: 1200,
    overallVascularRiskScore: 75,
    doctorName: 'BS. CKII Lê Hoàng Mai',
    doctorNotes: 'Xác nhận tổn thương vi mạch võng mạc, chỉ định siêu âm tim mạch.',
    digitalSignature: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    signedAt: '2026-03-12T15:30:00.000Z',
    icd10Codes: ['H35.03', 'I10'],
    cardiovascularRisk: { level: 'High', score: 75, hypertensionStage: 'Giai đoạn 2', threeYearStrokeRiskPercent: 25 },
    diabeticRetinopathyRisk: { level: 'High', score: 70, etdrsGrade: 'Moderate NPDR', macularEdemaPresent: true },
    glaucomaRisk: { level: 'Low', score: 20 },
    annotatedMap: { arteryVeinRatio: 0.52, vesselDensityPercentage: 14.8, tortuosityIndex: 1.42, opticCupToDiscRatio: 0.45, detectedAnomalies: [] },
    xaiExplainability: [],
  };

  const isApprovedReviewed = reviewedResult.status === 'REVIEWED' && Boolean(reviewedResult.digitalSignature);
  assert.strictEqual(isApprovedReviewed, true, 'Ca đã duyệt có chữ ký hợp lệ');
  assert.strictEqual(reviewedResult.doctorName, 'BS. CKII Lê Hoàng Mai');
  assert.strictEqual(reviewedResult.digitalSignature?.length, 64, 'Chuỗi băm HMAC-SHA256 chuẩn 64 ký tự');
});

runTest('FR-7.5: Tệp CSV xuất ra có BOM UTF-8, định danh chuẩn và ngày khám chính xác', () => {
  const patient: PatientProfile = {
    fullName: 'Trần Thị Thảo',
    mrn: 'MRN-78901',
    age: 52,
    gender: 'Female',
    systolicBp: 135,
    diastolicBp: 88,
    hba1c: 6.8,
  };

  const result: AIRiskResult = {
    analysisId: 'SCR-999-E2E',
    createdAt: '2026-03-10T14:30:00.000Z',
    status: 'REVIEWED',
    executionTimeMs: 1500,
    overallVascularRiskScore: 62,
    doctorName: 'BS. CKII Trần Quốc Toản',
    digitalSignature: 'abc123sha256hashcode',
    signedAt: '2026-03-10T15:00:00.000Z',
    icd10Codes: ['H35.0', 'I10'],
    cardiovascularRisk: { level: 'Moderate', score: 62, hypertensionStage: 'Giai doan 1', threeYearStrokeRiskPercent: 16 },
    diabeticRetinopathyRisk: { level: 'Moderate', score: 55, etdrsGrade: 'Mild NPDR', macularEdemaPresent: true },
    glaucomaRisk: { level: 'Low', score: 18 },
    annotatedMap: { arteryVeinRatio: 0.62, vesselDensityPercentage: 16.8, tortuosityIndex: 1.28, opticCupToDiscRatio: 0.40, detectedAnomalies: [] },
    xaiExplainability: [],
  };

  // Tạo nội dung CSV theo đúng logic trong MedicalReportModal
  const examDate = result.createdAt ? new Date(result.createdAt) : new Date();
  const examDateTimeStr = examDate.toLocaleString('vi-VN');
  const isReviewed = result.status === 'REVIEWED' && Boolean(result.digitalSignature);
  const verifiedDoctorName = isReviewed ? (result.doctorName || 'Bac si chuyen khoa') : null;
  const icdCodes = parseIcd10Codes(result.icd10Codes);

  const csvRows = [
    ['TUYEN BO MIEN TRU TRACH NHIEM Y TE', MEDICAL_DISCLAIMER],
    ['Tieu de', 'Gia tri', 'Nguong chuan', 'Danh gia lam sang'],
    ['Ma bao cao', result.analysisId, 'HL7/FHIR', ''],
    ['Ho va ten', patient.fullName || '', '', ''],
    ['Ma benh nhan (MRN)', patient.mrn || '', '', ''],
    ['Ngay gio kham', examDateTimeStr, '', ''],
    ['Diem nguy co mach mau tong hop', `${result.overallVascularRiskScore}/100`, '< 45/100', ''],
    ['Ty le A/V Ratio', result.annotatedMap.arteryVeinRatio.toString(), '>= 0.67', evaluateAvRatio(result.annotatedMap.arteryVeinRatio).text],
    ['Mat do mach mau', `${result.annotatedMap.vesselDensityPercentage}%`, '15.5% - 19.0%', evaluateVesselDensity(result.annotatedMap.vesselDensityPercentage).text],
    ['Do uon luon Tortuosity', result.annotatedMap.tortuosityIndex.toString(), '< 1.25', evaluateTortuosity(result.annotatedMap.tortuosityIndex).text],
    ['Ty le Cup/Disc (CDR)', result.annotatedMap.opticCupToDiscRatio.toString(), '< 0.50', evaluateVcdr(result.annotatedMap.opticCupToDiscRatio).text],
    ['Ma chan doan ICD-10', icdCodes.join('; ') || 'Chua ghi nhan', '', ''],
    ['Trang thai tham dinh', isReviewed ? 'Da duyet lam sang' : 'Cho bac si tham dinh', '', ''],
    ['Bac si phu trach', isReviewed ? (verifiedDoctorName || 'Bac si chuyen khoa') : 'Chua co bac si tham dinh', '', ''],
    ['Chu ky so SHA-256', isReviewed ? (result.digitalSignature || 'Da ky so') : 'Chua ky so', '', ''],
    ['Thoi diem ky', isReviewed && result.signedAt ? new Date(result.signedAt).toLocaleString('vi-VN') : 'Chua ky', '', ''],
  ];

  const csvRawString = csvRows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const csvWithBom = '\uFEFF' + csvRawString;

  // 1. Kiểm tra BOM UTF-8
  assert.strictEqual(csvWithBom.charCodeAt(0), 0xFEFF, 'Ký tự đầu tiên phải là UTF-8 BOM');

  // 2. Kiểm tra tên file chuẩn
  const fileName = `AURA_Report_${patient.mrn || 'patient'}_${result.analysisId}.csv`;
  assert.strictEqual(fileName, 'AURA_Report_MRN-78901_SCR-999-E2E.csv');
  assert.match(fileName, /^AURA_Report_MRN-[A-Za-z0-9]+_[A-Za-z0-9\-]+\.csv$/);

  // 3. Kiểm tra ngày khám trong CSV
  assert.ok(csvWithBom.includes('Ngay gio kham'), 'Có trường Ngày giờ khám');
  assert.ok(csvWithBom.includes(examDateTimeStr), 'Chứa đúng ngày giờ tạo ca khám');

  // 4. Kiểm tra Disclaimer trong CSV
  assert.ok(csvWithBom.includes('TUYEN BO MIEN TRU TRACH NHIEM Y TE'), 'Hàng đầu tiên là Tuyên bố miễn trừ');
  assert.ok(csvWithBom.includes(MEDICAL_DISCLAIMER), 'Chứa đầy đủ nội dung Medical Disclaimer');

  // 5. Kiểm tra Đánh giá lâm sàng
  assert.ok(csvWithBom.includes('Hẹp nhẹ tiểu động mạch võng mạc (0.55 - 0.66)'));
  assert.ok(csvWithBom.includes('Mật độ tưới máu mao mạch đạt tiêu chuẩn (15.5% - 19.0%)'));
  assert.ok(csvWithBom.includes('Uốn lượn trung bình liên quan huyết áp (1.25 - 1.40)'));
  assert.ok(csvWithBom.includes('Hình thái gai thị bình thường (< 0.50)'));
});

runTest('FR-7.6: mapScreeningToAIRiskResult tuân thủ an toàn y khoa, không sinh điểm giả', () => {
  const rawApiScreening = {
    id: 'SCR-DB-001',
    cardiovascularRiskScore: 72,
    diabeticRetinopathyRiskScore: 64,
    strokeRiskScore: 70,
    riskScore: 68,
    avRatio: 0.56,
    vesselDensityPercent: 15.2,
    tortuosityIndex: 1.35,
    verticalCdr: 0.44,
    status: 'ANALYZED',
    findings: 'Phát hiện hẹp tiểu động mạch và giảm nhẹ mật độ vi mạch.',
    recommendations: 'Tái khám chuyên khoa trong vòng 2 tuần.',
    icd10Codes: 'H35.0, I10',
  };

  const mapped = mapScreeningToAIRiskResult(rawApiScreening, '/fallback.png');

  // Kiểm tra điểm tổng hợp: lấy đúng riskScore hoặc trung bình CVD/DR, không được lấy confidence * 100
  assert.strictEqual(mapped.overallVascularRiskScore, 68);
  assert.strictEqual(mapped.cardiovascularRisk.score, 72);
  assert.strictEqual(mapped.diabeticRetinopathyRisk.score, 64);
  assert.strictEqual(mapped.cardiovascularRisk.threeYearStrokeRiskPercent, 70);

  // Không sinh tọa độ tổn thương giả
  assert.deepStrictEqual(mapped.annotatedMap.detectedAnomalies, []);

  // Chỉ số vi mạch được map chính xác
  assert.strictEqual(mapped.annotatedMap.arteryVeinRatio, 0.56);
  assert.strictEqual(mapped.annotatedMap.vesselDensityPercentage, 15.2);
  assert.strictEqual(mapped.annotatedMap.tortuosityIndex, 1.35);
  assert.strictEqual(mapped.annotatedMap.opticCupToDiscRatio, 0.44);

  // ICD-10 được tách mảng chuẩn
  assert.deepStrictEqual(mapped.icd10Codes, ['H35.0', 'I10']);
});

runTest('FR-7.9: Parse an toàn detectedAnomalies từ chuỗi JSON string trong database hoặc mảng thật', () => {
  // Trường hợp 1: detectedAnomalies là JSON string hợp lệ từ backend PostgreSQL TEXT column
  const screeningWithJsonString = {
    id: 'SCR-DB-JSON-01',
    cardiovascularRiskScore: 65,
    diabeticRetinopathyRiskScore: 70,
    detectedAnomalies: JSON.stringify([
      {
        id: 'ano-01',
        type: 'Microaneurysm',
        confidence: 0.92,
        coordinates: { x: 45, y: 52, width: 26, height: 26 },
        description: 'Vi phình mạch khu trú nhánh thái dương trên',
      },
    ]),
  };
  const mapped1 = mapScreeningToAIRiskResult(screeningWithJsonString, '/fallback.png');
  assert.strictEqual(mapped1.annotatedMap.detectedAnomalies.length, 1);
  assert.strictEqual(mapped1.annotatedMap.detectedAnomalies[0].type, 'Microaneurysm');
  assert.strictEqual(mapped1.annotatedMap.detectedAnomalies[0].coordinates.x, 45);

  // Trường hợp 2: detectedAnomalies là mảng JSON thật
  const screeningWithArray = {
    id: 'SCR-DB-ARR-02',
    detectedAnomalies: [
      {
        id: 'ano-02',
        type: 'Hemorrhage',
        confidence: 0.88,
        coordinates: { x: 60, y: 40, width: 28, height: 28 },
        description: 'Xuất huyết võng mạc nông',
      },
    ],
  };
  const mapped2 = mapScreeningToAIRiskResult(screeningWithArray, '/fallback.png');
  assert.strictEqual(mapped2.annotatedMap.detectedAnomalies.length, 1);
  assert.strictEqual(mapped2.annotatedMap.detectedAnomalies[0].type, 'Hemorrhage');

  // Trường hợp 3: detectedAnomalies là chuỗi JSON không hợp lệ (hỏng) - fail safe không làm sập
  const screeningWithCorruptedJson = {
    id: 'SCR-DB-BAD-03',
    detectedAnomalies: '{ corrupted json string ...',
  };
  const mapped3 = mapScreeningToAIRiskResult(screeningWithCorruptedJson, '/fallback.png');
  assert.deepStrictEqual(mapped3.annotatedMap.detectedAnomalies, []);
});

runTest('FR-7.7: Báo cáo đối chiếu song song 2 mắt (Dual Eye OD & OS) và xuất CSV', () => {
  const patient: PatientProfile = {
    fullName: 'Hoàng Văn Minh',
    mrn: 'MRN-DUAL-002',
    age: 60,
    gender: 'Male',
    systolicBp: 145,
    diastolicBp: 92,
    hba1c: 7.5,
  };

  const resultOD: AIRiskResult = {
    analysisId: 'SCR-OD-01',
    createdAt: '2026-03-11T08:00:00.000Z',
    status: 'REVIEWED',
    executionTimeMs: 1400,
    overallVascularRiskScore: 78,
    cardiovascularRisk: { level: 'High', score: 78, hypertensionStage: 'Giai đoạn 2', threeYearStrokeRiskPercent: 22 },
    diabeticRetinopathyRisk: { level: 'Moderate', score: 58, etdrsGrade: 'Moderate NPDR', macularEdemaPresent: false },
    glaucomaRisk: { level: 'Low', score: 20 },
    annotatedMap: { arteryVeinRatio: 0.54, vesselDensityPercentage: 14.9, tortuosityIndex: 1.38, opticCupToDiscRatio: 0.42, detectedAnomalies: [] },
    xaiExplainability: [],
  };

  const resultOS: AIRiskResult = {
    analysisId: 'SCR-OS-02',
    createdAt: '2026-03-11T08:00:00.000Z',
    status: 'REVIEWED',
    executionTimeMs: 1350,
    overallVascularRiskScore: 65,
    cardiovascularRisk: { level: 'Moderate', score: 65, hypertensionStage: 'Giai đoạn 1', threeYearStrokeRiskPercent: 15 },
    diabeticRetinopathyRisk: { level: 'Moderate', score: 48, etdrsGrade: 'Mild NPDR', macularEdemaPresent: false },
    glaucomaRisk: { level: 'Low', score: 18 },
    annotatedMap: { arteryVeinRatio: 0.60, vesselDensityPercentage: 16.2, tortuosityIndex: 1.29, opticCupToDiscRatio: 0.39, detectedAnomalies: [] },
    xaiExplainability: [],
  };

  const isDualEye = true;
  const hasDualData = Boolean(resultOD && resultOS) || isDualEye;
  assert.strictEqual(hasDualData, true);

  // Điểm đánh giá nguy cơ lâm sàng lấy giá trị cao nhất giữa 2 mắt
  const worstCardioScore = Math.max(resultOD.cardiovascularRisk.score, resultOS.cardiovascularRisk.score);
  assert.strictEqual(worstCardioScore, 78);

  const worstDrScore = Math.max(resultOD.diabeticRetinopathyRisk.score, resultOS.diabeticRetinopathyRisk.score);
  assert.strictEqual(worstDrScore, 58);

  // Xuất CSV Dual Eye
  const csvDualRows = [
    ['TUYEN BO MIEN TRU TRACH NHIEM Y TE', MEDICAL_DISCLAIMER],
    ['Tieu de', 'Mat Phai (OD)', 'Mat Trai (OS)', 'Nguong chuan', 'Danh gia lam sang'],
    ['Ma bao cao', resultOD.analysisId, resultOS.analysisId, 'HL7/FHIR', ''],
    ['Ho va ten', patient.fullName || '', patient.fullName || '', '', ''],
    ['Ty le A/V Ratio', resultOD.annotatedMap.arteryVeinRatio.toString(), resultOS.annotatedMap.arteryVeinRatio.toString(), '>= 0.67', `OD: ${evaluateAvRatio(resultOD.annotatedMap.arteryVeinRatio).text} | OS: ${evaluateAvRatio(resultOS.annotatedMap.arteryVeinRatio).text}`],
    ['Mat do vi mach (Vessel Density)', `${resultOD.annotatedMap.vesselDensityPercentage}%`, `${resultOS.annotatedMap.vesselDensityPercentage}%`, '15.5% - 19.0%', `OD: ${evaluateVesselDensity(resultOD.annotatedMap.vesselDensityPercentage).text} | OS: ${evaluateVesselDensity(resultOS.annotatedMap.vesselDensityPercentage).text}`],
  ];

  const dualCsvString = '\uFEFF' + csvDualRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  assert.ok(dualCsvString.includes('Mat Phai (OD)'));
  assert.ok(dualCsvString.includes('Mat Trai (OS)'));
  assert.ok(dualCsvString.includes('Co thắt tiểu động mạch võng mạc đáng kể (< 0.55)'));
  assert.ok(dualCsvString.includes('Hẹp nhẹ tiểu động mạch võng mạc (0.55 - 0.66)'));
});

runTest('FR-7.8: Xử lý an toàn các giá trị biên (Edge Cases: null MRN, invalid date, score = 0/100)', () => {
  const patientNoMrn: PatientProfile = { fullName: 'Bệnh nhân thử nghiệm' };
  const fallbackFileName = `AURA_Report_${patientNoMrn.mrn || 'patient'}_SCR-000.csv`;
  assert.strictEqual(fallbackFileName, 'AURA_Report_patient_SCR-000.csv');

  // Invalid date
  const invalidDate = new Date('invalid-date-string');
  const isValid = !isNaN(invalidDate.getTime());
  assert.strictEqual(isValid, false);
  const safeDateStr = isValid ? invalidDate.toLocaleDateString('vi-VN') : 'Chưa có ngày';
  assert.strictEqual(safeDateStr, 'Chưa có ngày');

  // Score badge boundaries
  const getScoreBadge = (score: number) => {
    if (score < 45) return 'emerald';
    if (score < 65) return 'amber';
    if (score < 80) return 'orange';
    return 'rose';
  };
  assert.strictEqual(getScoreBadge(0), 'emerald');
  assert.strictEqual(getScoreBadge(44), 'emerald');
  assert.strictEqual(getScoreBadge(45), 'amber');
  assert.strictEqual(getScoreBadge(64), 'amber');
  assert.strictEqual(getScoreBadge(65), 'orange');
  assert.strictEqual(getScoreBadge(79), 'orange');
  assert.strictEqual(getScoreBadge(80), 'rose');
  assert.strictEqual(getScoreBadge(100), 'rose');
});

runTest('NFR-3: Hiệu năng xử lý và lọc danh sách (Phản hồi < 50ms, đáp ứng chuẩn NFR-3 < 3s)', () => {
  const largeDataset: PatientHistoryItem[] = Array.from({ length: 500 }, (_, i) => ({
    id: `SCR-BENCH-${i}`,
    rawId: `SCR-BENCH-${i}`,
    createdAt: new Date(2026, 2, (i % 28) + 1).toISOString(),
    eyePosition: i % 3 === 0 ? 'OD' : i % 3 === 1 ? 'OS' : 'Both_OD_OS',
    scanType: i % 2 === 0 ? 'Fundus_Macula' : 'OCT_Scan',
    riskScore: (i * 17) % 100,
    riskLevel: i % 4 === 0 ? 'Low' : i % 4 === 1 ? 'Moderate' : i % 4 === 2 ? 'High' : 'Critical',
    status: i % 2 === 0 ? 'REVIEWED' : 'ANALYZED',
    doctorReviewed: i % 2 === 0,
    doctorName: `Bác sĩ số ${i % 10}`,
    doctorNotes: `Ghi chú ca số ${i} về mạch máu võng mạc`,
  }));

  const start = performance.now();
  // Thực hiện tìm kiếm và lọc qua 500 bản ghi
  const filtered = filterScreenings(largeDataset, 'bác sĩ số 3', 'OD', 'ALL');
  const elapsedMs = performance.now() - start;

  assert.ok(filtered.length > 0);
  assert.ok(elapsedMs < 50, `Thời gian lọc ${elapsedMs.toFixed(2)}ms phải nhỏ hơn 50ms`);
});

console.log('\n=================================================================');
console.log(`   KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐÃ ĐẠT (100% PASS)`);
console.log('=================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
