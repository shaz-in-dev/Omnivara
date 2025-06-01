'use client';
import { useState } from 'react';
import { CreditCard, Users, Zap, CheckCircle2, AlertTriangle, ExternalLink, Loader2, ArrowUpRight } from 'lucide-react';
import {
  useSubscription,
  useBillingUsage,
  useCreateCheckout,
  useCreatePortal,
  PLAN_DETAILS,
} from '@/hooks/use-billing';
import { UpgradeModal } from '@/components/billing/upgrade-modal';
import { useSearchParams } from 'next/navigation';
import { useEmailVerified } from '@/hooks/use-email-verified';

function UsageMeter({
  label,
  used,
  limit,
  icon: Icon,
}: {
  label: string;
  used: number;
  limit: number;
  icon: React.ElementType;
}) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isWarning = !unlimited && pct >= 80;
  const isOver = !unlimited && pct >= 100;

  return (
    <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
          {unlimited ? (
            <span className="text-green-500">Unlimited</span>
          ) : (
            `${used.toLocaleString()} / ${limit.toLocaleString()}`
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${
              isOver ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-brand-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isWarning && !isOver && (
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
          ⚠ Approaching your plan limit
        </p>
      )}
      {isOver && (
        <p className="mt-1.5 text-xs text-red-500">
          ✕ Over limit — upgrade to continue
        </p>
      )}
    </div>
  );
}

export function BillingSettings() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { guardAction } = useEmailVerified();
  const searchParams = useSearchParams();
  const successParam = searchParams?.get('success');
  const canceledParam = searchParams?.get('canceled');

  const { data: subData, isLoading: subLoading } = useSubscription();
  const { data: usageData, isLoading: usageLoading } = useBillingUsage();
  const portal = useCreatePortal();
  const checkout = useCreateCheckout();

  const planId = subData?.planId ?? 'starter';
  const plan = PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS] ?? PLAN_DETAILS.starter;
  const sub = subData?.subscription;
  const isLoading = subLoading || usageLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Success / canceled banners */}
      {successParam === '1' && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Your plan has been upgraded successfully! Welcome to {plan.name}.
        </div>
      )}
      {canceledParam === '1' && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Checkout was canceled. Your plan hasn't changed.
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Current Plan</h3>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</span>
                {sub?.status === 'active' && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    Active
                  </span>
                )}
                {sub?.status === 'past_due' && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    Past due
                  </span>
                )}
                {sub?.status === 'trialing' && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                    Trial
                  </span>
                )}
                {!sub && planId === 'starter' && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700">
                    Free
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
              {sub?.currentPeriodEnd && (
                <p className="mt-1 text-xs text-gray-400">
                  {sub.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {plan.price > 0 ? (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.priceLabel}</span>
              ) : plan.price === 0 ? (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Free</span>
              ) : (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Custom</span>
              )}
            </div>
          </div>

          {/* Plan features */}
          <ul className="mt-4 grid grid-cols-2 gap-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                {f}
              </li>
            ))}
          </ul>

          {/* Action buttons */}
          <div className="mt-5 flex gap-2">
            {planId !== 'enterprise' && (
              <button
                onClick={() => guardAction(() => setShowUpgrade(true), 'Verify your email before upgrading your plan.')}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <ArrowUpRight className="h-4 w-4" />
                Upgrade plan
              </button>
            )}
            {sub && (
              <button
                onClick={() => portal.mutate()}
                disabled={portal.isPending}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {portal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage billing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage meters */}
      {usageData && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Usage this month</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <UsageMeter
              label="Team members"
              used={usageData.usage.users}
              limit={usageData.limits.users}
              icon={Users}
            />
            <UsageMeter
              label="AI credits"
              used={usageData.usage.ai_credits_used}
              limit={usageData.limits.ai_credits_per_month}
              icon={Zap}
            />
          </div>
        </div>
      )}

      {/* Plans comparison CTA */}
      {planId === 'starter' && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/10">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-800/30">
              <Zap className="h-5 w-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-200">
                Unlock the full platform
              </h4>
              <p className="mt-1 text-sm text-brand-700 dark:text-brand-300">
                Upgrade to Growth to add Finance, Helpdesk, and up to 25 team members. Starting at $49/user/month.
              </p>
              <button
                onClick={() => checkout.mutate('growth')}
                disabled={checkout.isPending}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {checkout.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…</>
                ) : (
                  'Start with Growth →'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing history note */}
      {sub && (
        <p className="text-center text-xs text-gray-400">
          View invoices, receipts, and update payment methods in the{' '}
          <button
            onClick={() => portal.mutate()}
            className="text-brand-500 hover:underline"
          >
            Stripe billing portal
          </button>
          .
        </p>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlanId={planId}
      />
    </div>
  );
}
