'use client';
import { useEffect, useState } from 'react';
import { Zap, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface AiUsage {
  messages: number;
  tokens:   number;
  limit:    number | null;
  percent:  number;
  planId:   string;
}

/** Shows a usage warning when ≥80% of monthly AI messages are consumed. */
export function AiUsageBar() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [usage,     setUsage]     = useState<AiUsage | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    api.get<AiUsage>('/ai/usage').then(({ data }) => setUsage(data)).catch(() => {});
  }, [orgId]);

  if (!usage || dismissed || usage.limit === null || usage.percent < 80) return null;

  const isAtLimit = usage.percent >= 100;

  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm ${
      isAtLimit
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
        : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
    }`}>
      <div className="flex items-center gap-2">
        <Zap className={`h-4 w-4 flex-shrink-0 ${isAtLimit ? 'text-red-500' : 'text-yellow-500'}`} />
        <span>
          {isAtLimit
            ? `Monthly AI limit reached (${usage.messages}/${usage.limit} messages). `
            : `You're using ${usage.percent}% of your ${usage.limit} monthly AI messages. `}
          <a href="/settings" className="font-medium underline">Upgrade to Business</a> for unlimited access.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="ml-3 flex-shrink-0 rounded p-0.5 hover:bg-black/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
