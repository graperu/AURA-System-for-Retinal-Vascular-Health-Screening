import React, { useState } from 'react';
import { BrainCircuit, Eye, ScanEye, ShieldCheck } from 'lucide-react';
import { DoctorArtwork } from './DoctorArtwork';
import { useLanguage } from '../../context/LanguageContext';

export const AuthHeroPanel: React.FC = () => {
  const [logoFailed, setLogoFailed] = useState(false);
  const { t, isVi } = useLanguage();

  return (
    <section
      className="auth-hero relative overflow-hidden bg-gradient-to-br from-[#63b8ff] via-[#3978f6] to-[#5264e8] text-white"
      aria-label={isVi ? "Giới thiệu AURA" : "AURA Introduction"}
    >
      <div className="absolute -left-16 top-1/3 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="auth-brand">
        {!logoFailed ? (
          <img
            src="/brand/aura-logo.png"
            alt="AURA"
            onError={() => setLogoFailed(true)}
            className="auth-brand__logo"
          />
        ) : (
          <Eye className="auth-brand__fallback" aria-hidden="true" />
        )}
      </div>

      <div className="auth-artwork-stage">
        <div className="retina-orbit" aria-hidden="true">
          <svg viewBox="0 0 340 340">
            <circle cx="170" cy="170" r="142" />
            <circle cx="170" cy="170" r="108" />
            <circle cx="170" cy="170" r="72" />
            <path d="M170 98c-20 30-42 43-77 49m77-49c22 29 46 42 79 48M170 242c-17-28-38-42-71-52m71 52c19-27 42-41 73-51" />
          </svg>
        </div>
        <div className="auth-feature-pill auth-feature-pill--ai">
          <BrainCircuit aria-hidden="true" />
          {t('auth.authHeroPanel.aiScreeningSupport', isVi ? 'AI hỗ trợ sàng lọc' : 'AI Screening Support')}
        </div>
        <DoctorArtwork />
        <div className="auth-feature-pill auth-feature-pill--retina">
          <ScanEye aria-hidden="true" />
          {t('auth.authHeroPanel.retinalAnalysis', isVi ? 'Phân tích ảnh võng mạc' : 'Retinal Image Analysis')}
        </div>
      </div>

      <p className="auth-hero-warning">
        <ShieldCheck aria-hidden="true" />
        {t('auth.authHeroPanel.medicalWarning', isVi ? 'Kết quả chỉ hỗ trợ sàng lọc và không thay thế chẩn đoán của bác sĩ.' : 'Results are for screening support only and do not replace professional doctor diagnosis.')}
      </p>
    </section>
  );
};
