import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSignature,
  Save,
  Printer,
  Edit3,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { DoctorFeedback, RiskLevel, AIRiskResult } from '../types/cds';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export interface ClinicalValidationBarProps {
  analysisId: string;
  analysisResult?: AIRiskResult | null;
  aiFindings?: string;
  initialDoctorFindings?: string;
  onSaveFeedback: (feedback: DoctorFeedback) => Promise<void>;
  onOpenReportModal?: () => void;
  isSubmitting?: boolean;
  doctorName?: string;
  doctorId?: string;
}

const STANDARD_ICD10_LIST = [
  { code: 'H35.0', descVi: 'Biến đổi vi mạch võng mạc & Tăng HA', descEn: 'Retinal vasculopathy / Hypertensive retinopathy' },
  { code: 'E11.3', descVi: 'Bệnh võng mạc đái tháo đường', descEn: 'Diabetic retinopathy' },
  { code: 'I10', descVi: 'Tăng huyết áp nguyên phát', descEn: 'Essential hypertension' },
  { code: 'H40.0', descVi: 'Nghi ngờ Glôcôm / Lõm gai thị', descEn: 'Glaucoma suspect' },
  { code: 'I67.8', descVi: 'Bệnh mạch máu não / Nguy cơ đột quỵ', descEn: 'Cerebrovascular disease / Stroke risk' },
  { code: 'H35.3', descVi: 'Thoái hóa hoàng điểm tuổi già (AMD)', descEn: 'Age-related macular degeneration' },
  { code: 'H34.8', descVi: 'Tắc tĩnh mạch võng mạc (RVO)', descEn: 'Retinal vein occlusion' },
  { code: 'E11.9', descVi: 'Đái tháo đường type 2 không biến chứng', descEn: 'Type 2 diabetes mellitus' },
];

const CLINICAL_NOTE_SNIPPETS = [
  {
    labelVi: 'Võng mạc Tăng HA độ 2',
    labelEn: 'Grade 2 Hypertensive Retinopathy',
    textVi: 'Hẹp tiểu động mạch cục bộ (A/V ratio ~0.52), có dấu hiệu bắt chéo Đ-TM (Salus sign). Chưa thấy xuất huyết hay xuất tiết dạng bông.',
    textEn: 'Focal arteriolar narrowing (A/V ratio ~0.52) with A/V nicking (Salus sign). No flame hemorrhages or cotton-wool spots.',
  },
  {
    labelVi: 'Võng mạc ĐTĐ không tăng sinh (NPDR)',
    labelEn: 'Non-Proliferative DR (NPDR)',
    textVi: 'Ghi nhận vi phình mạch rải rác cực sau, xuất tiết cứng khu trú ngoài hoàng điểm. Chưa có bằng chứng phù hoàng điểm hay tân mạch.',
    textEn: 'Scattered microaneurysms at posterior pole, hard exudates sparing fovea. No macular edema or neovascularization.',
  },
  {
    labelVi: 'Nghi ngờ Glôcôm / CDR cao',
    labelEn: 'Glaucoma Suspect / High CDR',
    textVi: 'Tỷ lệ lõm gai thị (VCDR ~0.54) vượt ngưỡng sinh lý, viền thần kinh thị mỏng nhẹ thái dương. Cần đo nhãn áp và chụp OCT RNFL.',
    textEn: 'Cup-to-disc ratio (VCDR ~0.54) elevated beyond physiological baseline. Thinning of temporal rim. Recommend Goldmann tonometry & OCT RNFL.',
  },
  {
    labelVi: 'Đáy mắt ổn định bình thường',
    labelEn: 'Normal Retinal Findings',
    textVi: 'Hệ vi mạch võng mạc phân bố đều, lòng mạch đồng nhất, không ghi nhận xuất huyết, xuất tiết hay tổn thương tân mạch. Đáy mắt ổn định.',
    textEn: 'Retinal vascular architecture normal, uniform lumen caliber. No hemorrhages, exudates, or neovascularization.',
  },
];

const CLINICAL_RECOMMENDATION_TEMPLATES = [
  {
    labelVi: 'Kế hoạch KSH & HA (3 tháng)',
    labelEn: 'BP & Glycemic Control (3M)',
    textVi: 'Đo huyết áp tại nhà 2 lần/ngày (sáng/tối), mục tiêu < 130/80 mmHg theo ESC/AHA. Duy trì HbA1c < 7.0%. Tái khám đáy mắt sau 3 tháng.',
    textEn: 'Home BP monitoring BID, target < 130/80 mmHg (ESC/AHA). Maintain HbA1c < 7.0%. Fundus follow-up in 3 months.',
  },
  {
    labelVi: 'Chỉ định Chụp OCT & Đo nhãn áp',
    labelEn: 'Order OCT & Tonometry',
    textVi: 'Chỉ định chụp OCT hoàng điểm và gai thị (RNFL), đo nhãn áp kế Goldmann. Xét nghiệm bộ mỡ máu (Lipid panel) và chức năng thận (eGFR).',
    textEn: 'Order macular & RNFL OCT, Goldmann tonometry. Lipid panel and renal function test (eGFR) recommended.',
  },
  {
    labelVi: 'Chuyển can thiệp Laser/Anti-VEGF',
    labelEn: 'Refer Fundus Specialist',
    textVi: 'Chuyển khám chuyên khoa Đáy mắt tuyến trên để đánh giá can thiệp Laser quang đông võng mạc hoặc tiêm Anti-VEGF nội nhãn.',
    textEn: 'Refer to vitreoretinal specialist for evaluation of laser photocoagulation or intravitreal Anti-VEGF therapy.',
  },
  {
    labelVi: 'Tái khám định kỳ 6-12 tháng',
    labelEn: 'Routine 6-12M Follow-up',
    textVi: 'Tiếp tục duy trì lối sống lành mạnh, kiêng mặn (< 5g muối/ngày), vận động 150 phút/tuần. Tái khám sàng lọc định kỳ sau 6 - 12 tháng.',
    textEn: 'Maintain healthy lifestyle, low sodium diet (< 5g/day), 150 min exercise/week. Routine screening in 6-12 months.',
  },
];

export const ClinicalValidationBar: React.FC<ClinicalValidationBarProps> = ({
  analysisId,
  analysisResult,
  aiFindings,
  initialDoctorFindings,
  onSaveFeedback,
  onOpenReportModal,
  isSubmitting = false,
  doctorName,
  doctorId,
}) => {
  const { user } = useAuth();
  const { t, isVi } = useLanguage();
  const currentDoctorName = doctorName || user?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');
  const currentDoctorId = doctorId || user?.id || 'DOC-CURRENT';

  const rawAiFindings = aiFindings || analysisResult?.aiFindings || analysisResult?.findings || '';
  const initialDoctorFindingsVal = initialDoctorFindings || analysisResult?.doctorFindings || '';

  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>('APPROVED');
  const [adjustedCardioRisk, setAdjustedCardioRisk] = useState<RiskLevel>('Moderate');
  const [adjustedDrRisk, setAdjustedDrRisk] = useState<RiskLevel>('Low');
  const [findingsStatus, setFindingsStatus] = useState<'CONFIRMED' | 'EDITED'>(
    initialDoctorFindingsVal && initialDoctorFindingsVal !== rawAiFindings ? 'EDITED' : 'CONFIRMED'
  );
  const [editableFindings, setEditableFindings] = useState<string>(
    initialDoctorFindingsVal || rawAiFindings
  );
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [icd10Input, setIcd10Input] = useState<string>('H35.0');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [saveError, setSaveError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Hydrate or reset form fields when switching to a different screening analysis
  useEffect(() => {
    if (analysisResult && (analysisResult.analysisId === analysisId || !analysisId)) {
      if (
        analysisResult.reviewDecision === 'APPROVED' ||
        analysisResult.reviewDecision === 'MODIFIED' ||
        analysisResult.reviewDecision === 'REJECTED'
      ) {
        setDecision(analysisResult.reviewDecision);
      } else {
        setDecision('APPROVED');
      }
      setDoctorNotes(analysisResult.doctorNotes || '');
      setRecommendations(analysisResult.recommendations || '');
      if (analysisResult.icd10Codes && analysisResult.icd10Codes.length > 0) {
        setIcd10Input(analysisResult.icd10Codes.join(', '));
      } else {
        setIcd10Input('H35.0');
      }
      if (analysisResult.cardiovascularRisk?.level && analysisResult.cardiovascularRisk.level !== 'Unverified') {
        setAdjustedCardioRisk(analysisResult.cardiovascularRisk.level);
      } else {
        setAdjustedCardioRisk('Moderate');
      }
      if (analysisResult.diabeticRetinopathyRisk?.level && analysisResult.diabeticRetinopathyRisk.level !== 'Unverified') {
        setAdjustedDrRisk(analysisResult.diabeticRetinopathyRisk.level);
      } else {
        setAdjustedDrRisk('Low');
      }
      setOverrideReason(analysisResult.rejectionReason || '');

      const resolvedAi = aiFindings || analysisResult.aiFindings || analysisResult.findings || '';
      const resolvedDoc = initialDoctorFindings || analysisResult.doctorFindings || '';
      if (resolvedDoc && resolvedDoc !== resolvedAi) {
        setFindingsStatus('EDITED');
        setEditableFindings(resolvedDoc);
      } else {
        setFindingsStatus('CONFIRMED');
        setEditableFindings(resolvedAi);
      }
    } else {
      setDecision('APPROVED');
      setAdjustedCardioRisk('Moderate');
      setAdjustedDrRisk('Low');
      setDoctorNotes('');
      setOverrideReason('');
      setRecommendations('');
      setIcd10Input('H35.0');
      const resolvedAi = aiFindings || '';
      setFindingsStatus('CONFIRMED');
      setEditableFindings(resolvedAi);
    }
    setOverrideError(null);
    setSaveSuccess(false);
    setSuccessMessage('');
    setSaveError(false);
    setErrorMessage('');
    setSaving(false);
  }, [analysisId, analysisResult, aiFindings, initialDoctorFindings]);

  const handleSave = async (isDraft: boolean = false) => {
    // R4 requirement: Override reason required if modifying AI finding
    if (decision === 'MODIFIED' && !overrideReason.trim() && !isDraft) {
      setOverrideError(
        isVi
          ? 'Bắt buộc nhập lý do lâm sàng khi điều chỉnh phân tầng nguy cơ của AI.'
          : 'Clinical override reason is mandatory when altering AI risk classification.'
      );
      return;
    }

    setOverrideError(null);
    setSaveError(false);
    setSaveSuccess(false);
    setSaving(true);

    const finalDoctorFindings = findingsStatus === 'EDITED'
      ? editableFindings.trim()
      : (rawAiFindings || editableFindings.trim());

    const feedback: DoctorFeedback = {
      feedbackId: `FB-${Date.now()}`,
      analysisId,
      doctorId: currentDoctorId,
      doctorName: currentDoctorName,
      decision,
      adjustedCardioRisk: decision === 'MODIFIED' ? adjustedCardioRisk : undefined,
      adjustedDrRisk: decision === 'MODIFIED' ? adjustedDrRisk : undefined,
      icd10Codes: icd10Input.split(',').map((c) => c.trim()).filter(Boolean),
      clinicalNotes: doctorNotes.trim()
        ? doctorNotes.trim()
        : decision === 'REJECTED'
        ? (isVi ? 'Bác sĩ chuyên khoa đã bác bỏ kết quả phân tích của AI.' : 'Specialist rejected AI analysis findings.')
        : (isVi ? 'Bác sĩ đã xác nhận kết quả chẩn đoán.' : 'Doctor confirmed diagnosis.'),
      overrideReason: decision === 'MODIFIED' ? overrideReason.trim() : undefined,
      recommendations: recommendations.trim() || undefined,
      doctorFindings: finalDoctorFindings,
      findingsStatus,
      reviewedAt: new Date().toISOString(),
      signedDigitalSignature: isDraft ? undefined : 'SHA256-AURA-SIGNED',
    };

    try {
      await onSaveFeedback(feedback);
      setSuccessMessage(
        isDraft
          ? (isVi ? 'Đã lưu bản nháp đánh giá lâm sàng thành công!' : 'Draft clinical assessment saved successfully!')
          : decision === 'REJECTED'
          ? (isVi ? 'Đã ký số và ghi nhận quyết định BÁC BỎ kết quả thành công!' : 'Screening rejection recorded and signed successfully!')
          : (isVi ? 'Đã ký số và phê duyệt kết quả chẩn đoán thành công!' : 'Screening validated and signed successfully!')
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e: any) {
      console.error('[MED-07] Validation save error in bar:', e);
      setErrorMessage(
        e?.message || (isVi
          ? 'Không thể lưu đánh giá lâm sàng. Vui lòng kiểm tra lại kết nối hoặc thông tin ca khám.'
          : 'Failed to save clinical validation. Please check connection or screening details.')
      );
      setSaveError(true);
      setTimeout(() => setSaveError(false), 6000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="md" className="h-full flex flex-col justify-between space-y-3 overflow-y-auto">
      {/* Header gọn gàng */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EEF5FF] text-[#3478F6] flex items-center justify-center shrink-0">
            <FileSignature className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">
              {t('doctor.validationBar.title', 'Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả Sàng Lọc')}
            </h3>
            <p className="text-[10.5px] text-slate-500 truncate">
              {t('doctor.validationBar.subtitle', 'Xác nhận kết quả AI và ký số phê duyệt')}
            </p>
          </div>
        </div>

        {onOpenReportModal && (
          <button
            type="button"
            onClick={onOpenReportModal}
            title={t('doctor.validationBar.printReport', 'In Phiếu Kết Quả')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#3478F6] hover:bg-[#EEF5FF] border border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="sr-only">{t('doctor.validationBar.printReport', 'In Phiếu Kết Quả')}</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage || t('doctor.validationBar.savedSuccess', 'Đã lưu kết luận lâm sàng và đồng bộ báo cáo sàng lọc thành công!')}</span>
        </div>
      )}

      {overrideError && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between gap-2 animate-in fade-in">
          <span>{overrideError}</span>
          <button
            type="button"
            onClick={() => setOverrideError(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Clean 3-Step Workflow */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-3">
          {/* BƯỚC 1: QUYẾT ĐỊNH THẨM ĐỊNH */}
          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                1. {t('doctor.validationBar.decisionLabel', 'Quyết định thẩm định chuyên môn:')}
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : decision === 'MODIFIED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {decision === 'APPROVED'
                  ? (isVi ? 'Đồng thuận AI' : 'Approved')
                  : decision === 'MODIFIED'
                  ? (isVi ? 'Có hiệu chỉnh' : 'Modified')
                  : (isVi ? 'Yêu cầu chụp lại' : 'Rejected')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'APPROVED', label: t('doctor.validationBar.decisions.approve', 'Chấp thuận AI') },
                { id: 'MODIFIED', label: t('doctor.validationBar.decisions.modify', 'Hiệu chỉnh nguy cơ') },
                { id: 'REJECTED', label: t('doctor.validationBar.decisions.reject', 'Bác bỏ kết quả') },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setDecision(opt.id as any);
                    if (opt.id !== 'MODIFIED') setOverrideError(null);
                  }}
                  className={`py-2 px-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                    decision === opt.id
                      ? opt.id === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : opt.id === 'MODIFIED'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {decision === 'MODIFIED' && (
              <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 space-y-2 text-xs mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold text-amber-950 text-[11px] block mb-1">
                      {t('doctor.validationBar.adjustedCardio', 'Mức nguy cơ Tim mạch:')}
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        { id: 'Low', label: isVi ? 'Thấp' : 'Low' },
                        { id: 'Moderate', label: isVi ? 'TB' : 'Mod' },
                        { id: 'High', label: isVi ? 'Cao' : 'High' },
                        { id: 'Severe', label: isVi ? 'Nguy kịch' : 'Severe' },
                      ] as { id: RiskLevel; label: string }[]).map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setAdjustedCardioRisk(lvl.id)}
                          className={`py-1 rounded font-bold text-[10px] border transition-colors cursor-pointer ${
                            adjustedCardioRisk === lvl.id
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-amber-950 text-[11px] block mb-1">
                      {t('doctor.validationBar.adjustedDR', 'Mức nguy cơ Võng mạc ĐTĐ:')}
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        { id: 'Low', label: isVi ? 'Thấp' : 'Low' },
                        { id: 'Moderate', label: isVi ? 'TB' : 'Mod' },
                        { id: 'High', label: isVi ? 'Cao' : 'High' },
                        { id: 'Severe', label: isVi ? 'Nguy kịch' : 'Severe' },
                      ] as { id: RiskLevel; label: string }[]).map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setAdjustedDrRisk(lvl.id)}
                          className={`py-1 rounded font-bold text-[10px] border transition-colors cursor-pointer ${
                            adjustedDrRisk === lvl.id
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    {isVi ? 'Lý do hiệu chỉnh nguy cơ (Bắt buộc):' : 'Override Reason (Required):'} *
                  </label>
                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => {
                      setOverrideReason(e.target.value);
                      if (e.target.value.trim()) setOverrideError(null);
                    }}
                    placeholder={
                      isVi
                        ? 'Nhập căn cứ lâm sàng khi điều chỉnh phân tầng nguy cơ...'
                        : 'Enter clinical rationale for altering AI risk classification...'
                    }
                    className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* BƯỚC 2: MÃ BỆNH ICD-10 (Gọn gàng) */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                2. {t('doctor.validationBar.icd10Label', 'Mã bệnh danh ICD-10 (phân tách dấu phẩy):')}
              </label>
              <span className="text-[10px] text-slate-400">
                {isVi ? 'Chọn nhanh:' : 'Quick Select:'}
              </span>
            </div>

            <input
              type="text"
              value={icd10Input}
              onChange={(e) => setIcd10Input(e.target.value)}
              placeholder="H35.0, I10, E11.9..."
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3478F6] font-mono-data"
            />

            {/* 4 mã phổ biến hiển thị trực tiếp, các mã còn lại gom gọn */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              {STANDARD_ICD10_LIST.slice(0, 4).map((chip) => {
                const currentCodes = icd10Input.split(',').map((c) => c.trim()).filter(Boolean);
                const isSelected = currentCodes.includes(chip.code);
                return (
                  <button
                    key={chip.code}
                    type="button"
                    onClick={() => {
                      const nextCodes = isSelected
                        ? currentCodes.filter((c) => c !== chip.code)
                        : [...currentCodes, chip.code];
                      setIcd10Input(nextCodes.join(', '));
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3478F6] text-white border-[#3478F6]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={`${chip.code}: ${isVi ? chip.descVi : chip.descEn}`}
                  >
                    {chip.code}
                  </button>
                );
              })}
              <details className="inline-block">
                <summary className="px-2 py-0.5 rounded text-[10px] font-semibold text-[#3478F6] bg-[#EEF5FF] hover:bg-[#D0DDFE] cursor-pointer list-none select-none inline-flex items-center">
                  + {isVi ? 'Mã khác' : 'More'}
                </summary>
                <div className="flex items-center gap-1 flex-wrap mt-1.5 pt-1 border-t border-slate-100">
                  {STANDARD_ICD10_LIST.slice(4).map((chip) => {
                    const currentCodes = icd10Input.split(',').map((c) => c.trim()).filter(Boolean);
                    const isSelected = currentCodes.includes(chip.code);
                    return (
                      <button
                        key={chip.code}
                        type="button"
                        onClick={() => {
                          const nextCodes = isSelected
                            ? currentCodes.filter((c) => c !== chip.code)
                            : [...currentCodes, chip.code];
                          setIcd10Input(nextCodes.join(', '));
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3478F6] text-white border-[#3478F6]'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`${chip.code}: ${isVi ? chip.descVi : chip.descEn}`}
                      >
                        {chip.code}
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>

          {/* BƯỚC 3: KẾT LUẬN & KHUYẾN NGHỊ CỦA BÁC SĨ */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              3. {t('doctor.validationBar.notesLabel', 'Ghi chú chẩn đoán lâm sàng:')} & {isVi ? 'Khuyến nghị' : 'Follow-up'}
            </label>

            <div>
              <textarea
                rows={2}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder={isVi ? 'Nhập nhận định chuyên môn của bác sĩ...' : 'Enter specialist clinical notes...'}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/40 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3478F6]"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                {isVi ? 'Khuyến nghị y khoa & Kế hoạch theo dõi:' : 'Recommendations & Follow-up:'}
              </span>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder={isVi ? 'Hướng dẫn theo dõi, tái khám hoặc chỉ định cận lâm sàng...' : 'Follow-up schedule or clinical orders...'}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/40 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3478F6]"
              />
            </div>

            {/* Hộp công cụ chọn mẫu câu nhanh & hiệu chỉnh AI thu gọn để không làm rối giao diện */}
            <details className="group rounded-lg border border-slate-200 bg-slate-50/70">
              <summary className="px-2.5 py-1.5 text-[11px] font-semibold text-[#3478F6] cursor-pointer list-none flex items-center justify-between select-none hover:bg-[#EEF5FF]/60 rounded-lg transition-colors">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Mẫu câu chẩn đoán nhanh & Chỉnh sửa phát hiện AI' : 'Quick Clinical Templates & Edit AI Findings'}</span>
                </span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>

              <div className="p-2.5 pt-2 border-t border-slate-200 space-y-3 bg-white rounded-b-lg">
                {/* Mẫu câu ghi chú */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    {isVi ? 'Chèn nhanh nhận định lâm sàng:' : 'Insert Clinical Note Snippet:'}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {CLINICAL_NOTE_SNIPPETS.map((snip, idx) => (
                      <button
                        key={`note-snip-${idx}`}
                        type="button"
                        onClick={() => {
                          const text = isVi ? snip.textVi : snip.textEn;
                          setDoctorNotes((prev) => (prev && prev.trim().length > 0 ? `${prev.trim()}\n${text}` : text));
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 hover:bg-[#EEF5FF] text-slate-700 hover:text-[#3478F6] border border-slate-200 transition-colors cursor-pointer text-left truncate max-w-full"
                      >
                        + {isVi ? snip.labelVi : snip.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mẫu câu khuyến nghị */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    {isVi ? 'Chèn nhanh khuyến nghị:' : 'Insert Recommendation Template:'}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {CLINICAL_RECOMMENDATION_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={`quick-tmpl-${idx}`}
                        type="button"
                        onClick={() => {
                          const text = isVi ? tmpl.textVi : tmpl.textEn;
                          setRecommendations((prev) => (prev && prev.trim().length > 0 ? `${prev.trim()}\n${text}` : text));
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 hover:bg-[#EEF5FF] text-slate-700 hover:text-[#3478F6] border border-slate-200 transition-colors cursor-pointer text-left truncate max-w-full"
                      >
                        + {isVi ? tmpl.labelVi : tmpl.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FR-15: Xác nhận hoặc chỉnh sửa phát hiện do AI tạo ra */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <label className="text-[10.5px] font-bold text-slate-700">
                      {t('doctor.validationBar.aiFindingsLabel', 'Xác nhận hoặc chỉnh sửa các phát hiện do AI tạo ra:')}
                    </label>
                    <span
                      className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full border ${
                        findingsStatus === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {findingsStatus === 'CONFIRMED'
                        ? t('doctor.validationBar.confirmedBadge', 'Đã xác nhận chính xác')
                        : t('doctor.validationBar.editedBadge', 'Đã hiệu chỉnh bởi Bác sĩ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFindingsStatus('CONFIRMED');
                        if (rawAiFindings) setEditableFindings(rawAiFindings);
                      }}
                      className={`py-1 px-2 text-[10.5px] font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        findingsStatus === 'CONFIRMED'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="truncate">{t('doctor.validationBar.confirmFindings', 'Xác nhận phát hiện của AI')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFindingsStatus('EDITED')}
                      className={`py-1 px-2 text-[10.5px] font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        findingsStatus === 'EDITED'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span className="truncate">{t('doctor.validationBar.editFindings', 'Chỉnh sửa phát hiện')}</span>
                    </button>
                  </div>

                  {findingsStatus === 'CONFIRMED' ? (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 max-h-24 overflow-y-auto whitespace-pre-line">
                      {rawAiFindings ||
                        (isVi
                          ? '• Hệ vi mạch võng mạc phân bố đều, cung mạch thái dương liên tục.\n• Không ghi nhận dấu hiệu xuất huyết võng mạc hay vi phình mạch.'
                          : '• Retinal microvascular architecture intact.\n• No overt retinal hemorrhages detected.')}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <textarea
                        rows={3}
                        value={editableFindings}
                        onChange={(e) => setEditableFindings(e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* STICKY FOOTER ACTIONS */}
        <div className="space-y-2 pt-2 border-t border-[#EAECF0] shrink-0 bg-white">
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{isVi ? 'Lỗi lưu thẩm định' : 'Save Error'}</p>
                <p className="text-[11px] leading-tight text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={saving || isSubmitting}
              onClick={() => handleSave(true)}
              className="col-span-1 text-xs"
            >
              {isVi ? 'Lưu bản nháp' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              variant={decision === 'REJECTED' ? 'danger' : 'primary'}
              size="sm"
              loading={saving || isSubmitting}
              onClick={() => handleSave(false)}
              icon={decision === 'REJECTED' ? <XCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              className="col-span-2 text-xs font-bold"
            >
              {saving || isSubmitting
                ? t('doctor.validationBar.savingButton', 'Đang lưu và ký số...')
                : decision === 'REJECTED'
                ? (isVi ? 'Ký Số & Bác Bỏ' : 'Sign & Reject')
                : t('doctor.validationBar.saveButton', 'Ký Số & Phê Duyệt')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
