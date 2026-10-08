import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Local types (API schema — all statuses lowercase) ─────────────────────────

export interface ApiProject {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  status: string;
  ownerId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTask {
  id: string;
  projectId: string;
  orgId: string;
  title: string;
  description: string | null;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'critical' | 'low' | 'medium' | 'high';
  assigneeId: string | null;
  assignee?: { id: string; name: string; avatarUrl: string | null } | null;
  dueDate: string | null;
  tags?: string[];
  points: number | null;
  sprintId: string | null;
  estimatedHours: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSprint {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: string; // planning | active | completed
  createdAt: string;
  updatedAt: string;
  tasks?: ApiTask[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface ListProjectsParams {
  orgId: string;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

interface ApiListResponse<T> {
  data?: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

function normalizeListResponse<T>(
  payload: unknown,
  meta?: ApiListResponse<T>['meta'],
): { items: T[]; total: number; page: number; totalPages: number } {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      total: meta?.total ?? payload.length,
      page: meta?.page ?? 1,
      totalPages: meta?.totalPages ?? 1,
    };
  }

  if (payload && typeof payload === 'object' && 'items' in payload) {
    const response = payload as { items: T[]; total?: number; page?: number; totalPages?: number };
    return {
      items: response.items,
      total: response.total ?? meta?.total ?? response.items.length,
      page: response.page ?? meta?.page ?? 1,
      totalPages: response.totalPages ?? meta?.totalPages ?? 1,
    };
  }

  throw new Error('Unexpected list response from projects API');
}

export function useProjects(params: ListProjectsParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const { data } = await api.get('/projects', {
        params: {
          ...(params.search ? { search: params.search } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
        ...orgHeaders(params.orgId),
      });
      const payload = data?.data ?? data;
      return normalizeListResponse<ApiProject>(payload, data?.meta);
    },
    enabled: !!params.orgId,
  });
}

export function useProject(orgId: string, projectId: string) {
  return useQuery({
    queryKey: ['projects', orgId, projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`, orgHeaders(orgId));
      return (data?.data ?? data) as ApiProject;
    },
    enabled: !!orgId && !!projectId,
  });
}

export function useCreateProject(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const { data } = await api.post('/projects', body, orgHeaders(orgId));
      return (data?.data ?? data) as ApiProject;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useTasks(orgId: string, projectId: string, sprintId?: string) {
  return useQuery({
    queryKey: ['tasks', orgId, projectId, sprintId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/tasks`, {
        params: { ...(sprintId ? { sprintId } : {}) },
        ...orgHeaders(orgId),
      });
      const payload = data?.data ?? data;
      return normalizeListResponse<ApiTask>(payload, data?.meta);
    },
    enabled: !!orgId && !!projectId,
  });
}

export function useSprints(orgId: string, projectId: string) {
  return useQuery({
    queryKey: ['sprints', orgId, projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/sprints`, orgHeaders(orgId));
      const payload = data?.data ?? data;
      return (Array.isArray(payload) ? payload : []) as ApiSprint[];
    },
    enabled: !!orgId && !!projectId,
  });
}

export function useAssignTaskToSprint(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, sprintId }: { taskId: string; sprintId: string | null }) => {
      const { data } = await api.patch(`/projects/${projectId}/tasks/${taskId}`, { sprintId }, orgHeaders(orgId));
      return (data?.data ?? data) as ApiTask;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] });
      void qc.invalidateQueries({ queryKey: ['sprints', orgId, projectId] });
    },
  });
}

export function useCreateTask(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { title: string; status?: string; priority?: string }) => {
      const { data } = await api.post(`/projects/${projectId}/tasks`, body, orgHeaders(orgId));
      return (data?.data ?? data) as ApiTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  });
}

/** PATCH /projects/:projectId/tasks/:id/status */
export function useUpdateTaskStatus(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(
        `/projects/${projectId}/tasks/${id}/status`,
        { status },
        orgHeaders(orgId),
      );
      return (data?.data ?? data) as ApiTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  });
}

export function useDeleteTask(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`, orgHeaders(orgId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  });
}

/** PATCH /projects/:projectId/tasks/:id (general fields) */
export function useUpdateTask(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<ApiTask> & { id: string }) => {
      const { data } = await api.patch(`/projects/${projectId}/tasks/${id}`, body, orgHeaders(orgId));
      return (data?.data ?? data) as ApiTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  });
}
