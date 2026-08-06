'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales';
  allowedModules: string[] | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasModule: (moduleId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { access_token, user } = res.data;
        set({ token: access_token, user });
        // Set auth header globally
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      },

      logout: () => {
        set({ token: null, user: null });
        delete api.defaults.headers.common['Authorization'];
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      isAuthenticated: () => !!get().token,

      hasModule: (moduleId: string) => {
        const user = get().user;
        if (!user) return false;
        if (user.allowedModules === null || user.allowedModules === undefined) return true;
        return user.allowedModules.includes(moduleId);
      },
    }),
    {
      name: 'perfilgranos-auth',
      onRehydrateStorage: () => (state) => {
        // Restore axios header on page reload
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
