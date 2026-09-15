'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  Trash2,
  Send,
  Plus,
  Download,
  Loader2,
  Edit2,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  PackageCheck,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  FileCode,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Quotation, QuotationItem, QuotationDelivery, PdfTemplate } from '@/types';

function QuotationsContent() {
  const searchParams = useSearchParams();
  const paramClientId = searchParams.get('clientId') || '';

  const qc = useQueryClient();

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNumber, setEditingNumber] = useState<string>('');
  const [form, setForm] = useState({
    clientId: paramClientId,
    templateId: '',
    paymentTerms: 'Contado',
    estimatedDeliveryDate: '',
    notes: '',
    items: [
      { productName: 'Soja', unit: 'Toneladas', quantity: 50, deliveredQuantity: 0, unitPrice: 380 },
    ],
  });

  // Delivery Modal State
  const [deliveryModalQuotation, setDeliveryModalQuotation] = useState<Quotation | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    itemId: '',
    productName: '',
    quantityDelivered: 0,
    deliveryDate: new Date().toISOString().slice(0, 10),
    remitoNumber: '',
    truckPlate: '',
    driverName: '',
    notes: '',
  });

  useEffect(() => {
    if (paramClientId && !editingId) {
      setForm(f => ({ ...f, clientId: paramClientId }));
    }
  }, [paramClientId, editingId]);

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  // Fetch quotations (backend filters by user if sales executive)
  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: () => api.get('/quotations').then(r => r.data),
  });

  // Fetch deliveries for currently open quotation modal
  const { data: currentDeliveries = [], refetch: refetchDeliveries } = useQuery<QuotationDelivery[]>({
    queryKey: ['quotation_deliveries', deliveryModalQuotation?.id],
    queryFn: () =>
      deliveryModalQuotation?.id
        ? api.get(`/quotations/${deliveryModalQuotation.id}/deliveries`).then(r => r.data)
        : Promise.resolve([]),
    enabled: !!deliveryModalQuotation?.id,
  });

  // Fetch settings for grain catalogue and payment terms
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const grainTypesSetting = settings.find((s: any) => s.key === 'quotation_grain_types');
  const configuredGrains =
    grainTypesSetting && Array.isArray(JSON.parse(grainTypesSetting.value))
      ? JSON.parse(grainTypesSetting.value)
      : [
          { id: 'soja', name: 'Soja', unit: 'Toneladas', referencePrice: 380 },
          { id: 'maiz', name: 'Maíz', unit: 'Toneladas', referencePrice: 200 },
          { id: 'trigo', name: 'Trigo', unit: 'Toneladas', referencePrice: 240 },
          { id: 'girasol', name: 'Girasol', unit: 'Toneladas', referencePrice: 410 },
        ];

  const paymentTermsSetting = settings.find((s: any) => s.key === 'quotation_payment_terms');
  const configuredPaymentTerms =
    paymentTermsSetting && Array.isArray(JSON.parse(paymentTermsSetting.value))
      ? JSON.parse(paymentTermsSetting.value)
      : [
          { id: 'contado', name: 'Contado' },
          { id: '30dias', name: 'Crédito 30 días' },
          { id: '60dias', name: 'Crédito 60 días' },
          { id: 'entrega', name: 'Contra Entrega' },
        ];

  // Fetch PDF Templates for dropdown selection
  const { data: pdfTemplates = [] } = useQuery<PdfTemplate[]>({
    queryKey: ['pdf_templates'],
    queryFn: () => api.get('/pdf-templates').then(r => r.data),
  });

  // Client change handler that auto-selects preferred template if configured
  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find((c: any) => c.id.toString() === clientId);
    const preferredTplId = selectedClient?.preferredPdfTemplate?.id?.toString() || '';
    setForm(f => ({
      ...f,
      clientId,
      templateId: preferredTplId || f.templateId,
    }));
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setEditingNumber('');
    setForm({
      clientId: paramClientId,
      templateId: '',
      paymentTerms: 'Contado',
      estimatedDeliveryDate: '',
      notes: '',
      items: [{ productName: 'Soja', unit: 'Toneladas', quantity: 50, deliveredQuantity: 0, unitPrice: 380 }],
    });
  };

  // Create mutation
  const createQuotationMut = useMutation({
    mutationFn: (data: any) => api.post('/quotations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización / Orden de Venta guardada con éxito.');
      resetForm();
    },
    onError: () => toast.error('Error al guardar la cotización.'),
  });

  // Update mutation
  const updateQuotationMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/quotations/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización actualizada correctamente.');
      resetForm();
    },
    onError: () => toast.error('Error al actualizar la cotización.'),
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

  // Delete quotation mutation
  const deleteQuotationMut = useMutation({
    mutationFn: (id: number) => api.delete(`/quotations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización eliminada.');
    },
  });

  // Complete quotation mutation
  const completeQuotationMut = useMutation({
    mutationFn: (id: number) => api.put(`/quotations/${id}/complete`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      refetchDeliveries();
      toast.success('Orden completada y ajustada exitosamente a las cantidades entregadas.');
      if (deliveryModalQuotation && res.data) {
        setDeliveryModalQuotation(res.data);
      }
    },
    onError: (err: any) => toast.error('Error al completar la orden: ' + (err.response?.data?.message || err.message)),
  });

  // Create Delivery mutation
  const createDeliveryMut = useMutation({
    mutationFn: ({ quotationId, data }: { quotationId: number; data: any }) =>
      api.post(`/quotations/${quotationId}/deliveries`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      refetchDeliveries();
      toast.success('Despacho / Entrega registrada con éxito');
      setDeliveryForm({
        itemId: '',
        productName: '',
        quantityDelivered: 0,
        deliveryDate: new Date().toISOString().slice(0, 10),
        remitoNumber: '',
        truckPlate: '',
        driverName: '',
        notes: '',
      });
      if (deliveryModalQuotation) {
        api.get(`/quotations/${deliveryModalQuotation.id}`).then(res => {
          if (res.data) setDeliveryModalQuotation(res.data);
        });
      }
    },
    onError: (err: any) => toast.error('Error al registrar entrega: ' + (err.response?.data?.message || err.message)),
  });

  // Delete Delivery mutation
  const deleteDeliveryMut = useMutation({
    mutationFn: (deliveryId: number) => api.delete(`/quotations/deliveries/${deliveryId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      refetchDeliveries();
      toast.success('Remito anulado y saldo restituido');
      if (deliveryModalQuotation) {
        api.get(`/quotations/${deliveryModalQuotation.id}`).then(res => {
          if (res.data) setDeliveryModalQuotation(res.data);
        });
      }
    },
    onError: () => toast.error('Error al eliminar entrega.'),
  });

  // Item form helpers
  const handleAddItem = () => {
    const firstGrain = configuredGrains[0] || { name: 'Soja', unit: 'Toneladas', referencePrice: 380 };
    setForm(f => ({
      ...f,
      items: [
        ...f.items,
        {
          productName: firstGrain.name,
          unit: firstGrain.unit || 'Toneladas',
          quantity: 50,
          deliveredQuantity: 0,
          unitPrice: firstGrain.referencePrice || 0,
        },
      ],
    }));
  };

  const handleUpdateItem = (
    index: number,
    updates: Partial<{ productName: string; unit: string; quantity: number; deliveredQuantity: number; unitPrice: number }>
  ) => {
    setForm(f => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...updates } : it)),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    handleUpdateItem(index, { [field]: value });
  };

  const handleRemoveItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  };

  const calculateTotalTons = () => {
    return form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  };

  // Start Editing Quotation
  const handleStartEdit = (q: Quotation) => {
    setEditingId(q.id);
    setEditingNumber(q.quotationNumber || `COT-${q.id}`);
    setForm({
      clientId: q.client?.id?.toString() || '',
      templateId: q.template?.id?.toString() || '',
      paymentTerms: q.paymentTerms || 'Contado',
      estimatedDeliveryDate: q.estimatedDeliveryDate ? q.estimatedDeliveryDate.slice(0, 10) : '',
      notes: q.notes || '',
      items:
        q.items && q.items.length > 0
          ? q.items.map(it => ({
              productName: it.productName,
              unit: it.unit || 'Toneladas',
              quantity: Number(it.quantity || 0),
              deliveredQuantity: Number(it.deliveredQuantity || 0),
              unitPrice: Number(it.unitPrice || 0),
            }))
          : [{ productName: 'Soja', unit: 'Toneladas', quantity: 50, deliveredQuantity: 0, unitPrice: 380 }],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Quotation (Create or Update)
  const handleSave = () => {
    if (!form.clientId) {
      toast.error('Por favor selecciona un cliente');
      return;
    }
    const payload = {
      clientId: Number(form.clientId),
      templateId: form.templateId ? Number(form.templateId) : undefined,
      paymentTerms: form.paymentTerms,
      estimatedDeliveryDate: form.estimatedDeliveryDate || null,
      notes: form.notes,
      items: form.items,
    };

    if (editingId) {
      updateQuotationMut.mutate({ id: editingId, data: payload });
    } else {
      createQuotationMut.mutate(payload);
    }
  };

  const handleDownloadPdf = (qId: number, templateIdOverride?: number) => {
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
    const tplParam = templateIdOverride ? `&templateId=${templateIdOverride}` : '';
    window.open(`/api/quotations/${qId}/pdf?token=${token}${tplParam}`, '_blank');
  };

  // Compute fulfillment stats
  const getDeliveryStats = (q: Quotation) => {
    const totalOrdered = (q.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);
    const totalDelivered = (q.items || []).reduce((s, it) => s + Number(it.deliveredQuantity || 0), 0);
    const pending = Math.max(0, totalOrdered - totalDelivered);
    const pct = totalOrdered > 0 ? Math.min(100, Math.round((totalDelivered / totalOrdered) * 100)) : 0;
    return { totalOrdered, totalDelivered, pending, pct };
  };

  const totalUSD = calculateTotal();
  const totalTons = calculateTotalTons();

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFBE00] flex items-center justify-center text-[#2D2D2D] shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Módulo de Órdenes de Venta y Cotizaciones</h1>
            <p className="text-xs text-gray-500">
              Gestión comercial de granos, entregas parciales por remito y ajuste dinámico de contratos.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card (Full Width for Maximum Space) */}
      <Card className={editingId ? 'ring-2 ring-amber-400' : ''}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            {editingId ? <Edit2 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-gray-600" />}
            <h2 className="font-bold text-gray-900">
              {editingId ? `Editando Cotización #${editingNumber}` : 'Nueva Cotización / Orden de Venta'}
            </h2>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancelar edición
            </button>
          )}
        </CardHeader>
        <CardBody className="space-y-5 p-6">
          {/* Top Inputs: Client, Plantilla PDF, Payment Terms, Estimated Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Cliente *"
              value={form.clientId}
              onChange={e => handleClientChange(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar cliente...' },
                ...clients.map((c: any) => ({
                  value: c.id.toString(),
                  label: `${c.businessName} (${c.companyEmail || 'Sin email'})`,
                })),
              ]}
            />

            <Select
              label="Plantilla PDF"
              value={form.templateId}
              onChange={e => setForm({ ...form, templateId: e.target.value })}
              options={[
                { value: '', label: 'Automática (Predeterminada)' },
                ...pdfTemplates.map((t: PdfTemplate) => ({
                  value: t.id.toString(),
                  label: `${t.name}${t.isDefault ? ' (Default)' : ''}`,
                })),
              ]}
            />

            <Select
              label="Condiciones de Pago"
              value={form.paymentTerms}
              onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
              options={configuredPaymentTerms.map((t: any) => ({
                value: t.name,
                label: t.name,
              }))}
            />

            <Input
              label="Fecha Estimada de Entrega"
              type="date"
              value={form.estimatedDeliveryDate}
              onChange={e => setForm({ ...form, estimatedDeliveryDate: e.target.value })}
            />
          </div>

          {/* Grain Line Items Section */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Granos / Productos</h3>
                <span className="text-xs text-gray-400">({form.items.length} {form.items.length === 1 ? 'línea' : 'líneas'})</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Plus className="w-4 h-4 text-[#FFBE00]" />}
                onClick={handleAddItem}
              >
                Agregar Línea
              </Button>
            </div>

            <div className="space-y-2.5">
              {form.items.map((item, index) => {
                const subtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
                return (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-3 items-end bg-gray-50/80 p-3 border border-gray-200/80 rounded-xl hover:border-amber-300 transition-colors"
                  >
                    {/* Grain Dropdown */}
                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-xs font-semibold text-gray-700">Producto / Grano *</label>
                      <select
                        className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-[#FFBE00]"
                        value={
                          configuredGrains.some((g: any) => g.name === item.productName)
                            ? item.productName
                            : item.productName
                            ? 'custom'
                            : ''
                        }
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            handleUpdateItem(index, { productName: '' });
                          } else {
                            const selected = configuredGrains.find((g: any) => g.name === val);
                            if (selected) {
                              handleUpdateItem(index, {
                                productName: selected.name,
                                unit: selected.unit || 'Toneladas',
                                unitPrice: selected.referencePrice || 0,
                              });
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
                      {!configuredGrains.some((g: any) => g.name === item.productName) && (
                        <input
                          className="w-full h-8 px-2 bg-white border border-gray-300 rounded-lg text-xs font-medium mt-1"
                          placeholder="Escribe el nombre del producto..."
                          value={item.productName}
                          onChange={e => handleItemChange(index, 'productName', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Unit */}
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Unidad</label>
                      <input
                        className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs"
                        value={item.unit}
                        onChange={e => handleItemChange(index, 'unit', e.target.value)}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Cantidad</label>
                      <input
                        type="number"
                        className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', +e.target.value)}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Precio U. ($)</label>
                      <input
                        type="number"
                        className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(index, 'unitPrice', +e.target.value)}
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-full md:w-36 space-y-1 text-right">
                      <label className="text-xs font-semibold text-gray-500">Subtotal USD</label>
                      <p className="font-black text-[#2D2D2D] py-1 text-sm">${subtotal.toLocaleString()}</p>
                    </div>

                    {/* Remove Line */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-rose-500 hover:bg-rose-50"
                      onClick={() => handleRemoveItem(index)}
                      title="Eliminar línea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observations */}
          <Textarea
            label="Observaciones Comerciales / Logísticas"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Condiciones de flete, lugar y tolerancia de acopio, entrega en silo..."
            rows={2}
          />

          {/* Compact Summary & Action Bar */}
          <div className="p-4 bg-gradient-to-r from-gray-900 via-[#2D2D2D] to-gray-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-gray-800">
            {/* Left: Stats & Info */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Líneas:</strong> {form.items.length} {form.items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Volumen Total:</strong> <span className="font-bold text-white">{totalTons}</span> Toneladas
                </span>
              </div>
              {form.estimatedDeliveryDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>
                    <strong>Entrega:</strong> {format(new Date(form.estimatedDeliveryDate + 'T12:00:00'), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Total Amount & Buttons */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total Cotizado</span>
                <span className="text-2xl font-black text-[#FFBE00]">
                  ${totalUSD.toLocaleString()} <span className="text-xs font-normal text-gray-300">USD</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {editingId && (
                  <Button variant="ghost" className="text-gray-300 hover:text-white" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  loading={createQuotationMut.isPending || updateQuotationMut.isPending}
                  icon={editingId ? <Edit2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  className="bg-[#FFBE00] text-[#2D2D2D] hover:bg-[#e6ab00] font-bold shadow-md"
                >
                  {editingId ? 'Actualizar Cotización' : 'Guardar Cotización'}
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

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
                  <th className="p-4">Fecha Emisión</th>
                  <th className="p-4">Est. Entrega</th>
                  <th className="p-4">Total USD</th>
                  <th className="p-4">Pago</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Entrega / Fulfillment</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-gray-400">
                      Cargando cotizaciones...
                    </td>
                  </tr>
                )}
                {!isLoading && quotations.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-gray-400">
                      No hay cotizaciones registradas para tu usuario.
                    </td>
                  </tr>
                )}
                {quotations.map(q => {
                  const { totalOrdered, totalDelivered, pending, pct } = getDeliveryStats(q);
                  return (
                    <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{q.quotationNumber || `#${q.id}`}</div>
                        <div className="text-[10px] text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/50 w-fit mt-0.5 flex items-center gap-1 font-medium">
                          <FileCode className="w-2.5 h-2.5" />
                          {q.template?.name || 'Estándar'}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        {q.client?.businessName || '—'}
                        <span className="block text-[10px] font-normal text-gray-400">{q.client?.companyEmail}</span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">{format(new Date(q.createdAt), 'dd/MM/yyyy')}</td>
                      <td className="p-4 text-xs font-medium text-gray-700">
                        {q.estimatedDeliveryDate ? (
                          <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 w-fit">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            {format(new Date(q.estimatedDeliveryDate + 'T12:00:00'), 'dd/MM/yyyy')}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">A coordinar</span>
                        )}
                      </td>
                      <td className="p-4 font-black text-[#2D2D2D]">
                        ${Number(q.totalAmount).toLocaleString()} USD
                      </td>
                      <td className="p-4 text-xs text-gray-600">{q.paymentTerms || 'Contado'}</td>
                      <td className="p-4">
                        {q.status === 'Completed' || q.deliveryStatus === 'completed' ? (
                          <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                            ✓ Completada
                          </Badge>
                        ) : (
                          <Badge
                            variant={q.status === 'Sent' ? 'success' : q.status === 'Approved' ? 'success' : 'neutral'}
                          >
                            {q.status === 'Sent' ? 'Enviada' : q.status === 'Approved' ? 'Aprobada' : 'Borrador'}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 min-w-[130px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-gray-700">
                              {totalDelivered} / {totalOrdered} Ton
                            </span>
                            <span
                              className={`font-bold ${
                                pct >= 100 || q.status === 'Completed' || q.deliveryStatus === 'completed'
                                  ? 'text-emerald-600'
                                  : pct > 0
                                  ? 'text-amber-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {q.status === 'Completed' || q.deliveryStatus === 'completed' ? '100%' : `${pct}%`}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= 100 || q.status === 'Completed' || q.deliveryStatus === 'completed'
                                  ? 'bg-emerald-500'
                                  : pct > 0
                                  ? 'bg-amber-500'
                                  : 'bg-gray-300'
                              }`}
                              style={{ width: `${q.status === 'Completed' || q.deliveryStatus === 'completed' ? 100 : pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {q.status === 'Completed' || q.deliveryStatus === 'completed'
                              ? 'Completado y Cerrado'
                              : pct >= 100
                              ? 'Completado'
                              : `Resta: ${pending} Ton`}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Complete Button (if has deliveries and not yet completed) */}
                          {!(q.status === 'Completed' || q.deliveryStatus === 'completed') && totalDelivered > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              loading={completeQuotationMut.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    `¿Deseas finalizar la orden #${
                                      q.quotationNumber || q.id
                                    } y adaptarla a las ${totalDelivered} Ton entregadas? Se bloquearán ediciones y nuevos despachos.`
                                  )
                                ) {
                                  completeQuotationMut.mutate(q.id);
                                }
                              }}
                              title="Completar y adaptar a lo entregado"
                            >
                              Completar
                            </Button>
                          )}

                          {/* Entregas Modal Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:bg-amber-50"
                            icon={<Truck className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setDeliveryModalQuotation(q);
                              if (q.items && q.items.length > 0) {
                                setDeliveryForm((df) => ({
                                  ...df,
                                  itemId: q.items![0].id?.toString() || '',
                                  productName: q.items![0].productName,
                                }));
                              }
                            }}
                            title="Gestionar Entregas y Remitos"
                          >
                            Entregas
                          </Button>

                          {/* Edit Button (disabled if completed) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={q.status === 'Completed' || q.deliveryStatus === 'completed'}
                            className={
                              q.status === 'Completed' || q.deliveryStatus === 'completed'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-blue-600 hover:bg-blue-50'
                            }
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                            onClick={() => {
                              if (!(q.status === 'Completed' || q.deliveryStatus === 'completed')) {
                                handleStartEdit(q);
                              }
                            }}
                            title={
                              q.status === 'Completed' || q.deliveryStatus === 'completed'
                                ? 'Orden completada y cerrada para edición'
                                : 'Editar Cotización'
                            }
                          >
                            Editar
                          </Button>

                          {/* PDF Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Download className="w-3.5 h-3.5 text-[#98D500]" />}
                            onClick={() => handleDownloadPdf(q.id)}
                            title="Descargar PDF"
                          >
                            PDF
                          </Button>

                          {/* Send Email Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Send className="w-3.5 h-3.5 text-[#FFBE00]" />}
                            loading={sendEmailMut.isPending}
                            onClick={() => sendEmailMut.mutate(q.id)}
                            title="Enviar por email al cliente"
                          >
                            Email
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-rose-500" />}
                            onClick={() => deleteQuotationMut.mutate(q.id)}
                            loading={deleteQuotationMut.isPending}
                            title="Eliminar"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Deliveries & Fulfillment Modal */}
      <Modal
        open={!!deliveryModalQuotation}
        onClose={() => setDeliveryModalQuotation(null)}
        title={`Despachos y Entregas Parciales — ${deliveryModalQuotation?.quotationNumber || `#${deliveryModalQuotation?.id}`}`}
        size="lg"
      >
        {deliveryModalQuotation && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-900 text-sm">
                    {deliveryModalQuotation.client?.businessName || 'Cliente'}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Registra los viajes y remitos entregados para descontar progresivamente las toneladas pendientes.
                </p>
              </div>
              <div className="text-right">
                {(() => {
                  const { totalOrdered, totalDelivered, pending, pct } = getDeliveryStats(deliveryModalQuotation);
                  return (
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900">
                        {totalDelivered} / {totalOrdered} Ton ({pct}%)
                      </span>
                      <p className="text-[10px] text-gray-500">Saldo: {pending} Ton</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Line items progress */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estado por Producto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(deliveryModalQuotation.items || []).map((item, idx) => {
                  const ordered = Number(item.quantity || 0);
                  const delivered = Number(item.deliveredQuantity || 0);
                  const pending = Math.max(0, ordered - delivered);
                  const itemPct = ordered > 0 ? Math.min(100, Math.round((delivered / ordered) * 100)) : 0;
                  return (
                    <div key={item.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">{item.productName}</span>
                        <Badge variant={itemPct >= 100 ? 'success' : itemPct > 0 ? 'warning' : 'neutral'}>
                          {itemPct >= 100 ? 'Completado' : `${itemPct}%`}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-600">
                        <span>Orden: {ordered} Ton</span>
                        <span>Entregado: {delivered} Ton</span>
                        <span className="font-bold text-amber-700">Resta: {pending} Ton</span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${itemPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${itemPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* New Dispatch Form or Completed Banner */}
            {deliveryModalQuotation.status === 'Completed' || deliveryModalQuotation.deliveryStatus === 'completed' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">Orden de Venta Finalizada y Cerrada</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Esta cotización fue completada y adaptada exactamente a las cantidades entregadas. No admite nuevos remitos ni modificaciones.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {(() => {
                  const { totalDelivered } = getDeliveryStats(deliveryModalQuotation);
                  if (totalDelivered > 0) {
                    return (
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-amber-950 text-xs block">¿Finalizar entregas antes de completar el cupo inicial?</span>
                          <p className="text-[11px] text-amber-800">
                            Puedes cerrar la orden ahora. Las cantidades se ajustarán exactamente a las {totalDelivered} Ton entregadas.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 shadow-sm"
                          icon={<CheckCircle2 className="w-4 h-4" />}
                          loading={completeQuotationMut.isPending}
                          onClick={() => {
                            if (
                              confirm(
                                `¿Deseas finalizar la orden #${
                                  deliveryModalQuotation.quotationNumber || deliveryModalQuotation.id
                                } con ${totalDelivered} Ton entregadas?`
                              )
                            ) {
                              completeQuotationMut.mutate(deliveryModalQuotation.id);
                            }
                          }}
                        >
                          Completar Orden
                        </Button>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-600" /> Registrar Nuevo Despacho / Remito
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Producto *"
                      value={deliveryForm.itemId}
                      onChange={e => {
                        const id = e.target.value;
                        const it = deliveryModalQuotation.items?.find(i => i.id?.toString() === id);
                        setDeliveryForm({
                          ...deliveryForm,
                          itemId: id,
                          productName: it?.productName || '',
                        });
                      }}
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        ...(deliveryModalQuotation.items || []).map(it => ({
                          value: it.id?.toString() || '',
                          label: `${it.productName} (Resta: ${Math.max(
                            0,
                            Number(it.quantity || 0) - Number(it.deliveredQuantity || 0)
                          )} Ton)`,
                        })),
                      ]}
                    />

                    <Input
                      label="Toneladas Entregadas *"
                      type="number"
                      placeholder="ej: 32.5"
                      value={deliveryForm.quantityDelivered ? deliveryForm.quantityDelivered.toString() : ''}
                      onChange={e => setDeliveryForm({ ...deliveryForm, quantityDelivered: Number(e.target.value) })}
                    />

                    <Input
                      label="Fecha de Entrega *"
                      type="date"
                      value={deliveryForm.deliveryDate}
                      onChange={e => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Nº de Remito / Guía"
                      placeholder="ej: REM-001420"
                      value={deliveryForm.remitoNumber}
                      onChange={e => setDeliveryForm({ ...deliveryForm, remitoNumber: e.target.value })}
                    />

                    <Input
                      label="Matrícula Camión"
                      placeholder="ej: STP-1234"
                      value={deliveryForm.truckPlate}
                      onChange={e => setDeliveryForm({ ...deliveryForm, truckPlate: e.target.value })}
                    />

                    <Input
                      label="Chofer / Empresa de Flete"
                      placeholder="ej: Juan Pérez"
                      value={deliveryForm.driverName}
                      onChange={e => setDeliveryForm({ ...deliveryForm, driverName: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Observaciones (Silo de descarga, pesaje báscula, etc.)"
                    placeholder="Descargado en Silo 3..."
                    value={deliveryForm.notes}
                    onChange={e => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  />

                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      icon={<PackageCheck className="w-4 h-4" />}
                      loading={createDeliveryMut.isPending}
                      onClick={() => {
                        if (!deliveryForm.quantityDelivered || deliveryForm.quantityDelivered <= 0) {
                          toast.error('Ingresa las toneladas entregadas');
                          return;
                        }
                        createDeliveryMut.mutate({
                          quotationId: deliveryModalQuotation.id,
                          data: deliveryForm,
                        });
                      }}
                    >
                      Registrar Entrega
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Deliveries History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Historial de Entregas Realizadas ({currentDeliveries.length})
              </h4>
              {currentDeliveries.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-gray-100">
                  No se han registrado entregas para esta cotización aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-600">
                        <th className="p-2.5">Fecha</th>
                        <th className="p-2.5">Nº Remito</th>
                        <th className="p-2.5">Producto</th>
                        <th className="p-2.5">Entregado</th>
                        <th className="p-2.5">Camión / Chofer</th>
                        <th className="p-2.5">Notas</th>
                        <th className="p-2.5 text-right">Anular</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentDeliveries.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-medium text-gray-700">
                            {format(new Date(d.deliveryDate), 'dd/MM/yyyy')}
                          </td>
                          <td className="p-2.5 font-bold text-gray-900">{d.remitoNumber || '—'}</td>
                          <td className="p-2.5 font-medium text-gray-800">{d.productName || d.item?.productName || 'Granos'}</td>
                          <td className="p-2.5 font-black text-emerald-700">{Number(d.quantityDelivered)} Ton</td>
                          <td className="p-2.5 text-gray-600">
                            {d.truckPlate ? `${d.truckPlate} ` : ''}
                            {d.driverName ? `(${d.driverName})` : '—'}
                          </td>
                          <td className="p-2.5 text-gray-500 italic truncate max-w-[150px]">{d.notes || '—'}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`¿Anular remito #${d.remitoNumber || d.id} y restituir ${d.quantityDelivered} Ton al saldo?`)) {
                                  deleteDeliveryMut.mutate(d.id);
                                }
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                              title="Anular remito"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setDeliveryModalQuotation(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFBE00]" />
        </div>
      }
    >
      <QuotationsContent />
    </Suspense>
  );
}
