import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ApiTaskComment {
  id: string;
  taskId: string;
  orgId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface ApiTaskChecklist {
  id: string;
  taskId: string;
  orgId: string;
  text: string;
  done: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

function orgHeaders(orgId: string) {
  return { headers: { 'x-org-id': orgId } };
}

// ── Comments ──────────────────────────────────────────────────────────────────

export function useTaskComments(orgId: string, projectId: string, taskId: string) {
  return useQuery({
    queryKey: ['task-comments', orgId, taskId],
    queryFn: async () => {
      const { data } = await api.get(
        `/projects/${projectId}/tasks/${taskId}/comments`,
        orgHeaders(orgId),
      );
      const payload = data?.data ?? data;
      return (Array.isArray(payload) ? payload : []) as ApiTaskComment[];
    },
    enabled: !!orgId && !!taskId && !!projectId,
    staleTime: 30_000,
  });
}

export function useCreateTaskComment(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data } = await api.post(
        `/projects/${projectId}/tasks/${taskId}/comments`,
        { content },
        orgHeaders(orgId),
      );
      return (data?.data ?? data) as ApiTaskComment;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['task-comments', orgId, vars.taskId] }),
  });
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export function useTaskChecklist(orgId: string, projectId: string, taskId: string) {
  return useQuery({
    queryKey: ['task-checklist', orgId, taskId],
    queryFn: async () => {
      const { data } = await api.get(
        `/projects/${projectId}/tasks/${taskId}/checklist`,
        orgHeaders(orgId),
      );
      const payload = data?.data ?? data;
      return (Array.isArray(payload) ? payload : []) as ApiTaskChecklist[];
    },
    enabled: !!orgId && !!taskId && !!projectId,
    staleTime: 30_000,
  });
}

export function useCreateChecklistItem(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, text }: { taskId: string; text: string }) => {
      const { data } = await api.post(
        `/projects/${projectId}/tasks/${taskId}/checklist`,
        { text },
        orgHeaders(orgId),
      );
      return (data?.data ?? data) as ApiTaskChecklist;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['task-checklist', orgId, vars.taskId] }),
  });
}

export function useUpdateChecklistItem(orgId: string, projectId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, done, text }: { itemId: string; done?: boolean; text?: string }) => {
      const { data } = await api.patch(
        `/projects/${projectId}/tasks/${taskId}/checklist/${itemId}`,
        { ...(done !== undefined ? { done } : {}), ...(text !== undefined ? { text } : {}) },
        orgHeaders(orgId),
      );
      return (data?.data ?? data) as ApiTaskChecklist;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-checklist', orgId, taskId] }),
  });
}
