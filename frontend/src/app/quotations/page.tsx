'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { FileText, Trash2, Send, Plus, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function QuotationsContent() {
  const searchParams = useSearchParams();
  const paramClientId = searchParams.get('clientId') || '';

  const qc = useQueryClient();
  const [form, setForm] = useState({
    clientId: paramClientId,
    paymentTerms: 'Contado',
    notes: '',
    items: [
      { productName: 'Soja', unit: 'Toneladas', quantity: 50, unitPrice: 380 },
    ],
  });

  useEffect(() => {
    if (paramClientId) {
      setForm(f => ({ ...f, clientId: paramClientId }));
    }
  }, [paramClientId]);

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  // Fetch quotations (backend filters by user if sales executive)
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => api.get('/quotations').then(r => r.data),
  });

  // Create mutation
  const createQuotationMut = useMutation({
    mutationFn: (data: any) => api.post('/quotations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización / Orden de Venta guardada con éxito.');
      setForm({
        clientId: paramClientId,
        paymentTerms: 'Contado',
        notes: '',
        items: [{ productName: 'Soja', unit: 'Toneladas', quantity: 50, unitPrice: 380 }],
      });
    },
    onError: () => toast.error('Error al guardar la cotización.'),
  });

  // Send email mutation
  const sendEmailMut = useMutation({
    mutationFn: (id: number) => api.post(`/quotations/${id}/send-email`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Orden enviada por email al cliente y copia a la empresa.');
    },
    onError: () => toast.error('Error al enviar la orden por correo.'),
  });

  // Delete mutation
  const deleteQuotationMut = useMutation({
    mutationFn: (id: number) => api.delete(`/quotations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización eliminada.');
    },
  });

  // Fetch settings for grain catalogue and payment terms
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const grainTypesSetting = settings.find((s: any) => s.key === 'quotation_grain_types');
  const configuredGrains = grainTypesSetting && Array.isArray(JSON.parse(grainTypesSetting.value))
    ? JSON.parse(grainTypesSetting.value)
    : [
      { id: 'soja', name: 'Soja', unit: 'Toneladas', referencePrice: 380 },
      { id: 'maiz', name: 'Maíz', unit: 'Toneladas', referencePrice: 200 },
      { id: 'trigo', name: 'Trigo', unit: 'Toneladas', referencePrice: 240 },
      { id: 'girasol', name: 'Girasol', unit: 'Toneladas', referencePrice: 410 },
    ];

  const paymentTermsSetting = settings.find((s: any) => s.key === 'quotation_payment_terms');
  const configuredPaymentTerms = paymentTermsSetting && Array.isArray(JSON.parse(paymentTermsSetting.value))
    ? JSON.parse(paymentTermsSetting.value)
    : [
      { id: 'contado', name: 'Contado' },
      { id: '30dias', name: 'Crédito 30 días' },
      { id: '60dias', name: 'Crédito 60 días' },
      { id: 'entrega', name: 'Contra Entrega' },
    ];

  const handleAddItem = () => {
    const firstGrain = configuredGrains[0] || { name: 'Soja', unit: 'Toneladas', referencePrice: 380 };
    setForm(f => ({
      ...f,
      items: [...f.items, { productName: firstGrain.name, unit: firstGrain.unit || 'Toneladas', quantity: 50, unitPrice: firstGrain.referencePrice || 0 }],
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm(f => ({ ...f, items: newItems }));
  };

  const handleRemoveItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  };

  const handleSave = () => {
    if (!form.clientId) {
      toast.error('Por favor selecciona un cliente');
      return;
    }
    createQuotationMut.mutate({
      clientId: Number(form.clientId),
      paymentTerms: form.paymentTerms,
      notes: form.notes,
      items: form.items,
    });
  };

  const handleDownloadPdf = (qId: number) => {
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
    window.open(`/api/quotations/${qId}/pdf?token=${token}`, '_blank');
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FFBE00] flex items-center justify-center text-[#2D2D2D]">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Módulo de Órdenes de Venta y Cotizaciones</h1>
          <p className="text-xs text-gray-500">Gestión de cotizaciones de granos y envío automático al cliente con copia a la empresa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-bold text-gray-900">Nueva Cotización / Orden de Venta</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Cliente *"
                value={form.clientId}
                onChange={e => setForm({ ...form, clientId: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar cliente...' },
                  ...clients.map((c: any) => ({ value: c.id.toString(), label: `${c.businessName} (${c.companyEmail || 'Sin email'})` })),
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Condiciones de Pago"
                  value={form.paymentTerms}
                  onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                  options={configuredPaymentTerms.map((t: any) => ({
                    value: t.name,
                    label: t.name,
                  }))}
                />
              </div>

              {/* Items Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Granos / Productos</h3>
                  <Button type="button" size="sm" variant="ghost" icon={<Plus className="w-4 h-4 text-[#FFBE00]" />} onClick={handleAddItem}>
                    Agregar Línea
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => {
                    const subtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50 p-3 border border-gray-100 rounded-xl">
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs font-semibold text-gray-700">Producto / Grano *</label>
                          <select
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-[#FFBE00]"
                            value={configuredGrains.some((g: any) => g.name === item.productName) ? item.productName : (item.productName ? 'custom' : '')}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                handleItemChange(index, 'productName', '');
                              } else {
                                const selected = configuredGrains.find((g: any) => g.name === val);
                                if (selected) {
                                  handleItemChange(index, 'productName', selected.name);
                                  handleItemChange(index, 'unit', selected.unit || 'Toneladas');
                                  handleItemChange(index, 'unitPrice', selected.referencePrice || 0);
                                }
                              }
                            }}
                          >
                            <option value="">Seleccionar grano del catálogo...</option>
                            {configuredGrains.map((g: any) => (
                              <option key={g.id || g.name} value={g.name}>
                                {g.name} ({g.referencePrice ? `$${g.referencePrice}/Ton` : ''})
                              </option>
                            ))}
                            <option value="custom">+ Otro (Personalizado)...</option>
                          </select>
                          {(!configuredGrains.some((g: any) => g.name === item.productName)) && (
                            <input
                              className="w-full h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs font-medium mt-1"
                              placeholder="Escribe el nombre del producto..."
                              value={item.productName}
                              onChange={e => handleItemChange(index, 'productName', e.target.value)}
                            />
                          )}
                        </div>
                        <div className="w-full sm:w-28 space-y-1">
                          <label className="text-xs font-semibold text-gray-700">Unidad</label>
                          <input
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs"
                            value={item.unit}
                            onChange={e => handleItemChange(index, 'unit', e.target.value)}
                          />
                        </div>
                        <div className="w-full sm:w-28 space-y-1">
                          <label className="text-xs font-semibold text-gray-700">Cantidad</label>
                          <input
                            type="number"
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', +e.target.value)}
                          />
                        </div>
                        <div className="w-full sm:w-28 space-y-1">
                          <label className="text-xs font-semibold text-gray-700">Precio U. ($)</label>
                          <input
                            type="number"
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(index, 'unitPrice', +e.target.value)}
                          />
                        </div>
                        <div className="w-full sm:w-28 space-y-1 text-right">
                          <label className="text-xs font-semibold text-gray-500">Subtotal USD</label>
                          <p className="font-bold text-[#2D2D2D] py-1 text-sm">${subtotal.toLocaleString()}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-9 px-2 text-rose-500 hover:bg-rose-50" onClick={() => handleRemoveItem(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Textarea
                label="Observaciones"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Condiciones de flete, entrega en acopio..."
              />

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSave}
                  loading={createQuotationMut.isPending}
                  icon={<FileText className="w-4 h-4" />}
                >
                  Guardar Orden / Cotización
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Total Summary Card */}
        <Card className="bg-[#2D2D2D] text-white flex flex-col justify-between h-full border-2 border-[#FFBE00]">
          <CardHeader className="border-b border-white/10">
            <h2 className="font-bold text-[#FFBE00] uppercase tracking-wider text-xs">Resumen Total de la Orden</h2>
          </CardHeader>
          <CardBody className="flex flex-col justify-between flex-1 space-y-6">
            <div>
              <p className="text-xs text-gray-400">Total Cotizado</p>
              <h3 className="text-4xl font-black mt-2 text-[#FFBE00]">
                ${calculateTotal().toLocaleString()} <span className="text-lg font-normal text-white">USD</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-2">Al guardar o enviar, el Agente IA despachará la orden por correo al cliente copiando a la empresa.</p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2 text-xs text-gray-300">
              <p><strong>Líneas:</strong> {form.items.length} productos</p>
              <p><strong>Condiciones:</strong> {form.paymentTerms}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quotations List */}
      <Card>
        <CardHeader>
          <h2 className="font-bold text-gray-900">Listado de Cotizaciones / Órdenes de Venta</h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-4">N° Cotización</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Total USD</th>
                  <th className="p-4">Pago</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-400">Cargando cotizaciones...</td>
                  </tr>
                )}
                {!isLoading && quotations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-400">No hay cotizaciones registradas para tu usuario.</td>
                  </tr>
                )}
                {quotations.map((q: any) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{q.quotationNumber || `#${q.id}`}</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {q.client?.businessName || '—'}
                      <span className="block text-[10px] font-normal text-gray-400">{q.client?.companyEmail}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">{format(new Date(q.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="p-4 font-black text-[#2D2D2D]">
                      ${Number(q.totalAmount).toLocaleString()} USD
                    </td>
                    <td className="p-4 text-xs text-gray-600">{q.paymentTerms || 'Contado'}</td>
                    <td className="p-4">
                      <Badge variant={q.status === 'Sent' ? 'success' : q.status === 'Approved' ? 'success' : 'neutral'}>
                        {q.status === 'Sent' ? 'Enviada al Cliente' : q.status === 'Approved' ? 'Aprobada' : 'Borrador'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Download className="w-3.5 h-3.5 text-[#98D500]" />}
                        onClick={() => handleDownloadPdf(q.id)}
                        title="Descargar PDF oficial con encabezado y logo de Perfilgranos"
                      >
                        PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Send className="w-3.5 h-3.5 text-[#FFBE00]" />}
                        loading={sendEmailMut.isPending}
                        onClick={() => sendEmailMut.mutate(q.id)}
                        title="Enviar por email al cliente + CC empresa"
                      >
                        Enviar Email
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-500" />}
                        onClick={() => deleteQuotationMut.mutate(q.id)}
                        loading={deleteQuotationMut.isPending}
                        title="Eliminar"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFBE00]" />
      </div>
    }>
      <QuotationsContent />
    </Suspense>
  );
}
