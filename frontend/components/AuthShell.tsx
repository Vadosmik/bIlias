import React from "react";

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
}

export function AuthShell({ children, title, subtitle, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-[440px] space-y-8 rounded-2xl border border-border bg-card p-8 shadow-brand-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        {footer && (
          <div className="text-center text-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
