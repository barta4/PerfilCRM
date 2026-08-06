'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  allowMaximize?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, size = 'md', allowMaximize = false }: ModalProps) {
  const [maximized, setMaximized] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn(
        'relative z-10 w-full bg-white rounded-2xl border-2 border-[#FFBE00] flex flex-col transition-all duration-200 shadow-2xl',
        'animate-in fade-in-0 zoom-in-95 duration-100',
        maximized ? 'fixed inset-0 m-0 border-0 max-w-none h-screen rounded-none' : cn(sizeClasses[size], 'max-h-[90vh]')
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-[#2D2D2D]">{title}</h2>
          <div className="flex items-center gap-1">
            {allowMaximize && (
              <button
                type="button"
                onClick={() => setMaximized(!maximized)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title={maximized ? 'Restaurar' : 'Maximizar'}
              >
                {maximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
