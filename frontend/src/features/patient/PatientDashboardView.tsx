import React from 'react';
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
} from 'lucide-react';
import { AIRiskResult, PatientProfile } from '../../types/cds';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';

export interface PatientDashboardViewProps {
  patient: PatientProfile;
  latestResult: AIRiskResult | null;
  userCredits: number;
  onNavigate: (view: string) => void;
  onOpenCreditModal: () => void;
  onOpenChatModal: () => void;
  onOpenReportModal: () => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  patient,
  latestResult,
  userCredits,
  onNavigate,
  onOpenCreditModal,
  onOpenChatModal,
  onOpenReportModal,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Primary Clinical Grid: 65% Main Screening Status + 35% Care & Account Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 65% (8 cols): Latest Screening Focus Card */}
        <div className="lg:col-span-8">
          <Card padding="lg" className="h-full flex flex-col justify-between space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider block">
                  Ca Sàng Lọc Gần Nhất
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Kết Quả Đánh Giá Vi Mạch Đáy Mắt
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {patient.lastExamDate
                    ? `Ngày thực hiện: ${patient.lastExamDate}`
                    : 'Chưa thực hiện ca sàng lọc nào'}
                </p>
              </div>

              {latestResult && (
                <RiskBadge level={latestResult.cardiovascularRisk.level} size="lg" />
              )}
            </div>

            {latestResult ? (
              <div className="space-y-6">
                {/* 3 Pillars Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Tim mạch
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 font-mono-data">
                      {latestResult.cardiovascularRisk.score}%
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium block truncate">
                      {latestResult.cardiovascularRisk.hypertensionStage}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#0891B2]" /> Võng mạc ĐTĐ
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 font-mono-data">
                      {latestResult.diabeticRetinopathyRisk.score}%
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium block truncate">
                      {latestResult.diabeticRetinopathyRisk.etdrsGrade}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-amber-500" /> Đột quỵ 3 năm
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 font-mono-data">
                      {latestResult.cardiovascularRisk.threeYearStrokeRiskPercent}%
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium block truncate">
                      Ước tính mô hình
                    </span>
                  </div>
                </div>

                {/* Doctor Assessment Box */}
                <div className="p-4 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#134E4A] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      Bác sĩ phụ trách: {patient.assignedDoctor || 'BS. CKII Nguyễn Thị Thanh'}
                    </span>
                    <span className="text-[11px] font-semibold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-[#CCFBF1]">
                      Đã thẩm định
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Chỉ số vi mạch võng mạc ổn định. Bạn có thể trao đổi trực tiếp với bác sĩ để nhận tư vấn chi tiết.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <div className="w-11 h-11 rounded-full bg-cyan-50 text-[#0891B2] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Chưa có kết quả khám</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tải lên ảnh chụp đáy mắt để bắt đầu đánh giá nguy cơ tim mạch và thị lực.
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('upload-scan')}
                icon={<UploadCloud className="w-4 h-4" />}
              >
                Phân tích ảnh mới
              </Button>

              {latestResult && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => onNavigate('cds-viewer')}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    Xem XAI & Grad-CAM
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={onOpenReportModal}
                    icon={<FileText className="w-4 h-4" />}
                  >
                    Phiếu khám PDF
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 35% (4 cols): Care, Credits & Doctor Consultation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Credits Summary Card */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Hạn Mức Sàng Lọc
              </span>
              <span className="text-lg font-extrabold font-mono-data text-[#0891B2]">
                {userCredits} lượt
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mỗi lượt cho phép phân tích toàn diện 2 mắt (OD/OS) kèm báo cáo Grad-CAM.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={onOpenCreditModal}
            >
              Nạp thêm lượt khám
            </Button>
          </Card>

          {/* Consultation Shortcut Card */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Bác Sĩ Tư Vấn</h4>
                <p className="text-[11px] text-slate-500">
                  {patient.assignedDoctor || 'BS. CKII Nguyễn Thị Thanh'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              Kênh trao đổi chuyên môn trực tuyến để giải đáp các chỉ số và phác đồ điều trị.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onOpenChatModal}
            >
              Mở phòng chat tư vấn
            </Button>
          </Card>
        </div>
      </div>

      {/* 2. Three Clinical Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('upload-scan')}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-medical-card hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] text-[#0891B2] flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
              Tải Ảnh Khám Mới
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tải lên ảnh chụp đáy mắt (Fundus hoặc OCT) để nhận diện vi tổn thương mạch máu.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('cds-viewer')}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-medical-card hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
              Xem Bản Đồ Nhiệt Grad-CAM
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Trực quan hóa vùng chú ý của mạng nơ-ron AI trên vi mạch mắt.
            </p>
          </div>
        </div>

        <div
          onClick={onOpenChatModal}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-medical-card hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
              Tư Vấn Với Bác Sĩ
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Trao đổi chuyên môn trực tiếp với Bác sĩ phụ trách về các khuyến nghị sức khỏe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
