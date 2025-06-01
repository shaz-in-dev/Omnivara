import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PlanLimits {
  users: number;
  storage_gb: number;
  api_calls_per_month: number;
  integrations: number;
  ai_credits_per_month: number;
}

export interface BillingUsage {
  planId: string;
  limits: PlanLimits;
  usage: {
    users: number;
    ai_credits_used: number;
    month: string;
  };
}

export interface Subscription {
  id: string;
  orgId: string;
  planId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  planId: string;
}

// ── Plans metadata (mirrors packages/config/src/plans.ts) ─────────────────────

export const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: 0,
    priceLabel: 'Free',
    description: 'Perfect for small teams getting started',
    color: 'gray',
    features: ['Up to 5 users', 'CRM & Projects', '10 GB storage', '100 AI credits/month'],
  },
  growth: {
    name: 'Growth',
    price: 49,
    priceLabel: '$49/user/mo',
    description: 'For growing teams that need more',
    color: 'brand',
    features: ['Up to 25 users', 'All modules incl. Finance & Helpdesk', '50 GB storage', '1,000 AI credits/month', 'Priority support'],
  },
  business: {
    name: 'Business',
    price: 99,
    priceLabel: '$99/user/mo',
    description: 'Advanced features for scaling companies',
    color: 'purple',
    features: ['Up to 100 users', 'HR & Inventory modules', '200 GB storage', '5,000 AI credits/month', 'Advanced analytics', 'SSO / SAML'],
  },
  enterprise: {
    name: 'Enterprise',
    price: -1,
    priceLabel: 'Custom',
    description: 'Unlimited scale with dedicated support',
    color: 'amber',
    features: ['Unlimited users', 'All modules', 'Unlimited storage', 'Unlimited AI', 'Custom integrations', 'SLA guarantee'],
  },
} as const;

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useSubscription() {
  return useQuery<SubscriptionResponse>({
    queryKey: ['billing', 'subscription'],
    queryFn: () => api.get('/billing/subscription').then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useBillingUsage() {
  return useQuery<BillingUsage>({
    queryKey: ['billing', 'usage'],
    queryFn: () => api.get('/billing/usage').then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (planId: string) =>
      api.post<{ url: string }>('/billing/checkout', { planId }).then((r) => r.data),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}

export function useCreatePortal() {
  return useMutation({
    mutationFn: () =>
      api.post<{ url: string }>('/billing/portal').then((r) => r.data),
    onSuccess: ({ url }) => {
      if (url) window.open(url, '_blank');
    },
  });
}
