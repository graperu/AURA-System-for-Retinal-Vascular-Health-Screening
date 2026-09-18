import React, { useState, Suspense, lazy } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { VerifyEmailLink } from './components/auth/VerifyEmailLink';
import { AppLayout } from './layouts/AppLayout';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { LoadingState } from './components/ui/StateFeedback';
import { ErrorBoundary } from './components/ErrorBoundary';

const PatientPortalPage = lazy(() => import('./pages/PatientPortalPage').then(m => ({ default: m.PatientPortalPage })));
const CDSDashboardPage = lazy(() => import('./pages/CDSDashboardPage').then(m => ({ default: m.CDSDashboardPage })));
const ClinicPortalPage = lazy(() => import('./pages/ClinicPortalPage').then(m => ({ default: m.ClinicPortalPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })));
const VnPayReturnPage = lazy(() => import('./pages/VnPayReturnPage').then(m => ({ default: m.VnPayReturnPage })));

export const App: React.FC = () => {
  const { user: currentUser, loading, logout } = useAuth();
  const { t, isVi } = useLanguage();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
  };

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

  const portalContent = (() => {
    switch (currentUser.role) {
      case 'patient':
        return (
          <PatientPortalPage
            user={currentUser}
            activeView={activeSection}
            onNavigate={setActiveSection}
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
            onNavigate={setActiveSection}
          />
        );
    }
  })();

  return (
    <AppLayout
      currentUser={currentUser}
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      onLogout={() => void logout()}
    >
      <ErrorBoundary fallbackTitle={isVi ? "Sự cố hiển thị màn hình làm việc lâm sàng" : "Clinical Portal Display Error"}>
        <Suspense fallback={<div className="p-8 text-center"><LoadingState message={t('common.loading', isVi ? 'Đang tải...' : 'Loading...')} /></div>}>
          {portalContent}
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
};

export default App;
