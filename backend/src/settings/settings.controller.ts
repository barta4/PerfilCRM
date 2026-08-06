import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';
import { EmailService } from '../notifications/email.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly emailService: EmailService,
  ) { }

  @Get('public')
  async getPublicBranding() {
    const all = await this.service.getAll();
    const find = (key: string) => all.find((s: any) => s.key === key)?.value;
    return {
      company_name: find('company_name') || 'PerfilCRM',
      company_logo: find('company_logo') || '',
      theme_accent_color: find('theme_accent_color') || '#FFBE00',
      theme_navbar_bg: find('theme_navbar_bg') || '#2D2D2D',
    };
  }

  @Get()
  @RequireModule('admin')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  findAll() {
    return this.service.getAll();
  }

  @Post()
  @RequireModule('admin')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async update(@Body() data: { key: string; value: any; type?: any }) {
    const val =
      typeof data.value === 'object'
        ? JSON.stringify(data.value)
        : String(data.value);
    const type =
      typeof data.value === 'object' ? 'json' : data.type || 'string';
    return this.service.set(data.key, val, type);
  }

  @Post('batch')
  @RequireModule('admin')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async updateBatch(@Body() settings: { key: string; value: any }[]) {
    for (const s of settings) {
      const val =
        typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value);
      const type = typeof s.value === 'object' ? 'json' : 'string';
      await this.service.set(s.key, val, type);
    }
    return { success: true };
  }

  @Post('test-email')
  @RequireModule('admin')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async testEmail(@Body() data: { to: string; config?: any }) {
    try {
      await this.emailService.sendEmail(
        data.to,
        'Correo de Prueba - PERFIL CRM',
        `<h3>¡Configuración de correo exitosa!</h3>
         <p>Este es un correo de prueba enviado desde tu CRM para validar que la configuración SMTP funciona correctamente.</p>
         <p>Fecha y hora del envío: ${new Date().toLocaleString('es-UY')}</p>`,
        data.config,
      );
      return { success: true, message: 'Correo de prueba enviado con éxito.' };
    } catch (error) {
      return { success: false, message: error.message || String(error) };
    }
  }
}
