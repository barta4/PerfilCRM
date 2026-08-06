'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Client } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DynamicFieldsForm } from '@/components/common/DynamicFieldsForm';
import { useLanguageStore } from '@/store/languageStore';
import {
  Calculator, Plus, Trash2, BookOpen, Layers, Scale, PieChart,
  FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface Account {
  id: number;
  code: string;
  name: string;
  type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Egreso';
  parentCode?: string;
  balance: number;
  isActive: boolean;
  customFields?: Record<string, any>;
}

export interface JournalEntryLine {
  id?: number;
  accountId: number;
  account?: Account;
  clientId?: number;
  client?: Client;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  date: string;
  concept: string;
  documentReference?: string;
  status: 'Draft' | 'Posted';
  totalAmount: number;
  lines: JournalEntryLine[];
  customFields?: Record<string, any>;
  createdAt: string;
}

export function AccountingModule() {
  const { t } = useLanguageStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'accounts' | 'entries' | 'balance' | 'pnl'>('entries');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // New Account Form
  const [accForm, setAccForm] = useState({
    code: '',
    name: '',
    type: 'Activo' as const,
    parentCode: '',
    customFields: {},
  });

  // New Entry Form
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    concept: '',
    documentReference: '',
    lines: [
      { accountId: 0, clientId: 0, description: '', debit: 0, credit: 0 },
      { accountId: 0, clientId: 0, description: '', debit: 0, credit: 0 },
    ],
    customFields: {},
  });

  // Queries
  const { data: accounts = [], isLoading: loadingAcc } = useQuery<Account[]>({
    queryKey: ['accounting', 'accounts'],
    queryFn: () => api.get('/accounting/accounts').then(r => r.data),
  });

  const { data: entries = [], isLoading: loadingEntries } = useQuery<JournalEntry[]>({
    queryKey: ['accounting', 'entries'],
    queryFn: () => api.get('/accounting/entries').then(r => r.data),
  });

  const { data: trialBalance = [] } = useQuery({
    queryKey: ['accounting', 'trial-balance'],
    queryFn: () => api.get('/accounting/trial-balance').then(r => r.data),
  });

  const { data: pnl } = useQuery({
    queryKey: ['accounting', 'profit-loss'],
    queryFn: () => api.get('/accounting/profit-loss').then(r => r.data),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  // Mutations
  const seedMut = useMutation({
    mutationFn: () => api.post('/accounting/seed'),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      toast.success(res.data.message || 'Plan de Cuentas uruguayo inicializado');
    },
  });

  const createAccMut = useMutation({
    mutationFn: (data: any) => api.post('/accounting/accounts', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      setAccountModalOpen(false);
      setAccForm({ code: '', name: '', type: 'Activo', parentCode: '', customFields: {} });
      toast.success('Cuenta contable creada');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al crear cuenta'),
  });

  const createEntryMut = useMutation({
    mutationFn: (data: any) => api.post('/accounting/entries', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      setEntryModalOpen(false);
      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        concept: '',
        documentReference: '',
        lines: [
          { accountId: 0, clientId: 0, description: '', debit: 0, credit: 0 },
          { accountId: 0, clientId: 0, description: '', debit: 0, credit: 0 },
        ],
        customFields: {},
      });
      toast.success('Asiento contable registrado con éxito');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al registrar asiento'),
  });

  const deleteEntryMut = useMutation({
    mutationFn: (id: number) => api.delete(`/accounting/entries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      toast.success('Asiento contable eliminado');
    },
  });

  // Helper calculation for entry balance
  const totalDebit = entryForm.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = entryForm.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const addLine = () => {
    setEntryForm(f => ({
      ...f,
      lines: [...f.lines, { accountId: 0, clientId: 0, description: '', debit: 0, credit: 0 }],
    }));
  };

  const updateLine = (idx: number, key: string, val: any) => {
    const updated = [...entryForm.lines];
    updated[idx] = { ...updated[idx], [key]: val };
    setEntryForm(f => ({ ...f, lines: updated }));
  };

  const removeLine = (idx: number) => {
    setEntryForm(f => ({
      ...f,
      lines: f.lines.filter((_, i) => i !== idx),
    }));
  };

  // Helper presets for Uruguayan DGI Tax Helper
  const applyVentaIva22Preset = () => {
    const cajaAcc = accounts.find(a => a.code === '1.1.01') || accounts[0];
    const ventasAcc = accounts.find(a => a.code === '4.1.01') || accounts[0];
    const ivaAcc = accounts.find(a => a.code === '2.1.02') || accounts[0];

    if (!cajaAcc || !ventasAcc || !ivaAcc) return;

    setEntryForm(f => ({
      ...f,
      concept: f.concept || 'Venta Local de Servicios e-Factura (IVA 22%)',
      lines: [
        { accountId: cajaAcc.id, clientId: 0, description: 'Cobro total venta', debit: 1220, credit: 0 },
        { accountId: ventasAcc.id, clientId: 0, description: 'Venta subtotal neto', debit: 0, credit: 1000 },
        { accountId: ivaAcc.id, clientId: 0, description: 'IVA Débito Fiscal 22%', debit: 0, credit: 220 },
      ]
    }));
  };

  const applyVentaAgroExentaPreset = () => {
    const deudoresAcc = accounts.find(a => a.code === '1.1.04') || accounts[0];
    const ventasAgroAcc = accounts.find(a => a.code === '4.1.02') || accounts[0];

    if (!deudoresAcc || !ventasAgroAcc) return;

    setEntryForm(f => ({
      ...f,
      concept: f.concept || 'Venta de Cereal / Granos Zafra (Agro Exento DGI 0%)',
      lines: [
        { accountId: deudoresAcc.id, clientId: 0, description: 'Cuenta a cobrar cliente agro', debit: 5000, credit: 0 },
        { accountId: ventasAgroAcc.id, clientId: 0, description: 'Venta granos exenta DGI', debit: 0, credit: 5000 },
      ]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        icon={Calculator}
        title={t('accounting.title', 'Contabilidad Uruguay (DGI)')}
        description={t('accounting.desc', 'Plan de cuentas uruguayo, asientos contables con partida doble, facturación electrónica e-Factura/DGI, IVA (22%, 10%, Exento), Libro Mayor y Balance de Comprobación.')}
        action={
          <div className="flex items-center gap-2">
            {accounts.length === 0 && (
              <Button
                variant="ghost"
                className="bg-amber-50 text-amber-900 border border-amber-300 font-bold"
                icon={<Sparkles className="w-4 h-4 text-amber-600" />}
                onClick={() => seedMut.mutate()}
                loading={seedMut.isPending}
              >
                Cargar Plan Cuentas DGI
              </Button>
            )}
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setEntryModalOpen(true)}
            >
              Nuevo Asiento
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'entries', label: 'Libro Diario (Asientos)', icon: BookOpen },
            { id: 'accounts', label: 'Plan de Cuentas DGI', icon: Layers },
            { id: 'balance', label: 'Balance de Comprobación', icon: Scale },
            { id: 'pnl', label: 'Estado de Resultados (P&L)', icon: PieChart },
          ].map(tItem => {
            const Icon = tItem.icon;
            const active = tab === tItem.id;
            return (
              <button
                key={tItem.id}
                onClick={() => setTab(tItem.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#2D2D2D] text-[#FFBE00] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tItem.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-gray-400 font-mono px-3">
          Cuentas registradas: <strong className="text-gray-700">{accounts.length}</strong>
        </div>
      </div>

      {/* Tab 1: Libro Diario (Asientos) */}
      {tab === 'entries' && (
        <div className="space-y-4">
          {loadingEntries ? (
            <div className="py-12 text-center text-gray-400 text-sm">Cargando libro diario...</div>
          ) : entries.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-800">No hay asientos contables registrados</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Registra tu primer asiento contable en partida doble o utiliza los asistentes automáticos de e-Factura / DGI.
              </p>
              <Button className="mt-4" icon={<Plus className="w-4 h-4" />} onClick={() => setEntryModalOpen(true)}>
                Registrar Primer Asiento
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gray-50/80 border-b border-gray-100 p-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold bg-[#2D2D2D] text-[#FFBE00] px-2.5 py-1 rounded-lg">
                        {entry.entryNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{entry.concept}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Fecha: {entry.date} {entry.documentReference && `| Ref DGI: ${entry.documentReference}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success" className="font-bold text-xs">
                        Total: ${Number(entry.totalAmount).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => {
                          if (confirm(`¿Eliminar el asiento ${entry.entryNumber}?`)) {
                            deleteEntryMut.mutate(entry.id);
                          }
                        }}
                      />
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                          <tr>
                            <th className="px-4 py-2.5">Código / Cuenta</th>
                            <th className="px-4 py-2.5">Tercero / RUT</th>
                            <th className="px-4 py-2.5">Glosa / Detalle</th>
                            <th className="px-4 py-2.5 text-right">Debe ($)</th>
                            <th className="px-4 py-2.5 text-right">Haber ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {entry.lines.map((l, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2 font-mono font-bold text-gray-800">
                                {l.account?.code} - {l.account?.name}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                {l.client ? `${l.client.businessName} (RUT: ${l.client.taxId || 'N/D'})` : '-'}
                              </td>
                              <td className="px-4 py-2 text-gray-500">{l.description || '-'}</td>
                              <td className="px-4 py-2 text-right font-bold text-emerald-700">
                                {Number(l.debit) > 0 ? `$${Number(l.debit).toLocaleString('es-UY', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-indigo-700">
                                {Number(l.credit) > 0 ? `$${Number(l.credit).toLocaleString('es-UY', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Plan de Cuentas */}
      {tab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 text-sm">Catálogo de Cuentas Contables (Norma Uruguaya)</h3>
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAccountModalOpen(true)}>
              Nueva Cuenta
            </Button>
          </div>

          <Card>
            <CardBody className="p-0">
              {loadingAcc ? (
                <div className="py-12 text-center text-gray-400 text-sm">Cargando cuentas...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                      <tr>
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Nombre de la Cuenta</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Cuenta Padre</th>
                        <th className="px-4 py-3 text-right">Saldo Actual ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {accounts.map(acc => {
                        const isMainHeader = acc.code.length <= 3;
                        return (
                          <tr key={acc.id} className={isMainHeader ? 'bg-gray-50 font-bold text-gray-900' : 'hover:bg-gray-50/50'}>
                            <td className="px-4 py-2.5 font-mono text-gray-800">{acc.code}</td>
                            <td className="px-4 py-2.5">{acc.name}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acc.type === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                acc.type === 'Pasivo' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                acc.type === 'Ingreso' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                acc.type === 'Egreso' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-purple-50 text-purple-700'
                              }`}>
                                {acc.type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 font-mono">{acc.parentCode || '-'}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                              ${Number(acc.balance).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 3: Balance de Comprobación */}
      {tab === 'balance' && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" /> Balance de Comprobación de Sumas y Saldos
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cuenta Contable</th>
                    <th className="px-4 py-3 text-right">Suma Debe ($)</th>
                    <th className="px-4 py-3 text-right">Suma Haber ($)</th>
                    <th className="px-4 py-3 text-right">Saldo Deudor/Acreedor ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {trialBalance.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-mono font-bold text-gray-800">{item.code}</td>
                      <td className="px-4 py-2.5 text-gray-900">{item.name}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">
                        ${Number(item.totalDebit).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right text-indigo-700 font-semibold">
                        ${Number(item.totalCredit).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                        ${Number(item.balance).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab 4: Estado de Resultados (P&L) */}
      {tab === 'pnl' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardBody className="p-4">
                <p className="text-xs text-gray-500 font-bold uppercase">Total Ingresos Operativos</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  ${Number(pnl?.totalIncome || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardBody className="p-4">
                <p className="text-xs text-gray-500 font-bold uppercase">Total Egresos y Gastos</p>
                <p className="text-2xl font-black text-rose-700 mt-1">
                  ${Number(pnl?.totalExpenses || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </CardBody>
            </Card>

            <Card className={`border-l-4 ${Number(pnl?.netResult || 0) >= 0 ? 'border-l-emerald-600' : 'border-l-rose-600'}`}>
              <CardBody className="p-4">
                <p className="text-xs text-gray-500 font-bold uppercase">Resultado del Ejercicio</p>
                <p className={`text-2xl font-black mt-1 ${Number(pnl?.netResult || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                  ${Number(pnl?.netResult || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: New Journal Entry */}
      <Modal open={entryModalOpen} onClose={() => setEntryModalOpen(false)} title="Registrar Asiento Contable (Partida Doble)" size="xl">
        <form onSubmit={(e) => { e.preventDefault(); if (isBalanced) createEntryMut.mutate(entryForm); }} className="space-y-4">
          
          {/* Quick DGI Presets */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" /> Asistentes de e-Factura / DGI Uruguay:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyVentaIva22Preset}
                className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-bold shadow-sm"
              >
                + Venta Local IVA 22%
              </button>
              <button
                type="button"
                onClick={applyVentaAgroExentaPreset}
                className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-bold shadow-sm"
              >
                + Venta Granos Agro (Exenta 0%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={entryForm.date}
                onChange={e => setEntryForm({ ...entryForm, date: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#FFBE00]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Concepto / Glosa *</label>
              <Input
                placeholder="Ej: Cobro e-Factura A-00123"
                value={entryForm.concept}
                onChange={e => setEntryForm({ ...entryForm, concept: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Referencia DGI / Comprobante</label>
              <Input
                placeholder="e-Factura Serie A N° 123"
                value={entryForm.documentReference}
                onChange={e => setEntryForm({ ...entryForm, documentReference: e.target.value })}
              />
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-gray-700">Detalle de Líneas de Debe y Haber</label>
              <Button type="button" variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addLine}>
                Añadir Línea
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {entryForm.lines.map((line, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <div className="flex-1">
                    <select
                      value={line.accountId}
                      onChange={e => updateLine(idx, 'accountId', +e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FFBE00]"
                    >
                      <option value={0}>Seleccionar cuenta...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-44">
                    <select
                      value={line.clientId || 0}
                      onChange={e => updateLine(idx, 'clientId', +e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#FFBE00]"
                    >
                      <option value={0}>Tercero / RUT (Opcional)...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.businessName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Debe $"
                      value={line.debit || ''}
                      onChange={e => updateLine(idx, 'debit', +e.target.value)}
                      className="h-9 text-xs font-bold text-emerald-700"
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Haber $"
                      value={line.credit || ''}
                      onChange={e => updateLine(idx, 'credit', +e.target.value)}
                      className="h-9 text-xs font-bold text-indigo-700"
                    />
                  </div>

                  {entryForm.lines.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-rose-500 p-1.5"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => removeLine(idx)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Balance Indicator */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
            isBalanced ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {isBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{isBalanced ? 'Partida Doble Balanceada ($Debe = $Haber)' : 'Desbalance en Partida Doble ($Debe != $Haber)'}</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Debe: ${totalDebit.toFixed(2)}</span>
              <span>Haber: ${totalCredit.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setEntryModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isBalanced} loading={createEntryMut.isPending}>
              Guardar Asiento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Account */}
      <Modal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} title="Nueva Cuenta Contable">
        <form onSubmit={(e) => { e.preventDefault(); createAccMut.mutate(accForm); }} className="space-y-4">
          <Input
            label="Código de Cuenta *"
            placeholder="Ej. 1.1.07"
            value={accForm.code}
            onChange={e => setAccForm({ ...accForm, code: e.target.value })}
          />
          <Input
            label="Nombre de la Cuenta *"
            placeholder="Ej. Banco Itaú M/N"
            value={accForm.name}
            onChange={e => setAccForm({ ...accForm, name: e.target.value })}
          />
          <Select
            label="Tipo de Cuenta *"
            value={accForm.type}
            onChange={e => setAccForm({ ...accForm, type: e.target.value as any })}
            options={[
              { value: 'Activo', label: 'Activo' },
              { value: 'Pasivo', label: 'Pasivo' },
              { value: 'Patrimonio', label: 'Patrimonio' },
              { value: 'Ingreso', label: 'Ingreso' },
              { value: 'Egreso', label: 'Egreso' },
            ]}
          />
          <Input
            label="Código de Cuenta Padre (Opcional)"
            placeholder="Ej. 1.1"
            value={accForm.parentCode}
            onChange={e => setAccForm({ ...accForm, parentCode: e.target.value })}
          />

          <DynamicFieldsForm
            entityType="account"
            values={accForm.customFields}
            onChange={(key, val) => setAccForm(f => ({ ...f, customFields: { ...f.customFields, [key]: val } }))}
          />

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setAccountModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createAccMut.isPending}>
              Crear Cuenta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
