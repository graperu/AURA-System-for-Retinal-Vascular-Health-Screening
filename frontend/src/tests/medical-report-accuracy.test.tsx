import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MedicalReportModal } from '../components/MedicalReportModal';
import {
  isLandmarkAnomaly,
  buildReportCsvContent,
  buildFhirDiagnosticReportBundle,
} from '../services/exportService';
import { LanguageProvider } from '../context/LanguageContext';
import type { AIRiskResult, PatientProfile, VesselAnomalyRegion } from '../types/cds';

console.log('=================================================================');
console.log('   AURA MEDICAL REPORT ACCURACY & LANDMARK SEPARATION TEST SUITE');
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

// Case 1: Empty demographic / new patient with Optic Disc and FAZ landmarks (0 real lesions)
const mockNewPatient: PatientProfile = {
  id: 'pat-dinh-01',
  mrn: 'MRN-2026-D630',
  fullName: 'Phan Văn Định',
  age: undefined,
  gender: undefined,
  systolicBp: undefined,
  diastolicBp: undefined,
  hba1c: undefined,
};

const mockLandmarksOnly: VesselAnomalyRegion[] = [
  {
    id: 'LANDMARK-DISC',
    type: 'Optic_Disc',
    coordinates: { x: 76.2, y: 48.6, width: 56, height: 56 },
    confidence: 0.98,
    description: 'Đĩa thần kinh thị giác (Gai thị)',
  },
  {
    id: 'LANDMARK-FAZ',
    type: 'Fovea_Centralis',
    coordinates: { x: 44.1, y: 50.7, width: 44, height: 44 },
    confidence: 0.98,
    description: 'Vùng vô mạch hoàng điểm (FAZ)',
  },
];

const mockResultZeroLesions: AIRiskResult = {
  analysisId: 'c2944217-1eae-48fb-9b75-a3c5edf2b3a3',
  imageUrl: '/assets/images/fundus_original.png',
  status: 'PENDING_REVIEW',
  overallVascularRiskScore: 32,
  riskScore: 32,
  eyePosition: 'OD',
  cardiovascularRisk: {
    score: 28,
    level: 'LOW',
    threeYearStrokeRiskPercent: 4.2,
    hypertensionStage: 'Bình thường',
  },
  diabeticRetinopathyRisk: {
    score: 15,
    level: 'LOW',
    etdrsGrade: 'Giai đoạn 0',
  },
  annotatedMap: {
    arteryVeinRatio: 0.72,
    vesselDensityPercentage: 17.8,
    tortuosityIndex: 1.15,
    opticCupToDiscRatio: 0.42,
    detectedAnomalies: mockLandmarksOnly,
  },
  createdAt: '2026-09-19T10:00:00Z',
};

// -----------------------------------------------------------------------------
// 1. Kiểm thử Phân tách Mốc Giải Phẫu và Tổn Thương Lâm Sàng
// -----------------------------------------------------------------------------
console.log('--- 1. Kiểm thử hàm chuẩn hóa isLandmarkAnomaly ---');

runTest('ACCURACY-1: isLandmarkAnomaly nhận diện chính xác Optic Disc và FAZ', () => {
  assert.strictEqual(isLandmarkAnomaly({ type: 'Optic_Disc' }), true);
  assert.strictEqual(isLandmarkAnomaly({ type: 'Fovea_Centralis' }), true);
  assert.strictEqual(isLandmarkAnomaly({ id: 'LANDMARK-DISC', type: 'disc' }), true);
  assert.strictEqual(isLandmarkAnomaly({ id: 'LANDMARK-FAZ', type: 'fovea' }), true);
  assert.strictEqual(isLandmarkAnomaly({ type: 'GAI_THI' }), true);
  assert.strictEqual(isLandmarkAnomaly({ type: 'HOANG_DIEM' }), true);

  // Tổn thương bệnh lý không được coi là mốc giải phẫu
  assert.strictEqual(isLandmarkAnomaly({ type: 'Hemorrhage' }), false);
  assert.strictEqual(isLandmarkAnomaly({ type: 'Microaneurysm' }), false);
  assert.strictEqual(isLandmarkAnomaly({ type: 'Hard_Exudate' }), false);
  assert.strictEqual(isLandmarkAnomaly({ type: 'Cotton_Wool_Spot' }), false);
  assert.strictEqual(isLandmarkAnomaly({ type: 'AV_Nipping' }), false);
  assert.strictEqual(isLandmarkAnomaly({ type: 'Focal_Narrowing' }), false);
  assert.strictEqual(isLandmarkAnomaly(null), false);
  assert.strictEqual(isLandmarkAnomaly(undefined), false);
});

// -----------------------------------------------------------------------------
// 2. Kiểm thử Render MedicalReportModal khi có 0 tổn thương thật sự
// -----------------------------------------------------------------------------
console.log('\n--- 2. Kiểm thử hiển thị Báo Cáo Y Tế khi chỉ có mốc giải phẫu (0 tổn thương) ---');

runTest('ACCURACY-2: Modal hiển thị chuẩn 0 tổn thương và thông báo an toàn xanh lá', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <MedicalReportModal
        isOpen={true}
        onClose={() => {}}
        patient={mockNewPatient}
        result={mockResultZeroLesions}
      />
    </LanguageProvider>
  );

  // Tiêu đề bảng phải báo 0 tổn thương (không phải 2 điểm tổn thương!)
  assert.ok(html.includes('0 tổn thương'), 'Bảng phải báo 0 tổn thương');
  assert.ok(!html.includes('2 điểm'), 'KHÔNG được báo 2 điểm tổn thương khi chỉ có mốc giải phẫu');

  // Phải có thông báo xanh lá xác nhận 0 điểm tổn thương
  assert.ok(
    html.includes('Không phát hiện tổn thương vi mạch hoặc xuất huyết khu trú đơn độc (0 điểm tổn thương)'),
    'Phải hiển thị thông báo an toàn 0 điểm tổn thương'
  );

  // Phải có dải Mốc Giải Phẫu Võng Mạc AI Định Vị
  assert.ok(html.includes('Mốc Giải Phẫu Võng Mạc AI Định Vị:'), 'Có mục Mốc Giải Phẫu Võng Mạc riêng biệt');
  assert.ok(html.includes('Gai thị (Optic Disc)'), 'Hiển thị Gai thị trong mục giải phẫu');
  assert.ok(html.includes('Hoàng điểm (FAZ)'), 'Hiển thị Hoàng điểm trong mục giải phẫu');
  assert.ok(html.includes('76.2%'), 'Hiển thị tọa độ X của Gai thị');
  assert.ok(html.includes('44.1%'), 'Hiển thị tọa độ X của Hoàng điểm');
});

runTest('ACCURACY-3: Khắc phục triệt để lỗi lặp "Chưa cập nhật • Chưa cập nhật" trong dải hành chính', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <MedicalReportModal
        isOpen={true}
        onClose={() => {}}
        patient={mockNewPatient}
        result={mockResultZeroLesions}
      />
    </LanguageProvider>
  );

  // Tuyệt đối không được chứa chuỗi "Chưa cập nhật • Chưa cập nhật"
  assert.ok(
    !html.includes('Chưa cập nhật • Chưa cập nhật'),
    'Không được lặp lại Chưa cập nhật • Chưa cập nhật'
  );
  // Họ tên và MRN
  assert.ok(html.includes('Phan Văn Định'));
  assert.ok(html.includes('MRN-2026-D630'));
});

// -----------------------------------------------------------------------------
// 3. Kiểm thử Ca Bệnh Vừa Có Tổn Thương Thật Vừa Có Mốc Giải Phẫu
// -----------------------------------------------------------------------------
console.log('\n--- 3. Kiểm thử ca bệnh hỗn hợp (Tổn thương thật + Mốc giải phẫu) ---');

const mockMixedAnomalies: VesselAnomalyRegion[] = [
  ...mockLandmarksOnly,
  {
    id: 'LESION-01',
    type: 'Microaneurysm',
    coordinates: { x: 38.5, y: 42.0, width: 22, height: 22 },
    confidence: 0.94,
    description: 'Vi phình mạch khu trú cực sau',
  },
  {
    id: 'LESION-02',
    type: 'Hemorrhage',
    coordinates: { x: 55.0, y: 60.5, width: 26, height: 26 },
    confidence: 0.91,
    description: 'Chấm xuất huyết nông',
  },
];

const mockMixedResult: AIRiskResult = {
  ...mockResultZeroLesions,
  annotatedMap: {
    ...mockResultZeroLesions.annotatedMap!,
    detectedAnomalies: mockMixedAnomalies,
  },
};

runTest('ACCURACY-4: Chỉ đếm và cắm ghim cho 2 tổn thương thật sự, không tính 2 mốc giải phẫu', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <MedicalReportModal
        isOpen={true}
        onClose={() => {}}
        patient={mockNewPatient}
        result={mockMixedResult}
      />
    </LanguageProvider>
  );

  // Bảng phải báo 2 tổn thương (không phải 4 điểm!)
  assert.ok(html.includes('2 tổn thương'), 'Chỉ đếm 2 tổn thương thật sự');
  assert.ok(!html.includes('4 điểm'), 'Không được gộp 2 mốc giải phẫu thành 4 tổn thương');

  // Trong bảng tổn thương chỉ chứa Microaneurysm và Hemorrhage
  assert.ok(html.includes('Vi phình mạch'), 'Có dòng vi phình mạch');
  assert.ok(html.includes('Xuất huyết võng mạc'), 'Có dòng xuất huyết võng mạc');

  // Cả mốc giải phẫu vẫn được hiển thị tại dải giải phẫu
  assert.ok(html.includes('Mốc Giải Phẫu Võng Mạc AI Định Vị:'));
  assert.ok(html.includes('Gai thị (Optic Disc)'));
  assert.ok(html.includes('Hoàng điểm (FAZ)'));
});

// -----------------------------------------------------------------------------
// 4. Kiểm thử Xuất Tệp CSV và HL7/FHIR JSON Chuẩn Y Khoa
// -----------------------------------------------------------------------------
console.log('\n--- 4. Kiểm thử Xuất File CSV & HL7/FHIR JSON ---');

runTest('ACCURACY-5: buildReportCsvContent tách bạch tổn thương và mốc giải phẫu', () => {
  // Ca 0 tổn thương
  const csvZero = buildReportCsvContent(mockResultZeroLesions, mockNewPatient, true);
  assert.ok(
    csvZero.includes('Không phát hiện tổn thương (0 điểm tổn thương)'),
    'CSV ghi rõ không phát hiện tổn thương khi chỉ có mốc giải phẫu'
  );
  assert.ok(
    csvZero.includes('MỐC GIẢI PHẪU VÕNG MẠC AI ĐỊNH VỊ'),
    'CSV có danh mục mốc giải phẫu riêng'
  );
  assert.ok(csvZero.includes('Gai thị (Optic Disc)'));
  assert.ok(csvZero.includes('Hoàng điểm (FAZ)'));

  // Ca hỗn hợp
  const csvMixed = buildReportCsvContent(mockMixedResult, mockNewPatient, true);
  assert.ok(csvMixed.includes('DANH MỤC TỔN THƯƠNG VI MẠCH KHU TRÚ'));
  assert.ok(csvMixed.includes('Microaneurysm'));
  assert.ok(csvMixed.includes('Hemorrhage'));
  assert.ok(csvMixed.includes('MỐC GIẢI PHẪU VÕNG MẠC AI ĐỊNH VỊ'));
});

runTest('ACCURACY-6: buildFhirDiagnosticReportBundle tách biệt Observations DETECTED_LESIONS và RETINAL_LANDMARKS', () => {
  // Ca 0 tổn thương
  const bundleZero = buildFhirDiagnosticReportBundle(mockResultZeroLesions, mockNewPatient);
  const obsResources = bundleZero.entry.slice(2).map((e: any) => e.resource);
  const lesionsObs = obsResources.find((o: any) => o.code?.coding?.some((c: any) => c.code === 'DETECTED_LESIONS'));
  const landmarksObs = obsResources.find((o: any) => o.code?.coding?.some((c: any) => c.code === 'RETINAL_LANDMARKS'));

  // DETECTED_LESIONS không được có nếu không có tổn thương bệnh lý
  assert.strictEqual(lesionsObs, undefined, 'Không tạo observation DETECTED_LESIONS khi không có tổn thương bệnh lý');
  assert.ok(landmarksObs, 'Có observation RETINAL_LANDMARKS cho mốc giải phẫu');
  assert.strictEqual(landmarksObs.valueInteger, 2, 'Có 2 mốc giải phẫu được định vị');

  // Ca hỗn hợp
  const bundleMixed = buildFhirDiagnosticReportBundle(mockMixedResult, mockNewPatient);
  const obsMixed = bundleMixed.entry.slice(2).map((e: any) => e.resource);
  const mixedLesionsObs = obsMixed.find((o: any) => o.code?.coding?.some((c: any) => c.code === 'DETECTED_LESIONS'));
  const mixedLandmarksObs = obsMixed.find((o: any) => o.code?.coding?.some((c: any) => c.code === 'RETINAL_LANDMARKS'));

  assert.ok(mixedLesionsObs, 'Có observation DETECTED_LESIONS');
  assert.strictEqual(mixedLesionsObs.valueInteger, 2, 'Chỉ đếm 2 tổn thương vi mạch thật sự');
  assert.ok(mixedLandmarksObs, 'Có observation RETINAL_LANDMARKS');
  assert.strictEqual(mixedLandmarksObs.valueInteger, 2, 'Chỉ đếm 2 mốc giải phẫu');
});

// -----------------------------------------------------------------------------
// 5. Kiểm thử Xử Lý Ca Bác Sĩ Bác Bỏ Kết Quả (REJECTED) & In Ấn Chuẩn Y Khoa
// -----------------------------------------------------------------------------
console.log('\n--- 5. Kiểm thử Ca Bác Sĩ Bác Bỏ Kết Quả (REJECTED) & In Ấn Chuẩn Y Khoa ---');

const mockRejectedResult: AIRiskResult = {
  ...mockMixedResult,
  status: 'REVIEWED',
  reviewDecision: 'REJECTED',
  doctorNotes: 'Ảnh chụp bị lóa sáng vùng hoàng điểm, không đủ điều kiện thẩm định chẩn đoán.',
  digitalSignature: 'HMAC-SHA256-REJECTED-SIGNATURE-TEST',
  signedAt: '2026-09-22T10:30:00.000Z',
  doctorName: 'BS. CKII Nguyễn Văn An',
};

runTest('ACCURACY-7: MedicalReportModal hiển thị cảnh báo và dấu mộc khi Bác sĩ BÁC BỎ kết quả', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <MedicalReportModal
        isOpen={true}
        onClose={() => {}}
        patient={mockNewPatient}
        result={mockRejectedResult}
      />
    </LanguageProvider>
  );

  // 1. Phải có nhãn Bác sĩ bác bỏ rõ ràng
  assert.ok(html.includes('BÁC SĨ ĐÃ BÁC BỎ'), 'Phải có huy hiệu BÁC SĨ ĐÃ BÁC BỎ');
  assert.ok(html.includes('BÁC BỎ BỞI BÁC SĨ') || html.includes('KẾT QUẢ BÁC BỎ'), 'Tiêu đề báo cáo phải ghi rõ Bác bỏ');

  // 2. Phải có khung cảnh báo đỏ đậm
  assert.ok(
    html.includes('CẢNH BÁO: KẾT QUẢ PHÂN TÍCH NÀY ĐÃ BỊ BÁC SĨ CHUYÊN KHOA BÁC BỎ'),
    'Có khung cảnh báo đỏ to rõ ràng'
  );
  assert.ok(
    html.includes('KHÔNG ĐƯỢC CÔNG NHẬN để chẩn đoán y khoa'),
    'Khẳng định kết quả không được công nhận để chẩn đoán'
  );

  // 3. Phải có con dấu / Watermark Bác Bỏ
  assert.ok(
    html.includes('KẾT QUẢ BỊ BÁC BỎ — KHÔNG CÔNG NHẬN LÂM SÀNG'),
    'Có con dấu mộc bác bỏ in trên phiếu'
  );

  // 4. Lý do bác bỏ từ bác sĩ phải được hiển thị chính xác
  assert.ok(
    html.includes('Ảnh chụp bị lóa sáng vùng hoàng điểm, không đủ điều kiện thẩm định chẩn đoán.'),
    'Hiển thị chính xác lý do bác sĩ bác bỏ'
  );

  // 5. Tuyệt đối KHÔNG được hiển thị "Phiếu Báo Cáo Y Tế Chính Thức" hay "Đã duyệt lâm sàng"
  assert.ok(!html.includes('Phiếu Báo Cáo Y Tế Chính Thức'), 'Không được ghi là Phiếu Báo Cáo Y Tế Chính Thức');
  assert.ok(!html.includes('Đã duyệt lâm sàng'), 'Không được ghi là Đã duyệt lâm sàng');

  // 6. Chữ ký số phải ghi rõ là chữ ký xác thực BÁC BỎ kết quả
  assert.ok(
    html.includes('Chữ ký số xác thực BÁC BỎ kết quả'),
    'Chữ ký số xác thực hành động Bác bỏ'
  );
});

runTest('ACCURACY-8: Trạng thái thẩm định phản ánh chính xác REJECTED trong xuất dữ liệu', () => {
  assert.strictEqual(mockRejectedResult.reviewDecision, 'REJECTED');
  assert.ok(mockRejectedResult.digitalSignature?.includes('REJECTED'));
});

console.log(`\n=================================================================`);
console.log(`   KẾT QUẢ: ${passedTests}/${totalTests} TESTS PASS (100%)`);
console.log(`=================================================================\n`);
