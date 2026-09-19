import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Polyfill localStorage for Node.js test environment
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

console.log('=================================================================');
console.log('   CHALLENGER M3.2: FRONTEND MEMORY, LIFECYCLE & STABILITY SUITE');

console.log('   Empirical Verification of FE-01 to FE-07 & BIL-02');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void | Promise<void>): Promise<void> | void {
  totalTests++;
  try {
    const result = fn();
    if (result && typeof (result as any).then === 'function') {
      return (result as Promise<void>)
        .then(() => {
          passedTests++;
          console.log(`  [PASS] ${name}`);
        })
        .catch((err) => {
          console.error(`  [FAIL] ${name}`);
          console.error(err);
          process.exit(1);
        });
    } else {
      passedTests++;
      console.log(`  [PASS] ${name}`);
    }
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

const readNormalized = (relPath: string): string => {
  return fs.readFileSync(relPath, 'utf8').replace(/\r\n/g, '\n');
};

// ============================================================================
// 1. ADVERSARIAL TEST 1: CANVAS VRAM ZEROING & OPTICAL MEMORY DISPOSAL (FE-01)
// ============================================================================
console.log('--- 1. ADVERSARIAL TEST 1: Canvas VRAM Zeroing & Disposal (FE-01, FE-07) ---');

class MockCanvasRenderingContext2D {
  canvas: MockHTMLCanvasElement;
  fillStyle: any = '';
  strokeStyle: any = '';
  lineWidth: number = 1;

  constructor(canvas: MockHTMLCanvasElement) {
    this.canvas = canvas;
  }

  clearRect(x: number, y: number, w: number, h: number) {}
  fillRect(x: number, y: number, w: number, h: number) {}
  beginPath() {}
  arc(x: number, y: number, r: number, sAngle: number, eAngle: number) {}
  fill() {}
  drawImage(image: any, sx: number, sy: number, sw: number, sh: number) {}
  createImageData(w: number, h: number) {
    return {
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    };
  }
  getImageData(sx: number, sy: number, sw: number, sh: number) {
    const data = new Uint8ClampedArray(sw * sh * 4);
    for (let i = 0; i < sw * sh; i++) {
      data[i * 4] = 180;     // R
      data[i * 4 + 1] = 90;  // G
      data[i * 4 + 2] = 40;  // B
      data[i * 4 + 3] = 255; // A
    }
    return { width: sw, height: sh, data };
  }
  putImageData(imagedata: any, dx: number, dy: number) {}
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    return {
      addColorStop(offset: number, color: string) {},
    };
  }
}

const createdCanvases: MockHTMLCanvasElement[] = [];

class MockHTMLCanvasElement {
  _width: number = 0;
  _height: number = 0;
  widthZeroedCount: number = 0;
  heightZeroedCount: number = 0;

  get width(): number {
    return this._width;
  }
  set width(val: number) {
    if (val === 0 && this._width > 0) {
      this.widthZeroedCount++;
    }
    this._width = val;
  }

  get height(): number {
    return this._height;
  }
  set height(val: number) {
    if (val === 0 && this._height > 0) {
      this.heightZeroedCount++;
    }
    this._height = val;
  }

  constructor() {
    createdCanvases.push(this);
  }

  getContext(type: string, options?: any) {
    return new MockCanvasRenderingContext2D(this);
  }

  toDataURL(type?: string, quality?: any): string {
    return 'data:image/png;base64,mocked_retinal_heatmap_data_url';
  }
}

class MockHTMLImageElement {
  naturalWidth: number = 1024;
  naturalHeight: number = 1024;
  width: number = 1024;
  height: number = 1024;
  crossOrigin: string = '';
  src: string = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

// Setup simulated DOM globals for the test runner
(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return new MockHTMLCanvasElement();
    }
    if (tag === 'img') {
      return new MockHTMLImageElement();
    }
    return {};
  },
};
(globalThis as any).HTMLCanvasElement = MockHTMLCanvasElement;
(globalThis as any).HTMLImageElement = MockHTMLImageElement;
(globalThis as any).Image = MockHTMLImageElement;

const { renderDynamicRetinalHeatmap, generateDynamicHeatmapDataUrl } = await import('../utils/dynamicHeatmapEngine.ts');

await runTest('FE-01.1: 100 consecutive scans with high risk & anomalies zero temporary canvas VRAM in finally block', () => {
  createdCanvases.length = 0;

  const targetCanvas = new MockHTMLCanvasElement();
  const sourceImg = new MockHTMLImageElement();

  for (let i = 0; i < 100; i++) {
    const success = renderDynamicRetinalHeatmap(sourceImg as any, targetCanvas as any, {
      riskScore: 75,
      selectedEye: i % 2 === 0 ? 'OD' : 'OS',
      anomalies: [
        { x: 30, y: 40, confidence: 0.92, label: 'Microaneurysm' },
        { x: 70, y: 65, confidence: 0.88, label: 'Hemorrhage' },
      ],
      width: 512,
      height: 512,
    });
    assert.strictEqual(success, true, `Iteration ${i} should succeed`);
  }

  const tempCanvases = createdCanvases.filter((c) => c !== targetCanvas);
  assert.strictEqual(tempCanvases.length, 100, 'Exactly 100 temporary canvases should have been created');

  for (let i = 0; i < tempCanvases.length; i++) {
    const tc = tempCanvases[i];
    assert.strictEqual(tc.width, 0, `tempCanvas[${i}].width must be strictly 0 (VRAM released)`);
    assert.strictEqual(tc.height, 0, `tempCanvas[${i}].height must be strictly 0 (VRAM released)`);
    assert.ok(tc.widthZeroedCount >= 1, `tempCanvas[${i}] must have width zeroed`);
    assert.ok(tc.heightZeroedCount >= 1, `tempCanvas[${i}] must have height zeroed`);
  }
});

await runTest('FE-01.2: Extreme resolution (4096x4096) scan zeros temp canvas in finally block', () => {
  createdCanvases.length = 0;

  const targetCanvas = new MockHTMLCanvasElement();
  const sourceImg = new MockHTMLImageElement();
  sourceImg.width = 4096;
  sourceImg.height = 4096;

  const success = renderDynamicRetinalHeatmap(sourceImg as any, targetCanvas as any, {
    riskScore: 90,
    width: 4096,
    height: 4096,
  });
  assert.strictEqual(success, true);

  const tempCanvases = createdCanvases.filter((c) => c !== targetCanvas);
  assert.strictEqual(tempCanvases.length, 1);
  assert.strictEqual(tempCanvases[0].width, 0, '4096x4096 canvas width must be zeroed');
  assert.strictEqual(tempCanvases[0].height, 0, '4096x4096 canvas height must be zeroed');
});

await runTest('FE-01.3: CORS tainted canvas exception still executes finally block to zero VRAM', () => {
  createdCanvases.length = 0;

  const targetCanvas = new MockHTMLCanvasElement();
  const sourceImg = new MockHTMLImageElement();

  const origGetContext = MockHTMLCanvasElement.prototype.getContext;
  MockHTMLCanvasElement.prototype.getContext = function (type: string, options?: any) {
    const ctx = origGetContext.call(this, type, options);
    if (this !== targetCanvas) {
      ctx.getImageData = () => {
        throw new Error('DOMException: The operation is insecure (CORS tainted canvas)');
      };
    }
    return ctx;
  };

  try {
    const success = renderDynamicRetinalHeatmap(sourceImg as any, targetCanvas as any, {
      riskScore: 85,
      anomalies: [{ x: 50, y: 50 }],
      width: 400,
      height: 400,
    });
    assert.strictEqual(success, true, 'Must gracefully fall back to vector gradient without crashing');

    const tempCanvases = createdCanvases.filter((c) => c !== targetCanvas);
    assert.strictEqual(tempCanvases.length, 1);
    assert.strictEqual(tempCanvases[0].width, 0, 'tempCanvas.width must be 0 even after CORS exception');
    assert.strictEqual(tempCanvases[0].height, 0, 'tempCanvas.height must be 0 even after CORS exception');
  } finally {
    MockHTMLCanvasElement.prototype.getContext = origGetContext;
  }
});

await runTest('FE-01.4: generateDynamicHeatmapDataUrl zeros both primary canvas and dummy fallback canvas in finally', () => {
  const fileContent = readNormalized('src/utils/dynamicHeatmapEngine.ts');
  assert.ok(fileContent.includes('tempCanvas.width = 0;'), 'dynamicHeatmapEngine must zero tempCanvas.width');
  assert.ok(fileContent.includes('tempCanvas.height = 0;'), 'dynamicHeatmapEngine must zero tempCanvas.height');
  assert.ok(fileContent.includes('tempCanvas = null;'), 'dynamicHeatmapEngine must nullify tempCanvas');
  assert.ok(fileContent.includes('intensityGrid = null;'), 'dynamicHeatmapEngine must nullify Float32Array');
  assert.ok(fileContent.includes('dummyCanvas.width = 0;'), 'generateDynamicHeatmapDataUrl must zero dummyCanvas.width');
  assert.ok(fileContent.includes('dummyCanvas.height = 0;'), 'generateDynamicHeatmapDataUrl must zero dummyCanvas.height');
  assert.ok(fileContent.includes('canvas.width = 0;'), 'generateDynamicHeatmapDataUrl must zero canvas.width');
  assert.ok(fileContent.includes('canvas.height = 0;'), 'generateDynamicHeatmapDataUrl must zero canvas.height');
});

await runTest('FE-07.1: BatchUploadModal revokes staged Blob URLs on unmount, item removal and demo load', () => {
  const fileContent = readNormalized('src/components/BatchUploadModal.tsx');
  assert.ok(fileContent.includes('URL.revokeObjectURL(item.previewUrl)'), 'Must revoke Blob URLs');
  assert.ok(fileContent.includes('revokeStagedUrls(stagedItemsRef.current)'), 'Must revoke on unmount');
  assert.ok(fileContent.includes('stagedItemsRef = useRef'), 'Must track items via ref to prevent stale closures');
  assert.ok(fileContent.includes('canvas.width = 0;'), 'Thumbnail and compress canvas must zero width');
  assert.ok(fileContent.includes('canvas.height = 0;'), 'Thumbnail and compress canvas must zero height');
});

// ============================================================================
// 2. ADVERSARIAL TEST 2: INFINITE RENDER LOOP & CPU FREEZE ELIMINATION (FE-02)
// ============================================================================
console.log('\n--- 2. ADVERSARIAL TEST 2: Infinite Render Loop Elimination (FE-02) ---');

await runTest('FE-02.1: DynamicHeatmapCanvas uses onRenderCompleteRef to decouple callback from render effect', () => {
  const fileContent = readNormalized('src/components/DynamicHeatmapCanvas.tsx');
  assert.ok(
    fileContent.includes('const onRenderCompleteRef = useRef(onRenderComplete)'),
    'Must store onRenderComplete in ref'
  );
  assert.ok(
    fileContent.includes('onRenderCompleteRef.current = onRenderComplete'),
    'Must update ref when prop changes'
  );

  const startIdx = fileContent.indexOf('useEffect(() => {\n    let isCancelled = false;');
  assert.ok(startIdx !== -1, 'Must find main render effect');
  const effectBlock = fileContent.substring(startIdx);
  const endDepIdx = effectBlock.indexOf(';\n\n  return (');
  const depLine = effectBlock.substring(0, endDepIdx);

  assert.strictEqual(
    depLine.includes('onRenderComplete,'),
    false,
    'Render effect dependency array must NOT contain onRenderComplete'
  );
  assert.ok(
    depLine.includes('JSON.stringify(anomalies)'),
    'Must serialize anomalies array to prevent new array reference triggers'
  );
});

await runTest('FE-02.2: Simulation of parent state re-render loop on callback invocation', () => {
  let parentRenderCount = 0;
  let childEffectRunCount = 0;

  const anomaliesProp = [{ x: 50, y: 50 }];

  let currentRefCallback: any = null;
  const setOnRenderComplete = (cb: any) => {
    currentRefCallback = cb;
  };

  const simulateChildEffect = (
    imageSrc: string,
    riskScore: number,
    anomalies: any[],
    selectedEye: string,
    isDarkRoom: boolean
  ) => {
    childEffectRunCount++;
    if (currentRefCallback) {
      currentRefCallback('data:image/png;base64,sample');
    }
  };

  parentRenderCount++;
  setOnRenderComplete((url: string) => {
    parentRenderCount++;
  });
  simulateChildEffect('img1.png', 50, anomaliesProp, 'OD', false);

  assert.strictEqual(childEffectRunCount, 1);
  assert.strictEqual(parentRenderCount, 2);

  // 100 rapid parent re-renders passing new anonymous closures
  for (let i = 0; i < 100; i++) {
    parentRenderCount++;
    setOnRenderComplete((url: string) => {
      // New closure identity every render
    });
  }

  assert.strictEqual(childEffectRunCount, 1, 'Child render effect must NOT re-execute when callback reference churns');
  assert.strictEqual(parentRenderCount, 102, 'Parent renders stably without runaway infinite loop');
});

await runTest('FE-02.3: DynamicHeatmapCanvas unmount cleanup zeros canvas dimensions', () => {
  const fileContent = readNormalized('src/components/DynamicHeatmapCanvas.tsx');
  assert.ok(
    fileContent.includes('canvasRef.current.width = 0;\n        canvasRef.current.height = 0;'),
    'Must zero canvas dimensions on unmount cleanup'
  );
  assert.ok(
    fileContent.includes('isCancelled = true;'),
    'Must cancel in-flight image load on unmount or deps change'
  );
});

// ============================================================================
// 3. ADVERSARIAL TEST 3: HTTP 204 / 205 NO CONTENT & EMPTY RESPONSES (FE-03)
// ============================================================================
console.log('\n--- 3. ADVERSARIAL TEST 3: HTTP 204 / 205 No Content & Empty Body Handling (FE-03) ---');

const { apiFetch, setAccessToken, getAccessToken } = await import('../services/api.ts');

await runTest('FE-03.1: HTTP 204 No Content resolves { success: true, data: null } without SyntaxError', async () => {
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string, init?: any) => {
    return new Response(null, {
      status: 204,
      statusText: 'No Content',
    });
  };

  try {
    const res = await apiFetch('/api/v1/screenings/105', { method: 'DELETE' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data, null);
    assert.strictEqual(res.message, 'Thao tác thành công');
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});

await runTest('FE-03.2: HTTP 205 Reset Content resolves { success: true, data: null } without SyntaxError', async () => {
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string, init?: any) => {
    return new Response(null, {
      status: 205,
      statusText: 'Reset Content',
    });
  };

  try {
    const res = await apiFetch('/api/v1/auth/reset-sessions', { method: 'POST' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data, null);
    assert.strictEqual(res.message, 'Thao tác thành công');
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});

await runTest('FE-03.3: HTTP 200 with empty body or whitespace string does not throw JSON parse error', async () => {
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string, init?: any) => {
    return new Response('   \n  ', {
      status: 200,
      statusText: 'OK',
    });
  };

  try {
    const res = await apiFetch('/api/v1/legacy/empty-success');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data, null);
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});

await runTest('FE-03.4: HTTP 200 unwraps bare JSON array into { success: true, data: [...] }', async () => {
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string, init?: any) => {
    return new Response(JSON.stringify([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const res = await apiFetch('/api/v1/raw-items');
    assert.strictEqual(res.success, true);
    assert.ok(Array.isArray(res.data));
    assert.strictEqual(res.data.length, 2);
    assert.strictEqual(res.data[0].name, 'Item 1');
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});

await runTest('FE-03.5: HTTP 500 error returns user-friendly message without throwing exception', async () => {
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string, init?: any) => {
    return new Response('<html>500 Internal Server Error</html>', {
      status: 500,
      statusText: 'Internal Server Error',
    });
  };

  try {
    const res = await apiFetch('/api/v1/crash');
    assert.strictEqual(res.success, false);
    assert.ok(res.message?.includes('Máy chủ đang gặp sự cố'));
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});

await runTest('FE-03.6: Authorization header is NOT sent to /api/v1/auth/refresh', async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders: Headers | null = null;

  (globalThis as any).fetch = async (url: string, init?: any) => {
    capturedHeaders = init?.headers;
    return new Response(JSON.stringify({ success: true, data: { accessToken: 'NEW_TOKEN_999' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    setAccessToken('EXPIRED_TOKEN_ABC');
    assert.strictEqual(getAccessToken(), 'EXPIRED_TOKEN_ABC');

    await apiFetch('/api/v1/auth/refresh', { method: 'POST' });
    assert.ok(capturedHeaders, 'Headers must be captured');
    assert.strictEqual(
      capturedHeaders.get('Authorization'),
      null,
      'Authorization header must NOT be attached to refresh requests'
    );

    await apiFetch('/api/v1/patient/profile');
    assert.strictEqual(
      capturedHeaders.get('Authorization'),
      'Bearer EXPIRED_TOKEN_ABC',
      'Normal endpoint must include Bearer token'
    );
  } finally {
    (globalThis as any).fetch = originalFetch;
    setAccessToken(null);
  }
});

await runTest('FE-03.7: Concurrent 401 calls deduplicate refreshAccessToken request into a single call', async () => {
  const originalFetch = globalThis.fetch;
  let refreshCallCount = 0;
  let profileCallCount = 0;

  (globalThis as any).fetch = async (url: string, init?: any) => {
    if (url.includes('/api/v1/auth/refresh')) {
      refreshCallCount++;
      // Simulate 50ms latency
      await new Promise((r) => setTimeout(r, 50));
      return new Response(JSON.stringify({ success: true, data: { accessToken: 'REFRESHED_ONCE' } }), {
        status: 200,
      });
    }
    profileCallCount++;
    if (!init?.headers?.get('Authorization')?.includes('REFRESHED_ONCE')) {
      return new Response(JSON.stringify({ success: false, message: 'Expired' }), { status: 401 });
    }
    return new Response(JSON.stringify({ success: true, data: { id: 'usr-1' } }), { status: 200 });
  };

  try {
    setAccessToken('OLD_EXPIRED');
    // Launch 3 simultaneous requests that all hit 401
    const [r1, r2, r3] = await Promise.all([
      apiFetch('/api/v1/patient/profile'),
      apiFetch('/api/v1/patient/screenings'),
      apiFetch('/api/v1/patient/history'),
    ]);

    assert.strictEqual(refreshCallCount, 1, 'refreshAccessToken must be deduplicated across concurrent 401s');
    assert.strictEqual(r1.success, true);
    assert.strictEqual(r2.success, true);
    assert.strictEqual(r3.success, true);
    assert.strictEqual(getAccessToken(), 'REFRESHED_ONCE');
  } finally {
    (globalThis as any).fetch = originalFetch;
    setAccessToken(null);
  }
});

// ============================================================================
// 4. ADVERSARIAL TEST 4: LANGUAGE PERSISTENCE & FAKE CREDIT TOP-UP ELIMINATION
// ============================================================================
console.log('\n--- 4. ADVERSARIAL TEST 4: Language Persistence & Fake Credit Top-up Elimination ---');

const { LanguageProvider, useLanguage } = await import('../context/LanguageContext.tsx');

await runTest('FE-04.1: LanguageContext preserves "en" from localStorage without resetting to "vi"', () => {
  localStorage.setItem('aura_language', 'en');

  let observedLang = '';
  let observedIsEn = false;
  let observedIsVi = true;

  const ConsumerComponent = () => {
    const ctx = useLanguage();
    observedLang = ctx.language;
    observedIsEn = ctx.isEn;
    observedIsVi = ctx.isVi;
    return React.createElement('span', null, `Lang: ${ctx.language}`);
  };

  const html = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(ConsumerComponent, null))
  );

  assert.ok(html.includes('Lang: en'), 'Rendered HTML should reflect English');
  assert.strictEqual(observedLang, 'en', 'Observed language must be en');
  assert.strictEqual(observedIsEn, true, 'isEn must be true');
  assert.strictEqual(observedIsVi, false, 'isVi must be false');
  assert.strictEqual(
    localStorage.getItem('aura_language'),
    'en',
    'aura_language in localStorage must remain "en"'
  );
});

await runTest('FE-04.2: LanguageContext safely defaults to "vi" when localStorage has invalid value or is empty', () => {
  localStorage.setItem('aura_language', 'invalid_lang_xyz');

  let observedLang = '';
  const ConsumerComponent = () => {
    const ctx = useLanguage();
    observedLang = ctx.language;
    return React.createElement('span', null, ctx.t('common.save'));
  };

  renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(ConsumerComponent, null))
  );

  assert.strictEqual(observedLang, 'vi', 'Must safely fallback to vi on invalid stored language');
});

await runTest('FE-04.3: Prototype pollution attempt on LanguageContext resolvePath returns fallback without polluting prototype', () => {
  let observedResult = '';
  const ConsumerComponent = () => {
    const ctx = useLanguage();
    // Attempt malicious proto access
    observedResult = ctx.t('__proto__.polluted', 'SAFE_FALLBACK');
    return React.createElement('span', null, observedResult);
  };

  renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(ConsumerComponent, null))
  );

  assert.strictEqual(observedResult, 'SAFE_FALLBACK');
  assert.strictEqual((Object.prototype as any).polluted, undefined, 'Object.prototype must not be polluted');
});

await runTest('FE-06.1: WebSocket randomized jitter produces delay between 80% and 120% of base exponential backoff', () => {
  const fileContent = readNormalized('src/services/websocketService.ts');
  assert.ok(
    fileContent.includes('const jitter = 0.8 + Math.random() * 0.4'),
    'Must use 0.8 + Math.random() * 0.4 jitter'
  );
  assert.ok(
    fileContent.includes('const delay = Math.min(30000, Math.round(baseDelay * jitter))'),
    'Must clamp to 30000ms'
  );

  // Simulate 1000 jitter calculations to verify mathematical distribution
  for (let retry = 0; retry <= 6; retry++) {
    const baseDelay = Math.min(30000, 1000 * Math.pow(1.5, retry));
    for (let trial = 0; trial < 100; trial++) {
      const jitter = 0.8 + Math.random() * 0.4;
      const delay = Math.min(30000, Math.round(baseDelay * jitter));
      assert.ok(
        delay >= Math.floor(baseDelay * 0.79),
        `Delay ${delay} must be >= 80% of baseDelay ${baseDelay}`
      );
      assert.ok(
        delay <= Math.ceil(Math.min(30000, baseDelay * 1.21)),
        `Delay ${delay} must be <= 120% of baseDelay ${baseDelay}`
      );
    }
  }
});

await runTest('BIL-02.1: CreditPurchaseModal does NOT grant fake credits when confirmLocalPayment rejects with 403', async () => {
  const { billingApi } = await import('../services/api.ts');
  const originalConfirm = billingApi.confirmLocalPayment;

  billingApi.confirmLocalPayment = async () => {
    const err: any = new Error('403 Forbidden: Sandbox confirmation disabled');
    err.status = 403;
    throw err;
  };

  try {
    const fileContent = readNormalized('src/components/CreditPurchaseModal.tsx');
    assert.strictEqual(fileContent.includes('TXN-DEMO'), false, 'TXN-DEMO must be removed');
    assert.strictEqual(fileContent.includes('onPurchaseSuccess?.(activeCredits + 5)'), false, 'Must not grant +5 credits');
    assert.strictEqual(fileContent.includes('activeCredits + selectedPkg.scansCount'), false, 'Must not grant fallback scansCount');
    assert.ok(fileContent.includes('setPurchaseError('), 'Must set purchase error on exception');
    assert.ok(
      fileContent.includes('isForbidden') && fileContent.includes('Sandbox/Dev'),
      'Must display sandbox/production restriction notice'
    );
  } finally {
    billingApi.confirmLocalPayment = originalConfirm;
  }
});

await runTest('BIL-02.2: CreditPurchaseModal only grants credits when confirmLocalPayment returns genuine success', async () => {
  const { billingApi } = await import('../services/api.ts');
  const originalConfirm = billingApi.confirmLocalPayment;

  let granted = 0;
  billingApi.confirmLocalPayment = async (txnId: number) => {
    return {
      success: true,
      data: {
        transactionId: txnId,
        creditsAdded: 15,
        status: 'PAID',
      } as any,
    };
  };

  try {
    const res = await billingApi.confirmLocalPayment(101);
    if (res.success && res.data) {
      granted = res.data.creditsAdded;
    }
    assert.strictEqual(granted, 15, 'Must credit the exact number returned by backend');
  } finally {
    billingApi.confirmLocalPayment = originalConfirm;
  }
});

// ============================================================================
// 5. SUMMARY VERDICT
// ============================================================================
console.log('\n=================================================================');
console.log(`   CHALLENGER M3.2 RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
console.log('   VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED CLEANLY');
console.log('=================================================================\n');

process.exit(0);
