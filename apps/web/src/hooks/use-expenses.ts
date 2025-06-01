import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export type ApiExpenseCategory = 'travel' | 'meals' | 'software' | 'office' | 'other';
export type ApiExpenseStatus   = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';

export interface ApiExpense {
  id: string;
  orgId: string;
  title: string;
  category: ApiExpenseCategory;
  amount: number; // Prisma Decimal → serialised as number
  currency: string;
  date: string; // ISO 8601
  vendor: string | null;
  notes: string | null;
  receiptUrl: string | null;
  status: ApiExpenseStatus;
  submittedBy: string; // userId
  createdAt: string;
  updatedAt: string;
}

interface PaginatedExpenses {
  items: ApiExpense[];
  total: number;
  page: number;
  limit: number;
}

// ── Query params ─────────────────────────────────────────────────────────────

interface ListExpensesParams {
  orgId: string;
  status?: ApiExpenseStatus;
  category?: ApiExpenseCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Mutation payloads ─────────────────────────────────────────────────────────

export interface CreateExpensePayload {
  title: string;
  category: ApiExpenseCategory;
  amount: number;
  currency?: string;
  date: string;
  vendor?: string;
  notes?: string;
  receiptUrl?: string;
  status?: ApiExpenseStatus;
}

export interface UpdateExpensePayload {
  id: string;
  title?: string;
  category?: ApiExpenseCategory;
  amount?: number;
  currency?: string;
  date?: string;
  vendor?: string;
  notes?: string;
  status?: ApiExpenseStatus;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useExpenses({
  orgId,
  status,
  category,
  search,
  page = 1,
  limit = 50,
}: ListExpensesParams) {
  return useQuery({
    queryKey: ['expenses', orgId, { status, category, search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status)   params.set('status', status);
      if (category) params.set('category', category);
      if (search)   params.set('search', search);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const { data } = await api.get<{ data: PaginatedExpenses }>(
        `/orgs/${orgId}/expenses?${params.toString()}`,
      );
      return data.data;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useCreateExpense(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const { data } = await api.post<{ data: ApiExpense }>(
        `/orgs/${orgId}/expenses`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses', orgId] });
    },
  });
}

export function useUpdateExpense(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateExpensePayload) => {
      const { data } = await api.patch<{ data: ApiExpense }>(
        `/orgs/${orgId}/expenses/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses', orgId] });
    },
  });
}
