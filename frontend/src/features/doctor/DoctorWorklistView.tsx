import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  Stethoscope,
  Heart,
  Activity,
  FileText,
} from 'lucide-react';
import { PatientProfile } from '../../types/cds';
import { Card } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';

export interface DoctorWorklistViewProps {
  patients: PatientProfile[];
  loading?: boolean;
  onRefresh?: () => void;
  onSelectPatient: (patient: PatientProfile) => void;
  onNewPatientClick?: () => void;
}

export const DoctorWorklistView: React.FC<DoctorWorklistViewProps> = ({
  patients,
  loading = false,
  onRefresh,
  onSelectPatient,
  onNewPatientClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL');

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchQuery =
        (p.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.mrn || '').toLowerCase().includes(searchTerm.toLowerCase());

      const patientRisk = (p.riskLevel || 'Low').toUpperCase();
      const matchRisk = riskFilter === 'ALL' || patientRisk === riskFilter;

      const isReviewed = p.reviewStatus === 'REVIEWED';
      const matchReview =
        reviewFilter === 'ALL' ||
        (reviewFilter === 'REVIEWED' && isReviewed) ||
        (reviewFilter === 'PENDING' && !isReviewed);

      return matchQuery && matchRisk && matchReview;
    });
  }, [patients, searchTerm, riskFilter, reviewFilter]);

  // Risk summary counts
  const riskCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
    patients.forEach((p) => {
      const lvl = (p.riskLevel || 'Low').toUpperCase();
      if (lvl === 'CRITICAL' || lvl === 'SEVERE' || lvl === 'ALARM') counts.critical++;
      else if (lvl === 'HIGH') counts.high++;
      else if (lvl === 'MODERATE') counts.moderate++;
      else counts.low++;
    });
    return counts;
  }, [patients]);

  const columns: Column<PatientProfile>[] = [
    {
      header: 'Bệnh Nhân / MRN',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] text-[#0891B2] font-bold flex items-center justify-center border border-[#CCFBF1] shrink-0">
            {row.fullName
              ? row.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'BN'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block truncate max-w-[160px]">
              {row.fullName || 'Chưa có tên'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono-data">
              {row.mrn || 'N/A'} • {row.age ? `${row.age}t` : ''} {row.gender === 'Female' ? 'Nữ' : 'Nam'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Lần Khám Gần Nhất',
      accessor: (row) => (
        <span className="text-xs text-slate-600 font-mono-data">
          {row.lastExamDate || 'Chưa có'}
        </span>
      ),
    },
    {
      header: 'Chỉ Số Sinh Hiệu',
      accessor: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-slate-800 font-mono-data block">
            HA: {row.systolicBp && row.diastolicBp ? `${row.systolicBp}/${row.diastolicBp}` : '--'}
          </span>
          <span className="text-slate-500 font-mono-data text-[11px] block">
            HbA1c: {row.hba1c ? `${row.hba1c}%` : '--'}
          </span>
        </div>
      ),
    },
    {
      header: 'Mức Rủi Ro Sơ Bộ',
      accessor: (row) => (
        <RiskBadge level={row.riskLevel || 'Low'} size="sm" />
      ),
    },
    {
      header: 'Trạng Thái Thẩm Định',
      accessor: (row) => {
        const isReviewed = row.reviewStatus === 'REVIEWED';
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isReviewed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isReviewed ? 'Đã duyệt' : 'Chờ bác sĩ xem'}
          </span>
        );
      },
    },
    {
      header: 'Thao Tác',
      align: 'right',
      accessor: (row) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSelectPatient(row)}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          Mở CDS
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Compact Risk Stratification Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'CRITICAL'
              ? 'bg-red-50 border-red-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900">Rất nghiêm trọng</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 font-mono-data mt-2">
            {riskCounts.critical}
          </div>
          <span className="text-[11px] text-slate-500">Cần ưu tiên thẩm định</span>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'HIGH'
              ? 'bg-orange-50 border-orange-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-900">Nguy cơ cao</span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600 font-mono-data mt-2">
            {riskCounts.high}
          </div>
          <span className="text-[11px] text-slate-500">Vi tổn thương đáng kể</span>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'MODERATE'
              ? 'bg-amber-50 border-amber-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Nguy cơ trung bình</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-data mt-2">
            {riskCounts.moderate}
          </div>
          <span className="text-[11px] text-slate-500">Cần theo dõi định kỳ</span>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'LOW'
              ? 'bg-emerald-50 border-emerald-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Nguy cơ thấp</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono-data mt-2">
            {riskCounts.low}
          </div>
          <span className="text-[11px] text-slate-500">Cấu trúc vi mạch ổn định</span>
        </div>
      </div>

      {/* Main Filter & Worklist Toolbar */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#0891B2]" />
              Danh Sách Ca Khám Phân Công (Doctor Worklist)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng cộng {filteredPatients.length} bệnh nhân trong danh sách phụ trách.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm họ tên, mã MRN..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {/* Review Status Filter */}
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#0891B2]"
            >
              <option value="ALL">Thẩm định (Tất cả)</option>
              <option value="PENDING">Chờ xem xét</option>
              <option value="REVIEWED">Đã ký duyệt</option>
            </select>

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                title="Làm mới danh sách"
              >
                Làm mới
              </Button>
            )}

            {onNewPatientClick && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNewPatientClick}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Thêm Bệnh Nhân
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={filteredPatients}
        keyExtractor={(p, idx) => p.id || p.mrn || String(idx)}
        loading={loading}
        emptyMessage="Không tìm thấy bệnh nhân nào phù hợp với bộ lọc."
      />
    </div>
  );
};
