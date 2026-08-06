'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Token de recuperación faltante. Por favor solicita un nuevo enlace.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setSuccess(res.data.message || 'Contraseña restablecida con éxito.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña. El token puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#FFBE00] text-[#2D2D2D] flex items-center justify-center shadow-lg mb-4 font-black text-2xl">
          PG
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          PERFIL<span className="text-[#FFBE00]">GRANOS</span> <span className="text-[10px] bg-[#98D500] text-black px-1.5 py-0.5 rounded font-bold ml-1 uppercase">CRM</span>
        </h1>
        <p className="text-gray-400 text-xs mt-1">Restablecer Contraseña</p>
      </div>

      {success ? (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-[#98D500]" />
          </div>
          <p className="text-white font-medium text-sm">{success}</p>
          <Link
            href="/login"
            className="w-full bg-[#FFBE00] hover:bg-[#e0a700] text-[#2D2D2D] font-bold rounded-xl px-4 py-3.5 transition-all block text-center"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Falta el token de recuperación en la URL. Solicita un nuevo enlace.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={!token}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFBE00] focus:border-[#FFBE00] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                disabled={!token}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Confirmar nueva contraseña</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={!token}
              placeholder="••••••••"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFBE00] focus:border-[#FFBE00] transition-all disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#FFBE00] hover:bg-[#e0a700] disabled:opacity-60 text-[#2D2D2D] font-bold rounded-xl px-4 py-3.5 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          <Link
            href="/login"
            className="w-full text-center text-gray-400 hover:text-white text-xs mt-2 transition-colors block"
          >
            Volver al inicio de sesión
          </Link>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2D2D2D] p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFBE00]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#98D500]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#FFBE00] animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
