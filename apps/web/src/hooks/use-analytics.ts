import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Types (mirror backend AnalyticsData) ──────────────────────────────────────

export interface AnalyticsKpi {
  value: number;
  change: number;
  sparkline: number[];
  invertTrend?: boolean;
}

export interface AnalyticsData {
  kpis: {
    mrr: AnalyticsKpi;
    newCustomers: AnalyticsKpi;
    pipelineValue: AnalyticsKpi;
    winRate: AnalyticsKpi;
    avgDealSize: AnalyticsKpi;
    avgResolutionHours: AnalyticsKpi;
  };
  revenueChart: {
    months: string[];
    revenue: number[];
    expenses: number[];
  };
  leadFunnel: Array<{
    label: string;
    count: number;
    value: number;
  }>;
  ticketVolume: {
    weeks: string[];
    opened: number[];
    resolved: number[];
  };
}

// ── Placeholder (shown during initial load only) ──────────────────────────────

const ZERO_KPI: AnalyticsKpi = { value: 0, change: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] };
const ZERO_12 = Array<number>(12).fill(0);

export const ANALYTICS_PLACEHOLDER: AnalyticsData = {
  kpis: {
    mrr:                { ...ZERO_KPI },
    newCustomers:       { ...ZERO_KPI },
    pipelineValue:      { ...ZERO_KPI },
    winRate:            { ...ZERO_KPI },
    avgDealSize:        { ...ZERO_KPI },
    avgResolutionHours: { ...ZERO_KPI, invertTrend: true },
  },
  revenueChart: {
    months:   ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'],
    revenue:  ZERO_12,
    expenses: ZERO_12,
  },
  leadFunnel: [
    { label: 'Leads',       count: 0, value: 0 },
    { label: 'Contacted',   count: 0, value: 0 },
    { label: 'Qualified',   count: 0, value: 0 },
    { label: 'Proposal',    count: 0, value: 0 },
    { label: 'Negotiation', count: 0, value: 0 },
    { label: 'Closed Won',  count: 0, value: 0 },
  ],
  ticketVolume: {
    weeks:    Array.from({ length: 12 }, (_, i) => `W${i + 1}`),
    opened:   ZERO_12,
    resolved: ZERO_12,
  },
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnalytics(orgId: string) {
  return useQuery({
    queryKey: ['analytics', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ data: AnalyticsData }>(`/orgs/${orgId}/analytics`);
      return data.data;
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000, // 5 min — analytics can be slightly stale
    placeholderData: ANALYTICS_PLACEHOLDER,
  });
}
