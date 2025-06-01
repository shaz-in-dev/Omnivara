'use client';
import { useState } from 'react';
import { AlertTriangle, X, ArrowUpRight } from 'lucide-react';
import { useBillingUsage, useCreateCheckout } from '@/hooks/use-billing';
import { UpgradeModal } from './upgrade-modal';

/**
 * Shows a dismissible banner when the org is at ≥80% of any plan limit.
 * Place this in the dashboard shell, above main content.
 */
export function UsageWarningBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { data } = useBillingUsage();

  if (!data || dismissed) return null;

  const { planId, limits, usage } = data;

  // Check which limits are at ≥ 80%
  const userPct = limits.users === -1 ? 0 : (usage.users / limits.users) * 100;
  const aiPct = limits.ai_credits_per_month === -1 ? 0 : (usage.ai_credits_used / limits.ai_credits_per_month) * 100;

  const warnings: string[] = [];
  if (userPct >= 100) warnings.push(`team member limit reached (${usage.users}/${limits.users})`);
  else if (userPct >= 80) warnings.push(`${Math.round(userPct)}% of user limit used`);
  if (aiPct >= 100) warnings.push(`AI credit limit reached (${usage.ai_credits_used}/${limits.ai_credits_per_month})`);
  else if (aiPct >= 80) warnings.push(`${Math.round(aiPct)}% of AI credits used`);

  if (warnings.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
        <p className="flex-1 text-sm text-amber-700 dark:text-amber-300">
          <strong>Usage alert:</strong> {warnings.join(' · ')}.{' '}
          <button
            onClick={() => setShowUpgrade(true)}
            className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:no-underline"
          >
            Upgrade your plan <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-800/30"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlanId={planId}
        reason={`You're using ${warnings.join(' and ')}`}
      />
    </>
  );
}
