'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Wszystkie Kursy',
    icon: BookOpen,
    href: '/courses',
  },
  {
    title: 'Ustawienia',
    icon: Settings,
    href: '/settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 flex flex-col h-full bg-brand-navy text-white transition-all duration-300">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-brand-sand p-2 rounded-lg text-brand-navy">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">bIlias</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Platforma UMG</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-brand-sand text-brand-navy font-semibold" 
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-brand-navy" : "text-white/40 group-hover:text-brand-sand"
              )} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-brand-sand/20 flex items-center justify-center text-brand-sand font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-white/50 hover:text-destructive transition-colors rounded-xl hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Wyloguj się</span>
        </button>
      </div>
    </aside>
  );
}
