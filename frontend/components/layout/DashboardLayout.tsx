'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-sand border-t-brand-navy rounded-full animate-spin"></div>
          <p className="text-brand-navy font-semibold animate-pulse">Ładowanie bIlias...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-brand-light font-sans text-foreground">
      {/* Sidebar Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
