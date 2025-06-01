import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
const apiClient = api;

export interface Account {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employeeCount: number | null;
  _count: { contacts: number; opportunities: number };
  owner: { id: string; name: string } | null;
}

export function useAccounts(orgId: string, search?: string) {
  return useQuery({
    queryKey: ['crm', 'accounts', orgId, search],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/accounts', {
        params: { ...(search && { search }) },
        headers: { 'x-org-id': orgId },
      });
      return data.data ?? data as { data: Account[]; meta: { total: number } };
    },
    enabled: !!orgId,
  });
}
