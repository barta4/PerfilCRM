'use client';

import React, { useEffect, useState } from 'react';
import { useModuleStore, ModuleRecord } from '@/store/moduleStore';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Boxes, Shield, CheckCircle2, XCircle, Search, AlertCircle,
  Users, MapPin, FileText, ClipboardList, Calendar, Package, ShieldCheck, Mail, Bot, BarChart3, Building2, Calculator, CalendarCheck
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  crm: 'CRM y Gestión Comercial',
  sales: 'Ventas y Cotizaciones',
  operations: 'Operaciones y Tareas',
  inventory: 'Inventario y Almacén',
  industry: 'Especialidad Industrial / Agro / Naviera',
  analytics: 'Analítica, Agente IA y BI',
};

const ICON_MAP: Record<string, any> = {
  crm_clients: Users,
  comms_visits: MapPin,
  sales_quotations: FileText,
  ops_tasks: ClipboardList,
  ops_events: Calendar,
  inventory_stock: Package,
  procurement_suppliers: Building2,
  inspections_field: ShieldCheck,
  email_campaigns: Mail,
  ai_automation: Bot,
  reports_bi: BarChart3,
  accounting_uruguay: Calculator,
  google_calendar: CalendarCheck,
};

export default function AdminModulesPage() {
  const { modules, isLoading, fetchModules, toggleModule } = useModuleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleToggle = async (mod: ModuleRecord) => {
    if (mod.isCore) return;
    setTogglingId(mod.id);
    try {
      await toggleModule(mod.id, !mod.isEnabled);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al modificar el estado del módulo');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(modules.map((m) => m.category)));

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Dynamic Unified Header Banner */}
      <PageHeader
        icon={Boxes}
        title="Gestión de Módulos"
        description="Activa o desactiva las funcionalidades del sistema según las necesidades operativas de la empresa. Los módulos desactivados ocultarán sus menús, servicios de API y widgets en tiempo real."
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFBE00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#2D2D2D] text-[#FFBE00] font-bold shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium'
            }`}
          >
            Todos ({modules.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#2D2D2D] text-[#FFBE00] font-bold shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Cargando catálogo de módulos...</div>
      ) : filteredModules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No se encontraron módulos con el filtro aplicado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => {
            const IconComp = ICON_MAP[mod.id] || Boxes;
            const isPending = togglingId === mod.id;

            return (
              <div
                key={mod.id}
                className={`bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between p-5 ${
                  mod.isEnabled ? 'border-amber-200/80 ring-1 ring-amber-100' : 'border-gray-200 opacity-75'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg border ${
                          mod.isEnabled ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{mod.name}</h3>
                        <span className="text-xs text-gray-400 font-mono">v{mod.version}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    {mod.isCore ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Core
                      </span>
                    ) : mod.isEnabled ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded text-xs font-semibold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-xs mb-4 min-h-[36px] line-clamp-2">{mod.description}</p>

                  {/* Category pill */}
                  <div className="mb-4">
                    <span className="inline-block px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-md text-[11px] font-medium">
                      {CATEGORY_LABELS[mod.category] || mod.category}
                    </span>
                  </div>
                </div>

                {/* Toggle Control */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {mod.isCore
                      ? 'Obligatorio en el sistema'
                      : mod.isEnabled
                      ? 'Módulo Habilitado'
                      : 'Módulo Deshabilitado'}
                  </span>

                  <button
                    disabled={mod.isCore || isPending}
                    onClick={() => handleToggle(mod)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      mod.isCore
                        ? 'bg-amber-400 cursor-not-allowed opacity-60'
                        : mod.isEnabled
                        ? 'bg-[#2D2D2D]'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        mod.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
