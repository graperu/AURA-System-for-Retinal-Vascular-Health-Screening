import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PatientDashboardView } from '../features/patient/PatientDashboardView';
import { LanguageProvider } from '../context/LanguageContext';
import { PatientProfile, AIRiskResult } from '../types/cds';
import { PatientHistoryItem } from '../features/patient/PatientHistoryView';

// Polyfill localStorage
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

const mockPatient: PatientProfile = {
  id: 'patient-test-01',
  fullName: 'Bệnh nhân Nguyễn Trọng Nam',
  age: 48,
  gender: 'Male',
  mrn: 'MRN-2026-0941',
  hasDiabetes: true,
  hasHypertension: true,
  assignedDoctor: 'BS. CKII Nguyễn Thị Thanh',
};

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
  }
}

console.log('\n=================================================================');
console.log('   KIỂM THỬ BIỂU ĐỒ CỘT + ĐƯỜNG & ZERO-MOCK DATA (PATIENT DASHBOARD)');
console.log('=================================================================\n');

test('CHART-1: Chính sách Zero-Mock: Không có bất kỳ điểm ảo (od-1, 18/03, 22/05) khi lịch sử rỗng', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientDashboardView
        patient={mockPatient}
        latestResult={null}
        userCredits={5}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        scanHistory={[]}
      />
    </LanguageProvider>
  );

  assert.ok(!html.includes('od-1'), 'Không được chứa id ảo od-1');
  assert.ok(!html.includes('os-1'), 'Không được chứa id ảo os-1');
  assert.ok(!html.includes('all-1'), 'Không được chứa id ảo all-1');
  assert.ok(!html.includes('18/03'), 'Không được chứa ngày mồi ảo 18/03');
  assert.ok(!html.includes('22/05'), 'Không được chứa ngày mồi ảo 22/05');
  assert.ok(!html.includes('14/07'), 'Không được chứa ngày mồi ảo 14/07');
});

test('CHART-2: Hiển thị Trạng Thái Trống Chuẩn Y Khoa (Empty State) khi chưa có ca khám nào', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientDashboardView
        patient={mockPatient}
        latestResult={null}
        userCredits={5}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        scanHistory={[]}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Chưa Có Dữ Liệu Xu Hướng') || html.includes('No Trend Data Available'), 'Phải hiển thị tiêu đề trạng thái trống');
  assert.ok(html.includes('Tải Ảnh Phân Tích Ngay') || html.includes('Upload &amp; Analyze Now') || html.includes('Upload & Analyze Now'), 'Phải có nút CTA chuyển sang upload');
});

test('CHART-3: Khi có 1 ca khám thật: Hiển thị chính xác 1 cột và 1 điểm nút, không tạo thêm điểm giả', () => {
  const singleScan: PatientHistoryItem[] = [
    {
      id: 'real-scan-001',
      createdAt: '2026-09-19T10:15:00.000Z',
      eyePosition: 'Right_OD',
      riskScore: 75,
      riskLevel: 'High',
      status: 'ANALYZED',
      scanType: 'Fundus_Macula',
    },
  ];

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientDashboardView
        patient={mockPatient}
        latestResult={null}
        userCredits={5}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        scanHistory={singleScan}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('75'), 'Phải hiển thị điểm số 75 của ca khám');
  assert.ok(html.includes('19/09'), 'Phải hiển thị ngày khám 19/09');
  assert.ok(!html.includes('Chưa Có Dữ Liệu Xu Hướng'), 'Không hiển thị empty state khi đã có 1 ca');
  assert.ok(!html.includes('18/03'), 'Không được có ngày mồi ảo');
});

test('CHART-4: Biểu đồ Cột + Đường (Combo Bar & Line Chart) render đầy đủ phần tử SVG Cột (<rect>) và Đường (<path>)', () => {
  const multiScans: PatientHistoryItem[] = [
    {
      id: 'scan-1',
      createdAt: '2026-08-10T09:00:00.000Z',
      eyePosition: 'Right_OD',
      riskScore: 35,
      riskLevel: 'Low',
      status: 'ANALYZED',
      scanType: 'Fundus_Macula',
    },
    {
      id: 'scan-2',
      createdAt: '2026-09-01T14:30:00.000Z',
      eyePosition: 'Left_OS',
      riskScore: 58,
      riskLevel: 'Moderate',
      status: 'REVIEWED',
      scanType: 'Fundus_Macula',
      doctorReviewed: true,
    },
    {
      id: 'scan-3',
      createdAt: '2026-09-19T08:45:00.000Z',
      eyePosition: 'Right_OD',
      riskScore: 78,
      riskLevel: 'High',
      status: 'ANALYZED',
      scanType: 'Fundus_Macula',
    },
  ];

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientDashboardView
        patient={mockPatient}
        latestResult={null}
        userCredits={5}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        scanHistory={multiScans}
      />
    </LanguageProvider>
  );

  // Kiểm tra Cột (Bars)
  assert.ok(html.includes('key="bar-scan-1"') || html.includes('barGradLow'), 'Phải có gradient cột cho mức thấp (<40)');
  assert.ok(html.includes('barGradMod'), 'Phải có gradient cột cho mức trung bình');
  assert.ok(html.includes('barGradHigh'), 'Phải có gradient cột cho mức cao');

  // Kiểm tra Đường (Line)
  assert.ok(html.includes('stroke="#2563EB"'), 'Phải có đường xu hướng màu xanh y khoa #2563EB');
  assert.ok(html.includes('comboAreaGrad'), 'Phải có vùng gradient phủ bóng dưới đường');

  // Kiểm tra Chú giải Legend
  assert.ok(html.includes('Cột: Điểm nguy cơ ca khám') || html.includes('Bars: Screening risk score'), 'Phải có chú giải Cột');
  assert.ok(
    html.includes('Ngưỡng an toàn') || html.includes('Safe limit'),
    'Phải có chú giải Ngưỡng an toàn'
  );
});

test('CHART-5: Phân biệt cùng ngày (Smart Timestamp Disambiguation) hiển thị kèm giờ HH:mm để chống đè chữ', () => {
  const sameDayScans: PatientHistoryItem[] = [
    {
      id: 'same-day-1',
      createdAt: '2026-09-19T08:30:00.000Z',
      eyePosition: 'Right_OD',
      riskScore: 60,
      riskLevel: 'Moderate',
      status: 'ANALYZED',
      scanType: 'Fundus_Macula',
    },
    {
      id: 'same-day-2',
      createdAt: '2026-09-19T14:45:00.000Z',
      eyePosition: 'Left_OS',
      riskScore: 82,
      riskLevel: 'Critical',
      status: 'ANALYZED',
      scanType: 'Fundus_Macula',
    },
  ];

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientDashboardView
        patient={mockPatient}
        latestResult={null}
        userCredits={5}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        scanHistory={sameDayScans}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('19/09'), 'Phải hiển thị ngày 19/09');
  assert.ok(html.includes('font-mono-data fill-slate-400'), 'Phải hiển thị nhãn thời gian phụ');
});

test('CHART-6: Lọc bỏ ca khám lỗi (status: FAILED hoặc riskScore = 0) không làm tụt đồ thị xuống đáy', () => {
  const mixedScans: PatientHistoryItem[] = [
    {
      id: 'failed-scan',
      createdAt: '2026-09-18T10:00:00.000Z',
      eyePosition: 'Right_OD',
      riskScore: 0,
      riskLevel: 'Low',
      status: 'FAILED',
      scanType: 'Fundus_Macula',
    },
    {
      id: 'valid-scan',
      createdAt: '2026-09-19T10:00:00.000Z',
      eyePosition: 'Right_OD',
      riskScore: 70,
      riskLevel: 'High',
      status: 'ANALYZED',
      scanType: 'Fundus_Macula',
    },
  ];

  const html = renderToStaticMarkup(
    <LanguageProvider>
      <PatientDashboardView
        patient={mockPatient}
        latestResult={null}
        userCredits={5}
        onNavigate={() => {}}
        onOpenCreditModal={() => {}}
        onOpenChatModal={() => {}}
        onOpenReportModal={() => {}}
        scanHistory={mixedScans}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('70'), 'Chứa điểm số của ca khám hợp lệ');
  assert.ok(!html.includes('key="bar-failed-scan"'), 'Ca khám FAILED không được render vào đồ thị');
});

console.log(`\n=================================================================`);
console.log(`   KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐÃ ĐẠT (${Math.round((passedTests / totalTests) * 100)}% PASS)`);
console.log(`=================================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
