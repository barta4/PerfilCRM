import { ClientsModule } from '@/components/modules/ClientsModule';

export default function ClientsPage() {
  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes y Terceros (Directorio Unificado)</h1>
      </div>
      <ClientsModule />
    </main>
  );
}
