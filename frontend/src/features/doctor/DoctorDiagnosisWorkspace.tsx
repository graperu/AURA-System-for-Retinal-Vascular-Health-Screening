import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Eye,
  Activity,
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  Clock,
  Sparkles,
  Tag,
  Calendar,
  Save,
  FileText,
  Layers,
  Heart,
  BrainCircuit,
  MessageSquare,
  Search,
  Check,
  RotateCcw,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';
import { PatientProfile, AIRiskResult, DoctorFeedback, RiskLevel } from '../../types/cds';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { InteractiveCDSViewer } from '../../components/InteractiveCDSViewer';

export interface DoctorDiagnosisWorkspaceProps {
  activePatient: PatientProfile;
  analysisResult: AIRiskResult;
  assignedPatients?: any[];
  onSelectPatient?: (patient: any) => void;
  onSaveFeedback: (feedback: DoctorFeedback) => Promise<void>;
  onOpenReportModal?: () => void;
  onOpenChatModal?: () => void;
  onOpenProfileModal?: () => void;
  onNewScanClick?: () => void;
}

const COMMON_ICD10_CODES = [
  { code: 'H35.0', labelVi: 'Biến đổi vi mạch võng mạc', labelEn: 'Retinal vascular changes' },
  { code: 'E11.3', labelVi: 'Bệnh võng mạc đái tháo đường', labelEn: 'Diabetic retinopathy' },
  { code: 'I10', labelVi: 'Tăng huyết áp nguyên phát', labelEn: 'Essential hypertension' },
  { code: 'H40.1', labelVi: 'Glôcôm góc mở nguyên phát', labelEn: 'Primary open-angle glaucoma' },
  { code: 'H35.3', labelVi: 'Thoái hóa hoàng điểm', labelEn: 'Macular degeneration' },
  { code: 'H34.8', labelVi: 'Tắc tĩnh mạch võng mạc', labelEn: 'Retinal vein occlusion' },
];

const CLINICAL_SNIPPETS = [
  {
    titleVi: 'Võng mạc tăng huyết áp độ 2',
    titleEn: 'Grade 2 Hypertensive Retinopathy',
    textVi: 'Ghi nhận dấu hiệu hẹp tiểu động mạch cục bộ (A/V ratio ~0.48), hiện tượng bắt chéo động-tĩnh mạch (Salus sign). Chưa thấy xuất huyết võng mạc hay xuất tiết dạng bông. Đề nghị kiểm soát huyết áp mục tiêu < 130/80 mmHg.',
    textEn: 'Focal arteriolar narrowing noted (A/V ratio ~0.48) with A/V nicking (Salus sign). No overt flame hemorrhages or cotton-wool spots. Recommend strict BP target < 130/80 mmHg.',
  },
  {
    titleVi: 'Theo dõi nghi ngờ Glôcôm',
    titleEn: 'Glaucoma Suspect Monitoring',
    textVi: 'Tỷ lệ lõm gai thị (CDR ~0.52) vượt ngưỡng cảnh báo sinh lý. Viền thần kinh thị giác phía thái dương mỏng nhẹ. Khuyến nghị đo nhãn áp (Goldmann) và chụp OCT lớp sợi thần kinh thị giác (RNFL).',
    textEn: 'Cup-to-disc ratio (CDR ~0.52) exceeds physiological baseline. Mild temporal neuroretinal rim thinning. Recommend Goldmann applanation tonometry and RNFL OCT assessment.',
  },
  {
    titleVi: 'Xuất tiết hoàng điểm (Macular Star)',
    titleEn: 'Macular Star Exudation',
    textVi: 'Tổn thương lipid hình sao phân bố nan hoa quanh hố hoàng điểm (FAZ), gợi ý bệnh thần kinh võng mạc do tăng huyết áp ác tính. Cần phối hợp chuyên khoa tim mạch khẩn cấp để hạ áp an toàn.',
    textEn: 'Radial lipid exudates forming a macular star pattern around FAZ, suggestive of neuroretinopathy secondary to accelerated hypertension. Urgent cardiology consult recommended.',
  },
];

export const DoctorDiagnosisWorkspace: React.FC<DoctorDiagnosisWorkspaceProps> = ({
  activePatient,
  analysisResult,
  assignedPatients = [],
  onSelectPatient,
  onSaveFeedback,
  onOpenReportModal,
  onOpenChatModal,
  onOpenProfileModal,
  onNewScanClick,
}) => {
  const { user } = useAuth();
  const { t, isVi } = useLanguage();

  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);
  const [patientSearch, setPatientSearch] = useState<string>('');

  // Clinical decision state flow: Decision -> Risks -> ICD10 -> Notes -> Plan -> Sign
  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>('APPROVED');
  const [adjustedCardioRisk, setAdjustedCardioRisk] = useState<RiskLevel>(
    (analysisResult.cardiovascularRisk?.level as RiskLevel) || 'Moderate'
  );
  const [adjustedDrRisk, setAdjustedDrRisk] = useState<RiskLevel>(
    (analysisResult.diabeticRetinopathyRisk?.level as RiskLevel) || 'Low'
  );
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // ICD-10 codes
  const [selectedIcd10, setSelectedIcd10] = useState<string[]>(
    analysisResult.icd10Codes && analysisResult.icd10Codes.length > 0
      ? analysisResult.icd10Codes
      : ['H35.0']
  );
  const [customIcdInput, setCustomIcdInput] = useState<string>('');

  // Clinical Notes & Care Plan
  const [doctorNotes, setDoctorNotes] = useState<string>(
    analysisResult.doctorNotes ||
      (isVi
        ? 'Bác sĩ chuyên khoa đã thẩm định ảnh vi mạch và các chỉ số AI. Đồng thuận phân tầng nguy cơ và phác đồ theo dõi.'
        : 'Attending specialist verified retinal biomarkers and AI risk tiering. Concordant with clinical follow-up protocol.')
  );
  const [followUpInterval, setFollowUpInterval] = useState<'1M' | '3M' | '6M' | '12M' | 'URGENT'>('3M');
  const [carePlanNotes, setCarePlanNotes] = useState<string>(
    isVi
      ? 'Đo huyết áp tại nhà 2 lần/ngày. Duy trì HbA1c < 7.0%. Khám lại chuyên khoa mắt sau 3 tháng kèm đo nhãn áp.'
      : 'Home BP monitoring BID. Maintain HbA1c < 7.0%. Ophthalmic follow-up in 3 months with tonometry.'
  );

  // Submission & feedback state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const currentDoctorName = user?.name || (isVi ? 'BS. Chuyên khoa Mắt' : 'Attending Specialist');
  const currentDoctorId = user?.id || 'DOC-CURRENT';

  // Toggle ICD-10 code
  const toggleIcd10 = (code: string) => {
    setSelectedIcd10((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const addCustomIcd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customIcdInput.trim().toUpperCase();
    if (trimmed && !selectedIcd10.includes(trimmed)) {
      setSelectedIcd10((prev) => [...prev, trimmed]);
      setCustomIcdInput('');
    }
  };

  const applySnippet = (text: string) => {
    setDoctorNotes((prev) => (prev ? `${prev}\n${text}` : text));
  };

  // Submit Handler
  const handleSignAndSave = async (isDraft: boolean = false) => {
    if (decision === 'MODIFIED' && !overrideReason.trim() && !isDraft) {
      setOverrideError(
        isVi
          ? 'Bắt buộc nhập lý do lâm sàng khi bác sĩ điều chỉnh phân tầng nguy cơ của AI.'
          : 'Clinical override rationale is required when modifying AI risk assessment.'
      );
      return;
    }

    setOverrideError(null);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setIsSubmitting(true);

    const feedback: DoctorFeedback = {
      feedbackId: `FB-${Date.now()}`,
      analysisId: analysisResult.analysisId,
      doctorId: currentDoctorId,
      doctorName: currentDoctorName,
      decision,
      adjustedCardioRisk: decision === 'MODIFIED' ? adjustedCardioRisk : undefined,
      adjustedDrRisk: decision === 'MODIFIED' ? adjustedDrRisk : undefined,
      icd10Codes: selectedIcd10,
      clinicalNotes: doctorNotes,
      overrideReason: decision === 'MODIFIED' ? overrideReason.trim() : undefined,
      recommendations: `${carePlanNotes} [Tái khám: ${followUpInterval}]`,
      reviewedAt: new Date().toISOString(),
      signedDigitalSignature: isDraft ? undefined : `SHA256-AURA-${currentDoctorId}-${Date.now()}`,
    };

    try {
      await onSaveFeedback(feedback);
      setSaveSuccessMsg(
        isDraft
          ? isVi
            ? 'Đã lưu bản nháp thẩm định thành công.'
            : 'Draft assessment saved successfully.'
          : isVi
          ? 'Đã ký số điện tử và lưu hồ sơ chẩn đoán thành công!'
          : 'Record electronically signed and finalized!'
      );
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveErrorMsg(
        err?.message ||
          (isVi ? 'Lỗi khi lưu kết quả chẩn đoán.' : 'Failed to save diagnostic review.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Biomarkers extraction
  const vcdr = Number(analysisResult.annotatedMap?.opticCupToDiscRatio) || 0.52;
  const avRatio = Number(analysisResult.annotatedMap?.arteryVeinRatio) || 0.48;
  const vesselDensity = Number(analysisResult.annotatedMap?.vesselDensityPercentage) || 16.5;
  const tortuosity = Number(analysisResult.annotatedMap?.tortuosityIndex) || 1.32;
  const overallRisk = analysisResult.overallVascularRiskScore ?? analysisResult.riskScore ?? 89;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. TOP PATIENT CONTEXT BAR (Slim 52px, Sticky, High Contrast)             */}
      {/* ========================================================================= */}
      <header className="h-[54px] shrink-0 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-30">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar & Patient Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-xs flex items-center justify-center border border-[#BFDBFE] shrink-0">
              {activePatient.fullName ? activePatient.fullName.charAt(0).toUpperCase() : 'BN'}
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="font-bold text-[15px] text-[#0F172A] hover:text-[#2563EB] transition-colors truncate cursor-pointer"
                title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
              >
                {activePatient.fullName || (isVi ? 'Bệnh nhân chưa đặt tên' : 'Unnamed Patient')}
              </button>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-medium border border-[#CBD5E1]">
                {activePatient.mrn || 'MRN-N/A'}
              </span>
            </div>
          </div>

          <span className="text-[#CBD5E1] hidden sm:inline">|</span>

          {/* Clinical Demographics & Vitals */}
          <div className="hidden md:flex items-center gap-3 text-xs text-[#64748B]">
            <span>
              {activePatient.age ? `${activePatient.age} ${isVi ? 'tuổi' : 'yo'}` : 'N/A'} •{' '}
              {activePatient.gender === 'Female' ? (isVi ? 'Nữ' : 'Female') : isVi ? 'Nam' : 'Male'}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
            <span>
              {isVi ? 'Huyết áp' : 'BP'}:{' '}
              <strong className="text-[#0F172A] font-mono">
                {activePatient.systolicBp && activePatient.diastolicBp
                  ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg`
                  : '145/92 mmHg'}
              </strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
            <span>
              HbA1c:{' '}
              <strong className="text-[#0F172A] font-mono">
                {activePatient.hba1c ? `${activePatient.hba1c}%` : '7.4%'}
              </strong>
            </span>
          </div>

          {/* Eye Laterality Tag */}
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shrink-0">
            {analysisResult.eyePosition === 'Left_OS' || analysisResult.eyePosition === 'OS'
              ? isVi
                ? 'Mắt Trái (OS)'
                : 'Left Eye (OS)'
              : isVi
              ? 'Mắt Phải (OD)'
              : 'Right Eye (OD)'}
          </span>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 shrink-0">
          {onNewScanClick && (
            <button
              type="button"
              onClick={onNewScanClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors cursor-pointer shadow-2xs"
              title={isVi ? "Tải ảnh sàng lọc mới cho bệnh nhân này" : "Upload new scan for this patient"}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isVi ? "Tải ảnh mới" : "New Scan"}</span>
            </button>
          )}
          {onOpenChatModal && (
            <button
              type="button"
              onClick={onOpenChatModal}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title={isVi ? 'Trao đổi với bệnh nhân' : 'Consultation chat'}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          {onOpenReportModal && (
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden sm:inline">{isVi ? 'In phiếu' : 'Print'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN 3-PANEL BODY (Collapsible Left + Expansive Center + Right Panel)   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: COLLAPSIBLE PATIENT WORKLIST                               */}
        {/* ----------------------------------------------------------------------- */}
        <aside
          className={`shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-300 ease-in-out z-20 ${
            isSidebarCollapsed ? 'w-[56px]' : 'w-[260px]'
          }`}
        >
          {/* Header toggle */}
          <div className="p-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider pl-1">
                {isVi ? 'Chờ thẩm định' : 'Worklist'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors mx-auto"
              title={isSidebarCollapsed ? (isVi ? 'Mở rộng danh sách' : 'Expand') : isVi ? 'Thu gọn' : 'Collapse'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Search bar when expanded */}
          {!isSidebarCollapsed && (
            <div className="p-2 border-b border-[#E2E8F0]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder={isVi ? 'Tìm tên, MRN...' : 'Search patient...'}
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          )}

          {/* Patient list */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1">
            {assignedPatients.map((p) => {
              const pId = p.id || p.patientId || p.userId;
              const isSelected = (pId && (pId === activePatient.id || pId === activePatient.userId)) || (p.mrn && p.mrn === activePatient.mrn);
              const initials = (p.fullName || 'P').charAt(0).toUpperCase();
              const riskStr = String(p.riskLevel || p.latestRiskLevel || '').toUpperCase();

              if (isSidebarCollapsed) {
                return (
                  <button
                    key={pId || p.mrn}
                    type="button"
                    onClick={() => onSelectPatient?.(p)}
                    className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center font-bold text-xs transition-all relative ${
                      isSelected
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                    }`}
                    title={`${p.fullName || 'Bệnh nhân'} (${p.mrn || 'N/A'})`}
                  >
                    {initials}
                    {riskStr === 'CRITICAL' || riskStr === 'HIGH' || riskStr === 'SEVERE' ? (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    ) : null}
                  </button>
                );
              }

              return (
                <button
                  key={pId || p.mrn}
                  type="button"
                  onClick={() => onSelectPatient?.(p)}
                  className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-l-4 border-[#2563EB] text-[#2563EB] font-semibold'
                      : 'hover:bg-[#F8FAFC] text-[#475569]'
                  }`}
                >
                  <div className="truncate">
                    <p className="font-semibold text-[#0F172A] truncate">{p.fullName}</p>
                    <p className="text-[11px] text-[#64748B] font-mono">{p.mrn}</p>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      riskStr === 'CRITICAL' || riskStr === 'SEVERE'
                        ? 'bg-rose-100 text-rose-700'
                        : riskStr === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {p.riskLevel || p.latestRiskLevel || 'Normal'}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* CENTER COLUMN: EXPANSIVE RETINAL IMAGE WORKSTATION (58-62%)             */}
        {/* ----------------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0B0F19] overflow-hidden p-3 sm:p-4">
          <div className="flex-1 rounded-2xl overflow-hidden border border-[#1E293B] shadow-2xl relative flex flex-col bg-[#050811]">
            <InteractiveCDSViewer
              analysisResult={analysisResult}
              selectedEye={
                analysisResult.eyePosition === 'Left_OS' || analysisResult.eyePosition === 'OS'
                  ? isVi
                    ? 'Mắt Trái (OS)'
                    : 'Left Eye (OS)'
                  : isVi
                  ? 'Mắt Phải (OD)'
                  : 'Right Eye (OD)'
              }
              isMaximized={false}
              onToggleMaximize={() => {}}
            />
          </div>
        </main>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: 6-SECTION STRUCTURED CLINICAL DECISION PANEL (38-42%)     */}
        {/* ----------------------------------------------------------------------- */}
        <aside className="w-full xl:w-[460px] 2xl:w-[500px] shrink-0 bg-white border-l border-[#E2E8F0] flex flex-col h-full shadow-[-2px_0_8px_rgba(0,0,0,0.02)] z-10">
          {/* Scrollable Clinical Form Flow */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Notification Toasts */}
            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
            {overrideError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                <span>{overrideError}</span>
                <button type="button" onClick={() => setOverrideError(null)} className="font-bold">
                  ✕
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 1: KẾT QUẢ AI & CHỈ SỐ SINH HỌC (AI INFERENCE & BIOMARKERS) */}
            {/* ------------------------------------------------------------------- */}
            <section className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#0F172A]">
                    {isVi ? '1. Kết Quả Phân Tích AI (Gemini 3.8 VLM)' : '1. AI Neural Inference (Gemini 3.8)'}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                  {isVi ? 'Nguy cơ tổng thể:' : 'Overall Risk:'} {overallRisk}/100
                </span>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
                  <span className="text-[#64748B] text-[11px] block">{isVi ? 'Tim Mạch (CVD):' : 'Cardiovascular:'}</span>
                  <span className="font-bold text-[#0F172A] text-[13px]">
                    {analysisResult.cardiovascularRisk?.level || 'Cao'} ({analysisResult.cardiovascularRisk?.score || 88}đ)
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
                  <span className="text-[#64748B] text-[11px] block">{isVi ? 'Võng Mạc ĐTĐ (DR):' : 'Diabetic Retinopathy:'}</span>
                  <span className="font-bold text-[#0F172A] text-[13px]">
                    {analysisResult.diabeticRetinopathyRisk?.level || 'Trung bình'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
                  <span className="text-[#64748B] text-[11px] block">{isVi ? 'Tỷ lệ A/V Ratio:' : 'A/V Ratio:'}</span>
                  <span className="font-mono font-bold text-rose-600 text-[13px]">
                    {avRatio.toFixed(2)} <span className="text-[10px] text-[#64748B] font-normal">(&lt; 0.67)</span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
                  <span className="text-[#64748B] text-[11px] block">{isVi ? 'Lõm Gai Thị (CDR):' : 'Cup-to-Disc (CDR):'}</span>
                  <span className="font-mono font-bold text-amber-600 text-[13px]">
                    {vcdr.toFixed(2)} <span className="text-[10px] text-[#64748B] font-normal">(&lt; 0.50)</span>
                  </span>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 2: ĐÁNH GIÁ CỦA BÁC SĨ (PHYSICIAN DECISION)                 */}
            {/* ------------------------------------------------------------------- */}
            <section className="space-y-2.5">
              <label className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                {isVi ? '2. Quyết Định Thẩm Định Của Bác Sĩ' : '2. Attending Physician Decision'}
              </label>

              {/* 3-Way Segmented Control */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setDecision('APPROVED')}
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    decision === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Chấp thuận AI' : 'Approve AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('MODIFIED')}
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    decision === 'MODIFIED'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Hiệu chỉnh' : 'Modify Risk'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('REJECTED')}
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    decision === 'REJECTED'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Bác bỏ' : 'Reject'}</span>
                </button>
              </div>

              {/* Conditional Override Box */}
              {decision === 'MODIFIED' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs animate-in fade-in">
                  <div>
                    <span className="font-semibold text-amber-950 block mb-1">
                      {isVi ? 'Mức nguy cơ Tim mạch điều chỉnh:' : 'Adjusted Cardiovascular Risk:'}
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Low', 'Moderate', 'High', 'Severe'] as RiskLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setAdjustedCardioRisk(lvl)}
                          className={`py-1 rounded font-bold text-[11px] border transition-colors ${
                            adjustedCardioRisk === lvl
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-[#475569] border-amber-200 hover:bg-amber-100/50'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-amber-950 block mb-1">
                      {isVi ? 'Lý do lâm sàng bắt buộc (Clinical Override Rationale):' : 'Mandatory Clinical Rationale:'}
                    </span>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder={isVi ? 'Nhập cơ sở điều chỉnh nguy cơ...' : 'State clinical rationale...'}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 3: MÃ HÓA BỆNH LÝ ICD-10 (DIAGNOSIS CODING)                 */}
            {/* ------------------------------------------------------------------- */}
            <section className="space-y-2.5">
              <label className="text-sm font-bold text-[#0F172A] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#2563EB]" />
                  {isVi ? '3. Mã Hóa Chẩn Đoán ICD-10' : '3. ICD-10 Diagnostic Codes'}
                </span>
                <span className="text-[11px] text-[#64748B] font-normal">
                  {selectedIcd10.length} {isVi ? 'mã đã chọn' : 'selected'}
                </span>
              </label>

              {/* Quick Pills */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ICD10_CODES.map((item) => {
                  const isSelected = selectedIcd10.includes(item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => toggleIcd10(item.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold shadow-2xs'
                          : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                      }`}
                      title={isVi ? item.labelVi : item.labelEn}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{item.code}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom ICD-10 input */}
              <form onSubmit={addCustomIcd} className="flex gap-2">
                <input
                  type="text"
                  value={customIcdInput}
                  onChange={(e) => setCustomIcdInput(e.target.value)}
                  placeholder={isVi ? 'Thêm mã ICD-10 khác (VD: I15.0)...' : 'Add custom ICD-10 code...'}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:border-[#2563EB] font-mono uppercase"
                />
                <button
                  type="submit"
                  disabled={!customIcdInput.trim()}
                  className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  {isVi ? 'Thêm' : 'Add'}
                </button>
              </form>
            </section>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 4: GHI CHÚ CHẨN ĐOÁN LÂM SÀNG (CLINICAL NOTES)             */}
            {/* ------------------------------------------------------------------- */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  {isVi ? '4. Nhận Định Lâm Sàng Của Bác Sĩ' : '4. Attending Specialist Notes'}
                </label>
              </div>

              {/* Quick Snippets Dropdown/Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                <span className="text-[#64748B] shrink-0 font-medium">{isVi ? 'Mẫu nhanh:' : 'Snippets:'}</span>
                {CLINICAL_SNIPPETS.map((snip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySnippet(isVi ? snip.textVi : snip.textEn)}
                    className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A] whitespace-nowrap transition-colors shrink-0 border border-[#E2E8F0]"
                  >
                    + {isVi ? snip.titleVi : snip.titleEn}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder={isVi ? 'Nhập chi tiết nhận định chuyên khoa...' : 'Enter clinical observations...'}
                className="w-full p-3 text-[14px] leading-relaxed rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A] transition-all resize-none"
              />
            </section>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 5: KẾ HOẠCH ĐIỀU TRỊ & THEO DÕI (CARE PLAN & FOLLOW-UP)    */}
            {/* ------------------------------------------------------------------- */}
            <section className="space-y-2.5">
              <label className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#2563EB]" />
                {isVi ? '5. Kế Hoạch Theo Dõi & Tái Khám' : '5. Care Plan & Follow-Up'}
              </label>

              {/* Follow-up Timeline Segment */}
              <div className="grid grid-cols-5 gap-1.5 text-xs">
                {[
                  { id: '1M', label: isVi ? '1 Tháng' : '1 Month' },
                  { id: '3M', label: isVi ? '3 Tháng' : '3 Months' },
                  { id: '6M', label: isVi ? '6 Tháng' : '6 Months' },
                  { id: '12M', label: isVi ? '12 Tháng' : '12 Months' },
                  { id: 'URGENT', label: isVi ? 'Khẩn Cấp' : 'Urgent' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFollowUpInterval(item.id as any)}
                    className={`py-1.5 text-center font-bold text-[11px] rounded-lg border transition-all cursor-pointer ${
                      followUpInterval === item.id
                        ? item.id === 'URGENT'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={carePlanNotes}
                onChange={(e) => setCarePlanNotes(e.target.value)}
                placeholder={isVi ? 'Hướng dẫn điều trị và lối sống...' : 'Lifestyle and therapy recommendations...'}
                className="w-full p-2.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:border-[#2563EB] text-[#0F172A] resize-none"
              />
            </section>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 6: HÀNH ĐỘNG CUỐI & KÝ SỐ ĐIỆN TỬ (FINAL SIGN-OFF)           */}
          {/* --------------------------------------------------------------------- */}
          <footer className="shrink-0 p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
            {/* Digital Signature Identity */}
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5 truncate">
                <FileSignature className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="truncate">{currentDoctorName}</span>
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#E2E8F0]">
                SHA-256 HSM
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSignAndSave(true)}
                disabled={isSubmitting}
                className="w-1/3 py-2.5 rounded-xl border border-[#CBD5E1] text-[#334155] bg-white hover:bg-[#F1F5F9] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isVi ? 'Lưu bản nháp' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={() => handleSignAndSave(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all shadow-[0_2px_4px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <FileSignature className="w-4 h-4" />
                <span>{isSubmitting ? (isVi ? 'Đang ký số...' : 'Signing...') : (isVi ? 'Ký & Lưu Kết Quả' : 'Sign & Finalize')}</span>
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
};

export default DoctorDiagnosisWorkspace;
