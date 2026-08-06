'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bot, Send, X, Plus, Sparkles, AlertCircle, CheckCircle2, XCircle, RefreshCw, MessageSquare, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  pendingAction?: {
    toolCallId: string;
    toolName: string;
    args: any;
    summary: string;
  } | null;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  updatedAt: string;
}

export function ChatWidget() {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads
  const { data: conversations = [], refetch: refetchConvs } = useQuery<Conversation[]>({
    queryKey: ['ai_conversations'],
    queryFn: () => api.get('/ai/conversations').then((r) => r.data),
    enabled: isOpen,
  });

  // Fetch messages of active thread
  const { data: messages = [], refetch: refetchMessages, isLoading: loadingMsgs } = useQuery<Message[]>({
    queryKey: ['ai_messages', activeConvId],
    queryFn: () => (activeConvId ? api.get(`/ai/conversations/${activeConvId}/messages`).then((r) => r.data) : Promise.resolve([])),
    enabled: !!activeConvId && isOpen,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post('/ai/chat', {
        conversationId: activeConvId || undefined,
        message: text,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setInputText('');
      if (!activeConvId && data.conversationId) {
        setActiveConvId(data.conversationId);
      }
      refetchConvs();
      refetchMessages();
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al comunicarse con el Agente de IA');
    },
    onSettled: () => setSending(false),
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ messageId, confirmed }: { messageId: number; confirmed: boolean }) => {
      setConfirming(messageId);
      const res = await api.post('/ai/chat/confirm', {
        conversationId: activeConvId,
        messageId,
        confirmed,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.resultMessage?.content || 'Acción ejecutada con éxito');
      } else {
        toast(data.message || 'Acción cancelada', { icon: 'ℹ️' });
      }
      refetchMessages();
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: () => toast.error('Error al confirmar acción'),
    onSettled: () => setConfirming(null),
  });

  const handleSend = () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    sendMutation.mutate(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
  };

  const presetChips = [
    '¿Cuántos terceros en riesgo tenemos?',
    'Creame un proveedor: AgroCoop, RUT 210100500018',
    'Resumen de tareas pendientes',
    '¿Qué cotizaciones están activas?',
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 border border-amber-300"
      >
        <Bot className="w-5 h-5 text-slate-950 animate-pulse" />
        <span>Agente IA</span>
        <Sparkles className="w-4 h-4 text-slate-950" />
      </button>

      {/* Slide-out Chat Modal Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 text-slate-100 shadow-2xl flex flex-col border-l border-slate-700 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                  Agente IA Comercial
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-[11px] text-slate-400">Entiende todo el CRM + Ejecuta Acciones</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startNewChat}
                title="Nuevo Chat"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conversations Drawer Selector */}
          {conversations.length > 0 && (
            <div className="bg-slate-950/60 px-3 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0">Chats:</span>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap border shrink-0 ${
                    activeConvId === c.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Cuestionando al CRM...
              </div>
            ) : !activeConvId && messages.length === 0 ? (
              <div className="space-y-6 pt-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm">¿En qué puedo ayudarte hoy?</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Puedo consultar datos, crear clientes/proveedores, agendar tareas, cotizaciones y más.
                  </p>
                </div>

                {/* Preset Chips */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sugerencias rápidas:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {presetChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(chip);
                        }}
                        className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-xs text-slate-300 hover:text-amber-300 transition-all group"
                      >
                        <span className="group-hover:translate-x-1 inline-block transition-transform">💡 {chip}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      m.role === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-md'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/70 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Pending Action Confirmation Card */}
                    {m.pendingAction && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border-2 border-amber-500/60 text-slate-100 space-y-2 shadow-lg">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-slate-800 pb-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Confirmar Acción en el CRM</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-snug">
                          {m.pendingAction.summary}
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            disabled={confirming === m.id}
                            onClick={() => confirmMutation.mutate({ messageId: m.id, confirmed: true })}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>
                          <button
                            disabled={confirming === m.id}
                            onClick={() => confirmMutation.mutate({ messageId: m.id, confirmed: false })}
                            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 px-1">
                    {m.role === 'user' ? 'Tú' : 'Agente IA'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}

            {sending && (
              <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/50 p-3 rounded-2xl w-fit border border-slate-700/50">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Analizando solicitud y datos del CRM...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-amber-500/70 transition-colors">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje o acción..."
                className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className="p-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Las acciones de escritura requieren confirmación previa.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
