'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface CustomFieldDef {
  id: string;
  entityType: string;
  key: string;
  label: string;
  type: 'string' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
  options: string[];
  required: boolean;
}

interface DynamicFieldsFormProps {
  entityType: string;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function DynamicFieldsForm({ entityType, values, onChange }: DynamicFieldsFormProps) {
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get(`/core/custom-fields/${entityType}`)
      .then((res) => {
        if (isMounted) {
          setFields(res.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error al cargar extrafields para', entityType, err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [entityType]);

  if (isLoading || fields.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 mt-4">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        Campos Específicos / Personalizados
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const val = values?.[field.key] ?? field.options?.[0] ?? '';

          if (field.type === 'string') {
            return (
              <div key={field.id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={field.required}
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            );
          }

          if (field.type === 'number') {
            return (
              <div key={field.id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  required={field.required}
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  required={field.required}
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === 'date') {
            return (
              <div key={field.id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  required={field.required}
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            );
          }

          if (field.type === 'boolean') {
            return (
              <div key={field.id} className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id={`field_${field.id}`}
                  checked={!!val}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor={`field_${field.id}`} className="text-xs font-semibold text-gray-700">
                  {field.label}
                </label>
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.id} className="col-span-full">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={field.required}
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
