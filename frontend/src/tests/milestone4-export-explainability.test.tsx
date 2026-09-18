import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Domain Types & Mappers
import { AIRiskResult, PatientProfile, VesselAnomalyRegion } from '../types/cds';
import { mapScreeningToAIRiskResult } from '../services/screeningMapper';
import {
  getAnomalyMedicalTheme,
  getAnomalyName,
  InteractiveCDSViewer,
} from '../components/InteractiveCDSViewer';
import { PatientScreeningResultView } from '../features/patient/PatientScreeningResultView';
import { MedicalReportModal } from '../components/MedicalReportModal';
import {
  buildFhirDiagnosticReportBundle,
  sanitizeCsvCell,
  buildReportCsvContent,
} from '../services/exportService';
import { LanguageProvider } from '../context/LanguageContext';

console.log('=================================================================');
console.log('   MILESTONE 4: EXPLAINABILITY, MODEL VERSIONING & MULTI-FORMAT EXPORT');
console.log('   (NFR-15: Retinal Heatmaps | NFR-20: HL7/FHIR & CSV Export |');
console.log('    NFR-22: Multi-Class Lesions | NFR-23: Model Versioning & Calibration)');
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

// Mock Patient Profile
const mockPatient: PatientProfile = {
  id: 'pat-m4-test-01',
  userId: 'user-m4-01',
  mrn: 'MRN-7890-VN',
  fullName: 'Phạm Thị Mai',
  age: 62,
  gender: 'Female',
  phoneNumber: '0987654321',
  systolicBp: 145,
  diastolicBp: 92,
  hba1c: 7.6,
  hasDiabetes: true,
  hasHypertension: true,
};

// Mock Anomalies covering all standard & extended lesion types
const mockAnomalies: VesselAnomalyRegion[] = [
  {
    id: 'ano-1',
    type: 'Microaneurysm',
    coordinates: { x: 35, y: 42, width: 24, height: 24 },
    confidence: 0.94,
    description: 'Vi phình mạch khu trú nhánh thái dương trên',
  },
  {
    id: 'ano-2',
    type: 'Hemorrhage',
    coordinates: { x: 62, y: 55, width: 28, height: 28 },
    confidence: 0.88,
    description: 'Xuất huyết võng mạc dạng chấm nông cực sau',
  },
  {
    id: 'ano-3',
    type: 'Hard_Exudate',
    coordinates: { x: 48, y: 38, width: 22, height: 22 },
    confidence: 0.91,
    description: 'Xuất tiết cứng lipid lắng đọng hoàng điểm',
  },
  {
    id: 'ano-4',
    type: 'Cotton_Wool_Spot',
    coordinates: { x: 70, y: 65, width: 26, height: 26 },
    confidence: 0.85,
    description: 'Đốm bông xuất tiết mềm do thiếu máu cục bộ sợi thần kinh',
  },
  {
    id: 'ano-5',
    type: 'Neovascularization',
    coordinates: { x: 50, y: 20, width: 30, height: 30 },
    confidence: 0.89,
    description: 'Tân mạch võng mạc bất thường gai thị NVD',
  },
  {
    id: 'ano-6',
    type: 'Venous_Beading',
    coordinates: { x: 30, y: 75, width: 25, height: 25 },
    confidence: 0.82,
    description: 'Tĩnh mạch võng mạc giãn hình chuỗi hạt',
  },
  {
    id: 'ano-7',
    type: 'AV_Nipping',
    coordinates: { x: 40, y: 60, width: 22, height: 22 },
    confidence: 0.93,
    description: 'Hiện tượng bắt chéo động tĩnh mạch Gunn',
  },
  {
    id: 'ano-8',
    type: 'Focal_Narrowing',
    coordinates: { x: 55, y: 70, width: 24, height: 24 },
    confidence: 0.87,
    description: 'Co thắt lòng tiểu động mạch khu trú',
  },
];

// Mock AIRiskResult
const mockResult: AIRiskResult = {
  analysisId: 'aura-analysis-m4-9901',
  imageUrl: '/assets/images/fundus_sample_01.png',
  status: 'REVIEWED',
  executionTimeMs: 1420,
  overallVascularRiskScore: 68,
  riskScore: 68,
  eyePosition: 'OD',
  scanType: 'Fundus_Macula',
  icd10Codes: ['H35.03', 'E11.3'],
  doctorNotes: 'Bệnh nhân có biến đổi vi mạch võng mạc giai đoạn 2 do THA và ĐTĐ. Cần kiểm soát HA chặt chẽ.',
  digitalSignature: 'HMAC-SHA256:d8a9f4c3b2e1a0f987654321fedcba',
  signedAt: '2026-09-18T06:30:00Z',
  createdAt: '2026-09-18T06:25:00Z',
  doctorName: 'BS. CKII Nguyễn Văn Hùng',
  doctorId: 'doc-001',
  patientId: mockPatient.id,
  findings: 'Phát hiện vi phình mạch, xuất huyết dạng chấm và đốm bông xuất tiết mềm.',
  recommendations: 'Tái khám chuyên khoa đáy mắt sau 3 tháng. Giảm muối trong khẩu phần ăn.',
  modelVersion: 'Gemini 3.7 Flash High / AURA-Core v2.4',
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
    score: 72,
    hypertensionStage: 'Giai đoạn 2 (Tăng huyết áp rõ)',
    threeYearStrokeRiskPercent: 28,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 55,
    etdrsGrade: 'Cấp độ 2 (NPDR trung bình)',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 22,
  },
  annotatedMap: {
    arteryVeinRatio: 0.58,
    vesselDensityPercentage: 16.8,
    tortuosityIndex: 1.34,
    opticCupToDiscRatio: 0.42,
    detectedAnomalies: mockAnomalies,
  },
  xaiExplainability: [
    {
      title: 'Phân tích vi mạch AURA AI',
      impact: 'High',
      clinicalRationale: 'Tỷ lệ A/V 0.58 kèm uốn lượn mạch máu tăng cao cảnh báo áp lực thành mạch mạn tính.',
    },
  ],
};

// -----------------------------------------------------------------------------
// SECTION 1: NFR-15 & NFR-22 EXPLAINABILITY & MULTI-CLASS LESIONS
// -----------------------------------------------------------------------------
console.log('--- 1. NFR-15 & NFR-22: Retinal Explainability & Multi-Class Lesion Annotation ---');

test('M4-NFR22-1: getAnomalyMedicalTheme hỗ trợ chuẩn xác toàn bộ 8 loại tổn thương võng mạc lâm sàng', () => {
  const types = [
    'Hemorrhage',
    'Microaneurysm',
    'Hard_Exudate',
    'Cotton_Wool_Spot',
    'Neovascularization',
    'Venous_Beading',
    'AV_Nipping',
    'Focal_Narrowing',
  ];

  types.forEach((t) => {
    const theme = getAnomalyMedicalTheme(t);
    assert.ok(theme.border, `Tổn thương ${t} phải có class border`);
    assert.ok(theme.bg, `Tổn thương ${t} phải có class background`);
    assert.ok(theme.ping, `Tổn thương ${t} phải có class ping animation`);
    assert.ok(theme.badgeBg, `Tổn thương ${t} phải có class badgeBg`);
  });

  // Kiểm tra bảng màu y tế đặc thù cho các loại tổn thương mới mở rộng
  assert.ok(getAnomalyMedicalTheme('Cotton_Wool_Spot').border.includes('cyan'));
  assert.ok(getAnomalyMedicalTheme('Neovascularization').border.includes('purple'));
  assert.ok(getAnomalyMedicalTheme('Venous_Beading').border.includes('blue'));
  assert.ok(getAnomalyMedicalTheme('Hemorrhage').border.includes('rose'));
  assert.ok(getAnomalyMedicalTheme('Microaneurysm').border.includes('amber'));
});

test('M4-NFR15-1: InteractiveCDSViewer render bộ điều khiển Red-Free filter và Vessel Overlay', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <InteractiveCDSViewer analysisResult={mockResult} />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="cds-red-free-toggle-btn"'), 'Có nút chuyển bộ lọc quang học Red-Free');
  assert.ok(html.includes('data-testid="cds-vessel-overlay-toggle-btn"'), 'Có nút bật lớp phân đoạn mạch máu');
  assert.ok(html.includes('id="aura-red-free-filter"'), 'Có định nghĩa SVG filter quang học Red-Free 540nm');
});

test('M4-NFR15-2: PatientScreeningResultView tích hợp Red-Free filter, Vessel Overlay và đa lớp tổn thương', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientScreeningResultView result={mockResult} />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="patient-red-free-toggle-btn"'), 'Patient view có nút lọc Red-Free');
  assert.ok(html.includes('data-testid="patient-vessel-overlay-toggle-btn"'), 'Patient view có nút phân đoạn mạch máu');
  assert.ok(html.includes('data-testid="patient-vessel-canvas"'), 'Patient view có canvas phân đoạn mạch máu võng mạc');
  assert.ok(html.includes('data-testid="patient-lesion-pin-Cotton_Wool_Spot"'), 'Patient view có pin điểm đốm bông');
  assert.ok(html.includes('data-testid="patient-lesion-pin-Neovascularization"'), 'Patient view có pin tân mạch');
  assert.ok(html.includes('data-testid="patient-lesion-pin-Venous_Beading"'), 'Patient view có pin tĩnh mạch chuỗi hạt');
  assert.ok(html.includes('data-testid="patient-lesion-pin-Microaneurysm"'), 'Patient view có pin vi phình mạch');
});

// -----------------------------------------------------------------------------
// SECTION 2: NFR-23 MODEL VERSIONING & CONFIDENCE CALIBRATION TRACKING
// -----------------------------------------------------------------------------
console.log('\n--- 2. NFR-23: AI Model Versioning & Confidence Calibration Tracking ---');

test('M4-NFR23-1: screeningMapper gán mặc định lâm sàng chuẩn cho modelVersion, activeThresholds, calibration', () => {
  const rawMinimalScreening = {
    id: 'scr-min-01',
    cardiovascularRiskScore: 60,
    diabeticRetinopathyRiskScore: 45,
  };

  const mapped = mapScreeningToAIRiskResult(rawMinimalScreening, '/fallback.png');

  assert.strictEqual(mapped.modelVersion, 'Gemini 3.7 Flash High / AURA-Core v2.4');
  assert.deepStrictEqual(mapped.activeThresholds, {
    cvdHighRiskThreshold: 65,
    drConfidenceThreshold: 70,
    avRatioConstrictionThreshold: 0.65,
  });
  assert.strictEqual(mapped.confidenceCalibration?.brierScore, 0.058);
  assert.strictEqual(mapped.confidenceCalibration?.calibratedConfidence, 94.2);
  assert.ok(mapped.confidenceCalibration?.calibrationMethod?.includes('Platt Scaling'));
});

test('M4-NFR23-2: screeningMapper tôn trọng các giá trị cấu hình động do backend truyền vào', () => {
  const rawCustomScreening = {
    id: 'scr-custom-01',
    cardiovascularRiskScore: 80,
    diabeticRetinopathyRiskScore: 75,
    modelVersion: 'Gemini 3.7 Flash High / AURA-Core v3.0-RC1',
    cvdHighRiskThreshold: 60,
    drConfidenceThreshold: 65,
    avRatioConstrictionThreshold: 0.67,
    brierScore: 0.042,
    calibratedConfidence: 96.5,
    calibrationMethod: 'Isotonic Regression',
  };

  const mapped = mapScreeningToAIRiskResult(rawCustomScreening, '/fallback.png');

  assert.strictEqual(mapped.modelVersion, 'Gemini 3.7 Flash High / AURA-Core v3.0-RC1');
  assert.strictEqual(mapped.activeThresholds?.cvdHighRiskThreshold, 60);
  assert.strictEqual(mapped.activeThresholds?.drConfidenceThreshold, 65);
  assert.strictEqual(mapped.activeThresholds?.avRatioConstrictionThreshold, 0.67);
  assert.strictEqual(mapped.confidenceCalibration?.brierScore, 0.042);
  assert.strictEqual(mapped.confidenceCalibration?.calibratedConfidence, 96.5);
  assert.strictEqual(mapped.confidenceCalibration?.calibrationMethod, 'Isotonic Regression');
});

test('M4-NFR23-3: InteractiveCDSViewer hiển thị huy hiệu modelVersion và chỉ số hiệu chuẩn Brier/Platt', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <InteractiveCDSViewer analysisResult={mockResult} />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="cds-model-version-badge"'), 'Có huy hiệu phiên bản model trên CDS');
  assert.ok(html.includes('Gemini 3.7 Flash High / AURA-Core v2.4'), 'Hiển thị chính xác tên model AI');
  assert.ok(html.includes('data-testid="cds-calibration-metrics"'), 'Có chỉ số hiệu chuẩn Platt & Brier');
  assert.ok(html.includes('Brier Score: 0.058'), 'Hiển thị điểm Brier score');
  assert.ok(html.includes('Platt Calibrated: 94.2%'), 'Hiển thị độ tin cậy hiệu chuẩn Platt');
});

test('M4-NFR23-4: PatientScreeningResultView hiển thị modelVersion trên giao diện bệnh nhân', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientScreeningResultView result={mockResult} />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="patient-model-version-badge"'), 'Có huy hiệu phiên bản model trên Patient view');
  assert.ok(html.includes('Gemini 3.7 Flash High / AURA-Core v2.4'), 'Hiển thị chính xác tên model AI');
});

test('M4-NFR23-5: MedicalReportModal hiển thị modelVersion và calibration badge trong phiếu khám', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <MedicalReportModal
        isOpen={true}
        onClose={() => {}}
        patient={mockPatient}
        result={mockResult}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="report-model-version-badge"'), 'Có model version badge trên báo cáo y tế');
  assert.ok(html.includes('Gemini 3.7 Flash High / AURA-Core v2.4'));
  assert.ok(html.includes('data-testid="report-calibration-badge"'), 'Có calibration badge trên báo cáo y tế');
  assert.ok(html.includes('Brier: 0.058'));
  assert.ok(html.includes('Platt Calibrated: 94.2%'));
});

// -----------------------------------------------------------------------------
// SECTION 3: NFR-20 STANDARDIZED MULTI-FORMAT EXPORT (FHIR, CSV, PDF)
// -----------------------------------------------------------------------------
console.log('\n--- 3. NFR-20: Standardized Multi-Format Export (FHIR JSON, CSV, PDF) ---');

test('M4-NFR20-1: buildFhirDiagnosticReportBundle tạo gói HL7/FHIR R4 Bundle đúng chuẩn y tế quốc tế', () => {
  const bundle = buildFhirDiagnosticReportBundle(mockResult, mockPatient);

  assert.strictEqual(bundle.resourceType, 'Bundle');
  assert.strictEqual(bundle.type, 'document');
  assert.ok(bundle.meta?.profile?.includes('http://hl7.org/fhir/StructureDefinition/DiagnosticReport'));
  assert.ok(bundle.entry && bundle.entry.length >= 7, 'Bundle phải có tối thiểu 7 entries');

  // Kiểm tra Resource Patient (Entry 0)
  const patientEntry = bundle.entry[0].resource;
  assert.strictEqual(patientEntry.resourceType, 'Patient');
  assert.strictEqual(patientEntry.identifier[0].value, mockPatient.mrn);
  assert.strictEqual(patientEntry.name[0].text, mockPatient.fullName);
  assert.strictEqual(patientEntry.gender, 'female');

  // Kiểm tra Resource DiagnosticReport (Entry 1)
  const reportEntry = bundle.entry[1].resource;
  assert.strictEqual(reportEntry.resourceType, 'DiagnosticReport');
  assert.strictEqual(reportEntry.status, 'final');
  assert.strictEqual(reportEntry.code.coding[0].code, '58452-4'); // LOINC Diagnostic imaging report
  assert.strictEqual(reportEntry.category[0].coding[0].code, 'RAD');

  // Kiểm tra các Observations vi mạch quan trọng
  const obsResources = bundle.entry.slice(2).map((e: any) => e.resource);
  const findObsByCode = (code: string) =>
    obsResources.find((o: any) =>
      o.code?.coding?.some((c: any) => c.code === code)
    );

  // 1. Cardiovascular disease 10Y risk (LOINC 79378-6)
  const cardioObs = findObsByCode('79378-6');
  assert.ok(cardioObs, 'Phải có Observation nguy cơ tim mạch LOINC 79378-6');
  assert.strictEqual(cardioObs.valueQuantity.value, 72);

  // 2. Diabetic retinopathy (SNOMED 4855003)
  const drObs = findObsByCode('4855003');
  assert.ok(drObs, 'Phải có Observation võng mạc đái tháo đường SNOMED 4855003');
  assert.strictEqual(drObs.valueQuantity.value, 55);

  // 3. Artery/Vein ratio (AVR)
  const avrObs = findObsByCode('AV_RATIO');
  assert.ok(avrObs, 'Phải có Observation tỷ lệ động tĩnh mạch AV_RATIO');
  assert.strictEqual(avrObs.valueQuantity.value, 0.58);
  assert.strictEqual(avrObs.referenceRange[0].low.value, 0.67);

  // 4. Optic Cup to Disc Ratio (LOINC 71520-1)
  const cdrObs = findObsByCode('71520-1');
  assert.ok(cdrObs, 'Phải có Observation tỷ lệ lõm gai LOINC 71520-1');
  assert.strictEqual(cdrObs.valueQuantity.value, 0.42);

  // 5. Detected Microvascular Lesions
  const lesionsObs = findObsByCode('DETECTED_LESIONS');
  assert.ok(lesionsObs, 'Phải có Observation danh mục tổn thương vi mạch');
  assert.strictEqual(lesionsObs.valueInteger, 8);
  assert.strictEqual(lesionsObs.component.length, 8);

  // 6. AI Model Version & Calibration Provenance
  const aiTraceObs = findObsByCode('AI_MODEL_TRACEABILITY');
  assert.ok(aiTraceObs, 'Phải có Observation truy vết phiên bản mô hình AI');
  assert.strictEqual(aiTraceObs.valueString, 'Gemini 3.7 Flash High / AURA-Core v2.4');
});

test('M4-NFR20-2: sanitizeCsvCell khử an toàn toàn bộ các ký tự gây tấn công CSV Formula Injection (CWE-1236)', () => {
  assert.strictEqual(sanitizeCsvCell('=cmd|"/C calc"!A0'), '\'=cmd|"/C calc"!A0');
  assert.strictEqual(sanitizeCsvCell('+12345'), '\'+12345');
  assert.strictEqual(sanitizeCsvCell('-SUM(A1:A10)'), '\'-SUM(A1:A10)');
  assert.strictEqual(sanitizeCsvCell('@test'), '\'@test');
  assert.strictEqual(sanitizeCsvCell('\tMaliciousTab'), '\'\tMaliciousTab');
  assert.strictEqual(sanitizeCsvCell('Normal Patient Name'), 'Normal Patient Name');
  assert.strictEqual(sanitizeCsvCell(null), '');
  assert.strictEqual(sanitizeCsvCell(undefined), '');
});

test('M4-NFR20-3: buildReportCsvContent sinh file CSV có UTF-8 BOM và đầy đủ tham số vi mạch võng mạc', () => {
  const csv = buildReportCsvContent(mockResult, mockPatient, true);

  // Phải bắt đầu bằng UTF-8 BOM (\uFEFF)
  assert.ok(csv.startsWith('\uFEFF'), 'CSV phải bắt đầu bằng UTF-8 BOM (\\uFEFF)');
  assert.ok(csv.includes('BÁO CÁO SÀNG LỌC VI MẠCH VÕNG MẠC AURA'));
  assert.ok(csv.includes(mockPatient.mrn!));
  assert.ok(csv.includes('68/100'), 'Có điểm rủi ro tổng hợp');
  assert.ok(csv.includes('0.58'), 'Có tỷ lệ A/V Ratio');
  assert.ok(csv.includes('1.34'), 'Có chỉ số uốn lượn mạch máu');
  assert.ok(csv.includes('0.42'), 'Có tỷ lệ CDR');
  assert.ok(csv.includes('Gemini 3.7 Flash High / AURA-Core v2.4'), 'Có phiên bản model AI');
  assert.ok(csv.includes('DANH MỤC TỔN THƯƠNG VI MẠCH KHU TRÚ'), 'Có bảng chi tiết tổn thương vi mạch');
  assert.ok(csv.includes('Cotton_Wool_Spot'), 'Có ghi nhận Cotton Wool Spot trong CSV');
});

test('M4-NFR20-4: MedicalReportModal hiển thị nút "Xuất JSON (FHIR)" cạnh nút "Xuất CSV" và "In Phiếu"', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <MedicalReportModal
        isOpen={true}
        onClose={() => {}}
        patient={mockPatient}
        result={mockResult}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('data-testid="report-export-fhir-btn"'), 'Có nút Xuất JSON (FHIR) trên modal báo cáo y tế');
  assert.ok(html.includes('Xuất JSON (FHIR)'));
  assert.ok(html.includes('Xuất CSV'));
  assert.ok(html.includes('In Phiếu / PDF'));
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('=================================================================');

if (totalTests !== passedTests) {
  process.exit(1);
} else {
  process.exit(0);
}
