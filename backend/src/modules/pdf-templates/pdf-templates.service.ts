import { Injectable, OnModuleInit, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PdfTemplate } from './entities/pdf-template.entity';
import { PdfRendererService } from './pdf-renderer.service';
import { PdfTemplateLayoutConfig } from './interfaces/pdf-template.interface';
import { Quotation } from '../../quotations/quotation.entity';

@Injectable()
export class PdfTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(PdfTemplatesService.name);

  constructor(
    @InjectRepository(PdfTemplate)
    private readonly repo: Repository<PdfTemplate>,
    private readonly renderer: PdfRendererService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultTemplates();
  }

  async seedDefaultTemplates() {
    const count = await this.repo.count();
    if (count > 0) return;

    this.logger.log('Inicializando plantillas PDF predeterminadas para PerfilCRM...');

    const defaultTemplates: Partial<PdfTemplate>[] = [
      {
        name: 'Estándar Granos (Perfilgranos)',
        code: 'GRAINS_STANDARD',
        description: 'Plantilla institucional con paleta dorada y negra para acopio, compraventa y logística de granos.',
        category: 'grains',
        isDefault: true,
        isActive: true,
        layoutConfig: {
          documentTitle: 'COTIZACIÓN / ORDEN DE VENTA',
          theme: {
            primaryColor: '#FFBE00',
            secondaryColor: '#2D2D2D',
            headerBg: '#2D2D2D',
            headerTextColor: '#FFFFFF',
            tableHeaderBg: '#2D2D2D',
            tableHeaderTextColor: '#FFFFFF',
            accentColor: '#FFBE00',
          },
          company: {
            showLogo: true,
            businessName: 'PERFILGRANOS S.A.',
            subtitle: 'Acopio, Corretaje y Logística Comercial de Granos',
            taxId: 'RUT: 214589630014',
            phone: 'Tel: +598 99 226 940',
            email: 'contacto@perfilgranos.com',
            website: 'www.perfilgranos.com',
          },
          sections: {
            showClientBox: true,
            showDeliveryDate: true,
            showPaymentTerms: true,
            showDeliveriesTable: true,
            showCommercialNotes: true,
            showSignatures: true,
            signatureType: 'double',
            signature1Label: 'FIRMA AUTORIZADA PERFILGRANOS S.A.',
            signature2Label: 'FIRMA Y CONFORMIDAD PRODUCTOR',
            showFooter: true,
            footerText: 'Perfilgranos CRM — Documento emitido electrónicamente.',
          },
          columns: {
            showProductCode: false,
            showUnit: true,
            showDeliveredQuantity: true,
            showUnitPrice: true,
            showSubtotal: true,
          },
          commercialClauses: [
            'Grano puesto en silo acordado. Sujeto a análisis de humedad y tolerancia.',
            'Validez de la Oferta: 5 días hábiles desde la fecha de emisión.',
            'Pesaje y control de calidad efectuados en balanza oficial habilitada.',
          ],
          bankDetails: 'Banco Santander Uruguay | Cuenta Corriente USD: 120-4589632',
        },
      },
      {
        name: 'Contrato de Zafra con Despachos y Remitos',
        code: 'GRAINS_HARVEST_CONTRACT',
        description: 'Plantilla orientada a compromisos de zafra con auditoría de entregas parciales y control de saldo.',
        category: 'grains',
        isDefault: false,
        isActive: true,
        layoutConfig: {
          documentTitle: 'CONTRATO DE VENTA Y REGISTRO DE DESPACHO',
          theme: {
            primaryColor: '#D97706',
            secondaryColor: '#1F2937',
            headerBg: '#1F2937',
            headerTextColor: '#FFFFFF',
            tableHeaderBg: '#1F2937',
            tableHeaderTextColor: '#FFFFFF',
            accentColor: '#F59E0B',
          },
          company: {
            showLogo: true,
            businessName: 'PERFILGRANOS S.A. - DIVISIÓN ACOPIO',
            subtitle: 'Logística de Cosecha & Acopio de Granos',
            taxId: 'RUT: 214589630014',
            phone: 'Tel: +598 99 226 940',
            email: 'acopio@perfilgranos.com',
            website: 'www.perfilgranos.com',
          },
          sections: {
            showClientBox: true,
            showDeliveryDate: true,
            showPaymentTerms: true,
            showDeliveriesTable: true,
            showCommercialNotes: true,
            showSignatures: true,
            signatureType: 'double',
            signature1Label: 'RESPONSABLE DE PLANTA / ACOPIO',
            signature2Label: 'PRODUCTOR / TRANSPORTISTA',
            showFooter: true,
            footerText: 'Perfilgranos CRM — Registro oficial de entrega y liquidación de zafra.',
          },
          columns: {
            showProductCode: false,
            showUnit: true,
            showDeliveredQuantity: true,
            showUnitPrice: true,
            showSubtotal: true,
          },
          commercialClauses: [
            'Entrega sujeta a los estándares de recibo INASE y Cámara Mercantil.',
            'Tolerancia máxima de humedad de recibo: 14.0% con merma según tabla oficial.',
            'Las cantidades facturadas se ajustarán al cierre definitivo de entregas y remitos conformados.',
          ],
        },
      },
      {
        name: 'Comercial Corporativo / Exportación',
        code: 'CORPORATE_PROFORMA',
        description: 'Diseño sobrio y elegante en azul institucional para clientes corporativos, industrias y comercio exterior.',
        category: 'corporate',
        isDefault: false,
        isActive: true,
        layoutConfig: {
          documentTitle: 'COMMERCIAL PROFORMA / ORDEN EJECUTIVA',
          theme: {
            primaryColor: '#2563EB',
            secondaryColor: '#0F172A',
            headerBg: '#0F172A',
            headerTextColor: '#FFFFFF',
            tableHeaderBg: '#0F172A',
            tableHeaderTextColor: '#FFFFFF',
            accentColor: '#3B82F6',
          },
          company: {
            showLogo: true,
            businessName: 'PERFILGRANOS AGROINDUSTRIAL S.A.',
            subtitle: 'División Trading & Cuentas Corporativas',
            taxId: 'RUT: 214589630014',
            phone: 'Tel: +598 99 226 940',
            email: 'trading@perfilgranos.com',
            website: 'www.perfilgranos.com',
          },
          sections: {
            showClientBox: true,
            showDeliveryDate: true,
            showPaymentTerms: true,
            showDeliveriesTable: false,
            showCommercialNotes: true,
            showSignatures: true,
            signatureType: 'single',
            signature1Label: 'DIRECCIÓN COMERCIAL EJECUTIVA',
            signature2Label: 'CONFORMIDAD DEL CLIENTE',
            showFooter: true,
            footerText: 'Perfilgranos Trading — Documento confidencial para uso exclusivo del destinatario.',
          },
          columns: {
            showProductCode: true,
            showUnit: true,
            showDeliveredQuantity: false,
            showUnitPrice: true,
            showSubtotal: true,
          },
          commercialClauses: [
            'Precios cotizados en base a términos FOB / FAS según estipulación comercial.',
            'Pago mediante transferencia SWIFT o Carta de Crédito irrevocable confirmada.',
            'Validez de la propuesta comercial: 3 días hábiles sujeta a confirmación de mercado de futuros.',
          ],
          bankDetails: 'Banco Santander S.A. | Swift: BSANUYMM | Cuenta USD: 120-4589632',
        },
      },
      {
        name: 'Insumos y Semillas (Agroquímicos)',
        code: 'AGRO_INPUTS',
        description: 'Formato optimizado para cotización de agroquímicos, fertilizantes y semillas con detalle de unidades.',
        category: 'inputs',
        isDefault: false,
        isActive: true,
        layoutConfig: {
          documentTitle: 'PRESUPUESTO DE INSUMOS Y SERVICIOS',
          theme: {
            primaryColor: '#059669',
            secondaryColor: '#064E3B',
            headerBg: '#064E3B',
            headerTextColor: '#FFFFFF',
            tableHeaderBg: '#064E3B',
            tableHeaderTextColor: '#FFFFFF',
            accentColor: '#10B981',
          },
          company: {
            showLogo: true,
            businessName: 'PERFILGRANOS INSUMOS AGROPECUARIOS',
            subtitle: 'Fertilizantes, Semillas Seleccionadas y Protección de Cultivos',
            taxId: 'RUT: 214589630014',
            phone: 'Tel: +598 99 226 940',
            email: 'insumos@perfilgranos.com',
            website: 'www.perfilgranos.com',
          },
          sections: {
            showClientBox: true,
            showDeliveryDate: true,
            showPaymentTerms: true,
            showDeliveriesTable: false,
            showCommercialNotes: true,
            showSignatures: true,
            signatureType: 'double',
            signature1Label: 'ASESOR TÉCNICO COMERCIAL',
            signature2Label: 'ACEPTACIÓN DEL PRODUCTOR',
            showFooter: true,
            footerText: 'Perfilgranos Insumos — Calidad certificada y soporte agronómico en campo.',
          },
          columns: {
            showProductCode: true,
            showUnit: true,
            showDeliveredQuantity: false,
            showUnitPrice: true,
            showSubtotal: true,
          },
          commercialClauses: [
            'Mercadería entregada en bolsas / bidones originales de fábrica con certificado de origen.',
            'Condición de pago según plan zafra o financiación acordada.',
            'Precios sujetos a disponibilidad de stock y tipo de cambio oficial.',
          ],
        },
      },
    ];

    for (const tpl of defaultTemplates) {
      const created = this.repo.create(tpl);
      await this.repo.save(created);
    }
    this.logger.log('4 Plantillas PDF predeterminadas creadas exitosamente.');
  }

  async findAll(): Promise<PdfTemplate[]> {
    return this.repo.find({
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PdfTemplate> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Plantilla PDF #${id} no encontrada`);
    }
    return template;
  }

  async create(data: Partial<PdfTemplate>): Promise<PdfTemplate> {
    if (data.isDefault) {
      await this.repo.update({}, { isDefault: false });
    }
    const template = this.repo.create(data);
    return this.repo.save(template);
  }

  async update(id: number, data: Partial<PdfTemplate>): Promise<PdfTemplate> {
    const existing = await this.findOne(id);
    if (data.isDefault) {
      await this.repo.update({}, { isDefault: false });
    }
    Object.assign(existing, data);
    return this.repo.save(existing);
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const existing = await this.findOne(id);
    if (existing.isDefault) {
      throw new Error('No se puede eliminar la plantilla predeterminada del sistema.');
    }
    await this.repo.delete(id);
    return { success: true, message: `Plantilla #${id} eliminada correctamente` };
  }

  async setDefault(id: number): Promise<PdfTemplate> {
    await this.repo.update({}, { isDefault: false });
    await this.repo.update(id, { isDefault: true });
    return this.findOne(id);
  }

  /**
   * Resuelve en cascada la plantilla efectiva:
   * 1. templateId explícito (en cotización o query param)
   * 2. clientTemplateId (asociado al cliente)
   * 3. Plantilla marcada como default
   * 4. Primera plantilla activa en la base de datos
   */
  async getEffectiveTemplate(templateId?: number, clientTemplateId?: number): Promise<PdfTemplate> {
    if (templateId) {
      const explicit = await this.repo.findOne({ where: { id: Number(templateId) } });
      if (explicit) return explicit;
    }

    if (clientTemplateId) {
      const clientTpl = await this.repo.findOne({ where: { id: Number(clientTemplateId) } });
      if (clientTpl) return clientTpl;
    }

    const defaultTpl = await this.repo.findOne({ where: { isDefault: true } });
    if (defaultTpl) return defaultTpl;

    const first = await this.repo.findOne({ order: { id: 'ASC' } });
    if (first) return first;

    throw new NotFoundException('No se encontraron plantillas PDF en el sistema');
  }

  /**
   * Genera un PDF de prueba usando una cotización ficticia para previsualización en vivo
   */
  async generatePreview(templateId: number): Promise<Buffer> {
    const template = await this.findOne(templateId);

    const mockQuotation: any = {
      id: 999,
      quotationNumber: 'COT-PREVIEW-2026',
      createdAt: new Date(),
      status: 'Sent',
      totalAmount: 38450.0,
      paymentTerms: 'Crédito Zafra 30 días',
      estimatedDeliveryDate: new Date(Date.now() + 86400000 * 7),
      notes: 'Lote de soja puesto en Planta Silos Mercedes. Certificado fitosanitario incluido.',
      client: {
        businessName: 'Agropecuaria El Ombú S.R.L.',
        taxId: 'RUT 219876540012',
        address: 'Ruta 2 Km 285, Soriano, Uruguay',
        phone: '+598 99 876 543',
        companyEmail: 'administracion@elombu.com.uy',
      },
      items: [
        {
          productName: 'Soja Zafra 2026 (Grano)',
          unit: 'Toneladas',
          quantity: 85,
          deliveredQuantity: 42,
          unitPrice: 380.0,
          subtotal: 32300.0,
        },
        {
          productName: 'Flete & Acondicionamiento en Silo',
          unit: 'Servicio',
          quantity: 85,
          deliveredQuantity: 42,
          unitPrice: 20.0,
          subtotal: 1700.0,
        },
        {
          productName: 'Inoculante Premium Biológico',
          unit: 'Bidón 20L',
          quantity: 15,
          deliveredQuantity: 15,
          unitPrice: 296.67,
          subtotal: 4450.0,
        },
      ],
      deliveries: [
        {
          deliveryDate: new Date(Date.now() - 86400000 * 2),
          remitoNumber: 'REM-001284',
          productName: 'Soja Zafra 2026',
          truckPlate: 'STP-1284',
          driverName: 'Mario Benítez',
          quantityDelivered: 22,
        },
        {
          deliveryDate: new Date(Date.now() - 86400000 * 1),
          remitoNumber: 'REM-001290',
          productName: 'Soja Zafra 2026',
          truckPlate: 'STP-9021',
          driverName: 'Carlos Silveira',
          quantityDelivered: 20,
        },
      ],
    };

    return this.renderer.renderQuotation(mockQuotation, template.layoutConfig);
  }
}
