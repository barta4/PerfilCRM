'use client';

import { AdminModule } from '@/components/modules/AdminModule';
import { PageHeader } from '@/components/ui/PageHeader';
import { Settings } from 'lucide-react';

export default function AdminPage() {
  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={Settings}
        title="Administración del Sistema"
        description="Gestión centralizada de usuarios, personalización de marca White-Label, parámetros globales y configuraciones del CRM."
      />
      <AdminModule />
    </main>
  );
}
