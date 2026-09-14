import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface LanguageSwitcherProps {
  className?: string;
  isDarkRoom?: boolean;
  variant?: 'pill' | 'button' | 'compact';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  isDarkRoom = false,
  variant = 'pill',
}) => {
  const { language, setLanguage, isVi } = useLanguage();

  const handleToggle = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const nextLanguageLabel = isVi ? 'Switch to English' : 'Chuyển sang Tiếng Việt';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={nextLanguageLabel}
        aria-label={nextLanguageLabel}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
          isDarkRoom
            ? 'bg-slate-800/90 border-slate-700 text-cyan-300 hover:bg-slate-700 hover:border-cyan-500/50'
            : 'bg-white border-clinical-border text-clinical-text hover:bg-brand-50 hover:text-brand-700 shadow-xs'
        } ${className}`}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span className="font-mono text-[11px] font-bold tracking-wider">
          {language.toUpperCase()}
        </span>
      </button>
    );
  }

  // Pill variant (default)
  return (
    <button
      type="button"
      onClick={handleToggle}
      title={nextLanguageLabel}
      aria-label={nextLanguageLabel}
      className={`group relative inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 cursor-pointer ${
        isDarkRoom
          ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800'
          : 'bg-white border-clinical-border text-clinical-text-secondary hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 shadow-xs'
      } ${className}`}
    >
      <Globe
        className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:rotate-12 ${
          isDarkRoom ? 'text-cyan-400' : 'text-brand-600'
        }`}
      />
      <div className="flex items-center gap-1 font-mono text-[11px]">
        <span
          className={`px-1.5 py-0.5 rounded transition-colors ${
            language === 'vi'
              ? isDarkRoom
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60'
                : 'bg-brand-100/90 text-brand-800 font-bold'
              : 'text-slate-400 group-hover:text-slate-600 font-medium'
          }`}
        >
          VI
        </span>
        <span className="text-slate-300 text-[10px]">/</span>
        <span
          className={`px-1.5 py-0.5 rounded transition-colors ${
            language === 'en'
              ? isDarkRoom
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60'
                : 'bg-brand-100/90 text-brand-800 font-bold'
              : 'text-slate-400 group-hover:text-slate-600 font-medium'
          }`}
        >
          EN
        </span>
      </div>
    </button>
  );
};
