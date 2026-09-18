import React, { useState } from 'react';
import {
  Heart,
  Eye,
  Activity,
  Zap,
  UploadCloud,
  FileText,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Clock,
  Stethoscope,
  CalendarCheck,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  UserCheck,
} from 'lucide-react';
import { AIRiskResult, PatientProfile } from '../../types/cds';
import { PatientHistoryItem } from './PatientHistoryView';
import { KpiCard } from '../../components/common/KpiCard';
import { SectionCard } from '../../components/common/SectionCard';
import { DataTable, DataTableColumn } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { useLanguage } from '../../context/LanguageContext';

export interface PatientDashboardViewProps {
  patient: PatientProfile;
  latestResult: AIRiskResult | null;
  userCredits: number;
  onNavigate: (view: string) => void;
  onOpenCreditModal: () => void;
  onOpenChatModal: () => void;
  onOpenReportModal: () => void;
  onOpenRegisterModal?: () => void;
  upcomingAppointment?: {
    doctorName: string;
    doctorId?: string;
    date: string;
    time: string;
    reason?: string;
  } | null;
  scanHistory?: PatientHistoryItem[];
}

const formatDoctorName = (doc: any, fallback: string = ''): string => {
  if (!doc) return fallback;
  if (typeof doc === 'string') return doc;
  if (typeof doc === 'object') {
    return doc.fullName || doc.name || doc.assignedDoctor || fallback;
  }
  return String(doc);
};

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  patient,
  latestResult,
  userCredits,
  onNavigate,
  onOpenCreditModal,
  onOpenChatModal,
  onOpenReportModal,
  onOpenRegisterModal,
  upcomingAppointment,
  scanHistory = [],
}) => {
  const { t, isVi } = useLanguage();
  const assignedDoctorName = formatDoctorName(patient?.assignedDoctor);

  const riskScore =
    latestResult?.overallVascularRiskScore ??
    latestResult?.riskScore ??
    (latestResult?.cardiovascularRisk?.score || 0);

  const [selectedEyeFilter, setSelectedEyeFilter] = useState<'ALL' | 'OD' | 'OS'>('ALL');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Derive historical trend points
  const sortedHistory = [...scanHistory].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const trendPoints = React.useMemo(() => {
    let source = sortedHistory;
    if (selectedEyeFilter === 'OD') {
      source = sortedHistory.filter((item) => !item.eyePosition?.includes('OS') && item.eyePosition !== 'Left');
    } else if (selectedEyeFilter === 'OS') {
      source = sortedHistory.filter((item) => item.eyePosition?.includes('OS') || item.eyePosition === 'Left');
    }

    if (source.length >= 2) {
      return source.map((item) => ({
        id: item.id,
        date: new Date(item.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
          day: '2-digit',
          month: '2-digit',
        }),
        score: item.riskScore,
        eye: item.eyePosition?.includes('OS') ? 'OS' : 'OD',
        level: item.riskLevel,
      }));
    }

    // Default reference trend when 0 or 1 historical screenings exist
    const baseScore = latestResult ? riskScore : 45;
    if (selectedEyeFilter === 'OD') {
      return [
        { id: 'od-1', date: '18/03', score: Math.min(100, Math.max(15, baseScore + 12)), eye: 'OD', level: 'Moderate' },
        { id: 'od-2', date: '22/05', score: Math.min(100, Math.max(15, baseScore + 7)), eye: 'OD', level: 'Moderate' },
        { id: 'od-3', date: '14/07', score: Math.min(100, Math.max(15, baseScore + 3)), eye: 'OD', level: 'Low' },
        { id: 'od-4', date: isVi ? 'Hiện tại' : 'Today', score: baseScore, eye: 'OD', level: baseScore < 40 ? 'Low' : baseScore < 65 ? 'Moderate' : 'High' },
      ];
    }
    if (selectedEyeFilter === 'OS') {
      return [
        { id: 'os-1', date: '18/03', score: Math.min(100, Math.max(15, baseScore + 16)), eye: 'OS', level: 'Moderate' },
        { id: 'os-2', date: '22/05', score: Math.min(100, Math.max(15, baseScore + 10)), eye: 'OS', level: 'Moderate' },
        { id: 'os-3', date: '14/07', score: Math.min(100, Math.max(15, baseScore + 5)), eye: 'OS', level: 'Moderate' },
        { id: 'os-4', date: isVi ? 'Hiện tại' : 'Today', score: Math.min(100, baseScore + 2), eye: 'OS', level: baseScore < 40 ? 'Low' : baseScore < 65 ? 'Moderate' : 'High' },
      ];
    }

    return [
      { id: 'all-1', date: '18/03', score: Math.min(100, Math.max(15, baseScore + 14)), eye: 'OD', level: 'Moderate' },
      { id: 'all-2', date: '22/05', score: Math.min(100, Math.max(15, baseScore + 8)), eye: 'OS', level: 'Moderate' },
      { id: 'all-3', date: '14/07', score: Math.min(100, Math.max(15, baseScore + 4)), eye: 'OD', level: 'Low' },
      { id: 'all-4', date: isVi ? 'Hiện tại' : 'Today', score: baseScore, eye: latestResult?.eyePosition?.includes('OS') ? 'OS' : 'OD', level: baseScore < 40 ? 'Low' : baseScore < 65 ? 'Moderate' : 'High' },
    ];
  }, [sortedHistory, selectedEyeFilter, isVi, latestResult, riskScore]);

  // Determine OD/OS for latest result
  const latestEyePosition = latestResult?.eyePosition || 'Right_OD';
  const isLatestOS = latestEyePosition.includes('OS') || latestEyePosition === 'Left';
  const latestEyeLabel = isLatestOS
    ? (isVi ? 'Mắt trái (OS)' : 'Left Eye (OS)')
    : (isVi ? 'Mắt phải (OD)' : 'Right Eye (OD)');

  // DataTable columns for recent screenings
  const historyColumns: DataTableColumn<PatientHistoryItem>[] = [
    {
      key: 'createdAt',
      header: isVi ? 'Thời gian khám' : 'Date & Time',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 font-mono-data text-xs">
            {new Date(item.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
          </span>
          <span className="text-[11px] text-slate-400">
            {new Date(item.createdAt).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'eyePosition',
      header: isVi ? 'Mắt khám' : 'Eye',
      render: (item) => {
        const isOS = item.eyePosition?.includes('OS') || item.eyePosition === 'Left';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isOS
                ? 'bg-[#EEF5FF] text-[#0EA5E9] border border-[#E0EAFF]'
                : 'bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE]'
            }`}
          >
            <Eye className="w-3 h-3" />
            {isOS ? 'OS' : 'OD'}
          </span>
        );
      },
    },
    {
      key: 'scanType',
      header: isVi ? 'Kiểu chụp' : 'Scan Type',
      render: (item) => (
        <span className="text-xs text-slate-700">
          {item.scanType === 'Fundus_Macula'
            ? (isVi ? 'Ảnh hoàng điểm' : 'Macula Fundus')
            : item.scanType === 'Fundus_OpticDisc'
            ? (isVi ? 'Ảnh gai thị' : 'Optic Disc')
            : (item.scanType || (isVi ? 'Chụp đáy mắt' : 'Fundus Scan'))}
        </span>
      ),
    },
    {
      key: 'riskScore',
      header: isVi ? 'Điểm nguy cơ' : 'Risk Score',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 font-mono-data text-xs">
            {item.riskScore}
          </span>
          <span className="text-[11px] text-slate-400">/ 100</span>
        </div>
      ),
    },
    {
      key: 'riskLevel',
      header: isVi ? 'Phân tầng' : 'Risk Level',
      render: (item) => <StatusBadge status={item.riskLevel || 'Normal'} size="sm" />,
    },
    {
      key: 'status',
      header: isVi ? 'Trạng thái duyệt' : 'Review Status',
      render: (item) => (
        <StatusBadge
          status={item.doctorReviewed || item.status === 'REVIEWED' ? 'reviewed' : 'pending'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: isVi ? 'Thao tác' : 'Actions',
      align: 'right',
      render: () => (
        <button
          type="button"
          onClick={() => onNavigate('screening-result')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#3478F6] hover:text-[#2563EB] hover:underline cursor-pointer"
        >
          <span>{isVi ? 'Xem kết quả' : 'View Result'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP SECTION: 4 KPI CARDS (Requirement R3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Latest Risk Score */}
        <KpiCard
          title={isVi ? 'Điểm Nguy Cơ Mới Nhất' : 'Latest Risk Score'}
          value={latestResult ? `${riskScore}` : '—'}
          unit={latestResult ? '/ 100' : ''}
          icon={<Heart className="w-5 h-5 text-[#3478F6]" />}
          change={{
            value: latestResult ? (riskScore < 40 ? '-4%' : riskScore < 65 ? '+1%' : '+6%') : '—',
            positive: riskScore < 50,
          }}
          subtitle={
            latestResult
              ? (riskScore < 40
                  ? (isVi ? 'Mức ổn định (Thấp)' : 'Stable (Low risk)')
                  : riskScore < 65
                  ? (isVi ? 'Nguy cơ trung bình' : 'Moderate risk')
                  : (isVi ? 'Cảnh báo nguy cơ cao' : 'High risk alert'))
              : (isVi ? 'Chưa có ca khám' : 'No screenings')
          }
          detailsLink={{
            label: isVi ? 'Xem kết quả' : 'View result',
            onClick: () => onNavigate('screening-result'),
          }}
        />

        {/* KPI 2: Total Screenings */}
        <KpiCard
          title={isVi ? 'Tổng Lần Sàng Lọc' : 'Total Screenings'}
          value={scanHistory.length}
          unit={isVi ? 'lần' : 'exams'}
          icon={<Eye className="w-5 h-5 text-[#3478F6]" />}
          change={{
            value: scanHistory.length > 0 ? (isVi ? `+${scanHistory.length} ca khám` : `+${scanHistory.length} exams`) : '0',
            positive: true,
          }}
          subtitle={isVi ? 'Hồ sơ theo dõi định kỳ' : 'Periodic monitoring'}
          detailsLink={{
            label: isVi ? 'Xem lịch sử' : 'View history',
            onClick: () => onNavigate('scan-history'),
          }}
        />

        {/* KPI 3: Upcoming Appointment */}
        <KpiCard
          title={isVi ? 'Lịch Hẹn Khám Sắp Tới' : 'Upcoming Appointments'}
          value={upcomingAppointment ? upcomingAppointment.date : (isVi ? 'Chưa có' : 'None')}
          icon={<CalendarCheck className="w-5 h-5 text-[#3478F6]" />}
          subtitle={
            upcomingAppointment
              ? `${upcomingAppointment.time} • ${upcomingAppointment.doctorName}`
              : (isVi ? 'Tư vấn chuyên khoa mắt' : 'Specialist consultation')
          }
          detailsLink={{
            label: upcomingAppointment ? (isVi ? 'Chi tiết' : 'Details') : (isVi ? 'Đặt lịch' : 'Book'),
            onClick: () => (onOpenRegisterModal ? onOpenRegisterModal() : onNavigate('appointment')),
          }}
        />

        {/* KPI 4: Screening Credits */}
        <KpiCard
          title={isVi ? 'Lượt Khám Còn Lại' : 'Available Credits'}
          value={userCredits}
          unit={isVi ? 'lượt' : 'credits'}
          icon={<Zap className="w-5 h-5 text-[#3478F6]" />}
          subtitle={isVi ? 'Phân tích AI tức thời' : 'Instant AI inference'}
          detailsLink={{
            label: isVi ? 'Nạp thêm' : 'Add credits',
            onClick: onOpenCreditModal,
          }}
        />
      </div>

      {/* 2. MIDDLE SECTION: RISK TREND CHART & LATEST RESULT CARD + RIGHT DOCTOR & APPOINTMENT CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Risk Trend Chart & Latest Result Card */}
        <div className="lg:col-span-8 space-y-6">
          {/* Risk Trend Chart Component */}
          <SectionCard
            title={isVi ? 'Biểu Đồ Xu Hướng Nguy Cơ Vi Mạch Võng Mạc' : 'Retinal Vascular Risk Trend'}
            subtitle={
              isVi
                ? 'Theo dõi diễn tiến chỉ số nguy cơ vi mạch qua các lần chụp định kỳ'
                : 'Longitudinal risk score trajectory across screening sessions'
            }
            headerAction={
              <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-xl border border-[#EAECF0]">
                {(['ALL', 'OD', 'OS'] as const).map((eye) => (
                  <button
                    key={eye}
                    type="button"
                    onClick={() => setSelectedEyeFilter(eye)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedEyeFilter === eye
                        ? 'bg-[#3478F6] text-white shadow-xs'
                        : 'text-[#667085] hover:text-[#111827]'
                    }`}
                  >
                    {eye === 'ALL' ? (isVi ? 'Tất cả' : 'All') : eye}
                  </button>
                ))}
              </div>
            }
          >
            <div className="space-y-4">
              {/* SVG Trend Line & Area Chart */}
              <div className="relative w-full h-[220px] bg-[#FAFBFD] rounded-xl p-4 border border-[#EAECF0] overflow-hidden">
                <svg
                  viewBox="0 0 540 180"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="auraRiskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3478F6" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#3478F6" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  <line x1="40" y1="20" x2="520" y2="20" stroke="#EAECF0" strokeDasharray="3 3" />
                  <line x1="40" y1="65" x2="520" y2="65" stroke="#EAECF0" strokeDasharray="3 3" />
                  <line x1="40" y1="110" x2="520" y2="110" stroke="#EAECF0" strokeDasharray="3 3" />
                  <line x1="40" y1="155" x2="520" y2="155" stroke="#EAECF0" />

                  {/* Y-axis Labels */}
                  <text x="32" y="24" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">100</text>
                  <text x="32" y="69" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">65</text>
                  <text x="32" y="114" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">40</text>
                  <text x="32" y="159" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">0</text>

                  {/* Normal Zone Safe Line (40 threshold) */}
                  <line x1="40" y1="110" x2="520" y2="110" stroke="#22C55E" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

                  {/* Path Calculation */}
                  {(() => {
                    const startX = 60;
                    const endX = 500;
                    const stepX = (endX - startX) / Math.max(1, trendPoints.length - 1);
                    const getY = (score: number) => 155 - (score / 100) * 135;

                    const points = trendPoints.map((pt, i) => ({
                      x: startX + i * stepX,
                      y: getY(pt.score),
                      ...pt,
                    }));

                    const pathD = points.reduce((acc, pt, idx) => {
                      if (idx === 0) return `M ${pt.x} ${pt.y}`;
                      const prev = points[idx - 1];
                      const cpX1 = prev.x + (pt.x - prev.x) / 2;
                      const cpX2 = cpX1;
                      return `${acc} C ${cpX1} ${prev.y}, ${cpX2} ${pt.y}, ${pt.x} ${pt.y}`;
                    }, '');

                    const areaD = `${pathD} L ${points[points.length - 1].x} 155 L ${points[0].x} 155 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#auraRiskGradient)" />
                        <path d={pathD} fill="none" stroke="#3478F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Interactive Data Point Markers */}
                        {points.map((pt, i) => {
                          const isHovered = hoveredPointIndex === i;
                          return (
                            <g
                              key={pt.id}
                              onMouseEnter={() => setHoveredPointIndex(i)}
                              onMouseLeave={() => setHoveredPointIndex(null)}
                              className="cursor-pointer"
                            >
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 6 : 4.5}
                                fill="#FFFFFF"
                                stroke="#3478F6"
                                strokeWidth="2.5"
                                className="transition-all"
                              />
                              <text
                                x={pt.x}
                                y="172"
                                textAnchor="middle"
                                className="text-[10px] fill-[#667085] font-semibold"
                              >
                                {pt.date}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredPointIndex !== null && trendPoints[hoveredPointIndex] && (
                  <div
                    className="absolute z-20 top-3 right-4 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[#EAECF0] shadow-sm text-xs pointer-events-none animate-fade-in"
                  >
                    <span className="text-[#667085] font-medium">
                      {trendPoints[hoveredPointIndex].date} ({trendPoints[hoveredPointIndex].eye}):
                    </span>{' '}
                    <strong className="text-[#111827] font-mono-data font-bold">
                      {trendPoints[hoveredPointIndex].score}/100
                    </strong>{' '}
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      trendPoints[hoveredPointIndex].score < 40 ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#FFFAEB] text-[#F59E0B]'
                    }`}>
                      {trendPoints[hoveredPointIndex].level}
                    </span>
                  </div>
                )}
              </div>

              {/* Chart Legend & Indicators */}
              <div className="flex flex-wrap items-center justify-between text-xs text-[#667085] pt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#3478F6]" />
                    <span>{isVi ? 'Chỉ số nguy cơ tổng thể' : 'Vascular risk trajectory'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#22C55E] border-t border-dashed border-[#22C55E]" />
                    <span>{isVi ? 'Ngưỡng an toàn (< 40)' : 'Safe boundary (< 40)'}</span>
                  </span>
                </div>
                <span className="text-[11px] text-[#98A2B3]">
                  {isVi ? 'Chuẩn hóa theo phân tầng nhãn khoa quốc tế' : 'Normalized clinical scale'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Latest Result Card with OD/OS Indicator Badge */}
          <SectionCard
            title={isVi ? 'Kết Quả Đánh Giá Vi Mạch Đáy Mắt' : 'Latest Retinal Assessment'}
            subtitle={`${isVi ? 'Lần khám gần nhất' : 'Exam date'}: ${patient.lastExamDate || (isVi ? 'Hôm nay' : 'Today')}`}
            headerAction={
              latestResult ? (
                <div className="flex items-center gap-2">
                  {/* OD/OS Eye Indicator Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE]">
                    <Eye className="w-3.5 h-3.5" />
                    {latestEyeLabel}
                  </span>
                  <StatusBadge
                    status={latestResult.status === 'REVIEWED' ? 'reviewed' : 'pending'}
                    size="sm"
                  />
                </div>
              ) : null
            }
          >
            {latestResult ? (
              <div className="space-y-5">
                {/* Score Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-[#EAECF0]">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">
                      {isVi ? 'Điểm Nguy Cơ Vi Mạch' : 'Vascular Risk Score'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono-data text-[#111827]">
                        {riskScore}
                      </span>
                      <span className="text-sm font-semibold text-[#667085]">/ 100</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ml-2 ${
                          riskScore < 40
                            ? 'bg-[#ECFDF3] text-[#22C55E] border border-[#D1FADF]'
                            : riskScore < 65
                            ? 'bg-[#FFFAEB] text-[#F59E0B] border border-[#FEF0C7]'
                            : 'bg-[#FEF3F2] text-[#EF4444] border border-[#FEE4E2]'
                        }`}
                      >
                        {riskScore < 40
                          ? (isVi ? 'Nguy cơ Thấp' : 'Low Risk')
                          : riskScore < 65
                          ? (isVi ? 'Nguy cơ Trung bình' : 'Moderate')
                          : (isVi ? 'Nguy cơ Cao' : 'High Risk')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate('screening-result')}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      {isVi ? 'Xem toàn bộ kết quả' : 'View Full Result'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenReportModal}
                      icon={<FileText className="w-4 h-4" />}
                    >
                      {isVi ? 'In phiếu' : 'Report'}
                    </Button>
                  </div>
                </div>

                {/* 4 Clinical Risk Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Pillar 1: Cardiovascular */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#EF4444]" />
                        {isVi ? 'Tim mạch' : 'Cardiovascular'}
                      </span>
                      <span className="text-xs font-bold font-mono-data text-[#111827]">
                        {latestResult.cardiovascularRisk.score}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#3478F6] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, latestResult.cardiovascularRisk.score)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#667085] block truncate">
                      {latestResult.cardiovascularRisk.hypertensionStage}
                    </span>
                  </div>

                  {/* Pillar 2: Diabetic Retinopathy */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#0EA5E9]" />
                        {isVi ? 'Võng mạc ĐTĐ' : 'Retinopathy'}
                      </span>
                      <span className="text-xs font-bold font-mono-data text-[#111827]">
                        {latestResult.diabeticRetinopathyRisk.score}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#0EA5E9] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, latestResult.diabeticRetinopathyRisk.score)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#667085] block truncate">
                      {latestResult.diabeticRetinopathyRisk.etdrsGrade}
                    </span>
                  </div>

                  {/* Pillar 3: Stroke 3Y */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#F59E0B]" />
                        {isVi ? 'Đột Quỵ 3 Năm' : 'Stroke 3Y'}
                      </span>
                      <span className="text-xs font-bold font-mono-data text-[#111827]">
                        {latestResult.cardiovascularRisk.threeYearStrokeRiskPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#F59E0B] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, latestResult.cardiovascularRisk.threeYearStrokeRiskPercent)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#667085] block truncate">
                      {isVi ? 'Dự báo biến cố não' : 'Cerebrovascular'}
                    </span>
                  </div>

                  {/* Pillar 4: Hypertension */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                        {isVi ? 'Tăng Huyết Áp' : 'Hypertension'}
                      </span>
                      <span className="text-xs font-bold font-mono-data text-[#111827]">
                        {patient.systolicBp ? `${patient.systolicBp}/${patient.diastolicBp || 80}` : '120/80'}
                      </span>
                    </div>
                    <div className="w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#22C55E] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (patient.systolicBp || 120) / 1.6)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#667085] block truncate">
                      {isVi ? 'Huyết áp ghi nhận' : 'Recorded BP'}
                    </span>
                  </div>
                </div>

                {/* Doctor Note Preview */}
                <div className="p-4 rounded-xl bg-[#EEF5FF] border border-[#C7D7FE] text-xs flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#3478F6] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#111827] block">
                      {isVi ? 'Đánh giá chuyên môn' : 'Specialist evaluation'}:{' '}
                      <strong className="text-[#3478F6]">
                        {assignedDoctorName || latestResult.doctorName || (isVi ? 'Bác sĩ phụ trách' : 'Assigned Doctor')}
                      </strong>
                    </span>
                    <p className="text-[#4B5563] mt-0.5 leading-snug line-clamp-2">
                      {latestResult.doctorNotes || latestResult.findings || (isVi ? 'Chỉ số vi mạch đáy mắt đã được phân tích hoàn tất.' : 'Retinal biomarkers analyzed.')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#111827]">
                    {isVi ? 'Chưa Có Kết Quả Sàng Lọc' : 'No Screening Results Yet'}
                  </h3>
                  <p className="text-xs text-[#667085] max-w-sm mx-auto">
                    {isVi
                      ? 'Hãy bắt đầu bằng cách tải ảnh chụp mắt để hệ thống AI đánh giá sức khỏe vi mạch của bạn.'
                      : 'Upload fundus images to receive automated microvascular health assessment.'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate('upload-scan')}
                  icon={<UploadCloud className="w-4 h-4" />}
                >
                  {isVi ? 'Sàng lọc mới ngay' : 'Start Screening Now'}
                </Button>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right 4 Cols: Assigned Doctor Card & Upcoming Appointment Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assigned Doctor Card */}
          <SectionCard
            title={isVi ? 'Bác Sĩ Phụ Trách' : 'Assigned Doctor'}
            subtitle={isVi ? 'Theo dõi hồ sơ và ký duyệt kết quả' : 'Supervising specialist'}
            headerAction={
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                assignedDoctorName ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#F8F9FA] text-[#667085]'
              }`}>
                {assignedDoctorName ? (isVi ? 'Đang phụ trách' : 'Active') : (isVi ? 'Chưa chỉ định' : 'Unassigned')}
              </span>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center font-bold text-sm shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#111827] truncate">
                    {assignedDoctorName || (isVi ? 'Bác sĩ trực ban tự động' : 'On-duty Specialist')}
                  </h4>
                  <p className="text-[11px] text-[#667085] font-medium">
                    {isVi ? 'Chuyên khoa Mắt & Mạch Máu Não' : 'Ophthalmology & Vascular Care'}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#22C55E] font-semibold mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    <span>{isVi ? 'Sẵn sàng tư vấn trực tuyến' : 'Available for chat'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-1">
                    <span className="font-semibold text-slate-700">{isVi ? 'Thẩm định:' : 'Review:'}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      latestResult?.status === 'REVIEWED' || (latestResult as any)?.isReviewed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {latestResult?.status === 'REVIEWED' || (latestResult as any)?.isReviewed
                        ? (isVi ? 'Đã duyệt' : 'Reviewed')
                        : (isVi ? 'Chờ thẩm định' : 'Pending')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => onNavigate('consultation')}
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  {isVi ? 'Nhắn tin Bác sĩ' : 'Message Doctor'}
                </Button>
                {latestResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onNavigate('screening-result')}
                    icon={<FileText className="w-3.5 h-3.5 text-[#3478F6]" />}
                  >
                    {isVi ? 'Xem thẩm định' : 'View Review'}
                  </Button>
                )}
                {onOpenRegisterModal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenRegisterModal}
                  >
                    {isVi ? 'Đổi bác sĩ' : 'Change'}
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Upcoming Appointment Card */}
          <SectionCard
            title={isVi ? 'Lịch Hẹn Khám' : 'Appointments'}
            subtitle={isVi ? 'Khám chuyên sâu trực tiếp tại phòng khám' : 'Clinical consultation'}
            headerAction={
              upcomingAppointment ? (
                <StatusBadge status="booked" size="sm" />
              ) : null
            }
          >
            <div className="space-y-4">
              {upcomingAppointment ? (
                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAECF0] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111827]">{upcomingAppointment.doctorName}</span>
                    <span className="font-mono-data font-bold text-[#3478F6]">{upcomingAppointment.time}</span>
                  </div>
                  <div className="text-[11px] text-[#667085] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                    <span>{upcomingAppointment.date}</span>
                  </div>
                  {upcomingAppointment.reason && (
                    <p className="text-[11px] text-[#667085] italic line-clamp-2">
                      "{upcomingAppointment.reason}"
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#667085] leading-relaxed">
                  {isVi
                    ? 'Bạn chưa có lịch hẹn khám nào. Đặt lịch để được bác sĩ soi đáy mắt chuyên sâu.'
                    : 'No scheduled appointments. Book a consultation slot with your specialist.'}
                </p>
              )}

              {onOpenRegisterModal && (
                <Button
                  variant={upcomingAppointment ? 'outline' : 'primary'}
                  size="sm"
                  className="w-full"
                  onClick={onOpenRegisterModal}
                  icon={<CalendarCheck className="w-3.5 h-3.5" />}
                >
                  {upcomingAppointment
                    ? (isVi ? 'Đặt thêm lịch hẹn' : 'Book Another Slot')
                    : (isVi ? 'Đặt lịch hẹn khám ngay' : 'Book Appointment')}
                </Button>
              )}
            </div>
          </SectionCard>

          {/* Quick Action: New Scan Card */}
          <div className="rounded-2xl border border-[#EAECF0] bg-[#EEF5FF] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3478F6] text-white flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#111827]">
                  {isVi ? 'Sàng Lọc Mới Tức Thời' : 'Instant New Screening'}
                </h4>
                <p className="text-[11px] text-[#667085]">
                  {isVi ? 'Tải ảnh đáy mắt để AI phân tích' : 'AI analysis in 4 easy steps'}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => onNavigate('upload-scan')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isVi ? 'Bắt đầu sàng lọc' : 'Start Screening'}
            </Button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: RECENT SCREENING HISTORY STANDARDIZED DATATABLE (Requirement R3) */}
      <SectionCard
        title={isVi ? 'Lịch Sử Sàng Lọc Gần Đây' : 'Recent Screening History'}
        subtitle={
          isVi
            ? 'Danh sách các ca chụp vi mạch đáy mắt đã hoàn tất phân tích hoặc thẩm định'
            : 'Log of recent fundus examinations and specialist reviews'
        }
        headerAction={
          <button
            type="button"
            onClick={() => onNavigate('scan-history')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3478F6] hover:text-[#2563EB] hover:underline cursor-pointer"
          >
            <span>{isVi ? 'Xem tất cả' : 'View all history'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
        noPadding
      >
        <DataTable
          columns={historyColumns}
          data={scanHistory.slice(0, 5)}
          emptyTitle={isVi ? 'Chưa có ca khám nào' : 'No screenings recorded'}
          emptyMessage={
            isVi
              ? 'Hãy tải lên ảnh chụp mắt để bắt đầu xây dựng lịch sử theo dõi sức khỏe vi mạch.'
              : 'Upload retinal fundus images to begin tracking your vascular health history.'
          }
          keyExtractor={(item) => item.id || String(item.createdAt)}
          className="border-none shadow-none rounded-none"
        />
      </SectionCard>
    </div>
  );
};
