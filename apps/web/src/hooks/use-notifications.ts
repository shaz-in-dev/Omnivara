import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'task_assigned'
  | 'task_comment'
  | 'mention'
  | 'ticket_update'
  | 'invoice_status'
  | 'lead_status'
  | 'leave_approved'
  | 'stock_low'
  | 'system';

export interface Notification {
  id:        string;
  orgId:     string;
  userId?:   string;
  type:      NotificationType | string; // string fallback for unknown future types
  title:     string;
  body:      string;
  url?:      string;
  createdAt: string;
  read:      boolean;
  readAt?:   string | null;
}

/** Alias used by components that prefer the more descriptive name. */
export type AppNotification = Notification;

// ── Hook ──────────────────────────────────────────────────────────────────────

const BASE = (orgId: string) => `/orgs/${orgId}/notifications`;

export function useNotifications() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const token = useAuthStore((s) => s.accessToken);
  const qc    = useQueryClient();

  // SSE connection status — exposed so components can show "Live / Offline"
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // ── Fetch list ────────────────────────────────────────────────────────────
  const { data: notifications = [], isLoading } = useQuery({
    queryKey:  ['notifications', orgId],
    queryFn:   async () => {
      const { data } = await api.get<Notification[]>(BASE(orgId), { params: { limit: 50 } });
      return data;
    },
    enabled:   !!orgId,
    staleTime: 30_000,
  });

  // ── Unread count ─────────────────────────────────────────────────────────
  const { data: unreadCount = 0 } = useQuery({
    queryKey:        ['notifications-unread', orgId],
    queryFn:         async () => {
      const { data } = await api.get<{ count: number }>(`${BASE(orgId)}/unread-count`);
      return data.count;
    },
    enabled:         !!orgId,
    staleTime:       15_000,
    refetchInterval: 60_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['notifications', orgId] });
    void qc.invalidateQueries({ queryKey: ['notifications-unread', orgId] });
  };

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.patch(`${BASE(orgId)}/${id}/read`),
    onSuccess:  invalidate,
  });

  const markAllMut = useMutation({
    mutationFn: () => api.patch(`${BASE(orgId)}/read-all`),
    onSuccess:  invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`${BASE(orgId)}/${id}`),
    onSuccess:  invalidate,
  });

  // ── SSE real-time push ────────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId || !token) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
    const url = `${apiBase}/orgs/${orgId}/notifications/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen    = () => setConnected(true);
    es.onmessage = () => { invalidate(); };
    es.onerror   = () => { setConnected(false); /* browser auto-reconnects */ };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, token]);

  return {
    notifications,
    unreadCount,
    isLoading,
    /** true when SSE stream is open and receiving */
    connected,
    markRead:           (id: string) => markReadMut.mutate(id),
    markAllRead:        () => markAllMut.mutate(),
    deleteNotification: (id: string) => deleteMut.mutate(id),
    /** Alias for deleteNotification — used by NotificationDrawer */
    dismiss:            (id: string) => deleteMut.mutate(id),
  };
}
