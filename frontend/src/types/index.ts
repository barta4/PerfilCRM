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
  unitPrice: number;
  subtotal: number;
}

export interface Quotation {
  id: number;
  quotationNumber?: string;
  client: Client;
  createdBy?: { id: number; name: string; email: string };
  totalAmount: number;
  paymentTerms?: string;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  items?: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}
