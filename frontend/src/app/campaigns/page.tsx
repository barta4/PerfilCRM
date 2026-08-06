import { CampaignsModule } from '@/components/modules/CampaignsModule';

export default function CampaignsPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Campañas de Correo</h1>
      <CampaignsModule />
    </main>
  );
}
