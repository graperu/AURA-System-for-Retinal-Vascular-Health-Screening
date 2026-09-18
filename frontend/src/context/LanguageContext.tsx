import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SupportedLanguage, translations } from '../i18n/translations';

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
  const currentLangObj = lang === 'en' ? translations.en : translations.vi;
  const resolved = resolvePath(currentLangObj, path);
  if (typeof resolved === 'string') return resolved;
  if (resolved !== undefined && resolved !== null) return String(resolved);

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
  // Ensure default starts with 'vi' and resets invalid/external localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== 'vi') {
        localStorage.setItem(STORAGE_KEY, 'vi');
      }
    }
  } catch {
    // LocalStorage restricted
  }

  const [language, setLanguageState] = useState<SupportedLanguage>('vi');

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (newLang !== 'vi' && newLang !== 'en') return;
    setLanguageState(newLang);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newLang);
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = newLang;
      }
    } catch {
      // ignore
    }
  }, []);

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
