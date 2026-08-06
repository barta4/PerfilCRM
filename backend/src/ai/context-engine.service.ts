import { Injectable, Logger } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { TasksService } from '../tasks/tasks.service';
import { VisitsService } from '../visits/visits.service';
import { QuotationsService } from '../quotations/quotations.service';
import { User, UserRole } from '../auth/user.entity';

@Injectable()
export class ContextEngineService {
  private readonly logger = new Logger(ContextEngineService.name);

  constructor(
    private readonly clientsService: ClientsService,
    private readonly tasksService: TasksService,
    private readonly visitsService: VisitsService,
    private readonly quotationsService: QuotationsService,
  ) {}

  async buildContextPrompt(user: User): Promise<string> {
    try {
      const [clients, tasks, visits, quotations] = await Promise.all([
        this.clientsService.findAll(undefined, 'all'),
        this.tasksService.findAll(),
        this.visitsService.findAll(),
        this.quotationsService.findAll(user),
      ]);

      let userClients = clients;
      if (user.role === UserRole.SALES) {
        // Limit sample preview if sales
        userClients = clients.slice(0, 15);
      }

      const greenCount = clients.filter((c) => c.status === 'Green').length;
      const yellowCount = clients.filter((c) => c.status === 'Yellow').length;
      const redCount = clients.filter((c) => c.status === 'Red').length;
      const pendingTasks = tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled').length;

      const clientsPreview = userClients.slice(0, 8).map((c) => ({
        id: c.id,
        name: c.businessName,
        taxId: c.taxId || 'N/D',
        status: c.status,
        isClient: c.isClient,
        isSupplier: c.isSupplier,
        paymentTerms: c.paymentTerms,
      }));

      const contextObj = {
        currentUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          allowedModules: user.allowedModules || 'Todos',
        },
        crmSummary: {
          totalThirdParties: clients.length,
          statusDistribution: { green: greenCount, yellow: yellowCount, red: redCount },
          pendingTasksCount: pendingTasks,
          recentVisitsCount: visits.length,
          activeQuotationsCount: quotations.length,
        },
        sampleThirdParties: clientsPreview,
      };

      return `
RESUMEN DEL CRM Y USUARIO EN TIEMPO REAL:
${JSON.stringify(contextObj, null, 2)}

INSTRUCCIONES DE COMPORTAMIENTO:
1. Responde de forma profesional, clara, ejecutiva y amigable.
2. Si el usuario te pide crear un cliente, tarea, comunicación, cotización o evento, UTILIZA las herramientas disponibles (tool_calls).
3. Para operaciones de ESCRITURA (crear/modificar), las herramientas están configuradas para requerir confirmación antes de impactar el sistema.
4. Si falta información requerida para ejecutar una acción (ej: falta el nombre del cliente o el RUT), pídesela amablemente al usuario.
5. El sistema está localizado para Uruguay (RUT de 12 dígitos, USD/UYU).
`;
    } catch (error) {
      this.logger.error('Error al construir el prompt de contexto:', error);
      return 'Contexto del sistema parcialmente disponible.';
    }
  }
}
