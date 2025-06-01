'use client';
import { X, Zap, Check, Loader2 } from 'lucide-react';
import { PLAN_DETAILS, useCreateCheckout } from '@/hooks/use-billing';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlanId?: string;
  /** Contextual reason shown at the top, e.g. "You've reached the 5-user limit on your Starter plan" */
  reason?: string;
}

const UPGRADE_PLANS = (['growth', 'business', 'enterprise'] as const);

export function UpgradeModal({ open, onClose, currentPlanId = 'starter', reason }: UpgradeModalProps) {
  const checkout = useCreateCheckout();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <Zap className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upgrade your plan</h2>
              {reason && (
                <p className="mt-0.5 text-sm text-amber-600 dark:text-amber-400">{reason}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-3 gap-4 p-6">
          {UPGRADE_PLANS.map((planId) => {
            const plan = PLAN_DETAILS[planId];
            const isCurrent = planId === currentPlanId;
            const isEnterprise = planId === 'enterprise';
            const isLoading = checkout.isPending && checkout.variables === planId;

            return (
              <div
                key={planId}
                className={`relative rounded-xl border-2 p-5 transition-all ${
                  planId === 'growth'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50'
                }`}
              >
                {planId === 'growth' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{plan.priceLabel}</p>
                </div>

                <ul className="mb-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="rounded-lg bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 dark:bg-gray-700">
                    Current plan
                  </div>
                ) : isEnterprise ? (
                  <a
                    href="mailto:sales@omnivara.io?subject=Enterprise inquiry"
                    className="flex w-full items-center justify-center rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Contact sales
                  </a>
                ) : (
                  <button
                    onClick={() => checkout.mutate(planId)}
                    disabled={checkout.isPending}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
                      planId === 'growth'
                        ? 'bg-brand-500 hover:bg-brand-600'
                        : 'bg-gray-800 hover:bg-gray-700 dark:bg-gray-600'
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…</>
                    ) : (
                      `Upgrade to ${plan.name} →`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="px-6 pb-5 text-center text-xs text-gray-400">
          Secure payment via Stripe. Cancel anytime. All prices per user per month.
        </p>
      </div>
    </div>
  );
}
