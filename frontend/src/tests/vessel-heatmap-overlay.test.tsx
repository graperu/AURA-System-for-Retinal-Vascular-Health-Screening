import assert from 'assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  VesselHeatmapOverlay,
  getAnomalyBoundingBoxLabel,
} from '../components/VesselHeatmapOverlay';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { LanguageProvider } from '../context/LanguageContext';
import { AIRiskResult } from '../types/cds';

console.log('=================================================================');
console.log('   AURA AI DIAGNOSTIC MULTI-LAYER OVERLAY TEST SUITE');
console.log('=================================================================');

const mockAnalysisResult: AIRiskResult = {
  analysisId: 'test-analysis-vessel-overlay-001',
  imageUrl: '/assets/images/fundus_sample_od.png',
  status: 'COMPLETED',
  executionTimeMs: 420,
  overallVascularRiskScore: 68,
  riskScore: 68,
  cardiovascularRisk: {
    level: 'Moderate',
    score: 65,
    hypertensionStage: 'Stage 1 HTN',
    threeYearStrokeRiskPercent: 32,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 72,
    etdrsGrade: 'MODERATE NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 18,
  },
  annotatedMap: {
    arteryVeinRatio: 0.65,
    vesselDensityPercentage: 42.5,
    tortuosityIndex: 1.18,
    opticCupToDiscRatio: 0.35,
    detectedAnomalies: [
      {
        id: 'anom-ma-1',
        type: 'Microaneurysm',
        coordinates: { x: 58, y: 46, width: 28, height: 28 },
        confidence: 0.94,
        description: 'Microaneurysm located in superior temporal quadrant',
      },
      {
        id: 'anom-bleed-1',
        type: 'Hemorrhage',
        coordinates: { x: 62, y: 64, width: 34, height: 34 },
        confidence: 0.91,
        description: 'Deep micro-hemorrhage near inferior arcade',
      },
      {
        id: 'anom-exudate-1',
        type: 'Hard_Exudate',
        coordinates: { x: 68, y: 50, width: 30, height: 30 },
        confidence: 0.88,
        description: 'Hard circinate lipid exudates cluster',
      },
    ],
  },
  xaiExplainability: [],
};

// -----------------------------------------------------------------------------
// SECTION 1: CLASSIFICATION LABELS FOR BOUNDING BOXES
// -----------------------------------------------------------------------------
console.log('\n--- 1. Bounding Box Classification Labels ---');

const maMeta = getAnomalyBoundingBoxLabel('Microaneurysm');
assert.strictEqual(maMeta.label, 'MA Detected', 'Microaneurysm maps to "MA Detected"');
assert.strictEqual(maMeta.borderColor, '#F59E0B', 'Border is gold #F59E0B');

const bleedMeta = getAnomalyBoundingBoxLabel('Hemorrhage');
assert.strictEqual(bleedMeta.label, 'Micro-Bleed', 'Hemorrhage maps to "Micro-Bleed"');
assert.strictEqual(bleedMeta.borderColor, '#F59E0B', 'Border is gold #F59E0B');

const exudateMeta = getAnomalyBoundingBoxLabel('Hard_Exudate');
assert.strictEqual(exudateMeta.label, 'Exudate', 'Hard_Exudate maps to "Exudate"');
assert.strictEqual(exudateMeta.borderColor, '#F59E0B', 'Border is gold #F59E0B');

console.log('  [PASS] OVERLAY-1: getAnomalyBoundingBoxLabel maps MA, Micro-Bleed, and Exudate correctly with #F59E0B border');

// -----------------------------------------------------------------------------
// SECTION 2: HUD CLINICAL DIAGNOSTIC HEADER LABELS
// -----------------------------------------------------------------------------
console.log('\n--- 2. HUD Clinical Diagnostic Header ---');

const overlayHtmlOD = renderToStaticMarkup(
  <LanguageProvider>
    <VesselHeatmapOverlay
      imageUrl="/assets/images/fundus_sample_od.png"
      selectedEye="OD"
      drStatus="MODERATE NPDR"
      avRatio={0.65}
      riskScore={68}
      anomalies={mockAnalysisResult.annotatedMap.detectedAnomalies}
    />
  </LanguageProvider>
);

assert.ok(overlayHtmlOD.includes('AI DIAGNOSTIC OVERLAY'), 'Includes "AI DIAGNOSTIC OVERLAY" HUD badge');
assert.ok(overlayHtmlOD.includes('SCAN:'), 'Includes "SCAN:" indicator');
assert.ok(overlayHtmlOD.includes('OD'), 'Shows OD scan eye');
assert.ok(overlayHtmlOD.includes('DR STATUS:'), 'Includes "DR STATUS:" indicator');
assert.ok(overlayHtmlOD.includes('MODERATE NPDR'), 'Shows MODERATE NPDR status');
assert.ok(overlayHtmlOD.includes('A/V RATIO:'), 'Includes "A/V RATIO:" indicator');
assert.ok(overlayHtmlOD.includes('0.65'), 'Shows A/V ratio value 0.65');

console.log('  [PASS] OVERLAY-2: VesselHeatmapOverlay renders all 4 required clinical header labels (AI DIAGNOSTIC OVERLAY, SCAN: OD/OS, DR STATUS, A/V RATIO: 0.65)');

// -----------------------------------------------------------------------------
// SECTION 3: MULTI-LAYER STACK (VESSEL, HEATMAP, BOUNDING BOXES)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Multi-Layer Visual Elements (Vessel, Heatmap, Boxes) ---');

// Layer 1: Vessel Segmentation Neon Green
assert.ok(
  overlayHtmlOD.includes('#00FF66') || overlayHtmlOD.includes('#10B981'),
  'Layer 1 contains Neon Green #00FF66 / #10B981 vessel paths'
);
assert.ok(
  overlayHtmlOD.includes('Vessel Segmentation'),
  'Layer 1 control contains "Vessel Segmentation" toggle'
);

// Layer 2: Risk Heatmap Radial Gradient Gaussian Blur
assert.ok(
  overlayHtmlOD.includes('feGaussianBlur') || overlayHtmlOD.includes('aura-heatmap-gaussian-blur'),
  'Layer 2 utilizes Gaussian Blur filter'
);
assert.ok(
  overlayHtmlOD.includes('#EF4444') || overlayHtmlOD.includes('#F59E0B'),
  'Layer 2 contains Red/Yellow/Orange risk gradient'
);

// Layer 3: Bounding Boxes with #F59E0B and Clinical Labels
assert.ok(
  overlayHtmlOD.includes('MA Detected'),
  'Layer 3 renders "MA Detected" label'
);
assert.ok(
  overlayHtmlOD.includes('Micro-Bleed'),
  'Layer 3 renders "Micro-Bleed" label'
);
assert.ok(
  overlayHtmlOD.includes('Exudate'),
  'Layer 3 renders "Exudate" label'
);
assert.ok(
  overlayHtmlOD.includes('#F59E0B'),
  'Bounding boxes use yellow/gold #F59E0B border'
);

console.log('  [PASS] OVERLAY-3: Multi-layer elements render properly (Vessel #00FF66, Heatmap Gaussian blur, Bounding Box #F59E0B with MA/Bleed/Exudate labels)');

// -----------------------------------------------------------------------------
// SECTION 4: OVERLAY CONTROL PANEL (4 INDEPENDENT TOGGLES)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Overlay Control Panel ---');

assert.ok(
  overlayHtmlOD.includes('OVERLAY CONTROLS'),
  'Control panel header is present'
);
assert.ok(
  overlayHtmlOD.includes('Vessel Segmentation'),
  'Toggle 1: Vessel Segmentation switch present'
);
assert.ok(
  overlayHtmlOD.includes('Risk Heatmap'),
  'Toggle 2: Risk Heatmap switch present'
);
assert.ok(
  overlayHtmlOD.includes('MA &amp; Bleed Detection') || overlayHtmlOD.includes('MA & Bleed Detection'),
  'Toggle 3: MA & Bleed Detection switch present'
);
assert.ok(
  overlayHtmlOD.includes('Invert Optical Contrast'),
  'Toggle 4: Invert Colors / Optical Contrast switch present'
);

console.log('  [PASS] OVERLAY-4: Control panel contains all 4 independent toggles (Vessel, Heatmap, Bounding Boxes, Invert Colors)');

// -----------------------------------------------------------------------------
// SECTION 5: INTEGRATION WITH INTERACTIVE CDS VIEWER
// -----------------------------------------------------------------------------
console.log('\n--- 5. Integration with InteractiveCDSViewer ---');

const cdsHtml = renderToStaticMarkup(
  <LanguageProvider>
    <InteractiveCDSViewer analysisResult={mockAnalysisResult} selectedEye="OD" />
  </LanguageProvider>
);

assert.ok(
  cdsHtml.includes('data-testid="cds-ai-diagnostic-toggle-btn"'),
  'InteractiveCDSViewer toolbar provides "Chuyên sâu AI / AI Diagnostic" toggle button'
);
assert.ok(
  cdsHtml.includes('Chuyên sâu AI') || cdsHtml.includes('AI Diagnostic'),
  'InteractiveCDSViewer displays AI Diagnostic button text'
);

console.log('  [PASS] OVERLAY-5: InteractiveCDSViewer successfully integrates AI Diagnostic Multi-Layer Overlay mode');

// -----------------------------------------------------------------------------
// SECTION 6: OS EYE ANATOMICAL CONFORMATION
// -----------------------------------------------------------------------------
console.log('\n--- 6. Left Eye (OS) Anatomical Conformation ---');

const overlayHtmlOS = renderToStaticMarkup(
  <LanguageProvider>
    <VesselHeatmapOverlay
      imageUrl="/assets/images/fundus_sample_os.png"
      selectedEye="OS"
      drStatus="SEVERE NPDR"
      avRatio={0.58}
      riskScore={82}
    />
  </LanguageProvider>
);

assert.ok(overlayHtmlOS.includes('OS (LEFT EYE)'), 'OS eye properly detected and labeled');
assert.ok(overlayHtmlOS.includes('SEVERE NPDR'), 'Severe NPDR status properly displayed');
assert.ok(overlayHtmlOS.includes('0.58'), 'A/V ratio 0.58 displayed');
assert.ok(overlayHtmlOS.includes('(Narrowed)'), 'A/V ratio constriction flagged');

console.log('  [PASS] OVERLAY-6: Left Eye (OS) anatomical conformation and metrics verified');

console.log('\n=================================================================');
console.log('   KẾT QUẢ KIỂM THỬ: 6/6 TESTS ĐÃ ĐẠT (100% PASS)');
console.log('=================================================================');
process.exit(0);
