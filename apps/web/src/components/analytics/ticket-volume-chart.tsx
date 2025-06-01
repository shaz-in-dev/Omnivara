'use client';
import { useState } from 'react';
import type { AnalyticsData } from '@/hooks/use-analytics';

interface Props {
  data: AnalyticsData['ticketVolume'];
  isLoading?: boolean;
}

export function TicketVolumeChart({ data, isLoading = false }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const { weeks, opened, resolved } = data;

  const maxVal  = Math.max(...opened, ...resolved, 1) * 1.15;
  const W = 580, H = 180, PAD_X = 30, PAD_Y = 20;
  const barGroupW = (W - PAD_X * 2) / Math.max(weeks.length, 1);
  const barW      = barGroupW * 0.36;

  const totalOpened   = opened.reduce((a, b) => a + b, 0);
  const totalResolved = resolved.reduce((a, b) => a + b, 0);
  const resolutionRate = totalOpened > 0
    ? ((totalResolved / totalOpened) * 100).toFixed(0)
    : '0';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ticket Volume</h3>
          <p className="mt-0.5 text-xs text-gray-400">Last 12 weeks</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
            <span className="text-gray-500">Opened</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-green-400" />
            <span className="text-gray-500">Resolved</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full transition-opacity ${isLoading ? 'opacity-40' : ''}`}
        style={{ height: H }}
      >
        {/* Grid */}
        {[0, 0.5, 1].map((g) => {
          const y = PAD_Y + (1 - g) * (H - PAD_Y * 2);
          return (
            <g key={g}>
              <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              {g > 0 && (
                <text x={PAD_X - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#d1d5db">
                  {Math.round(maxVal * g)}
                </text>
              )}
            </g>
          );
        })}

        {weeks.map((week, i) => {
          const groupX    = PAD_X + i * barGroupW + barGroupW / 2;
          const openedH   = ((opened[i] ?? 0) / maxVal) * (H - PAD_Y * 2);
          const resolvedH = ((resolved[i] ?? 0) / maxVal) * (H - PAD_Y * 2);
          const openedY   = H - PAD_Y - openedH;
          const resolvedY = H - PAD_Y - resolvedH;
          const isHov     = hoverIdx === i;

          return (
            <g
              key={week}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Opened bar */}
              <rect
                x={groupX - barW - 1}
                y={openedY} width={barW} height={openedH}
                rx={3}
                fill={isHov ? '#f87171' : '#fca5a5'}
              />
              {/* Resolved bar */}
              <rect
                x={groupX + 1}
                y={resolvedY} width={barW} height={resolvedH}
                rx={3}
                fill={isHov ? '#4ade80' : '#86efac'}
              />
              {/* X label */}
              <text x={groupX} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
                {week}
              </text>

              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect x={groupX - 40} y={PAD_Y - 2} width={80} height={30} rx={6} fill="white" stroke="#e5e7eb" strokeWidth={1} />
                  <text x={groupX} y={PAD_Y + 10} textAnchor="middle" fontSize={9} fill="#ef4444">
                    ↑ {opened[i]} opened
                  </text>
                  <text x={groupX} y={PAD_Y + 22} textAnchor="middle" fontSize={9} fill="#22c55e">
                    ↓ {resolved[i]} resolved
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className={`mt-2 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-center dark:border-gray-800 transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-white">{totalOpened}</p>
          <p className="text-xs text-gray-400">Tickets opened</p>
        </div>
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-white">{totalResolved}</p>
          <p className="text-xs text-gray-400">Resolved</p>
        </div>
        <div>
          <p className="text-base font-bold text-green-600">{resolutionRate}%</p>
          <p className="text-xs text-gray-400">Resolution rate</p>
        </div>
      </div>
    </div>
  );
}
