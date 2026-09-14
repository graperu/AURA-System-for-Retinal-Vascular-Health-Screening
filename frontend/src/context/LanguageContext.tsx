import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SupportedLanguage, translations, ClinicalTranslationSchema } from '../i18n/translations';

const STORAGE_KEY = 'aura_language';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, fallback?: string) => string;
  isVi: boolean;
  isEn: boolean;
}

function resolvePath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object' || !path || typeof path !== 'string') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      return undefined;
    }
    if (
      current === undefined ||
      current === null ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

const defaultTranslate = (lang: SupportedLanguage, path: string, fallback?: string): string => {
  const currentLangObj = translations[lang] || translations.vi;
  const resolved = resolvePath(currentLangObj, path);
  if (typeof resolved === 'string') return resolved;
  if (resolved !== undefined && resolved !== null) return String(resolved);

  // Fallback to Vietnamese if English key is missing
  if (lang !== 'vi') {
    const viResolved = resolvePath(translations.vi, path);
    if (typeof viResolved === 'string') return viResolved;
    if (viResolved !== undefined && viResolved !== null) return String(viResolved);
  }

  return fallback !== undefined ? fallback : path;
};

const defaultContextValue: LanguageContextType = {
  language: 'vi',
  setLanguage: () => undefined,
  t: (path: string, fallback?: string) => defaultTranslate('vi', path, fallback),
  isVi: true,
  isEn: false,
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'vi') return stored;
    } catch {
      // LocalStorage might be restricted
    }
    return 'vi';
  });

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = newLang;
      }
    } catch (e) {
      console.warn('Could not persist language preference:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      return defaultTranslate(language, path, fallback);
    },
    [language]
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      t,
      isVi: language === 'vi',
      isEn: language === 'en',
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};
