import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { VerifyEmailLink } from './components/auth/VerifyEmailLink';
import { AppLayout } from './layouts/AppLayout';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { LoadingState } from './components/ui/StateFeedback';
import { ErrorBoundary } from './components/ErrorBoundary';
import { parseSectionFromUrl } from './services/navigationService';

const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('aura_chunk_force_refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('aura_chunk_force_refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('aura_chunk_force_refreshed', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

const PatientPortalPage = lazyWithRetry(() => import('./pages/PatientPortalPage').then(m => ({ default: m.PatientPortalPage })));
const CDSDashboardPage = lazyWithRetry(() => import('./pages/CDSDashboardPage').then(m => ({ default: m.CDSDashboardPage })));
const ClinicPortalPage = lazyWithRetry(() => import('./pages/ClinicPortalPage').then(m => ({ default: m.ClinicPortalPage })));
const AdminAuditLogsPage = lazyWithRetry(() => import('./pages/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })));
const VnPayReturnPage = lazyWithRetry(() => import('./pages/VnPayReturnPage').then(m => ({ default: m.VnPayReturnPage })));

const INVALID_SECTIONS = ['login', 'register', 'verify-email', 'auth', 'oauth', 'reset-password'];

export const App: React.FC = () => {
  const { user: currentUser, loading, logout } = useAuth();
  const { t, isVi } = useLanguage();

  const getRouteForSection = useCallback((role: string | undefined, section: string): string => {
    if (!role) return section === 'dashboard' ? '/' : `/${section}`;
    return section === 'dashboard' ? `/${role}` : `/${role}/${section}`;
  }, []);

  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = parseSectionFromUrl(window.location.pathname);
      if (fromUrl && fromUrl !== 'dashboard' && !INVALID_SECTIONS.includes(fromUrl)) {
        return fromUrl;
      }
      try {
        const saved = sessionStorage.getItem('aura_active_section');
        if (saved && saved !== 'dashboard' && !INVALID_SECTIONS.includes(saved)) {
          return saved;
        }
      } catch {}
      return 'dashboard';
    }
    return 'dashboard';
  });

  const safeScrollTo = (top: number) => {
    try {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top, behavior: 'auto' });
      }
    } catch {}
  };

  const handleSelectSection = useCallback((section: string) => {
    const safeSection = INVALID_SECTIONS.includes(section) ? 'dashboard' : section;
    setActiveSection(safeSection);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('aura_active_section', safeSection);
        const targetUrl = getRouteForSection(currentUser?.role, safeSection);
        if (window.location.pathname !== targetUrl) {
          window.history.pushState({ section: safeSection }, '', targetUrl);
        }
        safeScrollTo(0);
      } catch (err) {
        console.warn('Navigation state sync failed:', err);
      }
    }
  }, [currentUser?.role, getRouteForSection]);

  useEffect(() => {
    const onAuraNavigate = (e: Event) => {
      const detail = (e as CustomEvent<{ url?: string; section?: string }>).detail;
      const raw = detail?.section || (detail?.url ? parseSectionFromUrl(detail.url) : undefined);
      if (raw) {
        const safe = INVALID_SECTIONS.includes(raw) ? 'dashboard' : raw;
        setActiveSection(safe);
        try {
          sessionStorage.setItem('aura_active_section', safe);
        } catch {}
      }
    };
    const onPopState = () => {
      const raw = parseSectionFromUrl(window.location.pathname);
      const safe = INVALID_SECTIONS.includes(raw) ? 'dashboard' : raw;
      setActiveSection(safe);
      try {
        sessionStorage.setItem('aura_active_section', safe);
      } catch {}
    };
    window.addEventListener('aura-navigate', onAuraNavigate);
    window.addEventListener('aura:navigate', onAuraNavigate);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('aura-navigate', onAuraNavigate);
      window.removeEventListener('aura:navigate', onAuraNavigate);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  // Synchronize browser address bar with current activeSection on initial mount / reload
  useEffect(() => {
    if (currentUser?.role && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const targetUrl = getRouteForSection(currentUser.role, activeSection);
      if (currentPath === '/' || currentPath === `/${currentUser.role}` || currentPath === `/${currentUser.role}/`) {
        if (activeSection !== 'dashboard') {
          window.history.replaceState({ section: activeSection }, '', targetUrl);
        }
      }
    }
  }, [currentUser?.role, activeSection, getRouteForSection]);

  // Scroll restoration across page reloads (F5)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      try {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        sessionStorage.setItem(`aura_scroll_${activeSection}`, String(y));
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    try {
      const savedScroll = sessionStorage.getItem(`aura_scroll_${activeSection}`);
      if (savedScroll) {
        const y = parseInt(savedScroll, 10);
        if (!isNaN(y) && y > 0) {
          const timer = setTimeout(() => {
            safeScrollTo(y);
          }, 80);
          return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeunload', handleBeforeUnload);
          };
        }
      }
    } catch {}

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeSection]);

  if (window.location.pathname.startsWith('/billing/vnpay-return')) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F4F7FC] text-slate-900 font-sans"><LoadingState message={t('common.loading', isVi ? 'Đang tải...' : 'Loading...')} /></div>}>
        <VnPayReturnPage />
      </Suspense>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FC] text-slate-900 font-sans">
        <LoadingState message={t('common.loadingInit', isVi ? 'Đang khởi tạo không gian làm việc AURA...' : 'Initializing AURA clinical workspace...')} />
      </div>
    );
  }

  if (window.location.pathname === '/verify-email') {
    return <VerifyEmailLink />;
  }

  if (!currentUser) return <LoginPage />;

  const handleLogout = useCallback(async () => {
    try {
      sessionStorage.removeItem('aura_active_section');
      sessionStorage.removeItem('aura_patient_analysis_result');
      sessionStorage.removeItem('aura_doctor_selected_patient_id');
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('aura_scroll_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}
    await logout();
  }, [logout]);

  const portalContent = (() => {
    switch (currentUser.role) {
      case 'patient':
        return (
          <PatientPortalPage
            user={currentUser}
            activeView={activeSection}
            onNavigate={handleSelectSection}
          />
        );
      case 'doctor':
        return (
          <CDSDashboardPage
            activeSection={activeSection}
            onNavigate={handleSelectSection}
          />
        );
      case 'clinic':
        return <ClinicPortalPage activeView={activeSection} onNavigate={handleSelectSection} />;
      case 'admin':
        return <AdminAuditLogsPage activeView={activeSection} />;
      default:
        return (
          <PatientPortalPage
            user={currentUser}
            activeView={activeSection}
            onNavigate={handleSelectSection}
          />
        );
    }
  })();

  return (
    <ErrorBoundary fallbackTitle={isVi ? "Sự cố không gian làm việc lâm sàng AURA" : "AURA Clinical Workspace Error"}>
      <AppLayout
        currentUser={currentUser}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onLogout={handleLogout}
      >
        <ErrorBoundary fallbackTitle={isVi ? "Sự cố hiển thị màn hình làm việc lâm sàng" : "Clinical Portal Display Error"}>
          <Suspense fallback={<div className="p-8 text-center"><LoadingState message={t('common.loading', isVi ? 'Đang tải...' : 'Loading...')} /></div>}>
            {portalContent}
          </Suspense>
        </ErrorBoundary>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default App;
