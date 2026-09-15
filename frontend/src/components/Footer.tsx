import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t, isVi } = useLanguage();

  return (
    <footer className="w-full py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center bg-white border-t border-clinical-border mt-auto gap-3">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-clinical-text-secondary text-center sm:text-left">
        <span>{t('footer.copyright', isVi ? '© 2026 Hệ thống Tầm soát Võng mạc AURA.' : '© 2026 AURA Retinal Screening System.')}</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold border border-brand-100 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          {t('footer.securityCert', isVi ? 'Chuẩn HIPAA & ISO 27001' : 'HIPAA & ISO 27001 Compliant')}
        </span>
      </div>
      <div className="flex items-center gap-5 text-xs text-clinical-text-muted">
        <a href="#" className="hover:text-brand-600 transition-colors">
          {t('footer.privacyPolicy', isVi ? 'Chính sách Bảo mật' : 'Privacy Policy')}
        </a>
        <a href="#" className="hover:text-brand-600 transition-colors">
          {t('footer.termsOfService', isVi ? 'Điều khoản Sử dụng' : 'Terms of Service')}
        </a>
        <a href="#" className="hover:text-brand-600 transition-colors">
          {t('footer.supportCenter', isVi ? 'Trung tâm Hỗ trợ' : 'Support Center')}
        </a>
      </div>
    </footer>
  );
};
