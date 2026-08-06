'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-[#FFBE00] text-[#2D2D2D] font-extrabold hover:bg-[#e0a700] shadow-sm',
  secondary: 'bg-[#98D500] text-[#2D2D2D] font-extrabold hover:bg-[#86bd00] shadow-sm',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 uppercase font-bold tracking-wider',
  md: 'px-5 py-2.5 text-xs gap-2 uppercase font-bold tracking-wider',
  lg: 'px-7 py-3.5 text-sm gap-2.5 uppercase font-bold tracking-wider',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-[#FFBE00] disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
