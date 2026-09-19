import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Save,
  Printer,
} from 'lucide-react';
import { DoctorFeedback, RiskLevel } from '../types/cds';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export interface ClinicalValidationBarProps {
  analysisId: string;
  onSaveFeedback: (feedback: DoctorFeedback) => Promise<void>;
  onOpenReportModal?: () => void;
  isSubmitting?: boolean;
  doctorName?: string;
  doctorId?: string;
}

export const ClinicalValidationBar: React.FC<ClinicalValidationBarProps> = ({
  analysisId,
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

  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>('APPROVED');
  const [adjustedCardioRisk, setAdjustedCardioRisk] = useState<RiskLevel>('Moderate');
  const [adjustedDrRisk, setAdjustedDrRisk] = useState<RiskLevel>('Low');
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
    const feedback: DoctorFeedback = {
      feedbackId: `FB-${Date.now()}`,
      analysisId,
      doctorId: currentDoctorId,
      doctorName: currentDoctorName,
      decision,
      adjustedCardioRisk: decision === 'MODIFIED' ? adjustedCardioRisk : undefined,
      adjustedDrRisk: decision === 'MODIFIED' ? adjustedDrRisk : undefined,
      icd10Codes: icd10Input.split(',').map((c) => c.trim()).filter(Boolean),
      clinicalNotes: doctorNotes,
      overrideReason: decision === 'MODIFIED' ? overrideReason.trim() : undefined,
      recommendations: recommendations.trim() || undefined,
      reviewedAt: new Date().toISOString(),
      signedDigitalSignature: isDraft ? undefined : 'SHA256-AURA-SIGNED',
    };

    try {
      await onSaveFeedback(feedback);
      setSuccessMessage(
        isDraft
          ? (isVi ? 'Đã lưu bản nháp đánh giá lâm sàng thành công!' : 'Draft clinical assessment saved successfully!')
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
    <Card padding="md" className="h-full flex flex-col justify-between space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-clinical-border pb-2.5">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-brand-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-clinical-text">
              {t('doctor.validationBar.title', 'Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả Sàng Lọc')}
            </h3>
            <p className="text-[11px] text-clinical-text-muted">
              {t('doctor.validationBar.subtitle', 'Bác sĩ xác nhận độ chính xác của AI hoặc điều chỉnh mức độ rủi ro theo chuyên môn.')}
            </p>
          </div>
        </div>

        {onOpenReportModal && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenReportModal}
            icon={<Printer className="w-3.5 h-3.5" />}
            className="text-xs shrink-0"
          >
            {t('doctor.validationBar.printReport', 'In Phiếu Kết Quả')}
          </Button>
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

      {/* Action Controls */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        {/* Upper: Decision, Override & ICD-10 */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1">
              {t('doctor.validationBar.decisionLabel', 'Quyết định thẩm định chuyên môn:')}
            </label>
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
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer text-center ${
                    decision === opt.id
                      ? opt.id === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : opt.id === 'MODIFIED'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-clinical-text-secondary border-clinical-border hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {decision === 'MODIFIED' && (
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2.5 text-xs">
              <div>
                <span className="font-semibold text-amber-950 block mb-1">
                  {t('doctor.validationBar.adjustedCardio', 'Mức nguy cơ Tim mạch:')}
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { id: 'Low', label: isVi ? 'Thấp' : 'Low' },
                    { id: 'Moderate', label: isVi ? 'Trung bình' : 'Moderate' },
                    { id: 'High', label: isVi ? 'Cao' : 'High' },
                    { id: 'Severe', label: isVi ? 'Nguy kịch' : 'Severe' },
                  ] as { id: RiskLevel; label: string }[]).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setAdjustedCardioRisk(lvl.id)}
                      className={`py-0.5 rounded font-bold text-[10.5px] border transition-colors cursor-pointer ${
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
                <span className="font-semibold text-amber-950 block mb-1">
                  {t('doctor.validationBar.adjustedDR', 'Mức nguy cơ Võng mạc ĐTĐ:')}
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { id: 'Low', label: isVi ? 'Thấp' : 'Low' },
                    { id: 'Moderate', label: isVi ? 'Trung bình' : 'Moderate' },
                    { id: 'High', label: isVi ? 'Cao' : 'High' },
                    { id: 'Severe', label: isVi ? 'Nguy kịch' : 'Severe' },
                  ] as { id: RiskLevel; label: string }[]).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setAdjustedDrRisk(lvl.id)}
                      className={`py-0.5 rounded font-bold text-[10.5px] border transition-colors cursor-pointer ${
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

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
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
                      ? 'Nhập căn cứ lâm sàng khi điều chỉnh phân tầng nguy cơ của AI (ví dụ: tiền sử bệnh nhân, triệu chứng kèm theo, biến chứng đáy mắt...)'
                      : 'Enter clinical rationale for altering AI risk classification...'
                  }
                  className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* ICD-10 Selection with 1-Click Quick Chips (Requirement R3) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-clinical-text">
                {t('doctor.validationBar.icd10Label', 'Mã bệnh danh ICD-10 (phân tách dấu phẩy):')}
              </label>
              <span className="text-[10px] text-slate-500">
                {isVi ? 'Chọn nhanh 1-chạm:' : 'Quick Select:'}
              </span>
            </div>

            {/* 1-Click ICD-10 Quick Chips */}
            <div className="flex items-center gap-1 flex-wrap mb-1.5">
              {[
                { code: 'H35.0', desc: isVi ? 'Biến đổi mạch võng mạc & tăng HA' : 'Retinal vasculopathy' },
                { code: 'E11.3', desc: isVi ? 'Bệnh võng mạc đái tháo đường' : 'Diabetic retinopathy' },
                { code: 'I10', desc: isVi ? 'Tăng huyết áp vô căn' : 'Essential hypertension' },
                { code: 'H40.0', desc: isVi ? 'Nghi ngờ Glaucoma' : 'Glaucoma suspect' },
                { code: 'I67.8', desc: isVi ? 'Bệnh mạch máu não / Nguy cơ đột quỵ' : 'Cerebrovascular risk' },
              ].map((chip) => {
                const currentCodes = icd10Input.split(',').map((c) => c.trim()).filter(Boolean);
                const isSelected = currentCodes.includes(chip.code);
                return (
                  <button
                    key={chip.code}
                    type="button"
                    onClick={() => {
                      let nextCodes: string[];
                      if (isSelected) {
                        nextCodes = currentCodes.filter((c) => c !== chip.code);
                      } else {
                        nextCodes = [...currentCodes, chip.code];
                      }
                      setIcd10Input(nextCodes.join(', '));
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3478F6] text-white border-[#3478F6] shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={`${chip.code}: ${chip.desc}`}
                  >
                    {chip.code}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={icd10Input}
              onChange={(e) => setIcd10Input(e.target.value)}
              placeholder="H35.0, I10, E11.9..."
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono-data"
            />
          </div>
        </div>

        {/* Lower: Notes & Recommendations with Quick Templates */}
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1">
              {t('doctor.validationBar.notesLabel', 'Ghi chú chẩn đoán lâm sàng:')}
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder={isVi ? "Nhập chẩn đoán chuyên môn, hướng dẫn điều trị bổ sung..." : "Enter clinical findings, supplementary treatment guidelines..."}
              className="w-full text-xs p-2 rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-clinical-text">
                {isVi ? 'Khuyến nghị y khoa & Kế hoạch theo dõi:' : 'Recommendations & Follow-up:'}
              </label>
              <span className="text-[10px] text-slate-500">
                {isVi ? 'Mẫu 1-chạm:' : 'Templates:'}
              </span>
            </div>

            {/* 1-Click Quick Clinical Conclusion Templates */}
            <div className="flex items-center gap-1 flex-wrap mb-1.5">
              {[
                {
                  label: isVi ? 'Theo dõi 6 tháng, kiểm soát HA & HbA1c' : '6M Follow-up (BP & HbA1c)',
                  text: isVi
                    ? 'Theo dõi 6 tháng, kiểm soát HA & HbA1c.'
                    : 'Follow up in 6 months, control BP and HbA1c.',
                },
                {
                  label: isVi ? 'Chuyển chuyên khoa Đáy mắt can thiệp Laser' : 'Refer Fundus Specialist (Laser)',
                  text: isVi
                    ? 'Chuyển chuyên khoa Đáy mắt can thiệp Laser.'
                    : 'Refer to fundus retina specialist for laser intervention.',
                },
                {
                  label: isVi ? 'Tối ưu hóa phác đồ hạ áp & lipid máu' : 'Optimize BP & Lipid',
                  text: isVi
                    ? 'Tối ưu hóa phác đồ hạ áp & lipid máu.'
                    : 'Optimize antihypertensive and lipid-lowering regimen.',
                },
              ].map((tmpl, idx) => (
                <button
                  key={`quick-tmpl-${idx}`}
                  type="button"
                  onClick={() => {
                    setRecommendations((prev) => (prev && prev.trim().length > 0 ? `${prev.trim()}\n${tmpl.text}` : tmpl.text));
                  }}
                  className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-50 hover:bg-[#EEF5FF] text-slate-700 hover:text-[#3478F6] border border-slate-200 hover:border-[#C7D7FE] transition-colors cursor-pointer text-left truncate max-w-full"
                  title={tmpl.text}
                >
                  + {tmpl.label}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder={isVi ? "Ví dụ: Tái khám chuyên khoa sau 3 tháng, kiểm soát huyết áp < 130/80..." : "e.g., Follow up in 3 months, monitor BP < 130/80..."}
              className="w-full text-xs p-2 rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-lg text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{isVi ? 'Lỗi lưu thẩm định' : 'Save Error'}</p>
                <p className="text-[11px] leading-tight text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAECF0]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={saving || isSubmitting}
              onClick={() => handleSave(true)}
            >
              {isVi ? 'Lưu bản nháp' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={saving || isSubmitting}
              onClick={() => handleSave(false)}
              icon={<Save className="w-4 h-4" />}
            >
              {saving || isSubmitting
                ? t('doctor.validationBar.savingButton', 'Đang lưu và ký số...')
                : t('doctor.validationBar.saveButton', 'Ký Số & Phê Duyệt')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
