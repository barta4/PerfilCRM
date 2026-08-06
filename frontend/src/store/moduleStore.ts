'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

export interface ModuleRecord {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  isCore: boolean;
  isEnabled: boolean;
  dependencies: string[];
  permissions: Array<{ id: string; name: string }>;
  navigation: Array<{
    label: string;
    href: string;
    icon: string;
    group: string;
    permission?: string;
  }>;
  widgets: Array<{
    id: string;
    title: string;
    description: string;
    componentKey: string;
    defaultSize: 'small' | 'medium' | 'large';
  }>;
  config: Record<string, any>;
}

interface ModuleStoreState {
  modules: ModuleRecord[];
  isLoading: boolean;
  error: string | null;
  fetchModules: () => Promise<void>;
  toggleModule: (id: string, isEnabled: boolean) => Promise<void>;
  isModuleEnabled: (id: string) => boolean;
}

export const useModuleStore = create<ModuleStoreState>((set, get) => ({
  modules: [],
  isLoading: false,
  error: null,

  fetchModules: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/core/modules');
      set({ modules: res.data, isLoading: false });
    } catch (err: any) {
      console.error('Error al cargar módulos:', err);
      set({ error: err.message || 'Error al cargar módulos', isLoading: false });
    }
  },

  toggleModule: async (id: string, isEnabled: boolean) => {
    try {
      const res = await api.patch(`/core/modules/${id}/toggle`, { isEnabled });
      set((state) => ({
        modules: state.modules.map((m) => (m.id === id ? { ...m, isEnabled: res.data.isEnabled } : m)),
      }));
    } catch (err: any) {
      console.error('Error al conmutar módulo:', err);
      throw err;
    }
  },

  isModuleEnabled: (id: string) => {
    const mod = get().modules.find((m) => m.id === id);
    return mod ? mod.isEnabled : true;
  },
}));
