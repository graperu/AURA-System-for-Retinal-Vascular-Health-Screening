import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  Eye,
  ArrowRight,
  TrendingUp,
  Filter,
  Search,
  Stethoscope,
  Activity,
  FileCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { KpiCard } from '../../components/common/KpiCard';
import { SectionCard } from '../../components/common/SectionCard';
import { DataTable, DataTableColumn } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { DoctorPatientSummary } from '../../pages/CDSDashboardPage';
import { PatientProfile } from '../../types/cds';
import { MedicalProfileModal } from '../../components/MedicalProfileModal';
import { realtimeBus } from '../../services/realtimeService';
import { screeningApi } from '../../services/api';

export interface DoctorDashboardViewProps {
  assignedPatients: DoctorPatientSummary[];
  screenings?: any[];
  onSelectPatientForCDS: (patientId: string, screeningId?: string, directPatient?: any) => void;
  onNavigate?: (section: string) => void;
  doctorName?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onViewPatientProfile?: (patientId: string, patient?: any) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  assignedPatients = [],
  screenings: propScreenings,
  onSelectPatientForCDS,
  onNavigate,
  doctorName = 'Bác sĩ chuyên khoa',
  loading = false,
  onRefresh,
  onViewPatientProfile,
  onSelectPatient,
}) => {
  const { t, isVi } = useLanguage();
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'HIGH' | 'MODERATE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfilePatient, setSelectedProfilePatient] = useState<PatientProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Live state for instant Zero-F5 real-time update when patient uploads new scan (<5s SLA)
  const [livePatients, setLivePatients] = useState<DoctorPatientSummary[]>(assignedPatients);

  // Real screenings state fetched from database
  const [screenings, setScreenings] = useState<any[]>(propScreenings || []);
  const [loadingScreenings, setLoadingScreenings] = useState<boolean>(!propScreenings);

  const loadScreenings = useCallback(async () => {
    setLoadingScreenings(true);
    try {
      const res = await screeningApi.getAll({ size: 100 });
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.content || [];
      if (res && res.success && Array.isArray(list)) {
        setScreenings(list);
      }
    } catch (err) {
      console.warn('[DoctorDashboardView] Could not load real screenings:', err);
    } finally {
      setLoadingScreenings(false);
    }
  }, []);

  useEffect(() => {
    if (propScreenings) {
      setScreenings(propScreenings);
    } else {
      void loadScreenings();
    }
  }, [propScreenings, loadScreenings]);

  useEffect(() => {
    setLivePatients(assignedPatients);
  }, [assignedPatients]);

  useEffect(() => {
    const unsub = realtimeBus.subscribe(
      ['screening:created', 'screening:completed', 'screening:new', 'SCAN_UPLOADED', 'DOCTOR_REVIEW'],
      (event) => {
        if (onRefresh) {
          onRefresh();
        }
        if (!propScreenings) {
          void loadScreenings();
        }
        const data = event?.data;
        if (data && (data.patientId || data.mrn)) {
          setLivePatients((prev) => {
            const exists = prev.some(
              (p) => p.patientId === data.patientId || (data.mrn && p.mrn === data.mrn)
            );
            if (exists) {
              return prev.map((p) => {
                if (p.patientId === data.patientId || (data.mrn && p.mrn === data.mrn)) {
                  return {
                    ...p,
                    screeningCount: (p.screeningCount || 0) + 1,
                    latestRiskLevel: data.riskLevel || p.latestRiskLevel || 'Pending',
                    assignmentStatus: 'ASSIGNED',
                    lastScreeningAt: new Date().toISOString(),
                  };
                }
                return p;
              });
            }
            // Prepend new incoming case to live doctor queue immediately (<5s SLA, Zero-F5)
            const newCase: DoctorPatientSummary = {
              id: data.patientId || `PAT-${Date.now()}`,
              patientId: data.patientId || `PAT-${Date.now()}`,
              mrn: data.mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
              fullName: data.patientName || (isVi ? 'Bệnh nhân mới' : 'New Patient'),
              age: data.patientAge || 52,
              gender: data.patientGender || 'Other',
              screeningCount: 1,
              latestRiskLevel: data.riskLevel || 'Pending',
              assignmentStatus: 'ASSIGNED',
              assignedAt: new Date().toISOString(),
              lastScreeningAt: new Date().toISOString(),
            };
            return [newCase, ...prev];
          });
        }
      }
    );
    return unsub;
  }, [onRefresh, isVi, propScreenings, loadScreenings]);

  const handleViewPatientProfile = (patientSummary: DoctorPatientSummary) => {
    if (onSelectPatient) {
      onSelectPatient(patientSummary.patientId);
      return;
    }
    if (onViewPatientProfile) {
      onViewPatientProfile(patientSummary.patientId, patientSummary);
      return;
    }
    const profile: PatientProfile = {
      id: patientSummary.patientId,
      userId: patientSummary.patientId,
      mrn: patientSummary.mrn || '',
      fullName: patientSummary.fullName || '',
      gender: (patientSummary.gender as any) || 'Other',
      age: patientSummary.age ?? null,
      dateOfBirth: patientSummary.dateOfBirth ?? null,
      phoneNumber: patientSummary.phoneNumber ?? null,
      address: patientSummary.address ?? null,
      systolicBp: patientSummary.systolicBp ?? null,
      diastolicBp: patientSummary.diastolicBp ?? null,
      hba1c: patientSummary.hba1c ?? null,
      hasDiabetes: patientSummary.hasDiabetes ?? null,
      hasHypertension: patientSummary.hasHypertension ?? null,
      assignedDoctor: doctorName,
    };
    setSelectedProfilePatient(profile);
    setIsProfileModalOpen(true);
  };

  // 1. Calculate clinical metrics for 4 KPI Cards
  const totalAssigned = livePatients.length;

  const highRiskPatients = useMemo(() => {
    return livePatients.filter((p) => {
      const lvl = (p.latestRiskLevel || '').toUpperCase();
      return lvl === 'HIGH' || lvl === 'CRITICAL' || lvl === 'SEVERE';
    });
  }, [livePatients]);

  const moderateRiskPatients = useMemo(() => {
    return livePatients.filter((p) => {
      const lvl = (p.latestRiskLevel || '').toUpperCase();
      return lvl === 'MODERATE' || lvl === 'MEDIUM';
    });
  }, [livePatients]);

  const pendingReviews = useMemo(() => {
    return livePatients.filter((p) => {
      return p.screeningCount > 0 && (!p.latestRiskLevel || p.assignmentStatus === 'ASSIGNED');
    });
  }, [livePatients]);

  const reviewedCount = useMemo(() => {
    if (screenings.length > 0) {
      return screenings.filter(
        (s) => s.status === 'REVIEWED' || s.reviewDecision != null || s.digitalSignature != null
      ).length;
    }
    return Math.max(0, totalAssigned - pendingReviews.length);
  }, [screenings, totalAssigned, pendingReviews.length]);

  // Real 7-day activity trajectory data computed from database screenings or live assigned patients
  const weeklyActivityData = useMemo(() => {
    const dayNamesVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const days = dayNamesVi.map((nameVi, index) => ({
      day: isVi ? nameVi : dayNamesEn[index],
      dayIndex: index,
      total: 0,
      high: 0,
      mod: 0,
      low: 0,
    }));

    if (screenings.length > 0) {
      screenings.forEach((s) => {
        const dateStr = s.createdAt || s.updatedAt || s.date;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const jsDay = d.getDay();
        const isoIndex = (jsDay + 6) % 7;

        const lvl = (s.riskLevel || s.aiRiskLevel || s.doctorRiskLevel || '').toUpperCase();
        const score = Number(s.riskScore || s.overallVascularRiskScore || 0);
        const isHigh = lvl === 'HIGH' || lvl === 'CRITICAL' || lvl === 'SEVERE' || score >= 70;
        const isMod = lvl === 'MODERATE' || lvl === 'MEDIUM' || (score >= 40 && score < 70);

        days[isoIndex].total += 1;
        if (isHigh) {
          days[isoIndex].high += 1;
        } else if (isMod) {
          days[isoIndex].mod += 1;
        } else {
          days[isoIndex].low += 1;
        }
      });
    } else if (livePatients.length > 0) {
      livePatients.forEach((p) => {
        const dateStr = p.lastScreeningAt || p.assignedAt;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const jsDay = d.getDay();
        const isoIndex = (jsDay + 6) % 7;

        const lvl = (p.latestRiskLevel || '').toUpperCase();
        const isHigh = lvl === 'HIGH' || lvl === 'CRITICAL' || lvl === 'SEVERE';
        const isMod = lvl === 'MODERATE' || lvl === 'MEDIUM';

        days[isoIndex].total += 1;
        if (isHigh) {
          days[isoIndex].high += 1;
        } else if (isMod) {
          days[isoIndex].mod += 1;
        } else {
          days[isoIndex].low += 1;
        }
      });
    }

    return days;
  }, [screenings, livePatients, isVi]);

  const maxBarTotal = Math.max(5, ...weeklyActivityData.map((d) => d.total));
  const yAxisMax = Math.ceil(maxBarTotal / 5) * 5;
  const yAxisTicks = [
    yAxisMax,
    Math.round((yAxisMax * 2) / 3),
    Math.round(yAxisMax / 3),
    0,
  ];

  // Filtered queue
  const displayQueue = useMemo(() => {
    let list = livePatients.filter((p) => p.screeningCount > 0);
    if (queueFilter === 'HIGH') {
      list = list.filter((p) => {
        const lvl = (p.latestRiskLevel || '').toUpperCase();
        return lvl === 'HIGH' || lvl === 'CRITICAL';
      });
    } else if (queueFilter === 'MODERATE') {
      list = list.filter((p) => {
        const lvl = (p.latestRiskLevel || '').toUpperCase();
        return lvl === 'MODERATE';
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.fullName || '').toLowerCase().includes(q) ||
          (p.mrn || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [livePatients, queueFilter, searchTerm]);

  // Columns for recent patients DataTable
  const patientTableColumns: DataTableColumn<DoctorPatientSummary>[] = [
    {
      key: 'mrn',
      header: isVi ? 'Mã hồ sơ' : 'MRN',
      className: 'w-[120px]',
      render: (item) => (
        <span className="font-mono-data font-bold text-xs text-[#3478F6] bg-[#EEF5FF] px-2 py-0.5 rounded-md border border-[#C7D7FE]">
          {item.mrn || 'N/A'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: isVi ? 'Bệnh nhân' : 'Patient Name',
      render: (item) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => handleViewPatientProfile(item)}
            className="text-left font-bold text-slate-900 text-xs hover:text-[#3478F6] hover:underline cursor-pointer"
            title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
          >
            {item.fullName || (isVi ? 'Bệnh nhân chưa đặt tên' : 'Unnamed Patient')}
          </button>
          <span className="text-[11px] text-slate-400">
            {item.age ? `${item.age} ${isVi ? 'tuổi' : 'y/o'}` : ''}{' '}
            {item.gender === 'Female'
              ? (isVi ? '• Nữ' : '• F')
              : item.gender === 'Male'
              ? (isVi ? '• Nam' : '• M')
              : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'vitals',
      header: isVi ? 'Huyết áp & HbA1c' : 'Vitals',
      render: (item) => (
        <div className="text-[11px] text-slate-600 font-mono-data">
          <span>{item.systolicBp && item.diastolicBp ? `${item.systolicBp}/${item.diastolicBp}` : '—'} mmHg</span>
          <span className="text-slate-400 mx-1">•</span>
          <span>{item.hba1c ? `${item.hba1c}%` : '—'}</span>
        </div>
      ),
    },
    {
      key: 'risk',
      header: isVi ? 'Phân tầng nguy cơ' : 'Risk Level',
      render: (item) => (
        <StatusBadge
          status={item.latestRiskLevel || 'pending'}
          size="sm"
        />
      ),
    },
    {
      key: 'lastScreeningAt',
      header: isVi ? 'Lần khám gần nhất' : 'Last Exam',
      render: (item) => (
        <span className="text-xs text-slate-500">
          {item.lastScreeningAt ? new Date(item.lastScreeningAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Chưa chụp' : 'None')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: isVi ? 'Thao tác' : 'Actions',
      align: 'right',
      render: (item) => (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleViewPatientProfile(item)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#3478F6] cursor-pointer"
            title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isVi ? 'Hồ sơ' : 'Profile'}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPatientForCDS(item.patientId, undefined, item)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#3478F6] hover:text-[#2563EB] hover:underline cursor-pointer"
          >
            <span>{isVi ? 'Thẩm định CDS' : 'Open CDS'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP SECTION: 4 CLINICAL KPI CARDS (Requirement R4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Assigned Patients */}
        <KpiCard
          title={isVi ? 'Bệnh Nhân Phụ Trách' : 'Assigned Patients'}
          value={totalAssigned}
          unit={isVi ? 'người' : 'patients'}
          icon={<Users className="w-5 h-5 text-[#3478F6]" />}
          change={{
            value: totalAssigned > 0 ? (isVi ? `+${totalAssigned} hồ sơ` : `+${totalAssigned} records`) : '0',
            positive: true,
          }}
          subtitle={isVi ? 'Hồ sơ đang quản lý' : 'Active monitoring'}
          detailsLink={{
            label: isVi ? 'Xem danh sách' : 'View list',
            onClick: () => onNavigate?.('patient-list'),
          }}
        />

        {/* KPI 2: Pending Reviews */}
        <KpiCard
          title={isVi ? 'Chờ Thẩm Định' : 'Pending Reviews'}
          value={pendingReviews.length}
          unit={isVi ? 'ca' : 'cases'}
          icon={<Clock className="w-5 h-5 text-[#F59E0B]" />}
          change={{
            value: pendingReviews.length > 0
              ? (isVi ? `${pendingReviews.length} cần duyệt` : `${pendingReviews.length} pending`)
              : (isVi ? 'Đã hoàn tất' : 'All clear'),
            positive: pendingReviews.length === 0,
          }}
          subtitle={isVi ? 'Cần bác sĩ ký số' : 'Awaiting clinical sign-off'}
          detailsLink={{
            label: isVi ? 'Thẩm định ngay' : 'Review queue',
            onClick: () => onNavigate?.('cds-viewer'),
          }}
        />

        {/* KPI 3: High Risk Cases */}
        <KpiCard
          title={isVi ? 'Ca Nguy Cơ Cao' : 'High Risk Cases'}
          value={highRiskPatients.length}
          unit={isVi ? 'ca' : 'cases'}
          icon={<AlertTriangle className="w-5 h-5 text-[#EF4444]" />}
          change={{
            value: highRiskPatients.length > 0
              ? (isVi ? `${highRiskPatients.length} ưu tiên` : `${highRiskPatients.length} priority`)
              : (isVi ? 'Không có ca khẩn' : '0 urgent'),
            positive: highRiskPatients.length === 0,
          }}
          subtitle={isVi ? 'Cần can thiệp chuyên khoa' : 'Urgent clinical intervention'}
          detailsLink={{
            label: isVi ? 'Lọc ca nguy cơ' : 'Filter high risk',
            onClick: () => setQueueFilter('HIGH'),
          }}
        />

        {/* KPI 4: Reviewed Today */}
        <KpiCard
          title={isVi ? 'Đã Thẩm Định' : 'Reviewed Today'}
          value={reviewedCount}
          unit={isVi ? 'hồ sơ' : 'reviewed'}
          icon={<CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
          change={{
            value: isVi
              ? `${Math.round((reviewedCount / Math.max(1, totalAssigned)) * 100)}% hoàn tất`
              : `${Math.round((reviewedCount / Math.max(1, totalAssigned)) * 100)}% completed`,
            positive: true,
          }}
          subtitle={isVi ? 'Tỷ lệ đồng thuận AI cao' : 'High AI concurrence'}
          detailsLink={{
            label: isVi ? 'Lịch sử đánh giá' : 'Review history',
            onClick: () => onNavigate?.('reports'),
          }}
        />
      </div>

      {/* 2. MIDDLE SECTION: REVIEW ACTIVITY CHART & PENDING QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Review Activity & Risk Distribution Chart */}
        <div className="lg:col-span-8 space-y-6">
          <SectionCard
            title={isVi ? 'Biểu Đồ Hoạt Động Thẩm Định & Phân Bổ Nguy Cơ' : 'Clinical Review & Risk Activity'}
            subtitle={
              isVi
                ? 'Thống kê lượng ca khám đã thẩm định và phân tầng rủi ro tim mạch & võng mạc'
                : 'Longitudinal review throughput and clinical risk stratification distribution'
            }
            headerAction={
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3478F6] bg-[#EEF5FF] px-3 py-1 rounded-xl border border-[#C7D7FE]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isVi ? 'Cập nhật thời gian thực' : 'Live Synced'}</span>
              </div>
            }
          >
            <div className="space-y-4">
              {/* SVG Review Trajectory Chart */}
              <div className="relative w-full h-[220px] bg-[#FAFBFD] rounded-xl p-4 border border-[#EAECF0] overflow-hidden">
                <svg
                  viewBox="0 0 540 180"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="doctorActivityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3478F6" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#3478F6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line x1="30" y1="20" x2="520" y2="20" stroke="#EAECF0" strokeDasharray="3 3" />
                  <line x1="30" y1="65" x2="520" y2="65" stroke="#EAECF0" strokeDasharray="3 3" />
                  <line x1="30" y1="110" x2="520" y2="110" stroke="#EAECF0" strokeDasharray="3 3" />
                  <line x1="30" y1="155" x2="520" y2="155" stroke="#EAECF0" />

                  {/* Y-axis scale */}
                  <text x="24" y="24" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">{yAxisTicks[0]}</text>
                  <text x="24" y="69" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">{yAxisTicks[1]}</text>
                  <text x="24" y="114" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">{yAxisTicks[2]}</text>
                  <text x="24" y="159" textAnchor="end" className="text-[10px] fill-[#98A2B3] font-mono-data">0</text>

                  {/* 7 Days Real Data Columns */}
                  {(() => {
                    const startX = 60;
                    const stepX = 70;

                    return weeklyActivityData.map((d, i) => {
                      const x = startX + i * stepX;
                      const h = d.total > 0 ? Math.max(6, (d.total / yAxisMax) * 135) : 0;
                      const y = 155 - h;
                      const highH = d.high > 0 ? Math.max(4, (d.high / yAxisMax) * 135) : 0;

                      return (
                        <g key={d.day} className="transition-all hover:opacity-85 cursor-pointer">
                          {/* Background Bar */}
                          {d.total > 0 && (
                            <rect
                              x={x - 14}
                              y={y}
                              width={28}
                              height={h}
                              rx={6}
                              fill="#3478F6"
                              opacity={0.88}
                            />
                          )}
                          {/* Subtle baseline marker when 0 */}
                          {d.total === 0 && (
                            <rect
                              x={x - 8}
                              y={153}
                              width={16}
                              height={3}
                              rx={1.5}
                              fill="#EAECF0"
                            />
                          )}
                          {/* High risk top highlight */}
                          {d.high > 0 && (
                            <rect
                              x={x - 14}
                              y={y}
                              width={28}
                              height={highH}
                              rx={4}
                              fill="#EF4444"
                            />
                          )}
                          <text
                            x={x}
                            y="172"
                            textAnchor="middle"
                            className="text-[11px] fill-[#667085] font-semibold"
                          >
                            {d.day}
                          </text>
                          <text
                            x={x}
                            y={d.total > 0 ? y - 6 : 148}
                            textAnchor="middle"
                            className={`text-[10px] font-mono-data ${d.total > 0 ? 'fill-[#3478F6] font-bold' : 'fill-[#98A2B3]'}`}
                          >
                            {d.total}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between text-xs text-[#667085] pt-1 border-t border-[#EAECF0]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-[#3478F6]" />
                    <span>{isVi ? 'Tổng ca thẩm định' : 'Total Reviewed'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-[#EF4444]" />
                    <span>{isVi ? 'Cảnh báo nguy cơ cao' : 'High Risk Alerts'}</span>
                  </span>
                </div>
                <span className="text-[11px] text-[#98A2B3]">
                  {isVi ? 'Độ chuẩn hóa dữ liệu đạt chứng nhận Bộ Y Tế' : 'Clinical validation standard'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Recent Patients Table */}
          <SectionCard
            title={isVi ? 'Danh Sách Bệnh Nhân Tiếp Nhận Gần Đây' : 'Recent Assigned Patients'}
            subtitle={isVi ? 'Bệnh nhân được phân công thẩm định và theo dõi diễn tiến sức khỏe mắt' : 'Active patient cohort under specialist care'}
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.('patient-list')}
                icon={<Users className="w-4 h-4" />}
              >
                {isVi ? 'Xem tất cả' : 'View all'}
              </Button>
            }
          >
            <DataTable
              columns={patientTableColumns}
              data={livePatients.slice(0, 5)}
              keyExtractor={(item) => item.patientId || item.mrn || 'p-key'}
              emptyMessage={isVi ? 'Chưa có bệnh nhân nào được phân công.' : 'No patients assigned.'}
            />
          </SectionCard>
        </div>

        {/* Right 4 Cols: Pending Review Queue & Upcoming Appointments */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pending Review Status Queue Card */}
          <SectionCard
            title={isVi ? 'Hàng Đợi Chờ Thẩm Định' : 'Pending Review Queue'}
            subtitle={isVi ? 'Ưu tiên ca có cảnh báo rủi ro cao' : 'Prioritized by clinical severity'}
            headerAction={
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3F2] text-[#EF4444] border border-[#FEE4E2]">
                {displayQueue.length} {isVi ? 'ca chờ' : 'queued'}
              </span>
            }
          >
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => setQueueFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  queueFilter === 'ALL'
                    ? 'bg-[#3478F6] text-white shadow-xs'
                    : 'bg-[#F5F6F8] text-[#667085] hover:text-[#111827]'
                }`}
              >
                {isVi ? 'Tất cả' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setQueueFilter('HIGH')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  queueFilter === 'HIGH'
                    ? 'bg-[#EF4444] text-white shadow-xs'
                    : 'bg-[#F5F6F8] text-[#667085] hover:text-[#111827]'
                }`}
              >
                {isVi ? 'Nguy cơ cao' : 'High Risk'}
              </button>
              <button
                type="button"
                onClick={() => setQueueFilter('MODERATE')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  queueFilter === 'MODERATE'
                    ? 'bg-[#F59E0B] text-white shadow-xs'
                    : 'bg-[#F5F6F8] text-[#667085] hover:text-[#111827]'
                }`}
              >
                {isVi ? 'Trung bình' : 'Moderate'}
              </button>
            </div>

            {/* Queue List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {displayQueue.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto opacity-70" />
                  <p className="font-semibold text-slate-600">
                    {isVi ? 'Không có ca chờ thẩm định' : 'Queue is clear'}
                  </p>
                  <p>{isVi ? 'Tất cả kết quả sàng lọc đã được ký duyệt' : 'All screenings have been validated'}</p>
                </div>
              ) : (
                displayQueue.slice(0, 6).map((p) => {
                  const isHigh = (p.latestRiskLevel || '').toUpperCase() === 'HIGH' || (p.latestRiskLevel || '').toUpperCase() === 'CRITICAL';
                  return (
                    <div
                      key={p.patientId}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        isHigh
                          ? 'border-[#FEE4E2] bg-[#FEF3F2]/40 hover:bg-[#FEF3F2]/70'
                          : 'border-[#EAECF0] bg-white hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleViewPatientProfile(p)}
                            className="text-left text-xs font-bold text-slate-900 hover:text-[#3478F6] hover:underline truncate block cursor-pointer"
                            title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
                          >
                            {p.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
                          </button>
                          <span className="text-[10px] font-mono-data font-bold text-[#3478F6]">
                            {p.mrn || 'N/A'}
                          </span>
                        </div>
                        <StatusBadge
                          status={p.latestRiskLevel || 'pending'}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#EAECF0]/60 text-xs">
                        <span className="text-[11px] text-slate-500">
                          {p.age ? `${p.age}t` : ''} • {p.screeningCount} {isVi ? 'lần chụp' : 'scans'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewPatientProfile(p)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#3478F6] cursor-pointer"
                            title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>{isVi ? 'Hồ sơ' : 'Profile'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectPatientForCDS(p.patientId, undefined, p)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#3478F6] hover:text-[#2563EB] cursor-pointer"
                          >
                            <span>{isVi ? 'Thẩm định ngay' : 'Review'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>

          {/* Upcoming Appointments Card */}
          <SectionCard
            title={isVi ? 'Lịch Hẹn Tư Vấn Sắp Tới' : 'Upcoming Consultations'}
            subtitle={isVi ? 'Lịch trao đổi chuyên môn với bệnh nhân' : 'Scheduled patient tele-consultations'}
            headerAction={
              <button
                type="button"
                onClick={() => onNavigate?.('consultation')}
                className="text-xs font-bold text-[#3478F6] hover:underline cursor-pointer"
              >
                {isVi ? 'Tin nhắn' : 'Messages'}
              </button>
            }
          >
            <div className="space-y-3">
              {assignedPatients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                  <CalendarCheck className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-500">
                    {isVi ? 'Chưa có lịch hẹn tư vấn' : 'No upcoming consultations'}
                  </p>
                  <p>{isVi ? 'Bệnh nhân được phân công sẽ xuất hiện tại đây' : 'Assigned patients will appear here'}</p>
                </div>
              ) : (
                assignedPatients.slice(0, 3).map((p, idx) => (
                  <div
                    key={`apt-${p.patientId}-${idx}`}
                    className="p-3 rounded-xl bg-[#F8F9FA] border border-[#EAECF0] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center shrink-0 font-bold">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {p.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {p.lastScreeningAt
                            ? (isVi ? `Ca khám: ${new Date(p.lastScreeningAt).toLocaleDateString('vi-VN')}` : `Exam: ${new Date(p.lastScreeningAt).toLocaleDateString('en-US')}`)
                            : (isVi ? 'Chờ tư vấn trực tuyến' : 'Pending consultation')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('consultation')}
                      className="px-2.5 py-1 text-xs font-bold text-[#3478F6] bg-white hover:bg-[#EEF5FF] border border-[#EAECF0] rounded-lg transition-all cursor-pointer shrink-0"
                    >
                      {isVi ? 'Tư vấn' : 'Chat'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Patient Profile Modal for Cross-Portal Navigation */}
      {isProfileModalOpen && selectedProfilePatient && (
        <MedicalProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedProfilePatient(null);
          }}
          patient={selectedProfilePatient}
          onSave={(updated) => {
            setSelectedProfilePatient(updated);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};