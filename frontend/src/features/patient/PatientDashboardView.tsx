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
  BarChart3,
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

  // Derive historical trend points - STRICT ZERO MOCK DATA POLICY
  const sortedHistory = React.useMemo(() => {
    return [...scanHistory]
      .filter((item) => item && item.status !== 'FAILED' && typeof item.riskScore === 'number' && item.riskScore > 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [scanHistory]);

  const trendPoints = React.useMemo(() => {
    let source = sortedHistory;
    if (selectedEyeFilter === 'OD') {
      source = sortedHistory.filter(
        (item) => !item.eyePosition?.includes('OS') && item.eyePosition !== 'Left'
      );
    } else if (selectedEyeFilter === 'OS') {
      source = sortedHistory.filter(
        (item) => item.eyePosition?.includes('OS') || item.eyePosition === 'Left'
      );
    }

    // If source is empty, but latestResult exists with valid score > 0
    if (source.length === 0 && latestResult && riskScore > 0 && latestResult.status !== 'FAILED') {
      const isOS = latestResult.eyePosition?.includes('OS') || latestResult.eyePosition === 'Left';
      const matchesEye =
        selectedEyeFilter === 'ALL' ||
        (selectedEyeFilter === 'OS' && isOS) ||
        (selectedEyeFilter === 'OD' && !isOS);
      if (matchesEye) {
        source = [
          {
            id: latestResult.analysisId || 'current-scan',
            createdAt: latestResult.createdAt || new Date().toISOString(),
            riskScore: riskScore,
            eyePosition: latestResult.eyePosition || 'OD',
            riskLevel:
              latestResult.cardiovascularRisk?.level ||
              (riskScore >= 80 ? 'Critical' : riskScore >= 65 ? 'High' : riskScore >= 40 ? 'Moderate' : 'Low'),
            status: latestResult.status || 'ANALYZED',
            scanType: 'Fundus_Macula',
          } as PatientHistoryItem,
        ];
      }
    }

    // STRICT ZERO-MOCK: If no real screening exists, return [] for authentic clinical empty state
    if (source.length === 0) {
      return [];
    }

    // Disambiguate same-day scans so labels don't collide
    const dayMap = new Map<string, number>();
    source.forEach((item) => {
      const dayKey = new Date(item.createdAt).toDateString();
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
    });
    const hasMultiplePerDay = Array.from(dayMap.values()).some((count) => count > 1);

    return source.map((item, idx) => {
      const dateObj = new Date(item.createdAt);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dateStr = `${day}/${month}`;
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const eyePos = item.eyePosition?.includes('OS') || item.eyePosition === 'Left' ? 'OS' : 'OD';

      return {
        id: item.id || `pt-${idx}`,
        createdAt: item.createdAt,
        date: dateStr,
        time: timeStr,
        dateLabel: hasMultiplePerDay ? `${dateStr} ${timeStr}` : dateStr,
        score: Math.round(item.riskScore),
        eye: eyePos as 'OD' | 'OS',
        level:
          item.riskLevel ||
          (item.riskScore >= 80
            ? 'Critical'
            : item.riskScore >= 65
            ? 'High'
            : item.riskScore >= 40
            ? 'Moderate'
            : 'Low'),
        doctorReviewed: Boolean(item.doctorReviewed || item.status === 'REVIEWED'),
      };
    });
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
              {trendPoints.length === 0 ? (
                /* Clinical Empty State when 0 screenings exist - ZERO MOCK POLICY */
                <div className="w-full h-[220px] bg-[#FAFBFD] rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {isVi ? 'Chưa Có Dữ Liệu Xu Hướng' : 'No Trend Data Available'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
                    {selectedEyeFilter !== 'ALL'
                      ? (isVi
                          ? `Chưa ghi nhận ca khám hoàn tất cho ${selectedEyeFilter === 'OD' ? 'Mắt phải (OD)' : 'Mắt trái (OS)'}. Vui lòng tải ảnh chụp để xây dựng biểu đồ theo dõi.`
                          : `No completed screenings recorded for ${selectedEyeFilter === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}. Upload an image to start tracking.`)
                      : (isVi
                          ? 'Hệ thống chưa ghi nhận ca khám hoàn tất nào để dựng đồ thị diễn tiến. Hãy chụp và phân tích ảnh đáy mắt để bắt đầu theo dõi sức khỏe vi mạch.'
                          : 'No completed screenings recorded yet. Upload and analyze a fundus image to begin longitudinal vascular tracking.')}
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onNavigate('upload-scan')}
                    icon={<UploadCloud className="w-3.5 h-3.5" />}
                  >
                    {isVi ? 'Tải Ảnh Phân Tích Ngay' : 'Upload & Analyze Now'}
                  </Button>
                </div>
              ) : (
                /* Combo Bar & Line Chart (Biểu Đồ Cột + Đường) */
                <div className="relative w-full h-[250px] bg-gradient-to-b from-[#FAFBFD] to-[#F7F9FC] rounded-2xl p-4 border border-[#EAECF0] overflow-hidden">
                  <svg
                    viewBox="0 0 600 200"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      {/* Bar Gradients for 4 Risk Tiers */}
                      <linearGradient id="barGradLow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="barGradMod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                      <linearGradient id="barGradHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" />
                        <stop offset="100%" stopColor="#EA580C" />
                      </linearGradient>
                      <linearGradient id="barGradCrit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F87171" />
                        <stop offset="100%" stopColor="#DC2626" />
                      </linearGradient>
                      {/* Line Area Gradient */}
                      <linearGradient id="comboAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid & Safe Boundary Lines */}
                    {(() => {
                      const paddingLeft = 50;
                      const paddingRight = 35;
                      const paddingTop = 25;
                      const baselineY = 160;
                      const plotHeight = 135;
                      const plotWidth = 600 - paddingLeft - paddingRight;
                      const safeY = baselineY - (40 / 100) * plotHeight;
                      const highY = baselineY - (65 / 100) * plotHeight;
                      const topY = paddingTop;

                      return (
                        <>
                          {/* Reference Guide Lines */}
                          <line x1={paddingLeft} y1={topY} x2={600 - paddingRight} y2={topY} stroke="#EAECF0" strokeDasharray="3 3" />
                          <line x1={paddingLeft} y1={highY} x2={600 - paddingRight} y2={highY} stroke="#EAECF0" strokeDasharray="3 3" />
                          <line x1={paddingLeft} y1={safeY} x2={600 - paddingRight} y2={safeY} stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.85" />
                          <line x1={paddingLeft} y1={baselineY} x2={600 - paddingRight} y2={baselineY} stroke="#CBD5E1" strokeWidth="1.5" />

                          {/* Y-axis Labels */}
                          <text x={paddingLeft - 8} y={topY + 4} textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data font-semibold">100</text>
                          <text x={paddingLeft - 8} y={highY + 4} textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data font-semibold">65</text>
                          <text x={paddingLeft - 8} y={safeY + 4} textAnchor="end" className="text-[10px] fill-[#10B981] font-mono-data font-bold">40</text>
                          <text x={paddingLeft - 8} y={baselineY + 4} textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data font-semibold">0</text>

                          {/* Safe boundary badge */}
                          <text x={600 - paddingRight + 5} y={safeY + 3} textAnchor="start" className="text-[9px] fill-[#10B981] font-bold">
                            ≤40
                          </text>
                        </>
                      );
                    })()}

                    {/* Bars & Line Path Calculation */}
                    {(() => {
                      const paddingLeft = 50;
                      const paddingRight = 35;
                      const paddingTop = 25;
                      const baselineY = 160;
                      const plotHeight = 135;
                      const plotWidth = 600 - paddingLeft - paddingRight;

                      const points = trendPoints.map((pt, i) => {
                        let x: number;
                        if (trendPoints.length === 1) {
                          x = paddingLeft + plotWidth / 2;
                        } else {
                          const sideMargin = Math.min(45, plotWidth / (trendPoints.length * 2.5));
                          const usableWidth = plotWidth - 2 * sideMargin;
                          x = paddingLeft + sideMargin + (i / (trendPoints.length - 1)) * usableWidth;
                        }

                        const scoreVal = Math.min(100, Math.max(0, pt.score));
                        const y = baselineY - (scoreVal / 100) * plotHeight;
                        const barWidth = Math.min(44, Math.max(18, (plotWidth / Math.max(trendPoints.length, 3)) * 0.42));
                        const barX = x - barWidth / 2;
                        const barHeight = Math.max(4, baselineY - y);

                        return {
                          ...pt,
                          x,
                          y,
                          barX,
                          barWidth,
                          barHeight,
                        };
                      });

                      // Spline Line Path (for 2+ points)
                      const pathD = points.reduce((acc, pt, idx) => {
                        if (idx === 0) return `M ${pt.x} ${pt.y}`;
                        const prev = points[idx - 1];
                        const cpX1 = prev.x + (pt.x - prev.x) / 2;
                        const cpX2 = cpX1;
                        return `${acc} C ${cpX1} ${prev.y}, ${cpX2} ${pt.y}, ${pt.x} ${pt.y}`;
                      }, '');

                      const areaD =
                        points.length > 1
                          ? `${pathD} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
                          : '';

                      return (
                        <>
                          {/* Translucent Area Fill Under Trend Curve */}
                          {areaD && <path d={areaD} fill="url(#comboAreaGrad)" />}

                          {/* 1. CỘT (BARS) - Render for each screening */}
                          {points.map((pt, i) => {
                            const isHovered = hoveredPointIndex === i;
                            const barFill =
                              pt.score < 40
                                ? 'url(#barGradLow)'
                                : pt.score < 65
                                ? 'url(#barGradMod)'
                                : pt.score < 80
                                ? 'url(#barGradHigh)'
                                : 'url(#barGradCrit)';

                            return (
                              <g
                                key={`bar-${pt.id}`}
                                onMouseEnter={() => setHoveredPointIndex(i)}
                                onMouseLeave={() => setHoveredPointIndex(null)}
                                className="cursor-pointer"
                              >
                                {/* Vertical Bar */}
                                <rect
                                  x={pt.barX}
                                  y={pt.y}
                                  width={pt.barWidth}
                                  height={pt.barHeight}
                                  rx="6"
                                  ry="6"
                                  fill={barFill}
                                  opacity={isHovered ? 1 : 0.88}
                                  stroke={isHovered ? '#1E293B' : 'none'}
                                  strokeWidth={isHovered ? 1.5 : 0}
                                  className="transition-all duration-200"
                                />

                                {/* Score Value Text on Top of Bar */}
                                <text
                                  x={pt.x}
                                  y={pt.y - 7}
                                  textAnchor="middle"
                                  className="text-[10px] font-bold font-mono-data fill-slate-700"
                                >
                                  {pt.score}
                                </text>

                                {/* X-axis Primary Date */}
                                <text
                                  x={pt.x}
                                  y={baselineY + 16}
                                  textAnchor="middle"
                                  className="text-[10px] font-semibold fill-slate-600"
                                >
                                  {pt.date}
                                </text>

                                {/* X-axis Secondary Time (Disambiguation) */}
                                {pt.time && (
                                  <text
                                    x={pt.x}
                                    y={baselineY + 28}
                                    textAnchor="middle"
                                    className="text-[9px] font-mono-data fill-slate-400"
                                  >
                                    {pt.time}
                                  </text>
                                )}
                              </g>
                            );
                          })}

                          {/* 2. ĐƯỜNG (LINE) - Spline trend trajectory traversing bars */}
                          {points.length > 1 && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#2563EB"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Single Point Horizontal Indicator if only 1 scan */}
                          {points.length === 1 && (
                            <line
                              x1={points[0].x - 45}
                              y1={points[0].y}
                              x2={points[0].x + 45}
                              y2={points[0].y}
                              stroke="#2563EB"
                              strokeWidth="2"
                              strokeDasharray="4 3"
                            />
                          )}

                          {/* 3. ĐIỂM NÚT (DATA NODES) */}
                          {points.map((pt, i) => {
                            const isHovered = hoveredPointIndex === i;
                            return (
                              <g
                                key={`node-${pt.id}`}
                                onMouseEnter={() => setHoveredPointIndex(i)}
                                onMouseLeave={() => setHoveredPointIndex(null)}
                                className="cursor-pointer"
                              >
                                {isHovered && (
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={11}
                                    fill="#2563EB"
                                    opacity="0.2"
                                    className="animate-pulse"
                                  />
                                )}
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={isHovered ? 6.5 : 4.5}
                                  fill="#FFFFFF"
                                  stroke="#2563EB"
                                  strokeWidth="2.5"
                                  className="transition-all"
                                />
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>

                  {/* Interactive Tooltip Overlay */}
                  {hoveredPointIndex !== null && trendPoints[hoveredPointIndex] && (
                    <div
                      className="absolute z-20 top-3 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs pointer-events-none transition-all"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 mb-1.5">
                        <span className="font-semibold text-slate-700">
                          {trendPoints[hoveredPointIndex].date} {trendPoints[hoveredPointIndex].time}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {trendPoints[hoveredPointIndex].eye === 'OS'
                            ? (isVi ? 'Mắt trái (OS)' : 'Left Eye (OS)')
                            : (isVi ? 'Mắt phải (OD)' : 'Right Eye (OD)')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{isVi ? 'Điểm nguy cơ:' : 'Risk score:'}</span>
                        <strong className="text-slate-900 font-mono-data font-bold text-sm">
                          {trendPoints[hoveredPointIndex].score}/100
                        </strong>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            trendPoints[hoveredPointIndex].score < 40
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : trendPoints[hoveredPointIndex].score < 65
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : trendPoints[hoveredPointIndex].score < 80
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {trendPoints[hoveredPointIndex].level}
                        </span>
                      </div>
                      {trendPoints[hoveredPointIndex].doctorReviewed && (
                        <div className="mt-1.5 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isVi ? 'Đã được bác sĩ xác nhận' : 'Clinician verified'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chart Legend & Clinical Indicators */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Cột legend */}
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-gradient-to-t from-emerald-600 to-amber-500 border border-slate-300" />
                    <span>{isVi ? 'Cột: Điểm nguy cơ ca khám' : 'Bars: Screening risk score'}</span>
                  </span>
                  {/* Đường legend */}
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-0.5 bg-blue-600 relative inline-flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white border border-blue-600 absolute" />
                    </span>
                    <span>{isVi ? 'Đường: Xu hướng diễn tiến' : 'Line: Risk trajectory'}</span>
                  </span>
                  {/* Ngưỡng an toàn legend */}
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500" />
                    <span>{isVi ? 'Ngưỡng an toàn (< 40)' : 'Safe limit (< 40)'}</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono-data">
                  {trendPoints.length > 0
                    ? (isVi
                        ? `${trendPoints.length} ca khám được ghi nhận`
                        : `${trendPoints.length} recorded screening(s)`)
                    : (isVi ? 'Chưa có ca khám' : '0 screenings')}
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
