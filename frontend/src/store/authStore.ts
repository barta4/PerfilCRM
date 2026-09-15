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

const MODULE_ALIASES: Record<string, string[]> = {
  crm_clients: ['crm_clients', 'clients'],
  clients: ['crm_clients', 'clients'],
  sales_quotations: ['sales_quotations', 'quotations'],
  quotations: ['sales_quotations', 'quotations'],
  comms_visits: ['comms_visits', 'visits'],
  visits: ['comms_visits', 'visits'],
  ops_tasks: ['ops_tasks', 'tasks'],
  tasks: ['ops_tasks', 'tasks'],
  ops_events: ['ops_events', 'events', 'calendar'],
  events: ['ops_events', 'events', 'calendar'],
  inventory_stock: ['inventory_stock', 'inventory'],
  inventory: ['inventory_stock', 'inventory'],
  inspections_field: ['inspections_field', 'inspections'],
  inspections: ['inspections_field', 'inspections'],
  email_campaigns: ['email_campaigns', 'campaigns'],
  campaigns: ['email_campaigns', 'campaigns'],
  ai_automation: ['ai_automation', 'ai'],
  ai: ['ai_automation', 'ai'],
  reports_bi: ['reports_bi', 'reports'],
  reports: ['reports_bi', 'reports'],
  procurement_suppliers: ['procurement_suppliers', 'suppliers'],
  suppliers: ['procurement_suppliers', 'suppliers'],
  accounting_uruguay: ['accounting_uruguay', 'accounting'],
  accounting: ['accounting_uruguay', 'accounting'],
  google_calendar: ['google_calendar', 'google-calendar'],
  'google-calendar': ['google_calendar', 'google-calendar'],
  pdf_templates: ['pdf_templates', 'pdf-templates'],
  'pdf-templates': ['pdf_templates', 'pdf-templates'],
  staff: ['staff'],
  admin: ['admin'],
  dashboard: ['dashboard'],
};

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
        // Admins and full access users have total access
        if (user.role === 'admin') return true;
        if (user.allowedModules === null || user.allowedModules === undefined) return true;
        if (moduleId === 'dashboard') return true;

        const aliases = MODULE_ALIASES[moduleId] || [moduleId];
        return aliases.some((alias) => user.allowedModules?.includes(alias));
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
