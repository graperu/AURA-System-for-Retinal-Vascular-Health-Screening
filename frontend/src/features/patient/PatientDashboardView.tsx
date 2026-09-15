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
import { useLanguage } from '../../context/LanguageContext';

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
  const { t, isVi } = useLanguage();

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
                  {isVi ? 'Ca Sàng Lọc Gần Nhất' : 'Latest Screening Scan'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {t('patient.results.summaryTitle', isVi ? 'Kết Quả Đánh Giá Vi Mạch Đáy Mắt' : 'Retinal Microvascular Assessment Summary')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {patient.lastExamDate
                    ? `${isVi ? 'Ngày thực hiện' : 'Date performed'}: ${patient.lastExamDate}`
                    : (isVi ? 'Chưa thực hiện ca sàng lọc nào' : 'No screening performed yet')}
                </p>
              </div>

              {latestResult && (
                <div className="flex items-center gap-2">
                  {latestResult.status === 'REVIEWED' ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {isVi ? 'Đã Được Bác Sĩ Duyệt' : 'Doctor Approved'}
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1.5 shadow-2xs animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {isVi ? 'Chờ Bác Sĩ Thẩm Định' : 'Pending Doctor Review'}
                    </span>
                  )}
                  <RiskBadge level={latestResult.cardiovascularRisk.level} size="lg" />
                </div>
              )}
            </div>

            {latestResult ? (
              <div className="space-y-6">
                {/* Notice Banner: Yêu cầu Bác sĩ duyệt theo chuẩn an toàn y tế */}
                {latestResult.status !== 'REVIEWED' ? (
                  <div className="p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-300/90 text-amber-950 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        {isVi ? 'QUY CHUẨN Y TẾ: KẾT QUẢ CẦN ĐƯỢC BÁC SĨ THẨM ĐỊNH & KÝ DUYỆT' : 'CLINICAL NOTICE: RESULT AWAITING DOCTOR VERIFICATION'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-md border border-amber-300">
                        {isVi ? 'Trạng thái: Chờ duyệt' : 'Status: Pending Approval'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      {isVi
                        ? `Ảnh võng mạc của bạn đã được hệ thống AI xử lý và chuyển thẳng đến Bác sĩ chuyên khoa phụ trách (${patient.assignedDoctor || 'Bác sĩ chuyên khoa'}). Để đảm bảo an toàn lâm sàng, kết quả chẩn đoán chính thức và phiếu kết quả y khoa sẽ được gửi đến bạn ngay sau khi Bác sĩ hoàn tất thẩm định và ký duyệt điện tử.`
                        : `Your retinal scan has been processed by AI and submitted to your attending physician (${patient.assignedDoctor || 'Attending Specialist'}). In compliance with SaMD medical standards, the confirmed diagnosis will be available once clinically verified and digitally signed.`}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/95 border-2 border-emerald-300 text-emerald-950 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {isVi ? 'KẾT QUẢ CHÍNH THỨC: ĐÃ ĐƯỢC BÁC SĨ CHUYÊN KHOA THẨM ĐỊNH' : 'OFFICIAL RESULT: CLINICALLY VERIFIED BY SPECIALIST'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-900 bg-emerald-200/90 px-2.5 py-0.5 rounded-md border border-emerald-300">
                        {isVi ? 'Đã ký duyệt' : 'Signed Off'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {latestResult.doctorNotes || latestResult.findings || (isVi ? `Bác sĩ ${patient.assignedDoctor || latestResult.doctorName || 'phụ trách'} đã hoàn tất đánh giá chuyên môn, xác nhận chỉ số vi mạch và ký duyệt kết quả cho ca khám này.` : `Your attending doctor has completed clinical review and verified the retinal vascular biomarkers for this case.`)}
                    </p>
                  </div>
                )}

                {/* 3 Pillars Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> {isVi ? 'Tim mạch' : 'Cardiovascular'}
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
                      <Eye className="w-3.5 h-3.5 text-[#0891B2]" /> {isVi ? 'Võng mạc ĐTĐ' : 'Diabetic Retinopathy'}
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
                      <Activity className="w-3.5 h-3.5 text-amber-500" /> {isVi ? 'Đột quỵ 3 năm' : '3-Year Stroke Risk'}
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 font-mono-data">
                      {latestResult.cardiovascularRisk.threeYearStrokeRiskPercent}%
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium block truncate">
                      {isVi ? 'Ước tính mô hình' : 'Model estimate'}
                    </span>
                  </div>
                </div>

                {/* Doctor Assessment Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      {t('patient.chat.assignedDoctor', isVi ? 'Bác sĩ phụ trách' : 'Assigned doctor')}: {patient.assignedDoctor || latestResult.doctorName || (isVi ? 'Đang chờ phân công bác sĩ' : 'Awaiting doctor assignment')}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${latestResult.status === 'REVIEWED' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-amber-800 bg-amber-50 border-amber-200'}`}>
                      {latestResult.status === 'REVIEWED' ? (isVi ? 'Đã thẩm định bởi BS' : 'Doctor Reviewed') : (isVi ? 'Chờ bác sĩ duyệt' : 'Pending Doctor Review')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {latestResult.doctorNotes || latestResult.findings || (latestResult.status === 'REVIEWED' ? (isVi ? 'Chỉ số vi mạch võng mạc đã được bác sĩ chuyên khoa thẩm định và xác nhận.' : 'Retinal microvascular biomarkers verified.') : (isVi ? 'Ảnh đã gửi đến Bác sĩ phụ trách. Kết quả chẩn đoán chính thức sẽ được cập nhật tại đây khi hoàn tất ký duyệt.' : 'Awaiting doctor verification.'))}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-50 text-[#0891B2] flex items-center justify-center mx-auto border border-cyan-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">{isVi ? 'Chưa có kết quả khám sàng lọc' : 'No screening results yet'}</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {isVi
                      ? 'Bạn chưa thực hiện ca sàng lọc nào. Vui lòng bấm "Phân tích ảnh mới" bên dưới để tải ảnh chụp đáy mắt và nhận đánh giá nguy cơ vi mạch ban đầu từ AI.'
                      : 'You have not performed any screenings yet. Please click "Upload new scan" below to upload fundus images and receive initial microvascular risk assessment from AI.'}
                  </p>
                </div>
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
                {t('patient.dashboard.quickActions.uploadScan', isVi ? 'Phân tích ảnh mới' : 'Upload new scan')}
              </Button>

              {latestResult && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => onNavigate('cds-viewer')}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    {isVi ? 'Xem XAI & Grad-CAM' : 'View XAI & Grad-CAM'}
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={onOpenReportModal}
                    icon={<FileText className="w-4 h-4" />}
                  >
                    {t('patient.results.print', isVi ? 'Phiếu khám PDF' : 'Print report')}
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
                {t('patient.credit.currentQuota', isVi ? 'Hạn Mức Sàng Lọc' : 'Screening Credits')}
              </span>
              <span className="text-lg font-extrabold font-mono-data text-[#0891B2]">
                {userCredits} {isVi ? 'lượt' : 'credits'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isVi
                ? 'Mỗi lượt cho phép phân tích toàn diện 2 mắt (OD/OS) kèm báo cáo Grad-CAM.'
                : 'Each credit allows comprehensive bilateral (OD/OS) analysis with Grad-CAM report.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={onOpenCreditModal}
            >
              {t('patient.credit.buyNow', isVi ? 'Nạp thêm lượt khám' : 'Buy now')}
            </Button>
          </Card>

          {/* Consultation Shortcut Card */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{t('patient.chat.assignedDoctor', isVi ? 'Bác Sĩ Tư Vấn' : 'Assigned doctor')}</h4>
                <p className="text-[11px] text-slate-500">
                  {patient.assignedDoctor || (isVi ? 'Đang chờ phân công bác sĩ' : 'Awaiting doctor assignment')}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              {isVi
                ? 'Kênh trao đổi chuyên môn trực tuyến để giải đáp các chỉ số và phác đồ điều trị.'
                : 'Online clinical consultation channel for biomarker inquiries and care guidance.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onOpenChatModal}
            >
              {t('patient.dashboard.quickActions.doctorChat', isVi ? 'Mở phòng chat tư vấn' : 'Chat with doctor')}
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
              {t('patient.dashboard.quickActions.uploadScan', isVi ? 'Tải Ảnh Khám Mới' : 'Upload new scan')}
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isVi
                ? 'Tải lên ảnh chụp đáy mắt (Fundus hoặc OCT) để nhận diện vi tổn thương mạch máu.'
                : 'Upload retinal images (Fundus or OCT) to detect microvascular lesions.'}
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
              {isVi ? 'Xem Bản Đồ Nhiệt Grad-CAM' : 'View Grad-CAM Heatmap'}
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isVi
                ? 'Trực quan hóa vùng chú ý của mạng nơ-ron AI trên vi mạch mắt.'
                : 'Visualize neural network attention regions on retinal microvasculature.'}
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
              {t('patient.dashboard.quickActions.doctorChat', isVi ? 'Tư Vấn Với Bác Sĩ' : 'Chat with doctor')}
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isVi
                ? 'Trao đổi chuyên môn trực tiếp với Bác sĩ phụ trách về các khuyến nghị sức khỏe.'
                : 'Directly consult with assigned physician regarding clinical recommendations.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
