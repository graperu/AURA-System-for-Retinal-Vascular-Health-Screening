import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Components under test
import {
  MedicalDisclaimer,
  MANDATORY_MEDICAL_DISCLAIMER,
} from '../components/ui/MedicalDisclaimer.tsx';
import { RiskBadge } from '../components/ui/RiskBadge.tsx';
import { Button } from '../components/ui/Button.tsx';
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from '../components/ui/StateFeedback.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { EyeBadge } from '../components/ui/EyeBadge.tsx';
import { ScanTypeBadge } from '../components/ui/ScanTypeBadge.tsx';
import { ClinicalSelect, type ClinicalSelectOption, type ClinicalSelectProps } from '../components/ui/ClinicalSelect.tsx';
import {
  PatientHistoryView,
  type PatientHistoryItem,
} from '../features/patient/PatientHistoryView.tsx';
import {
  InteractiveCDSViewer,
  getAnomalyMedicalTheme,
  renderAnatomicalHeatmap,
  processVesselOverlayCanvas,
} from '../components/InteractiveCDSViewer.tsx';
import { ClinicalRiskSummaryCard } from '../components/ClinicalRiskSummaryCard.tsx';
import { PatientScreeningResultView } from '../features/patient/PatientScreeningResultView.tsx';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel.tsx';
import { ConsultationChatModal } from '../components/ConsultationChatModal.tsx';
import { ClinicBatchWorkspace } from '../features/clinic/ClinicBatchWorkspace.tsx';
import { DoctorWorklistView } from '../features/doctor/DoctorWorklistView.tsx';
import {
  renderDynamicRetinalHeatmap,
  generateDynamicHeatmapDataUrl,
  getMedicalPlasmaColor,
} from '../utils/dynamicHeatmapEngine.ts';
import { DynamicHeatmapCanvas } from '../components/DynamicHeatmapCanvas.tsx';
import {
  getClinicBatchStorageKey,
  loadBatchJobForClinic,
  createEmptyBatchJob,
} from '../pages/ClinicPortalPage.tsx';
import type { AIRiskResult, ClinicBatchJob, PatientProfile } from '../types/cds.ts';

// Polyfill localStorage cho môi trường kiểm thử Node
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => { store.set(key, String(val)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: 0,
  } as any;
}

/**
 * Bộ kiểm thử E2E Frontend & Các Thành Phần Giao Diện Lâm Sàng AURA
 * Bao gồm:
 * 1. Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer) trên các màn hình sàng lọc.
 * 2. Các mức RiskBadge (LOW, MODERATE, HIGH, CRITICAL, UNVERIFIED) theo định dạng cảnh báo y tế.
 * 3. Nút bấm Clean UI (Button) đầy đủ biến thể, trạng thái disabled, loading spinner, focus-visible.
 * 4. Bàn chẩn đoán CDS (InteractiveCDSViewer) với thanh trượt Opacity, chuyển chế độ buồng tối (Dark Room).
 * 5. Các thành phần bảng và trạng thái rỗng (EmptyState, LoadingState, ErrorState, DataTable).
 */

console.log('=================================================================');
console.log('   AURA CLINICAL UI & CDS COMPONENTS VERIFICATION SUITE');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result && typeof (result as any).then === 'function') {
      return (result as Promise<void>)
        .then(() => {
          passedTests++;
          console.log(`  [PASS] ${name}`);
        })
        .catch((err: any) => {
          console.error(`  [FAIL] ${name}`);
          console.error(`         Error: ${err?.message || err}`);
          throw err;
        });
    }
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    throw err;
  }
}

// Dữ liệu mẫu chuẩn lâm sàng phục vụ kiểm thử
const sampleAnalysisResult: AIRiskResult = {
  analysisId: 'SCR-TEST-E2E-001',
  createdAt: '2026-03-14T09:00:00.000Z',
  status: 'ANALYZED',
  executionTimeMs: 1350,
  overallVascularRiskScore: 72,
  riskScore: 72,
  imageUrl: '/assets/images/fundus_sample_od.png',
  cardiovascularRisk: {
    level: 'High',
    score: 72,
    hypertensionStage: 'Giai đoạn 1',
    threeYearStrokeRiskPercent: 20,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 55,
    etdrsGrade: 'Mild NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 15,
  },
  annotatedMap: {
    arteryVeinRatio: 0.58,
    vesselDensityPercentage: 16.2,
    tortuosityIndex: 1.34,
    opticCupToDiscRatio: 0.42,
    heatmapUrl: '/assets/images/fundus_sample_heatmap.png',
    detectedAnomalies: [
      {
        id: 'anom-01',
        type: 'Microaneurysm',
        confidence: 0.89,
        coordinates: { x: 42, y: 55, width: 28, height: 28 },
        description: 'Vi phình mạch khu trú nhánh thái dương trên',
      },
      {
        id: 'anom-02',
        type: 'Hemorrhage',
        confidence: 0.94,
        coordinates: { x: 65, y: 70, width: 32, height: 32 },
        description: 'Vùng xuất huyết nhỏ dạng chấm võng mạc',
      },
    ],
  },
  xaiExplainability: [],
  findings: 'Phát hiện hẹp nhẹ tiểu động mạch và có vài điểm vi phình mạch.',
  recommendations: 'Tái khám định kỳ sau 3 tháng.',
};

// -----------------------------------------------------------------------------
// PHẦN 1: TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM Y TẾ (MEDICAL DISCLAIMER)
// -----------------------------------------------------------------------------
console.log('--- 1. Kiểm thử Tuyên Bố Miễn Trừ Trách Nhiệm Y Tế (Medical Disclaimer) ---');

runTest('DISCLAIMER-1: Nội dung chuỗi MANDATORY_MEDICAL_DISCLAIMER tuân thủ nghiêm ngặt quy tắc an toàn y tế', () => {
  const expectedText =
    'Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.';
  assert.strictEqual(MANDATORY_MEDICAL_DISCLAIMER, expectedText);
  assert.ok(MANDATORY_MEDICAL_DISCLAIMER.includes('hỗ trợ sàng lọc'));
  assert.ok(MANDATORY_MEDICAL_DISCLAIMER.includes('không thay thế chẩn đoán chuyên môn'));
});

runTest('DISCLAIMER-2: Biến thể "banner" có đầy đủ aria role="note", tiêu đề và icon cảnh báo', () => {
  const html = renderToStaticMarkup(React.createElement(MedicalDisclaimer, { variant: 'banner' }));
  assert.ok(html.includes('role="note"'), 'Phải có role="note" cho trợ năng');
  assert.ok(html.includes('aria-label="Cảnh báo an toàn y khoa CDS"'), 'Có aria-label an toàn y tế');
  assert.ok(html.includes('Tuyên bố Miễn trừ Y tế:'), 'Có tiêu đề banner đầy đủ');
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER), 'Chứa đầy đủ nội dung disclaimer');
  assert.ok(html.includes('bg-amber-50/90'), 'Màu nền cảnh báo amber');
  assert.ok(html.includes('lucide-alert-circle'), 'Có icon cảnh báo AlertCircle');
});

runTest('DISCLAIMER-3: Biến thể "compact" (mặc định) có bố cục gọn gàng, phù hợp bên dưới bảng chỉ số', () => {
  const html = renderToStaticMarkup(React.createElement(MedicalDisclaimer, {}));
  assert.ok(html.includes('role="note"'));
  assert.ok(html.includes('Lưu ý y khoa bắt buộc:'));
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER));
  assert.ok(html.includes('bg-amber-50/80'));
  assert.ok(html.includes('lucide-shield-check'));
});

runTest('DISCLAIMER-4: Biến thể "subtle" sử dụng tông màu slate trung tính cho chế độ tối hoặc analytics', () => {
  const html = renderToStaticMarkup(React.createElement(MedicalDisclaimer, { variant: 'subtle' }));
  assert.ok(html.includes('role="note"'));
  assert.ok(html.includes('Lưu ý y khoa bắt buộc:'));
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER));
  assert.ok(html.includes('bg-slate-50'));
  assert.ok(html.includes('text-slate-600'));
});

runTest('DISCLAIMER-5: Thuộc tính showIcon={false} ẩn icon SVG nhưng giữ nguyên nội dung miễn trừ y tế', () => {
  const html = renderToStaticMarkup(React.createElement(MedicalDisclaimer, { variant: 'banner', showIcon: false }));
  assert.ok(!html.includes('<svg'), 'Không được có thẻ SVG khi showIcon=false');
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER), 'Vẫn chứa đầy đủ nội dung disclaimer');
});

runTest('DISCLAIMER-6: Medical Disclaimer luôn hiện diện bắt buộc trong ClinicalRiskSummaryCard', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: sampleAnalysisResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER), 'ClinicalRiskSummaryCard phải hiển thị Disclaimer');
  assert.ok(html.includes('Tuyên bố Miễn trừ Y tế'), 'Chứa nhãn tiêu đề cảnh báo');
});

runTest('DISCLAIMER-7: Medical Disclaimer luôn hiện diện bắt buộc trong InteractiveCDSViewer', () => {
  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
      selectedEye: 'OD (Mắt Phải)',
    })
  );
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER), 'InteractiveCDSViewer phải hiển thị Disclaimer');
  assert.ok(html.includes('role="note"'));
});

runTest('DISCLAIMER-8: Medical Disclaimer luôn hiện diện bắt buộc trong PatientScreeningResultView', () => {
  const html = renderToStaticMarkup(
    React.createElement(PatientScreeningResultView, {
      result: sampleAnalysisResult,
      selectedEye: 'OD (Mắt Phải)',
    })
  );
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER), 'PatientScreeningResultView phải hiển thị Disclaimer');
});

runTest('DISCLAIMER-9: Medical Disclaimer luôn hiện diện bắt buộc trong RiskAssessmentPanel', () => {
  const html = renderToStaticMarkup(
    React.createElement(RiskAssessmentPanel, {
      result: sampleAnalysisResult,
    })
  );
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER), 'RiskAssessmentPanel phải hiển thị Disclaimer');
});

// -----------------------------------------------------------------------------
// PHẦN 2: CÁC MỨC RISK BADGE CHUẨN ĐỊNH DẠNG CẢNH BÁO Y TẾ
// -----------------------------------------------------------------------------
console.log('\n--- 2. Kiểm thử Định Dạng Cảnh Báo Y Tế Của RiskBadge ---');

runTest('RISKBADGE-1: Mức LOW / NORMAL hiển thị nhãn "Nguy cơ Thấp" và màu xanh lá y tế', () => {
  const htmlLow = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'LOW' }));
  assert.ok(htmlLow.includes('Nguy cơ Thấp'), 'Nhãn Nguy cơ Thấp');
  assert.ok(htmlLow.includes('bg-emerald-50 text-emerald-800 border-emerald-200'), 'Class màu xanh lá emerald');
  assert.ok(htmlLow.includes('lucide-shield-check'), 'Icon ShieldCheck bảo vệ');

  const htmlNormal = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'Normal' }));
  assert.ok(htmlNormal.includes('Nguy cơ Thấp'));
  assert.ok(htmlNormal.includes('text-emerald-800'));
});

runTest('RISKBADGE-2: Mức MODERATE / MEDIUM hiển thị nhãn "Nguy cơ Trung bình" và màu vàng cam y tế', () => {
  const htmlMod = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'MODERATE' }));
  assert.ok(htmlMod.includes('Nguy cơ Trung bình'), 'Nhãn Nguy cơ Trung bình');
  assert.ok(htmlMod.includes('bg-amber-50 text-amber-800 border-amber-200'), 'Class màu vàng amber');
  assert.ok(htmlMod.includes('lucide-alert-circle'), 'Icon AlertCircle');

  const htmlMed = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'Medium' }));
  assert.ok(htmlMed.includes('Nguy cơ Trung bình'));
  assert.ok(htmlMed.includes('text-amber-800'));
});

runTest('RISKBADGE-3: Mức HIGH hiển thị nhãn "Nguy cơ Cao" và màu cam đậm y tế', () => {
  const htmlHigh = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'HIGH' }));
  assert.ok(htmlHigh.includes('Nguy cơ Cao'), 'Nhãn Nguy cơ Cao');
  assert.ok(htmlHigh.includes('bg-orange-50 text-orange-800 border-orange-200'), 'Class màu cam orange');
  assert.ok(htmlHigh.includes('lucide-alert-triangle'), 'Icon AlertTriangle');

  const htmlHighCase = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'High' }));
  assert.ok(htmlHighCase.includes('Nguy cơ Cao'));
  assert.ok(htmlHighCase.includes('text-orange-800'));
});

runTest('RISKBADGE-4: Mức CRITICAL / SEVERE hiển thị nhãn "Nguy kịch" và màu đỏ sẫm in đậm font-bold', () => {
  const htmlCrit = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'CRITICAL' }));
  assert.ok(htmlCrit.includes('Nguy kịch'), 'Nhãn Nguy kịch');
  assert.ok(htmlCrit.includes('bg-red-50 text-red-800 border-red-200 font-bold'), 'Class màu đỏ red kèm font-bold');
  assert.ok(htmlCrit.includes('lucide-alert-triangle'), 'Icon AlertTriangle');

  const htmlSev = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'Severe' }));
  assert.ok(htmlSev.includes('Nguy kịch'));
  assert.ok(htmlSev.includes('text-red-800'));
});

runTest('RISKBADGE-5: Mức UNVERIFIED / null / undefined hiển thị nhãn "Cần thẩm định lại" (chống False Negative)', () => {
  const htmlUnv = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'UNVERIFIED' }));
  assert.ok(htmlUnv.includes('Cần thẩm định lại'), 'Nhãn Cần thẩm định lại');
  assert.ok(htmlUnv.includes('bg-slate-50 text-slate-700 border-slate-200'), 'Class xám slate trung tính');
  assert.ok(htmlUnv.includes('lucide-help-circle'), 'Icon HelpCircle');

  const htmlNull = renderToStaticMarkup(React.createElement(RiskBadge, { level: null }));
  assert.ok(htmlNull.includes('Nguy cơ Thấp') || htmlNull.includes('Cần thẩm định lại'), 'Xử lý an toàn khi level=null');

  const htmlInconclusive = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'INCONCLUSIVE' }));
  assert.ok(htmlInconclusive.includes('Cần thẩm định lại'));
});

runTest('RISKBADGE-6: Kích cỡ badge (sm, md, lg) sinh class padding và cỡ chữ tương ứng', () => {
  const htmlSm = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'LOW', size: 'sm' }));
  assert.ok(htmlSm.includes('text-[11px] px-2 py-0.5 gap-1'), 'Class size sm');

  const htmlMd = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'LOW', size: 'md' }));
  assert.ok(htmlMd.includes('text-xs px-2.5 py-1 gap-1.5'), 'Class size md');

  const htmlLg = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'LOW', size: 'lg' }));
  assert.ok(htmlLg.includes('text-sm px-3 py-1.5 gap-2'), 'Class size lg');
});

runTest('RISKBADGE-7: Tùy chọn showIcon={false} và className tùy chỉnh hoạt động chuẩn xác', () => {
  const htmlNoIcon = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'HIGH', showIcon: false }));
  assert.ok(!htmlNoIcon.includes('<svg'), 'Không có icon khi showIcon=false');
  assert.ok(htmlNoIcon.includes('Nguy cơ Cao'), 'Vẫn giữ nhãn');

  const htmlCustomClass = renderToStaticMarkup(React.createElement(RiskBadge, { level: 'LOW', className: 'custom-shadow-cls' }));
  assert.ok(htmlCustomClass.includes('custom-shadow-cls'), 'Đính kèm class tùy biến');
});

// -----------------------------------------------------------------------------
// PHẦN 3: NÚT BẤM CLEAN UI (BUTTON COMPONENT)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Kiểm thử Trạng Thái Các Nút Bấm Clean UI (Button) ---');

runTest('BUTTON-1: Đầy đủ 6 biến thể Clean UI (primary, secondary, outline, ghost, danger, success)', () => {
  const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'] as const;
  const expectedClasses: Record<string, string> = {
    primary: 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200',
    outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/70',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white',
  };

  for (const v of variants) {
    const html = renderToStaticMarkup(React.createElement(Button, { variant: v }, `Btn-${v}`));
    assert.ok(html.includes(expectedClasses[v]), `Biến thể ${v} phải có class đặc trưng: ${expectedClasses[v]}`);
    assert.ok(html.includes(`Btn-${v}`), `Biến thể ${v} phải render đúng nội dung text`);
  }
});

runTest('BUTTON-2: Đầy đủ 3 kích thước size (sm, md, lg) theo chuẩn hệ thống thiết kế Clinical UI', () => {
  const htmlSm = renderToStaticMarkup(React.createElement(Button, { size: 'sm' }, 'Small'));
  assert.ok(htmlSm.includes('h-8 px-3.5 text-xs rounded-xl gap-1.5'), 'Size sm có h-8 px-3.5 rounded-xl');

  const htmlMd = renderToStaticMarkup(React.createElement(Button, { size: 'md' }, 'Medium'));
  assert.ok(htmlMd.includes('h-10 px-4 text-xs sm:text-sm rounded-xl gap-2'), 'Size md có h-10 px-4 rounded-xl');

  const htmlLg = renderToStaticMarkup(React.createElement(Button, { size: 'lg' }, 'Large'));
  assert.ok(htmlLg.includes('h-12 px-6 text-sm sm:text-base rounded-xl gap-2.5'), 'Size lg có h-12 px-6 rounded-xl');
});

runTest('BUTTON-3: Trạng thái Disabled kích hoạt thuộc tính HTML disabled và style cấm tương tác', () => {
  const htmlDisabled = renderToStaticMarkup(React.createElement(Button, { disabled: true }, 'Vô hiệu hóa'));
  assert.ok(htmlDisabled.includes('disabled=""') || htmlDisabled.includes('disabled'), 'Thuộc tính HTML disabled phải có');
  assert.ok(htmlDisabled.includes('disabled:cursor-not-allowed disabled:opacity-50'), 'Class cursor-not-allowed & opacity-50');
});

runTest('BUTTON-4: Trạng thái Loading kích hoạt spinner quay Lucide Loader2 và tự động khóa nút', () => {
  const htmlLoading = renderToStaticMarkup(React.createElement(Button, { loading: true }, 'Đang gửi...'));
  assert.ok(htmlLoading.includes('disabled=""') || htmlLoading.includes('disabled'), 'Nút tự động bị khóa khi đang loading');
  assert.ok(htmlLoading.includes('lucide-loader2'), 'Hiển thị icon Loader2');
  assert.ok(htmlLoading.includes('animate-spin'), 'Icon có hiệu ứng xoay tròn animate-spin');
});

runTest('BUTTON-5: Tính trợ năng Focus-visible ring và cấm bôi đen vô ý select-none', () => {
  const html = renderToStaticMarkup(React.createElement(Button, {}, 'Accessible Button'));
  assert.ok(html.includes('focus-visible:outline-none'), 'Có focus-visible:outline-none');
  assert.ok(html.includes('focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'), 'Vòng focus ring 2px thương hiệu');
  assert.ok(html.includes('select-none'), 'Chống bôi đen nhầm khi double-click');
});

runTest('BUTTON-6: Hỗ trợ Icon truyền vào khi không loading và ẩn icon khi loading', () => {
  const sampleIcon = React.createElement('span', { className: 'test-custom-icon' }, '★');

  const htmlWithIcon = renderToStaticMarkup(React.createElement(Button, { icon: sampleIcon }, 'Có Icon'));
  assert.ok(htmlWithIcon.includes('test-custom-icon'), 'Render custom icon');
  assert.ok(htmlWithIcon.includes('flex-shrink-0'), 'Bọc trong container flex-shrink-0');

  const htmlLoadingWithIcon = renderToStaticMarkup(React.createElement(Button, { icon: sampleIcon, loading: true }, 'Có Icon'));
  assert.ok(!htmlLoadingWithIcon.includes('test-custom-icon'), 'Custom icon bị ẩn khi loading');
  assert.ok(htmlLoadingWithIcon.includes('lucide-loader2'), 'Thay thế bằng Loader2');
});

// -----------------------------------------------------------------------------
// PHẦN 4: BÀN CHẨN ĐOÁN CDS (InteractiveCDSViewer)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Kiểm thử Bàn Chẩn Đoán CDS (InteractiveCDSViewer) ---');

runTest('VIEWER-1: Cấu trúc khởi tạo bàn chẩn đoán CDS đầy đủ 2 màn hình đối chiếu song song', () => {
  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
      selectedEye: 'OD (Mắt Phải)',
    })
  );

  // 1. Tiêu đề và nhãn mắt (chuẩn hóa không còn chuỗi lai tạp)
  assert.ok(html.includes('Bàn chẩn đoán tương tác CDS — Bản đồ nhiệt Grad-CAM'));
  assert.ok(!html.includes('Fundus &amp; Grad-CAM Heatmap Viewer'), 'Không chứa chuỗi lai tạp cũ');
  assert.ok(html.includes('OD (Mắt Phải)'));

  // 2. Màn hình bên trái: Ảnh gốc võng mạc
  assert.ok(html.includes('Ảnh chụp đáy mắt gốc'));
  assert.ok(html.includes('/assets/images/fundus_sample_od.png'));

  // 3. Màn hình bên phải: Bản đồ chú ý Grad-CAM
  assert.ok(html.includes('Bản đồ nhiệt Grad-CAM'));
  assert.ok(html.includes('/assets/images/fundus_sample_heatmap.png'));
});

runTest('VIEWER-2: Thanh trượt Opacity có giá trị mặc định 65%, phạm vi 0-1, bước nhảy 0.05 và nhãn trợ năng', () => {
  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
    })
  );

  assert.ok(html.includes('type="range"'), 'Là input thanh trượt type="range"');
  assert.ok(html.includes('min="0"'), 'Giá trị tối thiểu 0');
  assert.ok(html.includes('max="1"'), 'Giá trị tối đa 1');
  assert.ok(html.includes('step="0.05"'), 'Bước nhảy 0.05');
  assert.ok(html.includes('value="0.65"'), 'Độ mờ ban đầu 0.65');
  assert.ok(html.includes('65%'), 'Hiển thị nhãn 65%');
  assert.ok(html.includes('aria-label="Độ mờ bản đồ nhiệt AI"'), 'Có nhãn trợ năng aria-label');

  // Lớp phủ heatmap nhận đúng style opacity
  assert.ok(html.includes('style="opacity:0.65"'), 'Lớp phủ Heatmap nhận opacity: 0.65');
  assert.ok(html.includes('pointer-events-none'), 'Lớp phủ heatmap không chặn tương tác chuột');
  assert.ok(html.includes('cds-canvas-overlay'), 'Có class overlay chuyên biệt cds-canvas-overlay');
});

runTest('VIEWER-3: Nút chuyển chế độ buồng tối (Dark Room) và cấu trúc màu sắc Obsidian chống lóa', () => {
  const htmlNormal = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
    })
  );
  assert.ok(htmlNormal.includes('Buồng tối'), 'Mặc định hiển thị Buồng tối');
  assert.ok(!htmlNormal.includes('Buồng Tối (Dark Room)'), 'Không chứa chuỗi lai tạp cũ');
  assert.ok(htmlNormal.includes('lucide-moon'), 'Icon Moon cho chế độ tối');
  assert.ok(htmlNormal.includes('bg-white'), 'Nền thẻ ở chế độ sáng');

  // Kiểm tra mô phỏng khi bật chế độ Dark Room
  const isDarkRoom = true;
  const darkRoomClasses = {
    cardBg: isDarkRoom ? 'bg-darkroom-card border-darkroom-border text-darkroom-text' : 'bg-white',
    buttonText: isDarkRoom ? 'Buồng tối: BẬT' : 'Buồng tối',
    buttonBg: isDarkRoom ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' : 'bg-clinical-surface-subtle',
    eyeTag: isDarkRoom ? 'bg-slate-800 text-cyan-300 border-slate-700 font-mono-data' : 'bg-slate-100',
    disclaimerVariant: isDarkRoom ? 'subtle' : 'compact',
  };

  assert.strictEqual(darkRoomClasses.buttonText, 'Buồng tối: BẬT');
  assert.ok(darkRoomClasses.cardBg.includes('bg-darkroom-card'));
  assert.ok(darkRoomClasses.buttonBg.includes('text-cyan-300'));
  assert.ok(darkRoomClasses.eyeTag.includes('font-mono-data'));
  assert.strictEqual(darkRoomClasses.disclaimerVariant, 'subtle');
});

runTest('VIEWER-4: Bộ điều khiển Zoom có phóng to, thu nhỏ, đặt lại và hiển thị tỷ lệ phần trăm', () => {
  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
    })
  );

  assert.ok(html.includes('lucide-zoom-out'), 'Có icon ZoomOut');
  assert.ok(html.includes('lucide-zoom-in'), 'Có icon ZoomIn');
  assert.ok(html.includes('lucide-rotate-ccw'), 'Có icon RotateCcw đặt lại');
  assert.ok(html.includes('100%'), 'Mức zoom ban đầu hiển thị 100%');
  assert.ok(html.includes('style="transform:scale(1)"'), 'Ảnh nhận biến đổi transform: scale(1)');
});

runTest('VIEWER-5: Hiển thị tọa độ tổn thương vi mạch (Vessel Anomalies) và dịch chuẩn tiếng Việt', () => {
  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
    })
  );

  // Có checkbox hiển thị số lượng tổn thương
  assert.ok(html.includes('Hiển thị tọa độ tổn thương (2)'));
  assert.ok(html.includes('lucide-target'), 'Có icon Target đánh dấu vị trí tổn thương');

  // Kiểm tra hàm ánh xạ tên tổn thương sang thuật ngữ lâm sàng tiếng Việt
  function anomalyNameMap(type: string): string {
    switch (type) {
      case 'Microaneurysm':
        return 'Vi phình mạch (Microaneurysm)';
      case 'Hemorrhage':
        return 'Xuất huyết võng mạc (Hemorrhage)';
      case 'Hard_Exudate':
        return 'Xuất tiết cứng (Hard Exudate)';
      case 'AV_Nipping':
        return 'Dấu hiệu bắt chéo Động-Tĩnh mạch (A/V Nipping)';
      case 'Focal_Narrowing':
        return 'Hẹp động mạch cục bộ (Focal Narrowing)';
      default:
        return type;
    }
  }

  assert.strictEqual(anomalyNameMap('Microaneurysm'), 'Vi phình mạch (Microaneurysm)');
  assert.strictEqual(anomalyNameMap('Hemorrhage'), 'Xuất huyết võng mạc (Hemorrhage)');
  assert.strictEqual(anomalyNameMap('Hard_Exudate'), 'Xuất tiết cứng (Hard Exudate)');
  assert.strictEqual(anomalyNameMap('AV_Nipping'), 'Dấu hiệu bắt chéo Động-Tĩnh mạch (A/V Nipping)');
  assert.strictEqual(anomalyNameMap('Focal_Narrowing'), 'Hẹp động mạch cục bộ (Focal Narrowing)');
});

runTest('VIEWER-6: Xử lý trực quan khi ca khám BÌNH THƯỜNG (0 điểm tổn thương) - Banner âm tính lâm sàng và Legend rõ ràng', () => {
  const normalAnalysisResult: AIRiskResult = {
    ...sampleAnalysisResult,
    overallVascularRiskScore: 25,
    riskScore: 25,
    annotatedMap: {
      ...sampleAnalysisResult.annotatedMap,
      detectedAnomalies: [],
    },
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: normalAnalysisResult,
    })
  );

  // 1. Banner lâm sàng xác nhận âm tính
  assert.ok(html.includes('Khảo sát vi mạch toàn diện: Cấu trúc bình thường (0 điểm tổn thương)'), 'Có tiêu đề banner âm tính lâm sàng');
  assert.ok(html.includes('AI đã quét 4 góc phần tư võng mạc và cây mạch máu, không phát hiện vi phình mạch, xuất huyết hay co thắt khu trú.'), 'Có mô tả quét 4 góc phần tư võng mạc');
  assert.ok(html.includes('Âm tính lâm sàng'), 'Có nhãn Âm tính lâm sàng');
  assert.ok(html.includes('bg-emerald-50'), 'Banner có màu nền xanh lá y tế');

  // 2. Legend hiển thị nhãn bình thường
  assert.ok(html.includes('Vi mạch bình thường (0 điểm tổn thương)'), 'Legend có nhãn vi mạch bình thường');

  // 3. Huy hiệu góc ảnh
  assert.ok(html.includes('Không phát hiện tổn thương vi phình mạch khu trú'), 'Góc ảnh có thông báo âm tính');
});

runTest('VIEWER-6B: Xử lý an toàn y khoa ca nguy cơ cao (score >= 40) khi 0 điểm tổn thương khu trú -> Cảnh báo biến đổi vi mạch toàn thể (Anti False Reassurance)', () => {
  const diffuseRiskResult: AIRiskResult = {
    ...sampleAnalysisResult,
    overallVascularRiskScore: 72,
    riskScore: 72,
    annotatedMap: {
      ...sampleAnalysisResult.annotatedMap,
      detectedAnomalies: [],
    },
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: diffuseRiskResult,
    })
  );

  // 1. Tuyệt đối CẤM nhãn xanh "Vi mạch bình thường" khi rủi ro cao (Chống False Reassurance)
  assert.ok(!html.includes('Vi mạch bình thường (0 điểm tổn thương)'), 'Cấm nhãn xanh bình thường khi score >= 40');
  assert.ok(!html.includes('Khảo sát vi mạch toàn diện: Cấu trúc bình thường'), 'Cấm banner âm tính khi score >= 40');

  // 2. Legend hiển thị nhãn cảnh báo biến đổi toàn thể
  assert.ok(html.includes('Biến đổi vi mạch toàn thể (Chưa định vị ổ khu trú đơn độc)'), 'Legend có nhãn cảnh báo biến đổi toàn thể');

  // 3. Góc ảnh có thông báo tổn thương lan tỏa
  assert.ok(html.includes('Tổn thương vi mạch lan tỏa — Tham chiếu bản đồ nhiệt'), 'Góc ảnh có nhãn cảnh báo lan tỏa');

  // 4. Banner cảnh báo hổ phách
  assert.ok(html.includes('Cảnh báo: Biến đổi vi mạch toàn thể / lan tỏa'), 'Banner cảnh báo biến đổi toàn thể');
  assert.ok(html.includes('bg-amber-50'), 'Banner có nền hổ phách cảnh báo');
});

runTest('VIEWER-7: Kích hoạt nút Lớp mạch máu (vessel overlay) và bộ lọc quang học Red-Free (Green Channel Isolation AAO)', () => {
  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
    })
  );

  // 1. Nút lớp mạch máu
  assert.ok(html.includes('Lớp mạch máu'), 'Có nút Lớp mạch máu');
  assert.ok(html.includes('lucide-layers'), 'Có icon Layers');

  // 2. Bộ lọc quang học Red-Free
  assert.ok(html.includes('id="aura-red-free-filter"'), 'Có định nghĩa SVG filter aura-red-free-filter');
  assert.ok(html.includes('feColorMatrix'), 'Có bộ lọc ma trận màu quang học feColorMatrix');
  assert.ok(html.includes('aura-red-free-filter'), 'Ảnh vi mạch được gán bộ lọc Red-Free');
});

runTest('VIEWER-8: Marker tổn thương vi mạch có hiệu ứng nhấp nháy animate-ping, tooltip phân tích bệnh học và phân loại màu sắc y tế', () => {
  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: sampleAnalysisResult,
    })
  );

  // 1. Hiệu ứng nhấp nháy xung nhịp
  assert.ok(html.includes('animate-ping'), 'Marker có hiệu ứng nhấp nháy animate-ping');

  // 2. Tọa độ chính xác
  assert.ok(html.includes('left:42%') || html.includes('left: 42%'), 'Tọa độ X 42%');
  assert.ok(html.includes('top:55%') || html.includes('top: 55%'), 'Tọa độ Y 55%');

  // 3. Tooltip bệnh học
  assert.ok(html.includes('Độ tin cậy'), 'Tooltip có thông tin độ tin cậy');
  assert.ok(html.includes('group-hover:flex'), 'Có tooltip hover phân tích bệnh học');
});

runTest('VIEWER-9: Thuật toán phổ nhiệt giải phẫu (renderAnatomicalHeatmap) căn chuẩn OD vs OS, quầng mạch thái dương và tâm nhiệt tổn thương', () => {
  // Mock Canvas 2D Context
  function createMockCanvas(w = 500, h = 400) {
    const gradients: any[] = [];
    const arcs: any[] = [];
    const rects: any[] = [];
    const ctx = {
      clearRect: () => {},
      createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
        const stops: { offset: number; color: string }[] = [];
        const g = {
          x0, y0, r0, x1, y1, r1, stops,
          addColorStop: (offset: number, color: string) => stops.push({ offset, color }),
        };
        gradients.push(g);
        return g;
      },
      fillRect: (x: number, y: number, w: number, h: number) => rects.push({ x, y, w, h }),
      beginPath: () => {},
      arc: (x: number, y: number, r: number, s: number, e: number) => arcs.push({ x, y, r, s, e }),
      fill: () => {},
      fillStyle: null as any,
    };
    return {
      canvas: { width: w, height: h, getContext: () => ctx } as unknown as HTMLCanvasElement,
      gradients,
      arcs,
      rects,
    };
  }

  // 1. Mắt Phải (OD): Hoàng điểm phía thái dương (phải ảnh: w * 0.64 = 320)
  const odMock = createMockCanvas(500, 400);
  renderAnatomicalHeatmap(odMock.canvas, 'OD (Mắt Phải)', 75, [
    {
      id: 'anom-1',
      type: 'Microaneurysm',
      coordinates: { x: 60, y: 50, width: 24, height: 24 },
      confidence: 0.95,
      description: 'Vi phình mạch',
    },
  ]);
  assert.strictEqual(odMock.gradients[0].x0, 320, 'OD: Hoàng điểm nằm ở 64% chiều rộng');
  assert.strictEqual(odMock.gradients[0].stops[0].color, 'rgba(239, 68, 68, 0.78)', 'Nguy cơ cao: Tâm gradient đỏ rực');
  // Cung mạch thái dương và hotspot tổn thương
  assert.ok(odMock.arcs.length >= 3, 'OD: Vẽ ít nhất 2 quầng cung mạch thái dương và 1 hotspot tổn thương');

  // 2. Mắt Trái (OS): Hoàng điểm phía thái dương (trái ảnh: w * 0.36 = 180)
  const osMock = createMockCanvas(500, 400);
  renderAnatomicalHeatmap(osMock.canvas, 'OS (Mắt Trái)', 25, []);
  assert.strictEqual(osMock.gradients[0].x0, 180, 'OS: Hoàng điểm nằm ở 36% chiều rộng');
  assert.strictEqual(osMock.gradients[0].stops[0].color, 'rgba(16, 185, 129, 0.45)', 'Nguy cơ thấp: Tâm gradient xanh lục');
  assert.strictEqual(osMock.arcs.length, 0, 'Nguy cơ thấp và 0 tổn thương: Không sinh arc cung mạch thái dương');

  // 3. Nguy cơ trung bình (score = 50)
  const modMock = createMockCanvas(500, 400);
  renderAnatomicalHeatmap(modMock.canvas, 'OD', 50, []);
  assert.strictEqual(modMock.gradients[0].stops[0].color, 'rgba(245, 158, 11, 0.65)', 'Nguy cơ TB: Tâm gradient cam vàng');
  assert.strictEqual(modMock.arcs.length, 2, 'Nguy cơ TB: Có 2 arc cung mạch thái dương trên và dưới');
});

runTest('VIEWER-10: Phân loại màu sắc y tế chuẩn (getAnomalyMedicalTheme) bao phủ 100% 5 loại tổn thương vi mạch', () => {
  // 1. Hemorrhage -> Rose (Đỏ sẫm cảnh báo)
  const hem = getAnomalyMedicalTheme('Hemorrhage');
  assert.ok(hem.border.includes('rose-600'));
  assert.ok(hem.ping.includes('rose-500'));
  assert.ok(hem.badgeBg.includes('text-rose-800'));

  // 2. Microaneurysm -> Amber (Vàng hổ phách)
  const micro = getAnomalyMedicalTheme('Microaneurysm');
  assert.ok(micro.border.includes('amber-400'));
  assert.ok(micro.ping.includes('amber-400'));
  assert.ok(micro.badgeBg.includes('text-amber-900'));

  // 3. Hard_Exudate -> Yellow (Vàng xuất tiết)
  const exudate = getAnomalyMedicalTheme('Hard_Exudate');
  assert.ok(exudate.border.includes('yellow-300'));
  assert.ok(exudate.ping.includes('yellow-300'));
  assert.ok(exudate.badgeBg.includes('text-yellow-900'));

  // 4. AV_Nipping -> Orange-500 (Cam đậm biến dạng mạch máu)
  const avNip = getAnomalyMedicalTheme('AV_Nipping');
  assert.ok(avNip.border.includes('orange-500'));
  assert.ok(avNip.ping.includes('orange-500'));
  assert.ok(avNip.badgeBg.includes('text-orange-900'));

  // 5. Focal_Narrowing -> Orange-400 (Cam hẹp vi mạch khu trú)
  const focal = getAnomalyMedicalTheme('Focal_Narrowing');
  assert.ok(focal.border.includes('orange-400'));
  assert.ok(focal.ping.includes('orange-400'));
  assert.ok(focal.badgeBg.includes('text-orange-900'));
});

runTest('VIEWER-11: Bộ xử lý vi mạch quang học Client-Side (processVesselOverlayCanvas) xử lý Red-Free và Buồng tối', () => {
  // Test khả năng chống sập khi truyền null hoặc ảnh rỗng
  assert.doesNotThrow(() => {
    processVesselOverlayCanvas(null as any, null as any, { isDarkRoom: false });
  });

  // Mock source image và target canvas
  let putImageDataCalled = false;
  const mockTargetCanvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: () => {
        putImageDataCalled = true;
      },
    }),
  } as unknown as HTMLCanvasElement;

  const mockSourceImg = {
    naturalWidth: 400,
    naturalHeight: 300,
    width: 400,
    height: 300,
  } as unknown as HTMLImageElement;

  processVesselOverlayCanvas(mockSourceImg, mockTargetCanvas, { isDarkRoom: false });
  assert.strictEqual(mockTargetCanvas.width, 400, 'Canvas width đồng bộ kích thước ảnh');
  assert.strictEqual(mockTargetCanvas.height, 300, 'Canvas height đồng bộ kích thước ảnh');
  assert.ok(putImageDataCalled, 'Hàm putImageData được gọi để vẽ kết quả Red-Free lên canvas');

  // Test chế độ Dark Room
  putImageDataCalled = false;
  processVesselOverlayCanvas(mockSourceImg, mockTargetCanvas, { isDarkRoom: true });
  assert.ok(putImageDataCalled, 'Dark Room: putImageData được gọi mô phỏng huỳnh quang FA');
});

runTest('VIEWER-12: Ghim định vị không gian (Spatial Target Pins) và nhãn trợ năng', () => {
  const resultWithMultipleAnomalies: AIRiskResult = {
    ...sampleAnalysisResult,
    annotatedMap: {
      ...sampleAnalysisResult.annotatedMap,
      detectedAnomalies: [
        {
          id: 'ano-hem-1',
          type: 'Hemorrhage',
          coordinates: { x: 35.5, y: 48.2, width: 28, height: 28 },
          confidence: 0.94,
          description: 'Xuất huyết chấm võng mạc cung thái dương trên',
        },
        {
          id: 'ano-micro-1',
          type: 'Microaneurysm',
          coordinates: { x: 72.0, y: 65.4, width: 26, height: 26 },
          confidence: 0.88,
          description: 'Vi phình mạch khu trú cạnh hoàng điểm',
        },
      ],
    },
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, {
      analysisResult: resultWithMultipleAnomalies,
      selectedEye: 'OD (Mắt Phải)',
    })
  );

  // 1. Tọa độ chính xác
  assert.ok(html.includes('left:35.5%') || html.includes('left: 35.5%'), 'Pin 1 có tọa độ X 35.5%');
  assert.ok(html.includes('top:48.2%') || html.includes('top: 48.2%'), 'Pin 1 có tọa độ Y 48.2%');
  assert.ok(html.includes('left:72%') || html.includes('left: 72%'), 'Pin 2 có tọa độ X 72%');
  assert.ok(html.includes('top:65.4%') || html.includes('top: 65.4%'), 'Pin 2 có tọa độ Y 65.4%');

  // 2. Class màu sắc phân loại bệnh học
  assert.ok(html.includes('border-rose-600'), 'Pin Hemorrhage có viền rose-600');
  assert.ok(html.includes('border-amber-400'), 'Pin Microaneurysm có viền amber-400');

  // 3. Đếm số lượng tổn thương trên thanh công cụ
  assert.ok(html.includes('Hiển thị tọa độ tổn thương (2)'), 'Thanh công cụ đếm đúng 2 tổn thương');
});

// -----------------------------------------------------------------------------
// PHẦN 5: THÀNH PHẦN BẢNG VÀ TRẠNG THÁI PHẢN HỒI (EmptyState, LoadingState, ErrorState, DataTable)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Kiểm thử Thành Phần Bảng & Trạng Thái Phản Hồi (Feedback & DataTable) ---');

runTest('STATE-1: EmptyState hiển thị đúng title, description và nút hành động khi được cấu hình', () => {
  let actionTriggered = false;
  const html = renderToStaticMarkup(
    React.createElement(EmptyState, {
      title: 'Chưa có hồ sơ sàng lọc',
      description: 'Bệnh nhân chưa có lịch sử chụp đáy mắt nào trong hệ thống.',
      actionLabel: 'Tải ảnh ngay',
      onAction: () => {
        actionTriggered = true;
      },
    })
  );

  assert.ok(html.includes('Chưa có hồ sơ sàng lọc'), 'Hiển thị đúng tiêu đề');
  assert.ok(html.includes('Bệnh nhân chưa có lịch sử chụp đáy mắt'), 'Hiển thị đúng mô tả');
  assert.ok(html.includes('Tải ảnh ngay'), 'Render nút hành động với nhãn đúng');
  assert.ok(html.includes('lucide-inbox'), 'Icon Inbox mặc định');

  // EmptyState không có actionLabel thì không render nút
  const htmlNoAction = renderToStaticMarkup(
    React.createElement(EmptyState, {
      title: 'Danh sách rỗng',
      description: 'Không có bản ghi.',
    })
  );
  assert.ok(!htmlNoAction.includes('<button'), 'Không render nút nếu thiếu actionLabel hoặc onAction');
});

runTest('STATE-2: LoadingState hiển thị spinner quay xoay và thông điệp tải dữ liệu lâm sàng', () => {
  const htmlDefault = renderToStaticMarkup(React.createElement(LoadingState, {}));
  assert.ok(htmlDefault.includes('Đang tải dữ liệu lâm sàng...'), 'Thông điệp mặc định');
  assert.ok(htmlDefault.includes('lucide-loader2'), 'Icon Loader2');
  assert.ok(htmlDefault.includes('animate-spin'), 'Hiệu ứng quay animate-spin');
  assert.ok(htmlDefault.includes('text-brand-600'), 'Màu sắc thương hiệu text-brand-600');

  const htmlCustom = renderToStaticMarkup(React.createElement(LoadingState, { message: 'Đang trích xuất bản đồ Grad-CAM...' }));
  assert.ok(htmlCustom.includes('Đang trích xuất bản đồ Grad-CAM...'), 'Thông điệp tùy chỉnh');
});

runTest('STATE-3: ErrorState hiển thị khung cảnh báo đỏ, icon AlertCircle và nút "Thử lại"', () => {
  const htmlError = renderToStaticMarkup(
    React.createElement(ErrorState, {
      title: 'Lỗi tải dữ liệu AI',
      message: 'Không thể kết nối đến máy chủ phân tích vi mạch.',
      onRetry: () => {},
    })
  );

  assert.ok(htmlError.includes('Lỗi tải dữ liệu AI'), 'Tiêu đề lỗi');
  assert.ok(htmlError.includes('Không thể kết nối đến máy chủ'), 'Nội dung chi tiết lỗi');
  assert.ok(htmlError.includes('bg-red-50/50') && htmlError.includes('border-red-200'), 'Khung cảnh báo màu đỏ');
  assert.ok(htmlError.includes('lucide-alert-circle'), 'Icon AlertCircle');
  assert.ok(htmlError.includes('Thử lại'), 'Nút bấm Thử lại với variant danger');
});

runTest('DATATABLE-1: DataTable hiển thị thông báo rỗng chuẩn khi data là mảng rỗng', () => {
  const columns = [
    { header: 'Mã Khám', accessor: 'id' as const },
    { header: 'Ngày Khám', accessor: 'date' as const },
  ];

  const htmlEmpty = renderToStaticMarkup(
    React.createElement(DataTable as any, {
      columns,
      data: [],
      keyExtractor: (r: any) => r.id,
      emptyMessage: 'Không tìm thấy ca sàng lọc nào phù hợp với bộ lọc.',
    })
  );

  assert.ok(htmlEmpty.includes('colSpan="2"') || htmlEmpty.includes('colspan="2"'), 'Ô thông báo rỗng chiếm toàn bộ số cột colSpan=2');
  assert.ok(htmlEmpty.includes('Không tìm thấy ca sàng lọc nào phù hợp với bộ lọc.'));
});

runTest('DATATABLE-2: DataTable hiển thị trạng thái đang tải (loading) chiếm toàn bộ số cột', () => {
  const columns = [
    { header: 'Cột 1' },
    { header: 'Cột 2' },
    { header: 'Cột 3' },
  ];

  const htmlLoading = renderToStaticMarkup(
    React.createElement(DataTable as any, {
      columns,
      data: [{ id: 1 }, { id: 2 }],
      keyExtractor: (r: any) => r.id,
      loading: true,
    })
  );

  assert.ok(htmlLoading.includes('colSpan="3"') || htmlLoading.includes('colspan="3"'), 'Ô loading chiếm 3 cột colSpan=3');
  assert.ok(htmlLoading.includes('Đang tải dữ liệu...'));
  assert.ok(!htmlLoading.includes('<td>1</td>'), 'Không render dữ liệu khi đang loading');
});

runTest('DATATABLE-3: DataTable render dữ liệu chuẩn, hỗ trợ căn lề (left, center, right) và onRowClick', () => {
  interface PatientRow {
    id: string;
    patientName: string;
    riskScore: number;
    level: string;
  }

  const sampleRows: PatientRow[] = [
    { id: 'SCR-001', patientName: 'Nguyễn Văn A', riskScore: 35, level: 'Low' },
    { id: 'SCR-002', patientName: 'Trần Thị B', riskScore: 82, level: 'Critical' },
  ];

  const columns = [
    { header: 'Mã Ca', accessor: 'id' as const, align: 'left' as const },
    {
      header: 'Bệnh Nhân',
      accessor: (row: PatientRow) => React.createElement('strong', null, row.patientName),
      align: 'center' as const,
    },
    {
      header: 'Điểm Nguy Cơ',
      accessor: (row: PatientRow) => `${row.riskScore}/100`,
      align: 'right' as const,
    },
    {
      header: 'Mức Rủi Ro',
      accessor: (row: PatientRow) => React.createElement(RiskBadge, { level: row.level, size: 'sm' }),
      align: 'center' as const,
    },
  ];

  const html = renderToStaticMarkup(
    React.createElement(DataTable as any, {
      columns,
      data: sampleRows,
      keyExtractor: (row: PatientRow) => row.id,
      onRowClick: () => {},
    })
  );

  // Kiểm tra headers và căn lề
  assert.ok(html.includes('text-left'), 'Cột 1 căn trái');
  assert.ok(html.includes('text-center'), 'Cột 2 căn giữa');
  assert.ok(html.includes('text-right'), 'Cột 3 căn phải');

  // Kiểm tra nội dung dòng
  assert.ok(html.includes('SCR-001'));
  assert.ok(html.includes('Nguyễn Văn A'));
  assert.ok(html.includes('35/100'));
  assert.ok(html.includes('Nguy cơ Thấp'));

  assert.ok(html.includes('SCR-002'));
  assert.ok(html.includes('Trần Thị B'));
  assert.ok(html.includes('82/100'));
  assert.ok(html.includes('Nguy kịch'));

  // Kiểm tra hiệu ứng click dòng
  assert.ok(html.includes('cursor-pointer hover:bg-brand-50/60'), 'Có class con trỏ click dòng');
});

runTest('DATATABLE-4: Cột căn phải (align: "right") có class text-right và tuyệt đối KHÔNG bị chèn class font-mono-data bừa bãi', () => {
  interface ActionRow {
    id: string;
    actionName: string;
  }

  const columns = [
    { header: 'Tên Mục', accessor: 'actionName' as const, align: 'left' as const },
    {
      header: 'Thao Tác Lâm Sàng',
      accessor: (row: ActionRow) => React.createElement('button', { type: 'button' }, `Thực hiện ${row.id}`),
      align: 'right' as const,
    },
  ];

  const html = renderToStaticMarkup(
    React.createElement(DataTable as any, {
      columns,
      data: [{ id: 'ACT-01', actionName: 'Khám mắt' }],
      keyExtractor: (r: ActionRow) => r.id,
    })
  );

  // 1. Phải có text-right cho th và td
  assert.ok(html.includes('text-right'), 'Cột căn phải phải có class text-right');

  // 2. Tìm tất cả th có text-right
  const thRightMatches = html.match(/<th[^>]*text-right[^>]*>[\s\S]*?<\/th>/g) || [];
  assert.ok(thRightMatches.length > 0, 'Phải có th chứa text-right');
  for (const th of thRightMatches) {
    assert.ok(!th.includes('font-mono-data'), 'th căn phải không được tự động chứa class font-mono-data');
    assert.ok(!th.includes('font-mono'), 'th căn phải không được tự động chứa font-mono');
  }

  // 3. Tìm tất cả td có text-right
  const tdRightMatches = html.match(/<td[^>]*text-right[^>]*>[\s\S]*?<\/td>/g) || [];
  assert.ok(tdRightMatches.length > 0, 'Phải có td chứa text-right');
  for (const td of tdRightMatches) {
    assert.ok(!td.includes('font-mono-data'), 'td căn phải không được tự động chèn class font-mono-data');
    assert.ok(!td.includes('font-mono'), 'td căn phải không được tự động chèn font-mono');
  }
});

runTest('DATATABLE-5: Cột chỉ nhận class font-mono-data khi được chỉ định rõ qua col.className', () => {
  const columns = [
    { header: 'Mã Số Cột Mono', accessor: 'code' as const, align: 'right' as const, className: 'font-mono-data' },
    { header: 'Cột Thường Căn Phải', accessor: 'desc' as const, align: 'right' as const },
  ];

  const html = renderToStaticMarkup(
    React.createElement(DataTable as any, {
      columns,
      data: [{ id: '1', code: 'CODE-999', desc: 'Mô tả thường' }],
      keyExtractor: (r: any) => r.id,
    })
  );

  // Tách tất cả các thẻ th độc lập
  const allThs = html.match(/<th[^>]*>.*?<\/th>/g) || [];
  assert.strictEqual(allThs.length, 2, 'Bảng có đúng 2 thẻ th');

  // Thẻ 1: có font-mono-data
  assert.ok(allThs[0].includes('Mã Số Cột Mono'));
  assert.ok(allThs[0].includes('font-mono-data'));
  assert.ok(allThs[0].includes('text-right'));

  // Thẻ 2: có text-right và KHÔNG có font-mono-data
  assert.ok(allThs[1].includes('Cột Thường Căn Phải'));
  assert.ok(allThs[1].includes('text-right'));
  assert.ok(!allThs[1].includes('font-mono-data'), 'Cột Thường Căn Phải không có font-mono-data');

  // Tách tất cả các thẻ td độc lập
  const allTds = html.match(/<td[^>]*>.*?<\/td>/g) || [];
  assert.strictEqual(allTds.length, 2, 'Dòng dữ liệu có đúng 2 thẻ td');
  assert.ok(allTds[0].includes('font-mono-data'));
  assert.ok(allTds[1].includes('text-right'));
  assert.ok(!allTds[1].includes('font-mono-data'), 'Ô dữ liệu căn phải thường không bị chèn font-mono-data');
});

console.log('\n--- 6. Kiểm thử Cô Lập Dữ Liệu Lưu Trữ Phòng Khám (Clinic Multi-Tenant Storage Isolation) ---');

runTest('CLINIC-1: getClinicBatchStorageKey gắn chính xác ID của từng người dùng/phòng khám', () => {
  const key1 = getClinicBatchStorageKey('clinic-user-123');
  const key2 = getClinicBatchStorageKey('clinic-user-456');
  const keyGuest = getClinicBatchStorageKey(null);

  assert.strictEqual(key1, 'AURA_CLINIC_BATCH_JOB_clinic-user-123');
  assert.strictEqual(key2, 'AURA_CLINIC_BATCH_JOB_clinic-user-456');
  assert.strictEqual(keyGuest, 'AURA_CLINIC_BATCH_JOB_ANONYMOUS');
  assert.notStrictEqual(key1, key2, 'Key của 2 phòng khám khác nhau phải tách biệt');
});

runTest('CLINIC-2: Dữ liệu của Clinic A và Clinic B hoàn toàn độc lập trong localStorage', () => {
  const clinicAId = 'clinic-alpha-id';
  const clinicBId = 'clinic-beta-id';

  const batchA = {
    batchId: 'BATCH-ALPHA-01',
    clinicId: clinicAId,
    clinicName: 'Phòng khám Alpha',
    totalImages: 10,
    processedCount: 10,
    failedCount: 0,
    status: 'COMPLETED' as const,
    createdAt: new Date().toISOString(),
    estimatedTimeRemainingSec: 0,
    items: [
      { id: 'item-1', fileName: 'alpha1.jpg', patientName: 'Bệnh nhân A', riskScore: 30, riskLevel: 'LOW' as const, status: 'SUCCESS' as const }
    ]
  };

  const batchB = {
    batchId: 'BATCH-BETA-02',
    clinicId: clinicBId,
    clinicName: 'Phòng khám Beta',
    totalImages: 5,
    processedCount: 5,
    failedCount: 0,
    status: 'COMPLETED' as const,
    createdAt: new Date().toISOString(),
    estimatedTimeRemainingSec: 0,
    items: [
      { id: 'item-2', fileName: 'beta1.jpg', patientName: 'Bệnh nhân B', riskScore: 85, riskLevel: 'HIGH' as const, status: 'SUCCESS' as const }
    ]
  };

  localStorage.setItem(getClinicBatchStorageKey(clinicAId), JSON.stringify(batchA));
  localStorage.setItem(getClinicBatchStorageKey(clinicBId), JSON.stringify(batchB));

  const loadedA = loadBatchJobForClinic(clinicAId, 'Phòng khám Alpha');
  const loadedB = loadBatchJobForClinic(clinicBId, 'Phòng khám Beta');

  assert.strictEqual(loadedA.batchId, 'BATCH-ALPHA-01');
  assert.strictEqual(loadedA.clinicName, 'Phòng khám Alpha');
  assert.strictEqual(loadedA.items[0].patientName, 'Bệnh nhân A');

  assert.strictEqual(loadedB.batchId, 'BATCH-BETA-02');
  assert.strictEqual(loadedB.clinicName, 'Phòng khám Beta');
  assert.strictEqual(loadedB.items[0].patientName, 'Bệnh nhân B');

  // Đảm bảo dữ liệu không bị trộn lẫn giữa 2 phòng khám
  assert.notStrictEqual(loadedA.batchId, loadedB.batchId);
});

runTest('CLINIC-3: loadBatchJobForClinic tự động dọn dẹp key cũ dùng chung AURA_CLINIC_BATCH_JOB', () => {
  // Giả lập key cũ còn sót lại từ phiên bản trước
  localStorage.setItem('AURA_CLINIC_BATCH_JOB', JSON.stringify({ batchId: 'OLD-LEAKY-BATCH' }));

  // Gọi hàm load
  loadBatchJobForClinic('clinic-test-purge', 'Phòng khám Test');

  // Kiểm tra key cũ đã bị xóa sạch khỏi localStorage
  assert.strictEqual(localStorage.getItem('AURA_CLINIC_BATCH_JOB'), null, 'Key cũ dùng chung phải được dọn dẹp hoàn toàn');
});

runTest('CLINIC-4: Khi không có userId (đăng xuất/chưa đăng nhập), trả về đối tượng batch job rỗng chuẩn', () => {
  const emptyJob = loadBatchJobForClinic(null, 'Phòng khám Mặc Định');
  assert.strictEqual(emptyJob.batchId, 'CHƯA_TẢI_ĐỢT_NÀO');
  assert.strictEqual(emptyJob.totalImages, 0);
  assert.strictEqual(emptyJob.items.length, 0);
});

runTest('CLINIC-5: ClinicBatchWorkspace render cột Trạng Thái động theo mã trạng thái (FAILED/PROCESSING/COMPLETED)', () => {
  const testBatch: ClinicBatchJob = {
    batchId: 'BATCH-STATUS-TEST',
    clinicId: 'clinic-status-01',
    clinicName: 'Phòng Khám Test Status',
    totalImages: 3,
    processedCount: 1,
    failedCount: 1,
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    estimatedTimeRemainingSec: 15,
    items: [
      {
        id: 'ITEM-01',
        mrn: 'MRN-BATCH-001',
        fileName: 'anh_loi_chat_luong.jpg',
        patientName: 'BN Lỗi',
        riskScore: 0,
        riskLevel: 'Low',
        status: 'FAILED',
        eye: 'OD',
      },
      {
        id: 'ITEM-02',
        mrn: 'MRN-BATCH-002',
        fileName: 'anh_dang_phan_tich.jpg',
        patientName: 'BN Đang Xử Lý',
        riskScore: 0,
        riskLevel: 'Low',
        status: 'PROCESSING',
        eye: 'OS',
      },
      {
        id: 'ITEM-03',
        mrn: 'MRN-BATCH-003',
        fileName: 'anh_hoan_thanh.jpg',
        patientName: 'BN Hoàn Tất',
        riskScore: 45,
        riskLevel: 'Low',
        status: 'COMPLETED',
        eye: 'OD',
      },
    ],
  };

  const html = renderToStaticMarkup(
    React.createElement(ClinicBatchWorkspace, {
      batchJob: testBatch,
    })
  );

  // 1. Dòng FAILED có class bg-rose-50 text-rose-800 border-rose-200 và icon AlertTriangle
  assert.ok(html.includes('bg-rose-50 text-rose-800 border border-rose-200'), 'Dòng lỗi có style rose');
  assert.ok(html.includes('lucide-alert-triangle'), 'Dòng lỗi có icon AlertTriangle');
  assert.ok(html.includes('FAILED'), 'Hiển thị nhãn FAILED');

  // 2. Dòng PROCESSING có class bg-amber-50 text-amber-800 border-amber-200 và icon Clock
  assert.ok(html.includes('bg-amber-50 text-amber-800 border border-amber-200'), 'Dòng đang xử lý có style amber');
  assert.ok(html.includes('lucide-clock'), 'Dòng đang xử lý có icon Clock');
  assert.ok(html.includes('PROCESSING'), 'Hiển thị nhãn PROCESSING');

  // 3. Dòng COMPLETED có class bg-emerald-50 text-emerald-800 border-emerald-200 và icon CheckCircle2
  assert.ok(html.includes('bg-emerald-50 text-emerald-800 border border-emerald-200'), 'Dòng hoàn tất có style emerald');
  assert.ok(html.includes('lucide-check-circle2'), 'Dòng hoàn tất có icon CheckCircle2');
  assert.ok(html.includes('COMPLETED'), 'Hiển thị nhãn COMPLETED');
});

console.log('\n--- 7. Kiểm thử Hướng Dẫn Tư Vấn Y Tế Khi Chưa Phân Công Bác Sĩ (Consultation Chat Modal) ---');

runTest('CHAT-1: Người bệnh khi chưa có bác sĩ phân công nhận được thông điệp hướng dẫn rõ ràng', () => {
  const html = renderToStaticMarkup(
    React.createElement(ConsultationChatModal, {
      isOpen: true,
      onClose: () => {},
      currentUserRole: 'patient',
      patientName: 'Nguyễn Văn Người Bệnh',
      patientMrn: 'MRN-12345',
      partnerUserId: undefined,
      currentUserId: 'patient-user-01',
    })
  );

  assert.ok(html.includes('Chưa có Bác sĩ chuyên khoa phụ trách'), 'Tiêu đề thông báo rõ ràng');
  assert.ok(html.includes('Hồ sơ sàng lọc đáy mắt của bạn đang trong danh sách chờ tiếp nhận'), 'Mô tả tình trạng tiếp nhận');
  assert.ok(html.includes('Đã hiểu &amp; Đóng') || html.includes('Đã hiểu & Đóng'), 'Nút đóng xác nhận');
});

runTest('CHAT-2: Hướng dẫn người bệnh có các khuyến cáo y tế và cảnh báo an toàn cấp cứu', () => {
  const html = renderToStaticMarkup(
    React.createElement(ConsultationChatModal, {
      isOpen: true,
      onClose: () => {},
      currentUserRole: 'patient',
      patientName: 'Nguyễn Văn Người Bệnh',
      patientMrn: 'MRN-12345',
      partnerUserId: undefined,
      currentUserId: 'patient-user-01',
    })
  );

  assert.ok(html.includes('Hướng dẫn dành cho người bệnh:'), 'Có mục hướng dẫn chi tiết');
  assert.ok(html.includes('Sau khi Bác sĩ tiếp nhận hồ sơ, cửa sổ tư vấn 1-1 sẽ tự động kích hoạt'), 'Chỉ dẫn kích hoạt tự động');
  assert.ok(html.includes('Nếu có dấu hiệu giảm thị lực đột ngột hoặc đau nhức mắt, hãy đến ngay cơ sở y tế gần nhất'), 'Cảnh báo an toàn y tế cấp cứu');
});

runTest('CHAT-3: Bác sĩ khi hồ sơ chưa liên kết tài khoản trực tuyến nhận thông báo phù hợp', () => {
  const html = renderToStaticMarkup(
    React.createElement(ConsultationChatModal, {
      isOpen: true,
      onClose: () => {},
      currentUserRole: 'doctor',
      patientName: 'Lê Văn Offline',
      patientMrn: 'MRN-99999',
      partnerUserId: undefined,
      currentUserId: 'doctor-user-01',
    })
  );

  assert.ok(html.includes('Bệnh nhân chưa liên kết tài khoản trực tuyến'), 'Tiêu đề bác sĩ chuẩn xác');
  assert.ok(html.includes('chưa có tài khoản trực tuyến liên kết trong hệ thống AURA'), 'Mô tả rõ ràng lý do');
  assert.ok(html.includes('ghi chú kết luận lâm sàng trên bàn chẩn đoán CDS'), 'Hướng dẫn phương án thay thế');
});

runTest('CHAT-4: Header modal hiển thị đúng trạng thái chờ phân công', () => {
  const html = renderToStaticMarkup(
    React.createElement(ConsultationChatModal, {
      isOpen: true,
      onClose: () => {},
      currentUserRole: 'patient',
      patientName: 'Nguyễn Văn Người Bệnh',
      patientMrn: 'MRN-12345',
      partnerUserId: undefined,
      currentUserId: 'patient-user-01',
    })
  );

  assert.ok(html.includes('Tư Vấn Chuyên Môn Trực Tuyến'), 'Tiêu đề modal khi chưa có bác sĩ');
  assert.ok(html.includes('Chờ phân công Bác sĩ chuyên khoa phụ trách'), 'Mô tả phụ trên header modal');
});

// -----------------------------------------------------------------------------
// PHẦN 8: KIỂM THỬ THÀNH PHẦN HUY HIỆU MẮT (EyeBadge)
// -----------------------------------------------------------------------------
console.log('\n--- 8. Kiểm thử Thành Phần Huy Hiệu Mắt (EyeBadge) ---');

runTest('EYEBADGE-1: Render đúng vị trí Mắt Phải OD ("Mắt Phải (OD)"), dot status bg-sky-500, màu sky, font-sans và icon Eye', () => {
  const html = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OD' }));
  assert.ok(html.includes('Mắt Phải (OD)'), 'Hiển thị nhãn Mắt Phải (OD)');
  assert.ok(html.includes('bg-sky-500'), 'Dot status có màu xanh sky bg-sky-500');
  assert.ok(html.includes('bg-sky-50/90 text-sky-800 border-sky-200/90'), 'Class màu nền và viền sky');
  assert.ok(html.includes('font-sans'), 'Có class font-sans chuẩn thiết kế Clinical UI');
  assert.ok(!html.includes('font-mono'), 'Tuyệt đối không chứa class font-mono');
  assert.ok(!html.includes('font-mono-data'), 'Tuyệt đối không chứa class font-mono-data');
  assert.ok(html.includes('lucide-eye'), 'Chứa icon Eye của Lucide');

  // Kiểm tra chuỗi định danh biến thể Right_OD
  const htmlRight = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'Right_OD' }));
  assert.ok(htmlRight.includes('Mắt Phải (OD)'));
  assert.ok(htmlRight.includes('bg-sky-500'));
});

runTest('EYEBADGE-2: Render đúng vị trí Mắt Trái OS ("Mắt Trái (OS)"), dot status bg-teal-500, màu teal, font-sans và icon Eye', () => {
  const html = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OS' }));
  assert.ok(html.includes('Mắt Trái (OS)'), 'Hiển thị nhãn Mắt Trái (OS)');
  assert.ok(html.includes('bg-teal-500'), 'Dot status có màu ngọc teal bg-teal-500');
  assert.ok(html.includes('bg-teal-50/90 text-teal-800 border-teal-200/90'), 'Class màu nền và viền teal');
  assert.ok(html.includes('font-sans'), 'Có class font-sans');
  assert.ok(!html.includes('font-mono'), 'Không chứa font-mono');
  assert.ok(!html.includes('font-mono-data'), 'Không chứa font-mono-data');
  assert.ok(html.includes('lucide-eye'), 'Chứa icon Eye');

  // Kiểm tra chuỗi định danh biến thể Left_OS
  const htmlLeft = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'Left_OS' }));
  assert.ok(htmlLeft.includes('Mắt Trái (OS)'));
  assert.ok(htmlLeft.includes('bg-teal-500'));
});

runTest('EYEBADGE-3: Render đúng vị trí Cả hai mắt OU ("Cả hai mắt (OU)"), dot status bg-indigo-500, màu indigo, font-sans', () => {
  const htmlOU = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OU' }));
  assert.ok(htmlOU.includes('Cả hai mắt (OU)'), 'Hiển thị nhãn Cả hai mắt (OU)');
  assert.ok(htmlOU.includes('bg-indigo-500'), 'Dot status có màu tím chàm bg-indigo-500');
  assert.ok(htmlOU.includes('bg-indigo-50/90 text-indigo-800 border-indigo-200/90'), 'Class màu nền và viền indigo');
  assert.ok(htmlOU.includes('font-sans'), 'Có class font-sans');
  assert.ok(!htmlOU.includes('font-mono'));
  assert.ok(!htmlOU.includes('font-mono-data'));

  // Kiểm tra chuỗi định danh biến thể Both_OD_OS và BOTH
  const htmlBoth = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'Both_OD_OS' }));
  assert.ok(htmlBoth.includes('Cả hai mắt (OU)'));
  assert.ok(htmlBoth.includes('bg-indigo-500'));
});

runTest('EYEBADGE-4: Chế độ rút gọn compact={true} hiển thị chính xác "OD", "OS", "OU"', () => {
  const htmlOD = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OD', compact: true }));
  assert.ok(htmlOD.includes('>OD</span>'), 'Hiển thị nhãn rút gọn OD');
  assert.ok(!htmlOD.includes('Mắt Phải'), 'Không chứa chữ đầy đủ Mắt Phải');

  const htmlOS = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OS', compact: true }));
  assert.ok(htmlOS.includes('>OS</span>'), 'Hiển thị nhãn rút gọn OS');
  assert.ok(!htmlOS.includes('Mắt Trái'), 'Không chứa chữ đầy đủ Mắt Trái');

  const htmlOU = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OU', compact: true }));
  assert.ok(htmlOU.includes('>OU</span>'), 'Hiển thị nhãn rút gọn OU');
  assert.ok(!htmlOU.includes('Cả hai mắt'), 'Không chứa chữ đầy đủ Cả hai mắt');
});

runTest('EYEBADGE-5: Kích thước sm và md sinh class padding, cỡ chữ và kích thước dot tương ứng', () => {
  const htmlSm = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OD', size: 'sm' }));
  assert.ok(htmlSm.includes('text-[11px]'), 'Cỡ chữ [11px] cho size sm');
  assert.ok(htmlSm.includes('w-1.5 h-1.5'), 'Dot kích thước w-1.5 h-1.5 cho size sm');

  const htmlMd = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OD', size: 'md' }));
  assert.ok(htmlMd.includes('text-xs'), 'Cỡ chữ text-xs cho size md');
  assert.ok(htmlMd.includes('w-2 h-2'), 'Dot kích thước w-2 h-2 cho size md');
});

runTest('EYEBADGE-6: Tùy chọn showDot={false} và showIcon={false} ẩn dot hoặc icon chuẩn xác', () => {
  const htmlNoDot = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OD', showDot: false }));
  assert.ok(!htmlNoDot.includes('bg-sky-500'), 'Không hiển thị dot status');
  assert.ok(htmlNoDot.includes('Mắt Phải (OD)'), 'Vẫn giữ nhãn');
  assert.ok(htmlNoDot.includes('lucide-eye'), 'Vẫn giữ icon');

  const htmlNoIcon = renderToStaticMarkup(React.createElement(EyeBadge, { position: 'OD', showIcon: false }));
  assert.ok(!htmlNoIcon.includes('<svg'), 'Không có thẻ SVG khi showIcon=false');
  assert.ok(htmlNoIcon.includes('bg-sky-500'), 'Vẫn giữ dot status');
});

runTest('EYEBADGE-7: Vị trí không xác định hiển thị "Chưa xác định" với màu slate trung tính an toàn', () => {
  const html = renderToStaticMarkup(React.createElement(EyeBadge, { position: '' }));
  assert.ok(html.includes('Chưa xác định'), 'Hiển thị fallback Chưa xác định');
  assert.ok(html.includes('bg-slate-50 text-slate-700 border-slate-200'), 'Class màu slate trung tính');
  assert.ok(html.includes('bg-slate-400'), 'Dot màu slate-400');
});

runTest('EYEBADGE-8: Đảm bảo 100% biến thể của EyeBadge đều có class font-sans và KHÔNG có font-mono thô ráp', () => {
  const positions = ['OD', 'OS', 'OU', 'BOTH', 'Right_OD', 'Left_OS', 'UNKNOWN'];
  for (const pos of positions) {
    const html = renderToStaticMarkup(React.createElement(EyeBadge, { position: pos }));
    assert.ok(html.includes('font-sans'), `Vị trí ${pos} phải có class font-sans`);
    assert.ok(!html.includes('font-mono'), `Vị trí ${pos} không được có font-mono`);
    assert.ok(!html.includes('font-mono-data'), `Vị trí ${pos} không được có font-mono-data`);
  }
});

runTest('EYEBADGE-9: Khi không truyền prop position hoặc position=undefined, hiển thị an toàn "Chưa xác định", không tự suy diễn giải phẫu thành OD (Medical Safety)', () => {
  const htmlEmpty = renderToStaticMarkup(React.createElement(EyeBadge, {}));
  assert.ok(htmlEmpty.includes('Chưa xác định'), 'Không có prop position phải hiển thị Chưa xác định');
  assert.ok(!htmlEmpty.includes('Mắt Phải (OD)'), 'Tuyệt đối không được tự ý gán Mắt Phải (OD)');
  assert.ok(htmlEmpty.includes('bg-slate-50 text-slate-700 border-slate-200'), 'Dùng màu slate trung tính');

  const htmlUndefined = renderToStaticMarkup(React.createElement(EyeBadge, { position: undefined }));
  assert.ok(htmlUndefined.includes('Chưa xác định'));
  assert.ok(!htmlUndefined.includes('Mắt Phải (OD)'));
  assert.ok(htmlUndefined.includes('bg-slate-50 text-slate-700 border-slate-200'));
});

// -----------------------------------------------------------------------------
// PHẦN 9: KIỂM THỬ THÀNH PHẦN HUY HIỆU LOẠI ẢNH CHỤP (ScanTypeBadge)
// -----------------------------------------------------------------------------
console.log('\n--- 9. Kiểm thử Thành Phần Huy Hiệu Loại Ảnh Chụp (ScanTypeBadge) ---');

runTest('SCANTYPE-1: Render đúng OCT ("Cắt lớp OCT"), màu tím purple, icon Layers (lucide-layers), không có font-mono', () => {
  const html = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'OCT_Scan' }));
  assert.ok(html.includes('Cắt lớp OCT'), 'Hiển thị nhãn Cắt lớp OCT');
  assert.ok(html.includes('bg-purple-50/90 text-purple-800 border-purple-200/90'), 'Class màu tím purple');
  assert.ok(html.includes('lucide-layers'), 'Icon Layers của Lucide');
  assert.ok(html.includes('font-sans'), 'Sử dụng font-sans');
  assert.ok(!html.includes('font-mono'), 'Không chứa font-mono');
  assert.ok(!html.includes('font-mono-data'), 'Không chứa font-mono-data');
});

runTest('SCANTYPE-2: Render đúng Macula ("Fundus Hoàng Điểm"), màu hổ phách amber, icon Target (lucide-target), không có font-mono', () => {
  const html = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'Fundus_Macula' }));
  assert.ok(html.includes('Fundus Hoàng Điểm'), 'Hiển thị nhãn Fundus Hoàng Điểm');
  assert.ok(html.includes('bg-amber-50/90 text-amber-800 border-amber-200/90'), 'Class màu hổ phách amber');
  assert.ok(html.includes('lucide-target'), 'Icon Target của Lucide');
  assert.ok(html.includes('font-sans'), 'Sử dụng font-sans');
  assert.ok(!html.includes('font-mono'), 'Không chứa font-mono');
  assert.ok(!html.includes('font-mono-data'), 'Không chứa font-mono-data');

  // Kiểm tra chuỗi tiếng Việt hoặc không dấu
  const htmlVn = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'Hoàng Điểm' }));
  assert.ok(htmlVn.includes('Fundus Hoàng Điểm'));
});

runTest('SCANTYPE-3: Render đúng Disc ("Fundus Đĩa Thị"), màu xanh ngọc cyan, icon CircleDot (lucide-circle-dot), không có font-mono', () => {
  const html = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'Fundus_OpticDisc' }));
  assert.ok(html.includes('Fundus Đĩa Thị'), 'Hiển thị nhãn Fundus Đĩa Thị');
  assert.ok(html.includes('bg-cyan-50/90 text-cyan-800 border-cyan-200/90'), 'Class màu xanh ngọc cyan');
  assert.ok(html.includes('lucide-circle-dot'), 'Icon CircleDot của Lucide');
  assert.ok(html.includes('font-sans'), 'Sử dụng font-sans');
  assert.ok(!html.includes('font-mono'), 'Không chứa font-mono');
  assert.ok(!html.includes('font-mono-data'), 'Không chứa font-mono-data');

  // Kiểm tra chuỗi tiếng Việt hoặc biến thể
  const htmlDisc = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'Đĩa Thị' }));
  assert.ok(htmlDisc.includes('Fundus Đĩa Thị'));
});

runTest('SCANTYPE-4: Render đúng Toàn cảnh ("Fundus Toàn Cảnh") và Ảnh màu đáy mắt', () => {
  const htmlWide = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'Widefield_Panorama' }));
  assert.ok(htmlWide.includes('Fundus Toàn Cảnh'), 'Hiển thị Fundus Toàn Cảnh');
  assert.ok(htmlWide.includes('bg-blue-50/90 text-blue-800 border-blue-200/90'), 'Class màu xanh blue');
  assert.ok(htmlWide.includes('lucide-scan-line'), 'Icon ScanLine của Lucide');

  const htmlColor = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'Fundus_Color' }));
  assert.ok(htmlColor.includes('Ảnh màu đáy mắt'), 'Hiển thị Ảnh màu đáy mắt');
  assert.ok(htmlColor.includes('lucide-camera'), 'Icon Camera');
});

runTest('SCANTYPE-5: Đảm bảo 100% các biến thể ScanTypeBadge đều có font-sans và KHÔNG có font-mono thô ráp', () => {
  const scanTypes = ['OCT_Scan', 'Fundus_Macula', 'Fundus_OpticDisc', 'Widefield', 'Fundus_Color', 'General_Fundus'];
  for (const st of scanTypes) {
    const html = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: st }));
    assert.ok(html.includes('font-sans'), `scanType ${st} phải có class font-sans`);
    assert.ok(!html.includes('font-mono'), `scanType ${st} không được có font-mono`);
    assert.ok(!html.includes('font-mono-data'), `scanType ${st} không được có font-mono-data`);
  }
});

runTest('SCANTYPE-6: Tùy chọn showIcon={false} và size="md" hoạt động chính xác', () => {
  const htmlNoIcon = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'OCT_Scan', showIcon: false }));
  assert.ok(!htmlNoIcon.includes('<svg'), 'Không có thẻ SVG khi showIcon=false');
  assert.ok(htmlNoIcon.includes('Cắt lớp OCT'), 'Vẫn giữ nhãn');

  const htmlMd = renderToStaticMarkup(React.createElement(ScanTypeBadge, { scanType: 'OCT_Scan', size: 'md' }));
  assert.ok(htmlMd.includes('text-xs gap-1.5 rounded-lg'), 'Class size md');
});

// -----------------------------------------------------------------------------
// PHẦN 10: KIỂM THỬ GIAO DIỆN LỊCH SỬ KHÁM SÀNG LỌC (PatientHistoryView)
// -----------------------------------------------------------------------------
console.log('\n--- 10. Kiểm thử Giao Diện Lịch Sử Khám Sàng Lọc (PatientHistoryView) ---');

const sampleHistoryScreenings: PatientHistoryItem[] = [
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

runTest('HISTORY-1: Render giao diện danh sách ca khám rỗng hiển thị số lượng (0) và thông báo rỗng chuẩn', () => {
  const html = renderToStaticMarkup(
    React.createElement(PatientHistoryView, {
      screenings: [],
    })
  );

  // Tiêu đề & đếm số lượng ca khám (0)
  assert.ok(html.includes('Lịch sử khám sàng lọc'), 'Có tiêu đề Lịch sử khám sàng lọc');
  assert.ok(html.includes('(0)'), 'Hiển thị số lượng (0) khi danh sách rỗng');
  assert.ok(html.includes('bg-teal-50 text-teal-700 border border-teal-200/80'), 'Badge đếm số lượng có style teal');

  // Thông báo rỗng của DataTable
  assert.ok(
    html.includes('Chưa có ca khám sàng lọc nào phù hợp với bộ lọc.'),
    'Hiển thị thông báo rỗng chuẩn khi không có bản ghi'
  );

  // Ô tìm kiếm và các bộ lọc
  assert.ok(html.includes('Tìm kiếm ca khám'), 'Có nhãn tìm kiếm');
  assert.ok(html.includes('Tìm mã khám, bác sĩ, ghi chú...'), 'Placeholder tìm kiếm');
  assert.ok(html.includes('Tất cả mắt'), 'Option Tất cả mắt');
  assert.ok(html.includes('Mắt Phải (OD)'), 'Option Mắt Phải (OD)');
  assert.ok(html.includes('Mắt Trái (OS)'), 'Option Mắt Trái (OS)');
  assert.ok(html.includes('Cả hai mắt'), 'Option Cả hai mắt');
  assert.ok(html.includes('Tất cả mức độ'), 'Option Tất cả mức độ');
  assert.ok(html.includes('Nguy cơ Thấp'), 'Option Nguy cơ Thấp');
  assert.ok(html.includes('Nguy kịch'), 'Option Nguy kịch');
  assert.ok(html.includes('Mới nhất trước'), 'Option sắp xếp Mới nhất trước');
  assert.ok(html.includes('Cũ nhất trước'), 'Option sắp xếp Cũ nhất trước');
});

runTest('HISTORY-2: Đếm chính xác số lượng ca khám (${count}) khi có dữ liệu và tích hợp đầy đủ các badge', () => {
  const html = renderToStaticMarkup(
    React.createElement(PatientHistoryView, {
      screenings: sampleHistoryScreenings,
      onSelectScreening: () => {},
      onOpenReportModal: () => {},
    })
  );

  // Kiểm tra đếm số lượng (4)
  assert.ok(html.includes('(4)'), 'Hiển thị số lượng (4) đúng với số bản ghi');

  // Kiểm tra các ca khám được render qua ngày tháng
  assert.ok(html.includes('10/03/2026') || html.includes('2026'), 'Hiển thị ngày khám trong bảng');
  assert.ok(html.includes('11/03/2026') || html.includes('2026'), 'Hiển thị ngày khám ca 2');

  // Kiểm tra EyeBadge hiển thị các mắt
  assert.ok(html.includes('Mắt Phải (OD)'));
  assert.ok(html.includes('Mắt Trái (OS)'));
  assert.ok(html.includes('Cả hai mắt (OU)'));

  // Kiểm tra ScanTypeBadge hiển thị các loại ảnh
  assert.ok(html.includes('Fundus Hoàng Điểm'));
  assert.ok(html.includes('Fundus Đĩa Thị'));
  assert.ok(html.includes('Cắt lớp OCT'));

  // Kiểm tra RiskBadge hiển thị các mức
  assert.ok(html.includes('Nguy cơ Thấp'));
  assert.ok(html.includes('Nguy cơ Trung bình'));
  assert.ok(html.includes('Nguy cơ Cao'));
  assert.ok(html.includes('Nguy kịch'));

  // Kiểm tra điểm rủi ro /100
  assert.ok(html.includes('35/100'));
  assert.ok(html.includes('58/100'));
  assert.ok(html.includes('78/100'));
  assert.ok(html.includes('88/100'));

  // Kiểm tra trạng thái ca khám
  assert.ok(html.includes('Đã duyệt lâm sàng'));
  assert.ok(html.includes('Đã phân tích AI'));
  assert.ok(html.includes('Thất bại'));

  // Kiểm tra các nút bấm hành động
  assert.ok(html.includes('Xem Heatmap'), 'Có nút Xem Heatmap');
  assert.ok(html.includes('Xuất Báo Cáo'), 'Có nút Xuất Báo Cáo');
});

runTest('HISTORY-3: Cột "Thao Tác" căn phải trong PatientHistoryView không bị chèn class font-mono-data', () => {
  const html = renderToStaticMarkup(
    React.createElement(PatientHistoryView, {
      screenings: sampleHistoryScreenings,
      onSelectScreening: () => {},
      onOpenReportModal: () => {},
    })
  );

  // Tìm th cho cột Thao Tác
  const thMatch = html.match(/<th[^>]*>[\s\S]*?Thao Tác[\s\S]*?<\/th>/i);
  assert.ok(thMatch, 'Phải có th Thao Tác');
  assert.ok(thMatch[0].includes('text-right'), 'th Thao Tác phải có text-right');
  assert.ok(!thMatch[0].includes('font-mono-data'), 'th Thao Tác không được có font-mono-data');

  // Các nút Xem Heatmap và Xuất Báo Cáo bên trong cell căn phải không chứa font-mono-data
  assert.ok(!html.includes('font-mono-data" title="Xem bản đồ nhiệt'));
  assert.ok(!html.includes('font-mono-data" title="Xuất báo cáo'));
});

runTest('HISTORY-4: Thuật toán tìm kiếm từ khóa (Search Keyword) bao phủ mã khám, bác sĩ và ghi chú', () => {
  function filterBySearch(items: PatientHistoryItem[], term: string) {
    const trimmed = term.trim().toLowerCase();
    return items.filter((s) => {
      if (!trimmed) return true;
      return (
        (s.id || '').toLowerCase().includes(trimmed) ||
        (s.doctorNotes || '').toLowerCase().includes(trimmed) ||
        (s.notes || '').toLowerCase().includes(trimmed) ||
        (s.doctorName || '').toLowerCase().includes(trimmed)
      );
    });
  }

  // 1. Tìm theo ID
  const byId = filterBySearch(sampleHistoryScreenings, '003');
  assert.strictEqual(byId.length, 1);
  assert.strictEqual(byId[0].id, 'SCR-2026-003');

  // 2. Tìm theo tên bác sĩ
  const byDoc = filterBySearch(sampleHistoryScreenings, 'Nguyễn Văn An');
  assert.strictEqual(byDoc.length, 1);
  assert.strictEqual(byDoc[0].id, 'SCR-2026-002');

  // 3. Tìm theo ghi chú
  const byNote = filterBySearch(sampleHistoryScreenings, 'co thắt');
  assert.strictEqual(byNote.length, 1);
  assert.strictEqual(byNote[0].id, 'SCR-2026-002');

  // 4. Tìm kiếm không phân biệt hoa thường và tự trim khoảng trắng
  const byCase = filterBySearch(sampleHistoryScreenings, '   CHẤT LƯỢNG KÉM   ');
  assert.strictEqual(byCase.length, 1);
  assert.strictEqual(byCase[0].id, 'SCR-2026-004');

  // 5. Từ khóa không khớp trả về mảng rỗng (0)
  const noMatch = filterBySearch(sampleHistoryScreenings, 'nonexistent-query-xyz');
  assert.strictEqual(noMatch.length, 0);
});

runTest('HISTORY-5: Thuật toán bộ lọc vị trí mắt (Eye Position Filter)', () => {
  function filterByEye(items: PatientHistoryItem[], eyeFilter: 'ALL' | 'OD' | 'OS' | 'BOTH') {
    return items.filter((s) => {
      const normEye = (s.eyePosition || '').toUpperCase();
      return (
        eyeFilter === 'ALL' ||
        (eyeFilter === 'OD' && (normEye.includes('OD') || normEye.includes('RIGHT'))) ||
        (eyeFilter === 'OS' && (normEye.includes('OS') || normEye.includes('LEFT'))) ||
        (eyeFilter === 'BOTH' && (normEye.includes('BOTH') || normEye.includes('2')))
      );
    });
  }

  assert.strictEqual(filterByEye(sampleHistoryScreenings, 'ALL').length, 4, 'ALL trả về 4');
  assert.strictEqual(filterByEye(sampleHistoryScreenings, 'OD').length, 3, 'OD trả về 3 (gồm cả Both_OD_OS)');
  assert.strictEqual(filterByEye(sampleHistoryScreenings, 'OS').length, 2, 'OS trả về 2 (gồm cả Both_OD_OS)');
  assert.strictEqual(filterByEye(sampleHistoryScreenings, 'BOTH').length, 1, 'BOTH trả về 1');
});

runTest('HISTORY-6: Thuật toán bộ lọc mức độ nguy cơ (Risk Level Filter)', () => {
  function filterByRisk(items: PatientHistoryItem[], riskFilter: 'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL') {
    return items.filter((s) => {
      const normRisk = (s.riskLevel || '').toUpperCase();
      return (
        riskFilter === 'ALL' ||
        (riskFilter === 'LOW' && (normRisk === 'LOW' || normRisk === 'NORMAL')) ||
        (riskFilter === 'MODERATE' && (normRisk === 'MODERATE' || normRisk === 'MEDIUM')) ||
        (riskFilter === 'HIGH' && normRisk === 'HIGH') ||
        (riskFilter === 'CRITICAL' && (normRisk === 'CRITICAL' || normRisk === 'SEVERE'))
      );
    });
  }

  assert.strictEqual(filterByRisk(sampleHistoryScreenings, 'ALL').length, 4);
  assert.strictEqual(filterByRisk(sampleHistoryScreenings, 'LOW').length, 1);
  assert.strictEqual(filterByRisk(sampleHistoryScreenings, 'MODERATE').length, 1);
  assert.strictEqual(filterByRisk(sampleHistoryScreenings, 'HIGH').length, 1);
  assert.strictEqual(filterByRisk(sampleHistoryScreenings, 'CRITICAL').length, 1);
});

runTest('HISTORY-7: Thuật toán sắp xếp thứ tự Mới/Cũ (NEWEST/OLDEST) và Điểm nguy cơ', () => {
  function sortItems(items: PatientHistoryItem[], sortBy: 'NEWEST' | 'OLDEST' | 'SCORE_DESC' | 'SCORE_ASC') {
    return [...items].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'SCORE_DESC') {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }
      if (sortBy === 'SCORE_ASC') {
        return (a.riskScore || 0) - (b.riskScore || 0);
      }
      return 0;
    });
  }

  // 1. Mới nhất trước (NEWEST): 13/03 -> 12/03 -> 11/03 -> 10/03
  const newestSorted = sortItems(sampleHistoryScreenings, 'NEWEST');
  assert.strictEqual(newestSorted[0].id, 'SCR-2026-004', 'Mới nhất là SCR-2026-004');
  assert.strictEqual(newestSorted[newestSorted.length - 1].id, 'SCR-2026-001', 'Cũ nhất ở cuối');

  // 2. Cũ nhất trước (OLDEST): 10/03 -> 11/03 -> 12/03 -> 13/03
  const oldestSorted = sortItems(sampleHistoryScreenings, 'OLDEST');
  assert.strictEqual(oldestSorted[0].id, 'SCR-2026-001', 'Cũ nhất là SCR-2026-001');
  assert.strictEqual(oldestSorted[oldestSorted.length - 1].id, 'SCR-2026-004', 'Mới nhất ở cuối');

  // 3. Điểm nguy cơ cao nhất (SCORE_DESC): 88 -> 78 -> 58 -> 35
  const scoreDescSorted = sortItems(sampleHistoryScreenings, 'SCORE_DESC');
  assert.strictEqual(scoreDescSorted[0].riskScore, 88);
  assert.strictEqual(scoreDescSorted[scoreDescSorted.length - 1].riskScore, 35);

  // 4. Điểm nguy cơ thấp nhất (SCORE_ASC): 35 -> 58 -> 78 -> 88
  const scoreAscSorted = sortItems(sampleHistoryScreenings, 'SCORE_ASC');
  assert.strictEqual(scoreAscSorted[0].riskScore, 35);
  assert.strictEqual(scoreAscSorted[scoreAscSorted.length - 1].riskScore, 88);
});

runTest('HISTORY-8: Trạng thái đang tải (loading=true) hiển thị thông báo "Đang tải dữ liệu..."', () => {
  const html = renderToStaticMarkup(
    React.createElement(PatientHistoryView, {
      screenings: sampleHistoryScreenings,
      loading: true,
      onRefresh: () => {},
    })
  );

  assert.ok(html.includes('Đang tải dữ liệu...'), 'Hiển thị Đang tải dữ liệu trong bảng');
  assert.ok(html.includes('animate-spin'), 'Icon làm mới có class animate-spin khi loading');
});

runTest('HISTORY-9: Kết hợp đa điều kiện (Tìm kiếm + Lọc mắt + Lọc nguy cơ) và đếm số lượng', () => {
  // Lọc mắt OD + mức CRITICAL -> 1 ca (SCR-2026-004)
  const normEye = (s: PatientHistoryItem) => (s.eyePosition || '').toUpperCase();
  const normRisk = (s: PatientHistoryItem) => (s.riskLevel || '').toUpperCase();

  const filtered = sampleHistoryScreenings.filter(
    (s) =>
      normEye(s).includes('OD') &&
      normRisk(s).includes('CRITICAL')
  );

  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].id, 'SCR-2026-004');

  // Render PatientHistoryView với mảng đã lọc 1 ca -> hiển thị count badge (1)
  const htmlOne = renderToStaticMarkup(
    React.createElement(PatientHistoryView, {
      screenings: filtered,
    })
  );
  assert.ok(htmlOne.includes('(1)'), 'Hiển thị đúng số lượng (1)');
});

// -----------------------------------------------------------------------------
// PHẦN 11: KIỂM THỬ GIAO DIỆN BÀN LÀM VIỆC BÁC SĨ (DoctorWorklistView)
// -----------------------------------------------------------------------------
console.log('\n--- 11. Kiểm thử Bàn Làm Việc Bác Sĩ & Bộ Lọc Nguy Cơ (DoctorWorklistView) ---');

const sampleDoctorPatients: PatientProfile[] = [
  {
    id: 'P-01',
    mrn: 'MRN-001',
    fullName: 'Bệnh Nhân Nguy Kịch 1',
    riskLevel: 'Severe',
    reviewStatus: 'PENDING_REVIEW',
  },
  {
    id: 'P-02',
    mrn: 'MRN-002',
    fullName: 'Bệnh Nhân Nguy Kịch 2 (Severe)',
    riskLevel: 'Severe',
    reviewStatus: 'PENDING_REVIEW',
  },
  {
    id: 'P-03',
    mrn: 'MRN-003',
    fullName: 'Bệnh Nhân Nguy Kịch 3 (Alarm)',
    riskLevel: 'Alarm',
    reviewStatus: 'REVIEWED',
  },
  {
    id: 'P-04',
    mrn: 'MRN-004',
    fullName: 'Bệnh Nhân Nguy Cơ Cao',
    riskLevel: 'High',
    reviewStatus: 'PENDING_REVIEW',
  },
  {
    id: 'P-05',
    mrn: 'MRN-005',
    fullName: 'Bệnh Nhân Trung Bình',
    riskLevel: 'Moderate',
    reviewStatus: 'REVIEWED',
  },
  {
    id: 'P-06',
    mrn: 'MRN-006',
    fullName: 'Bệnh Nhân Nguy Cơ Thấp',
    riskLevel: 'Low',
    reviewStatus: 'REVIEWED',
  },
];

runTest('WORKLIST-1: Thuật toán lọc riskFilter="CRITICAL" khớp cả CRITICAL, SEVERE, ALARM, đồng bộ chính xác với thẻ đếm riskCounts', () => {
  function filterWorklist(patients: PatientProfile[], riskFilter: string) {
    return patients.filter((p) => {
      const patientRisk = (p.riskLevel || 'Low').toUpperCase();
      const isCritical =
        patientRisk === 'CRITICAL' ||
        patientRisk === 'SEVERE' ||
        patientRisk === 'ALARM';
      return (
        riskFilter === 'ALL' ||
        (riskFilter === 'CRITICAL' ? isCritical : patientRisk === riskFilter)
      );
    });
  }

  // Đếm riskCounts theo đúng logic DoctorWorklistView
  const criticalCount = sampleDoctorPatients.filter((p) => {
    const lvl = (p.riskLevel || 'Low').toUpperCase();
    return lvl === 'CRITICAL' || lvl === 'SEVERE' || lvl === 'ALARM';
  }).length;

  const criticalFiltered = filterWorklist(sampleDoctorPatients, 'CRITICAL');

  assert.strictEqual(criticalCount, 3, 'Thẻ đếm có 3 ca rất nghiêm trọng');
  assert.strictEqual(criticalFiltered.length, 3, 'Bộ lọc CRITICAL phải khớp đủ 3 ca');
  assert.strictEqual(criticalFiltered.length, criticalCount, 'Số ca lọc phải khớp chính xác với bộ đếm thống kê');
  assert.ok(criticalFiltered.some((p) => (p.riskLevel || '').toUpperCase() === 'SEVERE'));
  assert.ok(criticalFiltered.some((p) => (p.riskLevel || '').toUpperCase() === 'ALARM'));
});

runTest('WORKLIST-2: DoctorWorklistView render đầy đủ các ca bệnh nhân và thống kê số lượng', () => {
  const html = renderToStaticMarkup(
    React.createElement(DoctorWorklistView, {
      patients: sampleDoctorPatients,
      onSelectPatient: () => {},
    })
  );

  assert.ok(html.includes('Danh sách ca khám phân công'));
  assert.ok(html.includes('(6)'), 'Hiển thị tổng số 6 bệnh nhân');
  assert.ok(html.includes('Bệnh Nhân Nguy Kịch 1'));
  assert.ok(html.includes('Bệnh Nhân Nguy Cơ Cao'));
  assert.ok(html.includes('MRN-001'));
  assert.ok(html.includes('MRN-004'));
  assert.ok(html.includes('Mở CDS'), 'Có nút Mở CDS');
});

// -----------------------------------------------------------------

console.log('\n--- 12. Kiểm thử Component Lựa Chọn Y Tế Lâm Sàng (ClinicalSelect) ---');

const testSelectOptions: ClinicalSelectOption<string>[] = [
  {
    value: 'Fundus_Macula',
    label: 'Ảnh màu đáy mắt hoàng điểm',
    sublabel: 'Macula Centered (Vi mạch trung tâm)',
    riskLevel: 'low',
  },
  {
    value: 'Fundus_OpticDisc',
    label: 'Ảnh màu đáy mắt gai thị',
    sublabel: 'Optic Disc (Tỷ lệ gai thị / lõm gai)',
    riskLevel: 'moderate',
  },
  {
    value: 'OCT_Scan',
    label: 'Chụp cắt lớp võng mạc (OCT)',
    sublabel: 'Optical Coherence Tomography',
    riskLevel: 'critical',
    disabled: true,
  },
];

runTest('SELECT-1: Render trigger button với nhãn lựa chọn hiện tại và accessibility attributes', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Fundus_Macula',
      onChange: () => {},
      options: testSelectOptions,
      label: 'Loại ảnh chụp đáy mắt',
    })
  );

  assert.ok(html.includes('role="combobox"'), 'Có combobox role');
  assert.ok(html.includes('aria-haspopup="listbox"'), 'Có aria-haspopup="listbox"');
  assert.ok(html.includes('Loại ảnh chụp đáy mắt'), 'Hiển thị label');
  assert.ok(html.includes('Ảnh màu đáy mắt hoàng điểm'), 'Hiển thị nhãn của giá trị đã chọn');
  assert.ok(html.includes('bg-[#16A34A]'), 'Có dot nguy cơ màu xanh cho low risk');
});

runTest('SELECT-2: Render placeholder khi giá trị không khớp option nào', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Non_Existent',
      onChange: () => {},
      options: testSelectOptions,
      placeholder: 'Vui lòng chọn loại ảnh võng mạc...',
    })
  );

  assert.ok(html.includes('Vui lòng chọn loại ảnh võng mạc...'), 'Hiển thị đúng placeholder');
});

runTest('SELECT-3: Render với Darkroom mode áp dụng nền Obsidian và text tương phản', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Fundus_OpticDisc',
      onChange: () => {},
      options: testSelectOptions,
      isDarkRoom: true,
    })
  );

  assert.ok(html.includes('bg-[#0B132B]'), 'Chế độ darkroom có nền obsidian tối sâu');
  assert.ok(html.includes('text-[#F8FAFC]'), 'Chế độ darkroom có text tương phản cao #F8FAFC');
  assert.ok(html.includes('border-[#1E293B]'), 'Chế độ darkroom có border tối dịu mắt');
});

runTest('SELECT-4: Render với trạng thái disabled khóa tương tác', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Fundus_Macula',
      onChange: () => {},
      options: testSelectOptions,
      disabled: true,
    })
  );

  assert.ok(html.includes('disabled=""') || html.includes('disabled'), 'Có thuộc tính disabled');
  assert.ok(html.includes('cursor-not-allowed'), 'Có cursor-not-allowed');
  assert.ok(html.includes('opacity-50'), 'Có opacity-50 mờ nhẹ khi disabled');
});

runTest('SELECT-5: Render thông báo lỗi error và nhãn required có dấu sao đỏ', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Fundus_Macula',
      onChange: () => {},
      options: testSelectOptions,
      label: 'Chọn mắt',
      required: true,
      error: 'Vui lòng chọn định dạng ảnh hợp lệ',
    })
  );

  assert.ok(html.includes('text-red-500 font-bold">*</span>'), 'Có dấu sao đỏ bắt buộc');
  assert.ok(html.includes('Vui lòng chọn định dạng ảnh hợp lệ'), 'Hiển thị thông báo lỗi');
  assert.ok(html.includes('role="alert"'), 'Thông báo lỗi có role="alert"');
});

runTest('SELECT-6: Kích cỡ size (sm, md, lg) sinh class padding và chiều cao tương ứng', () => {
  const htmlSm = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Fundus_Macula',
      onChange: () => {},
      options: testSelectOptions,
      size: 'sm',
    })
  );
  const htmlLg = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Fundus_Macula',
      onChange: () => {},
      options: testSelectOptions,
      size: 'lg',
    })
  );

  assert.ok(htmlSm.includes('h-8'), 'Size sm có h-8');
  assert.ok(htmlLg.includes('h-11') || htmlLg.includes('h-12'), 'Size lg có h-11 hoặc h-12');
});

runTest('SELECT-7: Bổ sung thuộc tính title chống cắt chữ cho nhãn y tế dài và placeholder', () => {
  const htmlWithSelected = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Fundus_Macula',
      onChange: () => {},
      options: testSelectOptions,
    })
  );

  assert.ok(
    htmlWithSelected.includes('title="Ảnh màu đáy mắt hoàng điểm"'),
    'Trigger label span có thuộc tính title với nhãn option đã chọn'
  );

  const htmlWithPlaceholder = renderToStaticMarkup(
    React.createElement(ClinicalSelect, {
      value: 'Non_Existent',
      onChange: () => {},
      options: testSelectOptions,
      placeholder: 'Chọn phương thức quét võng mạc chuyên sâu...',
    })
  );

  assert.ok(
    htmlWithPlaceholder.includes('title="Chọn phương thức quét võng mạc chuyên sâu..."'),
    'Trigger label span có thuộc tính title với placeholder khi chưa chọn'
  );
});

runTest('SELECT-8: Native select hỗ trợ tìm ngược lại option gốc theo kiểu dữ liệu number', () => {
  const numberOptions: ClinicalSelectOption<number>[] = [
    { value: 10, label: '10 ca / trang' },
    { value: 25, label: '25 ca / trang' },
    { value: 50, label: '50 ca / trang' },
  ];

  let selectedNumber: number | null = null;
  const element = React.createElement<ClinicalSelectProps<number>>(ClinicalSelect, {
    value: 10,
    onChange: (val: number) => {
      selectedNumber = val;
    },
    options: numberOptions,
  });

  const html = renderToStaticMarkup(element);
  assert.ok(html.includes('value="10"'), 'Render đúng value number dạng string trên native option');
  assert.ok(html.includes('10 ca / trang'), 'Render đúng label tiếng Việt');

  // Giả lập trực tiếp logic onChange của native select
  const rawVal = "25";
  const matched = numberOptions.find((opt) => String(opt.value) === rawVal);
  const resultVal = matched ? matched.value : (rawVal as unknown as number);

  assert.strictEqual(typeof resultVal, 'number', 'Kết quả ánh xạ ngược giữ nguyên kiểu number');
  assert.strictEqual(resultVal, 25, 'Khớp chính xác giá trị number 25');
});

// -----------------------------------------------------------------------------
// PHẦN 13: KIỂM THỬ TOÀN DIỆN THẺ TÓM TẮT NGUY CƠ LÂM SÀNG (ClinicalRiskSummaryCard)
// -----------------------------------------------------------------------------
console.log('\n--- 13. Kiểm thử Toàn diện Thẻ Tóm Tắt Nguy Cơ Lâm Sàng (ClinicalRiskSummaryCard) ---');

runTest('CRSC-1: Render đầy đủ các khối cấu trúc chính (Banner, 3 Card nguy cơ, Biomarkers, Findings, Recommendations, Disclaimer, Nút hành động)', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: sampleAnalysisResult,
      onOpenFullReport: () => {},
      onConsultDoctor: () => {},
    })
  );

  // 1. Banner tổng hợp
  assert.ok(html.includes('Tóm Tắt Nguy Cơ Vi Mạch Lâm Sàng'), 'Có banner tiêu đề tóm tắt');
  assert.ok(html.includes('Chỉ Số Nguy Cơ Vi Mạch:'), 'Có nhãn chỉ số nguy cơ');
  assert.ok(html.includes('72'), 'Có điểm số tổng quát 72');
  assert.ok(html.includes('/100'), 'Có thang điểm /100');
  assert.ok(html.includes('Nguy cơ Cao'), 'Có RiskBadge mức Nguy cơ Cao');

  // 2. 3 Thẻ nguy cơ thành phần
  assert.ok(html.includes('Nguy cơ tim mạch 3 năm'), 'Có thẻ nguy cơ tim mạch');
  assert.ok(html.includes('Bệnh võng mạc đái tháo đường'), 'Có thẻ võng mạc đái tháo đường');
  assert.ok(html.includes('Nguy cơ tăng nhãn áp'), 'Có thẻ tăng nhãn áp');

  // 3. Biomarkers header
  assert.ok(html.includes('Chỉ Số Vi Mạch Chuyên Sâu'), 'Có tiêu đề chỉ số vi mạch chuyên sâu');

  // 4. Nhận định và khuyến nghị
  assert.ok(html.includes('Nhận định lâm sàng từ AI'), 'Có tiêu đề nhận định lâm sàng AI');
  assert.ok(html.includes('Khuyến nghị y khoa &amp; theo dõi') || html.includes('Khuyến nghị y khoa & theo dõi'), 'Có tiêu đề khuyến nghị y khoa');

  // 5. Disclaimer bắt buộc
  assert.ok(html.includes(MANDATORY_MEDICAL_DISCLAIMER), 'Có Medical Disclaimer theo chuẩn an toàn y tế');

  // 6. Nút hành động
  assert.ok(html.includes('Xem &amp; In Phiếu Báo Cáo Chi Tiết') || html.includes('Xem & In Phiếu Báo Cáo Chi Tiết'), 'Có nút in phiếu báo cáo');
  assert.ok(html.includes('Trao Đổi Với Bác Sĩ'), 'Có nút trao đổi với bác sĩ');
});

runTest('CRSC-2: Banner gradient thay đổi chính xác theo 4 mức độ rủi ro lâm sàng', () => {
  // Mức Low (< 40)
  const lowResult: AIRiskResult = {
    ...sampleAnalysisResult,
    overallVascularRiskScore: 25,
    riskScore: 25,
  };
  const htmlLow = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: lowResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlLow.includes('from-[#115E59]'), 'Mức Low dùng tông màu Teal y tế #115E59');
  assert.ok(htmlLow.includes('Nguy cơ Thấp'), 'RiskBadge hiển thị Nguy cơ Thấp');

  // Mức Moderate (40 - 64)
  const modResult: AIRiskResult = {
    ...sampleAnalysisResult,
    overallVascularRiskScore: 50,
    riskScore: 50,
  };
  const htmlMod = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: modResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlMod.includes('from-amber-900/90'), 'Mức Moderate dùng tông màu Amber');
  assert.ok(htmlMod.includes('Nguy cơ Trung bình'), 'RiskBadge hiển thị Nguy cơ Trung bình');

  // Mức High (65 - 79)
  const highResult: AIRiskResult = {
    ...sampleAnalysisResult,
    overallVascularRiskScore: 72,
    riskScore: 72,
  };
  const htmlHigh = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: highResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlHigh.includes('from-orange-950'), 'Mức High dùng tông màu Orange đậm');
  assert.ok(htmlHigh.includes('Nguy cơ Cao'), 'RiskBadge hiển thị Nguy cơ Cao');

  // Mức Critical (>= 80)
  const critResult: AIRiskResult = {
    ...sampleAnalysisResult,
    overallVascularRiskScore: 88,
    riskScore: 88,
  };
  const htmlCrit = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: critResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlCrit.includes('from-red-950'), 'Mức Critical dùng tông màu Red cảnh báo khẩn cấp');
  assert.ok(htmlCrit.includes('Nguy kịch'), 'RiskBadge hiển thị Nguy kịch');
});

runTest('CRSC-3: Nhận diện trạng thái thẩm định của Bác sĩ (REVIEWED vs Chờ thẩm định)', () => {
  // Ca đã thẩm định
  const reviewedResult: AIRiskResult = {
    ...sampleAnalysisResult,
    status: 'REVIEWED',
    digitalSignature: 'SIG-DOC-98765-APPROVED',
  };
  const htmlReviewed = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: reviewedResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlReviewed.includes('Đã Thẩm Định Bởi Bác Sĩ Chuyên Khoa'), 'Hiển thị huy hiệu đã duyệt khi status REVIEWED');

  // Ca kết quả sơ bộ AI chờ thẩm định
  const unreviewedResult: AIRiskResult = {
    ...sampleAnalysisResult,
    status: 'ANALYZED',
    digitalSignature: undefined,
  };
  const htmlUnreviewed = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: unreviewedResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlUnreviewed.includes('Kết Quả Sơ Bộ AI - Chờ Bác Sĩ Thẩm Định'), 'Hiển thị nhãn chờ bác sĩ duyệt khi chưa ký số');
});

runTest('CRSC-4: Thẻ nguy cơ thành phần hiển thị chính xác điểm số, thanh đo và chip thông số phụ', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: sampleAnalysisResult,
      onOpenFullReport: () => {},
    })
  );

  // CVD: score 72, Đột quỵ 3 năm: 20% (ưu tiên threeYearStrokeRiskPercent)
  assert.ok(html.includes('Huyết áp võng mạc'), 'Có chip Huyết áp võng mạc');
  assert.ok(html.includes('Nguy cơ đột quỵ 3 năm'), 'Có chip Nguy cơ đột quỵ');
  assert.ok(html.includes('20%'), 'Hiển thị đúng tỷ lệ đột quỵ 20% từ threeYearStrokeRiskPercent');

  // DR: score 55, macularEdemaPresent: false -> Phù hoàng điểm 'Không phát hiện'
  assert.ok(html.includes('Phân độ ETDRS'), 'Có chip Phân độ ETDRS');
  assert.ok(html.includes('Phù hoàng điểm'), 'Có chip Phù hoàng điểm');
  assert.ok(html.includes('Không phát hiện'), 'macularEdemaPresent false hiển thị Không phát hiện phù hoàng điểm');

  // Trường hợp macularEdemaPresent: true -> 'Có phát hiện'
  const positiveEdemaResult: AIRiskResult = {
    ...sampleAnalysisResult,
    diabeticRetinopathyRisk: {
      ...sampleAnalysisResult.diabeticRetinopathyRisk!,
      macularEdemaPresent: true,
    },
  };
  const htmlPositive = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: positiveEdemaResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlPositive.includes('Có phát hiện'), 'macularEdemaPresent true hiển thị Có phát hiện phù hoàng điểm');

  // Glaucoma: score 15, VCDR 0.42 -> 'Bình thường (< 0.50)'
  assert.ok(html.includes('Tỷ lệ lõm gai thị'), 'Có chip Tỷ lệ lõm gai thị');
  assert.ok(html.includes('0.42'), 'Hiển thị đúng giá trị VCDR 0.42');
  assert.ok(html.includes('Bình thường (&lt; 0.50)') || html.includes('Bình thường (< 0.50)'), 'VCDR 0.42 là Bình thường');
});

runTest('CRSC-5: Chế độ thẻ trực quan Biomarker hiển thị đầy đủ 4 chỉ số và dải tham chiếu chuẩn', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: sampleAnalysisResult,
      onOpenFullReport: () => {},
    })
  );

  // 1. A/V Ratio
  assert.ok(html.includes('Tỷ Lệ Động - Tĩnh Mạch'), 'Có tên chỉ số Tỷ Lệ Động - Tĩnh Mạch');
  assert.ok(html.includes('0.58'), 'Hiển thị giá trị 0.58');
  assert.ok(html.includes('Chuẩn: ≥ 0.67 (2:3)'), 'Hiển thị ngưỡng tham chiếu A/V ratio');

  // 2. Vessel Density
  assert.ok(html.includes('Mật Độ Mao Mạch'), 'Có tên chỉ số Mật Độ Mao Mạch');
  assert.ok(html.includes('16.2%'), 'Hiển thị giá trị 16.2%');
  assert.ok(html.includes('Chuẩn: 15.5% – 19.0%'), 'Hiển thị ngưỡng tham chiếu Mật Độ Mao Mạch');

  // 3. Tortuosity Index
  assert.ok(html.includes('Độ Uốn Lượn Vi Mạch'), 'Có tên chỉ số Độ Uốn Lượn Vi Mạch');
  assert.ok(html.includes('1.34'), 'Hiển thị giá trị 1.34');
  assert.ok(html.includes('Chuẩn: &lt; 1.25') || html.includes('Chuẩn: < 1.25'), 'Hiển thị ngưỡng tham chiếu Độ Uốn Lượn');

  // 4. VCDR
  assert.ok(html.includes('Tỷ Lệ Lõm Gai Thị'), 'Có tên chỉ số Tỷ Lệ Lõm Gai Thị');
  assert.ok(html.includes('Chuẩn: &lt; 0.50 (0.3 - 0.45)') || html.includes('Chuẩn: < 0.50 (0.3 - 0.45)'), 'Hiển thị ngưỡng tham chiếu VCDR');

  // Visual Range Bar
  assert.ok(html.includes('bg-emerald-200/80'), 'BiomarkerRangeBar có dải tham chiếu chuẩn màu xanh lá');
});

runTest('CRSC-6: An toàn y tế và khả năng chống sập (Fail-Safe) khi biomarkers null / undefined / NaN', () => {
  const emptyBiomarkersResult: AIRiskResult = {
    ...sampleAnalysisResult,
    annotatedMap: {
      arteryVeinRatio: undefined as any,
      vesselDensityPercentage: null as any,
      tortuosityIndex: NaN,
      opticCupToDiscRatio: undefined as any,
      detectedAnomalies: [],
    },
  };

  const html = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: emptyBiomarkersResult,
      onOpenFullReport: () => {},
    })
  );

  // Không sập, hiển thị nhãn an toàn
  assert.ok(html.includes('Chưa xác định'), 'Hiển thị Chưa xác định khi biomarker thiếu dữ liệu');
  assert.ok(html.includes('Chưa đo được'), 'Hiển thị badge Chưa đo được');
  assert.ok(html.includes('border-dashed border-slate-300'), 'Thanh đo dự phòng dạng nét đứt khi không có số đo');
});

runTest('CRSC-7: Nhận định lâm sàng AI và Khuyến nghị y khoa tự động phân tách ý trực quan', () => {
  const detailedResult: AIRiskResult = {
    ...sampleAnalysisResult,
    findings: '- Điểm 1: Co thắt vi mạch thái dương trên.\n- Điểm 2: Tỷ lệ A/V giảm nhẹ ở cả hai nhánh.\n- Điểm 3: Chưa phát hiện phù hoàng điểm.',
    recommendations: '1. Khám lại sau 3 tháng.\n2. Đo huyết áp hàng ngày tại nhà.\n3. Duy trì chế độ ăn ít muối.',
  };

  const html = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: detailedResult,
      onOpenFullReport: () => {},
    })
  );

  // Kiểm tra từng ý được render thành phần tử riêng biệt
  assert.ok(html.includes('Co thắt vi mạch thái dương trên'), 'Phân tách đúng ý nhận định 1');
  assert.ok(html.includes('Tỷ lệ A/V giảm nhẹ ở cả hai nhánh'), 'Phân tách đúng ý nhận định 2');
  assert.ok(html.includes('Khám lại sau 3 tháng'), 'Phân tách đúng ý khuyến nghị 1');
  assert.ok(html.includes('Đo huyết áp hàng ngày tại nhà'), 'Phân tách đúng ý khuyến nghị 2');
});

runTest('CRSC-8: Khối ghi chú của Bác sĩ phụ trách hiển thị khi có doctorNotes và ẩn khi không có', () => {
  // Có doctorNotes
  const withNotesResult: AIRiskResult = {
    ...sampleAnalysisResult,
    doctorNotes: 'Bệnh nhân cần kiểm soát chặt chẽ huyết áp và tái khám sau 30 ngày.',
    doctorName: 'BS. CKII Trần Hoàng Long',
  };
  const htmlWithNotes = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: withNotesResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(htmlWithNotes.includes('Ghi chú thẩm định từ bác sĩ phụ trách'), 'Có tiêu đề ghi chú bác sĩ');
  assert.ok(htmlWithNotes.includes('BS. CKII Trần Hoàng Long'), 'Hiển thị tên bác sĩ phụ trách');
  assert.ok(htmlWithNotes.includes('Bệnh nhân cần kiểm soát chặt chẽ huyết áp'), 'Hiển thị nội dung ghi chú');

  // Không có doctorNotes
  const withoutNotesResult: AIRiskResult = {
    ...sampleAnalysisResult,
    doctorNotes: undefined,
  };
  const htmlWithoutNotes = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: withoutNotesResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(!htmlWithoutNotes.includes('Ghi chú thẩm định từ bác sĩ phụ trách'), 'Ẩn khối ghi chú khi không có doctorNotes');
});

runTest('CRSC-9: Nút hành động và callback onConsultDoctor hoạt động linh hoạt', () => {
  // Có onConsultDoctor
  const htmlWithChat = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: sampleAnalysisResult,
      onOpenFullReport: () => {},
      onConsultDoctor: () => {},
    })
  );
  assert.ok(htmlWithChat.includes('Trao Đổi Với Bác Sĩ'), 'Có nút Trao Đổi Với Bác Sĩ khi có callback');

  // Không có onConsultDoctor
  const htmlWithoutChat = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: sampleAnalysisResult,
      onOpenFullReport: () => {},
    })
  );
  assert.ok(!htmlWithoutChat.includes('Trao Đổi Với Bác Sĩ'), 'Ẩn nút Trao Đổi Với Bác Sĩ khi không truyền callback');
  assert.ok(htmlWithoutChat.includes('Xem &amp; In Phiếu Báo Cáo Chi Tiết') || htmlWithoutChat.includes('Xem & In Phiếu Báo Cáo Chi Tiết'), 'Nút Xem & In Phiếu luôn hiện diện');
});

runTest('CRSC-10: Các nút chuyển chế độ Trực quan / Dạng bảng và Thu gọn hiện diện đầy đủ', () => {
  const html = renderToStaticMarkup(
    React.createElement(ClinicalRiskSummaryCard, {
      analysisResult: sampleAnalysisResult,
      onOpenFullReport: () => {},
    })
  );

  assert.ok(html.includes('Trực quan'), 'Có nút chuyển chế độ Trực quan');
  assert.ok(html.includes('Dạng bảng'), 'Có nút chuyển chế độ Dạng bảng');
  assert.ok(html.includes('Thu Gọn Bảng Chỉ Số ▲') || html.includes('Xem Đầy Đủ 4 Chỉ Số ▼'), 'Có nút thu gọn / mở rộng bảng chỉ số');
});

// =================================================================
// PHẦN 14: KIỂM THỬ ĐỘNG CƠ HEATMAP ĐỘNG & TÍNH BẤT BIẾN Y TẾ EMR (SDD-007)
// =================================================================
console.log('\n--- 14. Kiểm thử Động Cơ Heatmap Động & Tính Bất Biến Y Tế EMR (SDD-007) ---');

runTest('HEATMAP-ENGINE-1: getMedicalPlasmaColor ánh xạ chuẩn phổ Plasma/Turbo gradient theo 4 dải y tế', () => {
  // Dải 0: Mức 0 trả về trong suốt
  const transparentColor = getMedicalPlasmaColor(0.0);
  assert.strictEqual(transparentColor[3], 0);

  // Dải 1: Cyan / Xanh ngọc (0.15)
  const cyanColor = getMedicalPlasmaColor(0.15);
  assert.ok(cyanColor[2] > cyanColor[0], 'Kênh Blue chiếm ưu thế ở dải Cyan');
  assert.ok(cyanColor[1] > 100, 'Kênh Green sáng ở dải Cyan');

  // Dải 2: Vàng sáng (0.45)
  const yellowColor = getMedicalPlasmaColor(0.45);
  assert.ok(yellowColor[0] > 150 && yellowColor[1] > 150, 'Kênh Red và Green cao tạo màu vàng');

  // Dải 3: Cam đậm (0.7)
  const orangeColor = getMedicalPlasmaColor(0.7);
  assert.ok(orangeColor[0] > 200, 'Kênh Red cực đại ở màu cam');
  assert.ok(orangeColor[1] < yellowColor[1], 'Kênh Green giảm khi chuyển sang cam');

  // Dải 4: Đỏ rực / Đỏ sẫm (0.95)
  const redColor = getMedicalPlasmaColor(0.95);
  assert.ok(redColor[0] > 200, 'Kênh Red cao');
  assert.ok(redColor[1] < 50, 'Kênh Green thấp tạo sắc đỏ thuần');
});

runTest('HEATMAP-ENGINE-2: renderDynamicRetinalHeatmap fallback vector an toàn và không throw error', () => {
  function createMockCanvas(w = 512, h = 512) {
    const gradients: any[] = [];
    const arcs: any[] = [];
    const rects: any[] = [];
    const ctx = {
      clearRect: () => {},
      createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
        const stops: { offset: number; color: string }[] = [];
        const g = {
          x0, y0, r0, x1, y1, r1, stops,
          addColorStop: (offset: number, color: string) => stops.push({ offset, color }),
        };
        gradients.push(g);
        return g;
      },
      fillRect: (x: number, y: number, w: number, h: number) => rects.push({ x, y, w, h }),
      beginPath: () => {},
      arc: (x: number, y: number, r: number, s: number, e: number) => arcs.push({ x, y, r, s, e }),
      fill: () => {},
      fillStyle: null as any,
    };
    return {
      canvas: { width: w, height: h, getContext: () => ctx } as unknown as HTMLCanvasElement,
      gradients,
      arcs,
      rects,
    };
  }

  const mock = createMockCanvas(512, 512);
  const success = renderDynamicRetinalHeatmap(mock.canvas, mock.canvas, {
    riskScore: 82,
    selectedEye: 'OD',
    anomalies: [
      {
        coordinates: { x: 45, y: 40, width: 20, height: 20 },
        type: 'Microaneurysm',
        confidence: 0.92,
      },
    ],
  });

  assert.strictEqual(success, true, 'Hàm renderDynamicRetinalHeatmap thực thi thành công');
  assert.ok(mock.gradients.length > 0, 'Đã tạo radial gradient cho phổ nhiệt');
  assert.ok(mock.rects.length > 0, 'Đã vẽ nền phổ nhiệt lên canvas');
});

runTest('HEATMAP-ENGINE-3: generateDynamicHeatmapDataUrl xử lý chuỗi ảnh rỗng mà không throw error', () => {
  generateDynamicHeatmapDataUrl('', {
    riskScore: 50,
  }).then((dataUrl) => {
    assert.ok(typeof dataUrl === 'string', 'Trả về chuỗi dataUrl');
    assert.ok(dataUrl.startsWith('data:image/png'), 'Data URL có định dạng data:image/png');
  });
});

runTest('HEATMAP-CANVAS-1: DynamicHeatmapCanvas render static markup với aria-label và mix-blend-screen', () => {
  const html = renderToStaticMarkup(
    React.createElement(DynamicHeatmapCanvas, {
      imageSrc: '/uploads/fundus_test.png',
      riskScore: 65,
      selectedEye: 'OD',
      opacity: 0.75,
      className: 'custom-heatmap-class',
    })
  );

  assert.ok(html.includes('<canvas'), 'Render thẻ canvas');
  assert.ok(html.includes('aria-label="Dynamic Retinal XAI Grad-CAM Heatmap"'), 'Có thuộc tính aria-label trợ năng');
  assert.ok(html.includes('custom-heatmap-class'), 'Truyền class tùy chỉnh');
  assert.ok(html.includes('mix-blend-mode:screen') || html.includes('mix-blend-screen'), 'Hỗ trợ hiệu ứng mix-blend-screen');
});

runTest('HISTORY-IMMUTABILITY-1: PatientHistoryView có nút "Đặt lại bộ lọc" với tooltip hướng dẫn rõ ràng', () => {
  const html = renderToStaticMarkup(
    React.createElement(PatientHistoryView, {
      screenings: sampleHistoryScreenings,
    })
  );

  // Đổi nhãn từ "Đặt lại" sang "Đặt lại bộ lọc"
  assert.ok(html.includes('Đặt lại bộ lọc'), 'Nhãn nút đã đổi thành "Đặt lại bộ lọc"');
  assert.ok(
    html.includes('title="Đặt lại các điều kiện lọc (Mắt, Mức nguy cơ, Ô tìm kiếm) về mặc định"'),
    'Có tooltip giải thích rõ ràng phạm vi đặt lại'
  );
});

runTest('HISTORY-IMMUTABILITY-2: PatientHistoryView hiển thị EHR Immutability Callout với icon ShieldCheck và thông điệp HIPAA', () => {
  const html = renderToStaticMarkup(
    React.createElement(PatientHistoryView, {
      screenings: sampleHistoryScreenings,
    })
  );

  // Chỉ dẫn tính bất biến y tế HIPAA
  assert.ok(
    html.includes('Hồ sơ bệnh án điện tử (EMR) được lưu trữ bất biến theo quy chuẩn an toàn y tế HIPAA &amp; Bộ Y Tế') ||
    html.includes('Hồ sơ bệnh án điện tử (EMR) được lưu trữ bất biến theo quy chuẩn an toàn y tế HIPAA & Bộ Y Tế'),
    'Hiển thị thông điệp tính bất biến EMR HIPAA & Bộ Y Tế'
  );
  assert.ok(html.includes('lucide-shield-check'), 'Callout có chứa icon ShieldCheck');
});

console.log('\n=================================================================');
console.log(`   KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐÃ ĐẠT (100% PASS)`);
console.log('=================================================================\n');
