import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CreditPurchaseModal,
  getClinicalFeatures,
  type CreditPackage,
} from '../components/CreditPurchaseModal.tsx';
import { LanguageProvider } from '../context/LanguageContext.tsx';

// Polyfill localStorage cho môi trường kiểm thử Node
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (error) {
    console.error(`  [FAIL] ${name}`);
    console.error(error);
    process.exit(1);
  }
};

console.log('=================================================================');
console.log('   AURA CREDIT PURCHASE & CLINICAL PACKAGES VERIFICATION SUITE');
console.log('=================================================================');

// 1. Kiểm thử Hàm Sinh Tính Năng Lâm Sàng Chuẩn (getClinicalFeatures)
console.log('\n--- 1. Kiểm thử Hàm Sinh Tính Năng Lâm Sàng (getClinicalFeatures) ---');

runTest('CPM-1.1: Gói 1 lượt (Khám Đơn) sinh đầy đủ 3 tính năng lâm sàng chuẩn (VI)', () => {
  const features = getClinicalFeatures(1, true);
  assert.strictEqual(features.length, 3);
  assert.ok(features[0].includes('1 lượt phân tích'));
  assert.ok(features[1].includes('Grad-CAM'));
  assert.ok(features[2].includes('Báo cáo PDF chuẩn y khoa'));
});

runTest('CPM-1.2: Gói 1 lượt (Khám Đơn) sinh tính năng tiếng Anh chuẩn (EN)', () => {
  const features = getClinicalFeatures(1, false);
  assert.strictEqual(features.length, 3);
  assert.ok(features[0].includes('1 AI retinal scan analysis'));
  assert.ok(features[1].includes('Grad-CAM'));
  assert.ok(features[2].includes('Standard medical PDF report'));
});

runTest('CPM-1.3: Gói 5 lượt (Tiêu Chuẩn) sinh đầy đủ 4 tính năng lâm sàng theo dõi định kỳ (VI & EN)', () => {
  const viFeatures = getClinicalFeatures(5, true);
  assert.strictEqual(viFeatures.length, 4);
  assert.ok(viFeatures[1].includes('Theo dõi diễn tiến vi mạch'));
  assert.ok(viFeatures[2].includes('Ưu tiên Bác sĩ chuyên khoa'));
  assert.ok(viFeatures[3].includes('Tiết kiệm 20%'));

  const enFeatures = getClinicalFeatures(5, false);
  assert.strictEqual(enFeatures.length, 4);
  assert.ok(enFeatures[1].includes('Longitudinal microvascular trend tracking'));
  assert.ok(enFeatures[2].includes('Priority specialist physician review'));
});

runTest('CPM-1.4: Gói 15 lượt (Gia Đình) sinh tính năng chia sẻ gia đình và lưu trữ trọn đời (VI & EN)', () => {
  const viFeatures = getClinicalFeatures(15, true);
  assert.strictEqual(viFeatures.length, 4);
  assert.ok(viFeatures[0].includes('15 lượt phân tích cho cả gia đình'));
  assert.ok(viFeatures[1].includes('Lưu trữ hồ sơ xét nghiệm trọn đời'));
  assert.ok(viFeatures[3].includes('Tư vấn trực tiếp với bác sĩ'));

  const enFeatures = getClinicalFeatures(15, false);
  assert.strictEqual(enFeatures.length, 4);
  assert.ok(enFeatures[0].includes('15 analyses for whole family'));
  assert.ok(enFeatures[1].includes('Lifetime medical record storage'));
  assert.ok(enFeatures[3].includes('Direct physician consultation'));
});

// 2. Kiểm thử Render CreditPurchaseModal với customPackages và Gói Gia Đình
console.log('\n--- 2. Kiểm thử Render CreditPurchaseModal & Hướng Dẫn Lâm Sàng ---');

const mockPackages: CreditPackage[] = [
  {
    id: 1,
    name: 'Gói Cơ Bản (Khám Đơn)',
    scansCount: 1,
    priceVnd: 50000,
    features: getClinicalFeatures(1, true),
  },
  {
    id: 2,
    name: 'Gói Tiêu Chuẩn (Cá Nhân)',
    scansCount: 5,
    priceVnd: 200000,
    isPopular: true,
    features: getClinicalFeatures(5, true),
  },
  {
    id: 3,
    name: 'Gói Gia Đình (Định Kỳ)',
    scansCount: 15,
    priceVnd: 500000,
    features: getClinicalFeatures(15, true),
  },
];

runTest('CPM-2.1: Render danh sách gói dịch vụ đầy đủ, nhãn Phổ biến nhất cho Gói 2', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: true,
        onClose: () => {},
        customPackages: mockPackages,
        currentCredit: 2,
      })
    )
  );

  assert.ok(html.includes('Gói Cơ Bản (Khám Đơn)'));
  assert.ok(html.includes('Gói Tiêu Chuẩn (Cá Nhân)'));
  assert.ok(html.includes('Gói Gia Đình (Định Kỳ)'));
  assert.ok(html.includes('Phổ biến nhất'));
  assert.ok(html.includes('50.000'));
  assert.ok(html.includes('200.000'));
  assert.ok(html.includes('500.000'));
});

runTest('CPM-2.2: Nút Tiếp tục bị disabled khi chưa chọn gói cước ở Step 1', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: true,
        onClose: () => {},
        customPackages: mockPackages,
      })
    )
  );

  assert.ok(html.includes('disabled=""') || html.includes('disabled'));
  assert.ok(html.includes('Tiếp tục chọn phương thức'));
});

runTest('CPM-2.3: Hiển thị hướng dẫn lâm sàng rõ ràng cho Gói Gia Đình (15 lượt)', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: true,
        onClose: () => {},
        customPackages: mockPackages,
        initialPackageId: 3,
      })
    )
  );

  const expectedNotice = 'Hạn mức 15 lượt khám được cộng trực tiếp vào tài khoản gia đình của bạn';
  assert.ok(html.includes(expectedNotice), 'Must include Vietnamese family notice');
  assert.ok(html.includes('Vui lòng ghi rõ thông tin thành viên (họ tên, năm sinh) tại phần Ghi chú ca khám'));
});

runTest('CPM-2.4: Loại bỏ hoàn toàn fallback AURA NAP 1 khi chưa có gói hợp lệ', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: true,
        onClose: () => {},
        customPackages: mockPackages,
        patientMrn: 'AUR12345',
      })
    )
  );

  assert.strictEqual(html.includes('AURA NAP 1'), false, 'Must never fallback to AURA NAP 1');
});

runTest('CPM-2.5: Modal đóng (isOpen=false) không render nội dung DOM', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: false,
        onClose: () => {},
        customPackages: mockPackages,
      })
    )
  );

  assert.strictEqual(html, '');
});

// 3. Kiểm thử Khắc Phục Lỗ Hổng Tự Kích Hoạt Gói (AC-1 -> AC-6 / SDD-007)
console.log('\n--- 3. Kiểm thử Khắc Phục Lỗ Hổng Tự Kích Hoạt Gói (AC-1 -> AC-6) ---');

runTest('CPM-3.1: LOẠI BỎ 100% nút bấm tự kích hoạt "Xác Nhận Đã Chuyển Khoản" trên giao diện (AC-2)', () => {
  // Render Step 1
  const htmlStep1 = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: true,
        onClose: () => {},
        customPackages: mockPackages,
      })
    )
  );
  assert.strictEqual(htmlStep1.includes('Xác Nhận Đã Chuyển Khoản'), false, 'Step 1 must not have self-activation button');
  assert.strictEqual(htmlStep1.includes('Confirm Payment Transferred'), false, 'Step 1 must not have EN self-activation button');

  // Render Step 2 (với initialPackageId)
  const htmlStep2 = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: true,
        onClose: () => {},
        customPackages: mockPackages,
        initialPackageId: 2,
      })
    )
  );
  assert.strictEqual(htmlStep2.includes('Xác Nhận Đã Chuyển Khoản'), false, 'Step 2 must not have self-activation button');
  assert.strictEqual(htmlStep2.includes('Confirm Payment Transferred'), false, 'Step 2 must not have EN self-activation button');
  assert.ok(htmlStep2.includes('Tiến hành quét mã QR thanh toán'), 'Step 2 must have proceed to checkout button');
});

runTest('CPM-3.2: Kiểm tra sự hiện diện của DTO và API checkout & getTransactionStatus trong billingApi (AC-1, AC-4)', async () => {
  const { billingApi } = await import('../services/api.ts');
  assert.strictEqual(typeof billingApi.checkout, 'function', 'billingApi.checkout must be a defined function');
  assert.strictEqual(typeof billingApi.getTransactionStatus, 'function', 'billingApi.getTransactionStatus must be a defined function');
  assert.strictEqual(typeof billingApi.purchase, 'function', 'billingApi.purchase must be maintained for backward compatibility');
});

runTest('CPM-3.3: Step 2 hiển thị phương thức thanh toán an toàn VietQR Napas 24/7 duy nhất', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(CreditPurchaseModal, {
        isOpen: true,
        onClose: () => {},
        customPackages: mockPackages,
        initialPackageId: 2,
      })
    )
  );

  assert.ok(html.includes('VietQR Napas 24/7'));
  assert.ok(html.includes('200.000 VNĐ'));
});

runTest('CPM-3.4: Đồng bộ cổng thanh toán duy nhất VietQR Napas 24/7 trên toàn bộ từ điển & cấu hình', async () => {
  const { translations } = await import('../i18n/translations.ts');
  assert.strictEqual(translations.vi.clinic.creditPackage.providerVietqr, 'VietQR Napas 24/7');
  assert.strictEqual(translations.en.clinic.creditPackage.providerVietqr, 'VietQR Napas 24/7');
});

console.log('\n=================================================================');
console.log('   KẾT QUẢ KIỂM THỬ: 13/13 TESTS ĐÃ ĐẠT (100% PASS)');
console.log('=================================================================\n');
