import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation } from './quotation.entity';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { QuotationItem } from './quotation-item.entity';
import { QuotationDelivery } from './quotation-delivery.entity';
import { PdfTemplatesModule } from '../modules/pdf-templates/pdf-templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quotation, QuotationItem, QuotationDelivery]),
    PdfTemplatesModule,
  ],
  providers: [QuotationsService],
  controllers: [QuotationsController],
  exports: [QuotationsService],
})
export class QuotationsModule {}
