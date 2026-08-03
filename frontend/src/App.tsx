import React, { useState } from 'react';
import { UserSession } from './types/auth';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/Header';
import { SideNavBar } from './components/SideNavBar';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { CDSDashboardPage } from './pages/CDSDashboardPage';
import { ClinicPortalPage } from './pages/ClinicPortalPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';

export const App: React.FC = () => {
  // Authentication session state: null means logged out -> renders LoginPage
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeSection, setActiveSection] = useState<string>('default');

  const handleLoginSuccess = (session: UserSession) => {
    setCurrentUser(session);
    // Set initial active section according to role
    if (session.role === 'patient') setActiveSection('my-scans');
    else if (session.role === 'doctor') setActiveSection('cds-viewer');
    else if (session.role === 'clinic') setActiveSection('bulk-batch');
    else if (session.role === 'admin') setActiveSection('audit-logs');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // If not authenticated, render the role-specific Login & Registration page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render ONLY the authenticated actor's isolated portal
  const renderIsolatedPortal = () => {
    switch (currentUser.role) {
      case 'patient':
        return <PatientPortalPage user={currentUser} />;
      case 'doctor':
        return <CDSDashboardPage />;
      case 'clinic':
        return <ClinicPortalPage />;
      case 'admin':
        return <AdminAuditLogsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDFA] flex flex-col font-sans selection:bg-[#0891B2] selection:text-white">
      {/* Top Header displaying authenticated user profile and Logout button */}
      <Header currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Navigation Sidebar displaying ONLY permitted items for active role */}
        <SideNavBar
          currentRole={currentUser.role}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />

        {/* Isolated Portal Workspace */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderIsolatedPortal()}
        </main>
      </div>
    </div>
  );
};

export default App;
