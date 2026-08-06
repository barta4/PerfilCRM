import React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'pink' | 'emerald' | 'amber';
  trend?: { value: number; label: string };
  href?: string;
}

const colorClasses = {
  blue: { bg: 'bg-[#003B5C] hover:bg-[#004b75]', text: 'text-white' },
  pink: { bg: 'bg-[#E91E63] hover:bg-[#f0457e]', text: 'text-white' },
  emerald: { bg: 'bg-emerald-600 hover:bg-emerald-500', text: 'text-white' },
  amber: { bg: 'bg-amber-500 hover:bg-amber-400', text: 'text-white' },
};

export function StatCard({ title, value, subtitle, icon, color = 'blue', trend, href }: StatCardProps) {
  const colors = colorClasses[color];
  const content = (
    <div className={cn(
      'rounded-none p-6 flex flex-col justify-between min-h-[140px] transition-colors duration-150 border-2 border-transparent cursor-pointer h-full',
      colors.bg,
      colors.text
    )}>
      <div className="flex items-start justify-between">
        <div className="p-2 opacity-80">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-none border-2',
            trend.value >= 0 ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-black/30 text-white'
          )}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-4xl font-light tracking-tight mb-1">{value}</p>
        <p className="text-sm font-bold uppercase tracking-wider opacity-90">{title}</p>
        {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
