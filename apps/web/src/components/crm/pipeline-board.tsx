'use client';
import { useState } from 'react';
import { DealCard } from './deal-card';
import { Plus } from 'lucide-react';
import type { Opportunity, PipelineStage } from '@/hooks/use-opportunities';

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const STAGE_COLORS: Record<string, { top: string; count: string }> = {
  prospecting: { top: 'border-t-gray-400', count: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  qualification: { top: 'border-t-blue-400', count: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  proposal: { top: 'border-t-purple-400', count: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  negotiation: { top: 'border-t-amber-400', count: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  closed_won: { top: 'border-t-green-400', count: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  closed_lost: { top: 'border-t-red-400', count: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

interface PipelineBoardProps {
  stages: PipelineStage[];
  onDealClick?: (id: string) => void;
  /** Called after optimistic UI update so the caller can PATCH the API */
  onStageDrop?: (dealId: string, newStage: string) => void;
}

export function PipelineBoard({ stages: initialStages, onDealClick, onStageDrop }: PipelineBoardProps) {
  const [stages, setStages] = useState(initialStages);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragStage, setDragStage] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const handleDragStart = (dealId: string, stageKey: string) => {
    setDragId(dealId);
    setDragStage(stageKey);
  };

  const handleDrop = (targetStage: string) => {
    if (!dragId || !dragStage || dragStage === targetStage) {
      setDragId(null);
      setDragStage(null);
      setOverStage(null);
      return;
    }

    setStages((prev) => {
      let movedDeal: Opportunity | undefined;
      const next = prev.map((col) => {
        if (col.stage === dragStage) {
          const opp = col.opportunities.find((o) => o.id === dragId);
          if (opp) movedDeal = { ...opp, stage: targetStage };
          const opps = col.opportunities.filter((o) => o.id !== dragId);
          return { ...col, opportunities: opps, totalAmount: opps.reduce((s, o) => s + (o.amount ?? 0), 0) };
        }
        return col;
      });
      if (!movedDeal) return prev;
      return next.map((col) => {
        if (col.stage === targetStage) {
          const opps = [...col.opportunities, movedDeal!];
          return { ...col, opportunities: opps, totalAmount: opps.reduce((s, o) => s + (o.amount ?? 0), 0) };
        }
        return col;
      });
    });

    setDragId(null);
    setDragStage(null);
    setOverStage(null);

    // Fire API PATCH after optimistic update
    onStageDrop?.(dragId, targetStage);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {stages.map((col) => {
        const colors = STAGE_COLORS[col.stage] ?? { top: 'border-t-gray-400', count: 'bg-gray-100 text-gray-600' };
        const isOver = overStage === col.stage && dragStage !== col.stage;

        return (
          <div
            key={col.stage}
            className={`flex w-72 flex-shrink-0 flex-col rounded-2xl border border-t-4 bg-gray-50 transition-all dark:bg-gray-900 ${colors.top} ${
              isOver
                ? 'border-brand-400 ring-2 ring-brand-400/30 shadow-lg scale-[1.01]'
                : 'border-gray-200 dark:border-gray-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setOverStage(col.stage); }}
            onDragLeave={() => setOverStage(null)}
            onDrop={() => handleDrop(col.stage)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {STAGE_LABELS[col.stage] ?? col.stage}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.count}`}>
                  {col.opportunities.length}
                </span>
              </div>
              {col.totalAmount > 0 && (
                <span className="text-xs font-medium text-gray-400">
                  ${col.totalAmount.toLocaleString()}
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 min-h-[120px]">
              {col.opportunities.length === 0 ? (
                <div className={`flex flex-1 min-h-[80px] items-center justify-center rounded-xl border-2 border-dashed text-sm text-gray-400 transition-colors ${
                  isOver ? 'border-brand-400 bg-brand-50/50 text-brand-500 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  {isOver ? 'Drop here' : 'No deals'}
                </div>
              ) : (
                col.opportunities.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id, col.stage)}
                    onDragEnd={() => { setDragId(null); setDragStage(null); setOverStage(null); }}
                    className={`transition-opacity ${dragId === deal.id ? 'opacity-40' : 'opacity-100'}`}
                    style={{ cursor: 'grab' }}
                  >
                    <DealCard deal={deal} onClick={() => onDealClick?.(deal.id)} />
                  </div>
                ))
              )}
            </div>

            {/* Add deal button */}
            <div className="border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
              <button className="flex w-full items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-brand-600 dark:hover:text-brand-400">
                <Plus className="h-3.5 w-3.5" />
                Add deal
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
