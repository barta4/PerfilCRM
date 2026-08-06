import { ModuleManifest } from '../../core/modules-registry/interfaces/module-manifest.interface';

export const SampleManifest: ModuleManifest = {
  id: 'sample_module',
  name: 'Módulo de Ejemplo',
  description: 'Descripción del módulo personalizado.',
  version: '1.0.0',
  author: 'PerfilCRM AI Agent',
  category: 'operations',
  isCore: false,
  dependencies: [],
  permissions: [
    { id: 'sample:view', name: 'Ver Módulo' },
    { id: 'sample:edit', name: 'Editar Módulo' },
  ],
  navigation: [
    {
      label: 'Módulo de Ejemplo',
      href: '/sample',
      icon: 'Boxes',
      group: 'operaciones',
      permission: 'sample:view',
    },
  ],
  widgets: [],
  customFieldsEntities: ['sample_entity'],
};
