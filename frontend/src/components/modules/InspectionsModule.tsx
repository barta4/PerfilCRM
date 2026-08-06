'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Client } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, Plus, Trash2, CheckCircle2, XCircle, Star, Search, Filter, Award } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export interface Inspection {
  id: number;
  desksCleaned: number;
  floorsSwept: number;
  binsEmptied: boolean;
  bathroomsSanitized: boolean;
  glassCleaned: boolean;
  generalScore: number;
  notes: string;
  client: Client;
  createdAt: string;
}

function InspectionForm({ clients, onSave, onCancel, loading }: {
  clients: Client[];
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [clientId, setClientId] = useState('');
  const [desksCleaned, setDesksCleaned] = useState(5);
  const [floorsSwept, setFloorsSwept] = useState(5);
  const [binsEmptied, setBinsEmptied] = useState(true);
  const [bathroomsSanitized, setBathroomsSanitized] = useState(true);
  const [glassCleaned, setGlassCleaned] = useState(true);
  const [generalScore, setGeneralScore] = useState(90);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error('Selecciona un cliente');
      return;
    }
    onSave({
      clientId: +clientId,
      desksCleaned,
      floorsSwept,
      binsEmptied,
      bathroomsSanitized,
      glassCleaned,
      generalScore: +generalScore,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Cliente / Establecimiento *"
        value={clientId}
        onChange={e => setClientId(e.target.value)}
        options={[
          { value: '', label: 'Seleccionar cliente...' },
          ...clients.map(c => ({ value: c.id.toString(), label: c.businessName }))
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Limpieza General / Escritorios (1-5)</label>
          <select
            value={desksCleaned}
            onChange={e => setDesksCleaned(+e.target.value)}
            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#FFBE00]"
          >
            {[5, 4, 3, 2, 1].map(n => (
              <option key={n} value={n}>{n} - {n === 5 ? 'Excelente' : n === 4 ? 'Bueno' : n === 3 ? 'Regular' : n === 2 ? 'Deficiente' : 'Malo'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Orden y Barrido (1-5)</label>
          <select
            value={floorsSwept}
            onChange={e => setFloorsSwept(+e.target.value)}
            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#FFBE00]"
          >
            {[5, 4, 3, 2, 1].map(n => (
              <option key={n} value={n}>{n} - {n === 5 ? 'Excelente' : n === 4 ? 'Bueno' : n === 3 ? 'Regular' : n === 2 ? 'Deficiente' : 'Malo'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
        <label className="block text-xs font-bold text-gray-700 mb-2">Lista de Chequeo</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={binsEmptied}
              onChange={e => setBinsEmptied(e.target.checked)}
              className="w-4 h-4 accent-[#FFBE00] rounded"
            />
            <span>Papeleras Vacías</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={bathroomsSanitized}
              onChange={e => setBathroomsSanitized(e.target.checked)}
              className="w-4 h-4 accent-[#FFBE00] rounded"
            />
            <span>Sanitarios Sanitizados</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={glassCleaned}
              onChange={e => setGlassCleaned(e.target.checked)}
              className="w-4 h-4 accent-[#FFBE00] rounded"
            />
            <span>Vidrios Limpios</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Score / Calificación General (0 a 100)</label>
        <Input
          type="number"
          min="0"
          max="100"
          value={generalScore}
          onChange={e => setGeneralScore(+e.target.value)}
          placeholder="Ej: 95"
        />
      </div>

      <Textarea
        label="Observaciones y Comentarios de Campo"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Detalles sobre el estado del local, recomendaciones o hallazgos..."
      />

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <Button variant="ghost" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" loading={loading}>Guardar Inspección</Button>
      </div>
    </form>
  );
}

export function InspectionsModule() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');

  const { data: inspections = [], isLoading } = useQuery<Inspection[]>({
    queryKey: ['inspections'],
    queryFn: () => api.get('/inspections').then(r => r.data),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/inspections', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections'] });
      setModalOpen(false);
      toast.success('Inspección registrada con éxito');
    },
    onError: () => toast.error('Error al registrar la inspección'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/inspections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspección eliminada');
    },
    onError: () => toast.error('Error al eliminar inspección'),
  });

  const filteredInspections = inspections.filter(ins => {
    const clientName = (ins.client?.businessName || (ins.client as any)?.name || '').toLowerCase();
    const notesText = (ins.notes || '').toLowerCase();
    const matchesSearch = clientName.includes(search.toLowerCase()) || notesText.includes(search.toLowerCase());
    const matchesClient = !selectedClientFilter || ins.client?.id?.toString() === selectedClientFilter;
    return matchesSearch && matchesClient;
  });

  const avgScore = inspections.length
    ? Math.round(inspections.reduce((acc, curr) => acc + (curr.generalScore || 0), 0) / inspections.length)
    : 0;

  const passedCount = inspections.filter(i => (i.generalScore || 0) >= 80).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-pureza-blue" />
            Inspecciones de Campo y Auditorías de Calidad
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Registro, evaluación y control de estándares en las instalaciones de clientes.
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setModalOpen(true)}
        >
          Nueva Inspección
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-pureza-blue">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-pureza-blue rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Inspecciones</p>
              <p className="text-2xl font-black text-gray-900">{inspections.length}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Score Promedio</p>
              <p className="text-2xl font-black text-gray-900">{avgScore} / 100</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Aprobadas (≥80 pts)</p>
              <p className="text-2xl font-black text-gray-900">{passedCount} ({inspections.length ? Math.round((passedCount/inspections.length)*100) : 0}%)</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente u observaciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FFBE00]"
          />
        </div>
        <select
          value={selectedClientFilter}
          onChange={e => setSelectedClientFilter(e.target.value)}
          className="w-full sm:w-64 py-2 px-3 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FFBE00]"
        >
          <option value="">Todos los clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id.toString()}>{c.businessName || (c as any).name}</option>
          ))}
        </select>
      </div>

      {/* Inspection List */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Cargando inspecciones...</div>
      ) : filteredInspections.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">No se encontraron inspecciones</p>
          <p className="text-xs text-gray-400 mt-1">Registra una nueva inspección para auditar la calidad en instalaciones.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInspections.map(ins => {
            const score = ins.generalScore || 0;
            const scoreVariant = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger';

            return (
              <Card key={ins.id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">
                        {ins.client?.businessName || (ins.client as any)?.name || 'Cliente N/A'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ins.createdAt ? format(new Date(ins.createdAt), 'dd MMMM yyyy, HH:mm', { locale: es }) : 'Fecha N/A'}
                      </p>
                    </div>
                    <Badge variant={scoreVariant} className="text-xs font-bold px-2.5 py-1">
                      {score} / 100 pts
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl">
                    <div>
                      <span className="text-gray-500 font-medium">Escritorios/Muebles:</span>
                      <p className="font-bold text-gray-800">{ins.desksCleaned}/5 ★</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Orden/Pisos:</span>
                      <p className="font-bold text-gray-800">{ins.floorsSwept}/5 ★</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${ins.binsEmptied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                      {ins.binsEmptied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />} Papeleras
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${ins.bathroomsSanitized ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                      {ins.bathroomsSanitized ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />} Sanidad
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${ins.glassCleaned ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                      {ins.glassCleaned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />} Vidrios
                    </span>
                  </div>

                  {ins.notes && (
                    <p className="text-xs text-gray-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 italic">
                      "{ins.notes}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => {
                        if (confirm('¿Eliminar esta inspección?')) {
                          deleteMut.mutate(ins.id);
                        }
                      }}
                      loading={deleteMut.isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Inspection Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Auditoría / Inspección de Campo" size="lg">
        <InspectionForm
          clients={clients}
          onSave={createMut.mutate}
          onCancel={() => setModalOpen(false)}
          loading={createMut.isPending}
        />
      </Modal>
    </div>
  );
}
