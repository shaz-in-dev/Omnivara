import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Local types ───────────────────────────────────────────────────────────────

export interface ApiMember {
  id: string;
  orgId: string;
  userId: string;
  roleId: string;
  joinedAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  role: { id: string; name: string };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useMembers(orgId: string) {
  return useQuery({
    queryKey: ['members', orgId],
    queryFn: async () => {
      const { data } = await api.get(`/orgs/${orgId}/members`);
      const payload = data?.data ?? data;
      return (Array.isArray(payload) ? payload : []) as ApiMember[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useInviteMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; roleId?: string }) => {
      const { data } = await api.post(`/orgs/${orgId}/members/invite`, body);
      return data?.data ?? data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
}
