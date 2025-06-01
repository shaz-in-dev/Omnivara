'use client';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { useDailyBrief, type BriefItem } from '@/hooks/use-daily-brief';

const PRIORITY_STYLES = {
  high:   'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
  medium: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
  low:    'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
};

const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-yellow-500',
  low:    'bg-gray-400',
};

const CATEGORY_ICONS: Record<string, string> = {
  Finance:    '💰',
  CRM:        '👥',
  Helpdesk:   '🎫',
  HR:         '🧑‍💼',
  Projects:   '📋',
  Inventory:  '📦',
  System:     '⚙️',
};

function BriefItemCard({ item }: { item: BriefItem }) {
  const router = useRouter();
  const icon = CATEGORY_ICONS[item.category] ?? '📌';

  return (
    <div
      onClick={() => item.action_url && router.push(item.action_url)}
      className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${PRIORITY_STYLES[item.priority]} ${item.action_url ? 'cursor-pointer hover:shadow-sm' : ''}`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${PRIORITY_DOT[item.priority]}`} />
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.title}</p>
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.summary}</p>
      </div>
      {item.action_url && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
      )}
    </div>
  );
}

export function DailyBrief() {
  const { brief, loading, error } = useDailyBrief();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Daily Brief</span>
        </div>
        <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating your brief…
        </div>
      </div>
    );
  }

  if (error === 'upgrade') {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">AI Daily Brief</span>
        </div>
        <p className="text-xs text-brand-600 dark:text-brand-400 mb-2">
          Available on Growth and Business plans. Get personalized morning briefs with real business data.
        </p>
        <a href="/settings" className="text-xs font-medium text-brand-500 hover:underline">
          Upgrade in Settings → Billing →
        </a>
      </div>
    );
  }

  if (error || !brief) {
    return null; // Silently hide if brief service is unavailable
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Daily Brief</span>
        </div>
        <span className="text-xs text-gray-400">{brief.generated_at}</span>
      </div>

      <div className="p-4">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{brief.greeting}</p>
        <div className="space-y-2">
          {brief.items.map((item, i) => (
            <BriefItemCard key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
