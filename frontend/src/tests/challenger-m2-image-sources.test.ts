import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  InteractiveCDSViewer,
  processVesselOverlayCanvas,
} from '../components/InteractiveCDSViewer.tsx';
import { PatientScreeningResultView } from '../features/patient/PatientScreeningResultView.tsx';
import {
  normalizeImageDataUrl,
  mapScreeningToAIRiskResult,
} from '../services/screeningMapper.ts';
import type { AIRiskResult } from '../types/cds.ts';

if (typeof (globalThis as any).Image === 'undefined') {
  (globalThis as any).Image = class MockImage {
    crossOrigin?: string;
    onload?: () => void;
    onerror?: () => void;
    src = '';
    width = 400;
    height = 300;
    naturalWidth = 400;
    naturalHeight = 300;
  };
}

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

console.log('=================================================================');
console.log('   CHALLENGER MILESTONE 2: EMPIRICAL IMAGE SOURCES STRESS SUITE');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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
          failedTests++;
          console.error(`  [FAIL] ${name}`);
          console.error(`         Error: ${err?.message || err}`);
          throw err;
        });
    }
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    throw err;
  }
}

const baseMockResult: AIRiskResult = {
  analysisId: 'CHALLENGE-M2-001',
  imageUrl: '/uploads/default.png',
  status: 'COMPLETED',
  executionTimeMs: 1450,
  overallVascularRiskScore: 45,
  riskScore: 45,
  eyePosition: 'OD',
  scanType: 'Fundus_Macula',
  icd10Codes: ['H35.0'],
  modelVersion: 'Gemini 3.8 Flash High / AURA-Core v2.4',
  cardiovascularRisk: {
    level: 'Moderate',
    score: 45,
    hypertensionStage: 'Giai đoạn 1',
    threeYearStrokeRiskPercent: 12,
  },
  diabeticRetinopathyRisk: {
    level: 'Low',
    score: 20,
    etdrsGrade: 'Cấp độ 0',
    macularEdemaPresent: false,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 15,
  },
  annotatedMap: {
    heatmapUrl: undefined,
    vesselMaskUrl: undefined,
    arteryVeinRatio: 0.68,
    vesselDensityPercentage: 0.42,
    tortuosityIndex: 1.15,
    opticCupToDiscRatio: 0.35,
    detectedAnomalies: [
      {
        id: 'anom-1',
        type: 'Microaneurysm',
        coordinates: { x: 45.2, y: 62.8, width: 28, height: 28 },
        confidence: 0.89,
        description: 'Vi phình mạch',
      },
    ],
  },
};

console.log('--- 1. normalizeImageDataUrl Adversarial Ingestion Matrix ---');

runTest('CHALLENGE-NORM-1: Raw Base64 string without data scheme prepends data:image/png;base64,', () => {
  const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const normalized = normalizeImageDataUrl(rawBase64);
  assert.strictEqual(normalized, `data:image/png;base64,${rawBase64}`);
});

runTest('CHALLENGE-NORM-2: Raw Base64 with surrounding whitespace/newlines is trimmed and prepended', () => {
  const rawBase64 = '  iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ  \n\t ';
  const normalized = normalizeImageDataUrl(rawBase64);
  assert.strictEqual(
    normalized,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
  );
});

runTest('CHALLENGE-NORM-3: Valid Data URIs (JPEG, PNG, WebP) are preserved intact', () => {
  const jpegUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';
  const pngUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
  const webpUri = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQ...';

  assert.strictEqual(normalizeImageDataUrl(jpegUri), jpegUri);
  assert.strictEqual(normalizeImageDataUrl(pngUri), pngUri);
  assert.strictEqual(normalizeImageDataUrl(webpUri), webpUri);
});

runTest('CHALLENGE-NORM-4: Valid Blob URLs (localhost, https domain) are preserved intact', () => {
  const localhostBlob = 'blob:http://localhost:5173/0e1e11fe-e3ab-4c6a-83fa-456057d8c075';
  const productionBlob = 'blob:https://aura.health/b74718e6-4aea-4919-8b36-83600e93cd79';

  assert.strictEqual(normalizeImageDataUrl(localhostBlob), localhostBlob);
  assert.strictEqual(normalizeImageDataUrl(productionBlob), productionBlob);
});

runTest('CHALLENGE-NORM-5: Remote CDN HTTPS and HTTP URLs are preserved intact', () => {
  const cdnUrl = 'https://storage.googleapis.com/aura-retinal-scans/prod/scan_99214.png';
  const httpUrl = 'http://192.168.1.100:8080/dicom/export_01.jpg';

  assert.strictEqual(normalizeImageDataUrl(cdnUrl), cdnUrl);
  assert.strictEqual(normalizeImageDataUrl(httpUrl), httpUrl);
});

runTest('CHALLENGE-NORM-6: Local server /uploads and /assets paths are preserved intact', () => {
  const uploadPath = '/uploads/fundus_1.png';
  const assetPath = '/assets/images/fundus_original.png';

  assert.strictEqual(normalizeImageDataUrl(uploadPath), uploadPath);
  assert.strictEqual(normalizeImageDataUrl(assetPath), assetPath);
});

runTest('CHALLENGE-NORM-7: Empty and whitespace strings return undefined', () => {
  assert.strictEqual(normalizeImageDataUrl(''), undefined);
  assert.strictEqual(normalizeImageDataUrl('   '), undefined);
  assert.strictEqual(normalizeImageDataUrl('\t\n\r  '), undefined);
});

runTest('CHALLENGE-NORM-8: Null and undefined inputs return undefined', () => {
  assert.strictEqual(normalizeImageDataUrl(null), undefined);
  assert.strictEqual(normalizeImageDataUrl(undefined), undefined);
});

runTest('CHALLENGE-NORM-9: Non-string adversarial types return undefined without crashing', () => {
  assert.strictEqual(normalizeImageDataUrl(12345 as any), undefined);
  assert.strictEqual(normalizeImageDataUrl(true as any), undefined);
  assert.strictEqual(normalizeImageDataUrl({ url: 'foo' } as any), undefined);
  assert.strictEqual(normalizeImageDataUrl(['data:...'] as any), undefined);
});

console.log('\n--- 2. InteractiveCDSViewer Ingestion & Controlled Fallback ---');

runTest('CHALLENGE-CDS-BLOB: Blob URL renders in InteractiveCDSViewer and does NOT fallback to demo image', () => {
  const blobUrl = 'blob:http://localhost:5173/test-uuid-blob-cds';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: blobUrl,
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: result })
  );

  assert.ok(html.includes(blobUrl), 'Viewer must contain the provided blob URL');
  assert.ok(
    !html.includes('/assets/images/fundus_original.png'),
    'Viewer must NOT fallback to demo image when valid blob URL is present'
  );
  assert.ok(
    !html.includes(`src="${blobUrl}" crossorigin="anonymous"`),
    'crossOrigin attribute must NOT be set to anonymous for blob URLs'
  );
});

runTest('CHALLENGE-CDS-DATA: Data URI renders in InteractiveCDSViewer and does NOT fallback to demo image', () => {
  const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP...';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: dataUri,
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: result })
  );

  assert.ok(html.includes(dataUri), 'Viewer must contain the provided Data URI');
  assert.ok(!html.includes('/assets/images/fundus_original.png'), 'Must not fallback to demo image');
  assert.ok(
    !html.includes(`src="${dataUri}" crossorigin="anonymous"`),
    'crossOrigin attribute must NOT be set to anonymous for data URIs'
  );
});

runTest('CHALLENGE-CDS-BASE64: Raw Base64 string is normalized and rendered in InteractiveCDSViewer', () => {
  const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const screeningDto = {
    id: 'SCR-RAW-001',
    imageUrl: rawBase64,
    status: 'COMPLETED',
    cardiovascularRiskScore: 30,
    diabeticRetinopathyRiskScore: 15,
  };

  const mappedResult = mapScreeningToAIRiskResult(screeningDto, '/assets/images/fundus_original.png');
  assert.strictEqual(mappedResult.imageUrl, `data:image/png;base64,${rawBase64}`);

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: mappedResult })
  );

  assert.ok(html.includes(`data:image/png;base64,${rawBase64}`), 'Viewer renders normalized data URI');
  assert.ok(!html.includes('/assets/images/fundus_original.png'), 'Must not fallback to demo image');
});

runTest('CHALLENGE-CDS-UPLOADS: Local path /uploads/fundus_1.png renders and sets crossOrigin=anonymous', () => {
  const uploadPath = '/uploads/fundus_1.png';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: uploadPath,
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: result })
  );

  assert.ok(html.includes(uploadPath), 'Viewer contains local /uploads path');
  assert.ok(
    html.includes('crossorigin="anonymous"'),
    'crossOrigin must be set to anonymous for local/remote paths'
  );
});

runTest('CHALLENGE-CDS-CDN: Remote CDN URL renders and sets crossOrigin=anonymous', () => {
  const cdnUrl = 'https://storage.googleapis.com/aura-retinal/scan_402.png';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: cdnUrl,
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: result })
  );

  assert.ok(html.includes(cdnUrl), 'Viewer contains remote CDN URL');
  assert.ok(
    html.includes('crossorigin="anonymous"'),
    'crossOrigin must be set to anonymous for CDN URLs'
  );
});

runTest('CHALLENGE-CDS-EMPTY: Empty/whitespace string correctly falls back to demo image', () => {
  const emptyResult: AIRiskResult = {
    ...baseMockResult,
    imageUrl: '   ',
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: emptyResult })
  );

  assert.ok(
    html.includes('/assets/images/fundus_original.png'),
    'Controlled fallback on whitespace imageUrl'
  );
});

runTest('CHALLENGE-CDS-HEATMAP: Grad-CAM Heatmap layer handles real Base64 and shows authentic badge', () => {
  const heatmapData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const resultWithHeatmap: AIRiskResult = {
    ...baseMockResult,
    annotatedMap: {
      ...baseMockResult.annotatedMap!,
      heatmapUrl: heatmapData,
    },
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: resultWithHeatmap })
  );

  assert.ok(html.includes(heatmapData), 'Viewer renders authentic Grad-CAM heatmap data');
  assert.ok(
    html.includes('Bản đồ nhiệt Grad-CAM') || html.includes('Grad-CAM Attention Heatmap'),
    'Displays authentic Grad-CAM attention badge'
  );
});

runTest('CHALLENGE-CDS-NO-HEATMAP: When heatmap is missing, optical synthesis layer is rendered', () => {
  const resultWithoutHeatmap: AIRiskResult = {
    ...baseMockResult,
    annotatedMap: {
      ...baseMockResult.annotatedMap!,
      heatmapUrl: undefined,
    },
  };

  const html = renderToStaticMarkup(
    React.createElement(InteractiveCDSViewer, { analysisResult: resultWithoutHeatmap })
  );

  assert.ok(
    html.includes('Mô phỏng quang học 540nm') || html.includes('540nm Optical Synthesis'),
    'Displays 540nm optical synthesis badge'
  );
});

console.log('\n--- 3. PatientScreeningResultView Ingestion & Fallback Matrix ---');

runTest('CHALLENGE-PATIENT-BLOB: PatientScreeningResultView renders blob URL without fallback to demo', () => {
  const blobUrl = 'blob:http://localhost:5173/patient-screening-uuid';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: blobUrl,
  };

  const html = renderToStaticMarkup(
    React.createElement(PatientScreeningResultView, { result })
  );

  assert.ok(html.includes(blobUrl), 'Patient view renders blob URL');
  assert.ok(
    !html.includes('/assets/images/fundus_original.png'),
    'Patient view must NOT fallback to demo'
  );
});

runTest('CHALLENGE-PATIENT-DATA: PatientScreeningResultView renders data:image/ URI', () => {
  const dataUri = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2wAA';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: dataUri,
  };

  const html = renderToStaticMarkup(
    React.createElement(PatientScreeningResultView, { result })
  );

  assert.ok(html.includes(dataUri), 'Patient view renders data URI');
  assert.ok(!html.includes('/assets/images/fundus_original.png'), 'Must not fallback to demo image');
});

runTest('CHALLENGE-PATIENT-UPLOADS: PatientScreeningResultView renders /uploads/ path with crossOrigin=anonymous', () => {
  const uploadPath = '/uploads/retina_patient_88.jpg';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: uploadPath,
  };

  const html = renderToStaticMarkup(
    React.createElement(PatientScreeningResultView, { result })
  );

  assert.ok(html.includes(uploadPath), 'Patient view renders upload path');
  assert.ok(html.includes('crossorigin="anonymous"'), 'Sets crossOrigin=anonymous for /uploads/');
});

runTest('CHALLENGE-PATIENT-CDN: PatientScreeningResultView renders CDN URL with crossOrigin=anonymous', () => {
  const cdnUrl = 'https://storage.googleapis.com/aura-retinal/patient_scan.png';
  const result: AIRiskResult = {
    ...baseMockResult,
    imageUrl: cdnUrl,
  };

  const html = renderToStaticMarkup(
    React.createElement(PatientScreeningResultView, { result })
  );

  assert.ok(html.includes(cdnUrl), 'Patient view renders CDN URL');
  assert.ok(html.includes('crossorigin="anonymous"'), 'Sets crossOrigin=anonymous for CDN');
});

runTest('CHALLENGE-PATIENT-FALLBACK: PatientScreeningResultView falls back on empty/whitespace imageUrl', () => {
  const emptyResult: AIRiskResult = {
    ...baseMockResult,
    imageUrl: '  ',
  };

  const html = renderToStaticMarkup(
    React.createElement(PatientScreeningResultView, { result: emptyResult })
  );

  assert.ok(
    html.includes('/assets/images/fundus_original.png'),
    'Controlled fallback to demo in PatientScreeningResultView'
  );
});

console.log('\n--- 4. Canvas Tainting & SecurityError Graceful Catch ---');

runTest('CHALLENGE-CANVAS-SECURITY: processVesselOverlayCanvas catches tainted canvas SecurityError gracefully', () => {
  let warnCalled = false;
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => { warnCalled = true; };
  try {
    let drawCalls = 0;
    let clearCalls = 0;
    const mockTaintedCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: () => { drawCalls++; },
        getImageData: () => {
          const err = new Error('The canvas has been tainted by cross-origin data.');
          err.name = 'SecurityError';
          throw err;
        },
        clearRect: () => { clearCalls++; },
        putImageData: () => {},
      }),
    } as unknown as HTMLCanvasElement;
    const mockImg = {
      naturalWidth: 500,
      naturalHeight: 400,
      width: 500,
      height: 400,
    } as unknown as HTMLImageElement;
    assert.doesNotThrow(() => {
      processVesselOverlayCanvas(mockImg, mockTaintedCanvas, { isDarkRoom: false });
    }, 'processVesselOverlayCanvas must not throw on tainted canvas');
    assert.ok(warnCalled, 'Warning logged to console');
    assert.ok(clearCalls >= 1, 'Canvas cleared for clean layer fallback');
    assert.ok(drawCalls >= 2, 'First draw + fallback draw executed');
  } finally {
    console.warn = originalWarn;
  }
});

runTest('CHALLENGE-CANVAS-VESSELMASK: processVesselOverlayCanvas uses pre-segmented vesselMaskUrl', () => {
  let maskImgInstantiated: any = null;
  const originalImage = (globalThis as any).Image;
  (globalThis as any).Image = class CustomMockImage {
    crossOrigin?: string;
    onload?: () => void;
    src = '';
    constructor() {
      maskImgInstantiated = this;
    }
  };
  try {
    let drawCalled = false;
    let clearCalled = false;
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: () => { drawCalled = true; },
        clearRect: () => { clearCalled = true; },
      }),
    } as unknown as HTMLCanvasElement;
    const mockSourceImg = { naturalWidth: 400, naturalHeight: 300 } as unknown as HTMLImageElement;
    const vesselMaskBlob = 'blob:http://localhost:5173/vessel-mask-uuid';
    processVesselOverlayCanvas(mockSourceImg, mockCanvas, {
      isDarkRoom: false,
      vesselMaskUrl: vesselMaskBlob,
    });
    assert.ok(maskImgInstantiated, 'Image instance created for vessel mask');
    assert.strictEqual(maskImgInstantiated.src, vesselMaskBlob);
    assert.strictEqual(maskImgInstantiated.crossOrigin, undefined, 'Blob mask has crossOrigin=undefined');
    maskImgInstantiated.onload();
    assert.ok(clearCalled, 'Canvas cleared');
    assert.ok(drawCalled, 'Vessel mask drawn to canvas');
  } finally {
    (globalThis as any).Image = originalImage;
  }
});

runTest('CHALLENGE-CANVAS-ZERO-DIM: processVesselOverlayCanvas handles zero dimension safely', () => {
  const mockCanvas = { width: 0, height: 0, getContext: () => null } as unknown as HTMLCanvasElement;
  const mockZeroImg = { naturalWidth: 0, width: 0, naturalHeight: 0, height: 0 } as HTMLImageElement;
  assert.doesNotThrow(() => {
    processVesselOverlayCanvas(mockZeroImg, mockCanvas, { isDarkRoom: false });
  }, 'Safe return on zero dimensions');
});

runTest('CHALLENGE-CANVAS-NULL: processVesselOverlayCanvas handles null inputs safely', () => {
  assert.doesNotThrow(() => {
    processVesselOverlayCanvas(null as any, null as any, { isDarkRoom: false });
  }, 'Safe return on null parameters');
});

console.log('\n=================================================================');
console.log(`   CHALLENGER VERDICT: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILURES)`);
console.log('=================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
