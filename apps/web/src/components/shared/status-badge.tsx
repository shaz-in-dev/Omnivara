import { cn } from '@/lib/utils';

type Variant = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const variantCls: Record<Variant, string> = {
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  blue:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  green:  'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  red:    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

const dotCls: Record<Variant, string> = {
  gray:   'bg-gray-400',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

export function StatusBadge({ label, variant = 'gray', dot = false, size = 'md', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantCls[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotCls[variant])} />}
      {label}
    </span>
  );
}

// Pre-configured ticket status badges
export function TicketStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    OPEN:        { label: 'Open',        variant: 'blue' },
    IN_PROGRESS: { label: 'In Progress', variant: 'orange' },
    WAITING:     { label: 'Waiting',     variant: 'yellow' },
    RESOLVED:    { label: 'Resolved',    variant: 'green' },
    CLOSED:      { label: 'Closed',      variant: 'gray' },
  };
  const cfg = map[status] ?? { label: status, variant: 'gray' as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} dot />;
}

export function TicketPriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    LOW:    { label: 'Low',    variant: 'gray' },
    MEDIUM: { label: 'Medium', variant: 'blue' },
    HIGH:   { label: 'High',   variant: 'orange' },
    URGENT: { label: 'Urgent', variant: 'red' },
  };
  const cfg = map[priority] ?? { label: priority, variant: 'gray' as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} />;
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    DRAFT:     { label: 'Draft',     variant: 'gray' },
    SENT:      { label: 'Sent',      variant: 'blue' },
    PAID:      { label: 'Paid',      variant: 'green' },
    OVERDUE:   { label: 'Overdue',   variant: 'red' },
    CANCELLED: { label: 'Cancelled', variant: 'gray' },
    REFUNDED:  { label: 'Refunded',  variant: 'purple' },
  };
  const cfg = map[status] ?? { label: status, variant: 'gray' as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} dot />;
}

export function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    NEW:         { label: 'New',         variant: 'blue' },
    CONTACTED:   { label: 'Contacted',   variant: 'purple' },
    QUALIFIED:   { label: 'Qualified',   variant: 'green' },
    UNQUALIFIED: { label: 'Unqualified', variant: 'red' },
    CONVERTED:   { label: 'Converted',   variant: 'gray' },
  };
  const cfg = map[status] ?? { label: status, variant: 'gray' as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} dot />;
}
