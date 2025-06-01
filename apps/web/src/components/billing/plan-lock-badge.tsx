'use client';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { UpgradeModal } from './upgrade-modal';
import { useSubscription } from '@/hooks/use-billing';

interface PlanLockBadgeProps {
  /** Plans that can access this feature */
  requiredPlans?: string[];
  /** Short text shown in the badge */
  label?: string;
  /** Why the feature is locked */
  reason?: string;
}

export function PlanLockBadge({
  requiredPlans = ['growth', 'business', 'enterprise'],
  label = 'Pro',
  reason,
}: PlanLockBadgeProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { data } = useSubscription();
  const planId = data?.planId ?? 'starter';
  const isLocked = !requiredPlans.includes(planId);

  if (!isLocked) return null;

  return (
    <>
      <button
        onClick={() => setShowUpgrade(true)}
        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
        title="Upgrade to unlock"
      >
        <Lock className="h-2.5 w-2.5" />
        {label}
      </button>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlanId={planId}
        {...(reason !== undefined ? { reason } : {})}
      />
    </>
  );
}
