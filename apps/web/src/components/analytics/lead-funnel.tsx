'use client';
import type { AnalyticsData } from '@/hooks/use-analytics';

const STAGE_COLORS = [
  'bg-brand-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-green-500',
];

function formatCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000)      return `$${(n / 1000).toFixed(0)}k`;
  return n > 0 ? `$${n}` : '—';
}

interface Props {
  funnel: AnalyticsData['leadFunnel'];
  isLoading?: boolean;
}

export function LeadFunnel({ funnel, isLoading = false }: Props) {
  const maxCount      = funnel[0]?.count ?? 1;
  const firstCount    = funnel[0]?.count ?? 1;
  const lastCount     = funnel[funnel.length - 1]?.count ?? 0;
  const conversionRate = firstCount > 0
    ? ((lastCount / firstCount) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lead Funnel</h3>
          <p className="mt-0.5 text-xs text-gray-400">Current snapshot</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold text-green-600 transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
            {conversionRate}%
          </p>
          <p className="text-xs text-gray-400">Conversion rate</p>
        </div>
      </div>

      <div className={`space-y-2 transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
        {funnel.map((stage, i) => {
          const prevCount = funnel[i - 1]?.count ?? 1;
          const dropRate  = i > 0 && prevCount > 0
            ? (((prevCount - stage.count) / prevCount) * 100).toFixed(0)
            : null;
          const widthPct  = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 6 : 0) : 0;
          const color     = STAGE_COLORS[i] ?? 'bg-gray-400';

          return (
            <div key={stage.label}>
              {dropRate && (
                <div className="flex items-center gap-2 py-0.5">
                  <div className="ml-2 h-3 w-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[11px] text-red-400">-{dropRate}% drop</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0 text-right text-xs font-medium text-gray-500">
                  {stage.label}
                </div>
                <div className="flex-1">
                  <div
                    className={`h-8 rounded-lg ${color} flex items-center justify-between px-3 transition-all duration-500`}
                    style={{ width: `${widthPct}%`, minWidth: stage.count > 0 ? '60px' : '4px' }}
                  >
                    {stage.count > 0 && (
                      <span className="text-xs font-bold text-white">{stage.count}</span>
                    )}
                  </div>
                </div>
                <div className="w-16 flex-shrink-0 text-right text-xs text-gray-400">
                  {formatCompact(stage.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-center dark:border-gray-800">
        <div>
          <p className={`text-base font-bold text-gray-900 dark:text-white transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
            {firstCount}
          </p>
          <p className="text-xs text-gray-400">Total leads</p>
        </div>
        <div>
          <p className={`text-base font-bold text-gray-900 dark:text-white transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
            {lastCount}
          </p>
          <p className="text-xs text-gray-400">Closed won</p>
        </div>
        <div>
          <p className={`text-base font-bold text-green-600 transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
            {formatCompact(funnel[funnel.length - 1]?.value ?? 0)}
          </p>
          <p className="text-xs text-gray-400">Revenue</p>
        </div>
      </div>
    </div>
  );
}
