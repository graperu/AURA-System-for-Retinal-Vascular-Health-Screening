import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  Plus,
  ChevronDown,
  X,
} from 'lucide-react';
import { ClinicBatchJob } from '../../types/cds';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { EyeBadge } from '../../components/ui/EyeBadge';
import { ClinicalSelect, ClinicalSelectOption } from '../../components/ui/ClinicalSelect';
import { MedicalDisclaimer } from '../../components/ui/MedicalDisclaimer';

type StatusFilterType = 'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED';

const STATUS_FILTER_OPTIONS: ClinicalSelectOption<StatusFilterType>[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'COMPLETED', label: 'Đã hoàn thành', riskLevel: 'low' },
  { value: 'PROCESSING', label: 'Đang xử lý', riskLevel: 'moderate' },
  { value: 'FAILED', label: 'Lỗi chất lượng', riskLevel: 'critical' },
];

export interface ClinicBatchWorkspaceProps {
  batchJob: ClinicBatchJob;
  onUploadNewBatch?: () => void;
  onSelectBatchItem?: (item: any) => void;
  onExportCsv?: () => void;
}

export const ClinicBatchWorkspace: React.FC<ClinicBatchWorkspaceProps> = ({
  batchJob,
  onUploadNewBatch,
  onSelectBatchItem,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED'>('ALL');

  const items = batchJob.items || [];
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchSearch =
        (it.fileName || it.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (it.id || '').toLowerCase().includes(searchTerm.toLowerCase());

      const normStatus = (it.status || '').toUpperCase();
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' &&
          (normStatus.includes('COMPLET') ||
            normStatus.includes('DONE') ||
            normStatus.includes('ĐÃ XỬ LÝ') ||
            normStatus === 'SUCCESS')) ||
        (statusFilter === 'PROCESSING' &&
          (normStatus.includes('PROCESS') ||
            normStatus.includes('PROGRESS') ||
            normStatus.includes('QUEUE') ||
            normStatus.includes('ĐANG'))) ||
        (statusFilter === 'FAILED' &&
          (normStatus.includes('FAIL') || normStatus.includes('ERROR') || normStatus.includes('LỖI')));

      return matchSearch && matchStatus;
    });
  }, [batchJob.items, searchTerm, statusFilter]);

  const renderStatusBadge = (status?: string) => {
    const normStatus = (status || '').toUpperCase();
    const isFailed =
      normStatus.includes('FAIL') ||
      normStatus.includes('ERROR') ||
      normStatus.includes('LỖI');
    const isProcessing =
      normStatus.includes('PROCESS') ||
      normStatus.includes('PROGRESS') ||
      normStatus.includes('QUEUE') ||
      normStatus.includes('ĐANG');

    if (isFailed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>{status || 'Lỗi chất lượng'}</span>
        </span>
      );
    }

    if (isProcessing) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>{status || 'Đang xử lý'}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>{status || 'Đã xử lý'}</span>
      </span>
    );
  };

  const columns: Column<any>[] = [
    {
      header: 'Mã Tệp / ID Ảnh',
      accessor: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
            {row.fileName || row.patientName || 'Ảnh đáy mắt'}
          </span>
          <span className="text-[11px] text-slate-500 font-sans">
            <span className="font-mono-data">{row.id}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Bệnh Nhân (Ẩn danh)',
      accessor: (row) => (
        <span className="text-xs text-slate-700 font-mono-data">
          {row.pseudonymId || row.mrn || 'ANON-PATIENT'}
        </span>
      ),
    },
    {
      header: 'Mắt Khám',
      accessor: (row) => <EyeBadge position={row.eye} />,
    },
    {
      header: 'Trạng Thái',
      accessor: (row) => renderStatusBadge(row.status),
    },
    {
      header: 'Thao Tác',
      align: 'right',
      accessor: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSelectBatchItem?.(row)}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Pipeline Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">Tổng số ảnh trong đợt</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-data mt-1.5">
            {batchJob.totalImages || 0}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold font-sans">Đợt {batchJob.batchId || 'Mới'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 block">Đã hoàn thành AI</span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono-data mt-1.5">
            {batchJob.processedCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            Tỷ lệ: {batchJob.totalImages ? ((batchJob.processedCount / batchJob.totalImages) * 100).toFixed(0) : 100}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-amber-700 block">Đang phân tích ngầm</span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-data mt-1.5">
            {batchJob.status === 'IN_PROGRESS' || batchJob.status === 'QUEUED'
              ? batchJob.totalImages - batchJob.processedCount
              : 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">Hàng đợi phi đồng bộ</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-red-700 block">Lỗi chất lượng ảnh</span>
          <div className="text-2xl font-extrabold text-red-600 font-mono-data mt-1.5">
            {batchJob.failedCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">Cần chụp lại</span>
        </div>
      </div>

      {/* Batch Operations Toolbar - Clean UI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Tìm kiếm */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Tìm kiếm tệp ảnh / ca sàng lọc
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên tệp ảnh, định danh..."
                className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Trạng thái */}
          <div className="lg:col-span-3 space-y-1.5">
            <ClinicalSelect<StatusFilterType>
              label="Trạng thái xử lý"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              size="md"
            />
          </div>

          {/* Action buttons */}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Xuất kết quả CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất CSV</span>
              </button>
            )}

            {onUploadNewBatch && (
              <button
                type="button"
                onClick={onUploadNewBatch}
                className="flex-1 h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Tải lên đợt ảnh mới"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tải Đợt Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header Danh Sách */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0891B2]" />
            Danh sách tệp ảnh chiến dịch
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            ({filteredItems.length})
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Cơ sở: {batchJob.clinicName || 'Trung tâm sàng lọc'} • Mã: {batchJob.batchId}
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(it, idx) => it.id || String(idx)}
        emptyMessage="Chưa có ảnh nào trong đợt khám hiện tại. Bấm 'Tải Đợt Mới' để tải tệp hàng loạt."
      />

      <MedicalDisclaimer variant="compact" />
    </div>
  );
};
