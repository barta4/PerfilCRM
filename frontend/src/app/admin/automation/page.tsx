'use client';

import { AdminModule } from '@/components/modules/AdminModule';
import { PageHeader } from '@/components/ui/PageHeader';
import { Bot } from 'lucide-react';

export default function AutomationAdminPage() {
  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={Bot}
        title="Agente IA & Reglas de Automatización"
        description="Configura los parámetros del proveedor de inteligencia artificial (API Key, modelo LLM, prompt de sistema) y motor de automatizaciones."
      />
      <AdminModule initialTab="automation" />
    </main>
  );
}
