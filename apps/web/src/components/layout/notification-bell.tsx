'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCheck, Trash2, X,
  UserPlus, MessageSquare, Ticket, FileText, TrendingUp,
  Calendar, Package, Info,
} from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/use-notifications';

// ── Date helpers (no external dep) ────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)    return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Type → icon + accent color ─────────────────────────────────────────────

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  task_assigned:  { icon: UserPlus,      color: 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' },
  task_comment:   { icon: MessageSquare, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  mention:        { icon: MessageSquare, color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
  ticket_update:  { icon: Ticket,        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  invoice_status: { icon: FileText,      color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  lead_status:    { icon: TrendingUp,    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  leave_approved: { icon: Calendar,      color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
  stock_low:      { icon: Package,       color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  system:         { icon: Info,          color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
};

function iconMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META['system']!;
}

// ── Notification item ─────────────────────────────────────────────────────

function NotifItem({
  n,
  onRead,
  onDelete,
  onClick,
}: {
  n:        Notification;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
  onClick:  (n: Notification) => void;
}) {
  const { icon: Icon, color } = iconMeta(n.type);
  const iconBg = color.split(' ').slice(1).join(' ');
  const iconFg = color.split(' ')[0];

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer ${!n.read ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}
      onClick={() => onClick(n)}
    >
      {/* Icon */}
      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconFg}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${n.read ? 'text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-white'}`}>
            {n.title}
          </p>
          {!n.read && (
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.body}</p>
        <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onRead(n.id); }}
            title="Mark as read"
            className="rounded p-1 text-gray-400 hover:text-brand-500"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
          title="Delete"
          className="rounded p-1 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function NotificationBell() {
  const router                    = useRouter();
  const [open, setOpen]           = useState(false);
  const ref                       = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotification } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.url) router.push(n.url);
    setOpen(false);
  };

  const today       = notifications.filter((n) => isToday(n.createdAt));
  const older       = notifications.filter((n) => !isToday(n.createdAt));

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-96 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Bell className="mb-3 h-8 w-8 text-gray-200 dark:text-gray-700" />
                <p className="text-sm font-medium text-gray-400">You&apos;re all caught up!</p>
                <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">No notifications yet.</p>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <>
                    <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Today</p>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {today.map((n) => (
                        <NotifItem
                          key={n.id}
                          n={n}
                          onRead={markRead}
                          onDelete={deleteNotification}
                          onClick={handleClick}
                        />
                      ))}
                    </div>
                  </>
                )}
                {older.length > 0 && (
                  <>
                    <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {today.length > 0 ? 'Earlier' : 'Recent'}
                    </p>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {older.map((n) => (
                        <NotifItem
                          key={n.id}
                          n={n}
                          onRead={markRead}
                          onDelete={deleteNotification}
                          onClick={handleClick}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
              <p className="text-center text-xs text-gray-400">
                Showing {notifications.length} most recent ·{' '}
                {notifications.length > 0 ? `Last: ${fmtTime(notifications[0]!.createdAt)}` : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function isToday(dateStr: string): boolean {
  const d    = new Date(dateStr);
  const now  = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth() &&
    d.getDate()     === now.getDate()
  );
}
