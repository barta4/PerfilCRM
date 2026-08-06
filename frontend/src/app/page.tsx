import { DashboardModule } from '@/components/modules/DashboardModule';

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <DashboardModule />
    </main>
  );
}
