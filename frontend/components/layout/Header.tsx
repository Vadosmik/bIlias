'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, Bell, Search, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment !== '');

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-brand-gray/20 sticky top-0 z-40">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium">
        <Link 
          href="/dashboard" 
          className="text-muted-foreground hover:text-brand-navy transition-colors flex items-center"
        >
          <Home className="w-4 h-4" />
        </Link>
        
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={href}>
              <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/50" />
              <Link
                href={href}
                className={cn(
                  "transition-colors",
                  isLast ? "text-brand-navy font-bold cursor-default pointer-events-none" : "text-muted-foreground hover:text-brand-navy"
                )}
              >
                {label}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Search Bar - Mockup */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Szukaj..." 
            className="pl-10 pr-4 py-2 bg-muted rounded-full text-sm border-none focus:ring-2 focus:ring-brand-sand transition-all w-64"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
          </button>
          
          <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
            <Sun className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
