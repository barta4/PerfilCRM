import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

@Controller('clients')
@RequireModule('clients')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll(status, type);
  }

  @Get('export/excel')
  async exportExcel(@Res() res: any) {
    const buffer = await this.service.exportToExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="clientes_perfilgranos.xlsx"',
    );
    return res.send(buffer);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file provided');
    const result = await this.service.importFromExcel(file.buffer);
    return {
      message: `Importación completada con éxito. Creados: ${result.created}, Actualizados: ${result.updated}`,
      ...result,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<Client>) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Client>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
