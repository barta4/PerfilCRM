---
name: module-builder
description: Generates, installs, and registers new pluggable modules for PerfilCRM following the Dolibarr-style modular architecture standard, unified Terceros (Clients + Suppliers) pattern, Uruguay RUT tax localization, and i18n multi-language support.
---

# Skill: Module Builder (PerfilCRM Pluggable Module Generator)

Use this skill whenever a user requests to create, generate, or add a new module to PerfilCRM (e.g., "crea un módulo de flotas", "crea un módulo de proveedores", "añade un módulo para alquileres").

---

## Core Architecture Guidelines

1. **Dolibarr Pluggable Architecture**: Every module is isolated, toggleable from `/admin/modules` at runtime, and exposes custom extrafields via PostgreSQL `JSONB`.
2. **Unified Terceros (Clients & Suppliers)**: Never duplicate customer and vendor tables. All third parties must use the unified `Client` / Tercero model (`backend/src/clients/client.entity.ts`) with boolean flags `isClient` and `isSupplier`.
3. **Tax Localization (Uruguay RUT)**: Primary tax identifier field (`taxId`) defaults to **RUT de Uruguay** (12 digits).
4. **Multi-Language Support (i18n)**: All UI text elements, menu items, table headers, and form labels MUST be translated using `useLanguageStore` (`t('key', fallback)`) with support for Español (`es`), Inglés (`en`), and Portugués (`pt`).

Each module MUST adhere to the `ModuleManifest` contract defined in `backend/src/core/modules-registry/interfaces/module-manifest.interface.ts`.

---

## Step-by-Step Module Generation Protocol

### Step 1: Create Backend Module Structure

Directory location: `backend/src/modules/<module_name>/`

Files required:
1. `<module_name>.manifest.ts` - Defines metadata, permissions, navigation links, widgets.
2. `<module_name>.module.ts` - NestJS module importing TypeORM entities or reusing `ClientsModule`.
3. `<module_name>.controller.ts` - HTTP controller decorated with `@UseGuards(JwtAuthGuard, ModuleGuard)` and `@RequiresModule('<module_id>')`.
4. `<module_name>.service.ts` - Business logic and TypeORM operations.
5. `entities/<entity_name>.entity.ts` - TypeORM entity including `@Column({ type: 'jsonb', nullable: true, default: {} }) customFields: Record<string, any>;`.

### Step 2: Create Frontend Route & Components

Directory location: `frontend/src/app/<module_name>/`

Files required:
1. `page.tsx` - Next.js App Router page.
2. Form includes `<DynamicFieldsForm entityType="<entity_name>" values={customFields} onChange={handleFieldChange} />` for dynamic extrafields support.
3. UI text uses `const { t } = useLanguageStore();` for i18n translation strings.

### Step 3: Register in Core Engine

1. **Backend**: Import `<ModuleName>Module` into `backend/src/app.module.ts`.
2. **Backend**: Register manifest into `ModuleRegistryService` inside `backend/src/core/modules-registry/module-registry.service.ts`.
3. **Frontend**: Add icon mapping to `frontend/src/app/admin/modules/page.tsx` and route link in `Navbar.tsx`.
4. **Locales**: Add translation keys to `frontend/src/locales/es.json`, `en.json`, and `pt.json`.

---

## Manifest Reference Template

```typescript
import { ModuleManifest } from '../../core/modules-registry/interfaces/module-manifest.interface';

export const FleetManifest: ModuleManifest = {
  id: 'fleet_management',
  name: 'Gestión de Flotas',
  description: 'Control de vehículos, choferes, mantenimientos y combustible.',
  version: '1.0.0',
  author: 'PerfilCRM Skill System',
  category: 'operations',
  isCore: false,
  dependencies: ['crm_clients'],
  permissions: [
    { id: 'fleet:view', name: 'Ver Flota' },
    { id: 'fleet:edit', name: 'Editar Flota' }
  ],
  navigation: [
    {
      label: 'Flota de Vehículos',
      href: '/fleet',
      icon: 'Truck',
      group: 'operaciones',
      permission: 'fleet:view'
    }
  ],
  widgets: [
    {
      id: 'fleet_summary_widget',
      title: 'Estado de Flota',
      description: 'Resumen de vehículos disponibles y en servicio',
      componentKey: 'FleetSummaryWidget',
      defaultSize: 'medium'
    }
  ],
  customFieldsEntities: ['vehicle']
};
```

---

## Quality Checklist

- [ ] Controller decorated with `@UseGuards(JwtAuthGuard, ModuleGuard)` and `@RequiresModule('<module_id>')`
- [ ] Entity contains `customFields: Record<string, any>` (JSONB column)
- [ ] Uses unified `Client` / Terceros entity if creating commercial contact features (`isClient` / `isSupplier` flags)
- [ ] Primary tax ID defaults to RUT (Uruguay)
- [ ] Manifest registered in `ModuleRegistryService`
- [ ] Frontend form includes `<DynamicFieldsForm>`
- [ ] All UI strings use `useLanguageStore` `t()` (ES, EN, PT)
- [ ] App compiles cleanly with `npm run build` in both `backend` and `frontend`
