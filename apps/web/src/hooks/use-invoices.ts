import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Local types (API schema — statuses lowercase) ─────────────────────────────

export interface ApiInvoice {
  id: string;
  orgId: string;
  number: string;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  accountId: string | null;
  account: { id: string; name: string } | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface ListInvoicesParams {
  orgId: string;
  status?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export function useInvoices(params: ListInvoicesParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data } = await api.get('/finance/invoices', {
        params: {
          ...(params.status ? { status: params.status } : {}),
          ...(params.search ? { search: params.search } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
        ...orgHeaders(params.orgId),
      });
      const payload = data?.data ?? data;
      return payload as { items: ApiInvoice[]; total: number; page: number; totalPages: number };
    },
    enabled: !!params.orgId,
  });
}

export function useInvoice(orgId: string, invoiceId: string) {
  return useQuery({
    queryKey: ['invoices', orgId, invoiceId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/invoices/${invoiceId}`, orgHeaders(orgId));
      return (data?.data ?? data) as ApiInvoice;
    },
    enabled: !!orgId && !!invoiceId,
  });
}

export function useUpdateInvoiceStatus(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(
        `/finance/invoices/${id}/status`,
        { status },
        orgHeaders(orgId),
      );
      return (data?.data ?? data) as ApiInvoice;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export interface CreateInvoicePayload {
  number?: string;
  clientName: string;
  clientEmail?: string;
  currency?: string;
  taxRate?: number;
  dueDate?: string;
  notes?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
}

export function useCreateInvoice(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload) => {
      const { data } = await api.post('/finance/invoices', payload, orgHeaders(orgId));
      return (data?.data ?? data) as ApiInvoice;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useSendInvoice(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/finance/invoices/${id}/send`, {}, orgHeaders(orgId));
      return (data?.data ?? data) as ApiInvoice;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
