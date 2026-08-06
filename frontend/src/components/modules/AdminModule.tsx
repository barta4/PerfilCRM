'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Users, Plus, Edit2, Shield, Activity, Server, CheckCircle, XCircle, Mail, Save, Calculator, Trash2, Settings, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales';
  isActive: boolean;
  createdAt: string;
  allowedModules: string[] | null;
  imageUrl?: string;
}

const roleVariant = {
  admin:   'danger',
  manager: 'warning',
  sales:   'default',
} as const;

const roleLabel = { admin: 'Administrador', manager: 'Gerente', sales: 'Ejecutivo' };

function EmailConfigForm() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [form, setForm] = useState({
    host: '', port: '587', user: '', pass: '', from: '', enabled: false
  });

  useQuery({
    queryKey: ['settings', 'smtp_config'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const smtp = res.data.find((s: any) => s.key === 'smtp_config');
      if (smtp) setForm(JSON.parse(smtp.value));
      return res.data;
    },
  });

  const save = async () => {
    setLoading(true);
    try {
      await api.post('/settings', { key: 'smtp_config', value: form });
      toast.success('Configuración de correo guardada');
    } catch {
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const testEmail = async () => {
    if (!testEmailTarget.trim()) {
      toast.error('Introduce un correo para la prueba');
      return;
    }
    setTesting(true);
    try {
      const res = await api.post('/settings/test-email', {
        to: testEmailTarget,
        config: form,
      });
      if (res.data.success) {
        toast.success('Correo de prueba enviado con éxito');
      } else {
        toast.error('Error: ' + res.data.message);
      }
    } catch (err: any) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${form.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <span className="text-sm font-medium">{form.enabled ? 'Servicio Activo' : 'Servicio Desactivado'}</span>
        </div>
        <button 
          onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? 'bg-pureza-blue' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Servidor SMTP" value={form.host} onChange={e => setForm({...form, host: e.target.value})} placeholder="smtp.gmail.com" autoComplete="off" />
        <Input label="Puerto" value={form.port} onChange={e => setForm({...form, port: e.target.value})} placeholder="587 o 465" autoComplete="off" />
      </div>
      <Input label="Usuario / Email" value={form.user} onChange={e => setForm({...form, user: e.target.value})} placeholder="notificaciones@empresa.com" autoComplete="off" />
      <Input label="Contraseña" type="password" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} placeholder="••••••••" autoComplete="new-password" />
      <Input label="Email de Remitente" value={form.from} onChange={e => setForm({...form, from: e.target.value})} placeholder="PERFILGRANOS CRM <no-reply@perfilgranos.com>" autoComplete="off" />
      
      <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 items-center flex-1 min-w-[280px] max-w-sm">
          <Input 
            placeholder="destinatario@correo.com" 
            value={testEmailTarget} 
            onChange={e => setTestEmailTarget(e.target.value)}
            className="py-1.5 px-3 text-xs w-full"
          />
          <Button 
            variant="ghost" 
            onClick={testEmail} 
            loading={testing}
            disabled={!testEmailTarget.trim()}
          >
            Probar
          </Button>
        </div>
        <Button icon={<Save className="w-4 h-4" />} onClick={save} loading={loading}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function QuotationConfigForm() {
  const [loading, setLoading] = useState(false);
  const [grainTypes, setGrainTypes] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);

  useQuery({
    queryKey: ['settings', 'quotations_config'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const grainsSetting = res.data.find((s: any) => s.key === 'quotation_grain_types');
      const termsSetting = res.data.find((s: any) => s.key === 'quotation_payment_terms');

      const loadedGrains = grainsSetting ? JSON.parse(grainsSetting.value) : [
        { id: 'soja', name: 'Soja (Zafra)', unit: 'Toneladas', referencePrice: 380 },
        { id: 'maiz', name: 'Maíz', unit: 'Toneladas', referencePrice: 200 },
        { id: 'trigo', name: 'Trigo', unit: 'Toneladas', referencePrice: 240 },
        { id: 'girasol', name: 'Girasol', unit: 'Toneladas', referencePrice: 410 },
      ];

      const loadedTerms = termsSetting ? JSON.parse(termsSetting.value) : [
        { id: 'contado', name: 'Contado' },
        { id: '30dias', name: 'Crédito 30 días' },
        { id: '60dias', name: 'Crédito 60 días' },
        { id: 'entrega', name: 'Contra Entrega' },
      ];

      setGrainTypes(loadedGrains);
      setPaymentTerms(loadedTerms);
      return res.data;
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/settings/batch', [
        { key: 'quotation_grain_types', value: grainTypes },
        { key: 'quotation_payment_terms', value: paymentTerms },
      ]);
      toast.success('Catálogo y condiciones comerciales guardadas con éxito.');
    } catch {
      toast.error('Error al guardar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  const addGrain = () => {
    setGrainTypes([...grainTypes, { id: `grano_${Date.now()}`, name: 'Nuevo Grano / Cereal', unit: 'Toneladas', referencePrice: 250 }]);
  };

  const updateGrain = (index: number, key: string, val: any) => {
    const updated = [...grainTypes];
    updated[index] = { ...updated[index], [key]: val };
    setGrainTypes(updated);
  };

  const removeGrain = (index: number) => {
    setGrainTypes(grainTypes.filter((_, i) => i !== index));
  };

  const addTerm = () => {
    setPaymentTerms([...paymentTerms, { id: `term_${Date.now()}`, name: 'Nueva Condición de Pago' }]);
  };

  const updateTerm = (index: number, key: string, val: any) => {
    const updated = [...paymentTerms];
    updated[index] = { ...updated[index], [key]: val };
    setPaymentTerms(updated);
  };

  const removeTerm = (index: number) => {
    setPaymentTerms(paymentTerms.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Granos / Productos */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="font-bold text-gray-800 text-sm">Catálogo de Granos y Precios de Referencia (USD)</h4>
            <p className="text-xs text-gray-500">Configura los productos habilitados para las órdenes de venta y cotizaciones.</p>
          </div>
          <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addGrain}>
            Añadir Grano / Producto
          </Button>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
          {grainTypes.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No hay productos configurados en el catálogo.</p>
          )}
          {grainTypes.map((grain, idx) => (
            <div key={grain.id || idx} className="flex gap-3 items-end">
              <div className="flex-[2]">
                {idx === 0 && <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre del Grano / Producto</label>}
                <Input
                  value={grain.name}
                  onChange={e => updateGrain(idx, 'name', e.target.value)}
                  placeholder="Ej: Soja Zafra 2026"
                  className="bg-white"
                />
              </div>
              <div className="flex-1">
                {idx === 0 && <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Unidad por defecto</label>}
                <Input
                  value={grain.unit}
                  onChange={e => updateGrain(idx, 'unit', e.target.value)}
                  placeholder="Toneladas"
                  className="bg-white"
                />
              </div>
              <div className="flex-1">
                {idx === 0 && <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Precio Ref. (USD/Ton)</label>}
                <Input
                  type="number"
                  value={grain.referencePrice}
                  onChange={e => updateGrain(idx, 'referencePrice', +e.target.value)}
                  placeholder="380"
                  className="bg-white font-bold text-emerald-700"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mb-1 text-gray-400 hover:text-rose-500"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => removeGrain(idx)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Condiciones de Pago */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="font-bold text-gray-800 text-sm">Condiciones de Pago Habilitadas</h4>
            <p className="text-xs text-gray-500">Términos comerciales disponibles al emitir órdenes de venta.</p>
          </div>
          <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addTerm}>
            Añadir Condición
          </Button>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
          {paymentTerms.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No hay condiciones de pago configuradas.</p>
          )}
          {paymentTerms.map((term, idx) => (
            <div key={term.id || idx} className="flex gap-3 items-end">
              <div className="flex-1">
                {idx === 0 && <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Descripción Término de Pago</label>}
                <Input
                  value={term.name}
                  onChange={e => updateTerm(idx, 'name', e.target.value)}
                  placeholder="Ej: Crédito 45 días"
                  className="bg-white"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mb-1 text-gray-400 hover:text-rose-500"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => removeTerm(idx)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <Button icon={<Save className="w-4 h-4" />} onClick={handleSave} loading={loading}>
          Guardar Configuración Comercial
        </Button>
      </div>
    </div>
  );
}

function CompanyBrandingForm() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [companyName, setCompanyName] = useState('PerfilCRM');
  const [companyLogo, setCompanyLogo] = useState('');
  const [accentColor, setAccentColor] = useState('#FFBE00');
  const [navbarBg, setNavbarBg] = useState('#2D2D2D');

  useQuery({
    queryKey: ['settings', 'branding'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const nameSet = res.data.find((s: any) => s.key === 'company_name');
      const logoSet = res.data.find((s: any) => s.key === 'company_logo');
      const accentSet = res.data.find((s: any) => s.key === 'theme_accent_color');
      const bgSet = res.data.find((s: any) => s.key === 'theme_navbar_bg');

      if (nameSet) setCompanyName(nameSet.value);
      if (logoSet) setCompanyLogo(logoSet.value);
      if (accentSet) setAccentColor(accentSet.value);
      if (bgSet) setNavbarBg(bgSet.value);
      return res.data;
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/documents/upload?entityType=company_logo&entityId=main', formData);
      setCompanyLogo(res.data.filename);
      toast.success('Logo subido con éxito. Guarda los cambios para aplicar.');
    } catch {
      toast.error('Error al subir el logo corporativo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/settings/batch', [
        { key: 'company_name', value: companyName },
        { key: 'company_logo', value: companyLogo },
        { key: 'theme_accent_color', value: accentColor },
        { key: 'theme_navbar_bg', value: navbarBg },
      ]);
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configuración de marca y empresa guardada con éxito.');
    } catch {
      toast.error('Error al guardar la marca');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de la Empresa</label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ej: Agropecuaria El Sol S.A."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Logo Corporativo (PNG, SVG, JPG)</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
            />
            {uploadingLogo && <span className="text-xs text-amber-600 font-bold">Subiendo...</span>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Color de Acento / Destacado</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Color de Fondo del Menú Superior</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={navbarBg}
              onChange={(e) => setNavbarBg(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              value={navbarBg}
              onChange={(e) => setNavbarBg(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Vista Previa del Menú Superior:</span>
        <div
          style={{ backgroundColor: navbarBg, borderColor: accentColor }}
          className="p-3 rounded-lg border-b-2 flex items-center justify-between text-white"
        >
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img
                src={`/api/documents/${companyLogo}`}
                alt="Logo Preview"
                className="h-8 max-w-[140px] object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <div
                style={{ backgroundColor: accentColor, color: '#2D2D2D' }}
                className="px-3 py-1 rounded font-black text-xs"
              >
                {companyName ? companyName.substring(0, 3).toUpperCase() : 'CRM'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase">
            <span style={{ color: accentColor }}>INICIO</span>
            <span className="opacity-70">COMERCIAL</span>
            <span className="opacity-70">OPERACIONES</span>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button icon={<Save className="w-4 h-4" />} onClick={handleSave} loading={loading}>
          Guardar Marca y Empresa
        </Button>
      </div>
    </div>
  );
}

function AiProviderConfigForm() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [providerName, setProviderName] = useState('OpenAI Compatible');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [systemPrompt, setSystemPrompt] = useState(
    'Eres el Agente Inteligente Comercial y Operativo de PerfilCRM. Ayudas a gestionar terceros, tareas, comunicaciones, cotizaciones e inventario de forma profesional y eficiente.'
  );

  useQuery({
    queryKey: ['settings', 'ai_provider'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const pName = res.data.find((s: any) => s.key === 'ai_provider_name');
      const bUrl = res.data.find((s: any) => s.key === 'ai_base_url');
      const aKey = res.data.find((s: any) => s.key === 'ai_api_key');
      const mod = res.data.find((s: any) => s.key === 'ai_model');
      const temp = res.data.find((s: any) => s.key === 'ai_temperature');
      const mTok = res.data.find((s: any) => s.key === 'ai_max_tokens');
      const sysP = res.data.find((s: any) => s.key === 'ai_system_prompt');

      if (pName) setProviderName(pName.value);
      if (bUrl) setBaseUrl(bUrl.value);
      if (aKey) setApiKey(aKey.value);
      if (mod) setModel(mod.value);
      if (temp) setTemperature(temp.value);
      if (mTok) setMaxTokens(mTok.value);
      if (sysP) setSystemPrompt(sysP.value);
      return res.data;
    },
  });

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await api.post('/ai/test-connection', {
        providerName,
        baseUrl,
        apiKey,
        model,
      });
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al probar conexión con proveedor de IA');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/settings/batch', [
        { key: 'ai_provider_name', value: providerName },
        { key: 'ai_base_url', value: baseUrl },
        { key: 'ai_api_key', value: apiKey },
        { key: 'ai_model', value: model },
        { key: 'ai_temperature', value: temperature },
        { key: 'ai_max_tokens', value: maxTokens },
        { key: 'ai_system_prompt', value: systemPrompt },
      ]);
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configuración del Agente de IA guardada con éxito.');
    } catch {
      toast.error('Error al guardar la configuración de IA');
    } finally {
      setLoading(false);
    }
  };

  const presetProviders = [
    { name: 'OpenAI (GPT-4o / GPT-4o-mini)', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    { name: 'Ollama (Local)', url: 'http://localhost:11434/v1', model: 'llama3.1' },
    { name: 'Groq (Ultra-Rápido)', url: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile' },
    { name: 'Mistral AI', url: 'https://api.mistral.ai/v1', model: 'mistral-large-latest' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-lg border border-slate-200">
        <span className="text-xs font-bold text-slate-700">Preajustes Rápidos:</span>
        {presetProviders.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setProviderName(p.name);
              setBaseUrl(p.url);
              setModel(p.model);
            }}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-800"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del Proveedor de IA"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          placeholder="Ej: OpenAI, Ollama, Groq, Azure"
        />
        <Input
          label="Base URL (Protocolo OpenAI Compatible)"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
        <Input
          label="API Key / Token"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-proj-..."
        />
        <Input
          label="Modelo (Model Identifier)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="gpt-4o-mini, llama3.1, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Temperatura ({temperature})</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full"
          />
        </div>
        <Input
          label="Tokens Máximos de Respuesta"
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Prompt de Sistema del Agente</label>
        <textarea
          rows={3}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={handleTestConnection} loading={testing}>
          Probar Conexión con Proveedor IA
        </Button>
        <Button icon={<Save className="w-4 h-4" />} onClick={handleSave} loading={loading}>
          Guardar Configuración de IA
        </Button>
      </div>
    </div>
  );
}

function UserForm({ initial, onSave, onCancel, loading }: {
  initial?: Partial<User>;
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password?: string;
    role: string;
    allowedModules: string[] | null;
    imageUrl?: string;
  }>({
    name: initial?.name || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'sales',
    allowedModules: initial?.allowedModules ?? null,
    imageUrl: initial?.imageUrl || '',
  });

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/documents/upload?entityType=user_profile&entityId=${initial?.id || 'new'}`, formData);
      set('imageUrl', res.data.filename);
      toast.success('Foto subida. Recuerda guardar el usuario.');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploading(false);
    }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const ALL_MODULES = [
    { id: 'dashboard', label: 'Inicio / Dashboard' },
    { id: 'clients', label: 'Clientes' },
    { id: 'quotations', label: 'Cotizaciones / Órdenes' },
    { id: 'events', label: 'Agenda' },
    { id: 'visits', label: 'Visitas y Comunicaciones' },
    { id: 'tasks', label: 'Tareas' },
    { id: 'reports', label: 'Reportes' },
    { id: 'campaigns', label: 'Campañas' },
    { id: 'inventory', label: 'Inventario' },
    { id: 'staff', label: 'Personal' },
  ];

  const handleModuleToggle = (moduleId: string) => {
    if (form.allowedModules === null) {
      // Si era null, significa que tenía acceso total. Al tocar un checkbox, pasa a modo estricto, 
      // manteniendo todos excepto el que desmarcó.
      set('allowedModules', ALL_MODULES.map(m => m.id).filter(id => id !== moduleId));
    } else {
      if (form.allowedModules.includes(moduleId)) {
        set('allowedModules', form.allowedModules.filter(id => id !== moduleId));
      } else {
        set('allowedModules', [...form.allowedModules, moduleId]);
      }
    }
  };

  const setFullAccess = (full: boolean) => {
    set('allowedModules', full ? null : []);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative group shrink-0">
          <div className="w-16 h-16 bg-[#00a8e8]/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#00a8e8] transition-all">
            {form.imageUrl ? (
              <img 
                src={`/api/documents/${form.imageUrl}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#2D2D2D] font-bold text-lg">
                {form.name ? form.name.substring(0, 2).toUpperCase() : 'US'}
              </span>
            )}
            
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-white text-[10px] font-bold">Subir</span>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700">Foto de perfil</p>
          <p className="text-xs text-gray-500">Haz clic en la imagen para cambiarla (JPG, PNG).</p>
        </div>
      </div>
      <Input label="Nombre completo" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan García" />
      <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@pureza.uy" />
      <Input
        label="Contraseña"
        type="password"
        value={form.password}
        onChange={e => set('password', e.target.value)}
        placeholder={initial?.id ? "Dejar en blanco para conservar" : "••••••••"}
      />
      <Select label="Rol" value={form.role} onChange={e => set('role', e.target.value)}
        options={[
          { value: 'sales', label: 'Ejecutivo de Cuenta' },
          { value: 'manager', label: 'Gerente Comercial' },
          { value: 'admin', label: 'Administrador' },
        ]} />

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-gray-700 uppercase">Permisos de Módulos</label>
          {form.role !== 'admin' && (
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowedModules === null}
                onChange={(e) => setFullAccess(e.target.checked)}
                className="rounded border-gray-300 text-pureza-blue focus:ring-pureza-blue w-3.5 h-3.5"
              />
              Acceso Total
            </label>
          )}
        </div>

        {form.role === 'admin' ? (
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
            Los administradores siempre tienen acceso total a todos los módulos.
          </p>
        ) : form.allowedModules === null ? (
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
            El usuario tiene acceso total. Desmarca la casilla superior para limitar permisos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-[160px] overflow-y-auto">
            {ALL_MODULES.map(m => (
              <label key={m.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-white p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={form.allowedModules?.includes(m.id) || false}
                  onChange={() => handleModuleToggle(m.id)}
                  className="rounded border-gray-300 text-pureza-blue focus:ring-pureza-blue w-3.5 h-3.5"
                />
                {m.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 justify-end mt-4 border-t border-gray-100 pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => {
          const payload: any = { ...form };
          if (initial?.id && !payload.password) {
            delete payload.password;
          }
          onSave(payload);
        }} loading={loading}>{initial?.id ? 'Guardar' : 'Crear usuario'}</Button>
      </div>
    </div>
  );
}

interface AdminModuleProps {
  initialTab?: 'users' | 'system' | 'email' | 'quotations' | 'automation';
}

export function AdminModule({ initialTab = 'users' }: AdminModuleProps) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'users' | 'system' | 'email' | 'quotations' | 'automation'>(initialTab);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [navieraStatus, setNavieraStatus] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/users', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); toast.success('Usuario creado'); },
    onError: () => toast.error('Error al crear usuario'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/users/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); toast.success('Actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario eliminado'); },
    onError: () => toast.error('Error al eliminar usuario'),
  });

  const checkNaviera = async () => {
    const res = await api.get('/naviera/status');
    setNavieraStatus(res.data);
  };

  const checkAi = async () => {
    const res = await api.get('/ai/status');
    setAiStatus(res.data);
  };

  const toggleActive = (user: User) => updateMut.mutate({ id: user.id, data: { isActive: !user.isActive } });

  const tabs = [
    { id: 'users', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { id: 'system', label: 'Sistema', icon: <Server className="w-4 h-4" /> },
    { id: 'email', label: 'Correo', icon: <Mail className="w-4 h-4" /> },
    { id: 'quotations', label: 'Cotizador', icon: <Calculator className="w-4 h-4" /> },
    { id: 'automation', label: 'Agente IA & Reglas', icon: <Bot className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditTarget(null); setModalOpen(true); }}>
              Nuevo usuario
            </Button>
          </div>
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm">Gestión de usuarios del sistema</h3>
            </CardHeader>
            <CardBody className="p-0">
              {isLoading ? (
                <div className="py-10 text-center text-gray-400 text-sm">Cargando...</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-pureza-blue/10 flex items-center justify-center text-pureza-blue font-bold text-sm shrink-0">
                        {user.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                          <Badge variant={roleVariant[user.role]}><Shield className="w-3 h-3" />{roleLabel[user.role]}</Badge>
                          {!user.isActive && <Badge variant="neutral">Inactivo</Badge>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => { setEditTarget(user); setModalOpen(true); }}>
                          Editar
                        </Button>
                        <Button variant={user.isActive ? 'danger' : 'ghost'} size="sm"
                          icon={user.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          onClick={() => toggleActive(user)} loading={updateMut.isPending}>
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que deseas eliminar a ${user.name}?`)) {
                              deleteMut.mutate(user.id);
                            }
                          }} loading={deleteMut.isPending}>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* System tab */}
      {tab === 'system' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-600" /> Personalización de Marca y Empresa (White-Label)
              </h3>
            </CardHeader>
            <CardBody>
              <CompanyBrandingForm />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-600" /> Administración de Módulos del Sistema
              </h3>
            </CardHeader>
            <CardBody>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Motor Modular Estilo Dolibarr</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    La activación, desactivación y permisos de los módulos se gestionan de forma dinámica en la consola central de Módulos.
                  </p>
                </div>
                <Link
                  href="/admin/modules"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg whitespace-nowrap shadow-sm transition-colors"
                >
                  Ir a Módulos →
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" /> Núcleo de Inteligencia Artificial Conversacional (OpenAI-Compatible)
              </h3>
            </CardHeader>
            <CardBody>
              <AiProviderConfigForm />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Server className="w-4 h-4" /> Variables de entorno (solo lectura)
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {[
                  { key: 'DATABASE_URL', value: 'postgres://***@localhost:5432/pureza_crm' },
                  { key: 'NODE_ENV', value: process.env.NODE_ENV || 'development' },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-pureza-blue">{item.key}</code>
                    <span className="text-gray-300">→</span>
                    <code className="text-xs font-mono text-gray-600">{item.value}</code>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Email configuration tab */}
      {tab === 'email' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-pureza-blue" /> Configuración de Servidor SMTP
              </h3>
            </CardHeader>
            <CardBody>
              <EmailConfigForm />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Quotation configuration tab */}
      {tab === 'quotations' && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#FFBE00]" /> Configuración del Catálogo de Granos y Condiciones de Venta
              </h3>
            </CardHeader>
            <CardBody>
              <QuotationConfigForm />
            </CardBody>
          </Card>
        </div>
      )}

      {/* AI & Automation tab */}
      {tab === 'automation' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600" /> Núcleo de Inteligencia Artificial Conversacional (OpenAI-Compatible)
              </h3>
            </CardHeader>
            <CardBody>
              <AiProviderConfigForm />
            </CardBody>
          </Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }}
        title={editTarget ? 'Editar usuario' : 'Nuevo usuario'} size="md">
        <UserForm
          initial={editTarget || undefined}
          onSave={data => editTarget ? updateMut.mutate({ id: editTarget.id, data }) : createMut.mutate(data)}
          onCancel={() => { setModalOpen(false); setEditTarget(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>
    </div>
  );
}
