import React, { Suspense, lazy, useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { useAuth } from './context/AuthContext';
import { LoadingState } from './components/ui/StateFeedback';

// Code-split each portal so a given user's browser only ever downloads the
// JS for the role they're actually using (NFR-3: dashboard load < 3s).
const PatientPortalPage = lazy(() =>
  import('./pages/PatientPortalPage').then((m) => ({ default: m.PatientPortalPage }))
);
const CDSDashboardPage = lazy(() =>
  import('./pages/CDSDashboardPage').then((m) => ({ default: m.CDSDashboardPage }))
);
const ClinicPortalPage = lazy(() =>
  import('./pages/ClinicPortalPage').then((m) => ({ default: m.ClinicPortalPage }))
);
const AdminAuditLogsPage = lazy(() =>
  import('./pages/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage }))
);

export const App: React.FC = () => {
  const { user: currentUser, loading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FC] text-slate-900 font-sans">
        <LoadingState message="Đang khởi tạo không gian làm việc AURA..." />
      </div>
    );
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
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingState message="Đang tải giao diện..." />
          </div>
        }
      >
        {portalContent}
      </Suspense>
    </AppLayout>
  );
};

export default App;
