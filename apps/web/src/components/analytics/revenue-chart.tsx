'use client';
import { useState } from 'react';
import type { AnalyticsData } from '@/hooks/use-analytics';

function toPoints(values: number[], w: number, h: number, pad: number): string {
  const max = Math.max(...values, 1) * 1.1;
  return values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
      const y = pad + (1 - v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

function toArea(values: number[], w: number, h: number, pad: number): string {
  const pts   = toPoints(values, w, h, pad);
  const lastX = pad + w - pad * 2;
  const firstX = pad;
  return `${firstX},${h - pad} ${pts} ${lastX},${h - pad}`;
}

function formatK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
}

interface Props {
  data: AnalyticsData['revenueChart'];
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading = false }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const { months, revenue, expenses } = data;

  const W = 700, H = 240, PAD = 40;
  const maxVal   = Math.max(...revenue, ...expenses, 1) * 1.1;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const totalRevenue  = revenue.reduce((a, b) => a + b, 0);
  const totalExpenses = expenses.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue vs Expenses</h3>
          <p className="mt-0.5 text-xs text-gray-400">Last 12 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="text-gray-500">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="text-gray-500">Expenses</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full transition-opacity ${isLoading ? 'opacity-40' : ''}`}
        style={{ height: H }}
      >
        {/* Grid lines */}
        {gridLines.map((g) => {
          const y = PAD + (1 - g) * (H - PAD * 2);
          return (
            <g key={g}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 4" />
              <text x={PAD - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {formatK(maxVal * g)}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        <defs>
          <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="exp-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={toArea(revenue,  W, H, PAD)} fill="url(#rev-grad)" />
        <polygon points={toArea(expenses, W, H, PAD)} fill="url(#exp-grad)" />

        {/* Lines */}
        <polyline points={toPoints(revenue,  W, H, PAD)} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={toPoints(expenses, W, H, PAD)} fill="none" stroke="#fb7185" strokeWidth={2}   strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />

        {/* X-axis labels */}
        {months.map((m, i) => {
          const x = PAD + (i / Math.max(months.length - 1, 1)) * (W - PAD * 2);
          return (
            <text key={`${m}-${i}`} x={x} y={H - 8} textAnchor="middle" fontSize={10} fill="#9ca3af">
              {m}
            </text>
          );
        })}

        {/* Hover dots + tooltip */}
        {revenue.map((v, i) => {
          const x     = PAD + (i / Math.max(revenue.length - 1, 1)) * (W - PAD * 2);
          const y     = PAD + (1 - v / maxVal) * (H - PAD * 2);
          const expY  = PAD + (1 - (expenses[i] ?? 0) / maxVal) * (H - PAD * 2);
          const isHov = hoverIdx === i;
          return (
            <g key={i}>
              <rect
                x={x - 16} y={PAD} width={32} height={H - PAD * 2}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'crosshair' }}
              />
              {isHov && (
                <>
                  <line x1={x} y1={PAD} x2={x} y2={H - PAD} stroke="#6366f1" strokeWidth={1} strokeDasharray="3 2" opacity={0.4} />
                  <rect x={x - 56} y={PAD - 38} width={112} height={34} rx={8} fill="white" stroke="#e5e7eb" strokeWidth={1} />
                  <text x={x} y={PAD - 22} textAnchor="middle" fontSize={10} fontWeight="600" fill="#6366f1">
                    Rev {formatK(v)}
                  </text>
                  <text x={x} y={PAD - 9} textAnchor="middle" fontSize={10} fill="#fb7185">
                    Exp {formatK(expenses[i] ?? 0)}
                  </text>
                </>
              )}
              <circle cx={x} cy={y}    r={isHov ? 5 : 3.5} fill="#6366f1" stroke="white" strokeWidth={2} />
              <circle cx={x} cy={expY} r={isHov ? 4 : 2.5} fill="#fb7185" stroke="white" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>

      {/* Summary row */}
      <div className="mt-2 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        {[
          { label: 'Total Revenue',  value: `$${(totalRevenue  / 1000).toFixed(0)}k`, color: 'text-brand-600' },
          { label: 'Total Expenses', value: `$${(totalExpenses / 1000).toFixed(0)}k`, color: 'text-rose-500'  },
          { label: 'Net Profit',     value: `$${((totalRevenue - totalExpenses) / 1000).toFixed(0)}k`, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
