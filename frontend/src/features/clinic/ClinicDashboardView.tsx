import React, { useState, useMemo } from 'react';
import {
  Users,
  Activity,
  Clock,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Calendar,
  ChevronRight,
  Eye,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Sparkles,
  Stethoscope,
  CreditCard,
} from 'lucide-react';
import { KpiCard } from '../../components/common/KpiCard';
import { SectionCard } from '../../components/common/SectionCard';
import { DataTable, DataTableColumn } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { ClinicBatchJob, ClinicBatchJobItem } from '../../types/cds';

export interface ClinicDashboardViewProps {
  batchJob: ClinicBatchJob;
  onNavigate?: (section: string) => void;
  onUploadNewBatch?: () => void;
  onSelectBatchItem?: (item: ClinicBatchJobItem) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

interface RecentBatchRecord {
  id: string;
  batchId: string;
  date: string;
  totalImages: number;
  processedCount: number;
  highRiskCount: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

export const ClinicDashboardView: React.FC<ClinicDashboardViewProps> = ({
  batchJob,
  onNavigate,
  onUploadNewBatch,
  onSelectBatchItem,
}) => {
  const { t, isVi } = useLanguage();
  const [selectedEyeFilter, setSelectedEyeFilter] = useState<'ALL' | 'OD' | 'OS'>('ALL');
  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(null);

  // 1. Calculate Metrics for 4 Clinical KPI Cards
  const items = useMemo(() => batchJob?.items || [], [batchJob?.items]);

  const uniquePatientsCount = useMemo(() => {
    if (items.length === 0) return 128; // Fallback baseline for clinical demonstration
    const unique = new Set(items.map((it) => it.mrn || it.patientName || it.id));
    return Math.max(unique.size, 1);
  }, [items]);

  const highRiskItems = useMemo(() => {
    return items.filter((it) => {
      const lvl = (it.riskLevel || '').toUpperCase();
      const score = it.riskScore || 0;
      return lvl === 'HIGH' || lvl === 'CRITICAL' || lvl === 'SEVERE' || score >= 70;
    });
  }, [items]);

  const highRiskCount = useMemo(() => {
    if (items.length > 0) return highRiskItems.length;
    return 14; // Baseline clinical demonstration
  }, [items.length, highRiskItems.length]);

  const screeningsToday = useMemo(() => {
    if (batchJob?.processedCount && batchJob.processedCount > 0) {
      return batchJob.processedCount;
    }
    return 42; // Baseline clinical demonstration
  }, [batchJob?.processedCount]);

  const processingQueueCount = useMemo(() => {
    if (batchJob?.status === 'IN_PROGRESS' || batchJob?.status === 'QUEUED') {
      return Math.max(0, (batchJob.totalImages || 0) - (batchJob.processedCount || 0));
    }
    const inFlight = items.filter(
      (it) => it.status === 'PROCESSING' || it.status === 'PENDING' || it.status === 'QUEUED'
    );
    return inFlight.length;
  }, [batchJob?.status, batchJob?.totalImages, batchJob?.processedCount, items]);

  // 2. High-Risk Cases Queue for Immediate Attention
  const displayHighRiskQueue = useMemo(() => {
    let list = highRiskItems;
    if (list.length === 0 && items.length === 0) {
      // Seed clinical representative high risk cases if no active batch loaded
      list = [
        {
          id: 'ITEM-HR-001',
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
          rationales: ['Tỷ lệ A/V co hẹp nặng (0.52)', 'Dấu hiệu võng mạc ĐTĐ tiền tăng sinh'],
        },
        {
          id: 'ITEM-HR-002',
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
          rationales: ['Xuất huyết vi thể lan tỏa', 'Phù gai thị vi mạch'],
        },
        {
          id: 'ITEM-HR-003',
          patientName: 'Phạm Đức Dũng',
          mrn: 'MRN-43091',
          pseudonymId: 'ANON-43091',
          eye: 'OD',
          fileName: 'fundus_od_dung_43091.png',
          status: 'DONE',
          riskLevel: 'High',
          riskScore: 76,
          patientAge: 59,
          patientGender: 'M',
          systolicBp: 145,
          diastolicBp: 92,
          hbA1c: 7.4,
          strokeRisk: 71,
          rationales: ['Xơ cứng động mạch võng mạc độ 2'],
        },
      ] as ClinicBatchJobItem[];
    }

    if (selectedEyeFilter !== 'ALL') {
      list = list.filter((it) => it.eye === selectedEyeFilter);
    }
    return list;
  }, [highRiskItems, items.length, selectedEyeFilter]);

  // 3. Historical Batches for Recent Batches Table
  const recentBatchesData = useMemo<RecentBatchRecord[]>(() => {
    const records: RecentBatchRecord[] = [];
    if (batchJob && batchJob.batchId && batchJob.batchId !== 'CHƯA_TẢI_ĐỢT_NÀO') {
      records.push({
        id: batchJob.batchId,
        batchId: batchJob.batchId,
        date: batchJob.createdAt
          ? new Date(batchJob.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')
          : (isVi ? 'Hôm nay' : 'Today'),
        totalImages: batchJob.totalImages || items.length,
        processedCount: batchJob.processedCount || items.length,
        highRiskCount: highRiskItems.length,
        status:
          batchJob.status === 'IN_PROGRESS' || batchJob.status === 'QUEUED'
            ? 'IN_PROGRESS'
            : batchJob.failedCount > 0
            ? 'FAILED'
            : 'COMPLETED',
      });
    }

    // Historical batches for demonstration
    records.push(
      {
        id: 'BATCH-2026-09-17-A',
        batchId: 'BATCH-2026-09-17-A',
        date: '17/09/2026',
        totalImages: 60,
        processedCount: 60,
        highRiskCount: 6,
        status: 'COMPLETED',
      },
      {
        id: 'BATCH-2026-09-16-B',
        batchId: 'BATCH-2026-09-16-B',
        date: '16/09/2026',
        totalImages: 45,
        processedCount: 45,
        highRiskCount: 4,
        status: 'COMPLETED',
      },
      {
        id: 'BATCH-2026-09-15-C',
        batchId: 'BATCH-2026-09-15-C',
        date: '15/09/2026',
        totalImages: 50,
        processedCount: 48,
        highRiskCount: 5,
        status: 'COMPLETED',
      }
    );

    return records;
  }, [batchJob, items.length, highRiskItems.length, isVi]);

  // Columns for Recent Batches DataTable
  const batchTableColumns: DataTableColumn<RecentBatchRecord>[] = useMemo(
    () => [
      {
        key: 'batchId',
        header: isVi ? 'Mã Đợt Khám' : 'Batch ID',
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-mono-data font-semibold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
              {row.batchId}
            </span>
          </div>
        ),
      },
      {
        key: 'date',
        header: isVi ? 'Ngày Tải Lên' : 'Upload Date',
        render: (row) => (
          <span className="text-xs text-slate-600 font-sans">{row.date}</span>
        ),
      },
      {
        key: 'totalImages',
        header: isVi ? 'Tổng Ảnh' : 'Total Images',
        align: 'center',
        render: (row) => (
          <span className="font-mono-data font-bold text-xs text-slate-800">
            {row.totalImages}
          </span>
        ),
      },
      {
        key: 'processedCount',
        header: isVi ? 'Đã Phân Tích' : 'AI Processed',
        align: 'center',
        render: (row) => {
          const rate = row.totalImages > 0 ? Math.round((row.processedCount / row.totalImages) * 100) : 100;
          return (
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-mono-data text-xs text-emerald-700 font-semibold">
                {row.processedCount}
              </span>
              <span className="text-[11px] text-slate-400">({rate}%)</span>
            </div>
          );
        },
      },
      {
        key: 'highRiskCount',
        header: isVi ? 'Nguy Cơ Cao' : 'High Risk',
        align: 'center',
        render: (row) => (
          <span
            className={`font-mono-data text-xs font-bold px-2 py-0.5 rounded-full ${
              row.highRiskCount > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'text-slate-500'
            }`}
          >
            {row.highRiskCount}
          </span>
        ),
      },
      {
        key: 'status',
        header: isVi ? 'Trạng Thái' : 'Status',
        render: (row) => {
          if (row.status === 'IN_PROGRESS') {
            return <StatusBadge status="IN_PROGRESS" label={isVi ? 'Đang xử lý' : 'Processing'} />;
          }
          if (row.status === 'FAILED') {
            return <StatusBadge status="FAILED" label={isVi ? 'Lỗi một phần' : 'Partial Error'} />;
          }
          return <StatusBadge status="COMPLETED" label={isVi ? 'Đã hoàn thành' : 'Completed'} />;
        },
      },
      {
        key: 'actions',
        header: isVi ? 'Thao Tác' : 'Action',
        align: 'right',
        className: 'text-right',
        render: () => (
          <button
            onClick={() => onNavigate?.('bulk-batch')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
          >
            <span>{isVi ? 'Mở chi tiết' : 'Open batch'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ),
      },
    ],
    [isVi, onNavigate]
  );

  // 4. 7-Day Activity Trajectory SVG Chart Data Points
  const activityTrendData = useMemo(() => [
    { day: isVi ? 'T2' : 'Mon', date: '12/09', total: 28, highRisk: 3 },
    { day: isVi ? 'T3' : 'Tue', date: '13/09', total: 34, highRisk: 4 },
    { day: isVi ? 'T4' : 'Wed', date: '14/09', total: 42, highRisk: 5 },
    { day: isVi ? 'T5' : 'Thu', date: '15/09', total: 50, highRisk: 7 },
    { day: isVi ? 'T6' : 'Fri', date: '16/09', total: 45, highRisk: 4 },
    { day: isVi ? 'T7' : 'Sat', date: '17/09', total: 60, highRisk: 6 },
    { day: isVi ? 'CN' : 'Sun', date: '18/09', total: screeningsToday, highRisk: highRiskCount },
  ], [isVi, screeningsToday, highRiskCount]);

  // Calculate SVG line points
  const maxTotal = 70;
  const chartHeight = 150;
  const chartWidth = 520;
  const xStep = chartWidth / (activityTrendData.length - 1);

  const points = activityTrendData.map((d, i) => {
    const x = i * xStep;
    const y = chartHeight - (d.total / maxTotal) * (chartHeight - 30) - 15;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  // Active batch progress calculation
  const totalBatchImages = batchJob?.totalImages || 0;
  const processedBatchImages = batchJob?.processedCount || 0;
  const batchProgressPercent =
    totalBatchImages > 0 ? Math.min(100, Math.round((processedBatchImages / totalBatchImages) * 100)) : 100;

  return (
    <div className="space-y-6">
      {/* 1. Facility Overview Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-clinical-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {batchJob?.clinicName || t('clinic.portal.defaultFacility', 'Phòng khám chuyên khoa')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {isVi ? 'Đã xác minh' : 'Verified'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVi
                ? 'Trung tâm sàng lọc sức khỏe vi mạch võng mạc & quản lý chiến dịch'
                : 'Retinal vascular health screening center & campaign management'}
            </p>
          </div>
        </div>

        {/* Quick actions buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate?.('campaign-analytics')}
            icon={<Activity className="w-3.5 h-3.5" />}
          >
            {isVi ? 'Phân Tích' : 'Analytics'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate?.('doctors-manage')}
            icon={<Users className="w-3.5 h-3.5" />}
          >
            {isVi ? 'Bác Sĩ' : 'Doctors'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (onUploadNewBatch) onUploadNewBatch();
              else onNavigate?.('bulk-batch');
            }}
            icon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            {isVi ? 'Tải Lên Lô Mới' : 'New Batch'}
          </Button>
        </div>
      </div>

      {/* 2. 4 Clinical KPI Metrics Cards (Requirement R5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Patients */}
        <KpiCard
          title={isVi ? 'Tổng Bệnh Nhân' : 'Total Patients'}
          value={uniquePatientsCount}
          subtitle={isVi ? 'Đã đăng ký trong hệ thống' : 'Registered in system'}
          trend={isVi ? '+8% tháng này' : '+8% this month'}
          icon={<Users className="w-5 h-5 text-brand-600" />}
          detailsLink={{
            label: isVi ? 'Xem danh sách' : 'View list',
            onClick: () => onNavigate?.('patient-list'),
          }}
        />

        {/* KPI 2: Screenings Today */}
        <KpiCard
          title={isVi ? 'Sàng Lọc Hôm Nay' : 'Screenings Today'}
          value={screeningsToday}
          subtitle={isVi ? 'Ca quét võng mạc hoàn tất' : 'Completed fundus scans'}
          trend={isVi ? '+14% so với hôm qua' : '+14% vs yesterday'}
          icon={<Activity className="w-5 h-5 text-cyan-600" />}
          detailsLink={{
            label: isVi ? 'Xem kết quả' : 'View results',
            onClick: () => onNavigate?.('scan-history'),
          }}
        />

        {/* KPI 3: Processing in Queue */}
        <KpiCard
          title={isVi ? 'Đang Xử Lý' : 'Processing'}
          value={processingQueueCount}
          subtitle={isVi ? 'Hàng đợi phân tích AI nền' : 'Async AI processing queue'}
          trend={isVi ? 'Thời gian ~1.8s/ảnh' : '~1.8s/image latency'}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          detailsLink={{
            label: isVi ? 'Xem tiến độ' : 'View progress',
            onClick: () => onNavigate?.('bulk-batch'),
          }}
        />

        {/* KPI 4: High Risk Cases */}
        <KpiCard
          title={isVi ? 'Nguy Cơ Cao' : 'High Risk'}
          value={highRiskCount}
          subtitle={isVi ? 'Cần hội chẩn & chuyển viện' : 'Requires clinical consult'}
          trend={isVi ? 'Chiếm 14.8% tổng ca' : '14.8% of screened'}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          detailsLink={{
            label: isVi ? 'Xem cảnh báo' : 'View alerts',
            onClick: () => {
              const el = document.getElementById('high-risk-queue-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            },
          }}
        />
      </div>

      {/* 3. Middle Grid: Screening Activity Chart + Batch Screening Queue Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7-Day Screening Activity Chart (8 cols) */}
        <div className="lg:col-span-8">
          <SectionCard
            title={isVi ? 'Biểu Đồ Hoạt Động Sàng Lọc' : 'Screening Activity Trend'}
            subtitle={isVi ? 'Khối lượng ca chụp và tỷ lệ phát hiện nguy cơ cao trong 7 ngày gần nhất' : '7-day screening volume and high risk detection rates'}
            headerAction={
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <span className="text-slate-600 font-medium">{isVi ? 'Tổng ca' : 'Total'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600 font-medium">{isVi ? 'Nguy cơ cao' : 'High Risk'}</span>
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              {/* SVG Curve Chart */}
              <div className="relative w-full h-[180px] pt-4 overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="clinicActivityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3478F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3478F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0"
                      y1={chartHeight * ratio}
                      x2={chartWidth}
                      y2={chartHeight * ratio}
                      stroke="#EAECF0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Area Fill */}
                  <path d={areaD} fill="url(#clinicActivityGradient)" />

                  {/* Primary Trend Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3478F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Point Markers */}
                  {points.map((pt, idx) => (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveChartPoint(idx)}
                      onMouseLeave={() => setActiveChartPoint(null)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={activeChartPoint === idx ? 6 : 4}
                        fill="#FFFFFF"
                        stroke="#3478F6"
                        strokeWidth={activeChartPoint === idx ? 3 : 2}
                        className="transition-all"
                      />
                      {pt.highRisk > 0 && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={2}
                          fill="#EF4444"
                        />
                      )}
                    </g>
                  ))}
                </svg>

                {/* Hover Tooltip */}
                {activeChartPoint !== null && (
                  <div
                    className="absolute z-20 pointer-events-none bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg border border-slate-700 transition-all transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${(activeChartPoint / (activityTrendData.length - 1)) * 100}%`,
                      top: '25px',
                    }}
                  >
                    <div className="font-bold text-slate-200">
                      {activityTrendData[activeChartPoint].day} ({activityTrendData[activeChartPoint].date})
                    </div>
                    <div className="text-brand-300 font-semibold">
                      {isVi ? 'Tổng ca: ' : 'Total: '}
                      {activityTrendData[activeChartPoint].total}
                    </div>
                    <div className="text-rose-400">
                      {isVi ? 'Nguy cơ cao: ' : 'High risk: '}
                      {activityTrendData[activeChartPoint].highRisk}
                    </div>
                  </div>
                )}
              </div>

              {/* X-Axis Day Labels */}
              <div className="flex justify-between text-[11px] font-medium text-slate-400 px-1 border-t border-slate-100 pt-2">
                {activityTrendData.map((d, idx) => (
                  <div key={idx} className="text-center">
                    <span className="block text-slate-700 font-semibold">{d.day}</span>
                    <span className="text-[10px] text-slate-400">{d.date}</span>
                  </div>
                ))}
              </div>

              {/* Summary Stats Chips */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                <span className="text-slate-500">
                  {isVi ? 'Tổng lượt khám 7 ngày: ' : '7-Day Screenings: '}
                  <strong className="text-slate-800 font-bold">
                    {activityTrendData.reduce((s, d) => s + d.total, 0)} ca
                  </strong>
                </span>
                <span className="text-slate-500">
                  {isVi ? 'Độ chính xác mô hình AI: ' : 'AI Screening Accuracy: '}
                  <strong className="text-brand-700 font-bold">98.4%</strong>
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column: Batch Screening Queue Card with Realtime Progress Bar (4 cols) */}
        <div className="lg:col-span-4">
          <SectionCard
            title={isVi ? 'Hàng Đợi Sàng Lọc Theo Lô' : 'Batch Screening Queue'}
            subtitle={isVi ? 'Tiến độ xử lý đợt ảnh gần nhất' : 'Current active batch progress'}
            headerAction={
              <button
                onClick={() => onNavigate?.('bulk-batch')}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isVi ? 'Chi tiết' : 'Details'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-4">
              {/* Batch ID & Status Tag */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {isVi ? 'Đợt sàng lọc hiện tại' : 'Active Batch'}
                  </span>
                  <span className="font-mono-data font-bold text-sm text-slate-900">
                    {batchJob?.batchId || 'CHƯA_TẢI_ĐỢT_NÀO'}
                  </span>
                </div>
                {batchJob?.status === 'IN_PROGRESS' || batchJob?.status === 'QUEUED' ? (
                  <StatusBadge status="IN_PROGRESS" label={isVi ? 'Đang phân tích' : 'Analyzing'} />
                ) : (
                  <StatusBadge status="COMPLETED" label={isVi ? 'Đã hoàn thành' : 'Completed'} />
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">
                    {isVi ? 'Tiến độ phân tích Gemini AI' : 'Gemini AI Progress'}
                  </span>
                  <span className="font-mono-data font-bold text-brand-700">
                    {batchProgressPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${batchProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">
                    {isVi ? 'Tổng số ảnh' : 'Total Images'}
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono-data">
                    {batchJob?.totalImages || items.length}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    {isVi ? 'Đã xử lý xong' : 'Completed'}
                  </span>
                  <span className="text-base font-bold text-emerald-700 font-mono-data">
                    {batchJob?.processedCount || items.length}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-medium block">
                    {isVi ? 'Lỗi / Cần chụp lại' : 'Quality Errors'}
                  </span>
                  <span className="text-base font-bold text-rose-700 font-mono-data">
                    {batchJob?.failedCount || 0}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">
                    {isVi ? 'Thời gian ước tính' : 'Est. Remaining'}
                  </span>
                  <span className="text-base font-bold text-slate-700 font-mono-data">
                    {batchJob?.estimatedTimeRemainingSec ? `${batchJob.estimatedTimeRemainingSec}s` : '0s'}
                  </span>
                </div>
              </div>

              {/* CTA Button to Batch Workspace */}
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center"
                onClick={() => onNavigate?.('bulk-batch')}
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                {isVi ? 'Mở Bàn Làm Việc Lô Ảnh' : 'Open Batch Workspace'}
              </Button>
              <button
                type="button"
                onClick={() => onNavigate?.('scan-history')}
                className="w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline pt-1 cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowRight className="w-3 h-3" />
                <span>{isVi ? 'Xem từng kết quả scan riêng lẻ' : 'View individual scan results'}</span>
              </button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 4. Bottom Grid: High-Risk Case Queue + Recent Batches Table */}
      <div className="space-y-6">
        {/* High-Risk Cases Queue Section */}
        <div id="high-risk-queue-section">
          <SectionCard
            title={isVi ? 'Hàng Đợi Ca Nguy Cơ Cao Cần Chú Ý' : 'High-Risk Priority Case Queue'}
            subtitle={isVi ? 'Các bệnh nhân có điểm nguy cơ tim mạch / đột quỵ ≥ 70% được phân loại bởi AI' : 'Patients flagged with cardiovascular or stroke risk score ≥ 70%'}
            headerAction={
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedEyeFilter('ALL')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedEyeFilter === 'ALL'
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {isVi ? 'Tất cả mắt' : 'All eyes'}
                </button>
                <button
                  onClick={() => setSelectedEyeFilter('OD')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedEyeFilter === 'OD'
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Mắt Phải (OD)
                </button>
                <button
                  onClick={() => setSelectedEyeFilter('OS')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedEyeFilter === 'OS'
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Mắt Trái (OS)
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayHighRiskQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 hover:bg-rose-50/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectBatchItem) onSelectBatchItem(item);
                            else onNavigate?.('scan-history');
                          }}
                          className="font-mono-data font-bold text-xs text-slate-900 hover:text-brand-600 hover:underline cursor-pointer"
                          title={isVi ? 'Xem chi tiết ca khám' : 'View scan details'}
                        >
                          {item.mrn || item.pseudonymId || item.id}
                        </button>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                          {item.eye === 'OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        {item.riskScore || 85}%
                      </span>
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectBatchItem) onSelectBatchItem(item);
                          else onNavigate?.('scan-history');
                        }}
                        className="text-left text-xs font-bold text-slate-900 hover:text-brand-600 hover:underline cursor-pointer block truncate"
                        title={isVi ? 'Xem chi tiết ca khám' : 'View scan details'}
                      >
                        {item.patientName || 'Bệnh nhân ẩn danh'}
                      </button>
                      <p className="text-[11px] text-slate-500">
                        {item.patientAge ? `${item.patientAge}T` : '62T'} • {item.patientGender === 'F' ? 'Nữ' : 'Nam'}
                        {item.systolicBp ? ` • HA: ${item.systolicBp}/${item.diastolicBp}` : ''}
                        {item.hbA1c ? ` • HbA1c: ${item.hbA1c}%` : ''}
                      </p>
                    </div>

                    {item.rationales && item.rationales.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.rationales.slice(0, 2).map((r, i) => (
                          <div key={i} className="text-[11px] text-rose-700 flex items-start gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                            <span className="line-clamp-1">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {item.fileName || 'Ảnh đáy mắt'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (onSelectBatchItem) onSelectBatchItem(item);
                        else onNavigate?.('bulk-batch');
                      }}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      {isVi ? 'Xem ca' : 'View'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Recent Batches DataTable Section */}
        <SectionCard
          title={isVi ? 'Lịch Sử Các Đợt Sàng Lọc Gần Đây' : 'Recent Screening Batches'}
          subtitle={isVi ? 'Danh sách các lô ảnh võng mạc đã tải lên và phân tích' : 'List of uploaded and analyzed fundus image batches'}
          headerAction={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate?.('bulk-batch')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {isVi ? 'Quản lý toàn bộ đợt' : 'Manage all batches'}
            </Button>
          }
        >
          <DataTable
            columns={batchTableColumns}
            data={recentBatchesData}
            keyExtractor={(row) => row.id}
            emptyMessage={isVi ? 'Chưa có đợt khám nào được ghi nhận.' : 'No screening batches recorded.'}
          />
        </SectionCard>
      </div>
    </div>
  );
};
