import React, { useState } from 'react';
import { Header } from '../components/Header';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';
import { UserSession } from '../types/auth';

export interface AppLayoutProps {
  currentUser: UserSession;
  activeSection: string;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  activeSection,
  onSelectSection,
  onLogout,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-clinical-bg font-sans text-clinical-text selection:bg-brand-600 selection:text-white">
      {/* Universal Clinical Header */}
      <Header
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        {/* Categorized Side Navigation */}
        <SideNavBar
          currentRole={currentUser.role}
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Role Main Viewport */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-w-0 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
