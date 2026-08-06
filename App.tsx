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
  const [activeSection, setActiveSection] = useState('default');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
    window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-blue-950 text-white" role="status">Đang khôi phục phiên đăng nhập…</div>;
  if (!currentUser) return <LoginPage />;

  const portal = currentUser.role === 'patient' ? <PatientPortalPage user={currentUser} />
    : currentUser.role === 'doctor' ? <CDSDashboardPage />
    : currentUser.role === 'clinic' ? <ClinicPortalPage /> : <AdminAuditLogsPage />;

  return (
    <div className="flex min-h-screen flex-col bg-[#F0FDFA] font-sans selection:bg-[#0891B2] selection:text-white">
      <Header currentUser={currentUser} onLogout={() => void logout()} onOpenMenu={() => setIsMobileMenuOpen(true)} />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <SideNavBar currentRole={currentUser.role} activeSection={activeSection} onSelectSection={handleSelectSection} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8">{portal}</main>
      </div>
    </div>
  );
};

export default App;
