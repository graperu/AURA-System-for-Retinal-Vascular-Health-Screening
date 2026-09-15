import React, { useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { VerifyEmailLink } from './components/auth/VerifyEmailLink';
import { AppLayout } from './layouts/AppLayout';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { CDSDashboardPage } from './pages/CDSDashboardPage';
import { ClinicPortalPage } from './pages/ClinicPortalPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { LoadingState } from './components/ui/StateFeedback';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  const { user: currentUser, loading, logout } = useAuth();
  const { t, isVi } = useLanguage();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
  };

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
        return <ClinicPortalPage activeView={activeSection} />;
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
        {portalContent}
      </ErrorBoundary>
    </AppLayout>
  );
};

export default App;
