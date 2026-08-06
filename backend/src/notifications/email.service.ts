import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private settings: SettingsService) {}

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    cc?: string | string[],
    customConfig?: any,
  ): Promise<boolean> {
    const config =
      customConfig || (await this.settings.getJson<any>('smtp_config'));

    if (!config || (!customConfig && !config.enabled)) {
      this.logger.warn('Email service is disabled or not configured');
      return false;
    }

    try {
      const sanitizeCredential = (val: string, fieldName: string): string => {
        if (!val) return '';
        let cleaned = val;
        cleaned = cleaned.replace(/[\u200b\u200c\u200d\ufeff\r\n]/g, '');
        cleaned = cleaned.replace(/\u00a0/g, ' ');
        return cleaned;
      };

      const smtpHost = sanitizeCredential(config.host, 'host').trim();
      const smtpPort = Number(config.port);
      const smtpUser = sanitizeCredential(config.user, 'user').trim();
      const smtpPass = sanitizeCredential(config.pass, 'password');

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: config.from?.trim() || smtpUser,
        to,
        cc: cc || undefined,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to} (CC: ${cc || 'none'}): ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }
}
