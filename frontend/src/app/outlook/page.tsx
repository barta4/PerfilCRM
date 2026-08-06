'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { CheckCircle2, User, Building2, Calendar, FileText, Send, Mail } from 'lucide-react';

declare global {
  interface Window {
    Office?: any;
  }
}

export default function OutlookPluginPage() {
  const { token, login, logout, isAuthenticated } = useAuthStore();

  // Office state
  const [officeReady, setOfficeReady] = useState(false);
  const [emailData, setEmailData] = useState<{ sender: string; subject: string; body: string } | null>(null);

  // CRM state
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loggingIn, setLoggingIn] = useState(false);

  // Action state
  const [action, setAction] = useState<'none' | 'task' | 'visit'>('none');
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // We rely on the Script tag loading Office.js.
    // Office.onReady is called when the library is loaded.
  }, []);

  const initOffice = () => {
    if (typeof window !== 'undefined' && window.Office) {
      window.Office.onReady((info: any) => {
        if (info.host === window.Office.HostType.Outlook) {
          setOfficeReady(true);
          readEmailData();
        }
      });
    }
  };

  const readEmailData = () => {
    try {
      const item = window.Office.context.mailbox.item;
      if (!item) return;

      const sender = item.sender ? item.sender.emailAddress : '';
      const subject = item.subject || '';

      // Async get body
      item.body.getAsync('text', (result: any) => {
        const body = result.status === window.Office.AsyncResultStatus.Succeeded ? result.value : '';
        setEmailData({ sender, subject, body });
        if (isAuthenticated()) {
          searchContact(sender);
        } else {
          setLoading(false);
        }
      });
    } catch (e) {
      console.error('Error reading email', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && emailData && !contact && loading) {
      searchContact(emailData.sender);
    }
  }, [isAuthenticated, emailData]);

  const searchContact = async (email: string) => {
    try {
      const res = await api.get(`/contacts/search-by-email?email=${encodeURIComponent(email)}`);
      if (res.data) {
        setContact(res.data);
      }
    } catch (error) {
      console.error('Contact not found or error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Sesión iniciada');
      if (emailData) searchContact(emailData.sender);
    } catch (error) {
      toast.error('Credenciales inválidas');
      setLoggingIn(false);
    }
  };

  const handleCreateTask = async () => {
    if (!contact?.client) return;
    setActionLoading(true);
    try {
      await api.post('/tasks', {
        title: `Revisar correo: ${emailData?.subject}`,
        description: notes || emailData?.body?.substring(0, 500),
        status: 'Pendiente',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        client: { id: contact.client.id }
      });
      toast.success('Tarea creada');
      setAction('none');
      setNotes('');
    } catch (e) {
      toast.error('Error al crear tarea');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogVisit = async () => {
    if (!contact?.client) return;
    setActionLoading(true);
    try {
      await api.post('/visits', {
        clientId: contact.client.id,
        isDropIn: false,
        checkInTime: new Date().toISOString(),
        checkInLat: 0,
        checkInLng: 0,
        notes: `Interacción por correo: ${emailData?.subject}. ${notes}`
      });
      toast.success('Visita/Interacción registrada');
      setAction('none');
      setNotes('');
    } catch (e) {
      toast.error('Error al registrar visita');
    } finally {
      setActionLoading(false);
    }
  };

  if (!officeReady) {
    return (
      <div className="p-6 text-center">
        <Script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" onLoad={initOffice} />
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-pureza-blue/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-pureza-blue" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Conectando con Outlook...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="p-5 flex flex-col h-screen bg-gray-50">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-pureza-blue">PERFIL CRM</h2>
          <p className="text-xs text-gray-500">Inicia sesión para vincular Outlook</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 flex-1">
          <Input label="Email" type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
          <Input label="Contraseña" type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
          <Button type="submit" className="w-full" loading={loggingIn}>Conectar Cuenta</Button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-sm text-gray-500">Buscando remitente en el CRM...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-pureza-blue text-white flex items-center justify-between">
        <h1 className="font-bold text-sm tracking-wide">PUREZA Plugin</h1>
        <button onClick={() => logout()} className="text-xs opacity-70 hover:opacity-100">Salir</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Email Context */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">De:</p>
          <p className="text-sm font-medium text-gray-900 truncate" title={emailData?.sender}>{emailData?.sender}</p>
        </div>

        {/* CRM Context */}
        {contact ? (
          <div className="border border-emerald-100 bg-emerald-50/50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" /> Cliente Encontrado
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700"><User className="w-4 h-4 text-gray-400" /> {contact.name}</div>
              <div className="flex items-center gap-2 text-gray-700"><Building2 className="w-4 h-4 text-gray-400" /> {contact.client?.businessName}</div>
            </div>
          </div>
        ) : (
          <div className="border border-amber-100 bg-amber-50 p-4 rounded-xl text-center">
            <p className="text-sm text-amber-800 font-medium">Este remitente no está en el CRM.</p>
            <p className="text-xs text-amber-600 mt-1">Crea el contacto en PERFIL CRM primero para poder registrar acciones desde aquí.</p>
          </div>
        )}

        {/* Actions */}
        {contact && action === 'none' && (
          <div className="space-y-3 pt-2">
            <Button className="w-full justify-start" icon={<FileText className="w-4 h-4" />} onClick={() => setAction('task')}>
              Crear Tarea con este correo
            </Button>
            <Button variant="ghost" className="w-full justify-start" icon={<Calendar className="w-4 h-4" />} onClick={() => setAction('visit')}>
              Registrar Interacción
            </Button>
          </div>
        )}

        {/* Action Form */}
        {action !== 'none' && (
          <div className="space-y-3 pt-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{action === 'task' ? 'Nueva Tarea' : 'Registrar Interacción'}</h3>
              <button onClick={() => setAction('none')} className="text-xs text-gray-500 hover:text-gray-900">Volver</button>
            </div>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={action === 'task' ? "Notas de la tarea... (El cuerpo del correo se guardará por defecto)" : "Resumen de la interacción..."}
              className="w-full h-24 p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pureza-blue outline-none resize-none"
            />

            <Button
              className="w-full"
              icon={<Send className="w-4 h-4" />}
              loading={actionLoading}
              onClick={action === 'task' ? handleCreateTask : handleLogVisit}
            >
              Guardar en CRM
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
