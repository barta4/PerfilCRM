import { Injectable, Logger } from '@nestjs/common';
import { PdfTemplateLayoutConfig } from './interfaces/pdf-template.interface';
import { Quotation } from '../../quotations/quotation.entity';
import * as fs from 'fs';
import * as path from 'path';

// Import PDFKit
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfRendererService {
  private readonly logger = new Logger(PdfRendererService.name);

  async renderQuotation(quotation: Quotation, layoutConfig: PdfTemplateLayoutConfig): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: `${layoutConfig.documentTitle || 'Cotización'} - ${quotation.quotationNumber || quotation.id}`,
            Author: layoutConfig.company?.businessName || 'Perfilgranos S.A.',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const theme = layoutConfig.theme || {
          primaryColor: '#FFBE00',
          secondaryColor: '#2D2D2D',
          headerBg: '#2D2D2D',
          headerTextColor: '#FFFFFF',
          tableHeaderBg: '#2D2D2D',
          tableHeaderTextColor: '#FFFFFF',
          accentColor: '#FFBE00',
        };

        const company = layoutConfig.company || {
          showLogo: true,
          businessName: 'PERFILGRANOS S.A.',
          subtitle: 'Acopio, Corretaje y Logística Comercial de Granos',
          taxId: 'RUT: 214589630014',
          phone: 'Tel: +598 99 226 940',
          email: 'contacto@perfilgranos.com',
          website: 'www.perfilgranos.com',
        };

        const sections = layoutConfig.sections || {
          showClientBox: true,
          showDeliveryDate: true,
          showPaymentTerms: true,
          showDeliveriesTable: true,
          showCommercialNotes: true,
          showSignatures: true,
          signatureType: 'double',
          signature1Label: 'FIRMA AUTORIZADA',
          signature2Label: 'CONFORMIDAD CLIENTE / PRODUCTOR',
          showFooter: true,
          footerText: 'Perfilgranos CRM — Documento emitido electrónicamente.',
        };

        const columns = layoutConfig.columns || {
          showProductCode: false,
          showUnit: true,
          showDeliveredQuantity: true,
          showUnitPrice: true,
          showSubtotal: true,
        };

        // --- 1. HEADER & LOGO ---
        let currentY = 30;

        if (company.showLogo) {
          const logoPaths = [
            path.join(process.cwd(), 'perfilgranos.png'),
            path.join(process.cwd(), 'public', 'perfilgranos.png'),
            path.join(__dirname, '..', '..', '..', 'public', 'perfilgranos.png'),
            path.join(__dirname, '..', '..', '..', '..', 'perfilgranos.png'),
            path.join(__dirname, '..', '..', '..', '..', '..', 'perfilgranos.png'),
          ];
          const logoPath = logoPaths.find(p => fs.existsSync(p));

          if (logoPath) {
            try {
              doc.image(logoPath, 40, 25, { width: 150 });
            } catch (err) {
              this.logger.warn('Could not load logo image: ' + err.message);
            }
          }
        }

        // Company Details (Right-aligned)
        doc.fillColor(theme.secondaryColor || '#2D2D2D')
           .fontSize(15)
           .font('Helvetica-Bold')
           .text(company.businessName || 'PERFILGRANOS S.A.', 200, currentY, { align: 'right' });

        currentY += 18;
        doc.fontSize(8.5).font('Helvetica').fillColor('#4B5563');

        if (company.subtitle) {
          doc.text(company.subtitle, 200, currentY, { align: 'right' });
          currentY += 12;
        }

        const contactLines: string[] = [];
        if (company.taxId) contactLines.push(company.taxId);
        if (company.phone) contactLines.push(company.phone);
        if (contactLines.length > 0) {
          doc.text(contactLines.join(' | '), 200, currentY, { align: 'right' });
          currentY += 12;
        }

        const webLines: string[] = [];
        if (company.email) webLines.push(company.email);
        if (company.website) webLines.push(company.website);
        if (webLines.length > 0) {
          doc.text(webLines.join(' | '), 200, currentY, { align: 'right' });
          currentY += 12;
        }

        currentY = Math.max(currentY + 6, 95);

        // Accent Separator Line
        doc.moveTo(40, currentY)
           .lineTo(555, currentY)
           .strokeColor(theme.primaryColor || '#FFBE00')
           .lineWidth(2.5)
           .stroke();

        currentY += 12;

        // --- 2. DOCUMENT TITLE & METADATA ---
        const docTitle = layoutConfig.documentTitle || 'COTIZACIÓN / ORDEN DE VENTA';
        const quoteNum = quotation.quotationNumber || `COT-${quotation.id}`;

        doc.fillColor(theme.secondaryColor || '#2D2D2D')
           .fontSize(12.5)
           .font('Helvetica-Bold')
           .text(`${docTitle} Nº ${quoteNum}`, 40, currentY);

        const quoteDate = quotation.createdAt
          ? new Date(quotation.createdAt).toLocaleDateString('es-UY')
          : new Date().toLocaleDateString('es-UY');

        const statusMap: Record<string, string> = {
          Draft: 'Borrador',
          Sent: 'Enviada / Confirmada',
          Approved: 'Aprobada',
          Rejected: 'Rechazada',
          Completed: 'Completada / Cerrada',
        };
        const statusLabel = statusMap[quotation.status] || quotation.status || 'Borrador';

        doc.fontSize(8.5)
           .font('Helvetica')
           .fillColor('#6B7280')
           .text(`Fecha de Emisión: ${quoteDate}`, 40, currentY + 16)
           .text(`Estado: ${statusLabel}`, 300, currentY + 16, { align: 'right' });

        currentY += 34;

        // --- 3. CLIENT DETAILS BOX ---
        if (sections.showClientBox && quotation.client) {
          const boxHeight = 58;
          doc.rect(40, currentY, 515, boxHeight)
             .fillColor('#F9FAFB')
             .fillAndStroke('#E5E7EB');

          doc.fillColor(theme.secondaryColor || '#2D2D2D')
             .fontSize(9.5)
             .font('Helvetica-Bold')
             .text('DATOS DEL CLIENTE / PRODUCTOR', 50, currentY + 8);

          doc.fontSize(8.5).font('Helvetica').fillColor('#374151');
          doc.text(`Razón Social: ${quotation.client.businessName || 'Cliente General'}`, 50, currentY + 23);
          doc.text(`RUT / CI: ${quotation.client.taxId || 'N/D'}`, 300, currentY + 23);
          doc.text(`Dirección / Campo: ${quotation.client.address || 'N/D'}`, 50, currentY + 38);
          doc.text(`Teléfono / Email: ${quotation.client.phone || quotation.client.companyEmail || 'N/D'}`, 300, currentY + 38);

          currentY += boxHeight + 14;
        }

        // --- 4. ITEMS TABLE ---
        const tableHeaderY = currentY;
        doc.rect(40, tableHeaderY, 515, 20)
           .fillColor(theme.tableHeaderBg || '#2D2D2D')
           .fill();

        doc.fillColor(theme.tableHeaderTextColor || '#FFFFFF')
           .fontSize(8.5)
           .font('Helvetica-Bold');

        // Column coordinates
        doc.text('ÍTEM / PRODUCTO', 50, tableHeaderY + 5);
        if (columns.showUnit) {
          doc.text('UNIDAD', 230, tableHeaderY + 5, { width: 50, align: 'center' });
        }
        doc.text('CANTIDAD', 285, tableHeaderY + 5, { width: 65, align: 'right' });
        if (columns.showUnitPrice) {
          doc.text('PRECIO REF. USD', 360, tableHeaderY + 5, { width: 85, align: 'right' });
        }
        if (columns.showSubtotal) {
          doc.text('SUBTOTAL (USD)', 455, tableHeaderY + 5, { width: 90, align: 'right' });
        }

        currentY = tableHeaderY + 20;

        const items = quotation.items && quotation.items.length > 0 ? quotation.items : [
          { productName: 'Granos / Servicios', quantity: 1, unitPrice: Number(quotation.totalAmount || 0), subtotal: Number(quotation.totalAmount || 0), unit: 'Toneladas' }
        ];

        items.forEach((item: any, index: number) => {
          const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
          doc.rect(40, currentY, 515, 20).fillColor(rowBg).fillAndStroke('#F3F4F6');

          const qty = Number(item.quantity || 0);
          const price = Number(item.unitPrice || 0);
          const sub = Number(item.subtotal || qty * price);

          doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica');
          doc.text(`${item.productName || 'Producto'}`, 50, currentY + 5);

          if (columns.showUnit) {
            doc.text(`${item.unit || 'Ton'}`, 230, currentY + 5, { width: 50, align: 'center' });
          }
          doc.text(qty.toLocaleString('es-UY'), 285, currentY + 5, { width: 65, align: 'right' });

          if (columns.showUnitPrice) {
            doc.text(`$${price.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`, 360, currentY + 5, { width: 85, align: 'right' });
          }
          if (columns.showSubtotal) {
            doc.text(`$${sub.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`, 455, currentY + 5, { width: 90, align: 'right' });
          }

          currentY += 20;
        });

        // --- 5. TOTALS BOX ---
        currentY += 8;
        doc.rect(340, currentY, 215, 28)
           .fillColor(theme.accentColor || theme.primaryColor || '#FFBE00')
           .fill();

        doc.fillColor(theme.secondaryColor || '#2D2D2D')
           .fontSize(10)
           .font('Helvetica-Bold');
        doc.text('TOTAL GENERAL (USD):', 350, currentY + 8);
        doc.text(`$${Number(quotation.totalAmount || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`, 440, currentY + 8, { width: 105, align: 'right' });

        currentY += 36;

        // --- 6. DELIVERIES / REMITOS TABLE (If enabled & available) ---
        if (sections.showDeliveriesTable && quotation.deliveries && quotation.deliveries.length > 0) {
          doc.fillColor(theme.secondaryColor || '#2D2D2D')
             .fontSize(9.5)
             .font('Helvetica-Bold')
             .text('REGISTRO DE DESPACHOS Y ENTREGAS POR REMITO', 40, currentY);

          currentY += 14;

          doc.rect(40, currentY, 515, 18).fillColor('#4B5563').fill();
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
          doc.text('FECHA', 48, currentY + 4);
          doc.text('REMITO Nº', 120, currentY + 4);
          doc.text('PRODUCTO', 200, currentY + 4);
          doc.text('CHOFER / MATRÍCULA', 320, currentY + 4);
          doc.text('CANTIDAD ENTREGADA', 430, currentY + 4, { width: 115, align: 'right' });

          currentY += 18;

          quotation.deliveries.forEach((d: any, idx: number) => {
            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
            doc.rect(40, currentY, 515, 18).fillColor(bg).fillAndStroke('#E5E7EB');

            const delDate = d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString('es-UY') : 'N/D';
            const driverInfo = [d.driverName, d.truckPlate].filter(Boolean).join(' - ') || 'N/D';

            doc.fillColor('#374151').fontSize(8).font('Helvetica');
            doc.text(delDate, 48, currentY + 4);
            doc.text(d.remitoNumber || 'S/N', 120, currentY + 4);
            doc.text(d.productName || 'Granos', 200, currentY + 4);
            doc.text(driverInfo, 320, currentY + 4);
            doc.text(`${Number(d.quantityDelivered || 0).toLocaleString('es-UY')} Ton`, 430, currentY + 4, { width: 115, align: 'right' });

            currentY += 18;
          });

          currentY += 14;
        }

        // --- 7. COMMERCIAL CONDITIONS & LEGAL CLAUSES ---
        if (sections.showCommercialNotes) {
          doc.fillColor(theme.secondaryColor || '#2D2D2D')
             .fontSize(9.5)
             .font('Helvetica-Bold')
             .text('CONDICIONES COMERCIALES Y NOTAS', 40, currentY);

          currentY += 14;
          doc.fontSize(8).font('Helvetica').fillColor('#4B5563');

          if (sections.showPaymentTerms) {
            doc.text(`• Condición de Pago: ${quotation.paymentTerms || 'Contado / Según acuerdo comercial'}`, 40, currentY);
            currentY += 12;
          }

          if (sections.showDeliveryDate) {
            const estDate = quotation.estimatedDeliveryDate
              ? new Date(quotation.estimatedDeliveryDate).toLocaleDateString('es-UY')
              : 'A coordinar con logística';
            doc.text(`• Fecha Estimada de Entrega: ${estDate}`, 40, currentY);
            currentY += 12;
          }

          if (quotation.notes) {
            doc.text(`• Observaciones particulares: ${quotation.notes}`, 40, currentY);
            currentY += 12;
          }

          if (layoutConfig.commercialClauses && layoutConfig.commercialClauses.length > 0) {
            layoutConfig.commercialClauses.forEach((clause) => {
              doc.text(`• ${clause}`, 40, currentY);
              currentY += 12;
            });
          }

          if (layoutConfig.bankDetails) {
            doc.text(`• Datos Bancarios: ${layoutConfig.bankDetails}`, 40, currentY);
            currentY += 12;
          }
        }

        // --- 8. SIGNATURES ---
        if (sections.showSignatures) {
          currentY = Math.max(currentY + 20, 680);

          if (sections.signatureType === 'double') {
            doc.moveTo(60, currentY).lineTo(220, currentY).strokeColor('#9CA3AF').lineWidth(1).stroke();
            doc.moveTo(335, currentY).lineTo(495, currentY).strokeColor('#9CA3AF').lineWidth(1).stroke();

            currentY += 5;
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#374151');
            doc.text(sections.signature1Label || 'FIRMA AUTORIZADA', 60, currentY, { width: 160, align: 'center' });
            doc.text(sections.signature2Label || 'CONFORMIDAD CLIENTE / PRODUCTOR', 335, currentY, { width: 160, align: 'center' });
          } else {
            doc.moveTo(195, currentY).lineTo(360, currentY).strokeColor('#9CA3AF').lineWidth(1).stroke();

            currentY += 5;
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#374151');
            doc.text(sections.signature1Label || 'FIRMA AUTORIZADA', 195, currentY, { width: 165, align: 'center' });
          }
        }

        // --- 9. FOOTER ---
        if (sections.showFooter) {
          doc.fontSize(7.5).font('Helvetica').fillColor('#9CA3AF');
          const footerMsg = sections.footerText || 'Perfilgranos CRM — Documento emitido electrónicamente.';
          doc.text(footerMsg, 40, 785, { align: 'center' });
        }

        doc.end();
      } catch (err) {
        this.logger.error('Error generating PDF:', err);
        reject(err);
      }
    });
  }
}
