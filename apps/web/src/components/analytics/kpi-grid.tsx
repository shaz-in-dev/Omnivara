'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AnalyticsData } from '@/hooks/use-analytics';

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function fmtNumber(n: number)  { return n.toLocaleString(); }
function fmtPct(n: number)     { return `${n.toFixed(1)}%`; }
function fmtHours(n: number)   { return `${n.toFixed(1)}h`; }
function fmtDeal(n: number)    { return fmtCurrency(n); }

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  const min   = Math.min(...values);
  const max   = Math.max(...values);
  const range = max - min || 1;
  const W = 64, H = 24;

  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * W;
    const y = H - ((v - min) / range) * H * 0.8 - H * 0.1;
    return `${x},${y}`;
  }).join(' ');

  const last = values[values.length - 1] ?? 0;
  const lastX = W;
  const lastY = H - ((last - min) / range) * H * 0.8 - H * 0.1;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill="#6366f1" />
    </svg>
  );
}

// ── KPI card config ───────────────────────────────────────────────────────────

interface KpiCardConfig {
  label: string;
  value: string;
  change: number;
  period: string;
  spark: number[];
  invertTrend?: boolean;
}

function buildKpiCards(kpis: AnalyticsData['kpis']): KpiCardConfig[] {
  return [
    {
      label: 'MRR',
      value: fmtCurrency(kpis.mrr.value),
      change: kpis.mrr.change,
      period: 'vs last month',
      spark: kpis.mrr.sparkline,
    },
    {
      label: 'New Customers',
      value: fmtNumber(kpis.newCustomers.value),
      change: kpis.newCustomers.change,
      period: 'vs last month',
      spark: kpis.newCustomers.sparkline,
    },
    {
      label: 'Pipeline Value',
      value: fmtCurrency(kpis.pipelineValue.value),
      change: kpis.pipelineValue.change,
      period: 'vs last month',
      spark: kpis.pipelineValue.sparkline,
    },
    {
      label: 'Avg Deal Size',
      value: fmtDeal(kpis.avgDealSize.value),
      change: kpis.avgDealSize.change,
      period: 'vs last month',
      spark: kpis.avgDealSize.sparkline,
    },
    {
      label: 'Avg Resolution Time',
      value: fmtHours(kpis.avgResolutionHours.value),
      change: kpis.avgResolutionHours.change,
      period: 'vs last month',
      spark: kpis.avgResolutionHours.sparkline,
      invertTrend: true,
    },
    {
      label: 'Win Rate',
      value: fmtPct(kpis.winRate.value),
      change: kpis.winRate.change,
      period: 'vs last month',
      spark: kpis.winRate.sparkline,
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  kpis: AnalyticsData['kpis'];
  isLoading?: boolean;
}

export function KpiGrid({ kpis, isLoading = false }: Props) {
  const cards = buildKpiCards(kpis);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Key Performance Indicators</h3>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((kpi) => {
          const isPositive = kpi.invertTrend ? kpi.change < 0 : kpi.change > 0;
          const isNeutral  = kpi.change === 0;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-xs font-medium text-gray-400">{kpi.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <p className={`text-xl font-bold text-gray-900 dark:text-white transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
                  {kpi.value}
                </p>
                <Sparkline values={kpi.spark} />
              </div>
              <div className="mt-2 flex items-center gap-1">
                {isNeutral ? (
                  <Minus className="h-3 w-3 text-gray-400" />
                ) : isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : isNeutral ? 'text-gray-400' : 'text-red-500'}`}>
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </span>
                <span className="text-xs text-gray-400">{kpi.period}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
