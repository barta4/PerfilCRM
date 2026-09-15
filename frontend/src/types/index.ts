export interface PdfTemplateTheme {
  primaryColor: string;
  secondaryColor: string;
  headerBg: string;
  headerTextColor: string;
  tableHeaderBg: string;
  tableHeaderTextColor: string;
  accentColor: string;
}

export interface PdfTemplateCompany {
  showLogo: boolean;
  logoUrl?: string;
  businessName: string;
  subtitle?: string;
  taxId?: string;
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
  signatureType: 'single' | 'double';
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
  documentTitle: string;
  theme: PdfTemplateTheme;
  company: PdfTemplateCompany;
  sections: PdfTemplateSections;
  columns: PdfTemplateColumns;
  commercialClauses: string[];
  bankDetails?: string;
}

export interface PdfTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  category: string;
  isDefault: boolean;
  isActive: boolean;
  layoutConfig: PdfTemplateLayoutConfig;
  headerNotes?: string;
  footerNotes?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  code: string;
  businessName: string;
  taxId?: string;
  isClient?: boolean;
  isSupplier?: boolean;
  phone?: string;
  companyEmail?: string;
  address?: string;
  industry?: string;
  segment?: string;
  status: string;
  paymentTerms?: string;
  rating?: number;
  imageUrl?: string;
  preferredPdfTemplate?: PdfTemplate;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  client: Client;
  createdAt: string;
}

export interface Event {
  id: number;
  type: 'Presencial' | 'Virtual' | 'Llamada' | 'Feria';
  title: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  client: Client;
  createdAt: string;
}

export interface Visit {
  id: number;
  communicationType?: 'Llamada' | 'Reunión' | 'Email' | 'WhatsApp' | 'Otro';
  subject?: string;
  notes?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  client: Client;
  createdBy?: { id: number; name: string; email: string };
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Cancelled';
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  dueDate?: string;
  client: Client;
  sourceVisit?: Visit;
  assignedTo?: { id: number; name: string; email: string };
  createdAt: string;
}

export interface QuotationItem {
  id?: number;
  productName: string;
  unit: string;
  quantity: number;
  deliveredQuantity?: number;
  unitPrice: number;
  subtotal: number;
}

export interface QuotationDelivery {
  id: number;
  productName?: string;
  quantityDelivered: number;
  deliveryDate: string;
  remitoNumber?: string;
  truckPlate?: string;
  driverName?: string;
  notes?: string;
  deliveredBy?: { id: number; name: string; email: string };
  item?: QuotationItem;
  createdAt: string;
}

export interface Quotation {
  id: number;
  quotationNumber?: string;
  client: Client;
  template?: PdfTemplate;
  createdBy?: { id: number; name: string; email: string };
  totalAmount: number;
  paymentTerms?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Completed';
  deliveryStatus?: 'pending' | 'partial' | 'completed';
  items?: QuotationItem[];
  deliveries?: QuotationDelivery[];
  createdAt: string;
  updatedAt: string;
}
