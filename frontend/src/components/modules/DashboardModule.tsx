'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Client, Task, Event, Visit, Quotation } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Users, ClipboardList, MessageSquare, Calendar, AlertCircle, FileText } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AiInsightsTile } from '@/components/ui/AiInsightsTile';

const STATUS_COLORS: Record<string, string> = {
  Green:  '#98D500',
  Yellow: '#FFBE00',
  Red:    '#f43f5e',
  Grey:   '#748080',
};

export function DashboardModule() {
  const { data: clients = [] }     = useQuery<Client[]>({ queryKey: ['clients'],     queryFn: () => api.get('/clients').then(r => r.data) });
  const { data: tasks = [] }       = useQuery<Task[]>({ queryKey: ['tasks'],         queryFn: () => api.get('/tasks').then(r => r.data) });
  const { data: events = [] }      = useQuery<Event[]>({ queryKey: ['events'],       queryFn: () => api.get('/events').then(r => r.data) });
  const { data: visits = [] }      = useQuery<Visit[]>({ queryKey: ['visits'],       queryFn: () => api.get('/visits').then(r => r.data) });
  const { data: quotations = [] }  = useQuery<Quotation[]>({ queryKey: ['quotations'],  queryFn: () => api.get('/quotations').then(r => r.data) });

  // Computed stats
  const activeClients = clients.filter(c => c.status === 'Green' || c.status === 'Yellow').length;
  const pendingTasks  = tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress').length;

  const upcomingEvents = [...events]
    .filter(e => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const recentQuotations = [...quotations].slice(0, 5);

  // Chart: Client status distribution
  const statusDist = Object.entries(
    clients.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Chart: Tasks by status
  const tasksDist = ['To Do', 'In Progress', 'Done', 'Cancelled'].map(s => ({
    name: s === 'To Do' ? 'Por hacer' : s === 'In Progress' ? 'En progreso' : s === 'Done' ? 'Completado' : 'Cancelado',
    value: tasks.filter(t => t.status === s).length,
  }));

  return (
    <div className="space-y-6">
      {/* AI Row */}
      <AiInsightsTile />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Clientes Activos" value={activeClients} subtitle={`de ${clients.length} total`}
          icon={<Users className="w-5 h-5" />} color="blue" href="/clients" />
        <StatCard title="Tareas Pendientes" value={pendingTasks}
          icon={<ClipboardList className="w-5 h-5" />} color="pink" href="/tasks" />
        <StatCard title="Comunicaciones" value={visits.length}
          icon={<MessageSquare className="w-5 h-5" />} color="emerald" href="/visits" />
        <StatCard title="Cotizaciones / Órdenes" value={quotations.length}
          icon={<FileText className="w-5 h-5" />} color="blue" href="/quotations" />
      </div>

      {/* Sales Orders List (Dashboard Section from Scope) */}
      <Card>
        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
          <Link href="/quotations" className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FFBE00]" />
              <h3 className="font-bold text-gray-900 text-sm">Órdenes de Venta y Cotizaciones Recientes</h3>
            </div>
            <span className="text-xs text-[#2D2D2D] font-bold underline">Ver todas</span>
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-3">N° Orden</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Total USD</th>
                  <th className="p-3">Pago</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentQuotations.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-400">Sin cotizaciones registradas aún.</td></tr>
                ) : (
                  recentQuotations.map((q: any) => (
                    <tr key={q.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">{q.quotationNumber || `#${q.id}`}</td>
                      <td className="p-3 font-semibold text-gray-800">{q.client?.businessName || '—'}</td>
                      <td className="p-3 font-black text-[#2D2D2D]">${Number(q.totalAmount).toLocaleString()} USD</td>
                      <td className="p-3 text-xs text-gray-500">{q.paymentTerms || 'Contado'}</td>
                      <td className="p-3">
                        <Badge variant={q.status === 'Sent' ? 'success' : 'neutral'}>{q.status === 'Sent' ? 'Enviada al Cliente' : q.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Client Status Pie */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <Link href="/clients" className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-gray-900 text-sm">Estado de Cartera de Clientes</h3>
              <span className="text-xs text-[#2D2D2D] font-bold">Ver clientes</span>
            </Link>
          </CardHeader>
          <CardBody className="flex justify-center">
            {statusDist.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {statusDist.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#748080'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Tasks Bar */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <Link href="/tasks" className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-gray-900 text-sm">Estado de Tareas Generadas</h3>
              <span className="text-xs text-[#2D2D2D] font-bold">Ver tareas</span>
            </Link>
          </CardHeader>
          <CardBody>
            {tasks.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={tasksDist} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FFBE00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <Link href="/events" className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FFBE00]" />
                <h3 className="font-semibold text-gray-900 text-sm">Próximos eventos de la agenda</h3>
              </div>
              <span className="text-xs text-[#2D2D2D] font-bold">Ver todos</span>
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin eventos próximos</p>
            ) : upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 bg-[#FFBE00]/20 rounded-lg flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs text-[#2D2D2D] font-bold">{format(new Date(event.startTime), 'MMM', { locale: es }).toUpperCase()}</span>
                  <span className="text-sm font-black text-[#2D2D2D] leading-tight">{format(new Date(event.startTime), 'd')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-400">{format(new Date(event.startTime), 'HH:mm')} · {event.client?.businessName}</p>
                </div>
                <Badge variant="default">{event.type}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Critical tasks */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <Link href="/tasks" className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Tareas prioritarias</h3>
              </div>
              <span className="text-xs text-[#2D2D2D] font-bold">Ver todas</span>
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress').length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin tareas pendientes 🎉</p>
            ) : tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress').slice(0, 4).map(task => (
              <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.client?.businessName || 'General'}</p>
                </div>
                {task.dueDate && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                    {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
                  </span>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
