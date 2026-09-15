import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationItem } from './quotation-item.entity';
import { QuotationDelivery } from './quotation-delivery.entity';
import { User, UserRole } from '../auth/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PdfTemplatesService } from '../modules/pdf-templates/pdf-templates.service';
import { PdfRendererService } from '../modules/pdf-templates/pdf-renderer.service';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private readonly repo: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private readonly itemRepo: Repository<QuotationItem>,
    @InjectRepository(QuotationDelivery)
    private readonly deliveryRepo: Repository<QuotationDelivery>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly pdfTemplatesService: PdfTemplatesService,
    private readonly pdfRendererService: PdfRendererService,
  ) {}

  async findAll(user?: User) {
    // RBAC Rule: If user is sales executive, only show their own quotations/orders.
    if (user && user.role === UserRole.SALES) {
      return this.repo.find({
        where: { createdBy: { id: user.id } },
        order: { createdAt: 'DESC' },
        relations: ['client', 'client.preferredPdfTemplate', 'createdBy', 'items', 'deliveries', 'template'],
      });
    }
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['client', 'client.preferredPdfTemplate', 'createdBy', 'items', 'deliveries', 'template'],
    });
  }

  async findOne(id: number, user?: User): Promise<Quotation> {
    const q = await this.repo.findOne({
      where: { id: Number(id) },
      relations: ['client', 'client.preferredPdfTemplate', 'createdBy', 'items', 'deliveries', 'template'],
    });
    if (!q) throw new NotFoundException(`Cotización #${id} no encontrada`);
    
    // RBAC check
    if (user && user.role === UserRole.SALES && q.createdBy?.id !== user.id) {
      throw new NotFoundException(`Cotización #${id} no encontrada`);
    }
    return q;
  }

  async create(data: any, user?: User) {
    let totalAmount = 0;
    let quotationItems: QuotationItem[] = [];

    if (data.items && Array.isArray(data.items)) {
      quotationItems = data.items.map((item: any) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const subtotal = qty * price;
        totalAmount += subtotal;

        const qItem = new QuotationItem();
        qItem.productName = item.productName || 'Granos';
        qItem.unit = item.unit || 'Toneladas';
        qItem.quantity = qty;
        qItem.deliveredQuantity = Number(item.deliveredQuantity || 0);
        qItem.unitPrice = price;
        qItem.subtotal = subtotal;
        return qItem;
      });
    }

    const quotationNumber = data.quotationNumber || `COT-${Date.now().toString().slice(-6)}`;

    const quotation = this.repo.create({
      quotationNumber,
      client: data.clientId ? ({ id: Number(data.clientId) } as any) : data.client,
      template: data.templateId ? ({ id: Number(data.templateId) } as any) : undefined,
      createdBy: user ? ({ id: user.id } as any) : undefined,
      paymentTerms: data.paymentTerms || 'Contado',
      estimatedDeliveryDate: data.estimatedDeliveryDate || null,
      notes: data.notes,
      totalAmount,
      items: quotationItems,
      status: data.status || 'Draft',
      deliveryStatus: 'pending',
    });

    const saved = await this.repo.save(quotation);
    return this.findOne(saved.id, user);
  }

  async update(id: number, data: any, user?: User) {
    const existing = await this.findOne(id, user);
    if (!existing) throw new NotFoundException(`Cotización #${id} no encontrada`);

    if (existing.status === 'Completed' || existing.deliveryStatus === 'completed') {
      throw new BadRequestException('La cotización/orden está completada y cerrada para edición.');
    }

    await this.dataSource.transaction(async (manager) => {
      const quotation = await manager.findOne(Quotation, {
        where: { id: Number(id) },
        relations: ['items'],
      });
      if (!quotation) throw new NotFoundException(`Cotización #${id} no encontrada`);

      if (data.clientId) {
        quotation.client = { id: Number(data.clientId) } as any;
      }
      if (data.templateId !== undefined) {
        quotation.template = data.templateId ? ({ id: Number(data.templateId) } as any) : null;
      }
      if (data.paymentTerms !== undefined) quotation.paymentTerms = data.paymentTerms;
      if (data.estimatedDeliveryDate !== undefined) quotation.estimatedDeliveryDate = data.estimatedDeliveryDate;
      if (data.notes !== undefined) quotation.notes = data.notes;
      if (data.status !== undefined) quotation.status = data.status;

      if (data.items && Array.isArray(data.items)) {
        // Remove old items atomically inside transaction
        if (quotation.items && quotation.items.length > 0) {
          await manager.remove(QuotationItem, quotation.items);
        }

        let totalAmount = 0;
        let totalOrdered = 0;
        let totalDelivered = 0;

        const quotationItems = data.items.map((item: any) => {
          const qty = Number(item.quantity || 0);
          const price = Number(item.unitPrice || 0);
          const delivered = Number(item.deliveredQuantity || 0);
          const subtotal = qty * price;
          totalAmount += subtotal;
          totalOrdered += qty;
          totalDelivered += delivered;

          const qItem = new QuotationItem();
          qItem.productName = item.productName || 'Granos';
          qItem.unit = item.unit || 'Toneladas';
          qItem.quantity = qty;
          qItem.deliveredQuantity = delivered;
          qItem.unitPrice = price;
          qItem.subtotal = subtotal;
          qItem.quotation = quotation;
          return qItem;
        });

        quotation.items = quotationItems;
        quotation.totalAmount = totalAmount;

        if (totalDelivered <= 0) {
          quotation.deliveryStatus = 'pending';
        } else if (totalDelivered >= totalOrdered) {
          quotation.deliveryStatus = 'completed';
        } else {
          quotation.deliveryStatus = 'partial';
        }
      }

      await manager.save(Quotation, quotation);
    });

    return this.findOne(id, user);
  }

  async complete(id: number, user?: User): Promise<Quotation> {
    const existing = await this.findOne(id, user);
    if (!existing) throw new NotFoundException(`Cotización #${id} no encontrada`);

    await this.dataSource.transaction(async (manager) => {
      const quotation = await manager.findOne(Quotation, {
        where: { id: Number(id) },
        relations: ['items'],
      });
      if (!quotation) throw new NotFoundException(`Cotización #${id} no encontrada`);

      let totalAmount = 0;
      if (quotation.items && quotation.items.length > 0) {
        for (const item of quotation.items) {
          const delivered = Number(item.deliveredQuantity || 0);
          item.quantity = delivered;
          item.subtotal = delivered * Number(item.unitPrice || 0);
          totalAmount += item.subtotal;
          await manager.save(QuotationItem, item);
        }
      }

      quotation.totalAmount = totalAmount;
      quotation.deliveryStatus = 'completed';
      quotation.status = 'Completed';

      await manager.save(Quotation, quotation);
    });

    return this.findOne(id, user);
  }

  async createDelivery(quotationId: number, data: any, user?: User) {
    const existing = await this.findOne(quotationId, user);
    if (!existing) throw new NotFoundException(`Cotización #${quotationId} no encontrada`);

    if (existing.status === 'Completed' || existing.deliveryStatus === 'completed') {
      throw new BadRequestException('La cotización/orden ya se encuentra completada y no admite nuevos despachos.');
    }

    return this.dataSource.transaction(async (manager) => {
      const quotation = await manager.findOne(Quotation, {
        where: { id: Number(quotationId) },
        relations: ['items'],
      });
      if (!quotation) throw new NotFoundException(`Cotización #${quotationId} no encontrada`);

      let targetItem: QuotationItem | undefined;
      if (data.itemId) {
        targetItem = quotation.items.find(it => it.id === Number(data.itemId));
      }
      if (!targetItem && data.productName) {
        targetItem = quotation.items.find(it => it.productName === data.productName);
      }
      if (!targetItem && quotation.items && quotation.items.length > 0) {
        targetItem = quotation.items[0];
      }

      const qtyDelivered = Number(data.quantityDelivered || 0);

      const delivery = manager.create(QuotationDelivery, {
        quotation: { id: quotationId } as any,
        item: targetItem ? ({ id: targetItem.id } as any) : undefined,
        productName: targetItem ? targetItem.productName : (data.productName || 'Granos'),
        quantityDelivered: qtyDelivered,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : new Date(),
        remitoNumber: data.remitoNumber || '',
        truckPlate: data.truckPlate || '',
        driverName: data.driverName || '',
        notes: data.notes || '',
        deliveredBy: user ? ({ id: user.id } as any) : undefined,
      });

      const savedDelivery = await manager.save(QuotationDelivery, delivery);

      if (targetItem) {
        targetItem.deliveredQuantity = Number(targetItem.deliveredQuantity || 0) + qtyDelivered;
        await manager.save(QuotationItem, targetItem);
      }

      // Recalculate quotation delivery status atomically
      const items = await manager.find(QuotationItem, {
        where: { quotation: { id: quotationId } },
      });
      const totalOrdered = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
      const totalDelivered = items.reduce((s, it) => s + Number(it.deliveredQuantity || 0), 0);

      if (totalDelivered <= 0) {
        quotation.deliveryStatus = 'pending';
      } else if (totalDelivered >= totalOrdered) {
        quotation.deliveryStatus = 'completed';
      } else {
        quotation.deliveryStatus = 'partial';
      }
      await manager.save(Quotation, quotation);

      return savedDelivery;
    });
  }

  async getDeliveries(quotationId: number) {
    return this.deliveryRepo.find({
      where: { quotation: { id: Number(quotationId) } },
      relations: ['deliveredBy', 'item'],
      order: { deliveryDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async deleteDelivery(deliveryId: number) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: Number(deliveryId) },
      relations: ['quotation', 'item'],
    });
    if (!delivery) throw new NotFoundException(`Remito #${deliveryId} no encontrado`);

    if (delivery.item) {
      delivery.item.deliveredQuantity = Math.max(
        0,
        Number(delivery.item.deliveredQuantity || 0) - Number(delivery.quantityDelivered || 0),
      );
      await this.itemRepo.save(delivery.item);
    }

    const qId = delivery.quotation?.id;
    await this.deliveryRepo.remove(delivery);

    if (qId) {
      const updatedQ = await this.repo.findOne({
        where: { id: qId },
        relations: ['items'],
      });
      if (updatedQ) {
        const totalOrdered = (updatedQ.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);
        const totalDelivered = (updatedQ.items || []).reduce((s, it) => s + Number(it.deliveredQuantity || 0), 0);

        if (totalDelivered <= 0) {
          updatedQ.deliveryStatus = 'pending';
        } else if (totalDelivered >= totalOrdered) {
          updatedQ.deliveryStatus = 'completed';
        } else {
          updatedQ.deliveryStatus = 'partial';
        }
        await this.repo.save(updatedQ);
      }
    }

    return { success: true, message: 'Remito / Entrega eliminada y saldo restituido.' };
  }

  async updateStatus(id: number, status: string) {
    await this.repo.update(id, { status });
    const updated = await this.repo.findOneBy({ id });
    if (updated && status === 'Sent') {
      this.eventEmitter.emit('quotation.sent', updated);
    }
    return updated;
  }

  async delete(id: number) {
    return this.repo.delete(id);
  }

  async generatePdf(id: number, overrideTemplateId?: number): Promise<Buffer> {
    const q = await this.repo.findOne({
      where: { id: Number(id) },
      relations: ['client', 'client.preferredPdfTemplate', 'items', 'deliveries', 'template'],
    });
    if (!q) throw new NotFoundException(`Cotización #${id} no encontrada`);

    const templateIdToUse = overrideTemplateId || q.template?.id;
    const clientTemplateId = q.client?.preferredPdfTemplate?.id;

    const effectiveTemplate = await this.pdfTemplatesService.getEffectiveTemplate(
      templateIdToUse,
      clientTemplateId,
    );

    return this.pdfRendererService.renderQuotation(q, effectiveTemplate.layoutConfig);
  }
}

