import assert from 'assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { BiomarkerGaugeBar } from '../components/common/BiomarkerGaugeBar';
import { LesionRipplePulse } from '../components/viewer/LesionRipplePulse';
import { PatientScreeningResultView } from '../features/patient/PatientScreeningResultView';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { LanguageProvider } from '../context/LanguageContext';
import { AIRiskResult } from '../types/cds';

console.log('=================================================================');
console.log('   AURA MILESTONE 3 MOTION & BIOMARKER GAUGES TEST SUITE');
console.log('=================================================================');

const mockResult: AIRiskResult = {
  id: 'test-screening-m3',
  analysisId: 'test-analysis-m3-001',
  patientId: 'PAT-1001',
  imageUrl: '/assets/images/fundus_sample_od.png',
  status: 'COMPLETED',
  executionTimeMs: 450,
  overallVascularRiskScore: 68,
  riskScore: 68,
  cardiovascularRisk: {
    level: 'Moderate',
    score: 65,
    hypertensionStage: 'Stage 1 HTN',
    threeYearStrokeRiskPercent: 28,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 55,
    etdrsGrade: 'MILD NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 22,
  },
  annotatedMap: {
    arteryVeinRatio: 0.65,
    vesselDensityPercentage: 42.5,
    tortuosityIndex: 1.18,
    opticCupToDiscRatio: 0.35,
    detectedAnomalies: [
      {
        id: 'ano-ma-1',
        type: 'Microaneurysm',
        coordinates: { x: 50, y: 50, width: 24, height: 24 },
        confidence: 0.92,
        description: 'Microaneurysm in temporal retina',
      },
      {
        id: 'ano-bleed-1',
        type: 'Hemorrhage',
        coordinates: { x: 60, y: 60, width: 28, height: 28 },
        confidence: 0.88,
        description: 'Dot hemorrhage near macula',
      },
      {
        id: 'ano-exudate-1',
        type: 'Hard_Exudate',
        coordinates: { x: 40, y: 40, width: 20, height: 20 },
        confidence: 0.85,
        description: 'Hard exudate cluster',
      },
    ],
  },
  xaiExplainability: [],
  findings: 'Microvascular changes detected.',
  recommendations: 'Follow up in 6 months.',
};

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (error: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(error);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: ANIMATED COUNTER & SSR TRANSPARENCY
// -----------------------------------------------------------------------------
console.log('\n--- 1. AnimatedCounter & SSR / Static Markup Transparency ---');

runTest('TEST-MOTION-1: AnimatedCounter renders target integer in SSR without starting from 0', () => {
  const html = renderToStaticMarkup(<AnimatedCounter value={68} />);
  assert.ok(html.includes('68'), 'AnimatedCounter phải render giá trị 68 ngay trong SSR');
});

runTest('TEST-MOTION-2: AnimatedCounter formats decimals and suffix accurately', () => {
  const htmlAvr = renderToStaticMarkup(<AnimatedCounter value={0.654} decimals={2} />);
  assert.ok(htmlAvr.includes('0.65'), 'Định dạng 2 chữ số thập phân cho AVR');

  const htmlDensity = renderToStaticMarkup(<AnimatedCounter value={42.5} decimals={1} suffix="%" />);
  assert.ok(htmlDensity.includes('42.5%'), 'Định dạng 1 chữ số thập phân và kèm suffix %');
});

runTest('TEST-MOTION-3: AnimatedCounter safely handles edge cases (0, NaN, undefined)', () => {
  const htmlZero = renderToStaticMarkup(<AnimatedCounter value={0} />);
  assert.ok(htmlZero.includes('0'), 'Xử lý an toàn giá trị 0');

  const htmlNan = renderToStaticMarkup(<AnimatedCounter value={NaN} />);
  assert.ok(htmlNan.includes('0'), 'Xử lý an toàn NaN -> 0');

  const htmlUndefined = renderToStaticMarkup(<AnimatedCounter value={undefined as any} />);
  assert.ok(htmlUndefined.includes('0'), 'Xử lý an toàn undefined -> 0');
});

// -----------------------------------------------------------------------------
// SECTION 2: BIOMARKER GAUGE BAR & SMOOTH TRANSITION
// -----------------------------------------------------------------------------
console.log('\n--- 2. BiomarkerGaugeBar & Clamping Boundaries ---');

runTest('TEST-MOTION-4: BiomarkerGaugeBar clamps minPercent and upper bound 100%', () => {
  const htmlBelow = renderToStaticMarkup(<BiomarkerGaugeBar percent={-5} minPercent={8} />);
  assert.ok(htmlBelow.includes('width:8%'), 'Clamps dưới minPercent');

  const htmlAbove = renderToStaticMarkup(<BiomarkerGaugeBar percent={120} />);
  assert.ok(htmlAbove.includes('width:100%'), 'Clamps trên 100%');

  const htmlMid = renderToStaticMarkup(<BiomarkerGaugeBar percent={55} />);
  assert.ok(htmlMid.includes('width:55%'), 'Giữ nguyên giá trị phần trăm hợp lệ');
});

runTest('TEST-MOTION-5: BiomarkerGaugeBar renders progressbar role and aria attributes', () => {
  const html = renderToStaticMarkup(
    <BiomarkerGaugeBar percent={65} colorClass="bg-emerald-500" ariaLabel="A/V Ratio Gauge" />
  );
  assert.ok(html.includes('role="progressbar"'), 'Có role progressbar');
  assert.ok(html.includes('aria-valuenow="65"'), 'Có aria-valuenow đúng');
  assert.ok(html.includes('aria-label="A/V Ratio Gauge"'), 'Có aria-label mô tả');
  assert.ok(html.includes('bg-emerald-500'), 'Áp dụng colorClass');
});

// -----------------------------------------------------------------------------
// SECTION 3: LESION RIPPLE PULSE WAVES
// -----------------------------------------------------------------------------
console.log('\n--- 3. LesionRipplePulse & Concentric Expanding Waves ---');

runTest('TEST-MOTION-6: LesionRipplePulse activates for Microaneurysm and Hemorrhage', () => {
  const htmlMa = renderToStaticMarkup(<LesionRipplePulse type="Microaneurysm" />);
  assert.ok(htmlMa !== '', 'Microaneurysm phải kích hoạt sóng ripple');
  assert.ok(htmlMa.includes('rgba(245, 158, 11, 0.6)'), 'Màu hổ phách vàng cho Microaneurysm');
  assert.ok(htmlMa.includes('aura-lesion-ripple'), 'Áp dụng keyframe aura-lesion-ripple');

  const htmlBleed = renderToStaticMarkup(<LesionRipplePulse type="Hemorrhage" />);
  assert.ok(htmlBleed !== '', 'Hemorrhage phải kích hoạt sóng ripple');
  assert.ok(htmlBleed.includes('rgba(239, 68, 68, 0.6)'), 'Màu đỏ thắm cho Hemorrhage');
});

runTest('TEST-MOTION-7: LesionRipplePulse returns null for non-vascular lesion types', () => {
  const htmlExudate = renderToStaticMarkup(<LesionRipplePulse type="Hard_Exudate" />);
  assert.strictEqual(htmlExudate, '', 'Không kích hoạt pulse cho Hard Exudate');

  const htmlDrusen = renderToStaticMarkup(<LesionRipplePulse type="Drusen" />);
  assert.strictEqual(htmlDrusen, '', 'Không kích hoạt pulse cho Drusen');
});

runTest('TEST-MOTION-8: LesionRipplePulse enforces pointer-events-none for unimpeded clinical clicks', () => {
  const html = renderToStaticMarkup(<LesionRipplePulse type="Microaneurysm" />);
  assert.ok(html.includes('pointer-events-none'), 'Rings phải có pointer-events-none');
});

// -----------------------------------------------------------------------------
// SECTION 4: INTEGRATION VERIFICATION (PATIENT VIEW & RISK PANEL)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Integration Verification in Patient View & Risk Panel ---');

runTest('TEST-MOTION-9: PatientScreeningResultView integrates counter, gauges, lesion ripple & preserves data-testids', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientScreeningResultView result={mockResult} />
    </LanguageProvider>
  );

  // Counter
  assert.ok(html.includes('68'), 'Hiển thị risk score 68 qua AnimatedCounter');

  // Biomarker gauges
  assert.ok(html.includes('role="progressbar"'), 'Biomarker gauges có mặt trong Patient view');

  // Lesion pins & ripple
  assert.ok(html.includes('data-testid="patient-lesion-pin-Microaneurysm"'), 'Preserve data-testid Microaneurysm');
  assert.ok(html.includes('data-testid="patient-lesion-pin-Hemorrhage"'), 'Preserve data-testid Hemorrhage');
  assert.ok(html.includes('data-testid="patient-lesion-pin-Hard_Exudate"'), 'Preserve data-testid Hard_Exudate');
  assert.ok(html.includes('aura-lesion-ripple'), 'Lesion ripple wave hiện diện trong pinpoint button');
});

runTest('TEST-MOTION-10: RiskAssessmentPanel integrates AnimatedCounter and 4 Biomarker Gauges', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );

  // Risk score counter
  assert.ok(html.includes('68</span>/100'), 'RiskAssessmentPanel hiển thị 68 qua AnimatedCounter và /100');

  // 4 Biomarker Gauges
  const progressbarMatches = html.match(/role="progressbar"/g);
  assert.ok(progressbarMatches && progressbarMatches.length >= 4, 'Ít nhất 4 thanh gauge được render cho các vi chỉ số');
});

console.log('\n=================================================================');
console.log('   KẾT QUẢ KIỂM THỬ MILESTONE 3: 10/10 TESTS ĐÃ ĐẠT (100% PASS)');
console.log('=================================================================\n');
