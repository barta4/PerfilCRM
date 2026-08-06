import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Campaign } from './campaign.entity';
import { EmailLog } from './email-log.entity';
import { Contact } from '../contacts/contact.entity';
import { Client } from '../clients/client.entity';
import { EmailService } from '../notifications/email.service';
import { User } from '../auth/user.entity';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(EmailLog)
    private logRepo: Repository<EmailLog>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    private emailService: EmailService,
  ) {}

  async findAll(): Promise<any[]> {
    const campaigns = await this.campaignRepo.find({
      order: { createdAt: 'DESC' },
    });

    const campaignsWithStats = [];
    for (const c of campaigns) {
      const total = await this.logRepo.countBy({ campaign: { id: c.id } });
      const sent = await this.logRepo.countBy({
        campaign: { id: c.id },
        status: 'sent',
      });
      const failed = await this.logRepo.countBy({
        campaign: { id: c.id },
        status: 'failed',
      });

      const opened = await this.logRepo
        .createQueryBuilder('log')
        .where('log.campaign.id = :campaignId', { campaignId: c.id })
        .andWhere('log.openCount > 0')
        .getCount();

      const clicked = await this.logRepo
        .createQueryBuilder('log')
        .where('log.campaign.id = :campaignId', { campaignId: c.id })
        .andWhere('log.clickCount > 0')
        .getCount();

      campaignsWithStats.push({
        ...c,
        stats: {
          total,
          sent,
          failed,
          opened,
          clicked,
        },
      });
    }

    return campaignsWithStats;
  }

  async findOne(id: number): Promise<any> {
    const campaign = await this.campaignRepo.findOne({
      where: { id },
      relations: ['sentBy'],
    });

    if (!campaign) {
      return null;
    }

    const logs = await this.logRepo.find({
      where: { campaign: { id } },
      relations: ['client', 'contact'],
      order: { createdAt: 'ASC' },
    });

    const total = logs.length;
    const sent = logs.filter((l) => l.status === 'sent').length;
    const failed = logs.filter((l) => l.status === 'failed').length;
    const opened = logs.filter((l) => l.openCount > 0).length;
    const clicked = logs.filter((l) => l.clickCount > 0).length;

    return {
      ...campaign,
      logs,
      stats: {
        total,
        sent,
        failed,
        opened,
        clicked,
      },
    };
  }

  async createCampaign(
    data: {
      subject: string;
      content: string;
      segments?: string[];
      statuses?: string[];
    },
    user: User,
    baseUrl: string,
  ): Promise<Campaign> {
    const campaign = this.campaignRepo.create({
      subject: data.subject,
      content: data.content,
      sentBy: user,
    });

    const savedCampaign = await this.campaignRepo.save(campaign);

    // Fetch matching contacts
    const query = this.contactRepo
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.client', 'client')
      .where('contact.email IS NOT NULL')
      .andWhere('contact.email != :empty', { empty: '' });

    if (
      data.segments &&
      data.segments.length > 0 &&
      !data.segments.includes('all')
    ) {
      query.andWhere('client.segment IN (:...segments)', {
        segments: data.segments,
      });
    }

    if (
      data.statuses &&
      data.statuses.length > 0 &&
      !data.statuses.includes('all')
    ) {
      query.andWhere('client.status IN (:...statuses)', {
        statuses: data.statuses,
      });
    }

    const contacts = await query.getMany();

    // Create log records
    const logs: EmailLog[] = [];
    for (const contact of contacts) {
      const log = this.logRepo.create({
        campaign: savedCampaign,
        client: contact.client,
        contact: contact,
        recipientEmail: contact.email,
        status: 'pending',
      });
      logs.push(await this.logRepo.save(log));
    }

    // Fire and forget email dispatch in background
    this.sendCampaignEmailsBackground(savedCampaign, logs, baseUrl);

    return savedCampaign;
  }

  private resolveTrackingBaseUrl(requestBaseUrl: string): string {
    // 1. Check environment variable for explicit API URL
    if (process.env.PUBLIC_API_URL) {
      return process.env.PUBLIC_API_URL.replace(/\/$/, '');
    }

    // 2. Check CORS_ORIGINS to extract public domain
    if (process.env.CORS_ORIGINS) {
      const firstOrigin = process.env.CORS_ORIGINS.split(',')[0].trim();
      if (firstOrigin.startsWith('http')) {
        return `${firstOrigin.replace(/\/$/, '')}/api`;
      }
    }

    // 3. Fallback: if the request host is a public domain (e.g. not localhost/docker name), append /api
    let baseUrl = requestBaseUrl;
    if (
      baseUrl &&
      !baseUrl.includes('localhost') &&
      !baseUrl.includes('127.0.0.1') &&
      !baseUrl.includes('puresa-backend') &&
      !baseUrl.includes('puresacrm-backend') &&
      !baseUrl.includes('db')
    ) {
      if (!baseUrl.endsWith('/api') && !baseUrl.includes('/api/')) {
        baseUrl = `${baseUrl.replace(/\/$/, '')}/api`;
      }
    }
    return baseUrl;
  }

  private async sendCampaignEmailsBackground(
    campaign: Campaign,
    logs: EmailLog[],
    requestBaseUrl: string,
  ) {
    const trackingBaseUrl = this.resolveTrackingBaseUrl(requestBaseUrl);
    this.logger.log(
      `Starting background dispatch for Campaign #${campaign.id} to ${logs.length} recipients. Tracking URL prefix: ${trackingBaseUrl}`,
    );

    for (const log of logs) {
      try {
        const client = log.client;
        const contact = log.contact;

        // Dynamic replacement
        let parsedContent = campaign.content;
        parsedContent = parsedContent
          .replace(/{contact_name}/g, contact.name || '')
          .replace(/{client_name}/g, client.businessName || '')
          .replace(/{client_code}/g, client.code || '');

        const parsedSubject = campaign.subject
          .replace(/{contact_name}/g, contact.name || '')
          .replace(/{client_name}/g, client.businessName || '')
          .replace(/{client_code}/g, client.code || '');

        // Rewrite external links for click tracking
        const hrefRegex = /href="([^"]+)"/g;
        parsedContent = parsedContent.replace(hrefRegex, (match, url) => {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return `href="${trackingBaseUrl}/campaigns/track/click/${log.id}?url=${encodeURIComponent(url)}"`;
          }
          return match;
        });

        // Inject 1x1 transparent open tracking pixel
        const pixelHtml = `<img src="${trackingBaseUrl}/campaigns/track/open/${log.id}" width="1" height="1" style="display:none;" />`;
        const finalBody = parsedContent + pixelHtml;

        // Send email
        await this.emailService.sendEmail(
          log.recipientEmail,
          parsedSubject,
          finalBody,
        );

        // Update log to sent
        log.status = 'sent';
        await this.logRepo.save(log);
      } catch (error) {
        this.logger.error(
          `Error sending campaign mail to log ${log.id} (${log.recipientEmail}): ${error.message}`,
        );
        log.status = 'failed';
        log.error = error.message || String(error);
        await this.logRepo.save(log);
      }
    }

    this.logger.log(
      `Completed background dispatch for Campaign #${campaign.id}`,
    );
  }

  async trackOpen(logId: string): Promise<void> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (log) {
      if (!log.openedAt) {
        log.openedAt = new Date();
      }
      log.openCount += 1;
      await this.logRepo.save(log);
      this.logger.log(
        `Email opened for recipient ${log.recipientEmail} (Log: ${log.id}, Count: ${log.openCount})`,
      );
    } else {
      this.logger.warn(
        `Open tracking requested for non-existent log UUID: ${logId}`,
      );
    }
  }

  async trackClick(logId: string): Promise<void> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (log) {
      if (!log.clickedAt) {
        log.clickedAt = new Date();
      }
      log.clickCount += 1;
      await this.logRepo.save(log);
      this.logger.log(
        `Link clicked for recipient ${log.recipientEmail} (Log: ${log.id}, Count: ${log.clickCount})`,
      );
    } else {
      this.logger.warn(
        `Click tracking requested for non-existent log UUID: ${logId}`,
      );
    }
  }

  async deleteCampaign(id: number): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }
    await this.campaignRepo.remove(campaign);
  }

  async retryCampaign(id: number, baseUrl: string): Promise<any> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }
    const failedLogs = await this.logRepo.find({
      where: {
        campaign: { id },
        status: In(['failed', 'pending']),
      },
      relations: ['client', 'contact'],
    });

    if (failedLogs.length === 0) {
      return {
        success: true,
        count: 0,
        message: 'No hay correos fallidos o pendientes para reintentar.',
      };
    }

    // Reset status to pending so it looks nice in UI while sending
    for (const log of failedLogs) {
      log.status = 'pending';
      log.error = null;
      await this.logRepo.save(log);
    }

    // Fire background sending
    this.sendCampaignEmailsBackground(campaign, failedLogs, baseUrl);

    return { success: true, count: failedLogs.length };
  }

  async retrySingleLog(logId: string, baseUrl: string): Promise<any> {
    const log = await this.logRepo.findOne({
      where: { id: logId },
      relations: ['campaign', 'client', 'contact'],
    });

    if (!log) {
      throw new Error('Registro de correo no encontrado');
    }

    log.status = 'pending';
    log.error = null;
    await this.logRepo.save(log);

    // Run in background (we wrap it in an array to match the function signature)
    this.sendCampaignEmailsBackground(log.campaign, [log], baseUrl);

    return { success: true };
  }

  async resendToNonOpeners(
    id: number,
    baseUrl: string,
    newSubject?: string,
  ): Promise<any> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }

    // Find all logs for this campaign that were sent but not opened
    const nonOpenersLogs = await this.logRepo.find({
      where: {
        campaign: { id },
        status: 'sent',
        openCount: 0,
      },
      relations: ['client', 'contact'],
    });

    if (nonOpenersLogs.length === 0) {
      return {
        success: true,
        count: 0,
        message: 'No hay contactos sin abrir.',
      };
    }

    // Create new logs for the resend to not pollute the original stats
    const newLogs: EmailLog[] = [];
    for (const log of nonOpenersLogs) {
      const newLog = this.logRepo.create({
        campaign: campaign,
        client: log.client,
        contact: log.contact,
        recipientEmail: log.recipientEmail,
        status: 'pending',
      });
      newLogs.push(await this.logRepo.save(newLog));
    }

    // Clone the campaign object in memory to change the subject for this run if needed
    const campaignForResend = {
      ...campaign,
      subject: newSubject || campaign.subject,
    };

    // Fire background sending
    this.sendCampaignEmailsBackground(campaignForResend, newLogs, baseUrl);

    return { success: true, count: newLogs.length };
  }
}
