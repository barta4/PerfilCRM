'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Package, Plus, AlertTriangle, ArrowRightLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'central' | 'distribuido'>('central');

  // Form states
  const [itemForm, setItemForm] = useState({ name: '', unit: 'Unidades', stockQuantity: 100 });
  const [transferForm, setTransferForm] = useState({ clientId: '', itemId: '', quantity: 10, minThreshold: 5 });

  // Fetch Central Catalog Items
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => api.get('/inventory/items').then(r => r.data),
  });

  // Fetch Distributed Stocks in Clients
  const { data: clientStocks = [], isLoading: loadingStocks } = useQuery({
    queryKey: ['client-stocks'],
    queryFn: () => api.get('/inventory/client-stocks').then(r => r.data),
  });

  // Fetch Clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list-dropdown'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  // Create Item Mutation
  const createItemMut = useMutation({
    mutationFn: (data: any) => api.post('/inventory/items', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Insumo registrado en depósito central.');
      setItemForm({ name: '', unit: 'Unidades', stockQuantity: 100 });
    },
  });

  // Transfer Mutation
  const transferMut = useMutation({
    mutationFn: (data: any) => api.post('/inventory/client-stocks/transfer', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-stocks'] });
      qc.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Insumo transferido al cliente.');
      setTransferForm({ clientId: '', itemId: '', quantity: 10, minThreshold: 5 });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al realizar la transferencia.');
    },
  });

  // Delete Distributed Stock
  const deleteStockMut = useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/client-stocks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-stocks'] });
      toast.success('Registro de stock eliminado.');
    },
  });

  // Check which client stocks are below threshold
  const lowStockAlerts = clientStocks.filter(
    (s: any) => Number(s.quantity) <= Number(s.minThreshold)
  );

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8 text-[#00a8e8]" />
        <h1 className="text-2xl font-bold text-gray-900">Insumos y Stock de Limpieza</h1>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Alerta de Stock Crítico en Edificios ({lowStockAlerts.length})</p>
            <div className="mt-2 text-xs space-y-1">
              {lowStockAlerts.map((s: any) => (
                <p key={s.id}>
                  • <strong>{s.client?.businessName}</strong>: {s.item?.name} tiene solo <strong>{s.quantity} {s.item?.unit}</strong> (Mínimo requerido: {s.minThreshold}).
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Forms */}
        <div className="space-y-6">
          {/* Add Item Form */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Agregar Insumo Nuevo</h2>
              <p className="text-xs text-gray-500">Registrar nuevo artículo en depósito central.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Nombre del Producto *"
                value={itemForm.name}
                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Ej: Desinfectante Amonio Cuaternario"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Unidad</label>
                  <select
                    value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a8e8] outline-none"
                  >
                    <option value="Litros">Litros</option>
                    <option value="Bidones">Bidones</option>
                    <option value="Unidades">Unidades</option>
                    <option value="Paquetes">Paquetes</option>
                  </select>
                </div>
                <Input
                  label="Cantidad Inicial"
                  type="number"
                  value={itemForm.stockQuantity}
                  onChange={e => setItemForm({ ...itemForm, stockQuantity: +e.target.value })}
                />
              </div>
              <Button
                onClick={() => {
                  if (!itemForm.name) return toast.error('Ingresa el nombre del insumo');
                  createItemMut.mutate(itemForm);
                }}
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
              >
                Registrar en Depósito
              </Button>
            </CardBody>
          </Card>

          {/* Transfer Form */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Despachar a Edificio</h2>
              <p className="text-xs text-gray-500">Transferir insumos del depósito central a un cliente.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Edificio / Cliente</label>
                <select
                  value={transferForm.clientId}
                  onChange={e => setTransferForm({ ...transferForm, clientId: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a8e8] outline-none"
                >
                  <option value="">Selecciona un cliente...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.businessName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Insumo a Enviar</label>
                <select
                  value={transferForm.itemId}
                  onChange={e => setTransferForm({ ...transferForm, itemId: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a8e8] outline-none"
                >
                  <option value="">Selecciona un insumo...</option>
                  {items.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.stockQuantity} {i.unit} disponibles)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cantidad Enviada"
                  type="number"
                  value={transferForm.quantity}
                  onChange={e => setTransferForm({ ...transferForm, quantity: +e.target.value })}
                />
                <Input
                  label="Stock Mínimo Alerta"
                  type="number"
                  value={transferForm.minThreshold}
                  onChange={e => setTransferForm({ ...transferForm, minThreshold: +e.target.value })}
                />
              </div>

              <Button
                onClick={() => {
                  if (!transferForm.clientId || !transferForm.itemId) {
                    return toast.error('Selecciona cliente e insumo');
                  }
                  transferMut.mutate({
                    clientId: +transferForm.clientId,
                    itemId: +transferForm.itemId,
                    quantity: Number(transferForm.quantity),
                    minThreshold: Number(transferForm.minThreshold),
                  });
                }}
                className="w-full bg-[#0d2c54]"
                icon={<ArrowRightLeft className="w-4 h-4" />}
              >
                Transferir Insumos
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Right Tab Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-xs">
            <button
              onClick={() => setActiveTab('central')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                activeTab === 'central' ? 'bg-white text-[#0d2c54] shadow-sm' : 'text-gray-500'
              }`}
            >
              Depósito Central
            </button>
            <button
              onClick={() => setActiveTab('distribuido')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                activeTab === 'distribuido' ? 'bg-white text-[#0d2c54] shadow-sm' : 'text-gray-500'
              }`}
            >
              En Edificios
            </button>
          </div>

          <Card>
            <CardBody className="p-0">
              {activeTab === 'central' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                        <th className="p-4">Insumo</th>
                        <th className="p-4">Stock en Depósito</th>
                        <th className="p-4">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingItems && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-400">Cargando...</td>
                        </tr>
                      )}
                      {!loadingItems && items.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-400">Depósito vacío.</td>
                        </tr>
                      )}
                      {items.map((i: any) => (
                        <tr key={i.id}>
                          <td className="p-4 font-semibold text-gray-900">{i.name}</td>
                          <td className="p-4 font-mono font-bold text-[#0d2c54]">{Number(i.stockQuantity).toFixed(1)}</td>
                          <td className="p-4 text-gray-500">{i.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                        <th className="p-4">Cliente / Edificio</th>
                        <th className="p-4">Insumo</th>
                        <th className="p-4">Stock en Sitio</th>
                        <th className="p-4">Alerta Mínima</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingStocks && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">Cargando...</td>
                        </tr>
                      )}
                      {!loadingStocks && clientStocks.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">No hay insumos asignados a edificios.</td>
                        </tr>
                      )}
                      {clientStocks.map((s: any) => {
                        const low = Number(s.quantity) <= Number(s.minThreshold);
                        return (
                          <tr key={s.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-semibold text-gray-900">{s.client?.businessName}</td>
                            <td className="p-4">{s.item?.name}</td>
                            <td className="p-4 font-mono font-bold">
                              <span className={low ? 'text-rose-600' : 'text-emerald-600'}>
                                {Number(s.quantity).toFixed(1)} {s.item?.unit}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-gray-500">{s.minThreshold} {s.item?.unit}</td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-500" />}
                                onClick={() => deleteStockMut.mutate(s.id)}
                              />
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

      </div>
    </main>
  );
}
