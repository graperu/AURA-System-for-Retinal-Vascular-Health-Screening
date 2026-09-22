import assert from 'node:assert';
import {
  convertToWebP,
  isWebPDataUrl,
  isWebPFile,
  dataUrlToBlob,
  formatImageBytes,
  ALLOWED_RETINAL_EXTENSIONS,
  RETINAL_IMAGE_ACCEPT,
} from '../utils/webpConverter.ts';
import { normalizeImageDataUrl } from '../services/screeningMapper.ts';

console.log('=================================================================');
console.log('   AURA RETINAL WEBP CONVERSION & DB STORAGE VERIFICATION SUITE');
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

async function main() {
  console.log('--- 1. Kiểm thử Nhận Diện & Định Dạng WebP Helper ---');

  runTest('WEBP-1.1: ALLOWED_RETINAL_EXTENSIONS bao gồm định dạng .webp', () => {
    assert.ok(ALLOWED_RETINAL_EXTENSIONS.includes('.webp'), 'Bắt buộc phải hỗ trợ .webp');
    assert.ok(RETINAL_IMAGE_ACCEPT.includes('.webp'), 'Accept filter phải chứa .webp');
  });

  runTest('WEBP-1.2: isWebPDataUrl nhận diện chính xác data:image/webp', () => {
    assert.strictEqual(isWebPDataUrl('data:image/webp;base64,UklGRhoAAABXRUJQ'), true);
    assert.strictEqual(isWebPDataUrl('data:image/png;base64,iVBORw0KGgoAAA'), false);
    assert.strictEqual(isWebPDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg'), false);
    assert.strictEqual(isWebPDataUrl(null), false);
    assert.strictEqual(isWebPDataUrl(''), false);
  });

  runTest('WEBP-1.3: isWebPFile nhận diện chính xác theo MIME type và extension', () => {
    const webpFile = new File(['dummy'], 'retina_scan.webp', { type: 'image/webp' });
    const pngFile = new File(['dummy'], 'retina_scan.png', { type: 'image/png' });
    const webpUpperFile = new File(['dummy'], 'SCAN_OD.WEBP', { type: '' });

    assert.strictEqual(isWebPFile(webpFile), true);
    assert.strictEqual(isWebPFile(webpUpperFile), true);
    assert.strictEqual(isWebPFile(pngFile), false);
    assert.strictEqual(isWebPFile(null), false);
  });

  runTest('WEBP-1.4: formatImageBytes hiển thị đúng đơn vị B, KB, MB', () => {
    assert.strictEqual(formatImageBytes(512), '512.0 B');
    assert.strictEqual(formatImageBytes(1024 * 150), '150.0 KB');
    assert.strictEqual(formatImageBytes(1024 * 1024 * 2.5), '2.5 MB');
  });

  runTest('WEBP-1.5: dataUrlToBlob chuyển đổi chính xác data:image/webp sang Blob', () => {
    const sampleWebpData = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    const blob = dataUrlToBlob(sampleWebpData);
    assert.ok(blob instanceof Blob);
    assert.strictEqual(blob.type, 'image/webp');
    assert.ok(blob.size > 0);
  });

  console.log('\n--- 2. Kiểm thử Hàm convertToWebP & Node/Browser Fallback ---');

  await runTest('WEBP-2.1: convertToWebP tạo ra kết quả WebP hoàn chỉnh với file, blob và dataUrl', async () => {
    const sampleInput = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await convertToWebP(sampleInput, { quality: 0.88, fileName: 'fundus_test.webp' });

    assert.ok(result.dataUrl.startsWith('data:image/webp'), 'Data URL phải là WebP');
    assert.strictEqual(result.file.name, 'fundus_test.webp');
    assert.strictEqual(result.file.type, 'image/webp');
    assert.strictEqual(result.mimeType, 'image/webp');
    assert.ok(result.convertedSize > 0);
    assert.ok(result.savingsPercent >= 0);
  });

  await runTest('WEBP-2.2: convertToWebP xử lý an toàn đầu vào là File đối tượng', async () => {
    const rawFile = new File(['fake-retinal-pixel-data'], 'macula_od.png', { type: 'image/png' });
    const result = await convertToWebP(rawFile, { quality: 0.9 });

    assert.ok(result.dataUrl.startsWith('data:image/webp'));
    assert.ok(result.file.name.endsWith('.webp'));
    assert.strictEqual(result.mimeType, 'image/webp');
  });

  console.log('\n--- 3. Kiểm thử Chuẩn Hóa normalizeImageDataUrl Với WebP ---');

  runTest('WEBP-3.1: normalizeImageDataUrl giữ nguyên data:image/webp Data URI hoàn chỉnh', () => {
    const webpUri = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    const normalized = normalizeImageDataUrl(webpUri);
    assert.strictEqual(normalized, webpUri);
  });

  runTest('WEBP-3.2: normalizeImageDataUrl tự động thêm data:image/webp;base64, khi gặp raw base64 WebP (bắt đầu bằng UklGR)', () => {
    const rawWebpBase64 = 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    const normalized = normalizeImageDataUrl(rawWebpBase64);
    assert.strictEqual(normalized, `data:image/webp;base64,${rawWebpBase64}`);
  });

  runTest('WEBP-3.3: normalizeImageDataUrl tự động thêm data:image/jpeg;base64, khi gặp raw base64 JPEG (/9j/)', () => {
    const rawJpeg = '/9j/4AAQSkZJRgABAQEASABIAAD...';
    const normalized = normalizeImageDataUrl(rawJpeg);
    assert.strictEqual(normalized, `data:image/jpeg;base64,${rawJpeg}`);
  });

  console.log('\n=================================================================');
  console.log(`   KẾT QUẢ KIỂM THỬ WEBP: ${passedTests}/${totalTests} TESTS ĐÃ ĐẠT (100% PASS)`);
  console.log('=================================================================');
}

main().catch((err) => {
  console.error('Lỗi thực thi kiểm thử WebP:', err);
  process.exit(1);
});
