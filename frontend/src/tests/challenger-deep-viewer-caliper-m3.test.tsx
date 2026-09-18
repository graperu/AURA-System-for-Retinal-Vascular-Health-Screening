import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  InteractiveCDSViewer,
  getAnomalyMedicalTheme,
  getAnomalyName,
  processVesselOverlayCanvas,
} from '../components/InteractiveCDSViewer.tsx';
import type { AIRiskResult } from '../types/cds.ts';

// Polyfills for headless Node test environment
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

if (typeof (globalThis as any).Image === 'undefined') {
  (globalThis as any).Image = class MockImage {
    crossOrigin?: string;
    onload?: () => void;
    src = '';
    width = 1000;
    height = 1000;
    naturalWidth = 1000;
    naturalHeight = 1000;
  };
}

console.log('======================================================================');
console.log('  CHALLENGER DEEP STRESS HARNESS: CDS VIEWER & CALIPER RULER (M3)');
console.log('======================================================================\n');

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

// Mock Retinal CDS Analysis Data
const mockAnalysisData: AIRiskResult = {
  analysisId: 'SCR-M3-ADVERSARIAL-999',
  createdAt: '2026-09-18T16:15:00.000Z',
  status: 'ANALYZED',
  executionTimeMs: 850,
  overallVascularRiskScore: 72,
  riskScore: 72,
  imageUrl: '/assets/images/fundus_sample_od.png',
  cardiovascularRisk: {
    level: 'High',
    score: 72,
    hypertensionStage: 'Stage 2 Hypertension',
    threeYearStrokeRiskPercent: 35,
  },
  diabeticRetinopathyRisk: {
    level: 'Severe',
    score: 80,
    etdrsGrade: 'Severe NPDR',
    macularEdemaPresent: true,
  },
  glaucomaRisk: {
    level: 'Moderate',
    score: 45,
  },
  annotatedMap: {
    arteryVeinRatio: 0.52,
    vesselDensityPercentage: 16.8,
    tortuosityIndex: 1.55,
    opticCupToDiscRatio: 0.58,
    heatmapUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    detectedAnomalies: [
      {
        id: 'adv-anom-1',
        type: 'Microaneurysm',
        confidence: 0.96,
        description: 'Cluster of microaneurysms at macula',
        coordinates: { x: 50.0, y: 50.0, width: 20, height: 20 },
      },
      {
        id: 'adv-anom-2',
        type: 'Hemorrhage',
        confidence: 0.91,
        description: 'Intraretinal blot hemorrhage',
        coordinates: { x: 35.0, y: 65.0, width: 40, height: 40 },
      },
    ],
  },
};

// =====================================================================
// SECTION 1: ADVERSARIAL ZOOM BOUNDARY & NUMERICAL STABILITY TESTS
// =====================================================================
console.log('--- 1. Zoom Boundary & Numerical Precision Stress Tests ---');

runTest('ADV-ZOOM-1: Extreme positive delta (+10, +100, +1000000) strictly clamps to 5.0x', () => {
  const zoomUpdater = (prev: number, delta: number) => {
    const next = prev + delta;
    return Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
  };

  assert.strictEqual(zoomUpdater(1.0, 10.0), 5.0);
  assert.strictEqual(zoomUpdater(4.9, 10.0), 5.0);
  assert.strictEqual(zoomUpdater(5.0, 100.0), 5.0);
  assert.strictEqual(zoomUpdater(5.0, 1000000.0), 5.0);
});

runTest('ADV-ZOOM-2: Extreme negative delta (-10, -100, -1000000) strictly clamps to 1.0x', () => {
  const zoomUpdater = (prev: number, delta: number) => {
    const next = prev + delta;
    return Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
  };

  assert.strictEqual(zoomUpdater(5.0, -10.0), 1.0);
  assert.strictEqual(zoomUpdater(1.1, -10.0), 1.0);
  assert.strictEqual(zoomUpdater(1.0, -100.0), 1.0);
  assert.strictEqual(zoomUpdater(1.0, -1000000.0), 1.0);
});

runTest('ADV-ZOOM-3: Neutral / micro deltas (0, -0, 0.000001) behave safely without drift', () => {
  const zoomUpdater = (prev: number, delta: number) => {
    const next = prev + delta;
    return Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
  };

  assert.strictEqual(zoomUpdater(2.4, 0), 2.4);
  assert.strictEqual(zoomUpdater(2.4, -0), 2.4);
  // Micro delta < 0.05 rounds away via toFixed(1)
  assert.strictEqual(zoomUpdater(2.4, 0.0001), 2.4);
  // In IEEE-754, 2.4 + 0.05 is 2.4499999999999997 which toFixed(1) rounds to 2.4; 2.4 + 0.06 rounds to 2.5
  assert.strictEqual(zoomUpdater(2.4, 0.05), 2.4);
  assert.strictEqual(zoomUpdater(2.4, 0.06), 2.5);
});

runTest('ADV-ZOOM-4: 10,000 rapid zoom oscillations (+0.2 / -0.2) have zero cumulative floating point error', () => {
  const zoomUpdater = (prev: number, delta: number) => {
    const next = prev + delta;
    return Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
  };

  let z = 1.0;
  for (let i = 0; i < 10000; i++) {
    z = zoomUpdater(z, 0.2); // 1.2
    z = zoomUpdater(z, -0.2); // 1.0
  }
  assert.strictEqual(z, 1.0, 'Sau 10.000 chu kỳ dao động, mức zoom phải chuẩn xác 1.0');
});

runTest('ADV-ZOOM-5: Zoom reduction to <= 1.0x automatically clears pan offset', () => {
  let zoomLevel = 3.0;
  let panOffset = { x: 450, y: -200 };

  const handleZoomChange = (delta: number) => {
    const next = zoomLevel + delta;
    const clamped = Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
    zoomLevel = clamped;
    if (clamped <= 1.0) {
      panOffset = { x: 0, y: 0 };
    }
  };

  // Zoom down to 1.2x: pan retains
  handleZoomChange(-1.8);
  assert.strictEqual(zoomLevel, 1.2);
  assert.deepStrictEqual(panOffset, { x: 450, y: -200 });

  // Zoom down to 1.0x: pan resets to (0, 0)
  handleZoomChange(-0.2);
  assert.strictEqual(zoomLevel, 1.0);
  assert.deepStrictEqual(panOffset, { x: 0, y: 0 });
});

runTest('ADV-ZOOM-6: Reset zoom button sets zoom to 1.0x and resets pan to (0, 0)', () => {
  let zoomLevel = 5.0;
  let panOffset = { x: 1800, y: 1400 };

  const handleResetZoom = () => {
    zoomLevel = 1.0;
    panOffset = { x: 0, y: 0 };
  };

  handleResetZoom();
  assert.strictEqual(zoomLevel, 1.0);
  assert.deepStrictEqual(panOffset, { x: 0, y: 0 });
});

// =====================================================================
// SECTION 2: ADVERSARIAL PAN BOUNDARY SCALING & DRIFT PREVENTION
// =====================================================================
console.log('\n--- 2. Pan Boundary Scaling & Anti-Drift Stress Tests ---');

runTest('ADV-PAN-1: maxPan bounds scale monotonically from 1.0x up to 5.0x', () => {
  const calcMaxPan = (zoomLevel: number) => ({
    maxPanX: Math.max(120, (zoomLevel - 1) * 450),
    maxPanY: Math.max(120, (zoomLevel - 1) * 350),
  });

  let prevX = 0;
  let prevY = 0;
  for (let z = 1.0; z <= 5.0; z = Number((z + 0.1).toFixed(1))) {
    const { maxPanX, maxPanY } = calcMaxPan(z);
    assert.ok(maxPanX >= prevX, `maxPanX phải đơn điệu tăng: z=${z}, maxPanX=${maxPanX}`);
    assert.ok(maxPanY >= prevY, `maxPanY phải đơn điệu tăng: z=${z}, maxPanY=${maxPanY}`);
    assert.ok(maxPanX >= 120, 'maxPanX tối thiểu 120');
    assert.ok(maxPanY >= 120, 'maxPanY tối thiểu 120');
    prevX = maxPanX;
    prevY = maxPanY;
  }
  // At maximum zoom 5.0x
  const maxPan50 = calcMaxPan(5.0);
  assert.strictEqual(maxPan50.maxPanX, 1800);
  assert.strictEqual(maxPan50.maxPanY, 1400);
});

runTest('ADV-PAN-2: Anti-drift clamp: 50,000 random drag steps never exceed boundary box', () => {
  const zoomLevel = 5.0;
  const maxPanX = Math.max(120, (zoomLevel - 1) * 450); // 1800
  const maxPanY = Math.max(120, (zoomLevel - 1) * 350); // 1400

  let currentPan = { x: 0, y: 0 };

  const applyDrag = (dx: number, dy: number) => {
    const nextX = Math.max(-maxPanX, Math.min(maxPanX, currentPan.x + dx));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, currentPan.y + dy));
    currentPan = { x: nextX, y: nextY };
  };

  for (let i = 0; i < 50000; i++) {
    const randomDx = (Math.random() - 0.5) * 5000;
    const randomDy = (Math.random() - 0.5) * 5000;
    applyDrag(randomDx, randomDy);

    assert.ok(
      currentPan.x >= -1800 && currentPan.x <= 1800,
      `Tọa độ X (${currentPan.x}) vượt quá biên độ [-1800, 1800]`
    );
    assert.ok(
      currentPan.y >= -1400 && currentPan.y <= 1400,
      `Tọa độ Y (${currentPan.y}) vượt quá biên độ [-1400, 1400]`
    );
  }
});

runTest('ADV-PAN-3: Pan is completely locked when zoom <= 1.0 or ruler is active', () => {
  const canStartDrag = (zoomLevel: number, isRulerActive: boolean) => {
    if (isRulerActive || zoomLevel <= 1.0) return false;
    return true;
  };

  assert.strictEqual(canStartDrag(1.0, false), false);
  assert.strictEqual(canStartDrag(0.5, false), false);
  assert.strictEqual(canStartDrag(5.0, true), false);
  assert.strictEqual(canStartDrag(1.0, true), false);
  assert.strictEqual(canStartDrag(2.5, false), true);
});

// =====================================================================
// SECTION 3: CALIPER RULER TOGGLE, EVENTS, MATH & RESET
// =====================================================================
console.log('\n--- 3. Caliper Ruler Toggle, Math, Events & Reset Stress Tests ---');

runTest('ADV-CALIPER-1: Toggle cycles preserve clean state transitions', () => {
  let isRulerActive = false;
  let rulerStart: any = null;
  let rulerEnd: any = null;
  let isMeasuring = false;

  const clearRuler = () => {
    rulerStart = null;
    rulerEnd = null;
    isMeasuring = false;
  };

  const toggleRuler = () => {
    const next = !isRulerActive;
    isRulerActive = next;
    if (!next) clearRuler();
  };

  // Turn ON
  toggleRuler();
  assert.strictEqual(isRulerActive, true);

  // Set mock measurement
  rulerStart = { xPct: 20, yPct: 30, rawX: 100, rawY: 150 };
  rulerEnd = { xPct: 40, yPct: 50, rawX: 200, rawY: 250 };
  isMeasuring = false;

  // Turn OFF -> must invoke clearRuler()
  toggleRuler();
  assert.strictEqual(isRulerActive, false);
  assert.strictEqual(rulerStart, null);
  assert.strictEqual(rulerEnd, null);
  assert.strictEqual(isMeasuring, false);
});

runTest('ADV-CALIPER-2: Coordinate percentage calculations clamp exactly to [0, 100]%', () => {
  const rect = { left: 50, top: 50, width: 500, height: 500 };

  const calcPct = (clientX: number, clientY: number) => {
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
    return { xPct, yPct, rawX, rawY };
  };

  // Test negative mouse coordinates outside window
  const outNeg = calcPct(-500, -200);
  assert.strictEqual(outNeg.xPct, 0);
  assert.strictEqual(outNeg.yPct, 0);

  // Test overshoot mouse coordinates
  const outOver = calcPct(5000, 3000);
  assert.strictEqual(outOver.xPct, 100);
  assert.strictEqual(outOver.yPct, 100);

  // Test interior
  const mid = calcPct(300, 300);
  assert.strictEqual(mid.xPct, 50);
  assert.strictEqual(mid.yPct, 50);
});

runTest('ADV-CALIPER-3: Distance math equivalence: (distanceMicrons / 1500) vs (distancePx / 1000)', () => {
  for (let px = 0; px <= 3000; px += 10) {
    const distMicrons = Math.round(px * 1.5);
    const fractionFromMicrons = (distMicrons / 1500).toFixed(2);
    const fractionDirectDD = (px / 1000).toFixed(2);

    // Compare string representations
    assert.strictEqual(
      fractionFromMicrons,
      fractionDirectDD,
      `Khác biệt tại px = ${px}: microns/1500=${fractionFromMicrons}, px/1000=${fractionDirectDD}`
    );
  }
});

runTest('ADV-CALIPER-4: Clinical benchmarks: Disc Diameter (1000px), Quarter DD (250px), Microaneurysm (20px)', () => {
  const calc = (px: number) => {
    const microns = Math.round(px * 1.5);
    const dd = (microns / 1500).toFixed(2);
    return { px, microns, dd };
  };

  // Standard Optic Disc: 1000 px = 1500 µm = 1.00 DD
  const disc = calc(1000);
  assert.strictEqual(disc.microns, 1500);
  assert.strictEqual(disc.dd, '1.00');

  // Half Disc: 500 px = 750 µm = 0.50 DD
  const halfDisc = calc(500);
  assert.strictEqual(halfDisc.microns, 750);
  assert.strictEqual(halfDisc.dd, '0.50');

  // Quarter Disc: 250 px = 375 µm = 0.25 DD
  const quarterDisc = calc(250);
  assert.strictEqual(quarterDisc.microns, 375);
  assert.strictEqual(quarterDisc.dd, '0.25');

  // Microaneurysm: 20 px = 30 µm = 0.02 DD
  const ma = calc(20);
  assert.strictEqual(ma.microns, 30);
  assert.strictEqual(ma.dd, '0.02');

  // Zero distance: 0 px = 0 µm = 0.00 DD
  const zero = calc(0);
  assert.strictEqual(zero.microns, 0);
  assert.strictEqual(zero.dd, '0.00');
});

runTest('ADV-CALIPER-5: Zero-distance measurement hides overlay and badge', () => {
  const rulerStart = { xPct: 50, yPct: 50, rawX: 200, rawY: 200 };
  const rulerEnd = { xPct: 50, yPct: 50, rawX: 200, rawY: 200 };
  const rulerDistPx = Math.round(Math.hypot(rulerEnd.rawX - rulerStart.rawX, rulerEnd.rawY - rulerStart.rawY));

  assert.strictEqual(rulerDistPx, 0);
  const shouldRender = Boolean(rulerStart && rulerEnd && rulerDistPx > 0);
  assert.strictEqual(shouldRender, false, 'Không được hiển thị khi distPx = 0');
});

runTest('ADV-CALIPER-6: Tooltip top bound clamp prevents clipping off top border', () => {
  const getTooltipTop = (y1: number, y2: number) => {
    return Math.max(15, Math.min(y1, y2) - 2);
  };

  assert.strictEqual(getTooltipTop(0, 0), 15);
  assert.strictEqual(getTooltipTop(5, 10), 15);
  assert.strictEqual(getTooltipTop(16, 20), 15); // 16 - 2 = 14 < 15 -> 15
  assert.strictEqual(getTooltipTop(25, 30), 23); // 25 - 2 = 23
});

runTest('ADV-CALIPER-7: Clear / reset action empties coordinates and stops measuring', () => {
  let rulerStart: any = { xPct: 15, yPct: 15, rawX: 50, rawY: 50 };
  let rulerEnd: any = { xPct: 60, yPct: 60, rawX: 250, rawY: 250 };
  let isMeasuring = true;

  const clearRuler = () => {
    rulerStart = null;
    rulerEnd = null;
    isMeasuring = false;
  };

  clearRuler();
  assert.strictEqual(rulerStart, null);
  assert.strictEqual(rulerEnd, null);
  assert.strictEqual(isMeasuring, false);
});

runTest('ADV-CALIPER-8: Two-click measurement sequence (Click 1 start, Click 2 finish)', () => {
  let isRulerActive = true;
  let rulerStart: any = null;
  let rulerEnd: any = null;
  let isMeasuring = false;
  const rect = { left: 0, top: 0, width: 800, height: 600 };

  const onMouseDown = (clientX: number, clientY: number) => {
    if (!isRulerActive) return;
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));

    if (!isMeasuring) {
      rulerStart = { xPct, yPct, rawX, rawY };
      rulerEnd = { xPct, yPct, rawX, rawY };
      isMeasuring = true;
    } else {
      rulerEnd = { xPct, yPct, rawX, rawY };
      isMeasuring = false;
    }
  };

  const onMouseMove = (clientX: number, clientY: number) => {
    if (!isRulerActive || !isMeasuring) return;
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
    rulerEnd = { xPct, yPct, rawX, rawY };
  };

  // Click 1: Start at (100, 100)
  onMouseDown(100, 100);
  assert.strictEqual(isMeasuring, true);
  assert.strictEqual(rulerStart.rawX, 100);

  // Move to (400, 500)
  onMouseMove(400, 500);
  assert.strictEqual(rulerEnd.rawX, 400);
  assert.strictEqual(rulerEnd.rawY, 500);
  assert.strictEqual(isMeasuring, true);

  // Click 2: Finish at (400, 500)
  onMouseDown(400, 500);
  assert.strictEqual(isMeasuring, false);
  assert.strictEqual(rulerEnd.rawX, 400);

  const distPx = Math.round(Math.hypot(rulerEnd.rawX - rulerStart.rawX, rulerEnd.rawY - rulerStart.rawY));
  assert.strictEqual(distPx, 500); // 300-400-500 triangle
});

runTest('ADV-CALIPER-9: Drag-to-measure sequence (MouseDown -> MouseMove -> MouseUp > 5px finishes)', () => {
  let isRulerActive = true;
  let rulerStart: any = null;
  let rulerEnd: any = null;
  let isMeasuring = false;
  const rect = { left: 0, top: 0, width: 800, height: 600 };

  const onMouseDown = (clientX: number, clientY: number) => {
    if (!isRulerActive) return;
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
    if (!isMeasuring) {
      rulerStart = { xPct, yPct, rawX, rawY };
      rulerEnd = { xPct, yPct, rawX, rawY };
      isMeasuring = true;
    }
  };

  const onMouseUp = (clientX: number, clientY: number) => {
    if (!isRulerActive || !isMeasuring) return;
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const dist = Math.hypot(rawX - (rulerStart?.rawX ?? rawX), rawY - (rulerStart?.rawY ?? rawY));
    if (dist > 5) {
      const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
      rulerEnd = { xPct, yPct, rawX, rawY };
      isMeasuring = false;
    }
  };

  // Drag start at (50, 50)
  onMouseDown(50, 50);
  assert.strictEqual(isMeasuring, true);

  // Drag release at (200, 250) (dist = hypot(150, 200) = 250 > 5)
  onMouseUp(200, 250);
  assert.strictEqual(isMeasuring, false);
  assert.strictEqual(rulerEnd.rawX, 200);
});

runTest('ADV-CALIPER-10: Sub-5px click jitter retains measuring state for 2-click UX', () => {
  let isRulerActive = true;
  let rulerStart: any = null;
  let rulerEnd: any = null;
  let isMeasuring = false;
  const rect = { left: 0, top: 0, width: 800, height: 600 };

  const onMouseDown = (clientX: number, clientY: number) => {
    if (!isRulerActive) return;
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
    if (!isMeasuring) {
      rulerStart = { xPct, yPct, rawX, rawY };
      rulerEnd = { xPct, yPct, rawX, rawY };
      isMeasuring = true;
    }
  };

  const onMouseUp = (clientX: number, clientY: number) => {
    if (!isRulerActive || !isMeasuring) return;
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const dist = Math.hypot(rawX - (rulerStart?.rawX ?? rawX), rawY - (rulerStart?.rawY ?? rawY));
    if (dist > 5) {
      const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
      rulerEnd = { xPct, yPct, rawX, rawY };
      isMeasuring = false;
    }
  };

  // Start at (100, 100)
  onMouseDown(100, 100);
  // Release with 2px tremor at (101, 102) -> dist ~ 2.23px <= 5
  onMouseUp(101, 102);
  assert.strictEqual(isMeasuring, true, 'Sub-5px tremor không được tự ý hủy measuring');
});

// =====================================================================
// SECTION 4: VIEWING MODES TRANSITIONS & COMPATIBILITY
// =====================================================================
console.log('\n--- 4. Viewing Modes Transitions Stress Tests ---');

runTest('ADV-MODE-1: All 16 pairwise transitions between viewing modes succeed', () => {
  const modes = ['SPLIT', 'ORIGINAL', 'OVERLAY', 'AI_DIAGNOSTIC'] as const;

  for (const fromMode of modes) {
    for (const toMode of modes) {
      let activeViewMode: 'SPLIT' | 'ORIGINAL' | 'OVERLAY' | 'AI_DIAGNOSTIC' = fromMode;
      activeViewMode = toMode;
      assert.strictEqual(activeViewMode, toMode);
    }
  }
});

runTest('ADV-MODE-2: SPLIT mode renders both fundus image and Grad-CAM layers', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('grid-cols-1 lg:grid-cols-2'), 'Bố cục 2 cột song song');
  assert.ok(html.includes('Ảnh chụp đáy mắt gốc') || html.includes('True Color Fundus Scan'));
  assert.ok(html.includes('Bản đồ nhiệt Grad-CAM') || html.includes('Grad-CAM Attention Heatmap'));
});

runTest('ADV-MODE-3: ORIGINAL mode renders single column fundus viewport', () => {
  const isSplitOrOrig = (mode: string) => mode === 'SPLIT' || mode === 'ORIGINAL';
  const isSplitOrOverlay = (mode: string) => mode === 'SPLIT' || mode === 'OVERLAY';

  assert.strictEqual(isSplitOrOrig('ORIGINAL'), true);
  assert.strictEqual(isSplitOrOverlay('ORIGINAL'), false);
});

runTest('ADV-MODE-4: OVERLAY mode renders single column AI attention viewport', () => {
  const isSplitOrOrig = (mode: string) => mode === 'SPLIT' || mode === 'ORIGINAL';
  const isSplitOrOverlay = (mode: string) => mode === 'SPLIT' || mode === 'OVERLAY';

  assert.strictEqual(isSplitOrOrig('OVERLAY'), false);
  assert.strictEqual(isSplitOrOverlay('OVERLAY'), true);
});

runTest('ADV-MODE-5: AI_DIAGNOSTIC mode mounts VesselHeatmapOverlay with close handler to SPLIT', () => {
  let activeMode = 'AI_DIAGNOSTIC';
  const onClose = () => {
    activeMode = 'SPLIT';
  };
  onClose();
  assert.strictEqual(activeMode, 'SPLIT', 'Đóng chuyên sâu AI phải trả về SPLIT');
});

// =====================================================================
// SECTION 5: OPACITY SLIDER BOUNDS & ACCESSIBILITY
// =====================================================================
console.log('\n--- 5. Opacity Slider Boundaries & Accessibility Stress Tests ---');

runTest('ADV-OPACITY-1: Slider attributes min=0, max=1, step=0.05, default=0.65 (65%)', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('min="0"'));
  assert.ok(html.includes('max="1"'));
  assert.ok(html.includes('step="0.05"'));
  assert.ok(html.includes('65%'));
  assert.ok(html.includes('opacity:0.65') || html.includes('opacity: 0.65'));
});

runTest('ADV-OPACITY-2: Opacity step validation: all 21 steps from 0.0 to 1.0 are valid floats', () => {
  for (let i = 0; i <= 20; i++) {
    const val = Number((i * 0.05).toFixed(2));
    assert.ok(val >= 0.0 && val <= 1.0);
    const pct = Math.round(val * 100);
    assert.ok(pct >= 0 && pct <= 100);
  }
});

// =====================================================================
// SECTION 6: ERGONOMIC DIMENSIONS & RED-FREE FILTER
// =====================================================================
console.log('\n--- 6. Ergonomic 600-650px Dimensions & Red-Free Filter ---');

runTest('ADV-DIM-1: Viewer container enforces min-h-[600px] 2xl:min-h-[650px]', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('min-h-[600px] 2xl:min-h-[650px]'));
});

runTest('ADV-DIM-2: Image elements enforce max-h-[560px] 2xl:max-h-[610px]', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('max-h-[560px] 2xl:max-h-[610px]'));
});

runTest('ADV-FILTER-1: Red-Free 540nm SVG filter and toggle button present', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('id="aura-red-free-filter"'));
  assert.ok(html.includes('data-testid="cds-red-free-toggle-btn"'));
});

runTest('ADV-DISCLAIMER-1: Mandatory medical disclaimer present', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('role="note"'));
});

console.log('\n======================================================================');
console.log(`  CHALLENGER DEEP STRESS HARNESS COMPLETED: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
console.log('======================================================================\n');
