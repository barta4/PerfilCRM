import { Injectable } from '@nestjs/common';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  minRole: 'admin' | 'manager' | 'sales';
}

@Injectable()
export class ToolRegistryService {
  private readonly tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerTools();
  }

  private registerTools() {
    // 1. Search Clients / Terceros
    this.tools.set('search_clients', {
      name: 'search_clients',
      description: 'Busca empresas, clientes o proveedores en el CRM por nombre, RUT o industria.',
      requiresConfirmation: false,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Término de búsqueda (Razón Social, RUT o Código)' },
          type: { type: 'string', enum: ['client', 'supplier', 'both', 'all'], description: 'Filtrar por rol' },
        },
      },
    });

    // 2. Create Client / Tercero
    this.tools.set('create_client', {
      name: 'create_client',
      description: 'Registra un nuevo tercero (Cliente, Proveedor o Ambos) con su RUT de Uruguay y datos de contacto.',
      requiresConfirmation: true,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          businessName: { type: 'string', description: 'Razón Social o Nombre de la Empresa' },
          taxId: { type: 'string', description: 'RUT de Uruguay (12 dígitos)' },
          isClient: { type: 'boolean', description: 'Indica si es Cliente (true/false)' },
          isSupplier: { type: 'boolean', description: 'Indica si es Proveedor (true/false)' },
          phone: { type: 'string', description: 'Teléfono de contacto' },
          companyEmail: { type: 'string', description: 'Email institucional' },
          address: { type: 'string', description: 'Dirección o ubicación fiscal' },
          industry: { type: 'string', description: 'Rubro o industria (ej: Productor, Acopiador, Logística)' },
          paymentTerms: { type: 'string', description: 'Condición de pago (ej: 30 días, Contado)' },
        },
        required: ['businessName'],
      },
    });

    // 3. List Tasks
    this.tools.set('list_tasks', {
      name: 'list_tasks',
      description: 'Obtiene las tareas pendientes o completadas del usuario o del equipo.',
      requiresConfirmation: false,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['To Do', 'In Progress', 'Done', 'Cancelled'] },
          priority: { type: 'string', enum: ['Low', 'Normal', 'High', 'Critical'] },
        },
      },
    });

    // 4. Create Task
    this.tools.set('create_task', {
      name: 'create_task',
      description: 'Crea una nueva tarea asignada a un ejecutivo para un cliente específico.',
      requiresConfirmation: true,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título claro de la tarea' },
          description: { type: 'string', description: 'Detalles u observaciones' },
          dueDate: { type: 'string', description: 'Fecha de vencimiento (YYYY-MM-DD)' },
          priority: { type: 'string', enum: ['Low', 'Normal', 'High', 'Critical'] },
          clientId: { type: 'number', description: 'ID del cliente/tercero asociado' },
        },
        required: ['title'],
      },
    });

    // 5. List Visits / Communications
    this.tools.set('list_visits', {
      name: 'list_visits',
      description: 'Obtiene las últimas comunicaciones o visitas registradas.',
      requiresConfirmation: false,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          clientId: { type: 'number', description: 'ID del cliente a consultar' },
          limit: { type: 'number', description: 'Cantidad máxima de registros (default 5)' },
        },
      },
    });

    // 6. Create Visit / Communication
    this.tools.set('create_visit', {
      name: 'create_visit',
      description: 'Registra una comunicación realizada (Llamada, Reunión, Email, WhatsApp) con un cliente.',
      requiresConfirmation: true,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          clientId: { type: 'number', description: 'ID del cliente/tercero' },
          communicationType: { type: 'string', enum: ['Llamada', 'Reunión', 'Email', 'WhatsApp', 'Otro'] },
          subject: { type: 'string', description: 'Asunto o tema principal' },
          notes: { type: 'string', description: 'Minuta o notas de la reunión' },
          createTask: { type: 'boolean', description: 'Crear automáticamente tarea de seguimiento' },
        },
        required: ['clientId', 'communicationType'],
      },
    });

    // 7. Create Event in Agenda
    this.tools.set('create_event', {
      name: 'create_event',
      description: 'Agenda un evento o reunión en el calendario comercial.',
      requiresConfirmation: true,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título del evento' },
          type: { type: 'string', enum: ['Presencial', 'Virtual', 'Llamada', 'Feria'] },
          startTime: { type: 'string', description: 'Fecha y hora de inicio (ISO 8601)' },
          endTime: { type: 'string', description: 'Fecha y hora de fin (ISO 8601)' },
          clientId: { type: 'number', description: 'ID del cliente asociado' },
          meetingLink: { type: 'string', description: 'Enlace de videollamada si es virtual' },
        },
        required: ['title', 'type', 'startTime', 'endTime', 'clientId'],
      },
    });

    // 8. Create Quotation / Orden de Venta
    this.tools.set('create_quotation', {
      name: 'create_quotation',
      description: 'Crea una nueva cotización u orden de venta para un cliente.',
      requiresConfirmation: true,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {
          clientId: { type: 'number', description: 'ID del cliente' },
          paymentTerms: { type: 'string', description: 'Plazo de pago' },
          notes: { type: 'string', description: 'Observaciones' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productName: { type: 'string', description: 'Producto o grano (ej: Soja, Maíz, Fertilizante)' },
                unit: { type: 'string', description: 'Unidad de medida (ej: Ton, Litros, Sacos)' },
                quantity: { type: 'number', description: 'Cantidad' },
                unitPrice: { type: 'number', description: 'Precio unitario en USD' },
              },
              required: ['productName', 'quantity', 'unitPrice'],
            },
          },
        },
        required: ['clientId', 'items'],
      },
    });

    // 9. Get Dashboard Summary
    this.tools.set('get_dashboard_summary', {
      name: 'get_dashboard_summary',
      description: 'Obtiene un resumen cuantitativo del estado actual del CRM (clientes por estado, tareas pendientes, etc.).',
      requiresConfirmation: false,
      minRole: 'sales',
      parameters: {
        type: 'object',
        properties: {},
      },
    });
  }

  getOpenAiToolsSchema() {
    const toolsArray: any[] = [];
    for (const tool of this.tools.values()) {
      toolsArray.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      });
    }
    return toolsArray;
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
}
