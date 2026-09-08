import React, { useState } from 'react';
import { Header } from '../components/Header';
import { SideNavBar } from '../components/SideNavBar';
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
    <div className="flex min-h-screen flex-col bg-[#F4F7FC] font-sans text-slate-900 selection:bg-[#0891B2] selection:text-white">
      {/* Universal Clinical Header */}
      <Header
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-[1680px] flex-1">
        {/* Categorized Side Navigation */}
        <SideNavBar
          currentRole={currentUser.role}
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Role Main Viewport */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
