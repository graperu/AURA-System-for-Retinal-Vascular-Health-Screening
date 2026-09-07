import React, { memo, useCallback, useMemo, useState } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';

/* ------------------------------------------------------------------ */
/* Static data (kept OUTSIDE the component so it isn't recreated      */
/* on every render — swap these for API/query results later).        */
/* ------------------------------------------------------------------ */

type AiStatus = 'high-risk' | 'analyzing' | 'confirmed';

interface PatientRow {
  id: string;
  time: string;
  doctorInitials: string;
  doctorName: string;
  avatarClass: string;
  status: AiStatus;
}

interface KpiCardData {
  id: string;
  label: string;
  icon: string;
  iconWrapClass: string;
  iconClass: string;
  value: string;
  footer: React.ReactNode;
}

interface AlertData {
  id: string;
  title: string;
  time: string;
  body: string;
  variant: 'danger' | 'info';
}

interface DoctorLoad {
  id: string;
  initials: string;
  name: string;
  status: string;
  cases: string;
  avatarClass: string;
}

const PATIENT_QUEUE: PatientRow[] = [
  { id: 'PT-8842-A', time: '10:42 AM', doctorInitials: 'PĐ', doctorName: 'BS. Phan Định', avatarClass: 'bg-primary-container text-on-primary-container', status: 'high-risk' },
  { id: 'PT-8841-C', time: '10:15 AM', doctorInitials: 'LT', doctorName: 'BS. Lê Trang', avatarClass: 'bg-secondary-container text-on-secondary-container', status: 'analyzing' },
  { id: 'PT-8840-B', time: '09:30 AM', doctorInitials: 'TH', doctorName: 'BS. Trần Hoàng', avatarClass: 'bg-tertiary-container text-on-tertiary-container', status: 'confirmed' },
];

const ALERTS: AlertData[] = [
  { id: 'a1', title: 'Phát hiện DR Mức Nguy Hiểm', time: '2 phút trước', body: 'Bệnh nhân PT-8842-A ghi nhận biến chứng võng mạc tiểu đường tăng sinh mức độ nặng.', variant: 'danger' },
  { id: 'a2', title: 'Cập nhật Hệ thống', time: '1 giờ trước', body: 'Model AI v2.4 đã triển khai thành công lên máy chủ phòng khám local.', variant: 'info' },
];

const DOCTOR_LOAD: DoctorLoad[] = [
  { id: 'd1', initials: 'PĐ', name: 'BS. Phan Định', status: 'Đang trực tuyến', cases: '14 ca', avatarClass: 'bg-primary text-on-primary' },
  { id: 'd2', initials: 'LT', name: 'BS. Lê Trang', status: 'Đang trực tuyến', cases: '8 ca', avatarClass: 'bg-surface-variant text-on-surface-variant' },
];

const KPI_CARDS: KpiCardData[] = [
  {
    id: 'total-cases',
    label: 'Tổng Số Ca Khám',
    icon: 'visibility',
    iconWrapClass: 'bg-primary-container/20',
    iconClass: 'text-primary',
    value: '1,248',
    footer: (
      <div className="flex items-center gap-1 text-tertiary mt-1">
        <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
        <span className="text-label-md font-semibold">+12% tháng này</span>
      </div>
    ),
  },
  {
    id: 'high-risk',
    label: 'Cảnh Báo Nguy Cơ Cao',
    icon: 'warning',
    iconWrapClass: 'bg-error-container',
    iconClass: 'text-error',
    value: '84',
    footer: <div className="text-label-md font-semibold text-on-surface-variant mt-1">Cần hội chẩn gấp</div>,
  },
  {
    id: 'on-shift',
    label: 'Bác Sĩ Trực Ca',
    icon: 'medical_services',
    iconWrapClass: 'bg-surface-container-high',
    iconClass: 'text-primary',
    value: '12',
    footer: <div className="text-label-md font-semibold text-on-surface-variant mt-1">Đang hoạt động online</div>,
  },
  {
    id: 'capacity',
    label: 'Dung Lượng Gói Khám',
    icon: 'inventory_2',
    iconWrapClass: 'bg-surface-container-high',
    iconClass: 'text-primary',
    value: '85%',
    footer: (
      <>
        <div className="w-full bg-surface-variant rounded-full h-1.5 mt-2 mb-1">
          <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }} />
        </div>
        <div className="text-label-md text-on-surface-variant">8,500 / 10,000 lượt quét</div>
      </>
    ),
  },
];

const AI_STATUS_CONFIG: Record<AiStatus, { className: string; dotClass?: string; label: string; icon?: string }> = {
  'high-risk': { className: 'bg-error-container text-error', dotClass: 'bg-error', label: 'Nguy Cơ Cao' },
  analyzing: { className: 'bg-surface-container-highest text-on-surface-variant', icon: 'sync', label: 'Đang Phân Tích...' },
  confirmed: { className: 'bg-tertiary-container/20 text-tertiary', dotClass: 'bg-tertiary', label: 'Đã Xác Nhận' },
};

/* ------------------------------------------------------------------ */
/* Small memoized presentational components                          */
/* Each is isolated so a change elsewhere on the page (e.g. typing    */
/* in the search box) does not force these to re-render.              */
/* ------------------------------------------------------------------ */

const KpiCard = memo(function KpiCard({ data }: { data: KpiCardData }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col relative overflow-hidden shadow-xs">
      {data.id === 'high-risk' && <div className="absolute inset-0 bg-secondary/5 z-0" />}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <span className="text-label-md font-semibold text-on-surface-variant uppercase">{data.label}</span>
        <div className={`p-1.5 rounded-lg ${data.iconWrapClass} ${data.iconClass}`}>
          <span className="material-symbols-outlined text-[20px]">{data.icon}</span>
        </div>
      </div>
      <div className="mt-auto relative z-10">
        <span className={`text-display-lg font-bold ${data.id === 'high-risk' ? 'text-error' : 'text-on-background'}`}>
          {data.value}
        </span>
        {data.footer}
      </div>
    </div>
  );
});

const AiStatusBadge = memo(function AiStatusBadge({ status }: { status: AiStatus }) {
  const cfg = AI_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-bold ${cfg.className}`}>
      {cfg.icon ? (
        <span className="material-symbols-outlined text-[14px] animate-spin">{cfg.icon}</span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      )}
      {cfg.label}
    </span>
  );
});

const PatientQueueRow = memo(function PatientQueueRow({ row }: { row: PatientRow }) {
  return (
    <tr className="hover:bg-surface transition-colors">
      <td className="p-3 font-mono-data text-primary">{row.id}</td>
      <td className="p-3 text-on-surface-variant">{row.time}</td>
      <td className="p-3 flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${row.avatarClass}`}>
          {row.doctorInitials}
        </div>
        {row.doctorName}
      </td>
      <td className="p-3">
        <AiStatusBadge status={row.status} />
      </td>
    </tr>
  );
});

const PatientQueueTable = memo(function PatientQueueTable({ rows }: { rows: PatientRow[] }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface/50">
        <h2 className="text-headline-sm font-semibold text-on-background">Hàng Đợi Bệnh Nhân Gần Đây</h2>
        <button className="text-primary text-label-md font-semibold hover:underline">Xem Tất Cả</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-semibold text-on-surface-variant uppercase">
              <th className="p-3">Mã Bệnh Nhân</th>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Bác Sĩ Phụ Trách</th>
              <th className="p-3">Trạng Thái AI</th>
            </tr>
          </thead>
          <tbody className="text-body-md divide-y divide-outline-variant">
            {rows.map((row) => (
              <PatientQueueRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const RiskDistributionChart = memo(function RiskDistributionChart() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col md:flex-row h-64 overflow-hidden">
      <div className="p-6 border-b md:border-b-0 md:border-r border-outline-variant flex-1 bg-surface/30">
        <h2 className="text-headline-sm font-semibold text-on-background mb-4">Phân Bổ Tỷ Lệ Rủi Ro</h2>
        <div className="flex h-32 items-end gap-2 px-2 mt-4">
          <div className="w-1/3 bg-tertiary rounded-t-sm relative group" style={{ height: '70%' }}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-md font-bold">70%</div>
          </div>
          <div className="w-1/3 bg-secondary-fixed-dim rounded-t-sm relative group" style={{ height: '22%' }}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-md font-bold">22%</div>
          </div>
          <div className="w-1/3 bg-error rounded-t-sm relative group" style={{ height: '8%' }}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-md font-bold text-error">8%</div>
          </div>
        </div>
        <div className="flex justify-between mt-2 px-2 border-t border-outline-variant pt-2">
          <span className="text-label-md font-semibold text-tertiary">Thấp</span>
          <span className="text-label-md font-semibold text-on-surface-variant">Trung bình</span>
          <span className="text-label-md font-semibold text-error">Cao</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        <h3 className="text-headline-sm font-semibold text-on-background mb-2">Tỷ Lệ Đồng Thuận Phân Tích</h3>
        <p className="text-body-md text-on-surface-variant mb-4">Độ tương đồng giữa chẩn đoán AI và quyết định của bác sĩ chuyên khoa.</p>
        <div className="flex items-center gap-4">
          <div className="text-display-lg font-bold text-primary">94.2%</div>
          <div className="flex flex-col">
            <span className="text-label-md font-semibold text-tertiary flex items-center">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +2.1%
            </span>
            <span className="text-label-md text-on-surface-variant">so với tháng trước</span>
          </div>
        </div>
      </div>
    </div>
  );
});

const AlertItem = memo(function AlertItem({ alert }: { alert: AlertData }) {
  const isDanger = alert.variant === 'danger';
  return (
    <div
      className={`p-3 rounded-lg border-l-4 transition-colors cursor-pointer ${
        isDanger
          ? 'bg-error-container/30 border-error hover:bg-error-container/50'
          : 'bg-surface-container-high border-primary hover:bg-surface-container-highest'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className={`text-label-md font-bold ${isDanger ? 'text-error' : 'text-primary'}`}>{alert.title}</span>
        <span className="text-label-md text-on-surface-variant">{alert.time}</span>
      </div>
      <p className="text-body-md text-on-background">{alert.body}</p>
    </div>
  );
});

const LiveAlertsPanel = memo(function LiveAlertsPanel({ alerts }: { alerts: AlertData[] }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm h-[320px]">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-error/5">
        <h2 className="text-headline-sm font-semibold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-error">campaign</span>
          Cảnh Báo Trực Tiếp
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
});

const DoctorLoadRow = memo(function DoctorLoadRow({ doctor }: { doctor: DoctorLoad }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold ${doctor.avatarClass}`}>
          {doctor.initials}
        </div>
        <div className="flex flex-col">
          <span className="text-body-md font-semibold text-on-background">{doctor.name}</span>
          <span className="text-label-md text-tertiary">{doctor.status}</span>
        </div>
      </div>
      <span className="text-body-md font-mono-data">{doctor.cases}</span>
    </div>
  );
});

const StaffWorkload = memo(function StaffWorkload({ doctors }: { doctors: DoctorLoad[] }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm">
      <div className="p-4 border-b border-outline-variant bg-surface/50">
        <h2 className="text-headline-sm font-semibold text-on-background">Tải Công Việc Bác Sĩ</h2>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {doctors.map((doctor) => (
          <DoctorLoadRow key={doctor.id} doctor={doctor} />
        ))}
      </div>
    </div>
  );
});

/* Search box isolated in its own component: typing here only re-renders
   this small subtree, not the table/chart/alerts below it. */
const SearchAndActions = memo(function SearchAndActions({
  onSearch,
}: {
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onSearch(e.target.value);
    },
    [onSearch]
  );

  return (
    <div className="flex items-center gap-4 w-full md:w-auto">
      <div className="relative flex-1 md:flex-initial">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Tìm kiếm bệnh nhân hoặc mã ca..."
          className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md w-full md:w-64 transition-all"
        />
      </div>
      <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-primary font-semibold text-label-md hover:bg-surface-container-low transition-colors bg-surface shadow-xs">
        <span className="material-symbols-outlined text-[18px]">download</span>
        Xuất Báo Cáo Tổng Hợp
      </button>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Page component                                                     */
/* ------------------------------------------------------------------ */

export const ClinicManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');

  // Debounced/derived filtering lives here via useMemo, so the expensive
  // filter only recomputes when `search` or the source data actually change,
  // not on every render of the page (e.g. from unrelated state elsewhere).
  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PATIENT_QUEUE;
    return PATIENT_QUEUE.filter(
      (row) => row.id.toLowerCase().includes(q) || row.doctorName.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  return (
    <div className="flex h-screen bg-background text-on-background font-body-md min-h-screen">
      <SideNavBar currentRole="Quản lý Phòng khám" />

      <main className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen bg-background overflow-y-auto">
        <div className="p-gutter md:p-margin-page flex-1 max-w-container-max mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-display-lg font-bold text-on-background">Tổng Quan Báo Cáo</h1>
              <p className="text-body-lg text-on-surface-variant mt-1">Hiệu suất Hoạt động & Tải Bệnh nhân Phòng khám</p>
            </div>

            <SearchAndActions onSearch={handleSearch} />
          </div>

          {/* Performance Overview KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {KPI_CARDS.map((card) => (
              <KpiCard key={card.id} data={card} />
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <PatientQueueTable rows={filteredQueue} />
              <RiskDistributionChart />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <LiveAlertsPanel alerts={ALERTS} />
              <StaffWorkload doctors={DOCTOR_LOAD} />
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};
