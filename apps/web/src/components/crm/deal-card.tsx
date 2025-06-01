'use client';

import type { Opportunity } from '@/hooks/use-opportunities';

const STAGE_BADGE: Record<string, string> = {
  prospecting: 'bg-gray-100 text-gray-600',
  qualification: 'bg-blue-100 text-blue-700',
  proposal: 'bg-purple-100 text-purple-700',
  negotiation: 'bg-amber-100 text-amber-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
};

interface DealCardProps {
  deal: Opportunity;
  onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const isOverdue =
    deal.expectedCloseDate &&
    new Date(deal.expectedCloseDate) < new Date() &&
    deal.stage !== 'closed_won';

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{deal.name}</p>
      {deal.account && (
        <p className="mt-0.5 truncate text-xs text-gray-500">{deal.account.name}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        {deal.amount != null ? (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {deal.currency} {Number(deal.amount).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-gray-400">No amount</span>
        )}
        {deal.probability != null && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            {deal.probability}%
          </span>
        )}
      </div>
      {deal.expectedCloseDate && (
        <p className={`mt-2 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
          {isOverdue ? '⚠️' : '📅'} Close{' '}
          {new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
      {deal.owner && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {deal.owner.name.charAt(0)}
          </div>
          <span className="text-xs text-gray-400">{deal.owner.name}</span>
        </div>
      )}
    </button>
  );
}
