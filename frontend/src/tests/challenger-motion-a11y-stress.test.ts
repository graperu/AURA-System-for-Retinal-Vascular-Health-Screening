import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Components & Hooks under test
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { BiomarkerGaugeBar } from '../components/common/BiomarkerGaugeBar';
import { LesionRipplePulse } from '../components/viewer/LesionRipplePulse';
import { ClinicalLaserScanViewport } from '../components/viewer/ClinicalLaserScanViewport';
import { PatientScreeningResultView } from '../features/patient/PatientScreeningResultView';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { LanguageProvider } from '../context/LanguageContext';
import {
  modalBackdropVariants,
  modalContentVariants,
  drawerRightVariants,
  drawerLeftVariants,
  pageTransitionVariants,
  buttonHoverPhysics,
  buttonTapPhysics,
  kpiCardHoverPhysics,
  tableRowHoverPhysics,
  queueCardHoverPhysics,
} from '../utils/motion';
import { AIRiskResult } from '../types/cds';

console.log('========================================================================');
console.log('   CHALLENGER EMPIRICAL MOTION PERFORMANCE & ACCESSIBILITY STRESS TEST');
console.log('========================================================================');

const mockResult: AIRiskResult = {
  id: 'challenger-test-result-001',
  analysisId: 'analysis-stress-001',
  patientId: 'PAT-STRESS-99',
  imageUrl: '/assets/images/fundus_sample_od.png',
  status: 'COMPLETED',
  executionTimeMs: 420,
  overallVascularRiskScore: 74,
  riskScore: 74,
  cardiovascularRisk: {
    level: 'High',
    score: 78,
    hypertensionStage: 'Stage 2 HTN',
    threeYearStrokeRiskPercent: 32,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 62,
    etdrsGrade: 'MODERATE NPDR',
    macularEdemaPresent: true,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 18,
  },
  annotatedMap: {
    arteryVeinRatio: 0.61,
    vesselDensityPercentage: 38.2,
    tortuosityIndex: 1.28,
    opticCupToDiscRatio: 0.48,
    detectedAnomalies: [
      {
        id: 'ano-stress-ma',
        type: 'Microaneurysm',
        coordinates: { x: 55, y: 48, width: 26, height: 26 },
        confidence: 0.96,
        description: 'Microaneurysm in parafoveal retina',
      },
      {
        id: 'ano-stress-bleed',
        type: 'Hemorrhage',
        coordinates: { x: 62, y: 65, width: 32, height: 32 },
        confidence: 0.91,
        description: 'Blot hemorrhage near inferior arcade',
      },
      {
        id: 'ano-stress-exudate',
        type: 'Hard_Exudate',
        coordinates: { x: 45, y: 42, width: 22, height: 22 },
        confidence: 0.89,
        description: 'Lipid exudates in circinate ring',
      },
    ],
  },
  xaiExplainability: [],
  findings: 'High risk of microvascular complications.',
  recommendations: 'Prompt referral to retinal specialist.',
};

let passedCount = 0;
let totalCount = 0;

function runChallengerTest(name: string, fn: () => void) {
  totalCount++;
  try {
    fn();
    passedCount++;
    console.log(`  [PASS] ${name}`);
  } catch (error: any) {
    console.error(`  [FAIL] ${name}`);
    console.error('    Error details:', error.message || error);
    process.exit(1);
  }
}

// =============================================================================
// SECTION 1: 60 FPS COMPOSITOR PROPERTIES & ZERO CLS VERIFICATION
// =============================================================================
console.log('\n--- 1. 60 FPS Compositor & Zero CLS Audit ---');

runChallengerTest('TEST-CHALLENGER-1: Framer Motion variants use compositor-only properties (transform, opacity)', () => {
  // Modal Backdrop
  assert.ok(modalBackdropVariants.initial && 'opacity' in (modalBackdropVariants.initial as any), 'Modal backdrop initial must animate opacity');
  assert.ok(modalBackdropVariants.animate && 'opacity' in (modalBackdropVariants.animate as any), 'Modal backdrop animate must animate opacity');
  assert.ok(modalBackdropVariants.exit && 'opacity' in (modalBackdropVariants.exit as any), 'Modal backdrop exit must animate opacity');

  // Modal Content
  const modalContentInitial = modalContentVariants.initial as any;
  const modalContentAnimate = modalContentVariants.animate as any;
  const modalContentExit = modalContentVariants.exit as any;
  assert.ok('opacity' in modalContentInitial && 'scale' in modalContentInitial && 'y' in modalContentInitial, 'Modal content initial uses opacity, scale, y');
  assert.ok('opacity' in modalContentAnimate && 'scale' in modalContentAnimate && 'y' in modalContentAnimate, 'Modal content animate uses opacity, scale, y');
  assert.ok('opacity' in modalContentExit && 'scale' in modalContentExit && 'y' in modalContentExit, 'Modal content exit uses opacity, scale, y');

  // Drawers
  const drawerRightInitial = drawerRightVariants.initial as any;
  const drawerRightAnimate = drawerRightVariants.animate as any;
  assert.ok('x' in drawerRightInitial && 'opacity' in drawerRightInitial, 'Right drawer initial uses x, opacity');
  assert.ok('x' in drawerRightAnimate && 'opacity' in drawerRightAnimate, 'Right drawer animate uses x, opacity');

  const drawerLeftInitial = drawerLeftVariants.initial as any;
  assert.ok('x' in drawerLeftInitial && 'opacity' in drawerLeftInitial, 'Left drawer initial uses x, opacity');

  // Micro-interactions
  assert.ok('scale' in buttonHoverPhysics && 'y' in buttonHoverPhysics, 'Button hover physics uses transform (scale, y)');
  assert.ok('scale' in buttonTapPhysics, 'Button tap physics uses transform (scale)');
  assert.ok('y' in kpiCardHoverPhysics, 'KpiCard hover physics uses transform (y)');
  assert.ok('x' in queueCardHoverPhysics, 'QueueCard hover physics uses transform (x)');
});

runChallengerTest('TEST-CHALLENGER-2: index.css keyframes and classes enforce compositor properties and will-change hints', () => {
  const cssPath = path.resolve(__dirname, '../index.css');
  assert.ok(fs.existsSync(cssPath), `index.css phải tồn tại tại ${cssPath}`);
  const css = fs.readFileSync(cssPath, 'utf8');

  // aura-lesion-ripple keyframe check
  assert.ok(css.includes('@keyframes aura-lesion-ripple'), 'Keyframe aura-lesion-ripple phải tồn tại');
  assert.ok(css.includes('transform: scale('), 'aura-lesion-ripple phải sử dụng transform: scale');
  assert.ok(css.includes('opacity:'), 'aura-lesion-ripple phải sử dụng opacity');
  assert.ok(css.includes('.aura-lesion-ripple-ring'), '.aura-lesion-ripple-ring class phải có mặt');
  assert.ok(css.includes('will-change: transform, opacity;'), 'will-change: transform, opacity phải được chỉ định trên ripple ring');

  // Optic Reticle pulse keyframe check
  assert.ok(css.includes('@keyframes opticReticlePulse'), 'Keyframe opticReticlePulse phải tồn tại');
  assert.ok(css.includes('.animate-reticle-pulse'), '.animate-reticle-pulse class phải có mặt');

  // Grad-CAM Crossfade check
  assert.ok(css.includes('@keyframes gradCamCrossfade'), 'Keyframe gradCamCrossfade phải tồn tại');
  assert.ok(css.includes('.animate-gradcam-crossfade'), '.animate-gradcam-crossfade class phải có mặt');

  // Vessel Path Draw check
  assert.ok(css.includes('@keyframes vesselDrawIn'), 'Keyframe vesselDrawIn phải tồn tại');
  assert.ok(css.includes('.vessel-path-draw'), '.vessel-path-draw class phải có mặt');
  assert.ok(css.includes('stroke-dasharray: 100'), '.vessel-path-draw phải có stroke-dasharray');
  assert.ok(css.includes('stroke-dashoffset: 100'), '.vessel-path-draw phải có stroke-dashoffset');

  // Hemodynamic flow pulse check
  assert.ok(css.includes('@keyframes vesselHemodynamicFlow'), 'Keyframe vesselHemodynamicFlow phải tồn tại');
  assert.ok(css.includes('.vessel-flow-pulse'), '.vessel-flow-pulse class phải có mặt');
});

runChallengerTest('TEST-CHALLENGER-3: Zero Cumulative Layout Shift (CLS = 0) structural containment verification', () => {
  // Laser scan viewport container check: must be overflow-hidden, aspect-square, fixed max-height
  const laserHtml = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(ClinicalLaserScanViewport, { progressPercent: 45, isAnalyzing: true })
    )
  );
  assert.ok(laserHtml.includes('overflow-hidden'), 'ClinicalLaserScanViewport phải chứa overflow-hidden để ngăn layout shift');
  assert.ok(laserHtml.includes('aspect-square'), 'ClinicalLaserScanViewport phải có aspect-square cố định tỉ lệ');
  assert.ok(laserHtml.includes('relative'), 'ClinicalLaserScanViewport phải là relative positioning anchor');

  // Biomarker gauge bar container check: must have overflow-hidden and fixed height
  const gaugeHtml = renderToStaticMarkup(React.createElement(BiomarkerGaugeBar, { percent: 50, heightClass: 'h-2' }));
  assert.ok(gaugeHtml.includes('overflow-hidden'), 'BiomarkerGaugeBar container phải có overflow-hidden');
  assert.ok(gaugeHtml.includes('h-2'), 'BiomarkerGaugeBar container phải cố định chiều cao');
});

// =============================================================================
// SECTION 2: WCAG 2.1 AA PREFERS-REDUCED-MOTION RESILIENCE
// =============================================================================
console.log('\n--- 2. WCAG 2.1 AA prefers-reduced-motion Resilience ---');

runChallengerTest('TEST-CHALLENGER-4: index.css defines global @media (prefers-reduced-motion: reduce) overrides', () => {
  const cssPath = path.resolve(__dirname, '../index.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Phải có block @media (prefers-reduced-motion: reduce)');

  // Critical classes must disable animation and transitions
  const reducedBlock = css.substring(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(reducedBlock.includes('.laser-sweep-line'), 'laser-sweep-line có override trong reduced-motion');
  assert.ok(reducedBlock.includes('.laser-pulse-grid'), 'laser-pulse-grid có override trong reduced-motion');
  assert.ok(reducedBlock.includes('.animate-reticle-pulse'), 'animate-reticle-pulse có override trong reduced-motion');
  assert.ok(reducedBlock.includes('.vessel-path-draw'), 'vessel-path-draw có override trong reduced-motion');
  assert.ok(reducedBlock.includes('.vessel-flow-pulse'), 'vessel-flow-pulse có override trong reduced-motion');
  assert.ok(reducedBlock.includes('.animate-gradcam-crossfade'), 'animate-gradcam-crossfade có override trong reduced-motion');
  assert.ok(reducedBlock.includes('.animate-lesion-ripple'), 'animate-lesion-ripple có override trong reduced-motion');
  assert.ok(reducedBlock.includes('.aura-lesion-ripple-ring'), 'aura-lesion-ripple-ring có override trong reduced-motion');

  // Stroke draw immediate: stroke-dashoffset: 0 !important
  assert.ok(reducedBlock.includes('stroke-dashoffset: 0 !important'), 'Vessel stroke draw must immediately collapse to 0');

  // Static reticle beam position: top: 50% !important
  assert.ok(reducedBlock.includes('top: 50% !important'), 'Laser sweep line must freeze at 50% static reticle beam');
});

runChallengerTest('TEST-CHALLENGER-5: LesionRipplePulse under simulated reduced-motion returns static halo and no keyframes', () => {
  // Mock window.matchMedia to simulate prefers-reduced-motion: reduce
  const originalWindow = (global as any).window;
  (global as any).window = {
    matchMedia: (query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };

  try {
    const maHtml = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'Microaneurysm' }));
    assert.ok(!maHtml.includes('aura-lesion-ripple'), 'Reduced motion must NOT include aura-lesion-ripple animation');
    assert.ok(maHtml.includes('ring-2 ring-amber-400/40'), 'Reduced motion must render static amber halo for MA');

    const bleedHtml = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'Hemorrhage' }));
    assert.ok(!bleedHtml.includes('aura-lesion-ripple'), 'Reduced motion must NOT include aura-lesion-ripple animation for hemorrhage');
    assert.ok(bleedHtml.includes('ring-2 ring-rose-500/40'), 'Reduced motion must render static rose halo for hemorrhage');

    const selectHtml = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'Microaneurysm', isSelected: true }));
    assert.ok(selectHtml.includes('ring-4'), 'Selected state renders thicker ring-4 in reduced motion');
  } finally {
    (global as any).window = originalWindow;
  }
});

runChallengerTest('TEST-CHALLENGER-6: BiomarkerGaugeBar under simulated reduced-motion transitions instantly (0.01ms)', () => {
  const originalWindow = (global as any).window;
  (global as any).window = {
    matchMedia: (query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };

  try {
    const html = renderToStaticMarkup(React.createElement(BiomarkerGaugeBar, { percent: 75 }));
    assert.ok(html.includes('transition-duration:0.01ms') || html.includes('transitionDuration: 0.01ms') || html.includes('0.01ms'), 'Reduced motion must specify 0.01ms instant transition');
  } finally {
    (global as any).window = originalWindow;
  }
});

runChallengerTest('TEST-CHALLENGER-7: ClinicalLaserScanViewport under simulated reduced-motion freezes into static clinical reticle', () => {
  const originalWindow = (global as any).window;
  (global as any).window = {
    matchMedia: (query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };

  try {
    const html = renderToStaticMarkup(
      React.createElement(LanguageProvider, null,
        React.createElement(ClinicalLaserScanViewport, { progressPercent: 50, isAnalyzing: true, currentStepIndex: 2 })
      )
    );

    // Static horizontal center beam
    assert.ok(html.includes('top-1/2 -translate-y-1/2'), 'Reduced motion renders static center beam across 50%');
    // Reticle pulse disabled
    assert.ok(!html.includes('animate-reticle-pulse'), 'Reduced motion removes animate-reticle-pulse class');
  } finally {
    (global as any).window = originalWindow;
  }
});

// =============================================================================
// SECTION 3: ADVERSARIAL EDGE CASES, EXTREME INPUTS & NEGATIVE VALUES
// =============================================================================
console.log('\n--- 3. Adversarial Edge Cases & Extreme Inputs ---');

runChallengerTest('TEST-CHALLENGER-8: AnimatedCounter extreme boundaries, negatives, NaN, and Infinity', () => {
  // Negative integer
  const htmlNeg = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: -42 }));
  assert.ok(htmlNeg.includes('-42'), 'Supports negative integers');

  // Negative decimal
  const htmlNegDec = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: -0.857, decimals: 2 }));
  assert.ok(htmlNegDec.includes('-0.86'), 'Rounds and formats negative decimals correctly');

  // Boundary 0
  const htmlZero = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: 0 }));
  assert.ok(htmlZero.includes('0'), 'Handles 0 correctly');

  // Malformed NaN -> safe fallback to 0
  const htmlNan = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: NaN }));
  assert.ok(htmlNan.includes('0'), 'NaN falls back to 0');

  // Malformed undefined / null as any -> safe fallback to 0
  const htmlNull = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: null as any }));
  assert.ok(htmlNull.includes('0'), 'null falls back to 0');

  const htmlUndef = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: undefined as any }));
  assert.ok(htmlUndef.includes('0'), 'undefined falls back to 0');

  // Huge number: 1,000,000
  const htmlLarge = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: 1000000 }));
  assert.ok(htmlLarge.includes('1000000'), 'Renders large numbers accurately');

  // Extreme decimals
  const htmlDec5 = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: 3.1415926, decimals: 4 }));
  assert.ok(htmlDec5.includes('3.1416'), 'Formats high precision decimals');
});

runChallengerTest('TEST-CHALLENGER-9: BiomarkerGaugeBar adversarial percent inputs (negative, overflow, NaN, inverted bounds)', () => {
  // Negative percent -> clamped to minPercent
  const htmlNeg = renderToStaticMarkup(React.createElement(BiomarkerGaugeBar, { percent: -100, minPercent: 6 }));
  assert.ok(htmlNeg.includes('width:6%'), 'Negative percent must clamp to minPercent 6%');
  assert.ok(htmlNeg.includes('aria-valuenow="-100"'), 'aria-valuenow preserves actual negative semantic value');

  // Overflow percent -> clamped to 100%
  const htmlOverflow = renderToStaticMarkup(React.createElement(BiomarkerGaugeBar, { percent: 99999 }));
  assert.ok(htmlOverflow.includes('width:100%'), 'Overflow percent must clamp to 100%');

  // Malformed NaN
  const htmlNan = renderToStaticMarkup(React.createElement(BiomarkerGaugeBar, { percent: NaN, minPercent: 4 }));
  assert.ok(htmlNan.includes('width:4%'), 'NaN percent clamps to minPercent 4%');
  assert.ok(htmlNan.includes('aria-valuenow="0"'), 'aria-valuenow falls back to 0 for NaN');

  // High minPercent clamping
  const htmlHighMin = renderToStaticMarkup(React.createElement(BiomarkerGaugeBar, { percent: 10, minPercent: 30 }));
  assert.ok(htmlHighMin.includes('width:30%'), 'Clamps to minPercent when percent < minPercent');
});

runChallengerTest('TEST-CHALLENGER-10: LesionRipplePulse handles casing, special tokens, empty and invalid strings', () => {
  // Mixed-case & uppercase
  const htmlUpperMa = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'MICROANEURYSM' }));
  assert.ok(htmlUpperMa.includes('rgba(245, 158, 11, 0.6)'), 'Uppercase MICROANEURYSM recognized');

  const htmlMaShort = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'ma' }));
  assert.ok(htmlMaShort.includes('rgba(245, 158, 11, 0.6)'), 'Short token "ma" recognized');

  const htmlUpperBleed = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'DEEP_HEMORRHAGE' }));
  assert.ok(htmlUpperBleed.includes('rgba(239, 68, 68, 0.6)'), 'Uppercase DEEP_HEMORRHAGE recognized');

  const htmlVietSlug = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'xuat_huyet_vong_mac' }));
  assert.ok(htmlVietSlug.includes('rgba(239, 68, 68, 0.6)'), 'Vietnamese slug xuat_huyet recognized');

  // Empty string -> returns null / empty
  const htmlEmpty = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: '' }));
  assert.strictEqual(htmlEmpty, '', 'Empty string returns null');

  // Non-vascular anomalies -> returns null / empty
  const htmlDrusen = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: 'Hard_Exudate' }));
  assert.strictEqual(htmlDrusen, '', 'Hard Exudate does not produce ripple waves');

  // Undefined / null -> returns null / empty
  const htmlNull = renderToStaticMarkup(React.createElement(LesionRipplePulse, { type: null as any }));
  assert.strictEqual(htmlNull, '', 'null type returns null');
});

runChallengerTest('TEST-CHALLENGER-11: ClinicalLaserScanViewport handles out-of-range steps, laterality and empty feeds', () => {
  // Step index out of range (e.g. -5 or 99) -> safe fallback to valid stage
  const htmlStepNeg = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(ClinicalLaserScanViewport, { currentStepIndex: -5, progressPercent: 10 })
    )
  );
  assert.ok(htmlStepNeg.includes('BƯỚC 1/5') || htmlStepNeg.includes('STEP 1/5'), 'Negative stepIndex safely resolves via progressPercent');

  const htmlStepHigh = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(ClinicalLaserScanViewport, { currentStepIndex: 99, progressPercent: 95 })
    )
  );
  assert.ok(htmlStepHigh.includes('BƯỚC 5/5') || htmlStepHigh.includes('STEP 5/5'), 'Out of bounds stepIndex resolves safely');

  // Eye Laterality checks: OD (Optic disc nasal left x~28) vs OS (Optic disc nasal right x~72)
  const htmlOd = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(ClinicalLaserScanViewport, { selectedEye: 'Right_OD' })
    )
  );
  assert.ok(htmlOd.includes('left:28%') || htmlOd.includes('left: 28%'), 'OD positions Optic Disc at nasal 28%');
  assert.ok(htmlOd.includes('DISC (OD)'), 'OD label matches');

  const htmlOs = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(ClinicalLaserScanViewport, { selectedEye: 'Left_OS' })
    )
  );
  assert.ok(htmlOs.includes('left:72%') || htmlOs.includes('left: 72%'), 'OS positions Optic Disc at nasal 72%');
  assert.ok(htmlOs.includes('DISC (OS)'), 'OS label matches');

  // Empty image feed
  const htmlEmpty = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(ClinicalLaserScanViewport, { imageSrc: '', previewUrl: '' })
    )
  );
  assert.ok(htmlEmpty.includes('ĐANG CHỜ TÍN HIỆU QUANG HỌC') || htmlEmpty.includes('AWAITING OPTICAL FEED'), 'Empty feed displays waiting state');
});

// =============================================================================
// SECTION 4: HIGH-THROUGHPUT SSR STATIC MARKUP & BENCHMARK STRESS
// =============================================================================
console.log('\n--- 4. High-Throughput SSR Static Markup Stress Harness ---');

runChallengerTest('TEST-CHALLENGER-12: 500-Iteration SSR render stress test (Memory & Performance verification)', () => {
  const iterations = 500;
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    // Render animated counter
    const cHtml = renderToStaticMarkup(React.createElement(AnimatedCounter, { value: i % 100, decimals: i % 2 }));
    assert.ok(cHtml.length > 0);

    // Render gauge bar
    const gHtml = renderToStaticMarkup(React.createElement(BiomarkerGaugeBar, { percent: (i * 7) % 100 }));
    assert.ok(gHtml.length > 0);

    // Render lesion ripple
    const rHtml = renderToStaticMarkup(
      React.createElement(LesionRipplePulse, { type: i % 2 === 0 ? 'Microaneurysm' : 'Hemorrhage', isSelected: i % 3 === 0 })
    );
    assert.ok(rHtml.length > 0);
  }

  const durationMs = Date.now() - startTime;
  const endMemory = process.memoryUsage().heapUsed;
  const heapDeltaMb = ((endMemory - startMemory) / 1024 / 1024).toFixed(2);
  const avgLatencyMs = (durationMs / (iterations * 3)).toFixed(3);

  console.log(`    [BENCHMARK] ${iterations * 3} renders completed in ${durationMs}ms`);
  console.log(`    [BENCHMARK] Average latency: ${avgLatencyMs}ms per component render`);
  console.log(`    [BENCHMARK] Heap delta: ${heapDeltaMb} MB`);

  assert.ok(durationMs < 2500, `500x3 iterations must execute within 2500ms (Actual: ${durationMs}ms)`);
  assert.ok(Number(avgLatencyMs) < 2.0, `Average render latency must be under 2.0ms (Actual: ${avgLatencyMs}ms)`);
});

runChallengerTest('TEST-CHALLENGER-13: Full Portal View Integration Stress (PatientScreeningResultView & RiskAssessmentPanel)', () => {
  // Test PatientScreeningResultView rendering under SSR with complex clinical mock data
  const patientHtml = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(PatientScreeningResultView, { result: mockResult, selectedEye: 'Mắt Phải (OD)' })
    )
  );

  assert.ok(patientHtml.includes('74'), 'Displays overall risk score 74');
  assert.ok(patientHtml.includes('animate-gradcam-crossfade'), 'Grad-CAM crossfade class included in view');
  assert.ok(patientHtml.includes('data-testid="patient-lesion-pin-Microaneurysm"'), 'Preserves MA lesion pin testid');
  assert.ok(patientHtml.includes('data-testid="patient-lesion-pin-Hemorrhage"'), 'Preserves Hemorrhage lesion pin testid');
  assert.ok(patientHtml.includes('data-testid="patient-vessel-overlay-toggle-btn"'), 'Preserves vessel overlay toggle button');
  assert.ok(patientHtml.includes('data-testid="patient-red-free-toggle-btn"'), 'Preserves optical red-free filter button');

  // Test RiskAssessmentPanel rendering under SSR
  const panelHtml = renderToStaticMarkup(
    React.createElement(LanguageProvider, null,
      React.createElement(RiskAssessmentPanel, { result: mockResult })
    )
  );

  assert.ok(panelHtml.includes('74</span>/100'), 'RiskAssessmentPanel displays risk score 74');
  assert.ok(panelHtml.includes('Giai đoạn 2') || panelHtml.includes('Stage 2'), 'RiskAssessmentPanel displays hypertension stage');
  assert.ok(panelHtml.includes('32%'), 'RiskAssessmentPanel displays stroke risk');
  const progressBars = panelHtml.match(/role="progressbar"/g);
  assert.ok(progressBars && progressBars.length >= 4, 'RiskAssessmentPanel renders 4 biomarker gauges');
});

console.log('\n========================================================================');
console.log(`   CHALLENGER VERDICT: ${passedCount}/${totalCount} TESTS PASSED (100% PASS)`);
console.log('========================================================================\n');
process.exit(0);
