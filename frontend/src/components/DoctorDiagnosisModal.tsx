import React, { useState, useMemo } from 'react';
import { DoctorFeedback, RiskLevel } from '../types/cds';
import { X, CheckCircle2, Edit3, XCircle, ShieldCheck, Tag, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClinicalSelect, ClinicalSelectOption } from './ui/ClinicalSelect';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';

interface DoctorDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  patientName: string;
  mrn: string;
  doctorName?: string;
  initialNotes?: string;
  initialCardioRisk?: RiskLevel;
  initialDrRisk?: RiskLevel;
  initialIcd10?: string[];
  initialFindings?: string;
  initialAiFindings?: string;
  onSaveFeedback: (feedback: DoctorFeedback) => void;
}

export const DoctorDiagnosisModal: React.FC<DoctorDiagnosisModalProps> = ({
  isOpen,
  onClose,
  analysisId,
  patientName,
  mrn,
  doctorName,
  initialNotes,
  initialCardioRisk,
  initialDrRisk,
  initialIcd10,
  initialFindings,
  initialAiFindings,
  onSaveFeedback,
}) => {
  const { user } = useAuth();
  const { t, isVi } = useLanguage();

  const signerName = doctorName || user?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');
  const signerId = user?.id || 'DOC-CURRENT';

  const rawAiFindings = initialAiFindings || initialFindings || '';
  const [findingsStatus, setFindingsStatus] = useState<'CONFIRMED' | 'EDITED'>('CONFIRMED');
  const [editableFindings, setEditableFindings] = useState<string>(initialFindings || initialAiFindings || '');

  const normalizeRisk = (lvl?: RiskLevel): RiskLevel => (lvl === 'Severe' ? 'Critical' : (lvl || 'Moderate'));
  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>('APPROVED');
  const [adjustedCardioRisk, setAdjustedCardioRisk] = useState<RiskLevel>(normalizeRisk(initialCardioRisk));
  const [adjustedDrRisk, setAdjustedDrRisk] = useState<RiskLevel>(normalizeRisk(initialDrRisk));
  const [selectedIcd10, setSelectedIcd10] = useState<string[]>(initialIcd10 || []);
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    initialNotes ||
      (isVi
        ? 'Bác sĩ chuyên khoa đã thẩm định và xác nhận kết quả phân tích sơ bộ từ hệ thống AURA AI.'
        : 'Specialist has validated and confirmed preliminary findings from AURA AI.')
  );

  const riskLevelOptions = useMemo<ClinicalSelectOption<RiskLevel>[]>(
    () => [
      { value: 'Low', label: isVi ? 'Nguy cơ thấp' : 'Low Risk', riskLevel: 'low' },
      { value: 'Moderate', label: isVi ? 'Nguy cơ trung bình' : 'Moderate Risk', riskLevel: 'moderate' },
      { value: 'High', label: isVi ? 'Nguy cơ cao' : 'High Risk', riskLevel: 'high' },
      { value: 'Critical', label: isVi ? 'Nguy kịch' : 'Critical Risk', riskLevel: 'critical' },
    ],
    [isVi]
  );

  const icd10Options = useMemo(
    () => [
      t('doctor.diagnosisModal.icdOptions.h350', 'H35.0 — Biến đổi mạch máu võng mạc'),
      t('doctor.diagnosisModal.icdOptions.e113', 'E11.3 — Bệnh võng mạc đái tháo đường'),
      t('doctor.diagnosisModal.icdOptions.i10', 'I10 — Tăng huyết áp vô căn'),
      t('doctor.diagnosisModal.icdOptions.h401', 'H40.1 — Glaucoma góc mở nguyên phát'),
      t('doctor.diagnosisModal.icdOptions.h353', 'H35.3 — Thoái hóa hoàng điểm tuổi già'),
    ],
    [t]
  );

  if (!isOpen) return null;

  const handleToggleIcd = (code: string) => {
    if (selectedIcd10.includes(code)) {
      setSelectedIcd10(selectedIcd10.filter((c) => c !== code));
    } else {
      setSelectedIcd10([...selectedIcd10, code]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDoctorFindings = findingsStatus === 'EDITED'
      ? editableFindings.trim()
      : (rawAiFindings || editableFindings.trim());

    const feedback: DoctorFeedback = {
      feedbackId: `FB-${Date.now().toString().slice(-6)}`,
      analysisId,
      doctorId: signerId,
      doctorName: signerName,
      decision,
      adjustedCardioRisk: decision === 'MODIFIED' ? adjustedCardioRisk : undefined,
      adjustedDrRisk: decision === 'MODIFIED' ? adjustedDrRisk : undefined,
      icd10Codes: selectedIcd10,
      clinicalNotes,
      doctorFindings: finalDoctorFindings,
      findingsStatus,
      reviewedAt: new Date().toISOString(),
    };
    onSaveFeedback(feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-clinical-border rounded-2xl max-w-2xl w-full shadow-medical-modal overflow-hidden space-y-0 my-8 animate-modal-enter">
        {/* Header */}
        <div className="bg-clinical-surface-subtle p-5 border-b border-clinical-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-clinical-text flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              {t('doctor.diagnosisModal.title', 'Thẩm định kết quả và Ký số kết luận lâm sàng')}
            </h2>
            <p className="text-xs text-clinical-text-muted mt-0.5">
              {t('doctor.diagnosisModal.patientLabel', 'Bệnh nhân')}: <strong className="text-clinical-text-secondary">{patientName}</strong> ({mrn}) | {t('doctor.diagnosisModal.analysisIdLabel', 'Mã phân tích')}: <span className="font-mono-data text-brand-700 font-semibold">{analysisId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            title={t('common.close', 'Đóng')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Decision Radio Bar */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text uppercase tracking-wider mb-2 font-mono-data">
              {t('doctor.diagnosisModal.decisionLabel', 'Quyết Định Lâm Sàng Của Bác Sĩ:')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDecision('APPROVED');
                  if (
                    !clinicalNotes ||
                    clinicalNotes.includes('bác bỏ kết quả phân tích') ||
                    clinicalNotes.includes('rejected preliminary AI')
                  ) {
                    setClinicalNotes(
                      isVi
                        ? 'Bác sĩ chuyên khoa đã thẩm định và xác nhận kết quả phân tích sơ bộ từ hệ thống AURA AI.'
                        : 'Specialist has validated and confirmed preliminary findings from AURA AI.'
                    );
                  }
                }}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-300/60 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/50 hover:text-emerald-700 hover:border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('doctor.diagnosisModal.doctorDecision.approve', 'Đồng Ý AI')}</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('MODIFIED')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  decision === 'MODIFIED'
                    ? 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-300/60 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50/50 hover:text-amber-800 hover:border-amber-200'
                }`}
              >
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>{t('doctor.diagnosisModal.doctorDecision.modify', 'Chỉnh Sửa')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('REJECTED');
                  if (
                    !clinicalNotes ||
                    clinicalNotes.includes('xác nhận kết quả phân tích') ||
                    clinicalNotes.includes('validated and confirmed')
                  ) {
                    setClinicalNotes(
                      isVi
                        ? 'Bác sĩ chuyên khoa đã thẩm định và bác bỏ kết quả phân tích sơ bộ từ AI do chất lượng ảnh hoặc bất tương đồng lâm sàng.'
                        : 'Specialist has reviewed and rejected preliminary AI findings due to image quality or clinical discordance.'
                    );
                  }
                }}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  decision === 'REJECTED'
                    ? 'bg-red-50 text-red-900 border-red-500 ring-2 ring-red-300/60 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-red-50/50 hover:text-red-800 hover:border-red-200'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>{t('doctor.diagnosisModal.doctorDecision.reject', 'Bác Bỏ')}</span>
              </button>
            </div>
          </div>

          {/* Conditional Adjustments */}
          {decision === 'MODIFIED' && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ClinicalSelect<RiskLevel>
                  label={t('doctor.diagnosisModal.adjustedCardio', 'Mức nguy cơ tim mạch hiệu chỉnh')}
                  value={adjustedCardioRisk}
                  onChange={setAdjustedCardioRisk}
                  options={riskLevelOptions}
                  size="sm"
                />
              </div>

              <div>
                <ClinicalSelect<RiskLevel>
                  label={t('doctor.diagnosisModal.adjustedDR', 'Phân độ võng mạc đái tháo đường hiệu chỉnh')}
                  value={adjustedDrRisk}
                  onChange={setAdjustedDrRisk}
                  options={riskLevelOptions}
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* AI Findings Validation & Correction (FR-15) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-semibold text-clinical-text uppercase tracking-wider flex items-center gap-1.5 font-mono-data">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                <span>{isVi ? 'Phát hiện do AI tạo ra:' : 'AI-Generated Findings:'}</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFindingsStatus('CONFIRMED');
                    if (rawAiFindings) setEditableFindings(rawAiFindings);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    findingsStatus === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isVi ? 'Xác nhận AI' : 'Confirm AI'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFindingsStatus('EDITED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    findingsStatus === 'EDITED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isVi ? 'Chỉnh sửa' : 'Edit'}</span>
                </button>
              </div>
            </div>

            {findingsStatus === 'CONFIRMED' ? (
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {rawAiFindings ||
                  (isVi
                    ? '• Hệ vi mạch võng mạc phân bố đều, cung mạch thái dương liên tục.\n• Không ghi nhận dấu hiệu xuất huyết võng mạc hay vi phình mạch.\n• Chưa phát hiện tổn thương vi tuần hoàn bệnh lý.'
                    : '• Retinal microvascular architecture intact, temporal arcades regular.\n• No overt retinal hemorrhages or microaneurysms detected.')}
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in">
                <textarea
                  rows={3}
                  value={editableFindings}
                  onChange={(e) => setEditableFindings(e.target.value)}
                  placeholder={isVi ? 'Nhập các phát hiện lâm sàng đã chỉnh sửa...' : 'Enter corrected clinical findings...'}
                  className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium leading-relaxed"
                />
                <p className="text-[10px] text-amber-800 italic">
                  * {isVi ? 'Hệ thống bảo toàn phát hiện AI gốc trong cơ sở dữ liệu để phục vụ kiểm toán.' : 'Original AI findings preserved for clinical audit trail.'}
                </p>
              </div>
            )}
          </div>

          {/* ICD-10 Selection */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text uppercase tracking-wider mb-2 font-mono-data flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-600" /> {t('doctor.diagnosisModal.icd10Title', 'Mã Bệnh Lý ICD-10 Quốc Tế:')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {icd10Options.map((code) => {
                const isChecked = selectedIcd10.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleToggleIcd(code)}
                    className={`px-3 py-2 rounded-xl text-xs text-left transition-all flex items-center gap-2 border cursor-pointer ${
                      isChecked
                        ? 'bg-brand-50 text-brand-700 border-brand-300 font-semibold shadow-xs'
                        : 'bg-clinical-surface-subtle text-clinical-text-secondary border-clinical-border hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[11px] font-bold shrink-0 ${isChecked ? 'bg-brand-600 text-white' : 'border border-slate-300 text-transparent'}`}>
                      ✓
                    </span>
                    <span className="truncate">{code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Diagnostic Rationale */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-600" /> {t('doctor.diagnosisModal.clinicalNotesLabel', 'Kết Luận Lâm Sàng Của Bác Sĩ:')}
            </label>
            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full p-3 bg-clinical-surface-subtle border border-clinical-border rounded-xl text-xs font-medium text-clinical-text transition focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          <MedicalDisclaimer variant="compact" />

          {/* Footer Submit */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-clinical-border-subtle pt-4">
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-clinical-text-secondary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('doctor.diagnosisModal.pkiSignatureLabel', 'Chữ ký số PKI:')} <strong className="text-clinical-text font-semibold">{signerName}</strong></span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-clinical-text-secondary font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {t('doctor.diagnosisModal.cancel', 'Hủy')}
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  decision === 'REJECTED'
                    ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-300/60'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {decision === 'REJECTED' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>
                  {decision === 'REJECTED'
                    ? (isVi ? 'Lưu và Ký Bác Bỏ Kết Quả' : 'Save & Sign Rejection')
                    : t('doctor.diagnosisModal.saveButton', 'Lưu và Ký duyệt hồ sơ')}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
