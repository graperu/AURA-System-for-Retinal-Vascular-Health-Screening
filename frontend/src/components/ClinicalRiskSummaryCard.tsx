import React from 'react';
import { AIRiskResult } from '../types/cds';
import { RiskBadge } from './ui/RiskBadge';
import { Button } from './ui/Button';
import {
  Heart,
  Eye,
  Activity,
  AlertTriangle,
  FileText,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileBadge,
  Sparkles,
  HelpCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

export interface ClinicalRiskSummaryCardProps {
  analysisResult: AIRiskResult;
  onOpenFullReport: () => void;
  onConsultDoctor?: () => void;
}

export const ClinicalRiskSummaryCard: React.FC<ClinicalRiskSummaryCardProps> = ({
  analysisResult,
  onOpenFullReport,
  onConsultDoctor,
}) => {
  const score = Math.round(
    analysisResult.overallVascularRiskScore ?? analysisResult.riskScore ?? 0
  );

  const getComputedRiskLevel = (s: number): 'Low' | 'Moderate' | 'High' | 'Critical' => {
    if (s >= 80) return 'Critical';
    if (s >= 65) return 'High';
    if (s >= 45) return 'Moderate';
    return 'Low';
  };

  const riskLevel = getComputedRiskLevel(score);

  const isDoctorReviewed =
    analysisResult.status === 'REVIEWED' || Boolean(analysisResult.digitalSignature);

  // Biomarkers data - An toàn lâm sàng: Không tự ý fallback số lý tưởng giả mạo
  const map = analysisResult.annotatedMap;
  const rawAvRatio = map?.arteryVeinRatio;
  const rawVesselDensity = map?.vesselDensityPercentage;
  const rawTortuosity = map?.tortuosityIndex;
  const rawVcdr = map?.opticCupToDiscRatio;

  const hasAvRatio = typeof rawAvRatio === 'number' && !Number.isNaN(rawAvRatio);
  const hasVesselDensity = typeof rawVesselDensity === 'number' && !Number.isNaN(rawVesselDensity);
  const hasTortuosity = typeof rawTortuosity === 'number' && !Number.isNaN(rawTortuosity);
  const hasVcdr = typeof rawVcdr === 'number' && !Number.isNaN(rawVcdr);

  const isAvNormal = hasAvRatio ? rawAvRatio >= 0.67 : false;
  const isDensityNormal = hasVesselDensity ? (rawVesselDensity >= 15.5 && rawVesselDensity <= 19.0) : false;
  const isTortuosityNormal = hasTortuosity ? rawTortuosity < 1.25 : false;
  const isVcdrNormal = hasVcdr ? rawVcdr < 0.5 : false;

  // Banner color configuration based on risk level
  const bannerBg =
    riskLevel === 'Critical'
      ? 'from-red-950 via-rose-900 to-red-900 text-white'
      : riskLevel === 'High'
      ? 'from-orange-950 via-amber-900 to-orange-900 text-white'
      : riskLevel === 'Moderate'
      ? 'from-amber-900/90 via-yellow-900/80 to-amber-950 text-white'
      : 'from-[#115E59] via-[#0D9488] to-[#0891B2] text-white';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-medical-card overflow-hidden space-y-6">
      {/* 1. BANNER MỨC ĐỘ NGUY CƠ TỔNG HỢP */}
      <div className={`bg-gradient-to-r ${bannerBg} p-6 sm:p-7 relative overflow-hidden`}>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs uppercase tracking-wider font-extrabold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                Tóm Tắt Nguy Cơ Vi Mạch Lâm Sàng (CDS)
              </span>
              {isDoctorReviewed ? (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 font-bold border border-emerald-400/40 flex items-center gap-1.5 backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Đã Thẩm Định Bởi Bác Sĩ Chuyên Khoa
                </span>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-100 font-bold border border-amber-400/30 flex items-center gap-1.5 backdrop-blur-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-200" />
                  Kết Quả Sơ Bộ AI - Chờ Bác Sĩ Thẩm Định
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Chỉ Số Nguy Cơ Vi Mạch:
              </h2>
              <span className="text-3xl sm:text-4xl font-black font-mono-data">
                {score}
                <span className="text-lg sm:text-xl font-normal opacity-80">/100</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <RiskBadge level={riskLevel} size="lg" className="shadow-xs font-bold" />
              <p className="text-xs text-white/90">
                {riskLevel === 'Low' && 'Hệ vi mạch võng mạc bình thường, nguy cơ tim mạch và đột quỵ thấp.'}
                {riskLevel === 'Moderate' && 'Phát hiện dấu hiệu co thắt nhẹ vi mạch hoặc thay đổi vi tuần hoàn võng mạc.'}
                {riskLevel === 'High' && 'Phát hiện tổn thương vi mạch rõ rệt, cần bác sĩ chuyên khoa khám xác định sớm.'}
                {riskLevel === 'Critical' && 'Nguy cơ biến chứng mạch máu cao, đề nghị chuyển khám chuyên khoa tim mạch / mắt khẩn cấp.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={onOpenFullReport}
              className="bg-white text-slate-900 hover:bg-slate-50 border-white/60 font-bold shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#0891B2]" />
              Xem & In Báo Cáo (PDF/CSV)
            </Button>
            {onConsultDoctor && (
              <Button
                variant="primary"
                size="md"
                onClick={onConsultDoctor}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Trao Đổi Với Bác Sĩ
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* 2. 3 THẺ NGUY CƠ THÀNH PHẦN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Cardiovascular */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <Heart className="w-4 h-4" />
                </div>
                <span>Tim Mạch 3 Năm (CVD)</span>
              </div>
              <RiskBadge
                level={analysisResult.cardiovascularRisk?.level || 'Low'}
                size="sm"
              />
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
              <span className="text-xs text-slate-500">Điểm nguy cơ:</span>
              <span className="text-lg font-black font-mono-data text-slate-900">
                {analysisResult.cardiovascularRisk?.score ?? 0}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Huyết áp võng mạc:</span>
                <strong className="text-slate-800">
                  {analysisResult.cardiovascularRisk?.hypertensionStage || 'Giai đoạn 0 (Bình thường)'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Nguy cơ đột quỵ 3 năm:</span>
                <strong className="text-rose-600 font-mono-data">
                  {analysisResult.cardiovascularRisk?.threeYearStrokeRiskPercent ?? 0}%
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: Diabetic Retinopathy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Eye className="w-4 h-4" />
                </div>
                <span>Võng Mạc ĐTĐ (DR)</span>
              </div>
              <RiskBadge
                level={analysisResult.diabeticRetinopathyRisk?.level || 'Low'}
                size="sm"
              />
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
              <span className="text-xs text-slate-500">Điểm nguy cơ:</span>
              <span className="text-lg font-black font-mono-data text-slate-900">
                {analysisResult.diabeticRetinopathyRisk?.score ?? 0}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Phân độ ETDRS:</span>
                <strong className="text-slate-800 truncate max-w-[150px]" title={analysisResult.diabeticRetinopathyRisk?.etdrsGrade}>
                  {analysisResult.diabeticRetinopathyRisk?.etdrsGrade || 'Không có DR'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Phù hoàng điểm:</span>
                <strong
                  className={
                    analysisResult.diabeticRetinopathyRisk?.macularEdemaPresent
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }
                >
                  {analysisResult.diabeticRetinopathyRisk?.macularEdemaPresent
                    ? 'Có phát hiện'
                    : 'Không phát hiện'}
                </strong>
              </div>
            </div>
          </div>

          {/* Card 3: Glaucoma */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
                  <Activity className="w-4 h-4" />
                </div>
                <span>Thiên Đầu Thống (Glaucoma)</span>
              </div>
              <RiskBadge
                level={analysisResult.glaucomaRisk?.level || 'Low'}
                size="sm"
              />
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
              <span className="text-xs text-slate-500">Điểm nguy cơ:</span>
              <span className="text-lg font-black font-mono-data text-slate-900">
                {analysisResult.glaucomaRisk?.score ?? 0}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Tỷ lệ lõm gai VCDR:</span>
                <strong className="font-mono-data text-slate-800">
                  {hasVcdr ? rawVcdr.toFixed(2) : 'Chưa xác định'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái gai thị:</span>
                {hasVcdr ? (
                  <strong className={isVcdrNormal ? 'text-emerald-700' : 'text-amber-700'}>
                    {isVcdrNormal ? 'Bình thường (< 0.50)' : 'Lõm gai mở rộng (Cần theo dõi)'}
                  </strong>
                ) : (
                  <strong className="text-slate-500">
                    Chưa đo được
                  </strong>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. BẢNG CHỈ SỐ SINH HỌC ĐỊNH LƯỢNG (BIOMARKERS) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0891B2]" />
              Chỉ Số Sinh Học Định Lượng Mạch Máu Võng Mạc (Retinal Biomarkers)
            </h3>
            <span className="text-[11px] text-slate-500">Trích xuất tự động qua AI Multimodal</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Tên Chỉ Số Sinh Học</th>
                  <th className="py-2.5 px-4 text-center">Giá Trị Đo</th>
                  <th className="py-2.5 px-4 text-center">Ngưỡng Tham Chiếu</th>
                  <th className="py-2.5 px-4">Đánh Giá Lâm Sàng</th>
                  <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 1. A/V Ratio */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div>Tỷ lệ Động mạch / Tĩnh mạch (A/V Ratio)</div>
                    <div className="text-[11px] text-slate-400 font-normal">Arteriole-to-Venule Ratio</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono-data font-bold text-slate-900">
                    {hasAvRatio ? (
                      rawAvRatio.toFixed(2)
                    ) : (
                      <span className="text-slate-400 font-normal">Chưa xác định</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-mono-data">
                    ≥ 0.67 (Tỷ lệ 2:3)
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {hasAvRatio
                      ? isAvNormal
                        ? 'Lòng mạch phân nhánh đồng đều, không thấy co thắt.'
                        : 'Hẹp lòng tiểu động mạch, nghi ngờ ảnh hưởng bởi tăng huyết áp.'
                      : 'Chưa đủ dữ liệu để phân tích tỷ lệ động/tĩnh mạch.'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {hasAvRatio ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          isAvNormal
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isAvNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {isAvNormal ? 'Bình thường' : 'Cần lưu ý'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        Chưa đo được
                      </span>
                    )}
                  </td>
                </tr>

                {/* 2. Vessel Density */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div>Mật độ mao mạch võng mạc (Vessel Density)</div>
                    <div className="text-[11px] text-slate-400 font-normal">Retinal Capillary Density</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono-data font-bold text-slate-900">
                    {hasVesselDensity ? (
                      `${rawVesselDensity.toFixed(1)}%`
                    ) : (
                      <span className="text-slate-400 font-normal">Chưa xác định</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-mono-data">
                    15.5% - 19.0%
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {hasVesselDensity
                      ? isDensityNormal
                        ? 'Mạng lưới mao mạch tưới máu đầy đủ.'
                        : rawVesselDensity < 15.5
                        ? 'Giảm tưới máu mao mạch, dấu hiệu thiếu máu cục bộ võng mạc.'
                        : 'Tăng sinh mạch máu bất thường.'
                      : 'Chưa đủ dữ liệu để phân tích mật độ mao mạch võng mạc.'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {hasVesselDensity ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          isDensityNormal
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isDensityNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {isDensityNormal ? 'Bình thường' : 'Bất thường'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        Chưa đo được
                      </span>
                    )}
                  </td>
                </tr>

                {/* 3. Tortuosity Index */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div>Độ uốn lượn vi mạch (Tortuosity Index)</div>
                    <div className="text-[11px] text-slate-400 font-normal">Vascular Curvature Metric</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono-data font-bold text-slate-900">
                    {hasTortuosity ? (
                      rawTortuosity.toFixed(2)
                    ) : (
                      <span className="text-slate-400 font-normal">Chưa xác định</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-mono-data">
                    &lt; 1.25
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {hasTortuosity
                      ? isTortuosityNormal
                        ? 'Đường đi mạch máu đều đặn, không bị xoắn vặn quá mức.'
                        : 'Mạch máu uốn lượn bất thường, phản ánh áp lực thành mạch cao.'
                      : 'Chưa đủ dữ liệu để đo lường độ cong vi mạch võng mạc.'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {hasTortuosity ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          isTortuosityNormal
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isTortuosityNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {isTortuosityNormal ? 'Bình thường' : 'Uốn lượn'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        Chưa đo được
                      </span>
                    )}
                  </td>
                </tr>

                {/* 4. Optic Cup-to-Disc Ratio */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div>Tỷ lệ lõm gai thị VCDR</div>
                    <div className="text-[11px] text-slate-400 font-normal">Vertical Cup-to-Disc Ratio</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono-data font-bold text-slate-900">
                    {hasVcdr ? (
                      rawVcdr.toFixed(2)
                    ) : (
                      <span className="text-slate-400 font-normal">Chưa xác định</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-mono-data">
                    &lt; 0.50 (Chuẩn 0.30 - 0.45)
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {hasVcdr
                      ? isVcdrNormal
                        ? 'Gai thị hồng, viền thần kinh võng mạc đều, không tổn hại.'
                        : 'Lõm gai thị mở rộng, nguy cơ tổn hại sợi thần kinh thị giác (Glaucoma).'
                      : 'Gai thị không nằm trong trường nhìn hoặc chưa định vị rõ bờ gai thị.'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {hasVcdr ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          isVcdrNormal
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isVcdrNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {isVcdrNormal ? 'Bình thường' : 'Nghi ngờ Glaucoma'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        Chưa đo được
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. NHẬN ĐỊNH LÂM SÀNG & KHUYẾN NGHỊ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0891B2]" />
              Nhận Định Lâm Sàng Của AI (Findings)
            </h4>
            <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
              {analysisResult.findings ? (
                <p className="whitespace-pre-line">{analysisResult.findings}</p>
              ) : (
                <p>
                  Chưa phát hiện tổn thương vi phình mạch hoặc xuất huyết võng mạc diện rộng.
                  Cấu trúc vi tuần hoàn hoàng điểm và gai thị tương đối ổn định.
                </p>
              )}
            </div>
            {analysisResult.doctorNotes && (
              <div className="mt-3 pt-3 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                  Ghi chú Bác sĩ phụ trách ({analysisResult.doctorName || 'Bác sĩ chuyên khoa'}):
                </span>
                <p className="text-xs text-slate-600 italic mt-0.5">
                  "{analysisResult.doctorNotes}"
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-teal-50/40 space-y-2">
            <h4 className="text-xs font-bold text-teal-900 flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-teal-700" />
              Khuyến Nghị Y Khoa & Theo Dõi (Recommendations)
            </h4>
            <div className="text-xs text-slate-700 leading-relaxed space-y-1.5">
              {analysisResult.recommendations ? (
                <p className="whitespace-pre-line">{analysisResult.recommendations}</p>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Khám mắt định kỳ 6 - 12 tháng/lần để theo dõi diễn tiến vi mạch đáy mắt.</li>
                  <li>Kiểm soát huyết áp &lt; 130/80 mmHg và đường huyết HbA1c &lt; 7.0%.</li>
                  <li>Duy trì chế độ ăn ít muối, tăng cường rau xanh và tập thể dục đều đặn.</li>
                  <li>Nếu có hiện tượng nhìn mờ đột ngột hoặc ruồi bay, cần đến viện mắt khám ngay.</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 5. MEDICAL DISCLAIMER BẮT BUỘC */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold block mb-0.5">Tuyên bố Miễn trừ Y tế (Medical Safety Disclaimer):</strong>
            <span>
              Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế
              chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.
            </span>
          </div>
        </div>

        {/* 6. NÚT BẤM HÀNH ĐỘNG CUỐI CARD */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="md"
            onClick={onOpenFullReport}
            className="text-xs font-bold gap-2"
          >
            <FileText className="w-4 h-4 text-[#0891B2]" />
            Xem & In Phiếu Báo Cáo Đầy Đủ (PDF/CSV)
          </Button>
          {onConsultDoctor && (
            <Button
              variant="primary"
              size="md"
              onClick={onConsultDoctor}
              className="text-xs font-bold gap-2 bg-[#0891B2] hover:bg-[#0E7490]"
            >
              <MessageSquare className="w-4 h-4" />
              Trao Đổi Với Bác Sĩ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
