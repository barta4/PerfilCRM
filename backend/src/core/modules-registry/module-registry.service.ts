import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRegistry } from './module-registry.entity';
import { ModuleManifest } from './interfaces/module-manifest.interface';
import { SuppliersManifest } from '../../modules/suppliers/suppliers.manifest';
import { AccountingManifest } from '../../modules/accounting/accounting.manifest';
import { GoogleCalendarManifest } from '../../modules/google-calendar/google-calendar.manifest';
import { PdfTemplatesManifest } from '../../modules/pdf-templates/pdf-templates.manifest';

@Injectable()
export class ModuleRegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ModuleRegistryService.name);
  private manifestsRegistry = new Map<string, ModuleManifest>();

  constructor(
    @InjectRepository(ModuleRegistry)
    private moduleRepo: Repository<ModuleRegistry>,
  ) {}

  async onApplicationBootstrap() {
    this.registerStandardManifests();
    this.safeSyncDatabaseRegistry();
  }

  private async safeSyncDatabaseRegistry(retries = 10, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.syncDatabaseRegistry();
        this.logger.log('Registro de módulos sincronizado exitosamente con la base de datos.');
        return;
      } catch (err: any) {
        this.logger.warn(
          `[Módulos] Intento ${attempt}/${retries}: Esperando inicialización de tabla module_registry (${err.message}). Reintentando en ${delayMs / 1000}s...`,
        );
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
  }

  private registerStandardManifests() {
    const standardManifests: ModuleManifest[] = [
      {
        id: 'crm_clients',
        name: 'CRM & Clientes',
        description: 'Gestión de ficha de clientes, contactos y empresas.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'crm',
        isCore: true,
        permissions: [
          { id: 'clients:view', name: 'Ver Clientes' },
          { id: 'clients:edit', name: 'Editar Clientes' },
        ],
        navigation: [
          { label: 'Clientes', href: '/clients', icon: 'Users', group: 'comercial', permission: 'clients:view' },
        ],
        customFieldsEntities: ['client', 'contact'],
      },
      {
        id: 'comms_visits',
        name: 'Visitas y Comunicaciones',
        description: 'Registro de reuniones, minutas e interacciones comerciales.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'crm',
        isCore: false,
        dependencies: ['crm_clients'],
        permissions: [{ id: 'visits:view', name: 'Ver Visitas' }],
        navigation: [
          { label: 'Visitas y Comunicaciones', href: '/visits', icon: 'MapPin', group: 'operaciones' },
        ],
        customFieldsEntities: ['visit'],
      },
      {
        id: 'sales_quotations',
        name: 'Cotizaciones y Órdenes',
        description: 'Creación de cotizaciones, órdenes de venta y generación de PDFs.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'sales',
        isCore: false,
        dependencies: ['crm_clients'],
        permissions: [{ id: 'quotations:view', name: 'Ver Cotizaciones' }],
        navigation: [
          { label: 'Cotizaciones / Órdenes', href: '/quotations', icon: 'FileText', group: 'comercial' },
        ],
        customFieldsEntities: ['quotation'],
      },
      {
        id: 'ops_tasks',
        name: 'Gestión de Tareas',
        description: 'Tablero de seguimiento, prioridades y asignación de tareas.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'operations',
        isCore: false,
        permissions: [{ id: 'tasks:view', name: 'Ver Tareas' }],
        navigation: [
          { label: 'Tareas', href: '/tasks', icon: 'ClipboardList', group: 'operaciones' },
        ],
        customFieldsEntities: ['task'],
      },
      {
        id: 'ops_events',
        name: 'Agenda y Calendario',
        description: 'Programación de eventos, citas y recordatorios.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'operations',
        isCore: false,
        permissions: [{ id: 'events:view', name: 'Ver Agenda' }],
        navigation: [
          { label: 'Agenda', href: '/events', icon: 'Calendar', group: 'operaciones' },
        ],
      },
      {
        id: 'inventory_stock',
        name: 'Inventario y Catálogo',
        description: 'Control de productos, categorías y existencias en almacén.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'inventory',
        isCore: false,
        permissions: [{ id: 'inventory:view', name: 'Ver Inventario' }],
        navigation: [
          { label: 'Inventario', href: '/inventory', icon: 'Package', group: 'operaciones' },
        ],
        customFieldsEntities: ['product'],
      },
      {
        id: 'inspections_field',
        name: 'Inspecciones e Informes',
        description: 'Checklists de control, auditorías de campo e inspecciones técnicas.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'industry',
        isCore: false,
        permissions: [{ id: 'inspections:view', name: 'Ver Inspecciones' }],
        navigation: [
          { label: 'Inspecciones', href: '/inspections', icon: 'ShieldCheck', group: 'operaciones' },
        ],
        customFieldsEntities: ['inspection'],
      },
      {
        id: 'email_campaigns',
        name: 'Campañas de Email',
        description: 'Envío masivo de correos y seguimiento de interacción comercial.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'sales',
        isCore: false,
        permissions: [{ id: 'campaigns:view', name: 'Ver Campañas' }],
        navigation: [
          { label: 'Campañas de Correo', href: '/campaigns', icon: 'Mail', group: 'comercial' },
        ],
      },
      {
        id: 'ai_automation',
        name: 'Agente IA & Recomendaciones',
        description: 'Sugerencias predictivas en Dashboard, Chatbot comercial y automatizaciones de reglas.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'analytics',
        isCore: false,
        permissions: [{ id: 'ai:admin', name: 'Administrar Agente IA' }],
        navigation: [
          { label: 'Agente IA & Reglas', href: '/admin/automation', icon: 'Bot', group: 'admin' },
        ],
        widgets: [
          {
            id: 'ai_recommendations_tile',
            title: 'Recomendaciones IA Comercial',
            description: 'Sugerencias predictivas y acciones recomendadas del Agente IA en el Dashboard.',
            componentKey: 'AiInsightsTile',
            defaultSize: 'large',
          },
        ],
      },
      {
        id: 'reports_bi',
        name: 'Reportes y Analítica',
        description: 'Indicadores clave, tableros ejecutivos y métricas de desempeño.',
        version: '1.0.0',
        author: 'PerfilCRM Core',
        category: 'analytics',
        isCore: false,
        permissions: [{ id: 'reports:view', name: 'Ver Reportes' }],
        navigation: [
          { label: 'Reportes', href: '/reports', icon: 'BarChart3', group: 'reportes' },
        ],
      },
      SuppliersManifest,
      AccountingManifest,
      GoogleCalendarManifest,
      PdfTemplatesManifest,
    ];

    for (const manifest of standardManifests) {
      this.manifestsRegistry.set(manifest.id, manifest);
    }
  }

  async syncDatabaseRegistry() {
    for (const [id, manifest] of this.manifestsRegistry.entries()) {
      const existing = await this.moduleRepo.findOne({ where: { id } });
      if (!existing) {
        const newRecord = this.moduleRepo.create({
          id: manifest.id,
          name: manifest.name,
          description: manifest.description,
          version: manifest.version,
          category: manifest.category,
          isCore: manifest.isCore,
          isEnabled: true, // Default enabled for standard modules
          dependencies: manifest.dependencies || [],
          permissions: manifest.permissions || [],
          navigation: manifest.navigation || [],
          widgets: manifest.widgets || [],
        });
        await this.moduleRepo.save(newRecord);
        this.logger.log(`Módulo registrado en BD: ${manifest.name} (${id})`);
      } else {
        // Update manifest definitions if version/meta changed
        existing.name = manifest.name;
        existing.description = manifest.description;
        existing.navigation = manifest.navigation;
        existing.permissions = manifest.permissions;
        existing.widgets = manifest.widgets || [];
        await this.moduleRepo.save(existing);
      }
    }
  }

  registerManifest(manifest: ModuleManifest) {
    this.manifestsRegistry.set(manifest.id, manifest);
    this.syncDatabaseRegistry();
  }

  async getAllModules(): Promise<ModuleRegistry[]> {
    try {
      return await this.moduleRepo.find({ order: { category: 'ASC', id: 'ASC' } });
    } catch {
      return [];
    }
  }

  async getEnabledModules(): Promise<ModuleRegistry[]> {
    try {
      return await this.moduleRepo.find({ where: { isEnabled: true } });
    } catch {
      return [];
    }
  }

  async isModuleEnabled(moduleId: string): Promise<boolean> {
    try {
      const record = await this.moduleRepo.findOne({ where: { id: moduleId } });
      if (!record) return true; // Default allow if unmanaged
      return record.isEnabled;
    } catch {
      return true;
    }
  }

  async toggleModule(id: string, isEnabled: boolean): Promise<ModuleRegistry> {
    const moduleRecord = await this.moduleRepo.findOne({ where: { id } });
    if (!moduleRecord) {
      throw new Error(`Módulo '${id}' no encontrado.`);
    }

    if (moduleRecord.isCore && !isEnabled) {
      throw new Error(`El módulo del sistema '${moduleRecord.name}' es obligatorio y no puede ser desactivado.`);
    }

    moduleRecord.isEnabled = isEnabled;
    return this.moduleRepo.save(moduleRecord);
  }
}
