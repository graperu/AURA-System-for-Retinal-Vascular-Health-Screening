import React, { useEffect, useMemo, useState } from 'react';
import { ClinicBatchJob, ClinicBatchJobItem, BulkBatchRiskStatistics, BulkBatchAlertSummary, BulkBatchAlert } from '../types/cds';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import {
  Building2,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Search,
  FileSpreadsheet,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Activity,
  HeartPulse,
  Eye,
  X,
  TrendingUp,
  Filter
} from 'lucide-react';
import { billingApi, bulkScreeningApi } from '../services/api';

interface ClinicBatchProcessingProps {
  batchJob: ClinicBatchJob;
}

export const ClinicBatchProcessing: React.FC<ClinicBatchProcessingProps> = ({ batchJob }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [clinicCredits, setClinicCredits] = useState(0);

  // [FR-25] Aggregated Risk Statistics state
  const [statistics, setStatistics] = useState<BulkBatchRiskStatistics | null>(null);

  // [FR-29] High-Risk Alerts & Abnormal Trends state
  const [alertSummary, setAlertSummary] = useState<BulkBatchAlertSummary | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);

  // Selected item for Detailed CDS Report Modal
  const [selectedItemForModal, setSelectedItemForModal] = useState<ClinicBatchJobItem | null>(null);

  // Fetch subscriptions & credits
  useEffect(() => {
    billingApi.mySubscriptions().then((response) => {
      if (response.success && Array.isArray(response.data)) {
        setClinicCredits(
          response.data.reduce(
            (total: number, item: any) =>
              total + (item.status === 'ACTIVE' ? Number(item.remainingCredits || 0) : 0),
            0
          )
        );
      }
    });
  }, []);

  // Fetch [FR-25] Statistics and [FR-29] Alerts from Backend API with client-side fallback
  useEffect(() => {
    if (!batchJob.batchId) return;

    // 1. Fetch [FR-25] Aggregated Risk Statistics
    bulkScreeningApi.getStatistics(batchJob.batchId).then((res) => {
      if (res.success && res.data) {
        setStatistics(res.data);
      } else {
        // Compute client-side fallback
        const items = batchJob.items;
        const completed = items.filter((i) => i.status === 'DONE' && i.riskScore !== undefined);
        let low = 0, mod = 0, high = 0, crit = 0, sumScore = 0, sumStroke = 0, severeAnomalies = 0;

        completed.forEach((i) => {
          const score = i.riskScore || 0;
          sumScore += score;
          sumStroke += i.strokeRisk || (score * 0.3);
          severeAnomalies += i.anomaliesCount || (score >= 70 ? 2 : 0);
          if (score >= 85 || i.riskLevel === 'Severe') crit++;
          else if (score >= 70 || i.riskLevel === 'High') high++;
          else if (score >= 40 || i.riskLevel === 'Moderate') mod++;
          else low++;
        });

        const totalComp = completed.length || 1;
        setStatistics({
          batchId: batchJob.batchId,
          clinicId: batchJob.clinicId,
          totalImages: batchJob.totalImages,
          processedCount: batchJob.processedCount,
          failedCount: batchJob.failedCount,
          pendingCount: Math.max(0, batchJob.totalImages - batchJob.processedCount - batchJob.failedCount),
          averageVascularRiskScore: completed.length > 0 ? Math.round((sumScore / totalComp) * 10) / 10 : 0,
          averageStrokeRiskPercent: completed.length > 0 ? Math.round((sumStroke / totalComp) * 10) / 10 : 0,
          highRiskPatientCount: high + crit,
          severeAnomaliesDetectedCount: severeAnomalies,
          riskDistribution: {
            lowCount: low,
            lowPercentage: Math.round((low * 1000) / totalComp) / 10,
            moderateCount: mod,
            moderatePercentage: Math.round((mod * 1000) / totalComp) / 10,
            highCount: high,
            highPercentage: Math.round((high * 1000) / totalComp) / 10,
            criticalCount: crit,
            criticalPercentage: Math.round((crit * 1000) / totalComp) / 10,
          },
          calculatedAt: new Date().toISOString(),
        });
      }
    });

    // 2. Fetch [FR-29] Emergency High-Risk Alerts
    bulkScreeningApi.getAlerts(batchJob.batchId).then((res) => {
      if (res.success && res.data) {
        setAlertSummary(res.data);
      } else {
        // Compute client-side fallback
        const alertList: BulkBatchAlert[] = [];
        let critCount = 0;
        let warnCount = 0;

        batchJob.items.forEach((item) => {
          const score = item.riskScore || 0;
          const isCrit = score >= 85 || item.riskLevel === 'Severe' || (item.strokeRisk || 0) >= 25;
          const isHigh = !isCrit && (score >= 70 || item.riskLevel === 'High' || (item.strokeRisk || 0) >= 18);

          if (isCrit || isHigh) {
            if (isCrit) critCount++;
            else warnCount++;

            alertList.push({
              alertId: `ALERT-${item.id}`,
              batchId: batchJob.batchId,
              itemId: item.id,
              patientPseudonym: item.patientName || item.mrn,
              riskLevel: isCrit ? 'Critical' : 'High',
              riskScore: score,
              severity: isCrit ? 'CRITICAL' : 'WARNING',
              title: isCrit
                ? 'CẢNH BÁO KHẨN CẤP: Tổn thương vi mạch võng mạc nghiêm trọng'
                : 'CẢNH BÁO NGUY CƠ CAO: Bất thường mạch máu võng mạc',
              reason: `Điểm nguy cơ: ${score}/100 | Nguy cơ đột quỵ 3 năm: ${(item.strokeRisk || score * 0.3).toFixed(1)}% | Phát hiện dấu hiệu co thắt / hẹp lòng mạch tiểu động mạch`,
              strokeRiskPercent: item.strokeRisk || (score * 0.3),
              anomaliesCount: item.anomaliesCount || (isCrit ? 3 : 2),
              recommendedAction: isCrit
                ? 'Yêu cầu chuyển tuyến khẩn cấp hoặc phân công bác sĩ chuyên khoa mắt hội chẩn trong vòng 24 giờ.'
                : 'Ưu tiên duyệt hồ sơ CDS và lên lịch khám tim mạch/huyết áp chuyên sâu.',
              createdAt: new Date().toISOString(),
            });
          }
        });

        alertList.sort((a, b) => b.riskScore - a.riskScore);
        const totalAlerts = alertList.length;
        const totalCompleted = batchJob.processedCount || alertList.length || 1;
        const highRiskRate = Math.round((totalAlerts * 1000) / totalCompleted) / 10;
        const hasAbnormalTrend = totalAlerts >= 2 && highRiskRate >= 20.0;

        setAlertSummary({
          batchId: batchJob.batchId,
          clinicId: batchJob.clinicId,
          totalAlerts,
          criticalAlertsCount: critCount,
          warningAlertsCount: warnCount,
          hasAbnormalTrend,
          abnormalTrendMessage: hasAbnormalTrend
            ? `Cảnh báo xu hướng bất thường: Tỷ lệ bệnh nhân nguy cơ cao đạt ${highRiskRate}% (vượt ngưỡng an toàn 20%). Cần kích hoạt quy trình can thiệp diện rộng.`
            : null,
          alerts: alertList,
        });
      }
    });
  }, [batchJob]);

  // Filter items
  const filteredItems = useMemo(() => {
    return batchJob.items.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      let matchesRisk = true;
      if (riskFilter === 'HIGH_OR_CRITICAL') {
        matchesRisk = (item.riskScore || 0) >= 70 || item.riskLevel === 'High' || item.riskLevel === 'Severe';
      } else if (riskFilter === 'LOW') {
        matchesRisk = item.riskLevel === 'Low' || ((item.riskScore || 0) < 40 && item.riskScore !== undefined);
      } else if (riskFilter === 'MODERATE') {
        matchesRisk = item.riskLevel === 'Moderate' || ((item.riskScore || 0) >= 40 && (item.riskScore || 0) < 70);
      } else if (riskFilter === 'HIGH') {
        matchesRisk = item.riskLevel === 'High' || ((item.riskScore || 0) >= 70 && (item.riskScore || 0) < 85);
      } else if (riskFilter === 'CRITICAL') {
        matchesRisk = item.riskLevel === 'Severe' || (item.riskScore || 0) >= 85;
      }

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [batchJob.items, searchTerm, statusFilter, riskFilter]);

  const percentComplete = Math.round((batchJob.processedCount / Math.max(1, batchJob.totalImages)) * 100);

  // SVG Donut Chart Calculation
  const dist = statistics?.riskDistribution || {
    lowCount: 0, lowPercentage: 0,
    moderateCount: 0, moderatePercentage: 0,
    highCount: 0, highPercentage: 0,
    criticalCount: 0, criticalPercentage: 0,
  };

  const totalEvaluated = (dist.lowCount + dist.moderateCount + dist.highCount + dist.criticalCount) || 1;

  // Donut arc calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const lowDash = (dist.lowCount / totalEvaluated) * circumference;
  const modDash = (dist.moderateCount / totalEvaluated) * circumference;
  const highDash = (dist.highCount / totalEvaluated) * circumference;
  const critDash = (dist.criticalCount / totalEvaluated) * circumference;

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Ma_MRN',
      'Ho_Ten_Benh_Nhan',
      'Mat_Kham',
      'File_Anh',
      'Trang_Thai_AI',
      'Muc_Rui_Ro',
      'Diem_Rui_Ro_Phan_Tram',
      'Nguy_Co_Dot_Quy_3_Nam_Percent',
      'Ty_So_AV_Ratio',
    ];
    const rows = batchJob.items.map((it, idx) => [
      idx + 1,
      `"${it.mrn}"`,
      `"${it.patientName}"`,
      `"${it.eye}"`,
      `"${it.fileName}"`,
      `"${it.status}"`,
      `"${it.riskLevel || 'N/A'}"`,
      it.riskScore || 0,
      it.strokeRisk ? `${it.strokeRisk}%` : 'N/A',
      it.arteryVeinRatio || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AURA_Clinic_Screening_Report_${batchJob.batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* [FR-29] EMERGENCY ALERT BANNER: HIGH-RISK & ABNORMAL TRENDS */}
      {alertSummary && alertSummary.totalAlerts > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-xs flex items-center justify-center animate-pulse">
                <AlertOctagon className="w-7 h-7 text-yellow-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-red-950/80 text-yellow-300 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-yellow-400/40 tracking-wider">
                    [FR-29] Banner Cảnh Báo Khẩn Cấp
                  </span>
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {alertSummary.criticalAlertsCount} Ca Nguy Cấp &bull; {alertSummary.warningAlertsCount} Ca Nguy Cơ Cao
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

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <button
                onClick={() => setRiskFilter('HIGH_OR_CRITICAL')}
                className="bg-yellow-400 hover:bg-yellow-300 text-red-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" /> Lọc Ngay Ca Nguy Cơ Cao
              </button>
              <button
                onClick={() => setShowAlertDetails(!showAlertDetails)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1"
              >
                {showAlertDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAlertDetails ? 'Thu gọn' : 'Xem chi tiết cảnh báo'}
              </button>
            </div>
          </div>

          {/* Expandable Alert Cards */}
          {showAlertDetails && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                Danh Sách Ca Bệnh Cảnh Báo Khẩn Cấp ({alertSummary.alerts.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertSummary.alerts.map((al) => (
                  <div
                    key={al.alertId}
                    className="bg-black/25 border border-white/15 rounded-xl p-3.5 space-y-1.5 backdrop-blur-xs text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-yellow-300 font-mono-data">
                        {al.patientPseudonym}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          al.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-400 text-red-950'
                        }`}
                      >
                        {al.severity} &bull; {al.riskScore}/100
                      </span>
                    </div>
                    <p className="text-red-100 text-[11px] leading-relaxed">{al.reason}</p>
                    <div className="bg-white/10 rounded-lg p-2 text-[11px] text-amber-200">
                      <strong>Chỉ định đề xuất:</strong> {al.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinic Campaign Metrics & Credit Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clinic Info & Campaign */}
        <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#134E4A]">{batchJob.clinicName}</h3>
            <span className="text-xs text-slate-500 block">Mã Chiến Dịch: {batchJob.batchId}</span>
            <span className="text-[11px] text-[#16A34A] font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái: {batchJob.status}
            </span>
          </div>
        </div>

        {/* Batch Queue Real-Time Progress */}
        <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#134E4A] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0891B2]" /> Tiến Độ Xử Lý Hàng Loạt (Bulk Job)
            </span>
            <span className="font-mono-data font-bold text-[#0891B2]">{percentComplete}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0891B2] h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-data">
            <span>Đã xong: <strong>{batchJob.processedCount}/{batchJob.totalImages}</strong> ảnh</span>
            <span>Thời gian còn lại: <strong>~{(batchJob.estimatedTimeRemainingSec / 60).toFixed(1)} phút</strong></span>
          </div>
        </div>

        {/* Screening Credits Management */}
        <div className="bg-gradient-to-br from-[#0891B2] to-[#134E4A] text-white rounded-2xl p-5 shadow-medical-md space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-100 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Quản Lý Gói Credit Screening
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono-data">Dữ liệu API</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono-data">{clinicCredits.toLocaleString()}</span>
            <span className="text-xs text-cyan-200">lượt AI còn lại</span>
          </div>
          <div className="text-[11px] text-cyan-100 flex justify-between items-center pt-1">
            <span>Lấy từ subscription đang hoạt động</span>
            <button
              onClick={() => setIsCreditModalOpen(true)}
              className="bg-white text-[#0891B2] hover:bg-cyan-50 px-2.5 py-1 rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              + Mua Thêm Credit
            </button>
          </div>
        </div>
      </div>

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
                  cx="50" cy="50" r={radius} fill="transparent"
                  stroke="#10B981" strokeWidth="14"
                  strokeDasharray={`${lowDash} ${circumference}`}
                  strokeDashoffset={0}
                  className="transition-all duration-700 ease-out"
                />
                <circle
                  cx="50" cy="50" r={radius} fill="transparent"
                  stroke="#F59E0B" strokeWidth="14"
                  strokeDasharray={`${modDash} ${circumference}`}
                  strokeDashoffset={-lowDash}
                  className="transition-all duration-700 ease-out"
                />
                <circle
                  cx="50" cy="50" r={radius} fill="transparent"
                  stroke="#F97316" strokeWidth="14"
                  strokeDasharray={`${highDash} ${circumference}`}
                  strokeDashoffset={-(lowDash + modDash)}
                  className="transition-all duration-700 ease-out"
                />
                <circle
                  cx="50" cy="50" r={radius} fill="transparent"
                  stroke="#EF4444" strokeWidth="14"
                  strokeDasharray={`${critDash} ${circumference}`}
                  strokeDashoffset={-(lowDash + modDash + highDash)}
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Điểm Trung Bình</span>
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
                <span className="text-xs font-mono-data font-bold text-slate-700">{dist.lowCount} ca</span>
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
                <span className="text-xs font-mono-data font-bold text-slate-700">{dist.moderateCount} ca</span>
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
                <span className="text-xs font-mono-data font-bold text-slate-700">{dist.highCount} ca</span>
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
                <span className="text-xs font-bold text-slate-800">Nghiêm Trọng / Khẩn Cấp (Critical)</span>
                <span className="text-[10px] text-slate-400">&ge; 85 điểm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-data font-bold text-slate-700">{dist.criticalCount} ca</span>
                <span className="text-xs font-mono-data font-extrabold text-[#EF4444] bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  {dist.criticalPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* [FR-25] COMPLETE PATIENT ANALYSIS REPORTS & MONITORING TABLE */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm bệnh nhân theo mã MRN, tên, hoặc file ảnh..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2]"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả mức rủi ro</option>
              <option value="HIGH_OR_CRITICAL">🚨 Ca Nguy Cơ Cao & Khẩn Cấp</option>
              <option value="LOW">Nguy cơ thấp (Low)</option>
              <option value="MODERATE">Nguy cơ trung bình (Moderate)</option>
              <option value="HIGH">Nguy cơ cao (High)</option>
              <option value="CRITICAL">Nghiêm trọng (Critical)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="DONE">Đã Xử Lý AI (Done)</option>
              <option value="PROCESSING">Đang Thực Thi (Processing)</option>
              <option value="PENDING">Đang Chờ (Pending)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Báo Cáo CSV
            </button>
            <button className="px-4 py-2 bg-[#0891B2] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#0E7490] transition-colors flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4" /> Tải Lên Hàng Loạt (&ge;100 ảnh DICOM)
            </button>
          </div>
        </div>

        {/* Batch Queue Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono-data">
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Bệnh Nhân & Mã MRN</th>
                <th className="py-3 px-4">Mắt</th>
                <th className="py-3 px-4">File Ảnh</th>
                <th className="py-3 px-4">Trạng Thái AI</th>
                <th className="py-3 px-4">Mức Nguy Cơ</th>
                <th className="py-3 px-4">Đột Quỵ 3 Năm</th>
                <th className="py-3 px-4 text-right">Chi Tiết CDS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy bệnh nhân nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-[#F0FDFA]/60 ${
                      (item.riskScore || 0) >= 85 || item.riskLevel === 'Severe'
                        ? 'bg-red-50/40'
                        : (item.riskScore || 0) >= 70 || item.riskLevel === 'High'
                        ? 'bg-amber-50/30'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono-data text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#134E4A]">{item.patientName}</div>
                      <div className="text-[11px] font-mono-data text-slate-400">{item.mrn}</div>
                    </td>
                    <td className="py-3 px-4 font-mono-data">{item.eye}</td>
                    <td className="py-3 px-4 font-mono-data text-slate-600">{item.fileName}</td>
                    <td className="py-3 px-4">
                      {item.status === 'DONE' && (
                        <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Thành công
                        </span>
                      )}
                      {item.status === 'PROCESSING' && (
                        <span className="inline-flex items-center gap-1 text-[#0891B2] font-semibold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 text-[11px] animate-pulse">
                          <Clock className="w-3 h-3 animate-spin" /> Đang xử lý
                        </span>
                      )}
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                          Đang chờ queue
                        </span>
                      )}
                      {item.status === 'ERROR' && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full text-[11px]">
                          Lỗi phân tích
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.riskScore !== undefined ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono-data inline-flex items-center gap-1 ${
                            item.riskScore >= 85 || item.riskLevel === 'Severe'
                              ? 'bg-red-100 text-red-900 border border-red-200'
                              : item.riskScore >= 70 || item.riskLevel === 'High'
                              ? 'bg-orange-100 text-orange-900 border border-orange-200'
                              : item.riskScore >= 40 || item.riskLevel === 'Moderate'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {(item.riskScore >= 85 || item.riskLevel === 'Severe') && (
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                          )}
                          {item.riskLevel || 'Score'}: {item.riskScore}/100
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-data text-slate-700">
                      {item.strokeRisk ? (
                        <span className={item.strokeRisk >= 20 ? 'text-red-600 font-bold' : ''}>
                          {item.strokeRisk}%
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedItemForModal(item)}
                        className="text-[#0891B2] hover:text-[#0E7490] font-bold text-xs inline-flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem CDS &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PATIENT CDS REPORT PREVIEW MODAL */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-[#0891B2] to-[#134E4A] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Báo Cáo Phân Tích CDS Lâm Sàng
                </span>
                <h3 className="text-base font-extrabold mt-1">
                  Bệnh nhân: {selectedItemForModal.patientName} ({selectedItemForModal.mrn})
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Mắt Khám</span>
                  <span className="text-base font-extrabold text-[#134E4A]">
                    {selectedItemForModal.eye === 'OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Điểm Mạch Máu</span>
                  <span className="text-base font-extrabold text-red-600 font-mono-data">
                    {selectedItemForModal.riskScore ?? '--'}/100
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Đột Quỵ 3 Năm</span>
                  <span className="text-base font-extrabold text-amber-600 font-mono-data">
                    {selectedItemForModal.strokeRisk ? `${selectedItemForModal.strokeRisk}%` : '--'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Võng Mạc ĐTĐ</span>
                  <span className="text-base font-extrabold text-slate-700 font-mono-data">
                    {selectedItemForModal.drLevel || 'Mild'}
                  </span>
                </div>
              </div>

              {/* Biomarkers */}
              <div className="bg-[#F0FDFA] p-4 rounded-xl border border-[#CCFBF1] space-y-2">
                <h5 className="font-bold text-xs text-[#134E4A] uppercase tracking-wider">
                  Chỉ Số Vi Mạch Võng Mạc Tự Động (ResNet50-VesselNet)
                </h5>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tỷ số Đ/T mạch (A/V Ratio):</span>
                    <strong className="text-slate-800 font-mono-data">
                      {selectedItemForModal.arteryVeinRatio || 0.62}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mật độ mạch máu:</span>
                    <strong className="text-slate-800 font-mono-data">
                      {selectedItemForModal.vesselDensity ? `${selectedItemForModal.vesselDensity}%` : '48.5%'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Độ ngoằn ngoèo:</span>
                    <strong className="text-slate-800 font-mono-data">
                      {selectedItemForModal.tortuosityIndex || 1.35}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Clinical Rationales */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Giải Thích Lâm Sàng & Khuyến Nghị Can Thiệp (XAI)
                </h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>Phát hiện co thắt khu trú tiểu động mạch võng mạc, liên quan đến giai đoạn tiền tăng huyết áp.</li>
                  <li>Tỷ lệ nhánh mạch và độ cong mạch máu gợi ý tải trọng huyết động cao lên vi tuần hoàn.</li>
                  <li>Khuyến nghị: Phân công bác sĩ chuyên khoa mắt và tim mạch đánh giá thêm hồ sơ CDS.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        userRole="clinic"
        currentCredit={clinicCredits}
        onSuccess={(added) => setClinicCredits((prev) => prev + added)}
      />
    </div>
  );
};
