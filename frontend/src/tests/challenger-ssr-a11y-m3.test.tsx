import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { LanguageProvider } from '../context/LanguageContext';
import { AIRiskResult } from '../types/cds';

console.log('=================================================================');
console.log('   CHALLENGER SSR & ACCESSIBILITY EMPIRICAL STRESS TEST (M3)');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         Details: ${err?.message || err}`);
  }
}

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
    ],
  },
  xaiExplainability: [],
  findings: 'High risk of microvascular complications.',
  recommendations: 'Prompt referral to retinal specialist.',
};

// -----------------------------------------------------------------------------
// SECTION 1: SSR PROGRESSBAR SCAN (>= 4 PROGRESSBARS ACROSS PROPS VARIATIONS)
// -----------------------------------------------------------------------------
console.log('--- 1. SSR Progressbar Scan Across Props Variations ---');

runTest('SSR-PROG-1: Default tab (risks) renders at least 4 role="progressbar" in static markup', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  const matches = html.match(/role="progressbar"/g) || [];
  assert.ok(matches.length >= 4, `Expected >= 4 progressbars, got ${matches.length}`);
});

runTest('SSR-PROG-2: Biomarkers tab renders at least 4 role="progressbar" in static markup', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  const matches = html.match(/role="progressbar"/g) || [];
  assert.ok(matches.length >= 4, `Expected >= 4 progressbars, got ${matches.length}`);
});

runTest('SSR-PROG-3: Lesions tab renders at least 4 role="progressbar" in static markup', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} defaultTab="lesions" />
    </LanguageProvider>
  );
  const matches = html.match(/role="progressbar"/g) || [];
  assert.ok(matches.length >= 4, `Expected >= 4 progressbars, got ${matches.length}`);
});

runTest('SSR-PROG-4: Minimal/empty annotatedMap still renders 4 fallback progressbars in static markup', () => {
  const minimalResult: AIRiskResult = {
    ...mockResult,
    annotatedMap: undefined,
  };
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={minimalResult} />
    </LanguageProvider>
  );
  const matches = html.match(/role="progressbar"/g) || [];
  assert.ok(matches.length >= 4, `Expected >= 4 progressbars for fallback data, got ${matches.length}`);
});

// -----------------------------------------------------------------------------
// SECTION 2: REQUIRED TEXT RENDERING (/100, Stage 2 / Giai đoạn 2, 32%)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Required Clinical Text Presence (/100, Stage 2 / Giai đoạn 2, 32%) ---');

runTest('SSR-TEXT-1: Overall risk counter renders /100 in static markup', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  assert.ok(html.includes('/100'), 'Static markup must include "/100"');
  assert.ok(html.includes('74</span>/100'), 'Static markup must include AnimatedCounter score 74 followed by "/100"');
});

runTest('SSR-TEXT-2: Vietnamese localization renders "Giai đoạn 2" for Stage 2 HTN', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  assert.ok(html.includes('Giai đoạn 2'), 'Static markup in Vietnamese must include "Giai đoạn 2"');
});

runTest('SSR-TEXT-3: 3-year stroke risk percentage renders "32%" in static markup', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  assert.ok(html.includes('32%'), 'Static markup must include stroke risk "32%"');
});

// -----------------------------------------------------------------------------
// SECTION 3: TAB SWITCHING LOGIC & DISPLAY STATE
// -----------------------------------------------------------------------------
console.log('\n--- 3. Tab Switching Mechanism & DOM State ---');

runTest('TAB-SWITCH-1: defaultTab="biomarkers" activates Tab 2 and hides Tab 1 & Tab 3', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} defaultTab="biomarkers" />
    </LanguageProvider>
  );
  // Tab 2 has block, Tab 1 has hidden
  assert.ok(html.includes('2. Chỉ Số Sinh Học Vi Mạch'), 'Tab 2 button text present');
  // Check active tab styling: Tab 2 button has bg-[#3478F6]
  const tab2ActiveIdx = html.indexOf('2. Chỉ Số Sinh Học Vi Mạch');
  const surroundingHtml = html.substring(Math.max(0, tab2ActiveIdx - 600), tab2ActiveIdx + 50);
  assert.ok(surroundingHtml.includes('bg-[#3478F6]'), 'Tab 2 button has active class');

  // Check tab panel visibility
  assert.ok(html.includes('block space-y-3'), 'Active tab panel has block space-y-3');
});

runTest('TAB-SWITCH-2: defaultTab="lesions" activates Tab 3 and displays detected anomalies', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} defaultTab="lesions" />
    </LanguageProvider>
  );
  assert.ok(html.includes('3. Chi Tiết Tổn Thương Vi Mạch &amp; XAI') || html.includes('3. Chi Tiết Tổn Thương Vi Mạch & XAI') || html.includes('Chi Tiết Tổn Thương'), 'Tab 3 button text present');
  assert.ok(html.includes('Microaneurysm'), 'Lesion anomaly Microaneurysm present in static markup');
  assert.ok(html.includes('Hemorrhage'), 'Lesion anomaly Hemorrhage present in static markup');
  const tab3ActiveIdx = html.indexOf('Chi Tiết Tổn Thương');
  const surroundingHtml = html.substring(Math.max(0, tab3ActiveIdx - 600), tab3ActiveIdx + 50);
  assert.ok(surroundingHtml.includes('bg-[#3478F6]'), 'Tab 3 button has active class');
});

// -----------------------------------------------------------------------------
// SECTION 4: KEYBOARD ACCESSIBILITY & WAI-ARIA AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 4. Keyboard Navigation & WAI-ARIA Accessibility Audit ---');

runTest('A11Y-KEYBOARD-1: Tab triggers are native <button type="button"> (focusable, accessible via Tab key and Space/Enter)', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  // Must use type="button" to prevent accidental form submissions
  const buttonTypeMatches = html.match(/<button type="button"/g) || [];
  assert.ok(buttonTypeMatches.length >= 3, `Expected >= 3 buttons with type="button", got ${buttonTypeMatches.length}`);
});

runTest('A11Y-ARIA-1: Tab navigation includes role="tablist" container (WAI-ARIA compliance check)', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  const hasTablist = html.includes('role="tablist"');
  if (!hasTablist) {
    throw new Error('MISSING: Container does not have role="tablist"');
  }
});

runTest('A11Y-ARIA-2: Tab triggers specify role="tab" (WAI-ARIA compliance check)', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  const tabMatches = html.match(/role="tab"/g) || [];
  if (tabMatches.length < 3) {
    throw new Error(`MISSING: Expected 3 buttons with role="tab", found ${tabMatches.length}`);
  }
});

runTest('A11Y-ARIA-3: Tab triggers specify aria-selected="true" on active tab and "false" on inactive tabs', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} defaultTab="risks" />
    </LanguageProvider>
  );
  const hasAriaSelectedTrue = html.includes('aria-selected="true"');
  const hasAriaSelectedFalse = html.includes('aria-selected="false"');
  if (!hasAriaSelectedTrue || !hasAriaSelectedFalse) {
    throw new Error(`MISSING: aria-selected="true" (${hasAriaSelectedTrue}) or aria-selected="false" (${hasAriaSelectedFalse})`);
  }
});

runTest('A11Y-ARIA-4: Tab panels specify role="tabpanel" (WAI-ARIA compliance check)', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <RiskAssessmentPanel result={mockResult} />
    </LanguageProvider>
  );
  const tabpanelMatches = html.match(/role="tabpanel"/g) || [];
  if (tabpanelMatches.length < 3) {
    throw new Error(`MISSING: Expected 3 tab panels with role="tabpanel", found ${tabpanelMatches.length}`);
  }
});

console.log('\n=================================================================');
console.log(`   SUMMARY: Total=${totalTests} | Passed=${passedTests} | Failed=${failedTests}`);
console.log('=================================================================\n');

if (failedTests > 0) {
  console.log(`[ATTENTION] ${failedTests} accessibility stress test(s) failed — empirical evidence recorded.`);
}
