import React, { useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/Header';
import { SideNavBar } from './components/SideNavBar';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { CDSDashboardPage } from './pages/CDSDashboardPage';
import { ClinicPortalPage } from './pages/ClinicPortalPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { user: currentUser, loading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white font-sans" role="status">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wide">Đang tải không gian làm việc AURA...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  const portal =
    currentUser.role === 'patient' ? (
      <PatientPortalPage user={currentUser} activeView={activeSection} onNavigate={setActiveSection} />
    ) : currentUser.role === 'doctor' ? (
      <CDSDashboardPage activeView={activeSection} onNavigate={setActiveSection} currentUser={currentUser} />
    ) : currentUser.role === 'clinic' ? (
      <ClinicPortalPage />
    ) : (
      <AdminAuditLogsPage />
    );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans selection:bg-[#0891B2] selection:text-white text-slate-800">
      <Header currentUser={currentUser} onLogout={() => void logout()} onOpenMenu={() => setIsMobileMenuOpen(true)} />
      <div className="mx-auto flex w-full max-w-[1680px] flex-1">
        <SideNavBar
          currentRole={currentUser.role}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {portal}
        </main>
      </div>
    </div>
  );
};

export default App;
