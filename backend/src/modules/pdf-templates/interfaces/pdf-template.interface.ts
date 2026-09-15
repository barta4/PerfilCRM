export interface PdfTemplateTheme {
  primaryColor: string; // e.g. '#FFBE00' or '#10B981'
  secondaryColor: string; // e.g. '#2D2D2D'
  headerBg: string; // e.g. '#2D2D2D' or '#FFFFFF'
  headerTextColor: string; // e.g. '#FFFFFF' or '#1F2937'
  tableHeaderBg: string; // e.g. '#2D2D2D'
  tableHeaderTextColor: string; // e.g. '#FFFFFF'
  accentColor: string; // e.g. '#FFBE00'
}

export interface PdfTemplateCompany {
  showLogo: boolean;
  logoUrl?: string;
  businessName: string;
  subtitle?: string;
  taxId?: string; // RUT de Uruguay
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface PdfTemplateSections {
  showClientBox: boolean;
  showDeliveryDate: boolean;
  showPaymentTerms: boolean;
  showDeliveriesTable: boolean;
  showCommercialNotes: boolean;
  showSignatures: boolean;
  signatureType: 'single' | 'double'; // 'single' = solo emisor, 'double' = emisor + cliente
  signature1Label: string;
  signature2Label: string;
  showFooter: boolean;
  footerText?: string;
}

export interface PdfTemplateColumns {
  showProductCode: boolean;
  showUnit: boolean;
  showDeliveredQuantity: boolean;
  showUnitPrice: boolean;
  showSubtotal: boolean;
}

export interface PdfTemplateLayoutConfig {
  documentTitle: string; // e.g. "COTIZACIÓN / ORDEN DE VENTA", "CONTRATO DE COMPRAVENTA DE GRANOS"
  theme: PdfTemplateTheme;
  company: PdfTemplateCompany;
  sections: PdfTemplateSections;
  columns: PdfTemplateColumns;
  commercialClauses: string[];
  bankDetails?: string;
}
