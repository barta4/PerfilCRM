export interface ModulePermission {
  id: string;
  name: string;
  description?: string;
}

export interface ModuleNavigationItem {
  label: string;
  href: string;
  icon: string;
  group: 'comercial' | 'operaciones' | 'reportes' | 'admin' | 'custom';
  permission?: string;
}

export interface ModuleDashboardWidget {
  id: string;
  title: string;
  description: string;
  componentKey: string;
  defaultSize: 'small' | 'medium' | 'large';
}

export interface ModuleManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'crm' | 'sales' | 'operations' | 'inventory' | 'industry' | 'analytics';
  isCore: boolean;
  dependencies?: string[];
  permissions: ModulePermission[];
  navigation: ModuleNavigationItem[];
  widgets?: ModuleDashboardWidget[];
  customFieldsEntities?: string[];
}
