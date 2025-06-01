import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Local types (API schema) ──────────────────────────────────────────────────

export interface ApiEmployee {
  id: string;
  orgId: string;
  employeeNumber: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  department: string;
  location: string | null;
  managerId: string | null;
  manager: { id: string; firstName: string; lastName: string } | null;
  status: 'active' | 'on_leave' | 'terminated' | 'offboarding';
  startDate: string;
  salary: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLeaveRequest {
  id: string;
  orgId: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string; jobTitle: string; department: string } | null;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface ListEmployeesParams {
  orgId: string;
  department?: string | undefined;
  status?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export function useEmployees(params: ListEmployeesParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const { data } = await api.get(`/orgs/${params.orgId}/hr/employees`, {
        params: {
          ...(params.department ? { department: params.department } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
      });
      const payload = data?.data ?? data;
      return payload as { items: ApiEmployee[]; total: number; page: number; totalPages: number };
    },
    enabled: !!params.orgId,
  });
}

export function useEmployee(orgId: string, employeeId: string) {
  return useQuery({
    queryKey: ['employees', orgId, employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/orgs/${orgId}/hr/employees/${employeeId}`);
      return (data?.data ?? data) as ApiEmployee;
    },
    enabled: !!orgId && !!employeeId,
  });
}

export function useCreateEmployee(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      firstName: string;
      lastName: string;
      email: string;
      jobTitle: string;
      department: string;
      startDate: string;
      location?: string;
      phone?: string;
    }) => {
      const { data } = await api.post(`/orgs/${orgId}/hr/employees`, body);
      return (data?.data ?? data) as ApiEmployee;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<ApiEmployee> & { id: string }) => {
      const { data } = await api.put(`/orgs/${orgId}/hr/employees/${id}`, body);
      return (data?.data ?? data) as ApiEmployee;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useLeaveRequests(orgId: string, status?: string) {
  return useQuery({
    queryKey: ['leave-requests', orgId, status],
    queryFn: async () => {
      const { data } = await api.get(`/orgs/${orgId}/hr/leave-requests`, {
        params: { ...(status ? { status } : {}) },
      });
      const payload = data?.data ?? data;
      return payload as { items: ApiLeaveRequest[]; total: number } | ApiLeaveRequest[];
    },
    enabled: !!orgId,
  });
}

export function useReviewLeaveRequest(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      action,
      reviewedBy,
    }: { requestId: string; action: 'approved' | 'denied'; reviewedBy: string }) => {
      const { data } = await api.put(
        `/orgs/${orgId}/hr/leave-requests/${requestId}/review`,
        { action, reviewedBy },
      );
      return (data?.data ?? data) as ApiLeaveRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-requests', orgId] }),
  });
}
