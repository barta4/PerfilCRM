import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GoogleCalendarService, GoogleCalendarConfig } from './google-calendar.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ModuleGuard } from '../../core/modules-registry/guards/module.guard';
import { RequiresModule } from '../../core/modules-registry/decorators/requires-module.decorator';
import { SettingsService } from '../../settings/settings.service';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../auth/user.entity';

@Controller('google-calendar')
@RequiresModule('google_calendar')
@UseGuards(JwtAuthGuard, ModuleGuard)
export class GoogleCalendarController {
  constructor(
    private readonly service: GoogleCalendarService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.service.getStatus(req.user.userId || req.user.id);
  }

  @Get('auth-url')
  getAuthUrl(@Request() req: any) {
    return this.service.getAuthUrl(req.user.userId || req.user.id);
  }

  @Post('callback')
  handleCallback(@Request() req: any, @Body('code') code: string) {
    return this.service.handleCallback(code, req.user.userId || req.user.id);
  }

  @Post('disconnect')
  disconnect(@Request() req: any) {
    return this.service.disconnect(req.user.userId || req.user.id);
  }

  @Get('config')
  async getConfig() {
    return this.service.getConfig();
  }

  @Post('config')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async saveConfig(@Body() body: any) {
    await this.settingsService.set(
      'google_calendar_config',
      JSON.stringify(body),
      'json',
    );
    return { success: true, message: 'Configuración de Google Calendar guardada correctamente' };
  }
}
