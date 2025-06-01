'use client';
import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { LeadFunnel } from '@/components/analytics/lead-funnel';
import { TicketVolumeChart } from '@/components/analytics/ticket-volume-chart';
import { KpiGrid } from '@/components/analytics/kpi-grid';
import { useAuthStore } from '@/stores/auth.store';
import { useAnalytics } from '@/hooks/use-analytics';

const PERIODS = ['Last 30 days', 'Last 90 days', 'Last 6 months', 'Last 12 months', 'All time'];

export default function AnalyticsPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [period, setPeriod] = useState('Last 12 months');

  const { data, isFetching, refetch } = useAnalytics(orgId);

  // data is always defined — placeholderData guarantees it
  const analytics = data!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Data Studio</h1>
          <p className="mt-1 text-sm text-gray-500">Unified metrics across all modules</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => void refetch()}
            title="Refresh analytics"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <KpiGrid kpis={analytics.kpis} isLoading={isFetching} />

      {/* Revenue chart */}
      <RevenueChart data={analytics.revenueChart} isLoading={isFetching} />

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadFunnel   funnel={analytics.leadFunnel}             isLoading={isFetching} />
        <TicketVolumeChart data={analytics.ticketVolume}        isLoading={isFetching} />
      </div>

      {/* Bottom note */}
      <p className="text-center text-xs text-gray-300 dark:text-gray-700">
        {isFetching
          ? 'Refreshing data…'
          : `Data refreshed every 5 minutes · All amounts in USD · Last updated ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
        }
      </p>
    </div>
  );
}
