import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfTemplate } from './entities/pdf-template.entity';
import { PdfTemplatesService } from './pdf-templates.service';
import { PdfRendererService } from './pdf-renderer.service';
import { PdfTemplatesController } from './pdf-templates.controller';
import { ModuleRegistryModule } from '../../core/modules-registry/module-registry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PdfTemplate]),
    ModuleRegistryModule,
  ],
  controllers: [PdfTemplatesController],
  providers: [PdfTemplatesService, PdfRendererService],
  exports: [PdfTemplatesService, PdfRendererService],
})
export class PdfTemplatesModule {}
