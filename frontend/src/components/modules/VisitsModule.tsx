'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Visit, Client } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, MessageSquare, Clock, Phone, Mail, Calendar, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

function VisitForm({ initial, clients, onSave, onCancel, loading }: {
  initial?: Partial<Visit>;
  clients: Client[];
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const defaultDueDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const clientId = (initial as any)?.client?.id?.toString() || '';

  const [form, setForm] = useState({
    communicationType: initial?.communicationType || 'Reunión',
    subject: initial?.subject || '',
    notes: initial?.notes || '',
    clientId,
    createTask: true,
    taskDueDate: defaultDueDate,
    taskTitle: '',
    taskPriority: 'Normal',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <Select label="Cliente *" value={form.clientId} onChange={e => set('clientId', e.target.value)}
        options={[{ value: '', label: 'Seleccionar cliente...' }, ...clients.map(c => ({ value: c.id.toString(), label: c.businessName }))]} />
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">Tipo de Comunicación *</label>
        <select
          value={form.communicationType}
          onChange={e => set('communicationType', e.target.value)}
          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFBE00]"
        >
          <option value="Reunión">Reunión Presencial</option>
          <option value="Llamada">Llamada Telefónica</option>
          <option value="Email">Email / Correo</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <Input label="Asunto / Título *" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Negociación precios zafra soja..." />
      <Textarea label="Notas / Resumen *" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Detalle de lo acordado o hablado con el cliente..." />

      {!initial?.id && (
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
            <input
              type="checkbox"
              checked={form.createTask}
              onChange={e => set('createTask', e.target.checked)}
              className="w-4 h-4 accent-[#FFBE00] rounded"
            />
            <span>Programar Tarea de Seguimiento / Recordatorio</span>
          </label>

          {form.createTask && (
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Aviso / Vencimiento *</label>
                  <input
                    type="date"
                    value={form.taskDueDate}
                    onChange={e => set('taskDueDate', e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-[#FFBE00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={form.taskPriority}
                    onChange={e => set('taskPriority', e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#FFBE00]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">Alta</option>
                    <option value="Low">Baja</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Detalle de la Tarea</label>
                <input
                  type="text"
                  value={form.taskTitle}
                  onChange={e => set('taskTitle', e.target.value)}
                  placeholder={`Ej: Seguimiento: ${form.subject || 'Llamada comercial'}`}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#FFBE00]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => {
          const { clientId, ...rest } = form;
          onSave({ 
            ...rest, 
            client: clientId ? { id: Number(clientId) } as any : undefined 
          });
        }} loading={loading}>
          {initial?.id ? 'Guardar' : 'Registrar Comunicación'}
        </Button>
      </div>
    </div>
  );
}

export function VisitsModule() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Visit | null>(null);

  const { data: visits = [], isLoading } = useQuery<Visit[]>({
    queryKey: ['visits'],
    queryFn: () => api.get('/visits').then(r => r.data),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Visit>) => api.post('/visits', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setModalOpen(false);
      toast.success('Comunicación registrada. El Agente IA generó automáticamente la tarea de seguimiento.');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Visit> }) => api.put(`/visits/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); setModalOpen(false); setEditTarget(null); toast.success('Actualizado'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/visits/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); toast.success('Eliminado'); },
  });

  const sorted = [...visits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Registro de Visitas y Comunicaciones</h2>
          <p className="text-xs text-gray-500">Cada registro genera automáticamente una tarea de seguimiento vía Agente IA.</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          Registrar comunicación
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando comunicaciones...</div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
          <MessageSquare className="w-8 h-8 opacity-30" />
          <p className="text-sm">Sin comunicaciones registradas aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(visit => {
            return (
              <Card key={visit.id} hover>
                <CardBody className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#FFBE00]/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#2D2D2D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-sm">
                        {visit.client?.businessName || '—'}
                      </p>
                      <Badge variant="warning">{visit.communicationType || 'Reunión'}</Badge>
                      <span className="font-bold text-xs text-gray-700">{visit.subject}</span>
                    </div>
                    {visit.notes && <p className="text-xs text-gray-600 mt-1">{visit.notes}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(visit.createdAt), 'dd MMM, HH:mm', { locale: es })}
                      </span>
                      {visit.createdBy && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          {visit.createdBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditTarget(visit); setModalOpen(true); }}>✎</Button>
                    <Button variant="danger" size="sm" onClick={() => deleteMut.mutate(visit.id)}>✕</Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }}
        title={editTarget ? 'Editar comunicación' : 'Registrar comunicación'} size="lg">
        <VisitForm
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
