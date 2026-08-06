'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  action,
  className = '',
}: PageHeaderProps) {
  const isLucideIcon = typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && 'render' in Icon);

  return (
    <div className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-700/50 relative overflow-hidden ${className}`}>
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="p-3.5 rounded-xl bg-white/10 text-[#FFBE00] backdrop-blur-sm border border-white/10 shrink-0 shadow-inner">
              {isLucideIcon ? (
                // @ts-ignore Lucide component rendering
                <Icon className="w-7 h-7" />
              ) : (
                Icon
              )}
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
              {badge}
            </div>
            {description && (
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0">{action}</div>}
      </div>

      {/* Decorative Brand Accent Glow */}
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#FFBE00]/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
