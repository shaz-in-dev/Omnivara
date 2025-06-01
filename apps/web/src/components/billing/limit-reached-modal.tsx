'use client';
import { useCallback } from 'react';
import { X, Users, Zap, Lock, HardDrive, ArrowRight } from 'lucide-react';
import { PLAN_DETAILS, useCreateCheckout } from '@/hooks/use-billing';
import { cn } from '@/lib/utils';

export type LimitType = 'members' | 'ai_credits' | 'sso' | 'storage';

interface Props {
  open:        boolean;
  onClose:     () => void;
  type:        LimitType;
  currentPlan: string;
}

const LIMIT_COPY: Record<LimitType, { icon: React.ElementType; title: string; body: string; upgradeTarget: keyof typeof PLAN_DETAILS }> = {
  members: {
    icon:          Users,
    title:         'Member limit reached',
    body:          "You've reached the member limit on your plan. Upgrade to add unlimited team members and scale your workspace.",
    upgradeTarget: 'business',
  },
  ai_credits: {
    icon:          Zap,
    title:         'AI credits used up',
    body:          "You've used all your AI credits this month. Upgrade to get more AI assistance and unlock unlimited queries.",
    upgradeTarget: 'growth',
  },
  sso: {
    icon:          Lock,
    title:         'SSO not available on your plan',
    body:          'Single Sign-On (SAML 2.0 / OIDC) is available on Business and Enterprise plans. Upgrade to enable SSO for your team.',
    upgradeTarget: 'business',
  },
  storage: {
    icon:          HardDrive,
    title:         'Storage almost full',
    body:          "You've used 90% of your plan's storage. Upgrade to get more storage and avoid disruptions.",
    upgradeTarget: 'growth',
  },
};

const PLAN_ORDER: Array<keyof typeof PLAN_DETAILS> = ['starter', 'growth', 'business', 'enterprise'];

/** Returns the next plan above the current one, or the upgrade target if higher. */
function getNextPlan(current: string, upgradeTarget: keyof typeof PLAN_DETAILS): keyof typeof PLAN_DETAILS {
  const idx = PLAN_ORDER.indexOf(current as keyof typeof PLAN_DETAILS);
  const targetIdx = PLAN_ORDER.indexOf(upgradeTarget);
  const nextIdx = Math.max(idx < 0 ? 0 : idx + 1, targetIdx);
  const clamped = Math.min(nextIdx, PLAN_ORDER.length - 1);
  return PLAN_ORDER[clamped]!;
}

export function LimitReachedModal({ open, onClose, type, currentPlan }: Props) {
  const checkout = useCreateCheckout();
  const copy     = LIMIT_COPY[type];
  const Icon     = copy.icon;
  const nextPlan = getNextPlan(currentPlan, copy.upgradeTarget) as keyof typeof PLAN_DETAILS;
  const plan     = PLAN_DETAILS[nextPlan];

  const handleUpgrade = useCallback(() => {
    checkout.mutate(nextPlan);
    onClose();
  }, [checkout, nextPlan, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{copy.title}</h2>
              <p className="text-xs text-gray-400">
                Current plan: <span className="font-medium capitalize">{currentPlan}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{copy.body}</p>
        </div>

        {/* Upgrade target plan highlight */}
        <div className="mx-6 mb-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {plan.name} plan
              </p>
              <p className="text-xs text-gray-500">{plan.description}</p>
            </div>
            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
              {plan.priceLabel}
            </p>
          </div>
          <ul className="mt-3 space-y-1">
            {plan.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            Not now
          </button>
          <button
            onClick={handleUpgrade}
            disabled={checkout.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {checkout.isPending ? 'Redirecting…' : (
              <>Upgrade to {plan.name} <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

import { useState } from 'react';

export function useLimitCheck(type: LimitType, isAtLimit: boolean) {
  const [open, setOpen] = useState(false);

  const checkAndAct = useCallback(
    (action: () => void) => {
      if (isAtLimit) {
        setOpen(true);
      } else {
        action();
      }
    },
    [isAtLimit],
  );

  return {
    isAtLimit,
    modalOpen:       open,
    showUpgradeModal: () => setOpen(true),
    closeModal:       () => setOpen(false),
    checkAndAct,
    modalProps: {
      open,
      onClose: () => setOpen(false),
      type,
    },
  };
}
