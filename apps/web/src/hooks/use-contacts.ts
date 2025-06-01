import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  accountId: string | null;
  account: { id: string; name: string } | null;
  owner: { id: string; name: string; avatarUrl: string | null } | null;
  tags: string[];
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

export function useContacts(orgId: string, search?: string, accountId?: string) {
  return useQuery({
    queryKey: ['crm', 'contacts', orgId, search, accountId],
    queryFn: async () => {
      const { data } = await api.get('/crm/contacts', {
        params: {
          ...(search ? { search } : {}),
          ...(accountId ? { accountId } : {}),
        },
        ...orgHeaders(orgId),
      });
      const payload = data?.data ?? data;
      // API returns paginated or array — normalise to array
      if (Array.isArray(payload)) return payload as Contact[];
      if (Array.isArray(payload?.data)) return payload.data as Contact[];
      return [] as Contact[];
    },
    enabled: !!orgId,
  });
}

export function useCreateContact(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; [key: string]: unknown }) => {
      const { data } = await api.post('/crm/contacts', body, orgHeaders(orgId));
      return (data?.data ?? data) as Contact;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'contacts'] }),
  });
}

export function useUpdateContact(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Contact> & { id: string }) => {
      const { data } = await api.patch(`/crm/contacts/${id}`, body, orgHeaders(orgId));
      return (data?.data ?? data) as Contact;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'contacts'] }),
  });
}

export function useDeleteContact(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string) => {
      await api.delete(`/crm/contacts/${contactId}`, orgHeaders(orgId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'contacts'] }),
  });
}
