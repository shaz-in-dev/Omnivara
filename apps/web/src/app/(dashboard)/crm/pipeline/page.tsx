'use client';

import { Plus, Filter, Loader2, AlertCircle } from 'lucide-react';
import { PipelineBoard } from '@/components/crm/pipeline-board';
import { usePipeline, useUpdateOpportunity, type PipelineStage } from '@/hooks/use-opportunities';
import { useAuthStore } from '@/stores/auth.store';
import { useCallback } from 'react';

export default function PipelinePage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const { data: stages, isLoading, isError, refetch } = usePipeline(orgId);
  const updateOpp = useUpdateOpportunity(orgId);

  const pipelineStages: PipelineStage[] = stages ?? [];

  const totalDeals = pipelineStages.reduce((n, s) => n + s.opportunities.length, 0);
  const totalValue = pipelineStages
    .filter((s) => !['closed_won', 'closed_lost'].includes(s.stage))
    .reduce((n, s) => n + s.totalAmount, 0);
  const wonThisMonth = pipelineStages.find((s) => s.stage === 'closed_won')?.totalAmount ?? 0;

  // Called by PipelineBoard after optimistic UI update; fires PATCH to persist
  const handleStageDrop = useCallback(
    (dealId: string, newStage: string) => {
      updateOpp.mutate({ id: dealId, stage: newStage });
    },
    [updateOpp],
  );

  return (
    <div className="-m-6 flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline</h1>
          {!isLoading && !isError && (
            <p className="mt-0.5 text-sm text-gray-500">
              {totalDeals} deals ·{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                ${totalValue.toLocaleString()}
              </span>{' '}
              open ·{' '}
              <span className="font-medium text-green-600">${wonThisMonth.toLocaleString()}</span> won
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            <Plus className="h-4 w-4" /> Add Deal
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span>Loading pipeline…</span>
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-400">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="font-medium text-gray-600 dark:text-gray-400">Could not load pipeline</p>
          <button
            onClick={() => void refetch()}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden p-4">
          <PipelineBoard
            stages={pipelineStages}
            onStageDrop={handleStageDrop}
          />
        </div>
      )}
    </div>
  );
}
