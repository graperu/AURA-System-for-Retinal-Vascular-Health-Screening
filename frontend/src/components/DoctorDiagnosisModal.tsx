import React, { useState } from 'react';
import { DoctorFeedback, RiskLevel } from '../types/cds';
import { X, CheckCircle2, Edit3, XCircle, ShieldCheck, Tag, FileText, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClinicalSelect, ClinicalSelectOption } from './ui/ClinicalSelect';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';

const RISK_LEVEL_OPTIONS: ClinicalSelectOption<RiskLevel>[] = [
  { value: 'Low', label: 'Low — Thấp', riskLevel: 'low' },
  { value: 'Moderate', label: 'Moderate — Trung Bình', riskLevel: 'moderate' },
  { value: 'High', label: 'High — Cao', riskLevel: 'high' },
  { value: 'Critical', label: 'Critical — Nguy Kịch', riskLevel: 'critical' },
];

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
  onSaveFeedback,
}) => {
  const { user } = useAuth();
  const signerName = doctorName || user?.name || 'Bác sĩ chuyên khoa';
  const signerId = user?.id || 'DOC-CURRENT';

  const normalizeRisk = (lvl?: RiskLevel): RiskLevel => (lvl === 'Severe' ? 'Critical' : (lvl || 'Moderate'));
  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>('APPROVED');
  const [adjustedCardioRisk, setAdjustedCardioRisk] = useState<RiskLevel>(normalizeRisk(initialCardioRisk));
  const [adjustedDrRisk, setAdjustedDrRisk] = useState<RiskLevel>(normalizeRisk(initialDrRisk));
  const [selectedIcd10, setSelectedIcd10] = useState<string[]>(initialIcd10 || []);
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    initialNotes || 'Bác sĩ chuyên khoa đã thẩm định và xác nhận kết quả phân tích sơ bộ từ hệ thống AURA AI.'
  );

  if (!isOpen) return null;

  const icd10Options = [
    'H35.0 — Biến đổi mạch máu võng mạc (Retinal vascular changes)',
    'E11.3 — Bệnh võng mạc đái tháo đường (Diabetic retinopathy)',
    'I10 — Tăng huyết áp vô căn (Essential hypertension)',
    'H40.1 — Glaucoma góc mở nguyên phát (Primary open-angle glaucoma)',
    'H35.3 — Thoái hóa hoàng điểm tuổi già (Age-related macular degeneration)',
  ];

  const handleToggleIcd = (code: string) => {
    if (selectedIcd10.includes(code)) {
      setSelectedIcd10(selectedIcd10.filter((c) => c !== code));
    } else {
      setSelectedIcd10([...selectedIcd10, code]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              Hộp Thoại Xác Nhận / Chỉnh Sửa Chẩn Đoán AI (Doctor Sign-Off)
            </h2>
            <p className="text-xs text-clinical-text-muted mt-0.5">
              Bệnh nhân: <strong className="text-clinical-text-secondary">{patientName}</strong> ({mrn}) | Mã phân tích: <span className="font-mono-data text-brand-700 font-semibold">{analysisId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Decision Radio Bar */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text uppercase tracking-wider mb-2 font-mono-data">
              Quyết Định Lâm Sàng Của Bác Sĩ:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-300/60 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/50 hover:text-emerald-700 hover:border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đồng Ý AI</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('MODIFIED')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  decision === 'MODIFIED'
                    ? 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-300/60 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50/50 hover:text-amber-800 hover:border-amber-200'
                }`}
              >
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Chỉnh Sửa</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  decision === 'REJECTED'
                    ? 'bg-red-50 text-red-900 border-red-500 ring-2 ring-red-300/60 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-red-50/50 hover:text-red-800 hover:border-red-200'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Bác Bỏ</span>
              </button>
            </div>
          </div>

          {/* Conditional Adjustments */}
          {decision === 'MODIFIED' && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ClinicalSelect<RiskLevel>
                  label="Mức Nguy Cơ Tim Mạch Mới:"
                  value={adjustedCardioRisk}
                  onChange={setAdjustedCardioRisk}
                  options={RISK_LEVEL_OPTIONS}
                  size="sm"
                />
              </div>

              <div>
                <ClinicalSelect<RiskLevel>
                  label="Mức Võng Mạc Đái Tháo Đường Mới:"
                  value={adjustedDrRisk}
                  onChange={setAdjustedDrRisk}
                  options={RISK_LEVEL_OPTIONS}
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* ICD-10 Selection */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text uppercase tracking-wider mb-2 font-mono-data flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-600" /> Mã Bệnh Lý ICD-10 Quốc Tế:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {icd10Options.map((code) => {
                const isChecked = selectedIcd10.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleToggleIcd(code)}
                    className={`px-3 py-2 rounded-xl text-xs text-left transition-all flex items-center gap-2 border ${
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
              <FileText className="w-4 h-4 text-brand-600" /> Kết Luận Lâm Sàng Của Bác Sĩ:
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
              <span>Chữ ký số PKI: <strong className="text-clinical-text font-semibold">{signerName}</strong></span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-clinical-text-secondary font-semibold rounded-xl text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> Lưu & Ký Báo Cáo EMR
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
