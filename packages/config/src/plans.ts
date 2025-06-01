/** Omnivara plan definitions and module access rules */

export type PlanId = 'starter' | 'growth' | 'business' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  modules: string[];
  limits: {
    users: number;
    storage_gb: number;
    api_calls_per_month: number;
    integrations: number;
    ai_credits_per_month: number;
  };
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    modules: ['crm', 'projects'],
    limits: { users: 5, storage_gb: 10, api_calls_per_month: 10000, integrations: 3, ai_credits_per_month: 100 },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    modules: ['crm', 'projects', 'helpdesk', 'finance', 'analytics', 'ai'],
    limits: { users: 25, storage_gb: 50, api_calls_per_month: 100000, integrations: 10, ai_credits_per_month: 1000 },
  },
  business: {
    id: 'business',
    name: 'Business',
    modules: ['crm', 'projects', 'helpdesk', 'finance', 'hr', 'inventory', 'analytics', 'ai'],
    limits: { users: 100, storage_gb: 200, api_calls_per_month: 500000, integrations: 25, ai_credits_per_month: 5000 },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    modules: ['crm', 'projects', 'helpdesk', 'finance', 'hr', 'inventory', 'analytics', 'ai'],
    limits: { users: -1, storage_gb: -1, api_calls_per_month: -1, integrations: -1, ai_credits_per_month: -1 },
  },
};
