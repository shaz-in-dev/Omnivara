import type { ID, Timestamps } from './common';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';

export interface Invoice extends Timestamps {
  id: ID;
  orgId: ID;
  number: string;
  status: InvoiceStatus;
  contactId: ID | null;
  accountId: ID | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
}

export interface InvoiceLineItem {
  id: ID;
  invoiceId: ID;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
