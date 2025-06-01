'use client';
import Link from 'next/link';
import { Clock, X } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '@/hooks/use-billing';

export function TrialNudgeBar() {
  const { data } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!data?.subscription) return null;
  if (data.subscription.status !== 'trialing') return null;

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(data.subscription.currentPeriodEnd).getTime() - Date.now()) / 86_400_000,
    ),
  );

  if (daysLeft >= 14) return null; // Only show in the last 2 weeks

  const urgency = daysLeft <= 3 ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className={`${urgency} flex items-center justify-between px-4 py-2`}>
      <p className="flex items-center gap-2 text-sm font-medium text-white">
        <Clock className="h-4 w-4 flex-shrink-0" />
        {daysLeft === 0
          ? 'Your trial ends today'
          : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free trial`}
        <span className="opacity-80">· Upgrade now to keep access to all your data</span>
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/settings/billing"
          className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
        >
          Upgrade →
        </Link>
        <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
