import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/user.entity';
import { Event } from '../../events/event.entity';
import { Task } from '../../tasks/task.entity';
import { SettingsService } from '../../settings/settings.service';
import axios from 'axios';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly settingsService: SettingsService,
  ) {}

  async getConfig(): Promise<GoogleCalendarConfig> {
    const saved = await this.settingsService.getJson<GoogleCalendarConfig>('google_calendar_config');
    return {
      clientId: saved?.clientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: saved?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: saved?.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/events?gcal=callback',
    };
  }

  async getAuthUrl(userId: number): Promise<{ url: string }> {
    const config = await this.getConfig();
    if (!config.clientId) {
      // Retornar demo auth URL si aún no se han configurado credenciales en Admin
      this.logger.warn('Google Client ID no configurado en Settings ni .env');
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      state: JSON.stringify({ userId }),
    };

    const qs = new URLSearchParams(options);
    return { url: `${rootUrl}?${qs.toString()}` };
  }

  async handleCallback(code: string, userId: number): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresDate = new Date(Date.now() + (expires_in || 3600) * 1000);

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new Error('Usuario no encontrado');

      user.googleAccessToken = access_token;
      if (refresh_token) {
        user.googleRefreshToken = refresh_token;
      }
      user.googleTokenExpires = expiresDate;
      user.googleCalendarSyncEnabled = true;
      await this.userRepository.save(user);

      this.logger.log(`Google Calendar conectado exitosamente para el usuario ${user.email} (ID: ${userId})`);
      return { success: true, message: 'Google Calendar conectado correctamente' };
    } catch (error: any) {
      this.logger.error('Error al canjear código OAuth de Google Calendar', error.response?.data || error.message);
      throw new Error(error.response?.data?.error_description || 'Error al conectar con Google Calendar');
    }
  }

  async disconnect(userId: number): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.googleAccessToken = null;
      user.googleRefreshToken = null;
      user.googleTokenExpires = null;
      user.googleCalendarSyncEnabled = false;
      await this.userRepository.save(user);
    }
    return { success: true };
  }

  async getStatus(userId: number): Promise<{ isConnected: boolean; email?: string; syncEnabled: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.googleCalendarSyncEnabled || (!user.googleAccessToken && !user.googleRefreshToken)) {
      return { isConnected: false, syncEnabled: false };
    }
    return {
      isConnected: true,
      email: user.email,
      syncEnabled: user.googleCalendarSyncEnabled,
    };
  }

  private async getValidAccessToken(user: User): Promise<string | null> {
    if (!user.googleRefreshToken && !user.googleAccessToken) {
      return null;
    }

    // Verificar si el token sigue vigente (con margen de 2 minutos)
    const isExpired = user.googleTokenExpires && new Date(user.googleTokenExpires).getTime() - 120000 < Date.now();

    if (!isExpired && user.googleAccessToken) {
      return user.googleAccessToken;
    }

    if (!user.googleRefreshToken) {
      return user.googleAccessToken;
    }

    // Refrescar access token usando refresh token
    const config = await this.getConfig();
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      });

      const { access_token, expires_in } = response.data;
      user.googleAccessToken = access_token;
      user.googleTokenExpires = new Date(Date.now() + (expires_in || 3600) * 1000);
      await this.userRepository.save(user);
      return access_token;
    } catch (error: any) {
      this.logger.error(`Error al refrescar token de Google para usuario ${user.id}:`, error.response?.data || error.message);
      return null;
    }
  }

  // --- SINCRONIZACIÓN DE EVENTOS DE AGENDA ---

  async syncEventToGoogle(event: Event, userId?: number): Promise<void> {
    const targetUserId = userId || event.creator?.id;
    if (!targetUserId) return;

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user || !user.googleCalendarSyncEnabled) return;

    const token = await this.getValidAccessToken(user);
    if (!token) return;

    const clientName = event.client?.businessName || 'Cliente';
    const isVirtual = event.type === 'Virtual';

    const eventPayload: any = {
      summary: `[PerfilCRM] ${event.title} - ${clientName}`,
      description: `Tipo de evento: ${event.type}\nCliente: ${clientName}\nOrganizado desde PerfilCRM`,
      start: {
        dateTime: new Date(event.startTime).toISOString(),
      },
      end: {
        dateTime: new Date(event.endTime).toISOString(),
      },
    };

    if (isVirtual && !event.meetingLink) {
      eventPayload.conferenceData = {
        createRequest: {
          requestId: `meet-${event.id}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    try {
      if (event.googleEventId) {
        // Actualizar evento existente
        const res = await axios.patch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleEventId}`,
          eventPayload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.data.htmlLink) {
          event.googleHtmlLink = res.data.htmlLink;
          await this.eventRepository.save(event);
        }
      } else {
        // Crear nuevo evento
        const res = await axios.post(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
          eventPayload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        event.googleEventId = res.data.id;
        event.googleHtmlLink = res.data.htmlLink;

        // Extraer enlace de Google Meet si fue generado
        const meetUri = res.data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
        if (meetUri && !event.meetingLink) {
          event.meetingLink = meetUri;
        }

        await this.eventRepository.save(event);
      }
      this.logger.log(`Evento #${event.id} sincronizado con Google Calendar.`);
    } catch (error: any) {
      this.logger.error(`Error al sincronizar evento #${event.id} con Google Calendar`, error.response?.data || error.message);
    }
  }

  async deleteEventFromGoogle(googleEventId: string, userId?: number): Promise<void> {
    if (!googleEventId || !userId) return;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.googleCalendarSyncEnabled) return;

    const token = await this.getValidAccessToken(user);
    if (!token) return;

    try {
      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      this.logger.log(`Evento de Google ${googleEventId} eliminado exitosamente.`);
    } catch (error: any) {
      this.logger.error(`Error al eliminar evento ${googleEventId} de Google Calendar`, error.response?.data || error.message);
    }
  }

  // --- SINCRONIZACIÓN DE TAREAS ---

  async syncTaskToGoogle(task: Task, userId?: number): Promise<void> {
    const targetUserId = userId || task.assignedTo?.id;
    if (!targetUserId || !task.dueDate) return;

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user || !user.googleCalendarSyncEnabled) return;

    const token = await this.getValidAccessToken(user);
    if (!token) return;

    const clientName = task.client?.businessName ? ` (${task.client.businessName})` : '';
    const dueDate = new Date(task.dueDate);
    const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000); // 1 hora de bloque

    const taskPayload = {
      summary: `[Tarea PerfilCRM] ${task.title}${clientName}`,
      description: `Prioridad: ${task.priority}\nEstado: ${task.status}\n${task.description || ''}`,
      start: { dateTime: dueDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
    };

    try {
      if (task.googleEventId) {
        await axios.patch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.googleEventId}`,
          taskPayload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        const res = await axios.post(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          taskPayload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        task.googleEventId = res.data.id;
        await this.taskRepository.save(task);
      }
      this.logger.log(`Tarea #${task.id} sincronizada con Google Calendar.`);
    } catch (error: any) {
      this.logger.error(`Error al sincronizar tarea #${task.id} con Google Calendar`, error.response?.data || error.message);
    }
  }

  async deleteTaskFromGoogle(googleEventId: string, userId?: number): Promise<void> {
    return this.deleteEventFromGoogle(googleEventId, userId);
  }
}
