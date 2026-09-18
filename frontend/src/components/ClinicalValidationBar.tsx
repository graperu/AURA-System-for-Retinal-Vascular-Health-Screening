import React, { useState } from 'react';
import {
  CheckCircle2,
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
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-clinical-border pb-3">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-brand-600" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-clinical-text">
              {t('doctor.validationBar.title', 'Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả Sàng Lọc')}
            </h3>
            <p className="text-xs text-clinical-text-muted">
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
            icon={<Printer className="w-4 h-4" />}
          >
            {t('doctor.validationBar.printReport', 'In Phiếu Kết Quả')}
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage || t('doctor.validationBar.savedSuccess', 'Đã lưu kết luận lâm sàng và đồng bộ báo cáo sàng lọc thành công!')}</span>
        </div>
      )}

      {overrideError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between gap-2 animate-in fade-in">
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
      <div className="grid grid-cols-1 gap-4">
        {/* Left: Decision & Risk Override */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1.5">
              {t('doctor.validationBar.decisionLabel', 'Quyết định thẩm định chuyên môn:')}
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
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
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-amber-950 block mb-1">
                  {t('doctor.validationBar.adjustedCardio', 'Mức nguy cơ Tim mạch:')}
                </span>
                <div className="grid grid-cols-4 gap-1.5">
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
                      className={`py-1 rounded font-bold text-[11px] border transition-colors cursor-pointer ${
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
                <div className="grid grid-cols-4 gap-1.5">
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
                      className={`py-1 rounded font-bold text-[11px] border transition-colors cursor-pointer ${
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
                  className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1">
              {t('doctor.validationBar.icd10Label', 'Mã bệnh danh ICD-10 (phân tách dấu phẩy):')}
            </label>
            <input
              type="text"
              value={icd10Input}
              onChange={(e) => setIcd10Input(e.target.value)}
              placeholder="H35.0, I10, E11.9..."
              className="w-full h-9 px-3 text-xs rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono-data"
            />
          </div>
        </div>

        {/* Right: Notes & Recommendations */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-clinical-text mb-1">
                {t('doctor.validationBar.notesLabel', 'Ghi chú chẩn đoán lâm sàng:')}
              </label>
              <textarea
                rows={3}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder={isVi ? "Nhập chẩn đoán chuyên môn, hướng dẫn điều trị bổ sung..." : "Enter clinical findings, supplementary treatment guidelines..."}
                className="w-full text-xs p-3 rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-clinical-text mb-1">
                {isVi ? 'Khuyến nghị y khoa & Kế hoạch theo dõi:' : 'Recommendations & Follow-up:'}
              </label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder={isVi ? "Ví dụ: Tái khám chuyên khoa sau 3 tháng, kiểm soát huyết áp < 130/80..." : "e.g., Follow up in 3 months, monitor BP < 130/80..."}
                className="w-full text-xs p-2.5 rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

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
