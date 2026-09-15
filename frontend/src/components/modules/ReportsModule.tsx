'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, BarChart3, PieChart as PieIcon, Users, CheckSquare, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';

const STATUS_COLORS_TASK = ['#94a3b8', '#FFBE00', '#10b981', '#f43f5e'];
const STATUS_COLORS_CLIENT = ['#10b981', '#FFBE00', '#f43f5e', '#94a3b8'];

export function ReportsModule() {
  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => api.get('/reports/summary').then(r => r.data),
  });
  const { data: tasksDist = [] } = useQuery({
    queryKey: ['reports-tasks'],
    queryFn: () => api.get('/reports/tasks-by-status').then(r => r.data),
  });
  const { data: clientsDist = [] } = useQuery({
    queryKey: ['reports-clients'],
    queryFn: () => api.get('/reports/clients-by-status').then(r => r.data),
  });

  const downloadExcel = async (endpoint: string, filename: string) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Archivo descargado');
    } catch {
      toast.error('Error al descargar archivo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total clientes', value: summary.totalClients, sub: `${summary.activeClients} activos`, icon: <Users className="w-5 h-5" />, color: 'bg-[#FFBE00]/10 text-amber-600' },
            { label: 'Total tareas', value: summary.totalTasks, sub: `${summary.pendingTasks} pendientes`, icon: <CheckSquare className="w-5 h-5" />, color: 'bg-rose-50 text-rose-500' },
            { label: 'Total visitas', value: summary.totalVisits, sub: 'registradas', icon: <MapPin className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${item.color}`}>{item.icon}</div>
              <p className="text-3xl font-black text-gray-900">{item.value ?? '—'}</p>
              <p className="text-sm font-medium text-gray-600 mt-0.5">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tasks by status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" /> Tareas por estado
              </h3>
              <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => downloadExcel('/reports/export/tasks.xlsx', 'tareas_perfilgranos.xlsx')}>
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tasksDist.map((d: any) => ({ ...d, name: d.status === 'To Do' ? 'Por hacer' : d.status === 'In Progress' ? 'En progreso' : d.status }))} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {tasksDist.map((_: any, i: number) => <Cell key={i} fill={STATUS_COLORS_TASK[i % 4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Clients by status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-500" /> Cartera por estado
              </h3>
              <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => downloadExcel('/reports/export/clients.xlsx', 'clientes_perfilgranos.xlsx')}>
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={clientsDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {clientsDist.map((_: any, i: number) => <Cell key={i} fill={STATUS_COLORS_CLIENT[i % 4]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Export section */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportación de datos
          </h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Cartera de clientes', sub: 'Todos los datos de clientes CRM', endpoint: '/reports/export/clients.xlsx', file: 'clientes_pureza.xlsx', color: 'text-pureza-blue' },
            { label: 'Historial de visitas', sub: 'Check-ins, GPS y notas', endpoint: '/reports/export/visits.xlsx', file: 'visitas_pureza.xlsx', color: 'text-emerald-600' },
            { label: 'Todas las tareas', sub: 'Kanban completo con prioridades', endpoint: '/reports/export/tasks.xlsx', file: 'tareas_pureza.xlsx', color: 'text-pureza-pink' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Download className={`w-5 h-5 mt-0.5 shrink-0 ${item.color}`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400 mb-3">{item.sub}</p>
                <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => downloadExcel(item.endpoint, item.file)}>
                  Descargar .xlsx
                </Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
