'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  info:    'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-rose-500',
};

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 30_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const unread = countData?.count ?? notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#FFBE00] rounded-full text-[#2D2D2D] text-[10px] font-black flex items-center justify-center shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={() => markAllReadMut.mutate()}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Todo leído
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Sin notificaciones
                </div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  className={cn('flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors', !n.isRead && 'bg-blue-50/50')}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', typeColors[n.type] || 'bg-gray-400')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-tight', !n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                    {!n.isRead && (
                      <button onClick={() => markReadMut.mutate(n.id)}
                        className="text-gray-300 hover:text-blue-500 transition-colors"
                        title="Marcar como leída">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteMut.mutate(n.id)}
                      className="text-gray-300 hover:text-rose-500 transition-colors mt-1"
                      title="Eliminar notificación">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
