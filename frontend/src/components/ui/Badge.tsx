'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

const variantClasses = {
  default: 'bg-[#FFBE00]/20 text-[#2D2D2D] border-[#FFBE00]/40 font-bold',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  warning: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200 font-bold',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
