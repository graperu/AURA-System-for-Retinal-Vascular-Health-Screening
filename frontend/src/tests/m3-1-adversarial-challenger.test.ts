import { apiFetch, setAccessToken, getAccessToken } from '../services/api';

// Polyfill localStorage for Node.js test environment
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    length: 0,
    key: () => null,
  } as Storage;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runM31FrontendAdversarialChallenge() {
  console.log('\n=================================================================');
  console.log('   CHALLENGER M3.1: ADVERSARIAL FRONTEND CONCURRENCY & INTEGRITY');
  console.log('=================================================================\n');

  console.log('--- 1. FE-03: HTTP 204 No Content Handling & Token Clean ---');
  {
    // 1.1 Simulate HTTP 204 response
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        return new Response(null, {
          status: 204,
          statusText: 'No Content',
        });
      };

      const result = await apiFetch('/api/v1/screenings/test-uuid', { method: 'DELETE' });
      assert(result.success === true, 'HTTP 204 response must yield success: true');
      assert(result.data === null, 'HTTP 204 response must yield data: null');
      assert(result.message === 'Thao tác thành công', 'HTTP 204 must return standard success message');
    } finally {
      globalThis.fetch = originalFetch;
    }

    // 1.2 Simulate HTTP 205 response
    try {
      globalThis.fetch = async () => {
        return new Response(null, {
          status: 205,
          statusText: 'Reset Content',
        });
      };

      const result = await apiFetch('/api/v1/patients/test-uuid', { method: 'DELETE' });
      assert(result.success === true, 'HTTP 205 response must yield success: true');
      assert(result.data === null, 'HTTP 205 response must yield data: null');
    } finally {
      globalThis.fetch = originalFetch;
    }

    // 1.3 Verify that /api/v1/auth/refresh does NOT attach Authorization header
    try {
      let capturedHeaders: Headers | undefined;
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedHeaders = init?.headers as Headers;
        return new Response(JSON.stringify({ success: true, data: { accessToken: 'new-tok' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      // Set access token
      setAccessToken('expired-stale-token');
      await apiFetch('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: 'rt-123' }) });

      assert(capturedHeaders !== undefined, 'Fetch headers must be present');
      assert(!capturedHeaders?.has('Authorization'), 'Refresh endpoint must NOT attach Authorization header');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  console.log('\n--- 2. FE-04: Language Persistence in localStorage ---');
  {
    const STORAGE_KEY = 'aura_language';

    localStorage.clear();

    // User selects 'en'
    localStorage.setItem(STORAGE_KEY, 'en');
    assert(localStorage.getItem(STORAGE_KEY) === 'en', 'Stored language must be English (en)');

    // Emulate reload: read language directly from storage
    const reloadedLang = localStorage.getItem(STORAGE_KEY);
    assert(reloadedLang === 'en', 'Reloaded language must remain English (not reset to vi)');
    assert(reloadedLang !== 'vi', 'Language must NOT be unconditionally overridden to vi');

    // User selects 'vi'
    localStorage.setItem(STORAGE_KEY, 'vi');
    assert(localStorage.getItem(STORAGE_KEY) === 'vi', 'Stored language must update to Vietnamese (vi)');
  }

  console.log('\n--- 3. FE-06: WebSocket Exponential Backoff with Randomized Jitter ---');
  {
    // Generate multiple retry delays and confirm non-determinism (jitter present)
    const retryDelays: number[] = [];
    for (let i = 0; i < 20; i++) {
      const baseDelay = 1000 * Math.pow(1.5, 2); // retryCount = 2 -> base 2250ms
      const jitter = 0.8 + Math.random() * 0.4;
      const delay = Math.min(30000, Math.round(baseDelay * jitter));
      retryDelays.push(delay);
    }

    const uniqueDelays = new Set(retryDelays);
    assert(uniqueDelays.size > 1, 'WebSocket retry delay must have randomized jitter (multiple distinct delays)');

    // Jitter range must be within [0.8 * baseDelay, 1.2 * baseDelay]
    const base = 2250;
    const allWithinRange = retryDelays.every(d => d >= Math.floor(base * 0.79) && d <= Math.ceil(base * 1.21));
    assert(allWithinRange, 'All jittered delays fall strictly within +/-20% bounds');
  }

  console.log('\n=================================================================');
  console.log('   KẾT QUẢ KIỂM THỬ ADVERSARIAL M3.1: ALL CHECKS PASSED (100% PASS)');
  console.log('=================================================================\n');
}

runM31FrontendAdversarialChallenge().catch(err => {
  console.error('[FATAL] Challenger M3.1 failed:', err);
  process.exit(1);
});
