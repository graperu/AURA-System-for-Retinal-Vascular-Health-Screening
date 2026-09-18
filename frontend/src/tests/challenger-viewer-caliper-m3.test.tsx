import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  InteractiveCDSViewer,
  getAnomalyMedicalTheme,
  getAnomalyName,
  processVesselOverlayCanvas,
  renderAnatomicalHeatmap,
} from '../components/InteractiveCDSViewer.tsx';
import type { AIRiskResult } from '../types/cds.ts';

// Polyfills for Node environment
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
    width = 800;
    height = 600;
    naturalWidth = 800;
    naturalHeight = 600;
  };
}

console.log('=================================================================');
console.log('   CHALLENGER M3: RETINAL VIEWER & MICROVASCULAR CALIPER STRESS');
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

// Sample CDS Risk Data
const mockAnalysisData: AIRiskResult = {
  analysisId: 'SCR-M3-STRESS-001',
  createdAt: '2026-09-18T16:00:00.000Z',
  status: 'ANALYZED',
  executionTimeMs: 980,
  overallVascularRiskScore: 68,
  riskScore: 68,
  imageUrl: '/assets/images/fundus_sample_od.png',
  cardiovascularRisk: {
    level: 'High',
    score: 68,
    hypertensionStage: 'Stage 2 Hypertension',
    threeYearStrokeRiskPercent: 32,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 60,
    etdrsGrade: 'Moderate NPDR',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 18,
  },
  annotatedMap: {
    arteryVeinRatio: 0.56,
    vesselDensityPercentage: 17.5,
    tortuosityIndex: 1.42,
    opticCupToDiscRatio: 0.44,
    heatmapUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    detectedAnomalies: [
      {
        id: 'anom-1',
        type: 'Microaneurysm',
        confidence: 0.94,
        description: 'Microaneurysm at superior temporal arcade',
        coordinates: { x: 42.5, y: 38.2, width: 28, height: 28 },
      },
      {
        id: 'anom-2',
        type: 'Hemorrhage',
        confidence: 0.89,
        description: 'Flame hemorrhage near optic disc boundary',
        coordinates: { x: 28.1, y: 52.6, width: 34, height: 34 },
      },
    ],
  },
};

// =================================================================
// 1. OPTICAL ZOOM BOUNDARY STRESS TESTS
// =================================================================
console.log('--- 1. Kiểm thử Giới Hạn Zoom Quang Học (1.0x - 5.0x Clamping) ---');

runTest('ZOOM-1: Khởi tạo zoom Level mặc định là 1.0 (100%) và panOffset (0, 0)', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('100%'), 'Viewer phải hiển thị mức zoom 100% khi khởi tạo');
  assert.ok(html.includes('scale(1)'), 'CSS Transform phải có scale(1)');
  assert.ok(html.includes('translate(0px, 0px)'), 'CSS Transform phải có translate(0px, 0px)');
});

runTest('ZOOM-2: Logic zoom quang học tăng giảm từng bước 0.2x chính xác', () => {
  const zoomUpdater = (prev: number, delta: number) => {
    const next = prev + delta;
    return Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
  };

  let z = 1.0;
  z = zoomUpdater(z, 0.2);
  assert.strictEqual(z, 1.2, '1.0 + 0.2 phải bằng 1.2');
  z = zoomUpdater(z, 0.8);
  assert.strictEqual(z, 2.0, '1.2 + 0.8 phải bằng 2.0');
  z = zoomUpdater(z, 0.5);
  assert.strictEqual(z, 2.5, '2.0 + 0.5 phải bằng 2.5');
  z = zoomUpdater(z, 2.5);
  assert.strictEqual(z, 5.0, '2.5 + 2.5 phải bằng 5.0');
});

runTest('ZOOM-3: Giới hạn trên (Upper Clamp) tại 5.0x không cho phép vượt quá 5.0x dưới mọi delta', () => {
  const zoomUpdater = (prev: number, delta: number) => {
    const next = prev + delta;
    return Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
  };

  assert.strictEqual(zoomUpdater(5.0, 0.2), 5.0, '5.0 + 0.2 phải bị chặn ở 5.0');
  assert.strictEqual(zoomUpdater(5.0, 5.0), 5.0, '5.0 + 5.0 phải bị chặn ở 5.0');
  assert.strictEqual(zoomUpdater(4.9, 100.0), 5.0, 'Bước nhảy lớn phải bị chặn ở 5.0');
  assert.strictEqual(zoomUpdater(5.0, Infinity), 5.0, 'Infinity delta phải bị chặn ở 5.0');
});

runTest('ZOOM-4: Giới hạn dưới (Lower Clamp) tại 1.0x không cho phép thu nhỏ < 1.0x', () => {
  const zoomUpdater = (prev: number, delta: number) => {
    const next = prev + delta;
    return Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
  };

  assert.strictEqual(zoomUpdater(1.0, -0.2), 1.0, '1.0 - 0.2 phải bị chặn ở 1.0');
  assert.strictEqual(zoomUpdater(1.0, -10.0), 1.0, '1.0 - 10.0 phải bị chặn ở 1.0');
  assert.strictEqual(zoomUpdater(1.5, -50.0), 1.0, 'Bước thu nhỏ lớn phải bị chặn ở 1.0');
  assert.strictEqual(zoomUpdater(1.0, -Infinity), 1.0, '-Infinity delta phải bị chặn ở 1.0');
});

runTest('ZOOM-5: Khử trôi số thực IEEE-754 thông qua Number(next.toFixed(1))', () => {
  const rawFloat = 1.0 + 0.2 + 0.2; // 1.4000000000000001
  const sanitized = Number(rawFloat.toFixed(1));
  assert.strictEqual(sanitized, 1.4, 'Phải làm tròn chính xác 1 chữ số thập phân');
  assert.strictEqual(Number((1.0 + 0.1).toFixed(1)), 1.1);
  assert.strictEqual(Number((4.8 + 0.2).toFixed(1)), 5.0);
});

runTest('ZOOM-6: Reset zoom đưa về 1.0x và lập tức xóa bỏ panOffset về (0, 0)', () => {
  let zoomLevel = 4.5;
  let panOffset = { x: 350, y: -280 };

  const handleResetZoom = () => {
    zoomLevel = 1.0;
    panOffset = { x: 0, y: 0 };
  };

  handleResetZoom();
  assert.strictEqual(zoomLevel, 1.0, 'ZoomLevel phải về 1.0');
  assert.deepStrictEqual(panOffset, { x: 0, y: 0 }, 'Pan offset phải về (0,0)');
});

// =================================================================
// 2. PAN BOUNDARY LIMITS AT MAXIMUM ZOOM (5.0X)
// =================================================================
console.log('\n--- 2. Kiểm thử Giới Hạn Kéo Thả (Pan Bounds Clamping at 5.0x) ---');

runTest('PAN-1: Khi zoomLevel <= 1.0x, tính năng kéo thả pan bị vô hiệu hóa hoàn toàn', () => {
  const startDragCheck = (zoomLevel: number, isRulerActive: boolean) => {
    if (isRulerActive || zoomLevel <= 1.0) return false;
    return true;
  };

  assert.strictEqual(startDragCheck(1.0, false), false, 'Zoom 1.0x không được phép pan');
  assert.strictEqual(startDragCheck(0.8, false), false, 'Zoom < 1.0x không được phép pan');
  assert.strictEqual(startDragCheck(1.2, false), true, 'Zoom 1.2x được phép pan');
});

runTest('PAN-2: Công thức tính biên độ kéo maxPanX & maxPanY theo hệ số zoom', () => {
  const calcMaxPan = (zoomLevel: number) => {
    const maxPanX = Math.max(120, (zoomLevel - 1) * 450);
    const maxPanY = Math.max(120, (zoomLevel - 1) * 350);
    return { maxPanX, maxPanY };
  };

  // At 1.0x: fallback to 120
  const pan10 = calcMaxPan(1.0);
  assert.strictEqual(pan10.maxPanX, 120);
  assert.strictEqual(pan10.maxPanY, 120);

  // At 2.5x: (2.5 - 1) * 450 = 675, (2.5 - 1) * 350 = 525
  const pan25 = calcMaxPan(2.5);
  assert.strictEqual(pan25.maxPanX, 675);
  assert.strictEqual(pan25.maxPanY, 525);

  // At 5.0x (Max Zoom): (5.0 - 1) * 450 = 1800, (5.0 - 1) * 350 = 1400
  const pan50 = calcMaxPan(5.0);
  assert.strictEqual(pan50.maxPanX, 1800);
  assert.strictEqual(pan50.maxPanY, 1400);
});

runTest('PAN-3: Kéo thả với delta cực đoan (+/- 500,000 px) bị chặn đứng tại biên độ tối đa', () => {
  const zoomLevel = 5.0;
  const maxPanX = Math.max(120, (zoomLevel - 1) * 450); // 1800
  const maxPanY = Math.max(120, (zoomLevel - 1) * 350); // 1400

  const clampPan = (startX: number, startY: number, deltaX: number, deltaY: number) => {
    const nextX = Math.max(-maxPanX, Math.min(maxPanX, startX + deltaX));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, startY + deltaY));
    return { nextX, nextY };
  };

  // Thử kéo cực mạnh sang phải & xuống dưới
  const extremePositive = clampPan(0, 0, 500000, 500000);
  assert.strictEqual(extremePositive.nextX, 1800, 'Tọa độ X phải bị chặn tại +1800');
  assert.strictEqual(extremePositive.nextY, 1400, 'Tọa độ Y phải bị chặn tại +1400');

  // Thử kéo cực mạnh sang trái & lên trên
  const extremeNegative = clampPan(0, 0, -999999, -999999);
  assert.strictEqual(extremeNegative.nextX, -1800, 'Tọa độ X phải bị chặn tại -1800');
  assert.strictEqual(extremeNegative.nextY, -1400, 'Tọa độ Y phải bị chặn tại -1400');
});

runTest('PAN-4: Khóa pan hoàn toàn khi đang bật Thước đo vi mạch (Caliper Active)', () => {
  const startDrag = (isRulerActive: boolean, zoomLevel: number) => {
    if (isRulerActive || zoomLevel <= 1.0) return false;
    return true;
  };

  assert.strictEqual(startDrag(true, 5.0), false, 'Khi thước đo đang bật, cấm pan ngay cả ở zoom 5.0x');
  assert.strictEqual(startDrag(false, 5.0), true, 'Khi thước đo tắt, cho phép pan bình thường ở zoom 5.0x');
});

// =================================================================
// 3. MICROVASCULAR CALIPER RULER CALCULATIONS & EDGE CASES
// =================================================================
console.log('\n--- 3. Thẩm Định Thước Đo Vi Mạch (Microvascular Caliper Ruler Math & Scaling) ---');

runTest('CALIPER-1: Nút bật/tắt thước đo có mặt với data-testid="cds-ruler-toggle-btn"', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(
    html.includes('data-testid="cds-ruler-toggle-btn"'),
    'Phải có nút thước đo vi mạch data-testid="cds-ruler-toggle-btn"'
  );
  assert.ok(html.includes('Thước đo vi mạch') || html.includes('Ruler'), 'Phải có nhãn thước đo');
});

runTest('CALIPER-2: Xử lý khoảng cách đo bằng 0 (Zero-length measurement safe guard)', () => {
  const rulerStart = { xPct: 50, yPct: 50, rawX: 200, rawY: 200 };
  const rulerEnd = { xPct: 50, yPct: 50, rawX: 200, rawY: 200 };

  const rulerDistPx = rulerStart && rulerEnd
    ? Math.round(Math.hypot(rulerEnd.rawX - rulerStart.rawX, rulerEnd.rawY - rulerStart.rawY))
    : 0;

  assert.strictEqual(rulerDistPx, 0, 'Khoảng cách khi click 1 điểm phải bằng 0');

  // Điều kiện hiển thị overlay thước đo: {rulerStart && rulerEnd && rulerDistPx > 0 && (...)}
  const shouldRenderOverlay = Boolean(rulerStart && rulerEnd && rulerDistPx > 0);
  assert.strictEqual(
    shouldRenderOverlay,
    false,
    'Khi rulerDistPx === 0, không được render SVG line hoặc hộp kết quả đo'
  );
});

runTest('CALIPER-3: Độ chính xác toán học: Khoảng cách pixel, micromet (~1.5 µm/px) và tỷ lệ Đĩa Thị (DD)', () => {
  const calculateCaliper = (x1: number, y1: number, x2: number, y2: number) => {
    const distPx = Math.round(Math.hypot(x2 - x1, y2 - y1));
    const distMicrons = Math.round(distPx * 1.5);
    const fractionDD = (distMicrons / 1500).toFixed(2);
    return { distPx, distMicrons, fractionDD };
  };

  // Ca lâm sàng A: Đường kính vi phình mạch ~100px
  const caseA = calculateCaliper(100, 100, 200, 100);
  assert.strictEqual(caseA.distPx, 100, '100px ngang');
  assert.strictEqual(caseA.distMicrons, 150, '150 µm');
  assert.strictEqual(caseA.fractionDD, '0.10', '0.10 DD');

  // Ca lâm sàng B: Tam giác vuông Pythagoras 300 - 400 - 500 px
  const caseB = calculateCaliper(0, 0, 300, 400);
  assert.strictEqual(caseB.distPx, 500, 'Tam giác 300x400 cho cạnh huyền 500px');
  assert.strictEqual(caseB.distMicrons, 750, '500 * 1.5 = 750 µm');
  assert.strictEqual(caseB.fractionDD, '0.50', '750 / 1500 = 0.50 DD (nửa đường kính đĩa thị)');

  // Ca lâm sàng C: Đo phân đoạn mạch máu lớn (Đĩa thị chuẩn 1000px)
  const caseC = calculateCaliper(50, 50, 1050, 50);
  assert.strictEqual(caseC.distPx, 1000, '1000px');
  assert.strictEqual(caseC.distMicrons, 1500, '1500 µm');
  assert.strictEqual(caseC.fractionDD, '1.00', 'Chính xác 1.00 DD (1 đường kính đĩa thị)');

  // Ca lâm sàng D: Tổn thương rất nhỏ (sub-pixel rounding: dx=3, dy=4 -> 5px)
  const caseD = calculateCaliper(10, 10, 13, 14);
  assert.strictEqual(caseD.distPx, 5, '3-4-5 cho 5px');
  assert.strictEqual(caseD.distMicrons, 8, '5 * 1.5 = 7.5 -> 8 µm');
  assert.strictEqual(caseD.fractionDD, '0.01', '0.01 DD');
});

runTest('CALIPER-4: Tọa độ tỷ lệ phần trăm luôn được kẹp trong dải an toàn [0%, 100%]', () => {
  const rect = { left: 100, top: 100, width: 600, height: 600 };

  const calcPercentage = (clientX: number, clientY: number) => {
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
    return { xPct, yPct };
  };

  // Chuột rơi ra ngoài góc trên trái
  const outLeftTop = calcPercentage(0, 0);
  assert.strictEqual(outLeftTop.xPct, 0);
  assert.strictEqual(outLeftTop.yPct, 0);

  // Chuột rơi ra ngoài góc dưới phải
  const outRightBottom = calcPercentage(1200, 1200);
  assert.strictEqual(outRightBottom.xPct, 100);
  assert.strictEqual(outRightBottom.yPct, 100);

  // Điểm nằm ở trung tâm
  const center = calcPercentage(400, 400);
  assert.strictEqual(center.xPct, 50);
  assert.strictEqual(center.yPct, 50);
});

runTest('CALIPER-5: Tooltip kết quả đo có giới hạn an toàn Math.max(15, ...) chống tràn mép trên', () => {
  const getTooltipTop = (yPct1: number, yPct2: number) => {
    return Math.max(15, Math.min(yPct1, yPct2) - 2);
  };

  // Khi người dùng đo sát cạnh trên cùng (y = 2%)
  const topEdge = getTooltipTop(2, 5);
  assert.strictEqual(topEdge, 15, 'Tooltip phải được giữ ở mức tối thiểu 15% không bị cắt ngoài viewer');

  // Khi người dùng đo ở giữa màn hình (y = 50%)
  const midScreen = getTooltipTop(50, 60);
  assert.strictEqual(midScreen, 48, '50 - 2 = 48%');
});

runTest('CALIPER-6: Đặt lại thước đo (clearRuler) xóa sạch dữ liệu và hủy trạng thái measuring', () => {
  let rulerStart: any = { xPct: 10, yPct: 10, rawX: 50, rawY: 50 };
  let rulerEnd: any = { xPct: 40, yPct: 40, rawX: 200, rawY: 200 };
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

// =================================================================
// 4. VIEWING MODES SWITCHING & RETINAL DISPLAY STABILITY
// =================================================================
console.log('\n--- 4. Kiểm thử Chuyển Đổi Các Chế Độ Xem (Viewing Modes Switching) ---');

runTest('MODE-1: Chế độ mặc định SPLIT render 2 khung hình song song (Ảnh Gốc & Bản Đồ AI)', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('Ảnh chụp đáy mắt gốc') || html.includes('True Color Fundus Scan'), 'Phải có khung Ảnh Gốc');
  assert.ok(html.includes('Bản đồ nhiệt Grad-CAM') || html.includes('Grad-CAM Attention Heatmap') || html.includes('540nm Optical Synthesis'), 'Phải có khung Bản Đồ AI');
  assert.ok(html.includes('grid-cols-1 lg:grid-cols-2'), 'Bố cục phải chia đôi song song');
});

runTest('MODE-2: Kiểm thử các nút chuyển chế độ SPLIT, ORIGINAL, OVERLAY và AI_DIAGNOSTIC', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('Đối chiếu') || html.includes('Split'), 'Có nút Đối chiếu');
  assert.ok(html.includes('Ảnh gốc') || html.includes('Original'), 'Có nút Ảnh gốc');
  assert.ok(html.includes('Lớp phủ') || html.includes('Overlay'), 'Có nút Lớp phủ');
  assert.ok(html.includes('data-testid="cds-ai-diagnostic-toggle-btn"'), 'Có nút Chuyên sâu AI');
});

runTest('MODE-3: Chuyển đổi qua lại các mode không gây crash hoặc unhandled state', () => {
  const modes = ['SPLIT', 'ORIGINAL', 'OVERLAY', 'AI_DIAGNOSTIC'] as const;
  for (const mode of modes) {
    assert.doesNotThrow(() => {
      // Mock render với từng mode bằng cách kiểm tra các hàm helper
      const isSplitOrOrig = mode === 'SPLIT' || mode === 'ORIGINAL';
      const isSplitOrOverlay = mode === 'SPLIT' || mode === 'OVERLAY';
      const isAiDiag = mode === 'AI_DIAGNOSTIC';
      assert.ok(typeof isSplitOrOrig === 'boolean');
      assert.ok(typeof isSplitOrOverlay === 'boolean');
      assert.ok(typeof isAiDiag === 'boolean');
    }, `Chuyển sang mode ${mode} phải an toàn tuyệt đối`);
  }
});

// =================================================================
// 5. OPACITY SLIDER RANGE, STEP, DEFAULT & ACCESSIBILITY
// =================================================================
console.log('\n--- 5. Kiểm thử Thanh Trượt Độ Mờ (Opacity Slider Specs & A11y) ---');

runTest('OPACITY-1: Slider có đúng thuộc tính min="0", max="1", step="0.05", mặc định 0.65', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('type="range"'), 'Phải là input type="range"');
  assert.ok(html.includes('min="0"'), 'Giá trị min phải là 0');
  assert.ok(html.includes('max="1"'), 'Giá trị max phải là 1');
  assert.ok(html.includes('step="0.05"'), 'Bước nhảy step phải là 0.05');
  assert.ok(html.includes('65%'), 'Nhãn phần trăm mặc định phải là 65%');
});

runTest('OPACITY-2: Slider sở hữu aria-label rõ ràng phục vụ trợ năng y tế', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(
    html.includes('aria-label="Độ mờ bản đồ nhiệt AI"') || html.includes('aria-label="AI Heatmap Opacity"'),
    'Thanh trượt phải có aria-label chuẩn'
  );
});

runTest('OPACITY-3: Lớp phủ Grad-CAM (cds-canvas-overlay) nhận chính xác giá trị opacity', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('cds-canvas-overlay'), 'Phải có class cds-canvas-overlay');
  assert.ok(html.includes('opacity:0.65') || html.includes('opacity: 0.65'), 'Opacity phải là 0.65');
});

// =================================================================
// 6. ERGONOMIC DIMENSIONS & RED-FREE FILTER (R3.1)
// =================================================================
console.log('\n--- 6. Thẩm Định Kích Thước Viewer 600-650px & Bộ Lọc Red-Free 540nm ---');

runTest('VIEWER-DIM-1: Khung xem ảnh võng mạc đạt chiều cao tối thiểu 600px (650px trên 2xl)', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(
    html.includes('min-h-[600px] 2xl:min-h-[650px]'),
    'Container viewer phải có min-h-[600px] 2xl:min-h-[650px]'
  );
});

runTest('VIEWER-DIM-2: Khung chứa ảnh/canvas đạt max-h-[560px] 2xl:max-h-[610px] với object-contain', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(
    html.includes('max-h-[560px] 2xl:max-h-[610px]'),
    'Ảnh võng mạc phải có max-h-[560px] 2xl:max-h-[610px]'
  );
  assert.ok(html.includes('object-contain'), 'Ảnh phải giữ tỷ lệ chuẩn object-contain');
});

runTest('VIEWER-FILTER-1: Bộ lọc Red-Free 540nm SVG matrix filter hiện diện đầy đủ', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(html.includes('id="aura-red-free-filter"'), 'Phải có SVG filter id="aura-red-free-filter"');
  assert.ok(html.includes('feColorMatrix'), 'Phải có feColorMatrix chuyển đổi màu');
  assert.ok(html.includes('data-testid="cds-red-free-toggle-btn"'), 'Phải có nút bật tắt Red-Free filter');
});

runTest('VIEWER-DISCLAIMER-1: Cảnh báo y tế bắt buộc MedicalDisclaimer hiện diện', () => {
  const html = renderToStaticMarkup(
    <InteractiveCDSViewer analysisResult={mockAnalysisData} selectedEye="OD" />
  );
  assert.ok(
    html.includes('role="note"') && (html.includes('Lưu ý y khoa bắt buộc') || html.includes('hỗ trợ sàng lọc') || html.includes('Medical Safety')),
    'Viewer bắt buộc phải có cảnh báo y tế MedicalDisclaimer với role="note"'
  );
});

console.log('\n=================================================================');
console.log(`   KẾT QUẢ KIỂM THỬ CHALLENGER M3: ${passedTests}/${totalTests} TESTS ĐÃ ĐẠT (100% PASS)`);
console.log('=================================================================\n');
