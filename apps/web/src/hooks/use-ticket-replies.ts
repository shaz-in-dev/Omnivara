import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ApiTicketReply {
  id: string;
  ticketId: string;
  orgId: string;
  authorId: string | null;
  authorName: string;
  isAgent: boolean;
  body: string;
  createdAt: string;
  author?: { id: string; name: string; avatarUrl: string | null } | null;
}

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

export function useTicketReplies(orgId: string, ticketId: string) {
  return useQuery({
    queryKey: ['ticket-replies', orgId, ticketId],
    queryFn: async () => {
      const { data } = await api.get(`/helpdesk/tickets/${ticketId}/replies`, orgHeaders(orgId));
      const payload = data?.data ?? data;
      return (Array.isArray(payload) ? payload : []) as ApiTicketReply[];
    },
    enabled: !!orgId && !!ticketId,
    staleTime: 30_000,
  });
}

export function useCreateTicketReply(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, body, isAgent = true }: { ticketId: string; body: string; isAgent?: boolean }) => {
      const { data } = await api.post(
        `/helpdesk/tickets/${ticketId}/replies`,
        { body, isAgent },
        orgHeaders(orgId),
      );
      return (data?.data ?? data) as ApiTicketReply;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ticket-replies', orgId, vars.ticketId] }),
  });
}
