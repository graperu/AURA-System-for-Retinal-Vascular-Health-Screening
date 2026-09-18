import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Components under test
import { KpiCard, type KpiCardProps } from '../components/common/KpiCard';
import { SectionCard, type SectionCardProps } from '../components/common/SectionCard';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { StatusBadge, type StatusVariant } from '../components/common/StatusBadge';
import { FilterBar, type TimeRange } from '../components/common/FilterBar';
import { SearchField } from '../components/common/SearchField';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonLoading, type SkeletonVariant } from '../components/common/SkeletonLoading';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { AppLayout } from '../components/layout/AppLayout';
import { AppLayout as BridgedAppLayout, type AppLayoutProps as BridgedAppLayoutProps } from '../layouts/AppLayout';
import DefaultBridgedAppLayout from '../layouts/AppLayout';
import type { UserSession } from '../types/auth';

console.log('=================================================================');
console.log('   MILESTONE 1: CLINICAL UI & LAYOUT EMPIRICAL STRESS TESTS');
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

// Dummy user session for layout tests
const mockUser: UserSession = {
  id: 'usr-101',
  name: 'BS. Nguyễn Văn A',
  email: 'doctor@aura.vn',
  role: 'doctor',
  roleTitle: 'Bác sĩ chuyên khoa',
  organization: 'Bệnh viện Mắt',
  token: 'mock-token',
};

// ============================================================================
// 1. KPICARD EMPIRICAL STRESS TESTS
// ============================================================================
console.log('--- 1. KpiCard Stress Tests ---');

test('KPICARD-1: Positive trend rendering with explicit positive boolean', () => {
  const html = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Huyết áp trung bình',
      value: '120/80',
      unit: 'mmHg',
      icon: React.createElement('span', null, '❤️'),
      change: { value: '+5.2%', positive: true },
    })
  );

  assert.ok(html.includes('Huyết áp trung bình'), 'Contains title');
  assert.ok(html.includes('120/80'), 'Contains value');
  assert.ok(html.includes('mmHg'), 'Contains unit');
  assert.ok(html.includes('+5.2%'), 'Contains trend value');
  assert.ok(html.includes('bg-[#ECFDF3] text-[#22C55E]'), 'Green positive pill styling');
  assert.ok(html.includes('lucide-trending-up'), 'TrendingUp icon present');
});

test('KPICARD-2: Negative trend rendering with explicit negative boolean', () => {
  const html = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Tỷ lệ rủi ro CVD',
      value: '28%',
      icon: React.createElement('span', null, '⚡'),
      change: { value: '-3.4%', positive: false },
    })
  );

  assert.ok(html.includes('-3.4%'), 'Contains negative trend value');
  assert.ok(html.includes('bg-[#FEF3F2] text-[#EF4444]'), 'Red negative pill styling');
  assert.ok(html.includes('lucide-trending-down'), 'TrendingDown icon present');
});

test('KPICARD-3: Trend auto-inference from string values (+, -, neutral)', () => {
  // Positive by '+'
  const htmlPos = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Số ca khám',
      value: 124,
      icon: React.createElement('span', null, '📊'),
      trend: '+15%',
    })
  );
  assert.ok(htmlPos.includes('bg-[#ECFDF3] text-[#22C55E]'), 'Positive inferred from +15%');
  assert.ok(htmlPos.includes('lucide-trending-up'));

  // Negative by '-'
  const htmlNeg = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Thời gian phản hồi',
      value: '1.2s',
      icon: React.createElement('span', null, '⏱️'),
      trend: '-12%',
    })
  );
  assert.ok(htmlNeg.includes('bg-[#FEF3F2] text-[#EF4444]'), 'Negative inferred from -12%');
  assert.ok(htmlNeg.includes('lucide-trending-down'));

  // Unsigned default
  const htmlNeutral = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Độ tin cậy',
      value: '98%',
      icon: React.createElement('span', null, '🎯'),
      trend: '0%',
    })
  );
  assert.ok(htmlNeutral.includes('bg-[#ECFDF3] text-[#22C55E]'), 'Unsigned inferred as positive');
});

test('KPICARD-4: Edge case values: 0, empty string, large formatted string', () => {
  // Numeric 0 must render "0", not disappear
  const htmlZero = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Bệnh nhân chờ duyệt',
      value: 0,
      icon: React.createElement('span', null, '👥'),
    })
  );
  assert.ok(htmlZero.includes('>0<'), 'Renders numeric 0');

  // Empty string does not crash
  const htmlEmpty = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Ghi chú',
      value: '',
      icon: React.createElement('span', null, '📝'),
    })
  );
  assert.ok(htmlEmpty.includes('Ghi chú'), 'Renders with empty string value');

  // Large formatted string
  const htmlLarge = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Tổng doanh thu',
      value: '1,250,000,000 đ',
      icon: React.createElement('span', null, '💰'),
    })
  );
  assert.ok(htmlLarge.includes('1,250,000,000 đ'), 'Renders large formatted metric');
});

test('KPICARD-5: Details link with custom label vs default bilingual fallback', () => {
  // Custom label
  const htmlCustom = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Chi tiết ca khám',
      value: 45,
      icon: React.createElement('span', null, '🔍'),
      detailsLink: { label: 'Xem phân tích', onClick: () => {} },
    })
  );
  assert.ok(htmlCustom.includes('Xem phân tích'), 'Contains custom details label');
  assert.ok(htmlCustom.includes('lucide-chevron-right'), 'Contains chevron icon');

  // Default bilingual fallback ("Chi tiết")
  const htmlDefault = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Chi tiết ca khám',
      value: 45,
      icon: React.createElement('span', null, '🔍'),
      detailsLink: { onClick: () => {} },
    })
  );
  assert.ok(htmlDefault.includes('Chi tiết'), 'Contains default bilingual label');

  // No details link
  const htmlNoLink = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Không có link',
      value: 10,
      icon: React.createElement('span', null, 'ℹ️'),
    })
  );
  assert.ok(!htmlNoLink.includes('lucide-chevron-right'), 'No chevron right when no detailsLink');
});

test('KPICARD-6: Subtitle and onClick cursor class', () => {
  const html = renderToStaticMarkup(
    React.createElement(KpiCard, {
      title: 'Bệnh nhân mới',
      value: 18,
      icon: React.createElement('span', null, '🩺'),
      subtitle: 'So với hôm qua',
      onClick: () => {},
    })
  );
  assert.ok(html.includes('So với hôm qua'), 'Contains subtitle');
  assert.ok(html.includes('cursor-pointer'), 'Contains cursor-pointer when onClick is provided');
});

// ============================================================================
// 2. SECTIONCARD EMPIRICAL STRESS TESTS
// ============================================================================
console.log('\n--- 2. SectionCard Stress Tests ---');

test('SECTIONCARD-1: Basic rendering with title, subtitle, and content', () => {
  const html = renderToStaticMarkup(
    React.createElement(SectionCard, {
      title: 'Chẩn đoán vi mạch võng mạc',
      subtitle: 'Kết quả phân tích phân đoạn động mạch',
      children: React.createElement('div', { className: 'test-child' }, 'Nội dung chẩn đoán'),
    })
  );

  assert.ok(html.includes('Chẩn đoán vi mạch võng mạc'), 'Header title rendered');
  assert.ok(html.includes('Kết quả phân tích phân đoạn động mạch'), 'Subtitle rendered');
  assert.ok(html.includes('test-child'), 'Children content rendered');
  assert.ok(html.includes('border-b border-[#EAECF0]'), 'Header border present by default');
  assert.ok(html.includes('p-5 sm:p-6'), 'Default padding present');
});

test('SECTIONCARD-2: Action slot in header', () => {
  const actionButton = React.createElement(
    'button',
    { className: 'btn-export' },
    'Xuất báo cáo PDF'
  );
  const html = renderToStaticMarkup(
    React.createElement(SectionCard, {
      title: 'Báo cáo lâm sàng',
      headerAction: actionButton,
      children: React.createElement('p', null, 'Dữ liệu báo cáo'),
    })
  );

  assert.ok(html.includes('btn-export'), 'Header action button rendered');
  assert.ok(html.includes('Xuất báo cáo PDF'), 'Header action text rendered');
});

test('SECTIONCARD-3: Edge cases: empty children, headerBorder=false, noPadding=true', () => {
  // Empty children
  const htmlEmpty = renderToStaticMarkup(
    React.createElement(SectionCard, {
      title: 'Thẻ rỗng',
      children: null,
    })
  );
  assert.ok(htmlEmpty.includes('Thẻ rỗng'), 'Renders even when children is null');

  // headerBorder = false
  const htmlNoBorder = renderToStaticMarkup(
    React.createElement(SectionCard, {
      title: 'Không viền header',
      headerBorder: false,
      children: 'Nội dung',
    })
  );
  assert.ok(!htmlNoBorder.includes('border-b border-[#EAECF0]'), 'Suppresses header bottom border');

  // noPadding = true
  const htmlNoPadding = renderToStaticMarkup(
    React.createElement(SectionCard, {
      title: 'Không padding',
      noPadding: true,
      children: React.createElement('div', { className: 'full-bleed' }, 'Bảng tràn viền'),
    })
  );
  assert.ok(htmlNoPadding.includes('full-bleed'), 'Children rendered in unpadded body');
});

// ============================================================================
// 3. DATATABLE EMPIRICAL STRESS TESTS
// ============================================================================
console.log('\n--- 3. DataTable Stress Tests ---');

interface TestRecord {
  id: string;
  mrn: string;
  patientName: string;
  riskScore: number;
  status: string;
}

const testColumns: DataTableColumn<TestRecord>[] = [
  { key: 'mrn', header: 'Mã BN (MRN)', align: 'left' },
  { key: 'patientName', header: 'Họ và tên', align: 'left' },
  {
    key: 'riskScore',
    header: 'Điểm rủi ro',
    align: 'center',
    render: (item) => React.createElement('span', { className: 'risk-val font-bold' }, `${item.riskScore}%`),
  },
  {
    key: 'status',
    header: 'Trạng thái',
    align: 'right',
    render: (item) => React.createElement(StatusBadge, { status: item.status }),
  },
];

const testData: TestRecord[] = [
  { id: 'rec-1', mrn: 'MRN-001', patientName: 'Trần Văn Bảo', riskScore: 78, status: 'high' },
  { id: 'rec-2', mrn: 'MRN-002', patientName: 'Lê Thị Mai', riskScore: 22, status: 'normal' },
  { id: 'rec-3', mrn: 'MRN-003', patientName: 'Phạm Đức Anh', riskScore: 50, status: 'pending' },
];

test('DATATABLE-1: loading=true renders SkeletonLoading table variant', () => {
  const htmlLoading = renderToStaticMarkup(
    React.createElement(DataTable<TestRecord>, {
      columns: testColumns,
      data: [],
      loading: true,
      keyExtractor: (item) => item.id,
    })
  );

  assert.ok(htmlLoading.includes('divide-y divide-[#EAECF0]'), 'Skeleton table container rendered');
  assert.ok(htmlLoading.includes('before:animate-[shimmer_2s_infinite]'), 'Shimmer animation present');
  assert.ok(!htmlLoading.includes('Trần Văn Bảo'), 'No data rendered while loading');
});

test('DATATABLE-2: data=[] (empty array) renders EmptyState with custom message', () => {
  const htmlEmpty = renderToStaticMarkup(
    React.createElement(DataTable<TestRecord>, {
      columns: testColumns,
      data: [],
      loading: false,
      emptyTitle: 'Không tìm thấy hồ sơ',
      emptyMessage: 'Không có bệnh nhân nào khớp với tiêu chí tìm kiếm.',
      keyExtractor: (item) => item.id,
    })
  );

  assert.ok(htmlEmpty.includes('Không tìm thấy hồ sơ'), 'Renders custom empty title');
  assert.ok(htmlEmpty.includes('Không có bệnh nhân nào khớp với tiêu chí tìm kiếm.'), 'Renders custom empty message');
  assert.ok(htmlEmpty.includes('lucide-inbox'), 'EmptyState inbox icon present');
});

test('DATATABLE-3: data=null or undefined handled safely without crash', () => {
  const htmlNull = renderToStaticMarkup(
    React.createElement(DataTable<TestRecord>, {
      columns: testColumns,
      data: null as any,
      keyExtractor: (item) => item.id,
    })
  );

  assert.ok(htmlNull.includes('Không có bản ghi nào') || htmlNull.includes('No records found'), 'Renders empty state safely');
});

test('DATATABLE-4: Valid rows render headers, custom renderers, and alignments', () => {
  const html = renderToStaticMarkup(
    React.createElement(DataTable<TestRecord>, {
      columns: testColumns,
      data: testData,
      keyExtractor: (item) => item.id,
      onRowClick: () => {},
    })
  );

  // Headers
  assert.ok(html.includes('Mã BN (MRN)'), 'Header MRN rendered');
  assert.ok(html.includes('Họ và tên'), 'Header Name rendered');
  assert.ok(html.includes('Điểm rủi ro'), 'Header Risk rendered');
  assert.ok(html.includes('Trạng thái'), 'Header Status rendered');

  // Row Data
  assert.ok(html.includes('MRN-001'), 'MRN row 1 rendered');
  assert.ok(html.includes('Trần Văn Bảo'), 'Name row 1 rendered');
  assert.ok(html.includes('78%'), 'Custom riskScore render rendered');
  assert.ok(html.includes('Nguy cơ cao'), 'StatusBadge rendered inside table');

  // Alignments
  assert.ok(html.includes('text-left'), 'Left align class present');
  assert.ok(html.includes('text-center'), 'Center align class present');
  assert.ok(html.includes('text-right'), 'Right align class present');

  // Clickable Row
  assert.ok(html.includes('cursor-pointer hover:bg-[#F9FAFB]'), 'Row has clickable hover styling');
});

// ============================================================================
// 4. STATUSBADGE EMPIRICAL STRESS TESTS
// ============================================================================
console.log('\n--- 4. StatusBadge Stress Tests ---');

test('STATUSBADGE-1: Success status mapping across all supported keys', () => {
  const successKeys = [
    'booked',
    'completed',
    'approved',
    'normal',
    'low',
    'low risk',
    'active',
    'reviewed',
    'success',
    'đã duyệt',
    'hoàn thành',
    'bình thường',
  ];

  for (const key of successKeys) {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: key }));
    assert.ok(
      html.includes('bg-[#ECFDF3] text-[#22C55E]'),
      `Key "${key}" must render green success badge, got: ${html}`
    );
    assert.ok(html.includes('bg-[#22C55E]'), `Key "${key}" must render green dot`);
  }
});

test('STATUSBADGE-2: Warning status mapping across all supported keys', () => {
  const warningKeys = [
    'pending',
    'in_review',
    'in review',
    'moderate',
    'borderline',
    'processing',
    'draft',
    'đang chờ',
    'chờ duyệt',
    'trung bình',
  ];

  for (const key of warningKeys) {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: key }));
    assert.ok(
      html.includes('bg-[#FFFAEB] text-[#F59E0B]'),
      `Key "${key}" must render amber warning badge, got: ${html}`
    );
    assert.ok(html.includes('bg-[#F59E0B]'), `Key "${key}" must render amber dot`);
  }
});

test('STATUSBADGE-3: Danger status mapping across all supported keys', () => {
  const dangerKeys = [
    'canceled',
    'cancelled',
    'rejected',
    'high',
    'high risk',
    'critical',
    'danger',
    'failed',
    'hủy',
    'từ chối',
    'nguy cơ cao',
    'nguy kịch',
  ];

  for (const key of dangerKeys) {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: key }));
    assert.ok(
      html.includes('bg-[#FEF3F2] text-[#EF4444]'),
      `Key "${key}" must render red danger badge, got: ${html}`
    );
    assert.ok(html.includes('bg-[#EF4444]'), `Key "${key}" must render red dot`);
  }
});

test('STATUSBADGE-4: Info status mapping across all supported keys', () => {
  const infoKeys = ['info', 'scheduled', 'analyzing', 'đã lên lịch'];

  for (const key of infoKeys) {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: key }));
    assert.ok(
      html.includes('bg-[#EEF5FF] text-[#0EA5E9]'),
      `Key "${key}" must render blue info badge, got: ${html}`
    );
    assert.ok(html.includes('bg-[#0EA5E9]'), `Key "${key}" must render blue dot`);
  }
});

test('STATUSBADGE-5: Neutral fallback for unknown keys and edge values', () => {
  const neutralKeys = ['unknown', 'archived', '', 'xyz_status'];

  for (const key of neutralKeys) {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: key }));
    assert.ok(
      html.includes('bg-[#F8F9FA] text-[#667085]'),
      `Key "${key}" must render neutral badge, got: ${html}`
    );
  }
});

test('STATUSBADGE-6: Explicit variant override, sizes, and showDot=false', () => {
  // Explicit variant overrides status inferred
  const htmlOverride = renderToStaticMarkup(
    React.createElement(StatusBadge, { status: 'normal', variant: 'danger' })
  );
  assert.ok(htmlOverride.includes('bg-[#FEF3F2] text-[#EF4444]'), 'Explicit danger variant honored');

  // Size sm
  const htmlSm = renderToStaticMarkup(
    React.createElement(StatusBadge, { status: 'booked', size: 'sm' })
  );
  assert.ok(htmlSm.includes('px-2 py-0.5 text-[11px]'), 'Size sm styling applied');

  // Size md
  const htmlMd = renderToStaticMarkup(
    React.createElement(StatusBadge, { status: 'booked', size: 'md' })
  );
  assert.ok(htmlMd.includes('px-2.5 py-1 text-xs'), 'Size md styling applied');

  // showDot = false
  const htmlNoDot = renderToStaticMarkup(
    React.createElement(StatusBadge, { status: 'booked', showDot: false })
  );
  assert.ok(!htmlNoDot.includes('rounded-full shrink-0'), 'Dot element omitted');
});

// ============================================================================
// 5. FILTERBAR & SEARCHFIELD EMPIRICAL STRESS TESTS
// ============================================================================
console.log('\n--- 5. FilterBar & SearchField Stress Tests ---');

test('FILTERBAR-1: Time range toggle buttons and active pill highlight', () => {
  const htmlWeek = renderToStaticMarkup(
    React.createElement(FilterBar, {
      timeRange: 'week',
      onTimeRangeChange: () => {},
    })
  );

  assert.ok(htmlWeek.includes('bg-[#3478F6] text-white shadow-xs'), 'Active pill has primary blue style');
  assert.ok(htmlWeek.includes('Tuần') || htmlWeek.includes('Week'), 'Week option rendered');
  assert.ok(htmlWeek.includes('Ngày') || htmlWeek.includes('Day'), 'Day option rendered');
  assert.ok(htmlWeek.includes('Tháng') || htmlWeek.includes('Month'), 'Month option rendered');
  assert.ok(htmlWeek.includes('Năm') || htmlWeek.includes('Year'), 'Year option rendered');

  const htmlMonth = renderToStaticMarkup(
    React.createElement(FilterBar, {
      timeRange: 'month',
      onTimeRangeChange: () => {},
    })
  );
  assert.ok(htmlMonth.includes('Tháng') || htmlMonth.includes('Month'));
});

test('FILTERBAR-2: Date range button, Filter toggle button, and Custom Actions slot', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      FilterBar,
      {
        dateRangeLabel: '01/09/2026 - 15/09/2026',
        onDateRangeClick: () => {},
        onFilterClick: () => {},
        filterActive: true,
      },
      React.createElement('button', { className: 'custom-btn' }, 'Tải xuống Excel')
    )
  );

  assert.ok(html.includes('01/09/2026 - 15/09/2026'), 'Date range label rendered');
  assert.ok(html.includes('lucide-calendar'), 'Calendar icon rendered');
  assert.ok(html.includes('lucide-sliders-horizontal'), 'Filter icon rendered');
  assert.ok(html.includes('border-[#3478F6] bg-[#EEF5FF] text-[#3478F6]'), 'Active filter button highlighted');
  assert.ok(html.includes('custom-btn'), 'Custom children action rendered');
});

test('SEARCHFIELD-1: Input rendering, placeholder, search icon, and clear button', () => {
  // Empty input has no clear button
  const htmlEmpty = renderToStaticMarkup(
    React.createElement(SearchField, {
      placeholder: 'Tìm kiếm hồ sơ...',
    })
  );
  assert.ok(htmlEmpty.includes('placeholder="Tìm kiếm hồ sơ..."'), 'Placeholder rendered');
  assert.ok(htmlEmpty.includes('lucide-search'), 'Search icon present');
  assert.ok(!htmlEmpty.includes('lucide-x'), 'No clear button when value is empty');

  // Input with value has clear button
  const htmlFilled = renderToStaticMarkup(
    React.createElement(SearchField, {
      value: 'Nguyễn Văn B',
    })
  );
  assert.ok(htmlFilled.includes('value="Nguyễn Văn B"'), 'Value rendered');
  assert.ok(htmlFilled.includes('lucide-x'), 'Clear button present when value is non-empty');
});

// ============================================================================
// 6. SIDEBAR ROLE GROUPS EMPIRICAL STRESS TESTS
// ============================================================================
console.log('\n--- 6. Sidebar Role Groups Stress Tests ---');

test('SIDEBAR-1: Patient role navigation items and groups', () => {
  const html = renderToStaticMarkup(
    React.createElement(Sidebar, {
      currentRole: 'patient',
      activeSection: 'dashboard',
      unreadChatCount: 3,
      unreadNotificationCount: 5,
      onLogout: () => {},
    })
  );

  // General group items
  assert.ok(html.includes('Trang chủ') || html.includes('Dashboard'), 'Patient: Dashboard present');
  assert.ok(html.includes('Sàng lọc võng mạc') || html.includes('Retinal Screening'), 'Patient: Screening present');
  assert.ok(html.includes('Lịch sử') || html.includes('History') || html.includes('Kết quả'), 'Patient: History present');
  assert.ok(html.includes('Lịch hẹn') || html.includes('Appointments'), 'Patient: Appointments present');
  assert.ok(html.includes('Tin nhắn') || html.includes('Nhắn tin') || html.includes('Messages'), 'Patient: Messages present');
  assert.ok(html.includes('Hồ sơ y tế') || html.includes('Medical Profile'), 'Patient: Profile present');

  // Other group items
  assert.ok(html.includes('Thông báo') || html.includes('Thông Báo') || html.includes('Notifications'), 'Patient: Notifications present');
  assert.ok(html.includes('Gói cước') || html.includes('Cài đặt') || html.includes('Settings'), 'Patient: Settings present');

  // Badges
  assert.ok(html.includes('>3<'), 'Unread chat badge rendered');
  assert.ok(html.includes('>5<'), 'Unread notification badge rendered');

  // Log Out button
  assert.ok(html.includes('Đăng xuất') || html.includes('Log Out'), 'Logout button present');
});

test('SIDEBAR-2: Doctor role navigation items and groups', () => {
  const html = renderToStaticMarkup(
    React.createElement(Sidebar, {
      currentRole: 'doctor',
      activeSection: 'cds-viewer',
    })
  );

  assert.ok(html.includes('Trang chủ') || html.includes('Dashboard'), 'Doctor: Dashboard present');
  assert.ok(html.includes('bệnh nhân') || html.includes('Bệnh nhân') || html.includes('Patients'), 'Doctor: Patients present');
  assert.ok(html.includes('Chờ duyệt chẩn đoán') || html.includes('Pending Reviews'), 'Doctor: Pending Reviews present');
  assert.ok(html.includes('Báo cáo') || html.includes('Lịch sử') || html.includes('Review History') || html.includes('Ký duyệt') || html.includes('đánh giá'), 'Doctor: Review History present');
  assert.ok(html.includes('Tin nhắn') || html.includes('Nhắn tin') || html.includes('Messages'), 'Doctor: Messages present');

  // Active section highlighted
  assert.ok(html.includes('bg-[#3478F6] text-white shadow-xs'), 'Active section highlighted');
});

test('SIDEBAR-3: Clinic role navigation items and groups', () => {
  const html = renderToStaticMarkup(
    React.createElement(Sidebar, {
      currentRole: 'clinic',
      activeSection: 'bulk-batch',
    })
  );

  assert.ok(html.includes('bệnh nhân') || html.includes('Bệnh nhân') || html.includes('Patients'), 'Clinic: Patients present');
  assert.ok(html.includes('Sàng lọc theo lô') || html.includes('Batch Screening'), 'Clinic: Batch Screening present');
  assert.ok(html.includes('Kết quả') || html.includes('Results'), 'Clinic: Results present');
  assert.ok(html.includes('Quản lý Bác sĩ') || html.includes('Bác sĩ') || html.includes('Doctors'), 'Clinic: Doctors present');
  assert.ok(html.includes('Báo cáo chiến dịch') || html.includes('Phân tích') || html.includes('Analytics'), 'Clinic: Analytics present');
});

test('SIDEBAR-4: Admin role navigation items and groups', () => {
  const html = renderToStaticMarkup(
    React.createElement(Sidebar, {
      currentRole: 'admin',
      activeSection: 'rbac-matrix',
    })
  );

  assert.ok(html.includes('Quản lý tài khoản') || html.includes('Người dùng') || html.includes('Users'), 'Admin: Users present');
  assert.ok(html.includes('Duyệt phòng khám') || html.includes('Bác sĩ') || html.includes('Phòng khám') || html.includes('Doctors & Clinics'), 'Admin: Clinics present');
  assert.ok(html.includes('Ca sàng lọc') || html.includes('Screenings'), 'Admin: Screenings present');
  assert.ok(html.includes('Phân quyền truy cập') || html.includes('Phân quyền') || html.includes('Roles'), 'Admin: Roles present');
  assert.ok(html.includes('Nhật ký hệ thống') || html.includes('Nhật ký') || html.includes('Audit Logs'), 'Admin: Audit logs present');
  assert.ok(html.includes('Cấu hình AI') || html.includes('Cài đặt') || html.includes('System Settings'), 'Admin: Settings present');
});

test('SIDEBAR-5: Vietnamese role string normalization ("Bác sĩ", "Bệnh nhân", "Phòng khám", "Quản trị viên")', () => {
  const htmlDoc = renderToStaticMarkup(React.createElement(Sidebar, { currentRole: 'Bác sĩ' }));
  assert.ok(htmlDoc.includes('Chờ duyệt chẩn đoán') || htmlDoc.includes('Pending Reviews'), 'Bác sĩ normalized to doctor');

  const htmlPat = renderToStaticMarkup(React.createElement(Sidebar, { currentRole: 'Bệnh nhân' }));
  assert.ok(htmlPat.includes('Sàng lọc võng mạc') || htmlPat.includes('Retinal Screening'), 'Bệnh nhân normalized to patient');

  const htmlClinic = renderToStaticMarkup(React.createElement(Sidebar, { currentRole: 'Phòng khám đa khoa' }));
  assert.ok(htmlClinic.includes('Sàng lọc theo lô') || htmlClinic.includes('Batch Screening'), 'Phòng khám normalized to clinic');

  const htmlAdmin = renderToStaticMarkup(React.createElement(Sidebar, { currentRole: 'Quản trị viên hệ thống' }));
  assert.ok(htmlAdmin.includes('Nhật ký hệ thống') || htmlAdmin.includes('Audit Logs'), 'Quản trị viên normalized to admin');
});

// ============================================================================
// 7. SKELETONLOADING, CONFIRMDALOG, EMPTYSTATE & ERRORSTATE TESTS
// ============================================================================
console.log('\n--- 7. Feedback & State Components Stress Tests ---');

test('FEEDBACK-1: SkeletonLoading all variants (kpi, table, card, chart, profile, text)', () => {
  const variants: SkeletonVariant[] = ['kpi', 'table', 'card', 'chart', 'profile', 'text'];
  for (const v of variants) {
    const html = renderToStaticMarkup(React.createElement(SkeletonLoading, { variant: v, count: 2 }));
    assert.ok(html.includes('before:animate-[shimmer_2s_infinite]'), `Variant ${v} has shimmer animation`);
  }
});

test('FEEDBACK-2: ConfirmDialog variants and open/closed states', () => {
  // Closed state returns empty
  const htmlClosed = renderToStaticMarkup(
    React.createElement(ConfirmDialog, {
      isOpen: false,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa?',
      onConfirm: () => {},
      onCancel: () => {},
    })
  );
  assert.strictEqual(htmlClosed, '', 'Closed dialog renders empty string');

  // Open state with danger variant
  const htmlDanger = renderToStaticMarkup(
    React.createElement(ConfirmDialog, {
      isOpen: true,
      variant: 'danger',
      title: 'Xác nhận hủy kết quả',
      message: 'Hành động này không thể hoàn tác.',
      confirmLabel: 'Hủy ngay',
      onConfirm: () => {},
      onCancel: () => {},
    })
  );
  assert.ok(htmlDanger.includes('Xác nhận hủy kết quả'), 'Dialog title rendered');
  assert.ok(htmlDanger.includes('Hủy ngay'), 'Danger confirm label rendered');
  assert.ok(htmlDanger.includes('bg-[#EF4444]'), 'Danger button background red');
});

test('FEEDBACK-3: EmptyState and ErrorState display and action triggers', () => {
  // EmptyState with action
  const htmlEmpty = renderToStaticMarkup(
    React.createElement(EmptyState, {
      title: 'Chưa có ca khám',
      message: 'Nhấn nút bên dưới để tạo ca khám mới.',
      action: { label: 'Tạo ca khám', onClick: () => {} },
    })
  );
  assert.ok(htmlEmpty.includes('Chưa có ca khám'), 'Empty title rendered');
  assert.ok(htmlEmpty.includes('Tạo ca khám'), 'Action CTA button rendered');

  // ErrorState with retry
  const htmlError = renderToStaticMarkup(
    React.createElement(ErrorState, {
      title: 'Mất kết nối máy chủ',
      message: 'Không thể kết nối đến cơ sở dữ liệu AURA.',
      onRetry: () => {},
      retryLabel: 'Thử lại ngay',
    })
  );
  assert.ok(htmlError.includes('Mất kết nối máy chủ'), 'Error title rendered');
  assert.ok(htmlError.includes('Thử lại ngay'), 'Retry button rendered');
  assert.ok(htmlError.includes('lucide-rotate-cw'), 'Rotate icon present');
});

// ============================================================================
// 8. LAYOUT SHELL INTEGRATION TESTS (Topbar & AppLayout)
// ============================================================================
console.log('\n--- 8. Layout Shell Integration Tests ---');

test('LAYOUT-1: Topbar renders title, search, user profile avatar, and role', () => {
  const html = renderToStaticMarkup(
    React.createElement(Topbar, {
      currentUser: mockUser,
      title: 'Bàn chẩn đoán lâm sàng',
      onLogout: () => {},
    })
  );

  assert.ok(html.includes('Bàn chẩn đoán lâm sàng'), 'Topbar title rendered');
  assert.ok(html.includes('BS. Nguyễn Văn A'), 'Doctor name rendered');
  assert.ok(html.includes('lucide-bell'), 'Notification bell present');
  assert.ok(html.includes('lucide-search'), 'Search input present');
  assert.ok(html.includes('h-[76px]'), 'Topbar height is 76px within 72-80px requirement');
});

test('LAYOUT-2: AppLayout integrates Sidebar, Topbar, and padded main canvas', () => {
  const html = renderToStaticMarkup(
    React.createElement(AppLayout, {
      currentUser: mockUser,
      activeSection: 'dashboard',
      onSelectSection: () => {},
      onLogout: () => {},
      title: 'Trang tổng quan',
      children: React.createElement('div', { id: 'test-canvas-content' }, 'Nội dung bảng điều khiển'),
    })
  );

  assert.ok(html.includes('bg-[#F5F6F8]'), 'Canvas background is #F5F6F8');
  assert.ok(html.includes('lg:pl-[236px]'), 'Left padding 236px for fixed desktop sidebar');
  assert.ok(html.includes('p-5 sm:p-7'), 'Main padded canvas present (20-28px)');
  assert.ok(html.includes('test-canvas-content'), 'Main children content rendered');
  assert.ok(html.includes('AURA'), 'Brand logo in sidebar present');
});

test('LAYOUT-3: Bridged layouts/AppLayout renders MediRoom fixed left sidebar (236px) + 76px Topbar', () => {
  const html = renderToStaticMarkup(
    React.createElement(BridgedAppLayout, {
      currentUser: mockUser,
      activeSection: 'dashboard',
      onSelectSection: () => {},
      onLogout: () => {},
      children: React.createElement('div', { id: 'bridged-layout-test' }, 'Live App Content'),
    })
  );

  assert.ok(html.includes('bg-[#F5F6F8]'), 'Canvas background is #F5F6F8');
  assert.ok(html.includes('lg:pl-[236px]'), 'Left padding 236px for fixed desktop sidebar');
  assert.ok(html.includes('h-[76px]'), 'Topbar height is 76px');
  assert.ok(html.includes('bridged-layout-test'), 'Live app content rendered');
  assert.ok(html.includes('AURA'), 'Sidebar brand rendered');
});

test('LAYOUT-4: Default export from layouts/AppLayout supports backward compatibility with full props', () => {
  let selected = '';
  let loggedOut = false;
  const html = renderToStaticMarkup(
    React.createElement(DefaultBridgedAppLayout, {
      currentUser: { ...mockUser, role: 'patient' },
      activeSection: 'upload-scan',
      onSelectSection: (s: string) => { selected = s; },
      onLogout: () => { loggedOut = true; },
      children: React.createElement('div', { className: 'patient-portal-root' }, 'Patient Workspace'),
    })
  );

  assert.ok(html.includes('patient-portal-root'), 'Patient workspace rendered');
  assert.ok(html.includes('lg:pl-[236px]'), '236px sidebar offset present');
  assert.ok(html.includes('Sàng lọc võng mạc') || html.includes('Retinal Screening'), 'Patient navigation item rendered');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n=================================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('=================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
