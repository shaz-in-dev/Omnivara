import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

const variantStyles = {
  default: { icon: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400', trend: '' },
  success: { icon: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400', trend: '' },
  warning: { icon: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', trend: '' },
  danger:  { icon: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', trend: '' },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 h-9 w-9 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="mb-2 h-7 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  const trendColor =
    trend?.value && trend.value > 0
      ? 'text-green-600 dark:text-green-400'
      : trend?.value && trend.value < 0
        ? 'text-red-500 dark:text-red-400'
        : 'text-gray-400';

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', variantStyles[variant].icon)}>
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        </div>
        {trend && TrendIcon && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' && value >= 1000
          ? value.toLocaleString()
          : value}
      </div>
      <div className="mt-0.5 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</div>}
      {trend && <div className="mt-1 text-xs text-gray-400">{trend.label}</div>}
    </div>
  );
}
