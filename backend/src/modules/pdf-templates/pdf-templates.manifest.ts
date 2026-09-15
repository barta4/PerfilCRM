import { ModuleManifest } from '../../core/modules-registry/interfaces/module-manifest.interface';

export const PdfTemplatesManifest: ModuleManifest = {
  id: 'pdf_templates',
  name: 'Plantillas PDF Dinámicas',
  description: 'Diseño, personalización y asignación de formatos PDF para cotizaciones y órdenes de venta.',
  version: '1.0.0',
  author: 'PerfilCRM Core Engine',
  category: 'sales',
  isCore: false,
  dependencies: ['sales_quotations'],
  permissions: [
    { id: 'templates:view', name: 'Ver Plantillas PDF' },
    { id: 'templates:edit', name: 'Administrar Plantillas PDF' },
  ],
  navigation: [
    {
      label: 'Plantillas PDF',
      href: '/admin/pdf-templates',
      icon: 'FileCode',
      group: 'admin',
      permission: 'templates:view',
    },
  ],
  customFieldsEntities: ['pdf_template'],
};
