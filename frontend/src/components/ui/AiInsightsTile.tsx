'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export function AiInsightsTile() {
  const { data, isLoading, isError } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['ai-recommendations'],
    queryFn: () => api.get('/ai/recommendations').then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="bg-[#2D2D2D] p-6 rounded-xl text-white flex flex-col justify-center items-center h-full min-h-[160px] border border-gray-700">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#FFBE00]" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Cargando Sugerencias del Agente IA...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-[#2D2D2D] p-4 rounded-xl text-white border border-gray-700">
        <p className="text-xs font-bold uppercase opacity-60">Agente IA de Recomendaciones activo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-[#2D2D2D] text-white rounded-2xl border-2 border-[#FFBE00] overflow-hidden">
      {/* Header Tile */}
      <div className="p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FFBE00]" />
          <span className="text-xs font-black uppercase tracking-widest text-[#FFBE00]">Agente IA Comercial</span>
        </div>
        <div className="mt-4 md:mt-0">
          <h2 className="text-2xl font-black leading-tight mb-1 text-white">Recomendaciones del día</h2>
          <p className="text-xs text-gray-400">Análisis predictivo y sugerencias inteligentes de tu cartera comercial.</p>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10">
        {data.recommendations.slice(0, 4).map((rec, i) => (
          <div key={i} className="bg-[#2D2D2D] p-5 hover:bg-[#383838] transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                rec.priority === 'high' ? 'bg-[#FFBE00] text-black border-[#FFBE00]' : 'bg-transparent text-gray-300 border-gray-600'
              )}>
                {rec.priority}
              </span>
              <ArrowRight className="w-4 h-4 text-[#FFBE00] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-sm font-bold mb-1 line-clamp-1 text-white">{rec.title}</h3>
            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{rec.description}</p>
            <button className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#FFBE00] hover:underline">
              {rec.action} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
