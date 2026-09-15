import { ModuleManifest } from '../../core/modules-registry/interfaces/module-manifest.interface';

export const GoogleCalendarManifest: ModuleManifest = {
  id: 'google_calendar',
  name: 'Integración Google Calendar',
  description: 'Sincronización en tiempo real de la Agenda (eventos, reuniones, Google Meet) y Tareas con Google Calendar.',
  version: '1.0.0',
  author: 'PerfilCRM Skill System',
  category: 'operations',
  isCore: false,
  dependencies: ['ops_events', 'ops_tasks'],
  permissions: [
    { id: 'calendar:sync', name: 'Sincronizar Google Calendar' },
    { id: 'calendar:admin', name: 'Administrar Configuración Google' },
  ],
  navigation: [],
  widgets: [
    {
      id: 'google_calendar_status_widget',
      title: 'Google Calendar Conectado',
      description: 'Estado de conexión y sincronización de eventos de agenda.',
      componentKey: 'GoogleCalendarStatusWidget',
      defaultSize: 'small',
    },
  ],
};
