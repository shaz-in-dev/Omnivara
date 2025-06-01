import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number | null;
  currency: string;
  probability: number | null;
  expectedCloseDate: string | null;
  account: { id: string; name: string } | null;
  owner: { id: string; name: string; avatarUrl: string | null } | null;
  updatedAt: string;
}

export interface PipelineStage {
  stage: string;
  opportunities: Opportunity[];
  totalAmount: number;
}

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

export function usePipeline(orgId: string, ownerId?: string) {
  return useQuery({
    queryKey: ['crm', 'pipeline', orgId, ownerId],
    queryFn: async () => {
      const { data } = await api.get('/crm/opportunities/pipeline', {
        params: { ...(ownerId ? { ownerId } : {}) },
        ...orgHeaders(orgId),
      });
      return (data?.data ?? data) as PipelineStage[];
    },
    enabled: !!orgId,
  });
}

export function useOpportunities(orgId: string) {
  return useQuery({
    queryKey: ['crm', 'opportunities', orgId],
    queryFn: async () => {
      const { data } = await api.get('/crm/opportunities', orgHeaders(orgId));
      return (data?.data ?? data) as Opportunity[];
    },
    enabled: !!orgId,
  });
}

export function useCreateOpportunity(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/crm/opportunities', payload, orgHeaders(orgId));
      return (data?.data ?? data) as Opportunity;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
}

export function useUpdateOpportunity(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Opportunity> & { id: string }) => {
      const { data } = await api.patch(`/crm/opportunities/${id}`, body, orgHeaders(orgId));
      return (data?.data ?? data) as Opportunity;
    },
    // Optimistic update already handled by pipeline-board; just re-sync after
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'pipeline', orgId] }),
  });
}
