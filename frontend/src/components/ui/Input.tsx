'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-700">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-[#FFBE00] focus:border-[#FFBE00] transition-all duration-100',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            icon && 'pl-10',
            error && 'border-rose-400 focus:ring-rose-200 focus:border-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-700">{label}</label>}
      <select
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-[#FFBE00] focus:border-[#FFBE00] transition-all duration-100',
          error && 'border-rose-400',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-700">{label}</label>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-y',
          'focus:outline-none focus:ring-2 focus:ring-[#FFBE00] focus:border-[#FFBE00] transition-all duration-100',
          error && 'border-rose-400',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
