import React, { useState } from 'react';
import { DoctorFeedback, RiskLevel } from '../types/cds';
import { CheckCircle2, Edit3, XCircle, FileText, Download, ShieldCheck, Tag, ExternalLink } from 'lucide-react';
import { DoctorDiagnosisModal } from './DoctorDiagnosisModal';

interface ClinicalValidationBarProps {
  analysisId: string;
  patientName?: string;
  mrn?: string;
  onSaveFeedback: (feedback: DoctorFeedback) => void;
}

export const ClinicalValidationBar: React.FC<ClinicalValidationBarProps> = ({
  analysisId,
  patientName = 'Trần Văn Hoàng',
  mrn = 'MRN-2026-0941',
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
  const [isSaved, setIsSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleExportPdf = () => {
    alert('Xuất báo cáo chẩn đoán Y tế chuẩn PDF / DICOM SR thành công!');
  };

  return (
    <>
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#134E4A] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả AI (Doctor Sign-Off)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xác nhận hoặc điều chỉnh đánh giá của AI trước khi lưu vào Hồ sơ Bệnh án Điện tử (EMR/HIS).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#F0FDFA] border border-[#0891B2] text-[#0891B2] rounded-lg text-xs font-bold hover:bg-cyan-50 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" /> Mở Hộp Thoại Chẩn Đoán Chi Tiết
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#0891B2]" /> Xuất Báo Cáo PDF
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Decision Radio Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono-data">
              Quyết Định Lâm Sàng Của Bác Sĩ (Physician Validation Decision):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-50 text-[#16A34A] border-[#16A34A] ring-2 ring-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Đồng Ý Kết Quả AI (Approve)
              </button>

              <button
                type="button"
                onClick={() => setDecision('MODIFIED')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  decision === 'MODIFIED'
                    ? 'bg-amber-50 text-amber-800 border-amber-500 ring-2 ring-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Edit3 className="w-4 h-4" /> Chỉnh Sửa Nguy Cơ (Edit)
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  decision === 'REJECTED'
                    ? 'bg-red-50 text-red-800 border-red-500 ring-2 ring-red-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4" /> Bác Bỏ Kết Quả (Reject)
              </button>
            </div>
          </div>

          {/* Conditional Adjustments */}
          {decision === 'MODIFIED' && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Điều chỉnh Mức Nguy Cơ Tim Mạch:
                </label>
                <select
                  value={adjustedCardioRisk}
                  onChange={(e) => setAdjustedCardioRisk(e.target.value as RiskLevel)}
                  className="w-full bg-white border border-amber-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="Low">Low — Thấp</option>
                  <option value="Moderate">Moderate — Trung Bình</option>
                  <option value="High">High — Cao</option>
                  <option value="Severe">Severe — Nghiêm Trọng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Điều chỉnh Mức Bệnh Võng Mạc Đái Tháo Đường (DR):
                </label>
                <select
                  value={adjustedDrRisk}
                  onChange={(e) => setAdjustedDrRisk(e.target.value as RiskLevel)}
                  className="w-full bg-white border border-amber-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 outline-none"
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
              <Tag className="w-3.5 h-3.5 text-[#0891B2]" /> Mã Bệnh Lý Quốc Tế ICD-10 Gắn Vào Báo Cáo:
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

          {/* Diagnostic Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0891B2]" /> Ghi Chú Chẩn Đoán Của Bác Sĩ Chuyên Khoa:
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Nhập nhận định lâm sàng, hướng xử trí hoặc hẹn tái khám..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              Ký số PKI: <strong>BS. CKII Nguyễn Thị Thanh</strong> (CCHN: 009822)
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs shadow-medical-sm flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Lưu Thẩm Định & Ký Báo Cáo EMR
            </button>
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-[#16A34A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Đã lưu phê duyệt chẩn đoán lâm sàng và mã hóa PKI RSA2048 thành công!
            </div>
          )}
        </form>
      </div>

      {/* Interactive Modal Popup for Doctor Confirmation & Modification */}
      <DoctorDiagnosisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysisId={analysisId}
        patientName={patientName}
        mrn={mrn}
        onSaveFeedback={onSaveFeedback}
      />
    </>
  );
};
