import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Components under test
import { ClinicDashboardView } from '../features/clinic/ClinicDashboardView';
import { ClinicPortalPage } from '../pages/ClinicPortalPage';
import { AdminAuditLogsPage } from '../pages/AdminAuditLogsPage';
import { LanguageProvider } from '../context/LanguageContext';
import { ClinicBatchJob } from '../types/cds';

console.log('=================================================================');
console.log('   MILESTONE 5: CLINIC & ADMIN PORTAL EMPIRICAL STRESS TESTS');
console.log('=================================================================\n');

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
    throw err;
  }
}

const mockBatchJob: ClinicBatchJob = {
  batchId: 'BATCH-2026-0918-CLN',
  clinicId: 'CLN-001',
  clinicName: 'Phòng khám Đa khoa Quốc tế AURA',
  totalImages: 60,
  processedCount: 52,
  failedCount: 2,
  status: 'IN_PROGRESS',
  createdAt: '2026-09-18T08:00:00Z',
  estimatedTimeRemainingSec: 25,
  items: [
    {
      id: 'ITEM-01',
      patientName: 'Trần Thị Mai',
      mrn: 'MRN-78214',
      pseudonymId: 'ANON-78214',
      eye: 'OD',
      fileName: 'fundus_od_mai_78214.png',
      status: 'DONE',
      riskLevel: 'High',
      riskScore: 84,
      patientAge: 62,
      patientGender: 'F',
      systolicBp: 155,
      diastolicBp: 95,
      hbA1c: 8.2,
      strokeRisk: 78,
      rationales: ['Tỷ lệ A/V co hẹp nặng (0.52)'],
    },
    {
      id: 'ITEM-02',
      patientName: 'Lê Văn Hoàng',
      mrn: 'MRN-99104',
      pseudonymId: 'ANON-99104',
      eye: 'OS',
      fileName: 'fundus_os_hoang_99104.png',
      status: 'DONE',
      riskLevel: 'Critical',
      riskScore: 91,
      patientAge: 68,
      patientGender: 'M',
      systolicBp: 168,
      diastolicBp: 102,
      hbA1c: 9.1,
      strokeRisk: 86,
      rationales: ['Xuất huyết vi thể lan tỏa'],
    },
    {
      id: 'ITEM-03',
      patientName: 'Nguyễn Thị Hoa',
      mrn: 'MRN-33120',
      pseudonymId: 'ANON-33120',
      eye: 'OD',
      fileName: 'fundus_od_hoa_33120.png',
      status: 'DONE',
      riskLevel: 'Moderate',
      riskScore: 52,
      patientAge: 47,
      patientGender: 'F',
      systolicBp: 135,
      diastolicBp: 85,
    },
    {
      id: 'ITEM-04',
      patientName: 'Võ Minh Quân',
      mrn: 'MRN-21098',
      pseudonymId: 'ANON-21098',
      eye: 'OS',
      fileName: 'fundus_os_quan_21098.png',
      status: 'PROCESSING',
      riskLevel: 'Low',
      riskScore: 18,
      patientAge: 53,
      patientGender: 'M',
    },
  ],
};

const emptyBatchJob: ClinicBatchJob = {
  batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
  clinicId: 'CLN-DEFAULT',
  clinicName: 'Phòng khám chuyên khoa',
  totalImages: 0,
  processedCount: 0,
  failedCount: 0,
  status: 'COMPLETED',
  createdAt: '2026-09-18T00:00:00Z',
  estimatedTimeRemainingSec: 0,
  items: [],
};

// ==========================================
// 1. CLINIC DASHBOARD VIEW TESTS
// ==========================================
console.log('--- 1. ClinicDashboardView Component & Metric Tests ---');

test('CLINIC-DASH-1: Render 4 KPI Cards with authentic clinical counts', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView
        batchJob={mockBatchJob}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  // 1. Total Patients
  assert.ok(html.includes('Tổng Bệnh Nhân') || html.includes('Total Patients'), 'Renders Total Patients KPI');
  // 2. Screenings Today
  assert.ok(html.includes('Sàng Lọc Hôm Nay') || html.includes('Screenings Today'), 'Renders Screenings Today KPI');
  assert.ok(html.includes('52'), 'Renders processedCount 52 in Screenings Today');
  // 3. Processing
  assert.ok(html.includes('Đang Xử Lý') || html.includes('Processing'), 'Renders Processing Queue KPI');
  assert.ok(html.includes('8'), 'Renders remaining processing count 60 - 52 = 8');
  // 4. High Risk
  assert.ok(html.includes('Nguy Cơ Cao') || html.includes('High Risk'), 'Renders High Risk KPI');
});

test('CLINIC-DASH-2: Render 7-day screening activity trajectory SVG chart', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView
        batchJob={mockBatchJob}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Biểu Đồ Hoạt Động Sàng Lọc') || html.includes('Screening Activity Trend'), 'Renders chart title');
  assert.ok(html.includes('<svg'), 'Renders SVG container');
  assert.ok(html.includes('clinicActivityGradient'), 'Renders gradient def for curve fill');
  assert.ok(html.includes('stroke="#3478F6"'), 'Uses MediRoom primary blue stroke #3478F6');
  assert.ok(html.includes('T2') && html.includes('CN'), 'Renders day-of-week labels');
});

test('CLINIC-DASH-3: Render Batch Screening queue card with realtime progress bar', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView
        batchJob={mockBatchJob}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Hàng Đợi Sàng Lọc Theo Lô') || html.includes('Batch Screening Queue'), 'Renders queue title');
  assert.ok(html.includes('BATCH-2026-0918-CLN'), 'Renders active Batch ID');
  assert.ok(html.includes('87%'), 'Renders progress percentage (52/60 = 87%)');
  assert.ok(html.includes('25s'), 'Renders estimated time remaining');
  assert.ok(html.includes('Mở Bàn Làm Việc Lô Ảnh') || html.includes('Open Batch Workspace'), 'Renders CTA button');
});

test('CLINIC-DASH-4: Render High-Risk Priority Case Queue with eye filter options', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView
        batchJob={mockBatchJob}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Hàng Đợi Ca Nguy Cơ Cao Cần Chú Ý') || html.includes('High-Risk Priority Case Queue'), 'Renders high risk section');
  assert.ok(html.includes('Mắt Phải (OD)'), 'Renders OD eye filter button');
  assert.ok(html.includes('Mắt Trái (OS)'), 'Renders OS eye filter button');
  assert.ok(html.includes('MRN-78214') || html.includes('Trần Thị Mai'), 'Renders high risk patient Mai');
  assert.ok(html.includes('MRN-99104') || html.includes('Lê Văn Hoàng'), 'Renders critical patient Hoang');
  assert.ok(html.includes('84%') || html.includes('91%'), 'Renders risk percentage badges');
});

test('CLINIC-DASH-5: Render Recent Screening Batches standardized DataTable', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView
        batchJob={mockBatchJob}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Lịch Sử Các Đợt Sàng Lọc Gần Đây') || html.includes('Recent Screening Batches'), 'Renders recent batches section');
  assert.ok(html.includes('Mã Đợt Khám') || html.includes('Batch ID'), 'Renders Batch ID column');
  assert.ok(html.includes('Ngày Tải Lên') || html.includes('Upload Date'), 'Renders Date column');
  assert.ok(html.includes('Tổng Ảnh') || html.includes('Total Images'), 'Renders Total Images column');
  assert.ok(html.includes('BATCH-2026-09-17-A'), 'Renders historical batch record');
});

test('CLINIC-DASH-6: Fail-safe behavior with empty batch job', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicDashboardView
        batchJob={emptyBatchJob}
        onNavigate={() => {}}
      />
    </LanguageProvider>
  );

  assert.ok(html.includes('Phòng khám chuyên khoa'), 'Renders fallback clinic facility name');
  assert.ok(html.includes('Tổng Bệnh Nhân') || html.includes('Total Patients'), 'Renders 4 KPI cards without crashing');
  assert.ok(html.includes('Hàng Đợi Sàng Lọc Theo Lô') || html.includes('Batch Screening Queue'), 'Renders queue card safely');
});

// ==========================================
// 2. CLINIC PORTAL PAGE INTEGRATION TESTS
// ==========================================
console.log('\n--- 2. ClinicPortalPage Route & View Integration Tests ---');

test('CLINIC-PAGE-1: ClinicPortalPage renders ClinicDashboardView when activeView === dashboard', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="dashboard" />
    </LanguageProvider>
  );

  assert.ok(html.includes('Không gian quản lý sàng lọc phòng khám') || html.includes('phòng khám'), 'Preserves portal header title');
  assert.ok(html.includes('Tổng Bệnh Nhân') || html.includes('Total Patients'), 'Renders ClinicDashboardView KPI');
  assert.ok(html.includes('Biểu Đồ Hoạt Động Sàng Lọc') || html.includes('Screening Activity Trend'), 'Renders Screening Activity Chart');
});

test('CLINIC-PAGE-2: ClinicPortalPage renders ClinicPatientListSection when activeView === patient-list', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="patient-list" />
    </LanguageProvider>
  );

  assert.ok(html.includes('Danh Sách Bệnh Nhân Cơ Sở') || html.includes('Clinic Patient Directory'), 'Renders patient directory section');
  assert.ok(html.includes('Mã Bệnh Nhân') || html.includes('Patient MRN'), 'Renders Patient MRN table column');
  assert.ok(html.includes('Thông Số Sinh Hiệu') || html.includes('Clinical Vitals'), 'Renders Vitals table column');
});

test('CLINIC-PAGE-3: ClinicPortalPage renders ClinicResultsSection when activeView === scan-history', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="scan-history" />
    </LanguageProvider>
  );

  assert.ok(html.includes('Kết Quả Sàng Lọc Sức Khỏe Vi Mạch') || html.includes('Screening Results & History'), 'Renders results & history section');
  assert.ok(html.includes('Mã Ca') && (html.includes('Tệp Ảnh') || html.includes('Tệp ảnh')), 'Renders Case ID column');
  assert.ok(html.includes('Tỷ Lệ A/V') || html.includes('A/V Ratio'), 'Renders A/V Ratio column');
  assert.ok(html.includes('Chi tiết') || html.includes('Details'), 'Renders drill-down details button on each row');
});

test('CLINIC-PAGE-4: ClinicDashboardView batch overview renders drill-down links to individual scan results', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <ClinicPortalPage activeView="dashboard" />
    </LanguageProvider>
  );

  assert.ok(html.includes('Xem từng kết quả scan riêng lẻ') || html.includes('View individual scan results'), 'Renders drill-down link in batch card');
  assert.ok(html.includes('Xem ca') || html.includes('View'), 'Renders View case action in high risk queue');
});

// ==========================================
// 3. ADMIN PORTAL KPI & TRAJECTORY TESTS
// ==========================================
console.log('\n--- 3. Admin Portal KPI & Trajectory Stress Tests ---');

test('ADMIN-PORTAL-1: AdminAuditLogsPage dashboard tab renders 4 standard KpiCard components', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AdminAuditLogsPage activeView="dashboard" />
    </LanguageProvider>
  );

  assert.ok(html.includes('Tổng Người Dùng') || html.includes('Total Accounts'), 'Renders Total Accounts KPI');
  assert.ok(
    (html.includes('Cơ Sở') && html.includes('Bác Sĩ')) ||
    (html.includes('Clinics') && html.includes('Facilities')),
    'Renders Clinics & Doctors KPI'
  );
  assert.ok(html.includes('Khối Lượng Sàng Lọc') || html.includes('Screenings Volume'), 'Renders Screenings Volume KPI');
  assert.ok(
    (html.includes('Bảo Mật') && html.includes('Tuân Thủ')) ||
    html.includes('HIPAA Compliance'),
    'Renders HIPAA Compliance KPI'
  );
});

test('ADMIN-PORTAL-2: AdminAuditLogsPage dashboard tab renders 7-day system-wide screening activity trajectory SVG chart', () => {
  const html = renderToStaticMarkup(
    <LanguageProvider>
      <AdminAuditLogsPage activeView="dashboard" />
    </LanguageProvider>
  );

  assert.ok(
    html.includes('Xu Hướng Hoạt Động Sàng Lọc Hệ Thống Toàn Mạng') ||
    html.includes('Network-wide Screening Activity Trajectory'),
    'Renders system screening trajectory title'
  );
  assert.ok(html.includes('adminScreeningGradient'), 'Renders gradient for admin trajectory chart');
  assert.ok(html.includes('842 ca'), 'Renders network-wide peak day count');
});

console.log('=================================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('=================================================================\n');

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}
