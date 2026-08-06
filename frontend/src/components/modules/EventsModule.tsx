'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Event, Client } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Calendar, Clock, Video, MapPin, Phone, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

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
        <Input label="Link de reunión" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} placeholder="https://meet.google.com/..." />
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setModalOpen(false); toast.success('Evento creado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/events/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setModalOpen(false); setEditTarget(null); toast.success('Actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Eliminado'); },
  });

  const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          Nuevo evento
        </Button>
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
            const cfg = typeConfig[event.type] || typeConfig['Presencial'];
            const start = new Date(event.startTime);
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">{event.title}</p>
                      <Badge variant={cfg.variant}>
                        <span className="flex items-center gap-1">{cfg.icon}{event.type}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(start, 'HH:mm')} – {event.endTime ? format(new Date(event.endTime), 'HH:mm') : '—'}
                      </span>
                      {event.client && <span className="truncate">{event.client.businessName}</span>}
                    </div>
                    {event.meetingLink && (
                      <a href={event.meetingLink} target="_blank" rel="noreferrer"
                        className="text-xs text-pureza-blue underline mt-1 block">
                        Unirse a la reunión →
                      </a>
                    )}
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
