import { ModuleManifest } from '../../core/modules-registry/interfaces/module-manifest.interface';

export const AccountingManifest: ModuleManifest = {
  id: 'accounting_uruguay',
  name: 'Contabilidad Uruguay',
  description: 'Plan de cuentas uruguayo, asientos contables con partida doble, e-Factura/DGI, IVA (22%, 10%, Exento), Libro Diario, Mayor y Balance de Comprobación.',
  version: '1.0.0',
  author: 'PerfilCRM Skill System',
  category: 'crm',
  isCore: false,
  dependencies: ['crm_clients'],
  permissions: [
    { id: 'accounting:view', name: 'Ver Contabilidad' },
    { id: 'accounting:create', name: 'Crear Asientos y Cuentas' },
    { id: 'accounting:edit', name: 'Editar Contabilidad' },
    { id: 'accounting:delete', name: 'Eliminar Asientos' },
  ],
  navigation: [
    {
      label: 'Contabilidad Uruguay',
      href: '/accounting',
      icon: 'Calculator',
      group: 'comercial',
      permission: 'accounting:view',
    },
  ],
  widgets: [
    {
      id: 'accounting_summary_widget',
      title: 'Resumen Contable DGI',
      description: 'Muestra los saldos principales y balance de comprobación',
      componentKey: 'AccountingSummaryWidget',
      defaultSize: 'medium',
    },
  ],
  customFieldsEntities: ['account'],
};
