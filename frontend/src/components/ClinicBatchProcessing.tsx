import React, { useState, useEffect, useRef } from 'react';
import { ClinicBatchJob, ClinicBatchJobItem } from '../types/cds';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { BatchUploadModal } from './BatchUploadModal';
import { BatchItemDetailModal } from './BatchItemDetailModal';
import { bulkScreeningApi, BulkUploadPayload } from '../services/api';
import {
  UploadCloud,
  Building2,
  CreditCard,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Download,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  Eye,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Heart,
  Loader2,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from 'lucide-react';

interface ClinicBatchProcessingProps {
  batchJob: ClinicBatchJob;
  onUpdateBatch?: (updated: ClinicBatchJob) => void;
  onResetBatch?: () => void;
}

export const ClinicBatchProcessing: React.FC<ClinicBatchProcessingProps> = ({
  batchJob: initialBatchJob,
  onUpdateBatch,
  onResetBatch,
}) => {
  const [currentJob, setCurrentJob] = useState<ClinicBatchJob>(initialBatchJob);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [eyeFilter, setEyeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'RISK_DESC' | 'MRN_ASC'>('NEWEST');
  const [isAnonymizedView, setIsAnonymizedView] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedItemForCds, setSelectedItemForCds] = useState<ClinicBatchJobItem | null>(null);

  const [clinicCredits, setClinicCredits] = useState(1880);
  const [isPolling, setIsPolling] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobRef = useRef<ClinicBatchJob>(currentJob);
  const thumbnailCacheRef = useRef<Record<string, string>>({});

  // Keep currentJobRef synced with state
  useEffect(() => {
    currentJobRef.current = currentJob;
  }, [currentJob]);

  // Sync prop changes and populate thumbnail cache
  useEffect(() => {
    if (initialBatchJob.items && initialBatchJob.items.length > 0) {
      initialBatchJob.items.forEach((item) => {
        if (item.thumbnailUrl && item.thumbnailUrl !== '/assets/images/fundus_original.png') {
          if (item.id) thumbnailCacheRef.current[item.id] = item.thumbnailUrl;
          if (item.fileName) thumbnailCacheRef.current[item.fileName] = item.thumbnailUrl;
          if (item.mrn) thumbnailCacheRef.current[item.mrn] = item.thumbnailUrl;
        }
      });
    }
    setCurrentJob(initialBatchJob);
  }, [initialBatchJob]);

  // Live polling effect when job is in progress
  useEffect(() => {
    const isJobActive =
      currentJob.status === 'IN_PROGRESS' || currentJob.status === 'QUEUED';

    if (isJobActive && currentJob.batchId.startsWith('BATCH-')) {
      setIsPolling(true);
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        try {
          const activeBatchId = currentJobRef.current.batchId;
          const res = await bulkScreeningApi.getBatchStatus(activeBatchId);
          if (res.success && res.data) {
            const raw = res.data;
            const mappedItems: ClinicBatchJobItem[] = (raw.items || []).map((it: any, idx: number) => {
              const existingItem = currentJobRef.current.items.find(
                (existing) => existing.id === it.itemId || existing.fileName === it.fileName || existing.mrn === it.rawMrn
              ) || currentJobRef.current.items[idx];

              const thumb =
                thumbnailCacheRef.current[it.itemId] ||
                thumbnailCacheRef.current[it.fileName] ||
                thumbnailCacheRef.current[it.rawMrn] ||
                existingItem?.thumbnailUrl ||
                '/assets/images/fundus_original.png';

              if (it.itemId && thumb) thumbnailCacheRef.current[it.itemId] = thumb;
              if (it.fileName && thumb) thumbnailCacheRef.current[it.fileName] = thumb;
              if (it.rawMrn && thumb) thumbnailCacheRef.current[it.rawMrn] = thumb;

              return {
                id: it.itemId,
                fileName: it.fileName,
                eye: it.eyePosition || 'OD',
                mrn: it.rawMrn || it.pseudonymPatientId || 'MRN-N/A',
                patientName: it.patientName || `Bệnh nhân ${it.pseudonymPatientId || 'ANO'}`,
                pseudonymId: it.pseudonymPatientId,
                patientAge: it.patientAge,
                patientGender: it.patientGender,
                systolicBp: it.systolicBp,
                diastolicBp: it.diastolicBp,
                hbA1c: it.hbA1c,
                status: it.status === 'COMPLETED' ? 'DONE' : it.status,
                durationMs: it.durationMs,
                riskLevel:
                  it.aiResult?.overallVascularRiskScore >= 75
                    ? 'High'
                    : it.aiResult?.overallVascularRiskScore >= 50
                    ? 'Moderate'
                    : it.aiResult?.overallVascularRiskScore
                    ? 'Low'
                    : undefined,
                riskScore: it.aiResult?.overallVascularRiskScore,
                aiResult: it.aiResult,
                thumbnailUrl: thumb,
                createdAt: existingItem?.createdAt || Date.now(),
              };
            });

            // Cập nhật thông tin các item trong currentItems giữ nguyên vị trí hiện tại
            const currentItems = currentJobRef.current.items || [];
            const updatedItems = currentItems.map((item) => {
              const matched = mappedItems.find(
                (m) => m.id === item.id || (m.fileName === item.fileName && m.mrn === item.mrn)
              );
              return matched
                ? {
                    ...item,
                    ...matched,
                    createdAt: item.createdAt || matched.createdAt || Date.now(),
                  }
                : item;
            });
            // Bổ sung các item mới nếu chưa có, đưa lên ĐẦU danh sách
            const unmapped = mappedItems.filter(
              (m) => !updatedItems.some((u) => u.id === m.id || (u.fileName === m.fileName && u.mrn === m.mrn))
            );
            const mergedItems = [...unmapped, ...updatedItems];

            const updatedJob: ClinicBatchJob = {
              batchId: raw.batchId,
              clinicId: raw.clinicId || currentJobRef.current.clinicId,
              clinicName: currentJobRef.current.clinicName,
              totalImages: mergedItems.length,
              processedCount: mergedItems.filter((it) => it.status === 'DONE' || it.status === 'COMPLETED').length,
              failedCount: mergedItems.filter((it) => it.status === 'FAILED').length,
              status: raw.status,
              createdAt: currentJobRef.current.createdAt,
              estimatedTimeRemainingSec: Math.round(raw.estimatedTimeRemainingSeconds || 0),
              items: mergedItems,
            };

            setCurrentJob(updatedJob);
            if (onUpdateBatch) onUpdateBatch(updatedJob);
            try {
              localStorage.setItem('AURA_CLINIC_BATCH_JOB', JSON.stringify(updatedJob));
            } catch (e) {}

            if (raw.status === 'COMPLETED' || raw.status === 'CANCELLED') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setIsPolling(false);
            }
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 1500);
    } else {
      setIsPolling(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentJob.batchId, currentJob.status]);

  // Handle Submit Batch from Modal
  const handleSubmitBatch = async (payload: {
    campaignName: string;
    clinicId: string;
    items: any[];
  }) => {
    try {
      setFeedbackMsg('Đang khử định danh HIPAA SHA-256 HMAC và đẩy hàng đợi...');

      // Pre-seed thumbnail cache with uploaded preview URLs
      payload.items.forEach((item) => {
        if (item.previewUrl) {
          if (item.fileName) thumbnailCacheRef.current[item.fileName] = item.previewUrl;
          if (item.rawMrn) thumbnailCacheRef.current[item.rawMrn] = item.previewUrl;
        }
      });

      const res = await bulkScreeningApi.createBatch({
        campaignName: payload.campaignName,
        clinicId: payload.clinicId,
        imageItems: payload.items,
      });

      if (res.success && res.data) {
        const raw = res.data;
        const mappedItems: ClinicBatchJobItem[] = (raw.items || []).map((it: any, idx: number) => {
          const original = payload.items[idx] || payload.items.find((p) => p.fileName === it.fileName || p.rawMrn === it.rawMrn);
          const thumb =
            original?.previewUrl ||
            thumbnailCacheRef.current[it.fileName] ||
            thumbnailCacheRef.current[it.rawMrn] ||
            original?.base64ImageContent ||
            '/assets/images/fundus_original.png';

          if (it.itemId && thumb) thumbnailCacheRef.current[it.itemId] = thumb;
          if (it.fileName && thumb) thumbnailCacheRef.current[it.fileName] = thumb;
          if (it.rawMrn && thumb) thumbnailCacheRef.current[it.rawMrn] = thumb;

          return {
            id: it.itemId,
            fileName: it.fileName,
            eye: it.eyePosition || 'OD',
            mrn: it.rawMrn || it.pseudonymPatientId,
            patientName: it.patientName || `Bệnh nhân ${it.rawMrn}`,
            pseudonymId: it.pseudonymPatientId,
            patientAge: it.patientAge,
            patientGender: it.patientGender,
            systolicBp: it.systolicBp,
            diastolicBp: it.diastolicBp,
            hbA1c: it.hbA1c,
            status: it.status,
            durationMs: it.durationMs,
            thumbnailUrl: thumb,
            createdAt: Date.now() + 100000000 + (raw.items.length - idx),
          };
        });

        // Giữ lại các ảnh đã khám trước đó (nếu có) và đưa ảnh mới tải lên LÊN ĐẦU
        const existingItems = (currentJobRef.current?.items || []).filter(
          (existing) => !mappedItems.some((m) => m.id === existing.id || (m.fileName === existing.fileName && m.mrn === existing.mrn))
        );
        const combinedItems = [...mappedItems, ...existingItems];

        const newJob: ClinicBatchJob = {
          batchId: raw.batchId,
          clinicId: raw.clinicId,
          clinicName: 'Bệnh viện Chợ Rẫy — Trung tâm Sàng lọc Đáy mắt',
          totalImages: combinedItems.length,
          processedCount: combinedItems.filter((it) => it.status === 'DONE' || it.status === 'COMPLETED').length,
          failedCount: combinedItems.filter((it) => it.status === 'FAILED').length,
          status: 'IN_PROGRESS',
          createdAt: currentJobRef.current?.items?.length ? currentJobRef.current.createdAt : new Date().toISOString(),
          estimatedTimeRemainingSec: Math.round(raw.estimatedTimeRemainingSeconds || 45),
          items: combinedItems,
        };

        setCurrentJob(newJob);
        if (onUpdateBatch) onUpdateBatch(newJob);
        try {
          localStorage.setItem('AURA_CLINIC_BATCH_JOB', JSON.stringify(newJob));
        } catch (e) {}

        setClinicCredits((prev) => Math.max(0, prev - payload.items.length));
        setFeedbackMsg(`Đã nạp thêm vào đợt khám ${raw.batchId} (${combinedItems.length} ảnh tổng cộng).`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to create batch job:', err);
      setFeedbackMsg('Lỗi gửi lô ảnh lên máy chủ. Vui lòng kiểm tra lại kết nối.');
    }
  };

  // 1-Click Quick Demo 100 Batch Generation
  const handleGenerateQuickDemo100 = async () => {
    setIsDemoLoading(true);
    setFeedbackMsg('Đang tạo và đẩy lô 100 ảnh mẫu thử nghiệm lâm sàng...');
    try {
      const res = await bulkScreeningApi.createDemoBatch(100);
      if (res.success && res.data) {
        const raw = res.data;
        const mappedItems: ClinicBatchJobItem[] = (raw.items || []).map((it: any, idx: number) => ({
          id: it.itemId,
          fileName: it.fileName,
          eye: it.eyePosition || 'OD',
          mrn: it.rawMrn || it.pseudonymPatientId,
          patientName: it.patientName || `Bệnh nhân ${it.rawMrn}`,
          pseudonymId: it.pseudonymPatientId,
          patientAge: it.patientAge,
          patientGender: it.patientGender,
          systolicBp: it.systolicBp,
          diastolicBp: it.diastolicBp,
          hbA1c: it.hbA1c,
          status: it.status,
          durationMs: it.durationMs,
          thumbnailUrl: '/assets/images/fundus_original.png',
          createdAt: Date.now() + idx,
        }));

        const newJob: ClinicBatchJob = {
          batchId: raw.batchId,
          clinicId: raw.clinicId,
          clinicName: 'Bệnh viện Chợ Rẫy — Khoa Mắt & Tim Mạch',
          totalImages: raw.totalImages,
          processedCount: 0,
          failedCount: 0,
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
          estimatedTimeRemainingSec: Math.round(raw.estimatedTimeRemainingSeconds || 35),
          items: mappedItems,
        };

        setCurrentJob(newJob);
        if (onUpdateBatch) onUpdateBatch(newJob);
        try {
          localStorage.setItem('AURA_CLINIC_BATCH_JOB', JSON.stringify(newJob));
        } catch (e) {}

        setClinicCredits((prev) => Math.max(0, prev - 100));
        setFeedbackMsg(`Đã nạp thành công lô mẫu 100 ảnh vào hàng đợi (${raw.batchId}).`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to create demo batch:', err);
      setFeedbackMsg('Không thể tạo đợt sàng lọc mẫu. Vui lòng thử lại.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Pause or Cancel Batch
  const handleTogglePause = async () => {
    if (currentJob.status === 'IN_PROGRESS') {
      try {
        await bulkScreeningApi.cancelBatch(currentJob.batchId);
        setCurrentJob((prev) => ({ ...prev, status: 'PAUSED' }));
        setFeedbackMsg('Đã tạm dừng hàng đợi phân tích.');
        setTimeout(() => setFeedbackMsg(null), 3000);
      } catch (err) {
        console.error(err);
      }
    } else if (currentJob.status === 'PAUSED') {
      setCurrentJob((prev) => ({ ...prev, status: 'IN_PROGRESS' }));
    }
  };

  // Real-time Calculations
  const percentComplete = currentJob.totalImages > 0
    ? Math.round((currentJob.processedCount / currentJob.totalImages) * 100)
    : 0;

  const highRiskCount = currentJob.items.filter(
    (i) => i.riskLevel === 'High' || (i.riskScore && i.riskScore >= 75)
  ).length;

  const moderateRiskCount = currentJob.items.filter(
    (i) => i.riskLevel === 'Moderate' || (i.riskScore && i.riskScore >= 50 && i.riskScore < 75)
  ).length;

  const lowRiskCount = currentJob.items.filter(
    (i) => i.riskLevel === 'Low' || (i.riskScore && i.riskScore < 50)
  ).length;

  const pendingCount = currentJob.items.filter(
    (i) => i.status === 'PENDING' || i.status === 'QUEUED'
  ).length;

  const processingCount = currentJob.items.filter(
    (i) => i.status === 'PROCESSING'
  ).length;

  // Filter items
  const filteredItems = currentJob.items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.patientName.toLowerCase().includes(term) ||
      item.mrn.toLowerCase().includes(term) ||
      (item.pseudonymId && item.pseudonymId.toLowerCase().includes(term)) ||
      item.fileName.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'DONE' && (item.status === 'DONE' || item.status === 'COMPLETED')) ||
      (statusFilter === 'PROCESSING' && item.status === 'PROCESSING') ||
      (statusFilter === 'PENDING' && (item.status === 'PENDING' || item.status === 'QUEUED'));

    const matchesRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'High' && (item.riskLevel === 'High' || (item.riskScore && item.riskScore >= 75))) ||
      (riskFilter === 'Moderate' && (item.riskLevel === 'Moderate' || (item.riskScore && item.riskScore >= 50 && item.riskScore < 75))) ||
      (riskFilter === 'Low' && (item.riskLevel === 'Low' || (item.riskScore && item.riskScore < 50)));

    const matchesEye = eyeFilter === 'ALL' || item.eye === eyeFilter;

    return matchesSearch && matchesStatus && matchesRisk && matchesEye;
  });

  // Sắp xếp danh sách: mặc định Ảnh khám mới nhất lên đầu (NEWEST first)
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && !timeB) return -1; // a có mốc mới nạp -> a lên đầu
      if (!timeA && timeB) return 1;  // b có mốc mới nạp -> b lên đầu
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      const idxA = currentJob.items.indexOf(a);
      const idxB = currentJob.items.indexOf(b);
      return idxA - idxB; // Giữ nguyên thứ tự nạp vào đầu mảng của currentJob.items
    }
    if (sortBy === 'OLDEST') {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && !timeB) return 1;
      if (!timeA && timeB) return -1;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      const idxA = currentJob.items.indexOf(a);
      const idxB = currentJob.items.indexOf(b);
      return idxB - idxA;
    }
    if (sortBy === 'RISK_DESC') {
      return (b.riskScore || 0) - (a.riskScore || 0);
    }
    if (sortBy === 'MRN_ASC') {
      return a.mrn.localeCompare(b.mrn);
    }
    return 0;
  });

  // Reset page when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, riskFilter, eyeFilter, sortBy]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedItems = pageSize === -1
    ? sortedItems
    : sortedItems.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  // Print clinical summary
  const handlePrintReport = () => {
    window.print();
  };

  // Export Comprehensive Clinical CSV (UTF-8 with BOM)
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Ma_MRN_Goc',
      'Ma_An_Danh_HIPAA_Pseudonym',
      'Ho_Ten_Benh_Nhan',
      'Tuoi',
      'Gioi_Tinh',
      'Huyet_Ap_mmHg',
      'HbA1c_Phan_Tram',
      'Mat_Kham',
      'Ten_File_Anh',
      'Trang_Thai_Xu_Ly',
      'Diem_Nguy_Co_Tong_Hop',
      'Phan_Loai_Nguy_Co',
      'Nguy_Co_Tim_Mach_Score',
      'Nguy_Co_Vong_Mac_DTD_Score',
      'Du_Bao_Dot_Quy_3_Nam_Phan_Tram',
      'Ty_Le_AV_Ratio',
      'Do_Uon_Luon_Tortuosity',
      'Mat_Do_Mach_Mau_Phan_Tram',
      'Thoi_Gian_Xu_Ly_Ms',
    ];

    const rows = currentJob.items.map((it, idx) => {
      const ai = it.aiResult;
      return [
        idx + 1,
        `"${it.mrn}"`,
        `"${it.pseudonymId || 'N/A'}"`,
        `"${it.patientName}"`,
        it.patientAge || 55,
        `"${it.patientGender || 'N/A'}"`,
        `"${it.systolicBp || 125}/${it.diastolicBp || 80}"`,
        it.hbA1c || 5.8,
        `"${it.eye}"`,
        `"${it.fileName}"`,
        `"${it.status}"`,
        it.riskScore || ai?.overallVascularRiskScore || 0,
        `"${it.riskLevel || 'Chờ phân tích'}"`,
        ai?.cardiovascularRiskScore || 0,
        ai?.diabeticRetinopathyScore || 0,
        ai?.threeYearStrokeRiskPercent || 0,
        ai?.arteryVeinRatio || 0.52,
        ai?.tortuosityIndex || 1.34,
        ai?.vesselDensityPercentage || 14.8,
        it.durationMs || 0,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `AURA_Bao_Cao_Sang_Loc_Hang_Loat_${currentJob.batchId}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className="bg-gradient-to-r from-[#0891B2] to-[#134E4A] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-cyan-200 hover:text-white text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Clinic Campaign Metrics & Credit Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clinic Info & Campaign */}
        <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#134E4A] truncate">{currentJob.clinicName}</h3>
            </div>
            <span className="text-xs text-slate-500 block font-mono-data mt-0.5">
              Mã Chiến Dịch: <strong className="text-[#0891B2]">
                {currentJob.totalImages === 0 ? 'Sẵn sàng tiếp nhận đợt mới' : currentJob.batchId}
              </strong>
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#16A34A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentJob.totalImages === 0
                  ? 'Hệ thống sàng lọc AI sẵn sàng'
                  : 'Chiến Dịch Sàng Lọc Sức Khỏe Mạch Máu 2026'}
              </span>
              {isPolling && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#0891B2] bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full font-mono-data animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Live Polling 1.5s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Batch Queue Real-Time Progress */}
        <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#134E4A] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0891B2]" /> Tiến Độ Xử Lý Hàng Đợi AI (Bulk Queue)
            </span>
            <span className="font-mono-data font-extrabold text-sm text-[#0891B2]">
              {percentComplete}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                percentComplete === 100
                  ? 'from-emerald-500 to-teal-600'
                  : 'from-[#0891B2] via-cyan-500 to-[#0E7490]'
              }`}
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-data pt-0.5">
            <span>
              Đã xong: <strong className="text-slate-800">{currentJob.processedCount}/{currentJob.totalImages}</strong> ảnh
              {currentJob.totalImages >= 100 && (
                <span className="text-emerald-600 font-bold ml-1.5">(≥100 ảnh)</span>
              )}
            </span>
            <span>
              Thời gian còn lại: <strong>~{Math.max(0, Math.round(currentJob.estimatedTimeRemainingSec))}s</strong>
            </span>
          </div>
        </div>

        {/* Screening Credits Management */}
        <div className="bg-gradient-to-br from-[#0891B2] via-[#0E7490] to-[#134E4A] text-white rounded-2xl p-5 shadow-medical-md space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-100 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Quản Lý Gói Credit Sàng Lọc
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono-data border border-white/20">
              Clinic Enterprise
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono-data">{clinicCredits.toLocaleString()}</span>
            <span className="text-xs text-cyan-200">/ 2,500 Lượt AI Khả Dụng</span>
          </div>
          <div className="text-[11px] text-cyan-100 flex justify-between items-center pt-1 border-t border-white/15">
            <span>Hạn dùng: 31/12/2026</span>
            <button
              onClick={() => setIsCreditModalOpen(true)}
              className="bg-white text-[#0891B2] hover:bg-cyan-50 px-2.5 py-1 rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              + Mua Thêm Credit
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Triage Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* High Risk */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-medical-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Nguy Cơ Cao (Khẩn)
            </span>
            <span className="text-2xl font-extrabold font-mono-data text-rose-700 mt-1 block">
              {highRiskCount}
            </span>
            <span className="text-[11px] text-slate-500">Cần bác sĩ hội chẩn ngay</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold font-mono-data">
            {currentJob.processedCount > 0 ? Math.round((highRiskCount / currentJob.processedCount) * 100) : 0}%
          </div>
        </div>

        {/* Moderate Risk */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-medical-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 block flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-600" /> Nguy Cơ Trung Bình
            </span>
            <span className="text-2xl font-extrabold font-mono-data text-amber-700 mt-1 block">
              {moderateRiskCount}
            </span>
            <span className="text-[11px] text-slate-500">Khám theo dõi định kỳ</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold font-mono-data">
            {currentJob.processedCount > 0 ? Math.round((moderateRiskCount / currentJob.processedCount) * 100) : 0}%
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-medical-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Nguy Cơ Thấp / Bình Thường
            </span>
            <span className="text-2xl font-extrabold font-mono-data text-emerald-700 mt-1 block">
              {lowRiskCount}
            </span>
            <span className="text-[11px] text-slate-500">Chỉ số vi mạch an toàn</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold font-mono-data">
            {currentJob.processedCount > 0 ? Math.round((lowRiskCount / currentJob.processedCount) * 100) : 0}%
          </div>
        </div>

        {/* In Queue / Processing */}
        <div className="bg-white border border-cyan-200 rounded-2xl p-4 shadow-medical-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#0891B2] block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#0891B2]" /> Đang Chờ & Phân Tích
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold font-mono-data text-[#0891B2]">
                {processingCount + pendingCount}
              </span>
              <span className="text-xs text-slate-400">/{currentJob.totalImages}</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {processingCount > 0 ? `Đang chạy: ${processingCount} ảnh` : 'Đã hoàn tất toàn bộ'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center font-bold font-mono-data">
            {processingCount > 0 ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-4 shadow-medical-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên bệnh nhân, Mã MRN, Mã ẩn danh HIPAA..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="DONE">Đã Xử Lý AI (Done)</option>
              <option value="PROCESSING">Đang Thực Thi (Processing)</option>
              <option value="PENDING">Đang Chờ Hàng Đợi (Queued)</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả Mức Nguy Cơ</option>
              <option value="High">Nguy cơ Cao (≥75%)</option>
              <option value="Moderate">Nguy cơ Trung Bình (50-74%)</option>
              <option value="Low">Nguy cơ Thấp (&lt;50%)</option>
            </select>

            <select
              value={eyeFilter}
              onChange={(e) => setEyeFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Cả 2 Mắt (OD/OS)</option>
              <option value="OD">Mắt Phải (OD)</option>
              <option value="OS">Mắt Trái (OS)</option>
            </select>

            {/* Bộ chọn sắp xếp (Mặc định Ảnh mới nhất lên đầu) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#0891B2]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-[#134E4A] outline-none cursor-pointer text-xs"
                title="Sắp xếp thứ tự ảnh khám"
              >
                <option value="NEWEST">Ảnh khám mới nhất lên đầu</option>
                <option value="OLDEST">Ảnh khám cũ nhất trước</option>
                <option value="RISK_DESC">Nguy cơ cao nhất (High Risk)</option>
                <option value="MRN_ASC">Mã MRN (A &rarr; Z)</option>
              </select>
            </div>

            {/* HIPAA Pseudonym Toggle */}
            <button
              onClick={() => setIsAnonymizedView(!isAnonymizedView)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isAnonymizedView
                  ? 'bg-cyan-50 border-[#0891B2] text-[#0891B2]'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAnonymizedView ? 'Chế độ HIPAA NFR-9: Đang Bật' : 'Ẩn danh HIPAA: Tắt'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick 1-Click Demo */}
            <button
              onClick={handleGenerateQuickDemo100}
              disabled={isDemoLoading}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Khởi chạy nhanh lô mẫu 100 ảnh có sẵn để kiểm thử [FR-24]"
            >
              {isDemoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Nạp Nhanh Lô Mẫu (≥100 Ảnh)
            </button>

            {/* Pause / Resume */}
            {currentJob.status === 'IN_PROGRESS' && (
              <button
                onClick={handleTogglePause}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" /> Tạm Dừng
              </button>
            )}

            {currentJob.status === 'PAUSED' && (
              <button
                onClick={handleTogglePause}
                className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Tiếp Tục
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Báo Cáo CSV
            </button>

            {/* Print / Save PDF */}
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              title="In hoặc Lưu PDF báo cáo tổng hợp chiến dịch sàng lọc lâm sàng"
            >
              <Printer className="w-4 h-4 text-slate-500" /> In / Lưu PDF
            </button>

            {/* Reset / New Batch Button */}
            {currentJob.items.length > 0 && onResetBatch && (
              <button
                onClick={() => {
                  const ok = window.confirm(
                    'Bạn có chắc chắn muốn kết thúc đợt khám này và TẠO ĐỢT KHÁM MỚI (đưa tiến độ về 0%) không? Toàn bộ danh sách các ảnh đã khám hiện tại sẽ được làm mới.'
                  );
                  if (ok) onResetBatch();
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                title="Xóa kết quả hiện tại để nạp đợt khám mới từ 0%"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tạo Đợt Khám Mới
              </button>
            )}

            {/* Upload Batch Button */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-[#0891B2] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#0E7490] transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" /> Tải Lên Tập Hàng Loạt (≥100 Ảnh DICOM)
            </button>
          </div>
        </div>

        {/* Batch Queue Content: Empty State vs Table */}
        {currentJob.items.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-white to-[#F0FDFA]/30 rounded-2xl border border-dashed border-[#CCFBF1]">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-[#0891B2] border border-cyan-200 flex items-center justify-center shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-extrabold text-[#134E4A]">
                Chưa Có Đợt Sàng Lọc Nào Đang Chạy (Tiến Độ: 0%)
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hệ thống đang ở trạng thái sẵn sàng. Hãy bấm <strong>Tải Lên Tập Hàng Loạt</strong> hoặc <strong>Nạp Nhanh Lô Mẫu</strong> để khởi chạy phân tích AI cho chiến dịch tầm soát lâm sàng.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleGenerateQuickDemo100}
                disabled={isDemoLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Nạp Nhanh Lô Mẫu (≥100 Ảnh)
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 active:scale-95 transition-all"
              >
                <UploadCloud className="w-4 h-4" /> Tải Lên Tập Hàng Loạt (≥100 Ảnh DICOM)
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono-data">
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Ảnh Đáy Mắt</th>
                  <th className="py-3 px-4">
                    {isAnonymizedView ? 'Mã Ẩn Danh HIPAA' : 'Bệnh Nhân & Mã MRN'}
                  </th>
                  <th className="py-3 px-4">Mắt Chụp</th>
                  <th className="py-3 px-4">Tệp Ảnh DICOM/PNG</th>
                  <th className="py-3 px-4">Trạng Thái AI</th>
                  <th className="py-3 px-4">Nguy Cơ Chung</th>
                  <th className="py-3 px-4">Chỉ Số Sinh Học (A/V, DR, HA)</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      Không tìm thấy bản ghi ảnh nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const itemIndex = pageSize === -1
                      ? idx + 1
                      : (effectivePage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemForCds(item)}
                        className="hover:bg-[#F0FDFA]/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-mono-data text-slate-500 font-semibold">
                          {itemIndex}
                        </td>
                        <td className="py-3 px-4">
                          <img
                            src={item.thumbnailUrl || '/assets/images/fundus_original.png'}
                            alt={item.fileName}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-slate-100 hover:scale-110 transition-transform"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {isAnonymizedView ? (
                            <div>
                              <span className="font-mono-data font-bold text-[#0891B2] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 text-xs">
                                {item.pseudonymId || `ANO-PAT-${item.mrn.slice(-6)}`}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Tuổi: {item.patientAge || 52} &bull; {item.patientGender || 'Nam'}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold text-[#134E4A]">{item.patientName}</div>
                              <div className="text-[11px] font-mono-data text-slate-400">
                                {item.mrn} &bull; {item.patientAge || 52}t ({item.patientGender || 'Nam'})
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono-data font-bold px-2 py-0.5 rounded text-[11px] border ${
                              item.eye === 'OD'
                                ? 'bg-cyan-50 text-[#0891B2] border-cyan-200'
                                : 'bg-teal-50 text-teal-700 border-teal-200'
                            }`}
                          >
                            {item.eye === 'OD' ? 'OD (Phải)' : 'OS (Trái)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono-data text-slate-600 max-w-[180px] truncate">
                          {item.fileName}
                        </td>
                        <td className="py-3 px-4">
                          {(item.status === 'DONE' || item.status === 'COMPLETED') && (
                            <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Thành công
                            </span>
                          )}
                          {item.status === 'PROCESSING' && (
                            <span className="inline-flex items-center gap-1.5 text-[#0891B2] font-semibold bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 text-[11px] animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" /> Đang chạy AI
                            </span>
                          )}
                          {(item.status === 'PENDING' || item.status === 'QUEUED') && (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" /> Chờ hàng đợi
                            </span>
                          )}
                          {(item.status === 'ERROR' || item.status === 'FAILED') && (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-medium bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-[11px]">
                              <AlertTriangle className="w-3 h-3" /> Lỗi đọc ảnh
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.riskScore !== undefined ? (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono-data border ${
                                item.riskScore >= 75
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : item.riskScore >= 50
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {item.riskLevel || (item.riskScore >= 75 ? 'High' : item.riskScore >= 50 ? 'Moderate' : 'Low')}{' '}
                              ({item.riskScore}%)
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono-data">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] font-mono-data text-slate-600">
                          {item.aiResult ? (
                            <span>
                              A/V: <strong>{item.aiResult.arteryVeinRatio || 0.52}</strong> &bull; DR:{' '}
                              <strong>{item.aiResult.diabeticRetinopathyScore || 45}%</strong>
                            </span>
                          ) : (
                            <span>
                              HA: {item.systolicBp || 120}/{item.diastolicBp || 80} &bull; HbA1c: {item.hbA1c || 5.6}%
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForCds(item);
                            }}
                            className="text-[#0891B2] hover:text-[#0E7490] font-bold text-xs bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-lg border border-cyan-200 transition-colors"
                          >
                            Xem CDS &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Toolbar */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Hiển thị:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 outline-none focus:border-[#0891B2]"
                >
                  <option value={25}>25 ảnh / trang</option>
                  <option value={50}>50 ảnh / trang</option>
                  <option value={100}>100 ảnh / trang (Chuẩn FR-24)</option>
                  <option value={-1}>Tất cả ({filteredItems.length} ảnh)</option>
                </select>
                <span className="text-slate-400 font-mono-data ml-2">
                  (Hiển thị {filteredItems.length === 0 ? 0 : (effectivePage - 1) * (pageSize === -1 ? filteredItems.length : pageSize) + 1} &ndash;{' '}
                  {Math.min(effectivePage * (pageSize === -1 ? filteredItems.length : pageSize), filteredItems.length)} trong tổng số{' '}
                  <strong>{filteredItems.length}</strong> ảnh)
                </span>
              </div>

              {pageSize !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-1.5 font-mono-data">
                  <button
                    type="button"
                    disabled={effectivePage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Về trang đầu"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    disabled={effectivePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>

                  <div className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-bold text-[#134E4A]">
                    Trang {effectivePage} / {totalPages}
                  </div>

                  <button
                    type="button"
                    disabled={effectivePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    disabled={effectivePage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Đến trang cuối"
                  >
                    <ChevronsRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Batch Upload Modal */}
      <BatchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmitBatch={handleSubmitBatch}
        currentCredits={clinicCredits}
      />

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        userRole="clinic"
        currentCredit={clinicCredits}
        onSuccess={(added) => setClinicCredits((prev) => prev + added)}
      />

      {/* Individual Item CDS Modal */}
      <BatchItemDetailModal
        item={selectedItemForCds}
        onClose={() => setSelectedItemForCds(null)}
      />
    </div>
  );
};
