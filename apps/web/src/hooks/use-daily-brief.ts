'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface BriefItem {
  category:   string;
  title:      string;
  summary:    string;
  action_url?: string;
  priority:   'high' | 'medium' | 'low';
}

export interface DailyBrief {
  greeting:     string;
  items:        BriefItem[];
  generated_at: string;
}

export function useDailyBrief() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [brief,   setBrief]   = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    api.get<DailyBrief>('/ai/brief')
      .then(({ data }) => {
        setBrief(data);
        setError(null);
      })
      .catch((err) => {
        // 403 = plan gate, other = service unavailable
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 403) {
          setError('upgrade');
        } else {
          setError('unavailable');
        }
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  return { brief, loading, error };
}
