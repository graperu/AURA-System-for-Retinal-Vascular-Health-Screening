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
import { useLanguage } from '../../context/LanguageContext';

type StatusFilterType = 'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED';

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
  const { t, isVi } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED'>('ALL');

  const statusFilterOptions: ClinicalSelectOption<StatusFilterType>[] = useMemo(
    () => [
      { value: 'ALL', label: t('clinic.batchWorkspace.allStatuses') },
      { value: 'COMPLETED', label: t('clinic.batchWorkspace.statusCompleted'), riskLevel: 'low' },
      { value: 'PROCESSING', label: t('clinic.batchWorkspace.statusProcessing'), riskLevel: 'moderate' },
      { value: 'FAILED', label: t('clinic.batchWorkspace.statusFailed'), riskLevel: 'critical' },
    ],
    [t]
  );

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
        <span
          data-status={normStatus || 'FAILED'}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
        >
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>{t('clinic.batchWorkspace.badgeQualityError')}</span>
        </span>
      );
    }

    if (isProcessing) {
      return (
        <span
          data-status={normStatus || 'PROCESSING'}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
        >
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>{t('clinic.batchWorkspace.badgeProcessing')}</span>
        </span>
      );
    }

    return (
      <span
        data-status={normStatus || 'COMPLETED'}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>{t('clinic.batchWorkspace.badgeCompleted')}</span>
      </span>
    );
  };

  const columns: Column<any>[] = useMemo(
    () => [
      {
        header: t('clinic.batchWorkspace.colFileId'),
        accessor: (row) => (
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
              {row.fileName || row.patientName || t('clinic.batchWorkspace.defaultFundusName')}
            </span>
            <span className="text-[11px] text-slate-500 font-sans">
              <span className="font-mono-data">{row.id}</span>
            </span>
          </div>
        ),
      },
      {
        header: t('clinic.batchWorkspace.colPatient'),
        accessor: (row) => (
          <span className="text-xs text-slate-700 font-mono-data">
            {row.pseudonymId || row.mrn || 'ANON-PATIENT'}
          </span>
        ),
      },
      {
        header: t('clinic.batchWorkspace.colEye'),
        accessor: (row) => <EyeBadge position={row.eye} />,
      },
      {
        header: t('clinic.batchWorkspace.colStatus'),
        accessor: (row) => renderStatusBadge(row.status),
      },
      {
        header: t('clinic.batchWorkspace.colActions'),
        align: 'right',
        accessor: (row) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSelectBatchItem?.(row)}
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            {t('clinic.batchWorkspace.viewDetail')}
          </Button>
        ),
      },
    ],
    [t, onSelectBatchItem]
  );

  return (
    <div className="space-y-6">
      {/* 4 Pipeline Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">
            {t('clinic.batchWorkspace.totalImages')}
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-data mt-1.5">
            {batchJob.totalImages || 0}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold font-sans">
            {batchJob.batchId
              ? `${t('clinic.batchWorkspace.batch')} ${batchJob.batchId}`
              : t('clinic.batchWorkspace.newBatch')}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 block">
            {t('clinic.batchWorkspace.completedAi')}
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono-data mt-1.5">
            {batchJob.processedCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            {t('clinic.batchWorkspace.rate')}:{' '}
            {batchJob.totalImages
              ? ((batchJob.processedCount / batchJob.totalImages) * 100).toFixed(0)
              : 100}
            %
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-amber-700 block">
            {t('clinic.batchWorkspace.processingBackground')}
          </span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-data mt-1.5">
            {batchJob.status === 'IN_PROGRESS' || batchJob.status === 'QUEUED'
              ? batchJob.totalImages - batchJob.processedCount
              : 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            {t('clinic.batchWorkspace.asyncQueue')}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-red-700 block">
            {t('clinic.batchWorkspace.qualityError')}
          </span>
          <div className="text-2xl font-extrabold text-red-600 font-mono-data mt-1.5">
            {batchJob.failedCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            {t('clinic.batchWorkspace.retakeNeeded')}
          </span>
        </div>
      </div>

      {/* Batch Operations Toolbar - Clean UI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Tìm kiếm */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {t('clinic.batchWorkspace.searchLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('clinic.batchWorkspace.searchPlaceholder')}
                className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                  title={t('clinic.batchWorkspace.clearSearch')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Trạng thái */}
          <div className="lg:col-span-3 space-y-1.5">
            <ClinicalSelect<StatusFilterType>
              label={t('clinic.batchWorkspace.statusFilterLabel')}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilterOptions}
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
                title={t('clinic.batchWorkspace.exportCsv')}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('clinic.batchWorkspace.exportCsv')}</span>
              </button>
            )}

            {onUploadNewBatch && (
              <button
                type="button"
                onClick={onUploadNewBatch}
                className="flex-1 h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title={t('clinic.batchWorkspace.newBatchButton')}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('clinic.batchWorkspace.newBatchButton')}</span>
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
            {t('clinic.batchWorkspace.campaignImagesTitle')}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            ({filteredItems.length})
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {t('clinic.batchWorkspace.facility')}:{' '}
          {batchJob.clinicName || t('clinic.batchWorkspace.defaultFacility')} •{' '}
          {t('clinic.batchWorkspace.batchIdLabel')}: {batchJob.batchId}
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(it, idx) => it.id || String(idx)}
        emptyMessage={t('clinic.batchWorkspace.emptyMessage')}
      />

      <MedicalDisclaimer variant="compact" />
    </div>
  );
};
