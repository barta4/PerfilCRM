import { TasksModule } from '@/components/modules/TasksModule';

export default function TasksPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tareas y Seguimiento</h1>
      <TasksModule />
    </main>
  );
}
