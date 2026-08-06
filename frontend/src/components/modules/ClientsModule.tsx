'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Client } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Edit2, Trash2, User, Building2, Phone, Mail, Download, Upload, FileSpreadsheet, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { AddressInput } from '@/components/ui/AddressInput';
import { DynamicFieldsForm } from '@/components/common/DynamicFieldsForm';
import { useLanguageStore } from '@/store/languageStore';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  Green:  { label: 'Activo',     variant: 'success' },
  Yellow: { label: 'Atención',   variant: 'warning' },
  Red:    { label: 'Riesgo',     variant: 'danger'  },
  Grey:   { label: 'Inactivo',   variant: 'neutral' },
  'Cliente Activo': { label: 'Cliente Activo', variant: 'success' },
  Prospecto:        { label: 'Prospecto',      variant: 'warning' },
};

const getStatusConfig = (status?: string) => {
  if (!status) return { label: 'Inactivo', variant: 'neutral' as const };
  return statusConfig[status] || { label: status, variant: 'neutral' as const };
};

const statusDot: Record<string, string> = {
  Green:  'bg-emerald-500',
  Yellow: 'bg-amber-500',
  Red:    'bg-rose-500',
  Grey:   'bg-gray-400',
  'Cliente Activo': 'bg-emerald-500',
  Prospecto: 'bg-amber-500',
};

function ClientForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<Client>;
  onSave: (data: Partial<Client>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { t } = useLanguageStore();
  const [form, setForm] = useState<Partial<Client>>(initial || {
    status: 'Green',
    isClient: true,
    isSupplier: false,
    paymentTerms: '30 días',
  });

  const set = (k: keyof Client, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCustomFieldChange = (key: string, value: any) => {
    setForm(f => ({
      ...f,
      customFields: { ...f.customFields, [key]: value },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Role Selection Checkboxes */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-6">
        <span className="text-xs font-bold text-slate-700">{t('suppliers.roles', 'Roles del Tercero')}:</span>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isClient ?? true}
            onChange={e => set('isClient', e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
          />
          {t('suppliers.is_client', 'Es Cliente')}
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isSupplier ?? false}
            onChange={e => set('isSupplier', e.target.checked)}
            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
          />
          {t('suppliers.is_supplier', 'Es Proveedor')}
        </label>
      </div>

      <Input label={t('suppliers.code', 'Código de Tercero')} value={form.code || ''} onChange={e => set('code', e.target.value)} placeholder="TER-0001" />
      <Input label={`${t('suppliers.business_name', 'Razón Social / Nombre')} *`} value={form.businessName || ''} onChange={e => set('businessName', e.target.value)} placeholder="Agropecuaria El Sol S.A." />
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('suppliers.rut_label', 'RUT (Uruguay - 12 dígitos)')} value={form.taxId || ''} onChange={e => set('taxId', e.target.value)} placeholder="21XXXXXX0014" />
        <Select
          label={t('common.status', 'Estado')}
          value={form.status || 'Green'}
          onChange={e => set('status', e.target.value as any)}
          options={Object.entries(statusConfig).map(([v, c]) => ({ value: v, label: c.label }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Teléfono de contacto" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+598 99 123 456" />
        <Input label="Email de la Empresa *" value={form.companyEmail || ''} onChange={e => set('companyEmail', e.target.value)} placeholder="compras@elsol.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('suppliers.category', 'Rubro / Industria')} value={form.industry || ''} onChange={e => set('industry', e.target.value)} placeholder="Productor, Acopiador, Exportador..." />
        <Input label={t('suppliers.payment_terms', 'Condición de Pago')} value={form.paymentTerms || '30 días'} onChange={e => set('paymentTerms', e.target.value)} placeholder="Contado, 30 días, 60 días" />
      </div>
      <AddressInput label={t('suppliers.address', 'Dirección Fiscal')} value={form.address || ''} onChange={v => set('address', v)} placeholder="Ruta 5 Km 120, Durazno" />

      {/* Dynamic Extrafields Form */}
      <DynamicFieldsForm
        entityType="client"
        values={form.customFields || {}}
        onChange={handleCustomFieldChange}
      />

      <div className="flex gap-3 pt-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>{t('common.cancel', 'Cancelar')}</Button>
        <Button onClick={() => onSave(form)} loading={loading}>
          {initial?.id ? t('common.save', 'Guardar cambios') : t('suppliers.new_supplier', 'Crear tercero')}
        </Button>
      </div>
    </div>
  );
}

export function ClientsModule() {
  const { t } = useLanguageStore();
  const qc = useQueryClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'supplier' | 'both'>('all');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients?type=all').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Client>) => api.post('/clients', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModalOpen(false); toast.success('Tercero creado'); },
    onError: () => toast.error('Error al crear tercero'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      api.put(`/clients/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModalOpen(false); setEditTarget(null); toast.success('Tercero actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/clients/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Tercero eliminado'); },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleExportExcel = async () => {
    try {
      toast.loading('Generando Excel...', { id: 'export' });
      const res = await api.get('/clients/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'terceros_perfilcrm.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Terceros exportados', { id: 'export' });
    } catch {
      toast.error('Error al exportar terceros', { id: 'export' });
    }
  };

  const filtered = clients.filter(c => {
    const matchesSearch = c.businessName.toLowerCase().includes(search.toLowerCase()) ||
                          c.code?.toLowerCase().includes(search.toLowerCase()) ||
                          (c.taxId && c.taxId.includes(search)) ||
                          (c.companyEmail && c.companyEmail.toLowerCase().includes(search.toLowerCase()));
    
    const matchesRole =
      roleFilter === 'all' ? true :
      roleFilter === 'client' ? (c.isClient ?? true) :
      roleFilter === 'supplier' ? c.isSupplier :
      roleFilter === 'both' ? ((c.isClient ?? true) && c.isSupplier) : true;

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(c.status || 'Grey');

    return matchesSearch && matchesRole && matchesStatus;
  });

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (c: Client) => { setEditTarget(c); setModalOpen(true); };

  return (
    <div className="space-y-6">
      {/* Role Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Buscar por Razón Social, RUT, código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" icon={<Download className="w-4 h-4" />} onClick={handleExportExcel}>
              Exportar Excel
            </Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Nuevo Tercero
            </Button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 border-t pt-3 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase mr-1">Filtrar Rol:</span>
          {[
            { id: 'all', label: 'Todos los Terceros' },
            { id: 'client', label: 'Clientes' },
            { id: 'supplier', label: 'Proveedores' },
            { id: 'both', label: 'Clientes y Proveedores (Ambos)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Cargando terceros...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
          <Building2 className="w-8 h-8 opacity-30" />
          <p className="text-sm">Sin terceros registrados para este filtro</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const statusInfo = getStatusConfig(c.status);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => router.push(`/clients/${c.id}`)}
                      >
                        {c.businessName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3
                          className="font-bold text-gray-900 text-sm hover:text-amber-600 cursor-pointer"
                          onClick={() => router.push(`/clients/${c.id}`)}
                        >
                          {c.businessName}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">
                          RUT: {c.taxId || 'N/D'} {c.code && `| ${c.code}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Roles Badges */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {(c.isClient ?? true) && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                        Cliente
                      </span>
                    )}
                    {c.isSupplier && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                        Proveedor
                      </span>
                    )}
                    {c.industry && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded">
                        {c.industry}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-100">
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}
                      </div>
                    )}
                    {c.companyEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {c.companyEmail}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-400">Pago: <strong className="text-gray-700">{c.paymentTerms || '30 días'}</strong></span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 font-bold"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => router.push(`/clients/${c.id}`)}
                      >
                        Ver Ficha
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEdit(c)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />} onClick={() => deleteMut.mutate(c.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Tercero' : 'Nuevo Tercero'}>
        <ClientForm initial={editTarget || undefined} onSave={data => editTarget ? updateMut.mutate({ id: editTarget.id, data }) : createMut.mutate(data)} onCancel={() => setModalOpen(false)} loading={createMut.isPending || updateMut.isPending} />
      </Modal>
    </div>
  );
}
