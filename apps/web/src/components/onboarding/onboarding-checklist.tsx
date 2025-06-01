'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ChevronRight, Rocket } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLeads } from '@/hooks/use-leads';
import { usePipeline } from '@/hooks/use-opportunities';
import { useInvoices } from '@/hooks/use-invoices';
import { useTickets } from '@/hooks/use-tickets';
import { useMembers } from '@/hooks/use-members';

// ── Types ─────────────────────────────────────────────────────────────────────

const LS_KEY = 'omnivara-onboarding-v1';

interface OnboardingState {
  steps: {
    leads: boolean;
    pipeline: boolean;
    invoice: boolean;
    ticket: boolean;
    member: boolean;
  };
  dismissed: boolean;
}

const DEFAULT_STATE: OnboardingState = {
  steps: { leads: false, pipeline: false, invoice: false, ticket: false, member: false },
  dismissed: false,
};

function loadState(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { key: 'leads' as const,    label: 'Import your first leads',  href: '/crm/leads' },
  { key: 'pipeline' as const, label: 'Create your pipeline',      href: '/crm/pipeline' },
  { key: 'invoice' as const,  label: 'Send your first invoice',   href: '/finance' },
  { key: 'ticket' as const,   label: 'Open a support ticket',     href: '/helpdesk' },
  { key: 'member' as const,   label: 'Invite a teammate',         href: '/settings' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingChecklist() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.orgId ?? '';

  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);

  // Load localStorage on client
  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  // ── React Query data ───────────────────────────────────────────────────────
  const { data: leadsData } = useLeads({ orgId, limit: 1 });
  const { data: pipelineData } = usePipeline(orgId);
  const { data: invoicesData } = useInvoices({ orgId, limit: 1 });
  const { data: ticketsData } = useTickets({ orgId, limit: 1 });
  const { data: membersData } = useMembers(orgId);

  // Derive completion from real data and persist
  useEffect(() => {
    if (!mounted) return;

    const derived = {
      leads:    (leadsData?.items?.length ?? 0) > 0,
      pipeline: Array.isArray(pipelineData) && pipelineData.some((s) => s.opportunities.length > 0),
      invoice:  (invoicesData?.items?.length ?? 0) > 0,
      ticket:   (ticketsData?.items?.length ?? 0) > 0,
      member:   (membersData?.length ?? 0) > 1,
    };

    setState((prev) => {
      const next: OnboardingState = {
        ...prev,
        steps: {
          leads:    prev.steps.leads    || derived.leads,
          pipeline: prev.steps.pipeline || derived.pipeline,
          invoice:  prev.steps.invoice  || derived.invoice,
          ticket:   prev.steps.ticket   || derived.ticket,
          member:   prev.steps.member   || derived.member,
        },
      };
      saveState(next);
      return next;
    });
  }, [mounted, leadsData, pipelineData, invoicesData, ticketsData, membersData]);

  // ── Visibility guards ──────────────────────────────────────────────────────

  // Account age < 30 days
  const isNewUser = (() => {
    if (!user) return false;
    // user.createdAt should be available on the auth store user object
    const created = (user as { createdAt?: string }).createdAt;
    if (!created) return true; // assume new if unknown
    const age = Date.now() - new Date(created).getTime();
    return age < 30 * 24 * 60 * 60 * 1000;
  })();

  const allDone = Object.values(state.steps).every(Boolean);

  if (!mounted || state.dismissed || allDone || !isNewUser) return null;

  const completedCount = Object.values(state.steps).filter(Boolean).length;

  const handleDismiss = () => {
    const next: OnboardingState = { ...state, dismissed: true };
    setState(next);
    saveState(next);
  };

  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-indigo-50 p-5 shadow-sm dark:border-brand-800 dark:from-brand-950/40 dark:to-indigo-950/30">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <Rocket className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Get started with Omnivara
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Complete these steps to unlock your workspace
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss checklist"
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Steps */}
      <ul className="space-y-2">
        {STEPS.map(({ key, label, href }) => {
          const done = state.steps[key];
          return (
            <li key={key}>
              <button
                onClick={() => router.push(href)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60 dark:hover:bg-white/5"
              >
                {/* Checkbox */}
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                  }`}
                >
                  {done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>

                {/* Label */}
                <span
                  className={`flex-1 text-left text-sm ${
                    done
                      ? 'text-gray-400 line-through dark:text-gray-500'
                      : 'font-medium text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {label}
                </span>

                {/* Go arrow */}
                {!done && (
                  <span className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                    Go <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-3 dark:border-brand-900/40">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {completedCount} of {STEPS.length} complete
        </span>
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline dark:hover:text-gray-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
