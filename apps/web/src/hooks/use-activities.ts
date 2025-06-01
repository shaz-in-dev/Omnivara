import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Local types ───────────────────────────────────────────────────────────────

export interface ApiActivity {
  id: string;
  orgId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'other';
  subject: string;
  body: string | null;
  completedAt: string | null;
  dueAt: string | null;
  duration: number | null;
  userId: string;
  user?: { id: string; name: string; avatarUrl: string | null } | null;
  leadId: string | null;
  contactId: string | null;
  accountId: string | null;
  opportunityId: string | null;
  createdAt: string;
  updatedAt: string;
}

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

interface ListActivitiesParams {
  orgId: string;
  contactId?: string | undefined;
  leadId?: string | undefined;
  opportunityId?: string | undefined;
}

export function useActivities({ orgId, contactId, leadId, opportunityId }: ListActivitiesParams) {
  return useQuery({
    queryKey: ['crm', 'activities', orgId, contactId, leadId, opportunityId],
    queryFn: async () => {
      const { data } = await api.get('/crm/activities', {
        params: {
          ...(contactId ? { contactId } : {}),
          ...(leadId ? { leadId } : {}),
          ...(opportunityId ? { opportunityId } : {}),
        },
        ...orgHeaders(orgId),
      });
      const payload = data?.data ?? data;
      if (Array.isArray(payload)) return payload as ApiActivity[];
      if (Array.isArray(payload?.data)) return payload.data as ApiActivity[];
      return [] as ApiActivity[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useCreateActivity(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      type: ApiActivity['type'];
      subject: string;
      body?: string;
      contactId?: string;
      leadId?: string;
      accountId?: string;
      opportunityId?: string;
    }) => {
      const { data } = await api.post('/crm/activities', body, orgHeaders(orgId));
      return (data?.data ?? data) as ApiActivity;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'activities', orgId] }),
  });
}
