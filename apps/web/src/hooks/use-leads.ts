import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  ownerId: string | null;
  orgId: string;
  owner?: { id: string; name: string; avatarUrl: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

interface ListParams {
  orgId: string;
  status?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

export function useLeads(params: ListParams) {
  return useQuery({
    queryKey: ['crm', 'leads', params],
    queryFn: async () => {
      const { data } = await api.get('/crm/leads', {
        params: {
          ...(params.status ? { status: params.status } : {}),
          ...(params.search ? { search: params.search } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
        ...orgHeaders(params.orgId),
      });
      const payload = data?.data ?? data;
      return payload as { items: Lead[]; total: number; page: number; totalPages: number };
    },
    enabled: !!params.orgId,
  });
}

export function useCreateLead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Lead> & { name: string }) => {
      const { data } = await api.post('/crm/leads', body, orgHeaders(orgId));
      return (data?.data ?? data) as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'leads'] }),
  });
}

export function useUpdateLead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Lead> & { id: string }) => {
      const { data } = await api.patch(`/crm/leads/${id}`, body, orgHeaders(orgId));
      return (data?.data ?? data) as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'leads'] }),
  });
}

export function useDeleteLead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      await api.delete(`/crm/leads/${leadId}`, orgHeaders(orgId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'leads'] }),
  });
}
