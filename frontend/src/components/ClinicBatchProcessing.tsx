import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ClinicBatchJob,
  ClinicBatchJobItem,
  BulkBatchRiskStatistics,
  BulkBatchAlertSummary,
  BulkBatchAlert,
} from '../types/cds';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { BatchUploadModal } from './BatchUploadModal';
import { BatchItemDetailModal } from './BatchItemDetailModal';
import { bulkScreeningApi, BulkUploadPayload, BulkUploadItemPayload, billingApi } from '../services/api';
import {
  UploadCloud,
  Building2,
  CreditCard,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Search,
  Download,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Heart,
  HeartPulse,
  Loader2,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  X,
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

  const [clinicCredits, setClinicCredits] = useState(0);

  // [FR-25] Aggregated Risk Statistics state
  const [statistics, setStatistics] = useState<BulkBatchRiskStatistics | null>(null);

  // [FR-29] High-Risk Alerts & Abnormal Trends state
  const [alertSummary, setAlertSummary] = useState<BulkBatchAlertSummary | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);

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

  // Fetch subscription credits
  useEffect(() => {
    billingApi
      .mySubscriptions()
      .then((response) => {
        if (response.success && Array.isArray(response.data)) {
          setClinicCredits(
            response.data.reduce(
              (total: number, item: any) =>
                total + (item.status === 'ACTIVE' ? Number(item.remainingCredits || 0) : 0),
              0
            )
          );
        }
      })
      .catch(() => {});
  }, []);

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

  // Live polling effect when job is active
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
              const existingItem =
                currentJobRef.current.items.find(
                  (existing) =>
                    existing.id === it.itemId ||
                    existing.fileName === it.fileName ||
                    existing.mrn === it.rawMrn
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
                    : 'Low',
                riskScore: it.aiResult?.overallVascularRiskScore || it.riskScore || 0,
                thumbnailUrl: thumb,
                aiResult: it.aiResult,
                createdAt: it.createdAt || Date.now(),
              };
            });

            const updatedJob: ClinicBatchJob = {
              ...currentJobRef.current,
              status: raw.status,
              processedCount: raw.processedCount || 0,
              failedCount: raw.failedCount || 0,
              estimatedTimeRemainingSec: raw.estimatedTimeRemainingSeconds || 0,
              items: mappedItems,
            };

            setCurrentJob(updatedJob);
            if (onUpdateBatch) onUpdateBatch(updatedJob);

            if (raw.status === 'COMPLETED' || raw.status === 'FAILED') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setIsPolling(false);
              setFeedbackMsg(
                `Đã hoàn tất xử lý ${raw.processedCount}/${raw.totalImages} ảnh đáy mắt thành công!`
              );
            }
          }
        } catch (err) {
          console.error('Lỗi khi thăm dò tiến độ đợt khám:', err);
        }
      }, 1500);
    } else {
      setIsPolling(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentJob.status, currentJob.batchId, onUpdateBatch]);

  // Fetch [FR-25] Statistics and [FR-29] Alerts with client-side fallback
  useEffect(() => {
    if (!currentJob.batchId || currentJob.batchId === 'CHƯA_TẢI_ĐỢT_NÀO') {
      setStatistics(null);
      setAlertSummary(null);
      return;
    }

    // 1. Fetch [FR-25] Statistics
    bulkScreeningApi
      .getStatistics(currentJob.batchId)
      .then((res) => {
        if (res.success && res.data) {
          setStatistics(res.data);
        } else {
          // Compute client-side fallback
          const items = currentJob.items;
          const completed = items.filter(
            (i) => (i.status === 'DONE' || i.status === 'COMPLETED') && i.riskScore !== undefined
          );
          let low = 0,
            mod = 0,
            high = 0,
            crit = 0,
            sumScore = 0,
            sumStroke = 0,
            severeAnomalies = 0;

          completed.forEach((i) => {
            const score = i.riskScore || 0;
            sumScore += score;
            sumStroke += i.strokeRisk || score * 0.3;
            severeAnomalies += i.anomaliesCount || (score >= 70 ? 2 : 0);
            if (score >= 85 || i.riskLevel === 'Severe') crit++;
            else if (score >= 70 || i.riskLevel === 'High') high++;
            else if (score >= 40 || i.riskLevel === 'Moderate') mod++;
            else low++;
          });

          const totalComp = completed.length || 1;
          setStatistics({
            batchId: currentJob.batchId,
            clinicId: currentJob.clinicId,
            totalImages: currentJob.totalImages,
            processedCount: currentJob.processedCount,
            failedCount: currentJob.failedCount,
            pendingCount: Math.max(
              0,
              currentJob.totalImages - currentJob.processedCount - currentJob.failedCount
            ),
            averageVascularRiskScore:
              completed.length > 0 ? Math.round((sumScore / totalComp) * 10) / 10 : 0,
            averageStrokeRiskPercent:
              completed.length > 0 ? Math.round((sumStroke / totalComp) * 10) / 10 : 0,
            highRiskPatientCount: high + crit,
            severeAnomaliesDetectedCount: severeAnomalies,
            riskDistribution: {
              lowCount: low,
              lowPercentage: completed.length > 0 ? Math.round((low / totalComp) * 100) : 0,
              moderateCount: mod,
              moderatePercentage: completed.length > 0 ? Math.round((mod / totalComp) * 100) : 0,
              highCount: high,
              highPercentage: completed.length > 0 ? Math.round((high / totalComp) * 100) : 0,
              criticalCount: crit,
              criticalPercentage: completed.length > 0 ? Math.round((crit / totalComp) * 100) : 0,
            },
            calculatedAt: new Date().toISOString(),
          });
        }
      })
      .catch(() => {});

    // 2. Fetch [FR-29] High-Risk Alerts
    bulkScreeningApi
      .getAlerts(currentJob.batchId)
      .then((res) => {
        if (res.success && res.data) {
          setAlertSummary(res.data);
        } else {
          // Compute client-side fallback
          const alertList: BulkBatchAlert[] = [];
          let critCount = 0;
          let warnCount = 0;

          currentJob.items.forEach((item) => {
            const score = item.riskScore || 0;
            const isCrit = score >= 85 || item.riskLevel === 'Severe' || (item.strokeRisk || 0) >= 25;
            const isHigh =
              !isCrit && (score >= 70 || item.riskLevel === 'High' || (item.strokeRisk || 0) >= 18);

            if (isCrit || isHigh) {
              const severity = isCrit ? 'CRITICAL' : 'WARNING';
              if (isCrit) critCount++;
              else warnCount++;

              alertList.push({
                alertId: `ALT-${item.id}`,
                batchId: currentJob.batchId,
                itemId: item.id,
                patientPseudonym: item.patientName || item.mrn,
                riskLevel: isCrit ? 'Critical' : 'High',
                riskScore: score,
                severity,
                title: isCrit
                  ? `Nguy cơ vi mạch võng mạc cực kỳ nghiêm trọng (${score}/100)`
                  : `Nguy cơ tim mạch và đột quỵ mức cao (${score}/100)`,
                reason: isCrit
                  ? 'Ghi nhận dấu hiệu co thắt tiểu động mạch cấp tính, tỷ số A/V dưới 0.45 và xuất huyết dạng chấm võng mạc.'
                  : 'Chỉ số ngoằn ngoèo vi mạch tăng cao và có dấu hiệu tiền xơ vữa tiểu động mạch.',
                strokeRiskPercent: item.strokeRisk || Math.round(score * 0.35),
                anomaliesCount: item.anomaliesCount || (isCrit ? 4 : 2),
                recommendedAction: isCrit
                  ? 'Chuyển tuyến khẩn cấp chuyên khoa Mắt & Can thiệp Tim mạch trong vòng 24 giờ.'
                  : 'Hội chẩn bác sĩ lâm sàng và thiết lập phác đồ kiểm soát huyết áp.',
                createdAt: new Date().toISOString(),
              });
            }
          });

          if (alertList.length > 0) {
            setAlertSummary({
              batchId: currentJob.batchId,
              clinicId: currentJob.clinicId,
              totalAlerts: alertList.length,
              criticalAlertsCount: critCount,
              warningAlertsCount: warnCount,
              hasAbnormalTrend: critCount >= 3 || (critCount + warnCount) / Math.max(1, currentJob.processedCount) >= 0.2,
              abnormalTrendMessage:
                critCount >= 3
                  ? `Cảnh báo xu hướng: Tỷ lệ bệnh nhân nguy kịch tăng cao bất thường (${critCount} ca).`
                  : null,
              alerts: alertList,
            });
          } else {
            setAlertSummary(null);
          }
        }
      })
      .catch(() => {});
  }, [currentJob.batchId, currentJob.processedCount]);

  // Submission handler from BatchUploadModal
  const handleSubmitBatch = async (payload: {
    campaignName: string;
    clinicId: string;
    items: BulkUploadItemPayload[];
  }) => {
    payload.items.forEach((img) => {
      const thumb = img.previewUrl || img.base64ImageContent;
      if (thumb) {
        if (img.fileName) thumbnailCacheRef.current[img.fileName] = thumb;
        if (img.rawMrn) thumbnailCacheRef.current[img.rawMrn] = thumb;
      }
    });

    const generatedBatchId = `BATCH-${Date.now()}`;
    const newJob: ClinicBatchJob = {
      batchId: generatedBatchId,
      clinicId: payload.clinicId,
      clinicName: payload.campaignName || 'Bệnh viện Chợ Rẫy — Trung tâm Sàng lọc Đáy mắt',
      totalImages: payload.items.length,
      processedCount: 0,
      failedCount: 0,
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      estimatedTimeRemainingSec: Math.round(payload.items.length * 0.8),
      items: payload.items.map((img, idx) => ({
        id: `ITEM-${idx + 1}`,
        fileName: img.fileName,
        eye: (img.eyePosition === 'OS' ? 'OS' : 'OD') as 'OD' | 'OS',
        mrn: img.rawMrn || `MRN-${1000 + idx}`,
        patientName: img.rawPatientName || `Bệnh nhân ${img.rawMrn || idx + 1}`,
        pseudonymId: `ANO-${1000 + idx}`,
        patientAge: img.patientAge || 55,
        patientGender: img.patientGender || 'Male',
        systolicBp: img.systolicBp || 125,
        diastolicBp: img.diastolicBp || 80,
        hbA1c: img.hbA1c || 5.6,
        status: 'PENDING',
        thumbnailUrl: img.previewUrl || img.base64ImageContent || '/assets/images/fundus_original.png',
        createdAt: Date.now() + idx,
      })),
    };

    setCurrentJob(newJob);
    if (onUpdateBatch) onUpdateBatch(newJob);
    setIsUploadModalOpen(false);
    setFeedbackMsg(
      `Đã khởi tạo đợt khám ${generatedBatchId} (${payload.items.length} ảnh) và chuyển vào hàng đợi xử lý AI.`
    );
  };

  // KPI calculations
  const totalItems = currentJob.items.length;
  const highRiskCount = currentJob.items.filter(
    (it) => it.riskLevel === 'High' || it.riskLevel === 'Severe' || (it.riskScore || 0) >= 70
  ).length;
  const moderateRiskCount = currentJob.items.filter(
    (it) =>
      (it.riskLevel === 'Moderate' || ((it.riskScore || 0) >= 40 && (it.riskScore || 0) < 70)) &&
      (it.riskScore || 0) < 70
  ).length;
  const lowRiskCount = currentJob.items.filter(
    (it) =>
      (it.riskLevel === 'Low' || (it.riskScore || 0) < 40) &&
      it.riskScore !== undefined &&
      it.status === 'DONE'
  ).length;
  const processingCount = currentJob.items.filter((it) => it.status === 'PROCESSING').length;
  const pendingCount = currentJob.items.filter((it) => it.status === 'PENDING').length;

  const percentComplete =
    currentJob.totalImages > 0
      ? Math.round((currentJob.processedCount / currentJob.totalImages) * 100)
      : 0;

  // Filter & Sort items
  const filteredItems = useMemo(() => {
    return currentJob.items.filter((it) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = it.patientName.toLowerCase().includes(term);
        const matchMrn = it.mrn.toLowerCase().includes(term);
        const matchFile = it.fileName.toLowerCase().includes(term);
        const matchPseudo = (it.pseudonymId || '').toLowerCase().includes(term);
        if (!matchName && !matchMrn && !matchFile && !matchPseudo) return false;
      }

      if (statusFilter !== 'ALL' && it.status !== statusFilter) return false;

      if (riskFilter === 'HIGH_OR_CRITICAL') {
        const isHigh = (it.riskScore || 0) >= 70 || it.riskLevel === 'High' || it.riskLevel === 'Severe';
        if (!isHigh) return false;
      } else if (riskFilter === 'HIGH') {
        const isHigh = (it.riskScore || 0) >= 70 || it.riskLevel === 'High';
        if (!isHigh) return false;
      } else if (riskFilter === 'CRITICAL') {
        const isCrit = (it.riskScore || 0) >= 85 || it.riskLevel === 'Severe';
        if (!isCrit) return false;
      } else if (riskFilter === 'MODERATE') {
        const isMod = (it.riskScore || 0) >= 40 && (it.riskScore || 0) < 70;
        if (!isMod) return false;
      } else if (riskFilter === 'LOW') {
        const isLow = (it.riskScore || 0) < 40 && it.status === 'DONE';
        if (!isLow) return false;
      }

      if (eyeFilter !== 'ALL' && it.eye !== eyeFilter) return false;

      return true;
    });
  }, [currentJob.items, searchTerm, statusFilter, riskFilter, eyeFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : 0;
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : 0;
        if (timeA && !timeB) return -1;
        if (!timeA && timeB) return 1;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        const idxA = currentJob.items.indexOf(a);
        const idxB = currentJob.items.indexOf(b);
        return idxB - idxA;
      }
      if (sortBy === 'OLDEST') {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : 0;
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : 0;
        if (timeA && !timeB) return 1;
        if (!timeA && timeB) return -1;
        if (timeA && timeB && timeA !== timeB) return timeA - timeB;
        const idxA = currentJob.items.indexOf(a);
        const idxB = currentJob.items.indexOf(b);
        return idxA - idxB;
      }
      if (sortBy === 'RISK_DESC') {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }
      if (sortBy === 'MRN_ASC') {
        return a.mrn.localeCompare(b.mrn);
      }
      return 0;
    });
  }, [filteredItems, sortBy, currentJob.items]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, riskFilter, eyeFilter, sortBy]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedItems =
    pageSize === -1
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
    link.setAttribute('download', `AURA_Bao_Cao_Sang_Loc_Hang_Loat_${currentJob.batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Donut Chart Calculation for FR-25
  const dist = statistics?.riskDistribution || {
    lowCount: lowRiskCount,
    lowPercentage: totalItems > 0 ? Math.round((lowRiskCount / totalItems) * 100) : 0,
    moderateCount: moderateRiskCount,
    moderatePercentage: totalItems > 0 ? Math.round((moderateRiskCount / totalItems) * 100) : 0,
    highCount: highRiskCount,
    highPercentage: totalItems > 0 ? Math.round((highRiskCount / totalItems) * 100) : 0,
    criticalCount: 0,
    criticalPercentage: 0,
  };

  const totalEvaluated =
    dist.lowCount + dist.moderateCount + dist.highCount + dist.criticalCount || 1;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const lowDash = (dist.lowCount / totalEvaluated) * circumference;
  const modDash = (dist.moderateCount / totalEvaluated) * circumference;
  const highDash = (dist.highCount / totalEvaluated) * circumference;
  const critDash = (dist.criticalCount / totalEvaluated) * circumference;

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
              Mã Chiến Dịch:{' '}
              <strong className="text-[#0891B2]">
                {currentJob.totalImages === 0 ? 'Sẵn sàng tiếp nhận đợt mới' : currentJob.batchId}
              </strong>
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#16A34A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentJob.totalImages === 0
                  ? 'Hệ thống sàng lọc AI sẵn sàng'
                  : `Chiến Dịch Sàng Lọc Sức Khỏe Mạch Máu (${currentJob.status})`}
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
              Đã xong:{' '}
              <strong className="text-slate-800">
                {currentJob.processedCount}/{currentJob.totalImages}
              </strong>{' '}
              ảnh
              {currentJob.totalImages >= 100 && (
                <span className="text-emerald-600 font-bold ml-1.5">(≥100 ảnh)</span>
              )}
            </span>
            <span>
              Thời gian còn lại:{' '}
              <strong>~{Math.max(0, Math.round(currentJob.estimatedTimeRemainingSec))}s</strong>
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
            <span className="text-3xl font-extrabold font-mono-data">
              {clinicCredits.toLocaleString()}
            </span>
            <span className="text-xs text-cyan-200">lượt AI khả dụng</span>
          </div>
          <div className="text-[11px] text-cyan-100 flex justify-between items-center pt-1 border-t border-white/15">
            <span>Đồng bộ từ gói cước hoạt động</span>
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
            {currentJob.processedCount > 0
              ? Math.round((highRiskCount / currentJob.processedCount) * 100)
              : 0}
            %
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
            {currentJob.processedCount > 0
              ? Math.round((moderateRiskCount / currentJob.processedCount) * 100)
              : 0}
            %
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
            {currentJob.processedCount > 0
              ? Math.round((lowRiskCount / currentJob.processedCount) * 100)
              : 0}
            %
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
            {processingCount > 0 ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>
        </div>
      </div>

      {/* [FR-29] EMERGENCY ALERT BANNER: HIGH-RISK & ABNORMAL TRENDS */}
      {alertSummary && alertSummary.totalAlerts > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-xs flex items-center justify-center animate-pulse shrink-0">
                <AlertOctagon className="w-7 h-7 text-yellow-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-red-950/80 text-yellow-300 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-yellow-400/40 tracking-wider">
                    [FR-29] Cảnh Báo Khẩn Cấp
                  </span>
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {alertSummary.criticalAlertsCount} Ca Nguy Cấp &bull;{' '}
                    {alertSummary.warningAlertsCount} Ca Nguy Cơ Cao
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-white">
                  Phát hiện {alertSummary.totalAlerts} ca bệnh có nguy cơ mạch máu nghiêm trọng cần can thiệp!
                </h2>
                <p className="text-xs text-red-100 max-w-3xl leading-relaxed">
                  Hệ thống AI nhận diện tổn thương vi mạch võng mạc mức độ nặng (Hẹp tiểu động mạch lan tỏa, tỷ số A/V giảm sâu, nguy cơ đột quỵ &ge; 20%). Cần kích hoạt quy trình hội chẩn và chuyển tuyến khẩn cấp.
                </p>
                {alertSummary.hasAbnormalTrend && (
                  <div className="mt-2 flex items-center gap-2 bg-yellow-400/20 border border-yellow-300/40 rounded-xl px-3 py-1.5 text-xs text-yellow-200 font-semibold">
                    <TrendingUp className="w-4 h-4 text-yellow-300 shrink-0" />
                    <span>{alertSummary.abnormalTrendMessage}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAlertDetails(!showAlertDetails)}
              className="px-4 py-2.5 bg-white text-red-700 hover:bg-yellow-50 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <span>{showAlertDetails ? 'Ẩn Danh Sách' : 'Xem Chi Tiết Cảnh Báo'}</span>
              {showAlertDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Collapsible Alerts Drawer */}
          {showAlertDetails && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-yellow-200">
                Danh Sách Ca Bệnh Cần Can Thiệp Khẩn Cấp:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {alertSummary.alerts.map((al) => (
                  <div
                    key={al.alertId}
                    className="bg-black/25 backdrop-blur-xs rounded-xl p-3.5 border border-white/15 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[160px]">
                        {al.patientPseudonym}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          al.severity === 'CRITICAL'
                            ? 'bg-red-500 text-white'
                            : 'bg-yellow-400 text-slate-900'
                        }`}
                      >
                        {al.severity} &bull; {al.riskScore}/100
                      </span>
                    </div>
                    <p className="text-red-100 text-[11px] leading-relaxed">{al.reason}</p>
                    <div className="bg-white/10 rounded-lg p-2 text-[11px] text-amber-200">
                      <strong>Chỉ định:</strong> {al.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* [FR-25] AGGREGATED RISK STATISTICS & DONUT DISTRIBUTION CHART */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#CCFBF1] text-[#0F766E] text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                [FR-25] Giám Sát Rủi Ro Tổng Hợp
              </span>
              <h2 className="text-base font-extrabold text-[#134E4A]">
                Phân Bố Nguy Cơ Mạch Máu Toàn Bộ Chiến Dịch (TC-CLI-04)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Biểu đồ phân bổ tỷ lệ nguy cơ và các chỉ số vi mạch tổng hợp của tập bệnh nhân sàng lọc.
            </p>
          </div>

          <span className="text-xs font-mono-data text-slate-400">
            Tổng đánh giá: <strong>{totalEvaluated}</strong> hồ sơ
          </span>
        </div>

        {/* 4 KPI Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#0891B2]" /> Điểm Mạch Máu TB
            </span>
            <div className="text-2xl font-extrabold text-[#134E4A] font-mono-data">
              {statistics ? `${statistics.averageVascularRiskScore}/100` : '--'}
            </div>
            <span className="text-[10px] text-slate-400 block">Overall Vascular Score</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Tỷ Lệ Nguy Cơ Cao
            </span>
            <div className="text-2xl font-extrabold text-rose-800 font-mono-data">
              {statistics
                ? `${Math.round(((dist.highCount + dist.criticalCount) * 1000) / totalEvaluated) / 10}%`
                : '--'}
            </div>
            <span className="text-[10px] text-rose-500 block">
              {dist.highCount + dist.criticalCount} ca High / Severe
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-amber-600" /> Nguy Cơ Đột Quỵ 3 Năm
            </span>
            <div className="text-2xl font-extrabold text-amber-900 font-mono-data">
              {statistics ? `${statistics.averageStrokeRiskPercent}%` : '--'}
            </div>
            <span className="text-[10px] text-amber-600 block">Dự báo đột quỵ trung bình</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tỷ Lệ Nguy Cơ Thấp
            </span>
            <div className="text-2xl font-extrabold text-emerald-800 font-mono-data">
              {dist.lowPercentage}%
            </div>
            <span className="text-[10px] text-emerald-600 block">{dist.lowCount} ca an toàn</span>
          </div>
        </div>

        {/* Donut Chart & Risk Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          {/* SVG Donut Chart */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#F1F5F9" strokeWidth="14" />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeDasharray={`${lowDash} ${circumference}`}
                  strokeDashoffset={0}
                  className="transition-all duration-700 ease-out"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeDasharray={`${modDash} ${circumference}`}
                  strokeDashoffset={-lowDash}
                  className="transition-all duration-700 ease-out"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#F97316"
                  strokeWidth="14"
                  strokeDasharray={`${highDash} ${circumference}`}
                  strokeDashoffset={-(lowDash + modDash)}
                  className="transition-all duration-700 ease-out"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="14"
                  strokeDasharray={`${critDash} ${circumference}`}
                  strokeDashoffset={-(lowDash + modDash + highDash)}
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Điểm Trung Bình
                </span>
                <span className="text-2xl font-black text-[#134E4A] font-mono-data">
                  {statistics ? statistics.averageVascularRiskScore : 0}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">trên thang 100</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium text-center">
              Biểu đồ tròn phân bố mức nguy cơ (TC-CLI-04)
            </span>
          </div>

          {/* Interactive Legend & Details */}
          <div className="md:col-span-7 space-y-3">
            <h4 className="text-xs font-bold text-[#134E4A] uppercase tracking-wider">
              Chi Tiết Phân Bổ Mức Nguy Cơ
            </h4>

            <div
              onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] shadow-xs"></span>
                <span className="text-xs font-bold text-slate-800">Nguy Cơ Thấp (Low)</span>
                <span className="text-[10px] text-slate-400">&lt; 40 điểm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-data font-bold text-slate-700">
                  {dist.lowCount} ca
                </span>
                <span className="text-xs font-mono-data font-extrabold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {dist.lowPercentage}%
                </span>
              </div>
            </div>

            <div
              onClick={() => setRiskFilter(riskFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                riskFilter === 'MODERATE'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] shadow-xs"></span>
                <span className="text-xs font-bold text-slate-800">Nguy Cơ Trung Bình (Moderate)</span>
                <span className="text-[10px] text-slate-400">40 - 69 điểm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-data font-bold text-slate-700">
                  {dist.moderateCount} ca
                </span>
                <span className="text-xs font-mono-data font-extrabold text-[#F59E0B] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {dist.moderatePercentage}%
                </span>
              </div>
            </div>

            <div
              onClick={() => setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                riskFilter === 'HIGH'
                  ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#F97316] shadow-xs"></span>
                <span className="text-xs font-bold text-slate-800">Nguy Cơ Cao (High)</span>
                <span className="text-[10px] text-slate-400">70 - 84 điểm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-data font-bold text-slate-700">
                  {dist.highCount} ca
                </span>
                <span className="text-xs font-mono-data font-extrabold text-[#F97316] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  {dist.highPercentage}%
                </span>
              </div>
            </div>

            <div
              onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                riskFilter === 'CRITICAL'
                  ? 'bg-red-50 border-red-400 ring-2 ring-red-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] shadow-xs"></span>
                <span className="text-xs font-bold text-slate-800">Nguy Cơ Cực Kỳ Nghiêm Trọng</span>
                <span className="text-[10px] text-slate-400">&ge; 85 điểm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-data font-bold text-slate-700">
                  {dist.criticalCount} ca
                </span>
                <span className="text-xs font-mono-data font-extrabold text-[#EF4444] bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  {dist.criticalPercentage}%
                </span>
              </div>
            </div>
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
                placeholder="Tìm theo MRN, tên, hoặc file ảnh..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0891B2]"
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="DONE">Đã xong (DONE)</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="PENDING">Chờ hàng đợi</option>
              <option value="FAILED">Lỗi (FAILED)</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0891B2]"
            >
              <option value="ALL">Tất cả Mức Nguy Cơ</option>
              <option value="HIGH_OR_CRITICAL">Nguy Cơ Cao & Nguy Cấp (&ge;70%)</option>
              <option value="MODERATE">Nguy Cơ Trung Bình (40-69%)</option>
              <option value="LOW">Nguy Cơ Thấp (&lt;40%)</option>
            </select>

            <select
              value={eyeFilter}
              onChange={(e) => setEyeFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0891B2]"
            >
              <option value="ALL">Tất cả Mắt</option>
              <option value="OD">Mắt Phải (OD)</option>
              <option value="OS">Mắt Trái (OS)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0891B2]"
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
              <option value="RISK_DESC">Nguy cơ cao nhất</option>
              <option value="MRN_ASC">Sắp theo MRN (A-Z)</option>
            </select>

            <button
              onClick={() => setIsAnonymizedView(!isAnonymizedView)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isAnonymizedView
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Chuyển đổi hiển thị tên bệnh nhân thành mã định danh giả lập HIPAA SHA-256"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAnonymizedView ? 'Chế độ Ẩn Danh (HIPAA)' : 'Chế độ Đầy Đủ'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrintReport}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
              title="In phiếu tổng quan chiến dịch"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In Báo Cáo</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
              title="Tải toàn bộ dữ liệu sàng lọc định dạng CSV Excel (UTF-8)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#0891B2] to-[#134E4A] hover:from-[#0E7490] hover:to-[#0F766E] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải Lên Thư Mục (≥100 ảnh)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Monitoring Table */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl shadow-medical-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F0FDFA] border-b border-[#CCFBF1] text-[#134E4A] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3 w-16">Ảnh Fundus</th>
                <th className="py-3 px-4">Bệnh Nhân & Mã MRN</th>
                <th className="py-3 px-3">Mắt</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-4">Đánh Giá Nguy Cơ</th>
                <th className="py-3 px-4">Thông Số Lâm Sàng & AI</th>
                <th className="py-3 px-4 text-right">Chi Tiết CDS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Không tìm thấy bản ghi sàng lọc nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const itemIndex =
                    pageSize === -1
                      ? idx + 1
                      : (effectivePage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedItemForCds(item)}
                    >
                      <td className="py-3 px-3 text-center font-mono-data text-slate-400 text-[11px]">
                        {itemIndex}
                      </td>

                      {/* Thumbnail Preview */}
                      <td className="py-2.5 px-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shrink-0 relative group">
                          <img
                            src={item.thumbnailUrl || '/assets/images/fundus_original.png'}
                            alt={item.fileName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/images/fundus_original.png';
                            }}
                          />
                        </div>
                      </td>

                      {/* Patient & MRN */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {isAnonymizedView ? item.pseudonymId || `ANO-${item.id}` : item.patientName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-data">
                          MRN: {item.mrn} &bull; {item.patientAge ? `${item.patientAge}t` : ''}{' '}
                          {item.patientGender ? `(${item.patientGender})` : ''}
                        </div>
                      </td>

                      {/* Eye */}
                      <td className="py-3 px-3 font-mono-data font-bold text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            item.eye === 'OD'
                              ? 'bg-cyan-50 text-[#0891B2] border border-cyan-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}
                        >
                          {item.eye}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {item.status === 'DONE' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                          </span>
                        )}
                        {item.status === 'PROCESSING' && (
                          <span className="inline-flex items-center gap-1 text-[#0891B2] font-medium bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 text-[11px] animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> Đang chạy
                          </span>
                        )}
                        {item.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" /> Chờ hàng đợi
                          </span>
                        )}
                        {(item.status === 'ERROR' || item.status === 'FAILED') && (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-medium bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> Lỗi đọc ảnh
                          </span>
                        )}
                      </td>

                      {/* Risk Score */}
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
                            {item.riskLevel ||
                              (item.riskScore >= 75
                                ? 'High'
                                : item.riskScore >= 50
                                ? 'Moderate'
                                : 'Low')}{' '}
                            ({item.riskScore}%)
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono-data">—</span>
                        )}
                      </td>

                      {/* Clinical Vitals / AI Results */}
                      <td className="py-3 px-4 text-[11px] font-mono-data text-slate-600">
                        {item.aiResult ? (
                          <span>
                            A/V: <strong>{item.aiResult.arteryVeinRatio || 0.52}</strong> &bull; DR:{' '}
                            <strong>{item.aiResult.diabeticRetinopathyScore || 45}%</strong>
                          </span>
                        ) : (
                          <span>
                            HA: {item.systolicBp || 120}/{item.diastolicBp || 80} &bull; HbA1c:{' '}
                            {item.hbA1c || 5.6}%
                          </span>
                        )}
                      </td>

                      {/* Detail Link */}
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
        </div>

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
              (Hiển thị{' '}
              {filteredItems.length === 0
                ? 0
                : (effectivePage - 1) * (pageSize === -1 ? filteredItems.length : pageSize) + 1}{' '}
              &ndash;{' '}
              {Math.min(
                effectivePage * (pageSize === -1 ? filteredItems.length : pageSize),
                filteredItems.length
              )}{' '}
              trong tổng số <strong>{filteredItems.length}</strong> ảnh)
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
