import React, { useState } from 'react';
import { DoctorFeedback, RiskLevel } from '../types/cds';
import { X, CheckCircle2, Edit3, XCircle, ShieldCheck, Tag, FileText, Download } from 'lucide-react';

interface DoctorDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  patientName: string;
  mrn: string;
  onSaveFeedback: (feedback: DoctorFeedback) => void;
}

export const DoctorDiagnosisModal: React.FC<DoctorDiagnosisModalProps> = ({
  isOpen,
  onClose,
  analysisId,
  patientName,
  mrn,
  onSaveFeedback,
}) => {
  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>('APPROVED');
  const [adjustedCardioRisk, setAdjustedCardioRisk] = useState<RiskLevel>('High');
  const [adjustedDrRisk, setAdjustedDrRisk] = useState<RiskLevel>('Moderate');
  const [selectedIcd10, setSelectedIcd10] = useState<string[]>([
    'H35.0 — Biến đổi mạch máu võng mạc (Retinal vascular changes)',
    'E11.3 — Bệnh võng mạc đái tháo đường (Diabetic retinopathy)',
  ]);
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Bệnh nhân có biểu hiện co hẹp động mạch võng mạc diện rộng (Gunn sign dương tính) phù hợp với tăng huyết áp tâm thu 154 mmHg. Đồng ý với kết quả gợi ý nguy cơ tim mạch cao của AI. Khuyến cáo khám chuyên khoa Tim mạch và theo dõi chỉ số HbA1c sau 3 tháng.'
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
      doctorId: 'DOC-9912',
      doctorName: 'BS. CKII Nguyễn Thị Thanh',
      decision,
      adjustedCardioRisk: decision === 'MODIFIED' ? adjustedCardioRisk : undefined,
      adjustedDrRisk: decision === 'MODIFIED' ? adjustedDrRisk : undefined,
      icd10Codes: selectedIcd10,
      clinicalNotes,
      reviewedAt: new Date().toISOString(),
      signedDigitalSignature: 'RSA2048-AURA-DOC-SIGN-9912-VERIFIED',
    };
    onSaveFeedback(feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-[#CCFBF1] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden space-y-0 my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#F0FDFA] p-5 border-b border-[#CCFBF1] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#134E4A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0891B2]" />
              Hộp Thoại Xác Nhận / Chỉnh Sửa Chẩn Đoán AI (Doctor Sign-Off)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bệnh nhân: <strong className="text-slate-800">{patientName}</strong> ({mrn}) | Mã phân tích: <span className="font-mono-data text-[#0891B2]">{analysisId}</span>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono-data">
              Quyết Định Lâm Sàng Của Bác Sĩ:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-50 text-[#16A34A] border-[#16A34A] ring-2 ring-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Đồng Ý AI
              </button>

              <button
                type="button"
                onClick={() => setDecision('MODIFIED')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  decision === 'MODIFIED'
                    ? 'bg-amber-50 text-amber-800 border-amber-500 ring-2 ring-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Edit3 className="w-4 h-4" /> Chỉnh Sửa
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  decision === 'REJECTED'
                    ? 'bg-red-50 text-red-800 border-red-500 ring-2 ring-red-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4" /> Bác Bỏ
              </button>
            </div>
          </div>

          {/* Conditional Adjustments */}
          {decision === 'MODIFIED' && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Mức Nguy Cơ Tim Mạch Mới:
                </label>
                <select
                  value={adjustedCardioRisk}
                  onChange={(e) => setAdjustedCardioRisk(e.target.value as RiskLevel)}
                  className="w-full bg-white border border-amber-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="Low">Low — Thấp</option>
                  <option value="Moderate">Moderate — Trung Bình</option>
                  <option value="High">High — Cao</option>
                  <option value="Severe">Severe — Nghiêm Trọng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Mức Võng Mạc Đái Tháo Đường Mới:
                </label>
                <select
                  value={adjustedDrRisk}
                  onChange={(e) => setAdjustedDrRisk(e.target.value as RiskLevel)}
                  className="w-full bg-white border border-amber-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="Low">Low — Thấp</option>
                  <option value="Moderate">Moderate — Trung Bình</option>
                  <option value="High">High — Cao</option>
                  <option value="Severe">Severe — Nghiêm Trọng</option>
                </select>
              </div>
            </div>
          )}

          {/* ICD-10 Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono-data flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#0891B2]" /> Mã Bệnh Lý ICD-10 Quốc Tế:
            </label>
            <div className="flex flex-wrap gap-2">
              {icd10Options.map((code) => {
                const isChecked = selectedIcd10.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleToggleIcd(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isChecked
                        ? 'bg-[#F0FDFA] text-[#0891B2] border border-[#0891B2] font-bold'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '} {code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Diagnostic Rationale */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0891B2]" /> Kết Luận Lâm Sàng Của Bác Sĩ:
            </label>
            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2]"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              Ký số PKI: <strong>BS. CKII Nguyễn Thị Thanh</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2"
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
