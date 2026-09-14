import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type MedicalDisclaimerVariant = 'banner' | 'compact' | 'subtle';

export interface MedicalDisclaimerProps {
  variant?: MedicalDisclaimerVariant;
  className?: string;
  showIcon?: boolean;
}

export const MANDATORY_MEDICAL_DISCLAIMER_VI =
  'Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.';

export const MANDATORY_MEDICAL_DISCLAIMER_EN =
  'AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist.';

// Backward compatibility export
export const MANDATORY_MEDICAL_DISCLAIMER = MANDATORY_MEDICAL_DISCLAIMER_VI;

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  variant = 'compact',
  className = '',
  showIcon = true,
}) => {
  const { t, isVi } = useLanguage();

  const disclaimerText = t(
    'common.medicalDisclaimerText',
    isVi ? MANDATORY_MEDICAL_DISCLAIMER_VI : MANDATORY_MEDICAL_DISCLAIMER_EN
  );
  const bannerTitle = t(
    'common.medicalDisclaimerTitle',
    isVi ? 'Tuyên bố Miễn trừ Y tế' : 'Medical Safety Disclaimer'
  );
  const noticeLabel = t(
    'common.mandatoryNotice',
    isVi ? 'Lưu ý y khoa bắt buộc:' : 'Mandatory Clinical Notice:'
  );
  const ariaLabel = isVi ? 'Cảnh báo an toàn y khoa CDS' : 'CDS Medical Safety Disclaimer';

  if (variant === 'banner') {
    return (
      <div
        role="note"
        aria-label={ariaLabel}
        className={`p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs ${className}`}
      >
        {showIcon && <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />}
        <div className="leading-relaxed">
          <strong className="font-bold block mb-0.5 text-amber-950">
            {bannerTitle}:
          </strong>
          <span>{disclaimerText}</span>
        </div>
      </div>
    );
  }

  if (variant === 'subtle') {
    return (
      <div
        role="note"
        aria-label={ariaLabel}
        className={`p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2 leading-relaxed ${className}`}
      >
        {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />}
        <span>
          <strong className="font-semibold text-slate-700">{noticeLabel}</strong> {disclaimerText}
        </span>
      </div>
    );
  }

  // Default: 'compact'
  return (
    <div
      role="note"
      aria-label={ariaLabel}
      className={`p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed ${className}`}
    >
      {showIcon && <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />}
      <p>
        <strong className="font-semibold text-amber-950">{noticeLabel}</strong> {disclaimerText}
      </p>
    </div>
  );
};
