import React, { useState } from 'react';
import {
  CheckCircle2,
  FileSignature,
  Save,
  Clock,
  Printer,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { DoctorFeedback, RiskLevel } from '../types/cds';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export interface ClinicalValidationBarProps {
  analysisId: string;
  onSaveFeedback: (feedback: DoctorFeedback) => Promise<void>;
  onOpenReportModal?: () => void;
  isSubmitting?: boolean;
}

export const ClinicalValidationBar: React.FC<ClinicalValidationBarProps> = ({
  analysisId,
  onSaveFeedback,
  onOpenReportModal,
  isSubmitting = false,
}) => {
  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>('APPROVED');
  const [adjustedCardioRisk, setAdjustedCardioRisk] = useState<RiskLevel>('Moderate');
  const [adjustedDrRisk, setAdjustedDrRisk] = useState<RiskLevel>('Low');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [icd10Input, setIcd10Input] = useState<string>('H35.0');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const handleSave = async () => {
    setSaving(true);
    const feedback: DoctorFeedback = {
      feedbackId: `FB-${Date.now()}`,
      analysisId,
      doctorId: 'DOC-CURRENT',
      doctorName: 'BS. CKII Nguyễn Thị Thanh',
      decision,
      adjustedCardioRisk: decision === 'MODIFIED' ? adjustedCardioRisk : undefined,
      adjustedDrRisk: decision === 'MODIFIED' ? adjustedDrRisk : undefined,
      icd10Codes: icd10Input.split(',').map((c) => c.trim()).filter(Boolean),
      clinicalNotes: doctorNotes,
      reviewedAt: new Date().toISOString(),
      signedDigitalSignature: 'SHA256-AURA-SIGNED',
    };

    try {
      await onSaveFeedback(feedback);
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
              Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả Sàng Lọc (Doctor Sign-Off)
            </h3>
            <p className="text-xs text-clinical-text-muted">
              Bác sĩ xác nhận độ chính xác của AI hoặc điều chỉnh mức độ rủi ro theo chuyên môn.
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
            In Phiếu Kết Quả
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Đã lưu kết luận lâm sàng và đồng bộ báo cáo sàng lọc thành công!</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Decision & Risk Override */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1.5">
              Quyết định thẩm định chuyên môn:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'APPROVED', label: 'Chấp thuận AI' },
                { id: 'MODIFIED', label: 'Hiệu chỉnh nguy cơ' },
                { id: 'REJECTED', label: 'Bác bỏ kết quả' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDecision(opt.id as any)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-colors ${
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
                <span className="font-semibold text-amber-950 block mb-1">Hiệu chỉnh nguy cơ Tim mạch:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Low', 'Moderate', 'High', 'Severe'] as RiskLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAdjustedCardioRisk(lvl)}
                      className={`py-1 rounded font-bold text-[11px] border transition-colors ${
                        adjustedCardioRisk === lvl
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-amber-950 block mb-1">Hiệu chỉnh nguy cơ Võng mạc ĐTĐ:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Low', 'Moderate', 'High', 'Severe'] as RiskLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAdjustedDrRisk(lvl)}
                      className={`py-1 rounded font-bold text-[11px] border transition-colors ${
                        adjustedDrRisk === lvl
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1">
              Mã phân loại bệnh quốc tế ICD-10 (ngăn cách bằng dấu phẩy):
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

        {/* Right: Notes */}
        <div className="space-y-3 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1">
              Ghi chú lâm sàng & Kết luận của Bác sĩ:
            </label>
            <textarea
              rows={4}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Nhập chẩn đoán chuyên môn, hướng dẫn điều trị bổ sung..."
              className="w-full text-xs p-3 rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={saving || isSubmitting}
              onClick={handleSave}
              icon={<Save className="w-4 h-4" />}
            >
              Lưu & Ký Duyệt Kết Quả
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
