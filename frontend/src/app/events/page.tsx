import { EventsModule } from '@/components/modules/EventsModule';

export default function EventsPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Agenda y Eventos</h1>
      <EventsModule />
    </main>
  );
}
