import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Plus,
  Play,
  FileText,
} from 'lucide-react';
import { ClinicBatchJob } from '../../types/cds';
import { Card } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

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
  const filteredItems = items.filter((it) => {
    const matchSearch =
      (it.fileName || it.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (it.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const columns: Column<any>[] = [
    {
      header: 'Mã Tệp / ID Ảnh',
      accessor: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 block truncate max-w-[200px]">
            {row.fileName || row.patientName || 'Ảnh đáy mắt'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono-data">
            {row.id} • {row.eye || 'OD'}
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
      header: 'Loại Chụp',
      accessor: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.eye === 'OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'}
        </span>
      ),
    },
    {
      header: 'Trạng Thái',
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {row.status || 'Đã xử lý'}
        </span>
      ),
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
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-medical-card">
          <span className="text-xs font-bold text-slate-500 block">Tổng số ảnh trong đợt</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-data mt-1.5">
            {batchJob.totalImages || 0}
          </div>
          <span className="text-[11px] text-[#0891B2] font-semibold">Đợt {batchJob.batchId || 'Mới'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-medical-card">
          <span className="text-xs font-bold text-emerald-700 block">Đã hoàn thành AI</span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono-data mt-1.5">
            {batchJob.processedCount || 0}
          </div>
          <span className="text-[11px] text-slate-500">Tỷ lệ: {batchJob.totalImages ? ((batchJob.processedCount / batchJob.totalImages) * 100).toFixed(0) : 100}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-medical-card">
          <span className="text-xs font-bold text-amber-700 block">Đang phân tích ngầm</span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-data mt-1.5">
            {batchJob.status === 'IN_PROGRESS' || batchJob.status === 'QUEUED' ? (batchJob.totalImages - batchJob.processedCount) : 0}
          </div>
          <span className="text-[11px] text-slate-500">Hàng đợi phi đồng bộ</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-medical-card">
          <span className="text-xs font-bold text-red-700 block">Lỗi chất lượng ảnh</span>
          <div className="text-2xl font-extrabold text-red-600 font-mono-data mt-1.5">
            {batchJob.failedCount || 0}
          </div>
          <span className="text-[11px] text-slate-500">Cần chụp lại</span>
        </div>
      </div>

      {/* Batch Operations Toolbar */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#0891B2]" />
              Chiến Dịch Sàng Lọc Hàng Loạt (Batch Screening Pipeline)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cơ sở: {batchJob.clinicName || 'Trung tâm sàng lọc'} • Mã chiến dịch: {batchJob.batchId}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tệp ảnh..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {onExportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              >
                Xuất CSV
              </Button>
            )}

            {onUploadNewBatch && (
              <Button
                variant="primary"
                size="sm"
                onClick={onUploadNewBatch}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Tải Đợt Mới (≥100)
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(it, idx) => it.id || String(idx)}
        emptyMessage="Chưa có ảnh nào trong đợt khám hiện tại. Bấm 'Tải Đợt Mới' để tải tệp hàng loạt."
      />
    </div>
  );
};
