'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Task, Client } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, GripVertical, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const COLUMNS: { id: Task['status']; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'To Do',       label: 'Por hacer',   icon: <Clock className="w-4 h-4" />,        color: 'border-t-gray-400' },
  { id: 'In Progress', label: 'En progreso',  icon: <AlertCircle className="w-4 h-4" />,  color: 'border-t-pureza-blue' },
  { id: 'Done',        label: 'Completado',   icon: <CheckCircle className="w-4 h-4" />,  color: 'border-t-emerald-500' },
  { id: 'Cancelled',   label: 'Cancelado',    icon: <XCircle className="w-4 h-4" />,      color: 'border-t-rose-500' },
];

const priorityVariant = {
  Low:      'neutral',
  Normal:   'default',
  High:     'warning',
  Critical: 'danger',
} as const;

function TaskCard({ task, onEdit, onDelete, onStatusChange }: {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: Task['status']) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-2">
        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button onClick={() => onEdit(task)} className="text-xs text-gray-400 hover:text-pureza-blue px-1">✎</button>
          <button onClick={() => onDelete(task.id)} className="text-xs text-gray-400 hover:text-rose-500 px-1">✕</button>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{task.title}</p>
      {task.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
      {task.dueDate && (
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
          <Clock className="w-3 h-3" />
          {new Date(task.dueDate).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
        </p>
      )}
      <Select
        options={COLUMNS.map(c => ({ value: c.id, label: c.label }))}
        value={task.status}
        onChange={e => onStatusChange(task.id, e.target.value as Task['status'])}
        className="text-xs py-1"
      />
    </div>
  );
}

function TaskForm({ initial, clients, onSave, onCancel, loading }: {
  initial?: Partial<Task>;
  clients: Client[];
  onSave: (data: Partial<Task & { clientId: number }>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Partial<Task & { clientId: number }>>({
    status: 'To Do', priority: 'Normal', ...initial,
    clientId: (initial as any)?.client?.id,
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <Input label="Título *" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Llamar a contacto principal" />
      <Textarea label="Descripción" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Detalles..." />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Prioridad" value={form.priority || 'Normal'} onChange={e => set('priority', e.target.value)}
          options={['Low','Normal','High','Critical'].map(v => ({ value: v, label: v }))} />
        <Select label="Estado" value={form.status || 'To Do'} onChange={e => set('status', e.target.value)}
          options={COLUMNS.map(c => ({ value: c.id, label: c.label }))} />
      </div>
      <Select label="Cliente" value={form.clientId?.toString() || ''} onChange={e => set('clientId', e.target.value)}
        options={[{ value: '', label: 'Seleccionar...' }, ...clients.map(c => ({ value: c.id.toString(), label: c.businessName }))]} />
      <Input label="Fecha límite" type="date" value={form.dueDate?.slice(0, 10) || ''} onChange={e => set('dueDate', e.target.value)} />
      <div className="flex gap-3 pt-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => {
          const { clientId, ...rest } = form;
          onSave({ ...rest, client: clientId ? { id: Number(clientId) } as Client : undefined });
        }} loading={loading}>
          {initial?.id ? 'Guardar' : 'Crear tarea'}
        </Button>
      </div>
    </div>
  );
}

export function TasksModule() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setModalOpen(false); toast.success('Tarea creada'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/tasks/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setModalOpen(false); setEditTarget(null); toast.success('Actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Eliminado'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          Nueva tarea
        </Button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className={cn('bg-gray-50 rounded-2xl border-t-4 p-4 space-y-3', col.color)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-700">
                  {col.icon}
                  <span className="text-sm font-semibold">{col.label}</span>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              {colTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={t => { setEditTarget(t); setModalOpen(true); }}
                  onDelete={id => deleteMut.mutate(id)}
                  onStatusChange={(id, status) => updateMut.mutate({ id, data: { status } })}
                />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-6 text-gray-300 text-xs">Sin tareas</div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }}
        title={editTarget ? 'Editar tarea' : 'Nueva tarea'} size="lg">
        <TaskForm
          initial={editTarget || undefined}
          clients={clients}
          onSave={data => editTarget
            ? updateMut.mutate({ id: editTarget.id, data })
            : createMut.mutate(data)}
          onCancel={() => { setModalOpen(false); setEditTarget(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>
    </div>
  );
}
