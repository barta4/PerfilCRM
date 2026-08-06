import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from '../tasks/tasks.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { Visit } from '../visits/visit.entity';
import { Task } from '../tasks/task.entity';
import { Quotation } from '../quotations/quotation.entity';

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Rule 1: Visit created -> Auto-creates a follow-up Task for the executive.
   */
  @OnEvent('visit.created')
  async handleVisitCreated(visit: any) {
    this.logger.log(`Agente IA: Procesando evento visit.created para Visita #${visit.id}`);
    try {
      if (visit.createTask === false) {
        this.logger.log(`Visita #${visit.id} fue registrada sin tarea de seguimiento.`);
        return;
      }

      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 3);

      const dueDate = visit.taskDueDate ? new Date(visit.taskDueDate) : defaultDueDate;
      const title = visit.taskTitle || `Seguimiento: ${visit.subject || 'Comunicación con cliente'}`;
      const priority = visit.taskPriority || 'Normal';

      const task = await this.tasksService.create({
        title,
        description: `Tarea de seguimiento para la comunicación (${visit.communicationType || 'Reunión'}). Notas: ${visit.notes || 'Sin notas'}`,
        client: visit.client,
        sourceVisit: visit,
        assignedTo: visit.createdBy,
        dueDate,
        priority,
        status: 'To Do',
      });

      this.logger.log(`Agente IA: Tarea de seguimiento #${task.id} creada para la fecha ${dueDate.toLocaleDateString()}.`);
      this.eventEmitter.emit('task.created', task);
    } catch (error) {
      this.logger.error(`Error en Agente IA procesando visit.created: ${error.message}`);
    }
  }

  /**
   * Rule 2: Task created -> Sends email notification to assigned executive + copy to supervisor (if configured).
   */
  @OnEvent('task.created')
  async handleTaskCreated(task: Task) {
    this.logger.log(`Agente IA: Procesando evento task.created para Tarea #${task.id}`);
    try {
      const assignedUserId = task.assignedTo?.id;
      const title = `Nueva tarea asignada: ${task.title}`;
      const message = `Se te ha asignado automáticamente la tarea "${task.title}" para el cliente ${task.client?.businessName || 'N/A'}. Fecha límite: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Pendiente'}.`;

      // Create in-app notification
      await this.notificationsService.create({
        title,
        message,
        type: 'info',
        userId: assignedUserId,
      });

      // Send email if user has email
      const supervisorEmail = process.env.SUPERVISOR_EMAIL || undefined;
      const recipientEmail = task.assignedTo?.email;

      if (recipientEmail) {
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #FFBE00; border-radius: 8px;">
            <h2 style="color: #FFBE00; margin-top: 0;">Perfilgranos CRM — Nueva Tarea Asignada</h2>
            <p>Hola <strong>${task.assignedTo?.name || 'Ejecutivo'}</strong>,</p>
            <p>${message}</p>
            <div style="background-color: #f9f9f9; padding: 12px; border-left: 4px solid #98D500; margin: 15px 0;">
              <p style="margin: 0;"><strong>Cliente:</strong> ${task.client?.businessName || '—'}</p>
              <p style="margin: 5px 0 0 0;"><strong>Prioridad:</strong> ${task.priority}</p>
            </div>
            <p style="font-size: 12px; color: #748080;">Este mensaje fue generado automáticamente por el Agente IA de Automatización de Perfilgranos CRM.</p>
          </div>
        `;

        await this.emailService.sendEmail(
          recipientEmail,
          title,
          html,
          supervisorEmail,
        );
      }
    } catch (error) {
      this.logger.error(`Error en Agente IA procesando task.created: ${error.message}`);
    }
  }

  /**
   * Rule 3: Quotation / Sales Order Sent -> Sends email to client + CC to companyEmail.
   */
  @OnEvent('quotation.sent')
  async handleQuotationSent(quotation: Quotation) {
    this.logger.log(`Agente IA: Procesando evento quotation.sent para Cotización #${quotation.id}`);
    try {
      const clientEmail = quotation.client?.companyEmail;
      const companyCc = quotation.client?.companyEmail;

      if (!clientEmail) {
        this.logger.warn(`Cotización #${quotation.id} no tiene email de cliente registrado.`);
        return;
      }

      const itemsListHtml = (quotation.items || [])
        .map(
          (item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity} ${item.unit}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.unitPrice).toLocaleString()}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.subtotal).toLocaleString()}</td>
          </tr>
        `,
        )
        .join('');

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 650px; border: 2px solid #FFBE00; border-radius: 10px;">
          <h2 style="color: #2D2D2D; margin-top: 0;">Perfilgranos CRM — Orden de Venta / Cotización</h2>
          <p>Estimados <strong>${quotation.client?.businessName}</strong>,</p>
          <p>Adjuntamos el detalle de la cotización N° <strong>${quotation.quotationNumber || `#${quotation.id}`}</strong>:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #FFBE00; color: #fff;">
                <th style="padding: 8px; text-align: left;">Producto / Grano</th>
                <th style="padding: 8px; text-align: right;">Cantidad</th>
                <th style="padding: 8px; text-align: right;">Precio Unit.</th>
                <th style="padding: 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <div style="text-align: right; font-size: 18px; font-weight: bold; color: #2D2D2D; margin-top: 15px;">
            Total: $${Number(quotation.totalAmount).toLocaleString()} USD
          </div>

          <p><strong>Condiciones de Pago:</strong> ${quotation.paymentTerms || 'Contado'}</p>
          ${quotation.notes ? `<p><strong>Observaciones:</strong> ${quotation.notes}</p>` : ''}

          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #748080;">Perfilgranos — Gestión Comercial de Granos</p>
        </div>
      `;

      await this.emailService.sendEmail(
        clientEmail,
        `Orden de Venta / Cotización ${quotation.quotationNumber || `#${quotation.id}`} — Perfilgranos`,
        html,
        companyCc,
      );
    } catch (error) {
      this.logger.error(`Error en Agente IA procesando quotation.sent: ${error.message}`);
    }
  }

  /**
   * Rule 4: Daily Cron at 08:00 AM -> Sends email reminders for tasks due today and agenda events scheduled for today.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyReminders() {
    this.logger.log('Agente IA (Cron): Ejecutando recordatorio diario de tareas y agenda de hoy...');
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Process Due Tasks for Today
      const allTasks = await this.tasksService.findAll();
      const tasksToday = allTasks.filter((t) => {
        if (!t.dueDate || t.status === 'Done') return false;
        const taskDateStr = new Date(t.dueDate).toISOString().split('T')[0];
        return taskDateStr === todayStr;
      });

      for (const task of tasksToday) {
        const recipientEmail = task.assignedTo?.email;
        const title = `⏰ Recordatorio de Tarea para HOY: ${task.title}`;
        const message = `Hoy vence la tarea "${task.title}" para el cliente ${task.client?.businessName || 'N/A'}.`;

        await this.notificationsService.create({
          title,
          message,
          type: 'warning',
          userId: task.assignedTo?.id,
        });

        if (recipientEmail) {
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 2px solid #FFBE00; border-radius: 8px;">
              <h2 style="color: #FFBE00; margin-top: 0;">Perfilgranos CRM — Recordatorio de Tarea para Hoy</h2>
              <p>Hola <strong>${task.assignedTo?.name || 'Ejecutivo'}</strong>,</p>
              <p>Te recordamos que hoy vence la siguiente tarea:</p>
              <div style="background-color: #fff9e6; padding: 15px; border-left: 5px solid #FFBE00; margin: 15px 0;">
                <p style="margin: 0; font-[#2D2D2D]; font-weight: bold; font-size: 16px;">${task.title}</p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #555;">${task.description || ''}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #777;"><strong>Cliente:</strong> ${task.client?.businessName || '—'}</p>
              </div>
              <p style="font-size: 12px; color: #748080;">Perfilgranos CRM — Sistema de Gestión Comercial de Granos</p>
            </div>
          `;
          await this.emailService.sendEmail(recipientEmail, title, html);
        }
      }

      // 2. Process Agenda Events for Today
      const allEvents = await this.eventsService.findAll();
      const eventsToday = allEvents.filter((e) => {
        if (!e.startTime) return false;
        const eventDateStr = new Date(e.startTime).toISOString().split('T')[0];
        return eventDateStr === todayStr;
      });

      for (const event of eventsToday) {
        const title = `📅 Recordatorio de Agenda para HOY: ${event.title}`;
        const timeStr = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.logger.log(`Recordatorio de evento enviado para: ${event.title} a las ${timeStr}`);
      }

      this.logger.log(`Agente IA (Cron): Recordatorios procesados. (${tasksToday.length} tareas, ${eventsToday.length} reuniones)`);
    } catch (error) {
      this.logger.error(`Error en Agente IA ejecutando cron handleDailyReminders: ${error.message}`);
    }
  }
}
