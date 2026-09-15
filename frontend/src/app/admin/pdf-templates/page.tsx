'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  FileCode,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Star,
  CheckCircle2,
  Palette,
  Layout,
  FileText,
  Building2,
  Check,
  X,
  Sparkles,
  Sliders,
  ShieldCheck,
  Download,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { PdfTemplate, PdfTemplateLayoutConfig } from '@/types';

const CATEGORY_LABELS: Record<string, { label: string; color: 'default' | 'warning' | 'neutral' | 'success' }> = {
  grains: { label: 'Granos & Acopio', color: 'warning' },
  corporate: { label: 'Corporativo & Trading', color: 'neutral' },
  inputs: { label: 'Insumos & Agroquímicos', color: 'success' },
  minimal: { label: 'Minimalista', color: 'default' },
};

const COLOR_PRESETS = [
  {
    name: 'Oro & Grafito (Perfilgranos)',
    primary: '#FFBE00',
    secondary: '#2D2D2D',
    headerBg: '#2D2D2D',
    headerTextColor: '#FFFFFF',
    accent: '#FFBE00',
  },
  {
    name: 'Azul Ejecutivo Corporativo',
    primary: '#2563EB',
    secondary: '#0F172A',
    headerBg: '#0F172A',
    headerTextColor: '#FFFFFF',
    accent: '#3B82F6',
  },
  {
    name: 'Verde Campo & Insumos',
    primary: '#059669',
    secondary: '#064E3B',
    headerBg: '#064E3B',
    headerTextColor: '#FFFFFF',
    accent: '#10B981',
  },
  {
    name: 'Ámbar & Cosecha Zafra',
    primary: '#D97706',
    secondary: '#1F2937',
    headerBg: '#1F2937',
    headerTextColor: '#FFFFFF',
    accent: '#F59E0B',
  },
];

export default function PdfTemplatesAdminPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PdfTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'layout' | 'clauses'>('general');

  // Preview Modal
  const [previewModalId, setPreviewModalId] = useState<number | null>(null);

  // Form State
  const defaultLayoutConfig: PdfTemplateLayoutConfig = {
    documentTitle: 'COTIZACIÓN / ORDEN DE VENTA',
    theme: {
      primaryColor: '#FFBE00',
      secondaryColor: '#2D2D2D',
      headerBg: '#2D2D2D',
      headerTextColor: '#FFFFFF',
      tableHeaderBg: '#2D2D2D',
      tableHeaderTextColor: '#FFFFFF',
      accentColor: '#FFBE00',
    },
    company: {
      showLogo: true,
      businessName: 'PERFILGRANOS S.A.',
      subtitle: 'Acopio, Corretaje y Logística Comercial de Granos',
      taxId: 'RUT: 214589630014',
      phone: 'Tel: +598 99 226 940',
      email: 'contacto@perfilgranos.com',
      website: 'www.perfilgranos.com',
    },
    sections: {
      showClientBox: true,
      showDeliveryDate: true,
      showPaymentTerms: true,
      showDeliveriesTable: true,
      showCommercialNotes: true,
      showSignatures: true,
      signatureType: 'double',
      signature1Label: 'FIRMA AUTORIZADA PERFILGRANOS S.A.',
      signature2Label: 'FIRMA Y CONFORMIDAD PRODUCTOR',
      showFooter: true,
      footerText: 'Perfilgranos CRM — Documento emitido electrónicamente.',
    },
    columns: {
      showProductCode: false,
      showUnit: true,
      showDeliveredQuantity: true,
      showUnitPrice: true,
      showSubtotal: true,
    },
    commercialClauses: [
      'Grano puesto en silo acordado. Sujeto a análisis de humedad y tolerancia.',
      'Validez de la Oferta: 5 días hábiles desde la fecha de emisión.',
    ],
    bankDetails: 'Banco Santander Uruguay | Cuenta Corriente USD: 120-4589632',
  };

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    category: 'grains',
    isDefault: false,
    isActive: true,
    layoutConfig: defaultLayoutConfig,
  });

  const [newClauseInput, setNewClauseInput] = useState('');

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<PdfTemplate[]>({
    queryKey: ['pdf_templates'],
    queryFn: () => api.get('/pdf-templates').then(r => r.data),
  });

  // Create Mutation
  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/pdf-templates', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdf_templates'] });
      toast.success('Plantilla PDF creada exitosamente.');
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error('Error al crear plantilla: ' + (err.response?.data?.message || err.message)),
  });

  // Update Mutation
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/pdf-templates/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdf_templates'] });
      toast.success('Plantilla PDF actualizada correctamente.');
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error('Error al actualizar plantilla: ' + (err.response?.data?.message || err.message)),
  });

  // Delete Mutation
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/pdf-templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdf_templates'] });
      toast.success('Plantilla PDF eliminada.');
    },
    onError: (err: any) => toast.error('Error: ' + (err.response?.data?.message || err.message)),
  });

  // Set Default Mutation
  const setDefaultMut = useMutation({
    mutationFn: (id: number) => api.put(`/pdf-templates/${id}/default`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdf_templates'] });
      toast.success('Plantilla establecida como predeterminada.');
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setForm({
      name: '',
      code: `TPL_${Date.now().toString().slice(-4)}`,
      description: '',
      category: 'grains',
      isDefault: false,
      isActive: true,
      layoutConfig: JSON.parse(JSON.stringify(defaultLayoutConfig)),
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: PdfTemplate) => {
    setEditingTemplate(t);
    setForm({
      name: t.name,
      code: t.code,
      description: t.description || '',
      category: t.category || 'grains',
      isDefault: t.isDefault,
      isActive: t.isActive,
      layoutConfig: {
        ...defaultLayoutConfig,
        ...(t.layoutConfig || {}),
        theme: { ...defaultLayoutConfig.theme, ...(t.layoutConfig?.theme || {}) },
        company: { ...defaultLayoutConfig.company, ...(t.layoutConfig?.company || {}) },
        sections: { ...defaultLayoutConfig.sections, ...(t.layoutConfig?.sections || {}) },
        columns: { ...defaultLayoutConfig.columns, ...(t.layoutConfig?.columns || {}) },
        commercialClauses: t.layoutConfig?.commercialClauses || defaultLayoutConfig.commercialClauses,
      },
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Ingresa un nombre para la plantilla');
      return;
    }
    if (!form.code.trim()) {
      toast.error('Ingresa un código identificador');
      return;
    }

    if (editingTemplate) {
      updateMut.mutate({ id: editingTemplate.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const handleAddClause = () => {
    if (!newClauseInput.trim()) return;
    setForm(f => ({
      ...f,
      layoutConfig: {
        ...f.layoutConfig,
        commercialClauses: [...(f.layoutConfig.commercialClauses || []), newClauseInput.trim()],
      },
    }));
    setNewClauseInput('');
  };

  const handleRemoveClause = (index: number) => {
    setForm(f => ({
      ...f,
      layoutConfig: {
        ...f.layoutConfig,
        commercialClauses: f.layoutConfig.commercialClauses.filter((_, i) => i !== index),
      },
    }));
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setForm(f => ({
      ...f,
      layoutConfig: {
        ...f.layoutConfig,
        theme: {
          ...f.layoutConfig.theme,
          primaryColor: preset.primary,
          secondaryColor: preset.secondary,
          headerBg: preset.headerBg,
          headerTextColor: preset.headerTextColor,
          tableHeaderBg: preset.headerBg,
          tableHeaderTextColor: preset.headerTextColor,
          accentColor: preset.accent,
        },
      },
    }));
    toast.success(`Paleta aplicada: ${preset.name}`);
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          icon={FileCode}
          title="Gestor de Plantillas PDF"
          description="Personaliza membretes, paletas cromáticas, columnas y cláusulas para emitir diferentes formatos según el tipo de cliente."
        />
        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Nueva Plantilla
        </Button>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#2D2D2D] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas ({templates.length})
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => {
              const count = templates.filter(t => t.category === catKey).length;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === catKey
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-72">
            <Input
              placeholder="Buscar plantilla por nombre o código..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs"
            />
          </div>
        </CardBody>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredTemplates.map(tpl => {
          const catInfo = CATEGORY_LABELS[tpl.category] || { label: tpl.category, color: 'default' };
          const theme = tpl.layoutConfig?.theme || defaultLayoutConfig.theme;
          const company = tpl.layoutConfig?.company || defaultLayoutConfig.company;
          const sections = tpl.layoutConfig?.sections || defaultLayoutConfig.sections;

          return (
            <Card
              key={tpl.id}
              className={`transition-all hover:shadow-md border ${
                tpl.isDefault ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-200'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: theme.primaryColor || '#FFBE00' }}
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      {tpl.name}
                      {tpl.isDefault && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Predeterminada
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-mono text-gray-400">{tpl.code}</p>
                  </div>
                </div>

                <Badge variant={catInfo.color}>{catInfo.label}</Badge>
              </CardHeader>

              <CardBody className="p-5 space-y-4">
                <p className="text-xs text-gray-600 line-clamp-2">
                  {tpl.description || 'Sin descripción detallada.'}
                </p>

                {/* Theme Palette Preview */}
                <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span>Paleta & Membrete:</span>
                    <span className="font-semibold text-gray-700">{company.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-md shadow-xs border border-gray-200"
                        style={{ backgroundColor: theme.primaryColor }}
                        title={`Color Primario: ${theme.primaryColor}`}
                      />
                      <div
                        className="w-5 h-5 rounded-md shadow-xs border border-gray-200"
                        style={{ backgroundColor: theme.secondaryColor }}
                        title={`Color Secundario: ${theme.secondaryColor}`}
                      />
                      <div
                        className="w-5 h-5 rounded-md shadow-xs border border-gray-200"
                        style={{ backgroundColor: theme.headerBg }}
                        title={`Fondo Tabla: ${theme.headerBg}`}
                      />
                    </div>

                    <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                    {/* Section Features Badges */}
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {sections.showDeliveriesTable && (
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          Remitos
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                        {sections.signatureType === 'double' ? 'Doble Firma' : 'Firma Simple'}
                      </span>
                      {tpl.layoutConfig?.commercialClauses?.length > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                          {tpl.layoutConfig.commercialClauses.length} Cláusulas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {!tpl.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefaultMut.mutate(tpl.id)}
                        className="text-xs text-amber-600 hover:text-amber-700"
                        icon={<Star className="w-3.5 h-3.5" />}
                      >
                        Hacer Default
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewModalId(tpl.id)}
                      icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                      className="text-xs"
                    >
                      Ver PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenEdit(tpl)}
                      icon={<Edit2 className="w-3.5 h-3.5 text-gray-600" />}
                      className="text-xs"
                    >
                      Editar
                    </Button>
                    {!tpl.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Eliminar la plantilla '${tpl.name}'?`)) {
                            deleteMut.mutate(tpl.id);
                          }
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      />
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* EDIT / CREATE MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? `Editar Plantilla: ${editingTemplate.name}` : 'Nueva Plantilla de Cotización PDF'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'general'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> General
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'branding'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> Branding & Colores
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'layout'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layout className="w-3.5 h-3.5" /> Estructura & Columnas
            </button>
            <button
              onClick={() => setActiveTab('clauses')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'clauses'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Cláusulas & Banco
            </button>
          </div>

          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la Plantilla *"
                  placeholder="ej. Contrato Zafra Granos"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Código Identificador *"
                  placeholder="ej. GRAINS_HARVEST"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Categoría Comercial"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  options={[
                    { value: 'grains', label: 'Granos & Acopio' },
                    { value: 'corporate', label: 'Corporativo & Trading' },
                    { value: 'inputs', label: 'Insumos & Agroquímicos' },
                    { value: 'minimal', label: 'Minimalista' },
                  ]}
                />
                <Input
                  label="Título del Documento Impreso"
                  placeholder="ej. COTIZACIÓN / ORDEN DE VENTA"
                  value={form.layoutConfig.documentTitle}
                  onChange={e =>
                    setForm({
                      ...form,
                      layoutConfig: { ...form.layoutConfig, documentTitle: e.target.value },
                    })
                  }
                />
              </div>

              <Textarea
                label="Descripción Interna"
                placeholder="Indica para qué tipo de clientes o contratos se recomienda esta plantilla..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
              />

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-gray-700">Establecer como Predeterminada</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-gray-700">Plantilla Activa</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING & COLORES */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              {/* Quick Preset Buttons */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Paletas Cromáticas Predefinidas:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyColorPreset(p)}
                      className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Inputs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Color Principal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.layoutConfig.theme.primaryColor}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, primaryColor: e.target.value },
                          },
                        })
                      }
                      className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={form.layoutConfig.theme.primaryColor}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, primaryColor: e.target.value },
                          },
                        })
                      }
                      className="text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Color Secundario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.layoutConfig.theme.secondaryColor}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, secondaryColor: e.target.value },
                          },
                        })
                      }
                      className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={form.layoutConfig.theme.secondaryColor}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, secondaryColor: e.target.value },
                          },
                        })
                      }
                      className="text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fondo de Tablas</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.layoutConfig.theme.tableHeaderBg}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, tableHeaderBg: e.target.value },
                          },
                        })
                      }
                      className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={form.layoutConfig.theme.tableHeaderBg}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, tableHeaderBg: e.target.value },
                          },
                        })
                      }
                      className="text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Color Acento</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.layoutConfig.theme.accentColor}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, accentColor: e.target.value },
                          },
                        })
                      }
                      className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={form.layoutConfig.theme.accentColor}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            theme: { ...form.layoutConfig.theme, accentColor: e.target.value },
                          },
                        })
                      }
                      className="text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Company Header Info */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" /> Datos del Emisor / Membrete
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Razón Social Empresa"
                    value={form.layoutConfig.company.businessName}
                    onChange={e =>
                      setForm({
                        ...form,
                        layoutConfig: {
                          ...form.layoutConfig,
                          company: { ...form.layoutConfig.company, businessName: e.target.value },
                        },
                      })
                    }
                  />
                  <Input
                    label="Subtítulo / Rubro"
                    value={form.layoutConfig.company.subtitle || ''}
                    onChange={e =>
                      setForm({
                        ...form,
                        layoutConfig: {
                          ...form.layoutConfig,
                          company: { ...form.layoutConfig.company, subtitle: e.target.value },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="RUT Emisor"
                    value={form.layoutConfig.company.taxId || ''}
                    onChange={e =>
                      setForm({
                        ...form,
                        layoutConfig: {
                          ...form.layoutConfig,
                          company: { ...form.layoutConfig.company, taxId: e.target.value },
                        },
                      })
                    }
                  />
                  <Input
                    label="Teléfono Contacto"
                    value={form.layoutConfig.company.phone || ''}
                    onChange={e =>
                      setForm({
                        ...form,
                        layoutConfig: {
                          ...form.layoutConfig,
                          company: { ...form.layoutConfig.company, phone: e.target.value },
                        },
                      })
                    }
                  />
                  <Input
                    label="Email Contacto"
                    value={form.layoutConfig.company.email || ''}
                    onChange={e =>
                      setForm({
                        ...form,
                        layoutConfig: {
                          ...form.layoutConfig,
                          company: { ...form.layoutConfig.company, email: e.target.value },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYOUT & SECTIONS */}
          {activeTab === 'layout' && (
            <div className="space-y-5">
              {/* Sections Toggles */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-gray-500" /> Visibilidad de Secciones del PDF
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.sections.showClientBox}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            sections: { ...form.layoutConfig.sections, showClientBox: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Recuadro de Datos del Cliente</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.sections.showDeliveriesTable}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            sections: { ...form.layoutConfig.sections, showDeliveriesTable: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Tabla de Remitos / Despachos Parciales</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.sections.showDeliveryDate}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            sections: { ...form.layoutConfig.sections, showDeliveryDate: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Fecha Estimada de Entrega</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.sections.showPaymentTerms}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            sections: { ...form.layoutConfig.sections, showPaymentTerms: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Condiciones de Pago</span>
                  </label>
                </div>
              </div>

              {/* Columns Toggles */}
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gray-500" /> Columnas en la Tabla de Productos
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.columns.showUnit}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            columns: { ...form.layoutConfig.columns, showUnit: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs text-gray-700">Unidad</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.columns.showUnitPrice}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            columns: { ...form.layoutConfig.columns, showUnitPrice: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs text-gray-700">Precio Unitario</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.columns.showSubtotal}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            columns: { ...form.layoutConfig.columns, showSubtotal: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs text-gray-700">Subtotal</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.layoutConfig.columns.showProductCode}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            columns: { ...form.layoutConfig.columns, showProductCode: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs text-gray-700">Código de Ítem</span>
                  </label>
                </div>
              </div>

              {/* Signatures Configuration */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" /> Configuración de Firmas
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Modalidad de Firma"
                    value={form.layoutConfig.sections.signatureType}
                    onChange={e =>
                      setForm({
                        ...form,
                        layoutConfig: {
                          ...form.layoutConfig,
                          sections: {
                            ...form.layoutConfig.sections,
                            signatureType: e.target.value as any,
                          },
                        },
                      })
                    }
                    options={[
                      { value: 'double', label: 'Doble Firma (Empresa + Cliente)' },
                      { value: 'single', label: 'Firma Simple (Solo Empresa)' },
                    ]}
                  />

                  <Input
                    label="Etiqueta Firma 1"
                    value={form.layoutConfig.sections.signature1Label}
                    onChange={e =>
                      setForm({
                        ...form,
                        layoutConfig: {
                          ...form.layoutConfig,
                          sections: { ...form.layoutConfig.sections, signature1Label: e.target.value },
                        },
                      })
                    }
                  />

                  {form.layoutConfig.sections.signatureType === 'double' && (
                    <Input
                      label="Etiqueta Firma 2"
                      value={form.layoutConfig.sections.signature2Label}
                      onChange={e =>
                        setForm({
                          ...form,
                          layoutConfig: {
                            ...form.layoutConfig,
                            sections: { ...form.layoutConfig.sections, signature2Label: e.target.value },
                          },
                        })
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLAUSES & BANK */}
          {activeTab === 'clauses' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cláusulas Comerciales & Legales
                </label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Escribe una nueva cláusula legal o condición de entrega..."
                    value={newClauseInput}
                    onChange={e => setNewClauseInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddClause();
                      }
                    }}
                    className="text-xs"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddClause}>
                    Agregar
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
                  {form.layoutConfig.commercialClauses.map((clause, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 shadow-2xs"
                    >
                      <span className="flex-1 pr-2">• {clause}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClause(idx)}
                        className="text-rose-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.layoutConfig.commercialClauses.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">No hay cláusulas añadidas.</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Input
                  label="Datos Bancarios para Transferencias"
                  placeholder="ej. Banco Santander Uruguay | Cuenta Corriente USD: 120-4589632"
                  value={form.layoutConfig.bankDetails || ''}
                  onChange={e =>
                    setForm({
                      ...form,
                      layoutConfig: { ...form.layoutConfig, bankDetails: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Input
                  label="Texto de Pie de Página"
                  placeholder="ej. Perfilgranos CRM — Documento emitido electrónicamente."
                  value={form.layoutConfig.sections.footerText || ''}
                  onChange={e =>
                    setForm({
                      ...form,
                      layoutConfig: {
                        ...form.layoutConfig,
                        sections: { ...form.layoutConfig.sections, footerText: e.target.value },
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              loading={createMut.isPending || updateMut.isPending}
            >
              Guardar Plantilla
            </Button>
          </div>
        </div>
      </Modal>

      {/* LIVE PREVIEW MODAL */}
      <Modal
        open={previewModalId !== null}
        onClose={() => setPreviewModalId(null)}
        title="Vista Previa de Plantilla PDF"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <span>Se muestra una cotización ficticia con el diseño de la plantilla seleccionada.</span>
            {previewModalId && (
              <a
                href={`/api/pdf-templates/${previewModalId}/preview${token ? `?token=${token}` : ''}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold"
              >
                <Download className="w-3.5 h-3.5" /> Abrir en pestaña nueva
              </a>
            )}
          </div>

          {previewModalId && (
            <div className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-gray-100">
              <iframe
                src={`/api/pdf-templates/${previewModalId}/preview${token ? `?token=${token}` : ''}`}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
}
