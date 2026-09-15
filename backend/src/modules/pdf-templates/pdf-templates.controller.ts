import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { PdfTemplatesService } from './pdf-templates.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ModulesGuard } from '../../auth/modules.guard';
import { RequireModule } from '../../auth/require-module.decorator';

@Controller('pdf-templates')
@RequireModule('pdf_templates')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class PdfTemplatesController {
  constructor(private readonly service: PdfTemplatesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Put(':id/default')
  setDefault(@Param('id') id: string) {
    return this.service.setDefault(+id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }

  @Get(':id/preview')
  async getPreview(@Param('id') id: string, @Res() res: any) {
    const buffer = await this.service.generatePreview(+id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Plantilla_Preview_${id}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
