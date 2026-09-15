'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Event, Client } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Plus, Calendar, Clock, Video, MapPin, Phone, Star,
  CalendarCheck, ExternalLink, RefreshCw, Unlink
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useModuleStore } from '@/store/moduleStore';
import { useLanguageStore } from '@/store/languageStore';

const typeConfig = {
  Presencial: { icon: <MapPin className="w-4 h-4" />,  variant: 'default' as const },
  Virtual:    { icon: <Video className="w-4 h-4" />,   variant: 'success' as const },
  Llamada:    { icon: <Phone className="w-4 h-4" />,   variant: 'neutral' as const },
  Feria:      { icon: <Star className="w-4 h-4" />,    variant: 'warning' as const },
};

function EventForm({ initial, clients, onSave, onCancel, loading }: {
  initial?: Partial<Event>;
  clients: Client[];
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    type: 'Presencial', title: '', startTime: '', endTime: '', meetingLink: '',
    clientId: (initial as any)?.client?.id?.toString() || '',
    ...initial,
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <Input label="Título del evento *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Reunión de seguimiento" />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Tipo" value={form.type} onChange={e => set('type', e.target.value)}
          options={Object.keys(typeConfig).map(v => ({ value: v, label: v }))} />
        <Select label="Cliente" value={form.clientId} onChange={e => set('clientId', e.target.value)}
          options={[{ value: '', label: 'Seleccionar...' }, ...clients.map(c => ({ value: c.id.toString(), label: c.businessName }))]} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Inicio" type="datetime-local" value={form.startTime?.slice(0,16)} onChange={e => set('startTime', e.target.value)} />
        <Input label="Fin" type="datetime-local" value={form.endTime?.slice(0,16)} onChange={e => set('endTime', e.target.value)} />
      </div>
      {form.type === 'Virtual' && (
        <Input
          label="Link de reunión (Google Meet se autogenera si se conecta Calendar)"
          value={form.meetingLink}
          onChange={e => set('meetingLink', e.target.value)}
          placeholder="https://meet.google.com/..."
        />
      )}
      <div className="flex gap-3 pt-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => {
          const { clientId, ...rest } = form;
          onSave({ ...rest, client: clientId ? { id: Number(clientId) } : undefined });
        }} loading={loading}>
          {initial?.id ? 'Guardar' : 'Crear evento'}
        </Button>
      </div>
    </div>
  );
}

export function EventsModule() {
  const qc = useQueryClient();
  const { isModuleEnabled } = useModuleStore();
  const { t } = useLanguageStore();
  const isGoogleCalendarEnabled = isModuleEnabled('google_calendar');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);

  // Consultar estado de Google Calendar del usuario
  const { data: gcalStatus, refetch: refetchGcal } = useQuery<{ isConnected: boolean; email?: string }>({
    queryKey: ['google-calendar-status'],
    queryFn: () => api.get('/google-calendar/status').then(r => r.data),
    enabled: isGoogleCalendarEnabled,
  });

  // Procesar código de OAuth si regresa en la URL
  useEffect(() => {
    if (typeof window === 'undefined' || !isGoogleCalendarEnabled) return;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      api.post('/google-calendar/callback', { code })
        .then(() => {
          toast.success(t('google_calendar.success_connected', 'Google Calendar vinculado con éxito'));
          refetchGcal();
          // Limpiar parámetros de la URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err: any) => {
          toast.error(err.response?.data?.message || 'Error al autorizar con Google Calendar');
        });
    }
  }, [isGoogleCalendarEnabled, refetchGcal, t]);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/events', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setModalOpen(false); toast.success('Evento creado y sincronizado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/events/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setModalOpen(false); setEditTarget(null); toast.success('Actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Eliminado'); },
  });

  const disconnectMut = useMutation({
    mutationFn: () => api.post('/google-calendar/disconnect'),
    onSuccess: () => {
      refetchGcal();
      toast.success(t('google_calendar.success_disconnected', 'Google Calendar desvinculado'));
    },
  });

  const handleConnectGcal = async () => {
    try {
      const res = await api.get('/google-calendar/auth-url');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error('Error al iniciar vinculación con Google: ' + (err.response?.data?.message || err.message));
    }
  };

  const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Google Calendar Status Badge / Action (Modular) */}
        {isGoogleCalendarEnabled && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-xs">
            <div className={`p-1.5 rounded-lg ${gcalStatus?.isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              <CalendarCheck className="w-4 h-4" />
            </div>
            {gcalStatus?.isConnected ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">
                  {t('google_calendar.connected', 'Google Calendar Activo')}
                  {gcalStatus.email && <span className="text-gray-400 ml-1">({gcalStatus.email})</span>}
                </span>
                <button
                  onClick={() => disconnectMut.mutate()}
                  disabled={disconnectMut.isPending}
                  title={t('google_calendar.disconnect', 'Desconectar')}
                  className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGcal}
                className="font-bold text-[#2D2D2D] hover:text-[#FFBE00] flex items-center gap-1.5 transition-colors"
              >
                <span>{t('google_calendar.connect', 'Conectar con Google Calendar')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex justify-end ml-auto">
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditTarget(null); setModalOpen(true); }}>
            Nuevo evento
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando agenda...</div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
          <Calendar className="w-8 h-8 opacity-30" />
          <p className="text-sm">No hay eventos agendados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(event => {
            const cfg = typeConfig[event.type as keyof typeof typeConfig] || typeConfig['Presencial'];
            const start = new Date(event.startTime);
            const googleLink = (event as any).googleHtmlLink;

            return (
              <Card key={event.id} hover>
                <CardBody className="flex items-center gap-5">
                  {/* Date bubble */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-pureza-blue/5 rounded-xl shrink-0">
                    <span className="text-xs text-pureza-blue font-bold uppercase">
                      {format(start, 'MMM', { locale: es })}
                    </span>
                    <span className="text-2xl font-black text-pureza-blue leading-tight">
                      {format(start, 'd')}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm truncate">{event.title}</p>
                      <Badge variant={cfg.variant}>
                        <span className="flex items-center gap-1">{cfg.icon}{event.type}</span>
                      </Badge>
                      {googleLink && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CalendarCheck className="w-3 h-3" /> G-Calendar
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(start, 'HH:mm')} – {event.endTime ? format(new Date(event.endTime), 'HH:mm') : '—'}
                      </span>
                      {event.client && <span className="truncate font-medium">{event.client.businessName}</span>}
                    </div>

                    {/* Links & Meeting */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {event.meetingLink && (
                        <a
                          href={event.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#2D2D2D] hover:text-emerald-600 bg-gray-100 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                        >
                          <Video className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('google_calendar.join_meet', 'Unirse con Google Meet')}</span>
                        </a>
                      )}
                      {googleLink && (
                        <a
                          href={googleLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{t('google_calendar.open_calendar', 'Ver en Google Calendar')}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditTarget(event); setModalOpen(true); }}>✎</Button>
                    <Button variant="danger" size="sm" onClick={() => deleteMut.mutate(event.id)} loading={deleteMut.isPending}>✕</Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }}
        title={editTarget ? 'Editar evento' : 'Nuevo evento'} size="lg">
        <EventForm
          initial={editTarget || undefined}
          clients={clients}
          onSave={data => editTarget ? updateMut.mutate({ id: editTarget.id, data }) : createMut.mutate(data)}
          onCancel={() => { setModalOpen(false); setEditTarget(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>
    </div>
  );
}
