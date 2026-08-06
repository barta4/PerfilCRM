'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DocumentUploader } from '@/components/ui/DocumentUploader';
import { ArrowLeft, User, Building2, MapPin, Phone, Mail, Clock, CalendarCheck, Calendar, Camera, Plus, Trash2, Loader2, MessageCircle, Sparkles, Gift, ClipboardList, FileText, Send, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'resumen' | 'contactos' | 'visitas' | 'tareas' | 'cotizaciones' | 'documentos'>('resumen');
  const [contactModal, setContactModal] = useState(false);
  const [visitModal, setVisitModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const createTaskDirectMut = useMutation({
    mutationFn: (data: any) => api.post('/tasks', { ...data, client: { id: +id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      setTaskModal(false);
      toast.success('Tarea creada correctamente');
    },
    onError: () => toast.error('Error al crear la tarea'),
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get(`/clients/${id}`).then(r => r.data),
  });

  const updateClientMut = useMutation({
    mutationFn: (data: any) => api.put(`/clients/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }),
  });

  const createContactMut = useMutation({
    mutationFn: (data: any) => api.post('/contacts', { ...data, client: { id: +id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', id] });
      setContactModal(false);
      toast.success('Contacto añadido');
    },
    onError: () => toast.error('Error al añadir contacto'),
  });

  const deleteContactMut = useMutation({
    mutationFn: (contactId: number) => api.delete(`/contacts/${contactId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', id] });
      toast.success('Contacto eliminado');
    },
    onError: () => toast.error('Error al eliminar contacto'),
  });

  const createVisitMut = useMutation({
    mutationFn: (data: any) => api.post('/visits', { ...data, client: { id: +id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits', id] });
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      setVisitModal(false);
      toast.success('Comunicación registrada. El Agente IA generará la tarea de seguimiento.');
    },
    onError: () => toast.error('Error al registrar comunicación'),
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/documents/upload?entityType=client_profile&entityId=${id}`, formData);
      await updateClientMut.mutateAsync({ imageUrl: res.data.filename });
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploading(false);
    }
  };

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', id],
    queryFn: () => api.get(`/contacts?clientId=${id}`).then(r => r.data),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits', id],
    queryFn: () => api.get(`/visits?clientId=${id}`).then(r => r.data),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get('/tasks').then(r => (r.data || []).filter((t: any) => t.client?.id === +id)),
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations', id],
    queryFn: () => api.get('/quotations').then(r => (r.data || []).filter((q: any) => q.client?.id === +id)),
  });

  const sendQuotationEmailMut = useMutation({
    mutationFn: (qId: number) => api.post(`/quotations/${qId}/send-email`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations', id] });
      toast.success('Orden / Cotización enviada por email al cliente y copia a la empresa');
    },
    onError: () => toast.error('Error al enviar email'),
  });

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'contactos', label: `Contactos (${contacts.length})` },
    { id: 'visitas', label: `Visitas / Comunicaciones (${visits.length})` },
    { id: 'tareas', label: `Tareas (${tasks.length})` },
    { id: 'cotizaciones', label: `Cotizaciones / Órdenes (${quotations.length})` },
    { id: 'documentos', label: 'Documentos' },
  ];

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando ficha del cliente...</div>;
  if (!client) return <div className="p-8 text-center text-rose-500">Cliente no encontrado</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button onClick={() => router.push('/clients')}
            className="mt-1 p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-wrap md:flex-nowrap items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 bg-[#FFBE00]/20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#FFBE00] transition-all">
                {client.imageUrl ? (
                  <img
                    src={`/api/documents/${client.imageUrl}`}
                    alt={client.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-[#2D2D2D]" />
                )}

                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-gray-900 truncate">{client.businessName}</h2>
                {client.code && <Badge variant="neutral" className="font-mono">{client.code}</Badge>}
                <Badge variant={client.status === 'Green' ? 'success' : client.status === 'Red' ? 'danger' : client.status === 'Yellow' ? 'warning' : 'neutral'}>
                  {client.status === 'Green' ? 'Activo' : client.status === 'Red' ? 'Riesgo' : client.status === 'Yellow' ? 'Atención' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                {client.companyEmail && <span className="flex items-center gap-1.5 font-medium text-gray-800"><Mail className="w-4 h-4 text-[#FFBE00]" /> {client.companyEmail}</span>}
                {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {client.phone}</span>}
                {client.industry && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> {client.industry}</span>}
                {client.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {client.address}</span>}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setVisitModal(true)}>
                Registrar comunicación
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === t.id ? 'bg-[#FFBE00] text-[#2D2D2D] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* RESUMEN */}
          {tab === 'resumen' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><h3 className="font-bold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-[#FFBE00]" /> Contacto Principal</h3></CardHeader>
                <CardBody>
                  {contacts.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#FFBE00]/20 text-[#2D2D2D] flex items-center justify-center font-bold text-lg">
                        {contacts[0].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{contacts[0].name}</p>
                        <p className="text-xs text-gray-500">{contacts[0].role || 'Sin cargo'}</p>
                        <div className="flex gap-4 mt-2">
                          {contacts[0].email && (
                            <a href={`mailto:${contacts[0].email}`} className="p-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors" title="Enviar Email">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {contacts[0].phone && (
                            <a
                              href={`https://wa.me/${contacts[0].phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No hay contactos registrados.</p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader><h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-[#FFBE00]" /> Última Comunicación</h3></CardHeader>
                <CardBody>
                  {visits.length > 0 ? (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant="warning">{visits[0].communicationType || 'Reunión'}</Badge>
                        <span className="text-xs text-gray-400">
                          {format(new Date(visits[0].createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{visits[0].subject || 'Registro comercial'}</p>
                      <p className="text-xs text-gray-600 italic">"{visits[0].notes || 'Sin observaciones.'}"</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin comunicaciones registradas aún.</p>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {/* CONTACTOS */}
          {tab === 'contactos' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Directorio de Contactos</h3>
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setContactModal(true)}>Añadir contacto</Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100">
                  {contacts.length === 0 && <p className="p-6 text-center text-sm text-gray-400">No hay contactos.</p>}
                  {contacts.map((c: any) => (
                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.role || 'Contacto'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-gray-600 hidden sm:block">
                          <p>{c.email}</p>
                          <p>{c.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.email && (
                            <Button variant="ghost" size="sm" icon={<Mail className="w-3.5 h-3.5" />}
                              onClick={() => window.open(`mailto:${c.email}`)} title="Email" />
                          )}
                          {c.phone && (
                            <Button variant="ghost" size="sm" icon={<MessageCircle className="w-3.5 h-3.5" />}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}`, '_blank')} title="WhatsApp" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            className="text-gray-400 hover:text-rose-500"
                            onClick={() => deleteContactMut.mutate(c.id)}
                            loading={deleteContactMut.isPending}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* VISITAS / COMUNICACIONES */}
          {tab === 'visitas' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Historial de Visitas y Comunicaciones</h3>
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setVisitModal(true)}>Registrar comunicación</Button>
                </div>
              </CardHeader>
              <CardBody>
                {visits.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">No hay visitas registradas para este cliente.</p>
                ) : (
                  <div className="space-y-4">
                    {visits.map((v: any) => (
                      <div key={v.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="warning">{v.communicationType || 'Reunión'}</Badge>
                            <span className="font-bold text-gray-900">{v.subject || 'Comunicación comercial'}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{v.notes || 'Sin observaciones.'}</p>
                          <span className="text-xs text-gray-400 block mt-2">
                            Registrado por: {v.createdBy?.name || 'Ejecutivo'}
                          </span>
                        </div>
                        <div className="text-right text-xs text-gray-400 shrink-0">
                          {format(new Date(v.createdAt), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* TAREAS */}
          {tab === 'tareas' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Tareas de Seguimiento (Agente IA & Manuales)</h3>
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setTaskModal(true)}>
                    Crear tarea
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100">
                  {tasks.length === 0 && <p className="p-6 text-center text-sm text-gray-400">No hay tareas pendientes.</p>}
                  {tasks.map((t: any) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">{t.title}</span>
                          {t.dueDate && (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                              Vence: {format(new Date(t.dueDate), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{t.description}</p>
                        {t.sourceVisit && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium mt-1 inline-block">
                            Origen: Visita #{t.sourceVisit.id}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={t.status === 'Done' ? 'success' : 'warning'}>{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* COTIZACIONES */}
          {tab === 'cotizaciones' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Órdenes de Venta y Cotizaciones</h3>
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => router.push('/quotations')}>
                    Nueva Cotización
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                        <th className="p-4">N° Orden</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Total USD</th>
                        <th className="p-4">Pago</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quotations.length === 0 && (
                        <tr><td colSpan={6} className="p-4 text-center text-gray-400">Sin cotizaciones registradas.</td></tr>
                      )}
                      {quotations.map((q: any) => (
                        <tr key={q.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900">{q.quotationNumber || `#${q.id}`}</td>
                          <td className="p-4 text-xs text-gray-500">{format(new Date(q.createdAt), "dd/MM/yyyy")}</td>
                          <td className="p-4 font-bold text-emerald-600">${Number(q.totalAmount).toLocaleString()} USD</td>
                          <td className="p-4 text-xs text-gray-600">{q.paymentTerms || 'Contado'}</td>
                          <td className="p-4">
                            <Badge variant={q.status === 'Sent' ? 'success' : q.status === 'Approved' ? 'success' : 'neutral'}>
                              {q.status === 'Sent' ? 'Enviada / Orden' : q.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Download className="w-3.5 h-3.5 text-[#98D500]" />}
                              onClick={() => {
                                let token = '';
                                if (typeof window !== 'undefined') {
                                  try {
                                    const raw = localStorage.getItem('perfilgranos-auth');
                                    if (raw) {
                                      const parsed = JSON.parse(raw);
                                      token = parsed?.state?.token || '';
                                    }
                                  } catch (e) {
                                    console.error('Error reading auth token', e);
                                  }
                                }
                                window.open(`/api/quotations/${q.id}/pdf?token=${token}`, '_blank');
                              }}
                            >
                              PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Send className="w-3.5 h-3.5 text-[#FFBE00]" />}
                              loading={sendQuotationEmailMut.isPending}
                              onClick={() => sendQuotationEmailMut.mutate(q.id)}
                            >
                              Enviar por Email
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* DOCUMENTOS */}
          {tab === 'documentos' && (
            <Card>
              <CardHeader>
                <h3 className="font-bold text-gray-900">Documentos Adjuntos</h3>
              </CardHeader>
              <CardBody>
                <DocumentUploader entityType="client" entityId={Number(id)} />
              </CardBody>
            </Card>
          )}
        </div>
      </main>

      {/* Contact Modal */}
      <Modal open={contactModal} onClose={() => setContactModal(false)} title="Nuevo Contacto">
        <ContactForm
          onSave={createContactMut.mutate}
          onCancel={() => setContactModal(false)}
          loading={createContactMut.isPending}
        />
      </Modal>

      {/* Visit Modal */}
      <Modal open={visitModal} onClose={() => setVisitModal(false)} title="Registrar Comunicación / Visita">
        <VisitForm
          onSave={createVisitMut.mutate}
          onCancel={() => setVisitModal(false)}
          loading={createVisitMut.isPending}
        />
      </Modal>

      {/* Task Direct Modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Nueva Tarea de Seguimiento">
        <TaskForm
          onSave={createTaskDirectMut.mutate}
          onCancel={() => setTaskModal(false)}
          loading={createTaskDirectMut.isPending}
        />
      </Modal>
    </div>
  );
}

function ContactForm({ onSave, onCancel, loading }: any) {
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' });
  return (
    <div className="space-y-4">
      <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" />
      <Input label="Cargo" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Gerente de Compras" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="juan@empresa.com" />
        <Input label="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+598 99 123 456" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)} loading={loading}>Guardar contacto</Button>
      </div>
    </div>
  );
}

function TaskForm({ onSave, onCancel, loading }: any) {
  const defaultDueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: defaultDueDate,
    priority: 'Normal',
  });

  return (
    <div className="space-y-4">
      <Input
        label="Título / Asunto de la Tarea *"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="Ej: Llamar por confirmación de volumen de Soja"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Aviso / Vencimiento *</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFBE00]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridad</label>
          <select
            value={form.priority}
            onChange={e => setForm({ ...form, priority: e.target.value })}
            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFBE00]"
          >
            <option value="Normal">Normal</option>
            <option value="High">Alta</option>
            <option value="Low">Baja</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">Descripción / Detalles</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Notas adicionales o instrucciones para la tarea..."
          className="w-full min-h-[80px] p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFBE00]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)} loading={loading}>Guardar Tarea</Button>
      </div>
    </div>
  );
}

function VisitForm({ onSave, onCancel, loading }: any) {
  const defaultDueDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const [form, setForm] = useState({
    communicationType: 'Reunión',
    subject: '',
    notes: '',
    createTask: true,
    taskDueDate: defaultDueDate,
    taskTitle: '',
    taskPriority: 'Normal',
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">Tipo de Comunicación *</label>
        <select
          value={form.communicationType}
          onChange={e => setForm({ ...form, communicationType: e.target.value })}
          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFBE00]"
        >
          <option value="Reunión">Reunión Presencial</option>
          <option value="Llamada">Llamada Telefónica</option>
          <option value="Email">Email / Correo</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      <Input
        label="Asunto / Título *"
        value={form.subject}
        onChange={e => setForm({ ...form, subject: e.target.value })}
        placeholder="Reunión por precios de Soja zafra 2026"
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">Notas / Resumen *</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Se conversó sobre condiciones de pago y volumen aproximado..."
          className="w-full min-h-[90px] p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFBE00]"
        />
      </div>

      {/* Task follow-up scheduling block */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
          <input
            type="checkbox"
            checked={form.createTask}
            onChange={e => setForm({ ...form, createTask: e.target.checked })}
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
                  onChange={e => setForm({ ...form, taskDueDate: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-[#FFBE00]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Prioridad</label>
                <select
                  value={form.taskPriority}
                  onChange={e => setForm({ ...form, taskPriority: e.target.value })}
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
                onChange={e => setForm({ ...form, taskTitle: e.target.value })}
                placeholder={`Ej: Seguimiento: ${form.subject || 'Llamada comercial'}`}
                className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#FFBE00]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)} loading={loading}>Registrar Comunicación</Button>
      </div>
    </div>
  );
}
