import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

@Controller('quotations')
@RequireModule('quotations')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(+id, req.user);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.service.create(data, req.user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.service.update(+id, data, req.user);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.updateStatus(+id, status);
  }

  @Put(':id/complete')
  complete(@Param('id') id: string, @Req() req: any) {
    return this.service.complete(+id, req.user);
  }

  @Post(':id/deliveries')
  createDelivery(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.service.createDelivery(+id, data, req.user);
  }

  @Get(':id/deliveries')
  getDeliveries(@Param('id') id: string) {
    return this.service.getDeliveries(+id);
  }

  @Delete('deliveries/:deliveryId')
  deleteDelivery(@Param('deliveryId') deliveryId: string) {
    return this.service.deleteDelivery(+deliveryId);
  }

  @Post(':id/send-email')
  async sendEmail(@Param('id') id: string) {
    await this.service.updateStatus(+id, 'Sent');
    return { success: true, message: 'Orden de venta / Cotización enviada por email' };
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Query('templateId') templateId: string, @Res() res: any) {
    const buffer = await this.service.generatePdf(+id, templateId ? +templateId : undefined);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Cotizacion_Perfilgranos_${id}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }
}
