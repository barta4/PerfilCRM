'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import {
  Sliders, Plus, Trash2, HelpCircle, X
} from 'lucide-react';

interface CustomFieldDef {
  id: string;
  entityType: string;
  key: string;
  label: string;
  type: 'string' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
  options: string[];
  required: boolean;
  order: number;
  isActive: boolean;
}

const ENTITY_OPTIONS = [
  { value: 'client', label: 'Clientes y Proveedores - Terceros (crm_clients / procurement_suppliers)' },
  { value: 'quotation', label: 'Cotizaciones / Órdenes (sales_quotations)' },
  { value: 'visit', label: 'Visitas y Comunicaciones (comms_visits)' },
  { value: 'task', label: 'Tareas (ops_tasks)' },
  { value: 'product', label: 'Productos e Inventario (inventory_stock)' },
  { value: 'inspection', label: 'Inspecciones de Campo (inspections_field)' },
];

export default function CustomFieldsAdminPage() {
  const [selectedEntity, setSelectedEntity] = useState('client');
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State for New Field
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<'string' | 'number' | 'select' | 'date' | 'boolean' | 'textarea'>('string');
  const [formOptions, setFormOptions] = useState('');
  const [formRequired, setFormRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFields = async (entity: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/core/custom-fields/${entity}`);
      setFields(res.data);
    } catch (err: any) {
      console.error('Error al cargar campos personalizados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields(selectedEntity);
  }, [selectedEntity]);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKey || !formLabel) {
      alert('La clave y la etiqueta son obligatorias.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedOptions =
        formType === 'select'
          ? formOptions.split(',').map((o) => o.trim()).filter(Boolean)
          : [];

      await api.post('/core/custom-fields', {
        entityType: selectedEntity,
        key: formKey.trim().toLowerCase().replace(/\s+/g, '_'),
        label: formLabel.trim(),
        type: formType,
        options: parsedOptions,
        required: formRequired,
      });

      setShowModal(false);
      setFormKey('');
      setFormLabel('');
      setFormType('string');
      setFormOptions('');
      setFormRequired(false);
      fetchFields(selectedEntity);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al guardar el campo personalizado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este campo personalizado?')) return;
    try {
      await api.delete(`/core/custom-fields/${id}`);
      fetchFields(selectedEntity);
    } catch (err: any) {
      alert('Error al eliminar campo');
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Unified Banner */}
      <PageHeader
        icon={Sliders}
        title="Campos Personalizados (Extrafields Engine)"
        description="Agrega datos adicionales a cualquier entidad (Clientes, Cotizaciones, Visitas, Productos) adaptados al rubro de la empresa sin tocar código ni modificar esquemas SQL."
        action={
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}
          >
            Nuevo Campo Personalizado
          </Button>
        }
      />

      {/* Entity Selector Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Entidad Objetivo:</label>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFBE00] font-medium w-full sm:w-auto"
          >
            {ENTITY_OPTIONS.map((ent) => (
              <option key={ent.value} value={ent.value}>
                {ent.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fields List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">
            Campos Definidos para: <span className="text-amber-800 font-extrabold capitalize bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{selectedEntity}</span>
          </h3>
          <span className="text-xs text-gray-500 font-semibold">{fields.length} campos activos</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando campos personalizados...</div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No hay campos personalizados configurados para esta entidad.</p>
            <p className="text-xs text-gray-400">Haz clic en &quot;Nuevo Campo Personalizado&quot; para crear uno.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {fields.map((field) => (
              <div key={field.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{field.label}</span>
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      key: {field.key}
                    </span>
                    {field.required && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded border border-rose-200">
                        Requerido
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span>Tipo: <strong className="capitalize text-gray-700">{field.type}</strong></span>
                    {field.options && field.options.length > 0 && (
                      <span>Opciones: [{field.options.join(', ')}]</span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => handleDeleteField(field.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Creating New Extrafield */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Nuevo Campo Personalizado</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Clave Única (key):</label>
                <input
                  type="text"
                  required
                  placeholder="ej. hectares, vessel_imo, crop_type"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#FFBE00] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Etiqueta Visible (Label):</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Superficie (Ha), IMO Buque, Tipo de Cereal"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FFBE00] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Campo:</label>
                <select
                  value={formType}
                  onChange={(e: any) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FFBE00] outline-none"
                >
                  <option value="string">Texto Corto (string)</option>
                  <option value="textarea">Texto Largo (textarea)</option>
                  <option value="number">Número (number)</option>
                  <option value="select">Selección Desplegable (select)</option>
                  <option value="date">Fecha (date)</option>
                  <option value="boolean">Casilla Sí/No (boolean)</option>
                </select>
              </div>

              {formType === 'select' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Opciones (separadas por coma):
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Trigo, Maíz, Soja, Girasol"
                    value={formOptions}
                    onChange={(e) => setFormOptions(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FFBE00] outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req"
                  checked={formRequired}
                  onChange={(e) => setFormRequired(e.target.checked)}
                  className="w-4 h-4 accent-[#FFBE00] rounded"
                />
                <label htmlFor="req" className="text-xs font-medium text-gray-700 cursor-pointer">
                  Campo Obligatorio
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isSaving}>
                  Crear Campo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
