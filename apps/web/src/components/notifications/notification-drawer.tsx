'use client';
import { useRouter } from 'next/navigation';
import {
  Bell, BellOff, CheckCheck, X,
  CheckSquare, MessageSquare, AtSign, Headphones,
  FileText, TrendingUp, CalendarCheck, Package, Wifi, WifiOff, Info,
} from 'lucide-react';
import { useNotifications, type AppNotification, type NotificationType } from '@/hooks/use-notifications';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

/* ── Type → icon / colour map ──────────────────────────────────────────── */
const TYPE_CFG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  task_assigned:  { icon: CheckSquare,   color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/20'  },
  task_comment:   { icon: MessageSquare, color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20'    },
  mention:        { icon: AtSign,        color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/20'  },
  ticket_update:  { icon: Headphones,    color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20'     },
  invoice_status: { icon: FileText,      color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  lead_status:    { icon: TrendingUp,    color: 'text-green-500',   bg: 'bg-green-50 dark:bg-green-900/20'   },
  leave_approved: { icon: CalendarCheck, color: 'text-pink-500',    bg: 'bg-pink-50 dark:bg-pink-900/20'    },
  stock_low:      { icon: Package,       color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
  system:         { icon: Info,          color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-800'      },
};

const FALLBACK_CFG = TYPE_CFG.system;

/* ── Helpers ────────────────────────────────────────────────────────────── */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

/* ── Single item ────────────────────────────────────────────────────────── */
function NotificationItem({
  n,
  onRead,
  onDismiss,
  onNavigate,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const cfg = TYPE_CFG[n.type as NotificationType] ?? FALLBACK_CFG;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!n.read) onRead(n.id);
    if (n.url) onNavigate(n.url);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onClick={handleClick}
      className={cn(
        'group relative flex cursor-pointer gap-3 rounded-xl p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60',
        !n.read && 'bg-white shadow-sm dark:bg-gray-800',
        n.read && 'opacity-60',
      )}
    >
      <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
        <Icon className={cn('h-4 w-4', cfg.color)} />
      </div>

      <div className="flex-1 min-w-0 pr-5">
        <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{n.title}</p>
        {n.body && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{relativeTime(n.createdAt)}</p>
      </div>

      {/* Dismiss button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
        title="Dismiss"
        className="absolute right-2 top-2 rounded-md p-1 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover:opacity-100 dark:hover:text-gray-400"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Unread dot */}
      {!n.read && (
        <span className="absolute right-3 bottom-3 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-gray-900" />
      )}
    </div>
  );
}

/* ── Drawer ─────────────────────────────────────────────────────────────── */
export function NotificationDrawer() {
  const router = useRouter();
  const open  = useUiStore((s) => s.notificationsPanelOpen);
  const close = useUiStore((s) => s.closeNotificationsPanel);
  const { notifications, unreadCount, connected, markRead, markAllRead, dismiss } = useNotifications();

  if (!open) return null;

  const unread  = notifications.filter((n) => !n.read);
  const earlier = notifications.filter((n) => n.read);

  const handleNavigate = (url: string) => {
    close();
    router.push(url);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={close} />

      {/* Panel */}
      <div className="fixed right-4 top-16 z-50 flex h-[calc(100vh-80px)] w-96 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* SSE connection status */}
            <span
              title={connected ? 'Live — real-time updates active' : 'Disconnected — polling paused'}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                connected
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400',
              )}
            >
              {connected
                ? <Wifi className="h-3 w-3" />
                : <WifiOff className="h-3 w-3" />}
              <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
            </span>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Mark all as read"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={close}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <BellOff className="h-10 w-10 text-gray-200 dark:text-gray-700" />
              <div>
                <p className="text-sm font-medium text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400">No new notifications</p>
              </div>
            </div>
          ) : (
            <>
              {unread.length > 0 && (
                <>
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Unread
                  </p>
                  {unread.map((n) => (
                    <NotificationItem
                      key={n.id} n={n}
                      onRead={markRead} onDismiss={dismiss} onNavigate={handleNavigate}
                    />
                  ))}
                </>
              )}

              {earlier.length > 0 && (
                <>
                  <p className={cn(
                    'px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400',
                    unread.length > 0 ? 'pt-3' : 'pt-1',
                  )}>
                    Earlier
                  </p>
                  {earlier.map((n) => (
                    <NotificationItem
                      key={n.id} n={n}
                      onRead={markRead} onDismiss={dismiss} onNavigate={handleNavigate}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-center text-xs text-gray-400">
            {connected
              ? '● Real-time updates active'
              : '○ Reconnecting…'}
          </p>
        </div>
      </div>
    </>
  );
}
