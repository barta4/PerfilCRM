import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Get()
  @RequireModule('campaigns')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequireModule('campaigns')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @RequireModule('campaigns')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  create(
    @Request() req: any,
    @Body()
    data: {
      subject: string;
      content: string;
      segments?: string[];
      statuses?: string[];
    },
  ) {
    const user = req.user;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.service.createCampaign(data, user, baseUrl);
  }

  @Post(':id/resend-unopened')
  @RequireModule('campaigns')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async resendUnopened(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { subject?: string },
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.service.resendToNonOpeners(+id, baseUrl, data.subject);
  }

  @Get('track/open/:logId')
  async trackOpen(@Param('logId') logId: string, @Res() res: any) {
    await this.service.trackOpen(logId);

    // Return a 1x1 transparent GIF
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(gif);
  }

  @Get('track/click/:logId')
  async trackClick(
    @Param('logId') logId: string,
    @Query('url') url: string,
    @Res() res: any,
  ) {
    await this.service.trackClick(logId);
    let finalUrl = 'http://localhost:3000';
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      finalUrl = url;
    }
    res.redirect(finalUrl);
  }

  @Delete(':id')
  @RequireModule('campaigns')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async remove(@Param('id') id: string) {
    await this.service.deleteCampaign(+id);
    return { success: true };
  }

  @Post(':id/retry')
  @RequireModule('campaigns')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async retry(@Param('id') id: string, @Request() req: any) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.service.retryCampaign(+id, baseUrl);
  }

  @Post('logs/:logId/retry')
  @RequireModule('campaigns')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async retrySingle(@Param('logId') logId: string, @Request() req: any) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.service.retrySingleLog(logId, baseUrl);
  }
}
