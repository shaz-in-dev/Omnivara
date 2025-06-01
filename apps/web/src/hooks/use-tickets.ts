import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Local types (API schema — all statuses / priorities lowercase) ─────────────

export interface ApiTicket {
  id: string;
  orgId: string;
  subject: string;
  description: string | null;
  status: 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: string;
  contactId: string | null;
  contactName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  tags: string[];
  slaBreachAt: string | null;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface ListTicketsParams {
  orgId: string;
  status?: string | undefined;
  priority?: string | undefined;
  assigneeId?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export function useTickets(params: ListTicketsParams) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const { data } = await api.get('/helpdesk/tickets', {
        params: {
          ...(params.status ? { status: params.status } : {}),
          ...(params.priority ? { priority: params.priority } : {}),
          ...(params.assigneeId ? { assigneeId: params.assigneeId } : {}),
          ...(params.search ? { search: params.search } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
        ...orgHeaders(params.orgId),
      });
      const payload = data?.data ?? data;
      return payload as { items: ApiTicket[]; total: number; page: number; totalPages: number };
    },
    enabled: !!params.orgId,
  });
}

export function useTicket(orgId: string, ticketId: string) {
  return useQuery({
    queryKey: ['tickets', orgId, ticketId],
    queryFn: async () => {
      const { data } = await api.get(`/helpdesk/tickets/${ticketId}`, orgHeaders(orgId));
      return (data?.data ?? data) as ApiTicket;
    },
    enabled: !!orgId && !!ticketId,
  });
}

export function useCreateTicket(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      subject: string;
      description?: string;
      priority?: string;
      channel?: string;
      contactName?: string;
      tags?: string[];
    }) => {
      const { data } = await api.post('/helpdesk/tickets', body, orgHeaders(orgId));
      return (data?.data ?? data) as ApiTicket;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function useUpdateTicket(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<ApiTicket> & { id: string }) => {
      const { data } = await api.patch(`/helpdesk/tickets/${id}`, body, orgHeaders(orgId));
      return (data?.data ?? data) as ApiTicket;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}
