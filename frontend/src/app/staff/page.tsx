'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { UserCheck, Plus, Trash2, Calendar, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function StaffPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'cleaners' | 'schedules'>('cleaners');

  // Form states
  const [cleanerForm, setCleanerForm] = useState({ name: '', phone: '', status: 'Active' });
  const [scheduleForm, setScheduleForm] = useState({ clientId: '', cleanerId: '', dayOfWeek: 1, startTime: '08:00', endTime: '12:00' });

  // Fetch Cleaners
  const { data: cleaners = [], isLoading: loadingCleaners } = useQuery({
    queryKey: ['cleaners'],
    queryFn: () => api.get('/staff/cleaners').then(r => r.data),
  });

  // Fetch Schedules
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['schedules-all'],
    queryFn: () => api.get('/staff/schedules').then(r => r.data),
  });

  // Fetch Clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-staff-dropdown'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  // Create Cleaner Mutation
  const createCleanerMut = useMutation({
    mutationFn: (data: any) => api.post('/staff/cleaners', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cleaners'] });
      toast.success('Personal registrado con éxito.');
      setCleanerForm({ name: '', phone: '', status: 'Active' });
    },
  });

  // Delete Cleaner Mutation
  const deleteCleanerMut = useMutation({
    mutationFn: (id: number) => api.delete(`/staff/cleaners/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cleaners'] });
      toast.success('Personal eliminado.');
    },
  });

  // Create Schedule Mutation
  const createScheduleMut = useMutation({
    mutationFn: (data: any) => api.post('/staff/schedules', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules-all'] });
      toast.success('Horario recurrente asignado.');
      setScheduleForm({ clientId: '', cleanerId: '', dayOfWeek: 1, startTime: '08:00', endTime: '12:00' });
    },
  });

  // Delete Schedule Mutation
  const deleteScheduleMut = useMutation({
    mutationFn: (id: number) => api.delete(`/staff/schedules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules-all'] });
      toast.success('Horario eliminado.');
    },
  });

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck className="w-8 h-8 text-[#00a8e8]" />
        <h1 className="text-2xl font-bold text-gray-900">Personal y Planificación de Horarios</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Forms */}
        <div className="space-y-6">
          {/* Add Staff */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Agregar Personal Operativo</h2>
              <p className="text-xs text-gray-500">Registrar un nuevo limpiador o supervisor.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Nombre Completo *"
                value={cleanerForm.name}
                onChange={e => setCleanerForm({ ...cleanerForm, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
              <Input
                label="Teléfono / Celular"
                value={cleanerForm.phone}
                onChange={e => setCleanerForm({ ...cleanerForm, phone: e.target.value })}
                placeholder="Ej: 099123456"
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Estado laboral</label>
                <select
                  value={cleanerForm.status}
                  onChange={e => setCleanerForm({ ...cleanerForm, status: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a8e8] outline-none"
                >
                  <option value="Active">Activo</option>
                  <option value="OnLeave">Licencia médica/vacaciones</option>
                  <option value="Inactive">Inactivo</option>
                </select>
              </div>
              <Button
                onClick={() => {
                  if (!cleanerForm.name) return toast.error('Ingresa el nombre');
                  createCleanerMut.mutate(cleanerForm);
                }}
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
              >
                Agregar Personal
              </Button>
            </CardBody>
          </Card>

          {/* Assign Schedule */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Asignar Horario Recurrente</h2>
              <p className="text-xs text-gray-500">Vincular personal a un edificio con frecuencia semanal.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Limpiador/Supervisor</label>
                <select
                  value={scheduleForm.cleanerId}
                  onChange={e => setScheduleForm({ ...scheduleForm, cleanerId: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a8e8] outline-none"
                >
                  <option value="">Selecciona personal...</option>
                  {cleaners.filter((cl: any) => cl.status === 'Active').map((cl: any) => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Cliente / Edificio</label>
                <select
                  value={scheduleForm.clientId}
                  onChange={e => setScheduleForm({ ...scheduleForm, clientId: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a8e8] outline-none"
                >
                  <option value="">Selecciona edificio...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.businessName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Día de la Semana</label>
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={e => setScheduleForm({ ...scheduleForm, dayOfWeek: +e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a8e8] outline-none"
                >
                  {DAYS.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Entrada"
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                />
                <Input
                  label="Salida"
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                />
              </div>

              <Button
                onClick={() => {
                  if (!scheduleForm.clientId || !scheduleForm.cleanerId) {
                    return toast.error('Completa los campos de cliente y personal');
                  }
                  createScheduleMut.mutate({
                    client: { id: +scheduleForm.clientId },
                    cleaner: { id: +scheduleForm.cleanerId },
                    dayOfWeek: +scheduleForm.dayOfWeek,
                    startTime: scheduleForm.startTime,
                    endTime: scheduleForm.endTime,
                  });
                }}
                className="w-full bg-[#0d2c54]"
                icon={<Calendar className="w-4 h-4" />}
              >
                Asignar Horario
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Right Side Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-xs">
            <button
              onClick={() => setActiveTab('cleaners')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                activeTab === 'cleaners' ? 'bg-white text-[#0d2c54] shadow-sm' : 'text-gray-500'
              }`}
            >
              Lista de Personal
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                activeTab === 'schedules' ? 'bg-white text-[#0d2c54] shadow-sm' : 'text-gray-500'
              }`}
            >
              Planificador Semanal
            </button>
          </div>

          <Card>
            <CardBody className="p-0">
              {activeTab === 'cleaners' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                        <th className="p-4">Nombre</th>
                        <th className="p-4">Teléfono</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingCleaners && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-400">Cargando...</td>
                        </tr>
                      )}
                      {!loadingCleaners && cleaners.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-400">No hay personal operativo registrado.</td>
                        </tr>
                      )}
                      {cleaners.map((cl: any) => (
                        <tr key={cl.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-900">{cl.name}</td>
                          <td className="p-4 flex items-center gap-1.5 text-gray-600">
                            {cl.phone && <Phone className="w-3.5 h-3.5 opacity-60" />}
                            {cl.phone || 'N/A'}
                          </td>
                          <td className="p-4">
                            <Badge variant={cl.status === 'Active' ? 'success' : cl.status === 'OnLeave' ? 'warning' : 'neutral'}>
                              {cl.status === 'Active' ? 'Activo' : cl.status === 'OnLeave' ? 'Licencia' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-500" />}
                              onClick={() => deleteCleanerMut.mutate(cl.id)}
                            />
                          </td>
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
                        <th className="p-4">Día</th>
                        <th className="p-4">Limpiador</th>
                        <th className="p-4">Edificio / Cliente</th>
                        <th className="p-4">Horario</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingSchedules && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">Cargando...</td>
                        </tr>
                      )}
                      {!loadingSchedules && schedules.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">No hay horarios planificados aún.</td>
                        </tr>
                      )}
                      {schedules.map((sc: any) => (
                        <tr key={sc.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-[#0d2c54]">{DAYS[sc.dayOfWeek]}</td>
                          <td className="p-4 text-gray-900">{sc.cleaner?.name}</td>
                          <td className="p-4 font-semibold text-gray-600">{sc.client?.businessName}</td>
                          <td className="p-4 font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded-lg text-xs inline-block my-2">
                            {sc.startTime} - {sc.endTime}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-500" />}
                              onClick={() => deleteScheduleMut.mutate(sc.id)}
                            />
                          </td>
                        </tr>
                      ))}
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
