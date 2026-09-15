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
  Stethoscope,
  CalendarCheck,
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
  onOpenRegisterModal?: () => void;
}

const formatDoctorName = (doc: any, fallback: string = ''): string => {
  if (!doc) return fallback;
  if (typeof doc === 'string') return doc;
  if (typeof doc === 'object') {
    return doc.fullName || doc.name || doc.assignedDoctor || fallback;
  }
  return String(doc);
};

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  patient,
  latestResult,
  userCredits,
  onNavigate,
  onOpenCreditModal,
  onOpenChatModal,
  onOpenReportModal,
  onOpenRegisterModal,
}) => {
  const { t, isVi } = useLanguage();
  const assignedDoctorName = formatDoctorName(patient?.assignedDoctor);

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
                  {isVi ? 'Ca Sàng Lọc Gần Nhất' : 'Latest Screening'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {t('patient.results.summaryTitle', isVi ? 'Tổng hợp kết quả đánh giá vi mạch đáy mắt' : 'Retinal Assessment')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {patient.lastExamDate
                    ? `${isVi ? 'Ngày khám' : 'Date'}: ${patient.lastExamDate}`
                    : (isVi ? 'Chưa có lần khám' : 'No screenings yet')}
                </p>
              </div>

              {latestResult && (
                <div className="flex items-center gap-2">
                  {latestResult.status === 'REVIEWED' ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {isVi ? 'Đã duyệt' : 'Approved'}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1.5 shadow-2xs animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {isVi ? 'Chờ duyệt' : 'Pending'}
                    </span>
                  )}
                  <RiskBadge level={latestResult.cardiovascularRisk.level} size="md" />
                </div>
              )}
            </div>

            {latestResult ? (
              <div className="space-y-4">
                {/* Notice Banner: Rút gọn súc tích */}
                {latestResult.status !== 'REVIEWED' ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span className="truncate">
                        {isVi
                          ? `Đang chờ Bác sĩ ${assignedDoctorName || 'phụ trách'} xem và ký duyệt.`
                          : `Awaiting verification by Dr. ${assignedDoctorName || 'Specialist'}.`}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md shrink-0">
                      {isVi ? 'Chờ duyệt' : 'Pending'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {latestResult.doctorNotes || (isVi ? `Bác sĩ ${assignedDoctorName || latestResult.doctorName || 'phụ trách'} đã ký duyệt.` : `Reviewed and signed by doctor.`)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-900 bg-emerald-200/90 px-2 py-0.5 rounded-md shrink-0">
                      {isVi ? 'Đã duyệt' : 'Signed'}
                    </span>
                  </div>
                )}

                {/* 3 Pillars Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-600" /> {isVi ? 'Tim mạch' : 'Cardiovascular'}
                    </span>
                    <div className="text-xl font-extrabold text-black font-mono-data">
                      {latestResult.cardiovascularRisk.score}%
                    </div>
                    <span className="text-xs font-bold text-black block truncate">
                      {latestResult.cardiovascularRisk.hypertensionStage}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#0891B2]" /> {isVi ? 'Võng mạc ĐTĐ' : 'Diabetic Retinopathy'}
                    </span>
                    <div className="text-xl font-extrabold text-black font-mono-data">
                      {latestResult.diabeticRetinopathyRisk.score}%
                    </div>
                    <span className="text-xs font-bold text-black block truncate">
                      {latestResult.diabeticRetinopathyRisk.etdrsGrade}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-amber-600" /> {isVi ? 'Dự báo đột quỵ' : '3-Year Stroke'}
                    </span>
                    <div className="text-xl font-extrabold text-black font-mono-data">
                      {latestResult.cardiovascularRisk.threeYearStrokeRiskPercent}%
                    </div>
                    <span className="text-xs font-bold text-black block truncate">
                      {isVi ? 'Ước tính 3 năm' : '3-year estimate'}
                    </span>
                  </div>
                </div>

                {/* Doctor Assessment Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <span className="text-sm font-bold text-black flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>{isVi ? 'Bác sĩ phụ trách' : 'Attending Doctor'}: <strong className="text-black font-extrabold">{assignedDoctorName || latestResult.doctorName || (isVi ? 'Chưa có' : 'Unassigned')}</strong></span>
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${latestResult.status === 'REVIEWED' ? 'text-emerald-950 bg-emerald-100 border-emerald-300' : 'text-amber-950 bg-amber-100 border-amber-300'}`}>
                      {latestResult.status === 'REVIEWED' ? (isVi ? 'Đã duyệt' : 'Reviewed') : (isVi ? 'Chờ duyệt' : 'Pending')}
                    </span>
                  </div>

                  {(() => {
                    const rawNotes = latestResult.doctorNotes || latestResult.findings || (latestResult.status === 'REVIEWED' ? (isVi ? 'Chỉ số mạch máu mắt đã được bác sĩ xác nhận.' : 'Biomarkers verified.') : (isVi ? 'Bác sĩ sẽ cập nhật nhận định sau khi xem ảnh.' : 'Diagnosis will be updated once signed.'));

                    const points = (rawNotes.includes('•') ? rawNotes.split('•') : rawNotes.split('\n'))
                      .map((p) => p.trim())
                      .filter(Boolean);

                    if (points.length > 1) {
                      return (
                        <div className="space-y-2.5 pt-1">
                          {points.map((pt, idx) => {
                            const colonIdx = pt.indexOf(':');
                            const hasPrefix = colonIdx > 0 && colonIdx < 40;
                            const prefix = hasPrefix ? pt.substring(0, colonIdx + 1) : '';
                            const content = hasPrefix ? pt.substring(colonIdx + 1).trim() : pt;
                            return (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-black">
                                <div className="w-2.5 h-2.5 rounded-full bg-teal-700 mt-1.5 shrink-0" />
                                <div className="text-sm sm:text-base leading-relaxed text-black font-medium">
                                  {hasPrefix && <strong className="font-bold text-black mr-1">{prefix}</strong>}
                                  <span>{content}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <p className="text-sm sm:text-base text-black font-medium leading-relaxed whitespace-pre-line p-1">
                        {rawNotes}
                      </p>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-cyan-50 text-[#0891B2] flex items-center justify-center mx-auto border border-cyan-100">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800">{isVi ? 'Chưa có kết quả' : 'No screening results'}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isVi ? 'Tải ảnh chụp mắt để AI phân tích sức khỏe mạch máu.' : 'Upload fundus scan to receive AI assessment.'}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {onOpenRegisterModal && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenRegisterModal}
                    icon={<Stethoscope className="w-4 h-4" />}
                  >
                    {isVi ? 'Đăng ký khám' : 'Register exam'}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('upload-scan')}
                  icon={<UploadCloud className="w-4 h-4" />}
                >
                  {isVi ? 'Tải ảnh khám' : 'Upload scan'}
                </Button>
              </div>

              {latestResult && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('cds-viewer')}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    {isVi ? 'Bản đồ nhiệt AI' : 'Heatmap'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenReportModal}
                    icon={<FileText className="w-4 h-4" />}
                  >
                    {isVi ? 'In kết quả' : 'Print report'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 35% (4 cols): Care, Credits & Doctor Consultation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Registration Card */}
          <Card padding="md" className="space-y-3 bg-gradient-to-br from-cyan-50/50 via-white to-teal-50/40 border-teal-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-700" />
                {isVi ? 'Bác Sĩ Phụ Trách' : 'Attending Doctor'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800">
                {assignedDoctorName ? (isVi ? 'Đã có BS' : 'Assigned') : (isVi ? 'Chưa đăng ký' : 'Unassigned')}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {isVi
                ? 'Gửi ảnh mắt cho bác sĩ chuyên khoa để nhận kết luận chính thức.'
                : 'Submit fundus records to your specialist for evaluation.'}
            </p>
            {onOpenRegisterModal && (
              <Button
                variant="primary"
                size="sm"
                className="w-full shadow-xs"
                onClick={onOpenRegisterModal}
                icon={<CalendarCheck className="w-3.5 h-3.5" />}
              >
                {assignedDoctorName ? (isVi ? 'Đổi Bác sĩ' : 'Change doctor') : (isVi ? 'Chọn Bác sĩ' : 'Select doctor')}
              </Button>
            )}
          </Card>

          {/* Credits Summary Card */}
          <Card padding="md" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                {isVi ? 'Lượt Khám Còn Lại' : 'Screening Credits'}
              </span>
              <span className="text-lg font-extrabold font-mono-data text-[#0891B2]">
                {userCredits} {isVi ? 'lượt' : 'credits'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isVi ? 'Dùng để phân tích ảnh mắt mới.' : 'Used for analyzing new scans.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={onOpenCreditModal}
            >
              {isVi ? 'Mua thêm lượt' : 'Buy credits'}
            </Button>
          </Card>

          {/* Consultation Shortcut Card */}
          <Card padding="md" className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900">{isVi ? 'Nhắn Tin Bác Sĩ' : 'Chat With Doctor'}</h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {assignedDoctorName || (isVi ? 'Chưa có bác sĩ' : 'Unassigned')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onOpenChatModal}
            >
              {isVi ? 'Gửi tin nhắn' : 'Send message'}
            </Button>
          </Card>
        </div>
      </div>

      {/* 2. Three Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={onOpenRegisterModal || (() => onNavigate('upload-scan'))}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#0891B2] hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
              {isVi ? 'Chọn Bác Sĩ' : 'Select Doctor'}
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVi ? 'Chọn bác sĩ tư vấn và nhập thông tin sức khỏe.' : 'Select doctor and enter health info.'}
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('upload-scan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#0891B2] hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0891B2] flex items-center justify-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
              {isVi ? 'Tải Ảnh Mắt' : 'Upload Scan'}
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVi ? 'Tải ảnh đáy mắt để AI phân tích nhanh.' : 'Upload eye scan for fast AI analysis.'}
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('cds-viewer')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#0891B2] hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
              {isVi ? 'Bản Đồ Nhiệt AI' : 'AI Heatmap'}
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVi ? 'Xem vùng nghi ngờ tổn thương trên ảnh mắt.' : 'View lesion suspicion areas on retinal scan.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
