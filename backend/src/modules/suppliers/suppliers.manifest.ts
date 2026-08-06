import { ModuleManifest } from '../../core/modules-registry/interfaces/module-manifest.interface';

export const SuppliersManifest: ModuleManifest = {
  id: 'procurement_suppliers',
  name: 'Gestión de Proveedores',
  description: 'Ficha unificada de terceros/proveedores, RUT uruguayo, datos fiscales, contactos y condiciones comerciales.',
  version: '1.0.0',
  author: 'PerfilCRM Skill System',
  category: 'inventory',
  isCore: false,
  permissions: [
    { id: 'suppliers:view', name: 'Ver Proveedores' },
    { id: 'suppliers:create', name: 'Crear Proveedores' },
    { id: 'suppliers:edit', name: 'Editar Proveedores' },
    { id: 'suppliers:delete', name: 'Eliminar Proveedores' },
  ],
  navigation: [
    {
      label: 'Proveedores',
      href: '/suppliers',
      icon: 'Building2',
      group: 'operaciones',
      permission: 'suppliers:view',
    },
  ],
  widgets: [
    {
      id: 'suppliers_summary_widget',
      title: 'Resumen de Proveedores',
      description: 'Muestra el total de proveedores activos por categoría',
      componentKey: 'SuppliersSummaryWidget',
      defaultSize: 'medium',
    },
  ],
  customFieldsEntities: ['client'],
};
