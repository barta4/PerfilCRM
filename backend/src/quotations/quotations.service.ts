import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationItem } from './quotation-item.entity';
import { User, UserRole } from '../auth/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private readonly repo: Repository<Quotation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(user?: User) {
    // RBAC Rule: If user is sales executive, only show their own quotations/orders.
    if (user && user.role === UserRole.SALES) {
      return this.repo.find({
        where: { createdBy: { id: user.id } },
        order: { createdAt: 'DESC' },
      });
    }
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number, user?: User): Promise<Quotation | null> {
    const q = await this.repo.findOne({
      where: { id: Number(id) },
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
        qItem.unitPrice = price;
        qItem.subtotal = subtotal;
        return qItem;
      });
    }

    const quotationNumber = data.quotationNumber || `COT-${Date.now().toString().slice(-6)}`;

    const quotation = this.repo.create({
      quotationNumber,
      client: data.clientId ? ({ id: data.clientId } as any) : data.client,
      createdBy: user ? ({ id: user.id } as any) : undefined,
      paymentTerms: data.paymentTerms || 'Contado',
      notes: data.notes,
      totalAmount,
      items: quotationItems,
      status: data.status || 'Draft',
    });

    const saved = await this.repo.save(quotation);
    return saved;
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

  async generatePdf(id: number): Promise<Buffer> {
    const q = await this.repo.findOne({
      where: { id: Number(id) },
      relations: ['client', 'items'],
    });
    if (!q) throw new NotFoundException(`Cotización #${id} no encontrada`);

    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header Logo (check root perfilgranos.png or public/perfilgranos.png)
      const logoPaths = [
        path.join(process.cwd(), 'perfilgranos.png'),
        path.join(process.cwd(), 'public', 'perfilgranos.png'),
        path.join(__dirname, '..', '..', 'public', 'perfilgranos.png'),
        path.join(__dirname, '..', '..', '..', 'perfilgranos.png'),
        path.join(__dirname, '..', '..', '..', '..', 'perfilgranos.png'),
      ];
      const logoPath = logoPaths.find(p => fs.existsSync(p));

      if (logoPath) {
        try {
          doc.image(logoPath, 40, 25, { width: 160 });
        } catch (err) {
          console.error('Error embedding logo:', err);
        }
      }

      // Company Header Info
      doc.fillColor('#2D2D2D')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('PERFILGRANOS S.A.', 220, 30, { align: 'right' });
      doc.fontSize(9)
         .font('Helvetica')
         .text('Acopio, Corretaje y Logística Comercial de Granos', 220, 50, { align: 'right' })
         .text('RUT: 214589630014 | Tel: +598 99 226 940', 220, 63, { align: 'right' })
         .text('contacto@perfilgranos.com | www.perfilgranos.com', 220, 76, { align: 'right' });

      doc.moveTo(40, 105).lineTo(555, 105).strokeColor('#FFBE00').lineWidth(2).stroke();

      // Document Title & Metadata
      doc.fillColor('#2D2D2D')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text(`COTIZACIÓN / ORDEN DE VENTA Nº ${q.quotationNumber || `COT-${q.id}`}`, 40, 120);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#555555')
         .text(`Fecha de Emisión: ${new Date(q.createdAt || Date.now()).toLocaleDateString('es-UY')}`, 40, 138)
         .text(`Estado: ${q.status === 'Sent' || q.status === 'ENVIADA' ? 'Enviada / Confirmada' : q.status}`, 300, 138, { align: 'right' });

      // Client Box
      doc.rect(40, 155, 515, 65).fillColor('#F9FAFB').fillAndStroke('#E5E7EB');
      doc.fillColor('#2D2D2D').fontSize(10).font('Helvetica-Bold').text('DATOS DEL CLIENTE / PRODUCTOR', 50, 165);
      doc.fontSize(9).font('Helvetica').fillColor('#374151');
      doc.text(`Razón Social: ${q.client?.businessName || 'Cliente General'}`, 50, 182);
      doc.text(`RUT / CI: ${q.client?.taxId || 'N/D'}`, 300, 182);
      doc.text(`Dirección / Campo: ${q.client?.address || 'N/D'}`, 50, 197);
      doc.text(`Teléfono: ${q.client?.phone || 'N/D'}`, 300, 197);

      // Items Table Header
      let y = 235;
      doc.rect(40, y, 515, 20).fillColor('#2D2D2D').fill();
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      doc.text('ÍTEM / PRODUCTO', 50, y + 5);
      doc.text('CANTIDAD', 260, y + 5, { width: 70, align: 'right' });
      doc.text('PRECIO REF. USD', 340, y + 5, { width: 90, align: 'right' });
      doc.text('SUBTOTAL (USD)', 440, y + 5, { width: 100, align: 'right' });

      y += 20;

      // Items List
      const items = q.items && q.items.length > 0 ? q.items : [
        { productName: 'Soja Zafra (Grano)', quantity: 1, unitPrice: Number(q.totalAmount || 0), subtotal: Number(q.totalAmount || 0), unit: 'Toneladas' }
      ];

      items.forEach((item: any, index: number) => {
        const bg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
        doc.rect(40, y, 515, 22).fillColor(bg).fillAndStroke('#F3F4F6');

        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const sub = Number(item.subtotal || qty * price);

        doc.fillColor('#1F2937').fontSize(9).font('Helvetica');
        doc.text(`${item.productName || item.description || 'Producto'} (${item.unit || 'Ton'})`, 50, y + 6);
        doc.text(qty.toLocaleString('es-UY'), 260, y + 6, { width: 70, align: 'right' });
        doc.text(`$${price.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`, 340, y + 6, { width: 90, align: 'right' });
        doc.text(`$${sub.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`, 440, y + 6, { width: 100, align: 'right' });

        y += 22;
      });

      // Total Box
      y += 10;
      doc.rect(340, y, 215, 30).fillColor('#FFBE00').fill();
      doc.fillColor('#2D2D2D').fontSize(11).font('Helvetica-Bold');
      doc.text('TOTAL GENERAL (USD):', 350, y + 8);
      doc.text(`$${Number(q.totalAmount || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`, 440, y + 8, { width: 105, align: 'right' });

      y += 45;

      // Commercial Terms & Notes
      doc.fillColor('#2D2D2D').fontSize(10).font('Helvetica-Bold').text('CONDICIONES COMERCIALES Y NOTAS', 40, y);
      y += 15;
      doc.fontSize(8.5).font('Helvetica').fillColor('#4B5563');
      doc.text(`• Condición de Pago: ${q.paymentTerms || 'Contado / Según acuerdo'}`, 40, y);
      y += 14;
      doc.text(`• Observaciones: ${q.notes || 'Grano puesto en silo acordado. Sujeto a análisis de humedad y tolerancia.'}`, 40, y);
      y += 14;
      doc.text(`• Validez de la Oferta: 5 días hábiles desde la fecha de emisión.`, 40, y);

      // Signatures
      y += 50;
      doc.moveTo(60, y).lineTo(220, y).strokeColor('#9CA3AF').lineWidth(1).stroke();
      doc.moveTo(335, y).lineTo(495, y).strokeColor('#9CA3AF').lineWidth(1).stroke();

      y += 6;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
      doc.text('FIRMA AUTORIZADA PERFILGRANOS S.A.', 60, y, { width: 160, align: 'center' });
      doc.text('FIRMA Y CONFORMIDAD PRODUCTOR', 335, y, { width: 160, align: 'center' });

      // Footer
      doc.fontSize(7.5).font('Helvetica').fillColor('#9CA3AF');
      doc.text('Perfilgranos CRM — Documento emitido electrónicamente.', 40, 780, { align: 'center' });

      doc.end();
    });
  }
}
