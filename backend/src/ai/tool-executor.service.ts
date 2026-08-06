import { Injectable, Logger } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { TasksService } from '../tasks/tasks.service';
import { VisitsService } from '../visits/visits.service';
import { EventsService } from '../events/events.service';
import { QuotationsService } from '../quotations/quotations.service';
import { User } from '../auth/user.entity';

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly clientsService: ClientsService,
    private readonly tasksService: TasksService,
    private readonly visitsService: VisitsService,
    private readonly eventsService: EventsService,
    private readonly quotationsService: QuotationsService,
  ) {}

  async executeTool(name: string, args: any, user: User) {
    this.logger.log(`Ejecutando herramienta de IA: ${name} por usuario ${user.name} (${user.role})`);

    try {
      switch (name) {
        case 'search_clients': {
          const clients = await this.clientsService.findAll(undefined, args.type || 'all');
          const query = (args.query || '').toLowerCase();
          const filtered = clients.filter(
            (c) =>
              c.businessName.toLowerCase().includes(query) ||
              (c.taxId && c.taxId.includes(query)) ||
              (c.code && c.code.toLowerCase().includes(query)) ||
              (c.industry && c.industry.toLowerCase().includes(query)),
          );
          return {
            count: filtered.length,
            clients: filtered.slice(0, 10).map((c) => ({
              id: c.id,
              code: c.code,
              businessName: c.businessName,
              taxId: c.taxId,
              isClient: c.isClient,
              isSupplier: c.isSupplier,
              status: c.status,
              phone: c.phone,
              email: c.companyEmail,
              paymentTerms: c.paymentTerms,
            })),
          };
        }

        case 'create_client': {
          const client = await this.clientsService.create({
            businessName: args.businessName,
            taxId: args.taxId,
            isClient: args.isClient !== undefined ? args.isClient : true,
            isSupplier: args.isSupplier !== undefined ? args.isSupplier : false,
            phone: args.phone,
            companyEmail: args.companyEmail,
            address: args.address,
            industry: args.industry,
            paymentTerms: args.paymentTerms || '30 días',
            status: 'Green',
          });
          return {
            success: true,
            message: `Tercero "${client.businessName}" (ID: #${client.id}, RUT: ${client.taxId || 'N/D'}) creado con éxito.`,
            client: { id: client.id, businessName: client.businessName, taxId: client.taxId, code: client.code },
          };
        }

        case 'list_tasks': {
          const tasks = await this.tasksService.findAll();
          let filtered = tasks;
          if (args.status) filtered = filtered.filter((t) => t.status === args.status);
          if (args.priority) filtered = filtered.filter((t) => t.priority === args.priority);
          return {
            count: filtered.length,
            tasks: filtered.slice(0, 10).map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              dueDate: t.dueDate,
              clientName: t.client?.businessName || 'N/A',
            })),
          };
        }

        case 'create_task': {
          let clientObj: any = null;
          if (args.clientId) {
            clientObj = await this.clientsService.findOne(args.clientId);
          }

          const task = await this.tasksService.create({
            title: args.title,
            description: args.description || '',
            dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
            priority: args.priority || 'Normal',
            status: 'To Do',
            client: clientObj,
            assignedTo: user,
          });

          return {
            success: true,
            message: `Tarea "${task.title}" (ID: #${task.id}) creada para el cliente ${clientObj?.businessName || 'N/A'}.`,
            task: { id: task.id, title: task.title, status: task.status, dueDate: task.dueDate },
          };
        }

        case 'list_visits': {
          const visits = await this.visitsService.findAll(args.clientId);
          const limit = args.limit || 5;
          return {
            count: visits.length,
            visits: visits.slice(0, limit).map((v) => ({
              id: v.id,
              communicationType: v.communicationType,
              subject: v.subject,
              notes: v.notes,
              clientName: v.client?.businessName || 'N/A',
              createdAt: v.createdAt,
            })),
          };
        }

        case 'create_visit': {
          const client = await this.clientsService.findOne(args.clientId);
          if (!client) throw new Error(`Cliente con ID ${args.clientId} no encontrado`);

          const visit = await this.visitsService.create({
            client,
            communicationType: args.communicationType,
            subject: args.subject || `Comunicación con ${client.businessName}`,
            notes: args.notes || '',
            createTask: args.createTask ?? true,
            createdBy: user,
          });

          return {
            success: true,
            message: `Comunicación (${visit.communicationType}) registrada para "${client.businessName}".`,
            visit: { id: visit.id, subject: visit.subject, communicationType: visit.communicationType },
          };
        }

        case 'create_event': {
          const client = await this.clientsService.findOne(args.clientId);
          if (!client) throw new Error(`Cliente con ID ${args.clientId} no encontrado`);

          const event = await this.eventsService.create({
            title: args.title,
            type: args.type,
            startTime: args.startTime,
            endTime: args.endTime,
            meetingLink: args.meetingLink,
            client,
          });

          return {
            success: true,
            message: `Evento "${event.title}" agendado con éxito para ${client.businessName}.`,
            event: { id: event.id, title: event.title, startTime: event.startTime },
          };
        }

        case 'create_quotation': {
          const client = await this.clientsService.findOne(args.clientId);
          if (!client) throw new Error(`Cliente con ID ${args.clientId} no encontrado`);

          const quotation = await this.quotationsService.create(
            {
              clientId: args.clientId,
              paymentTerms: args.paymentTerms || client.paymentTerms || '30 días',
              notes: args.notes || '',
              items: args.items || [],
            },
            user,
          );

          return {
            success: true,
            message: `Cotización/Orden N° ${quotation.quotationNumber || `#${quotation.id}`} creada por USD $${quotation.totalAmount}.`,
            quotation: {
              id: quotation.id,
              quotationNumber: quotation.quotationNumber,
              totalAmount: quotation.totalAmount,
              status: quotation.status,
            },
          };
        }

        case 'get_dashboard_summary': {
          const [clients, tasks, visits, quotations] = await Promise.all([
            this.clientsService.findAll(undefined, 'all'),
            this.tasksService.findAll(),
            this.visitsService.findAll(),
            this.quotationsService.findAll(user),
          ]);

          const clientsGreen = clients.filter((c) => c.status === 'Green').length;
          const clientsYellow = clients.filter((c) => c.status === 'Yellow').length;
          const clientsRed = clients.filter((c) => c.status === 'Red').length;
          const tasksPending = tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled').length;

          return {
            summary: {
              totalClients: clients.length,
              clientsGreen,
              clientsYellow,
              clientsRed,
              tasksPending,
              recentVisitsCount: visits.length,
              activeQuotationsCount: quotations.length,
            },
          };
        }

        default:
          throw new Error(`Herramienta no implementada: ${name}`);
      }
    } catch (error: any) {
      this.logger.error(`Error ejecutando herramienta ${name}:`, error);
      return { error: `Error al ejecutar la acción: ${error.message}` };
    }
  }
}
