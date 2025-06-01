'use client';
import { useState, useEffect } from 'react';
import {
  Search, Filter, Clock, MessageSquare, Plus,
  CheckSquare, Square, CheckCheck, UserPlus, Archive, Trash2, CheckCircle2,
} from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  channel: string;
  contactName?: string;
  assigneeName?: string;
  slaBreachAt?: string;
  createdAt: string;
  updatedAt: string;
  repliesCount?: number;
  tags?: string[];
}


const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'];
const CHANNELS_ICON: Record<string, string> = { EMAIL: '📧', CHAT: '💬', PHONE: '📞', PORTAL: '🌐', API: '⚙️' };

function slaCountdown(breachAt: string): string {
  const ms = new Date(breachAt).getTime() - Date.now();
  if (ms <= 0) return 'Breached';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  /** Real tickets from API — passed from the parent page */
  tickets?: Ticket[];
  isLoading?: boolean;
  onSelect?: (ticket: Ticket) => void;
  onNew?: () => void;
}

export function TicketList({ tickets: ticketsProp = [], isLoading = false, onSelect, onNew }: Props) {
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [localTickets, setLocalTickets] = useState<Ticket[]>(ticketsProp);

  // Sync when upstream data changes (API refetch)
  useEffect(() => {
    setLocalTickets(ticketsProp);
    setSelected(new Set());
  }, [ticketsProp]);

  const allTickets = localTickets;

  const filtered = allTickets.filter((t) => {
    const matchStatus = activeStatus === 'ALL' || t.status === activeStatus;
    const matchSearch =
      !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.contactName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkAssign = () => {
    // TODO: open assign modal
    alert(`Assign ${selected.size} tickets`);
  };

  const bulkClose = () => {
    setLocalTickets((prev) =>
      prev.map((t) => selected.has(t.id) ? { ...t, status: 'CLOSED' } : t),
    );
    setSelected(new Set());
  };

  const bulkDelete = () => {
    setLocalTickets((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search + filter bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3 dark:border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4 dark:border-gray-800">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors',
              activeStatus === s
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
              {s === 'ALL' ? allTickets.length : allTickets.filter((t) => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 border-b border-brand-100 bg-brand-50 px-6 py-2.5 dark:border-brand-900/30 dark:bg-brand-900/10">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
            {selected.size} selected
          </span>
          <div className="h-4 w-px bg-brand-200" />
          <button
            onClick={bulkAssign}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-900/20"
          >
            <UserPlus className="h-3.5 w-3.5" /> Assign
          </button>
          <button
            onClick={bulkClose}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-brand-100 dark:text-gray-400"
          >
            <Archive className="h-3.5 w-3.5" /> Close
          </button>
          <button
            onClick={bulkDelete}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <div className="ml-auto">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Select-all header */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50 px-6 py-2 dark:border-gray-800 dark:bg-gray-800/40">
          <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
            {allSelected
              ? <CheckCheck className="h-4 w-4 text-brand-500" />
              : someSelected
                ? <CheckSquare className="h-4 w-4 text-brand-300" />
                : <Square className="h-4 w-4" />
            }
          </button>
          <span className="text-xs font-medium text-gray-400">
            {allSelected ? 'Deselect all' : 'Select all'}
          </span>
        </div>
      )}

      {/* Ticket rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {isLoading && (
          <div className="flex h-40 items-center justify-center gap-2 text-gray-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="text-sm">Loading tickets…</span>
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          search || activeStatus !== 'ALL' ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
              No tickets match your filter.
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8" />}
              title="No open tickets"
              description="Your support inbox is clear. Great job!"
              {...(onNew ? { action: { label: '+ Create a ticket', onClick: onNew, icon: <Plus className="h-4 w-4" /> } } : {})}
            />
          )
        )}
        {filtered.map((ticket) => {
          const isBreaching = ticket.slaBreachAt && new Date(ticket.slaBreachAt).getTime() - Date.now() < 3_600_000;
          const isSelected = selected.has(ticket.id);
          return (
            <div
              key={ticket.id}
              className={cn(
                'flex w-full items-start gap-4 px-6 py-4 transition-colors',
                isSelected ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
              )}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleOne(ticket.id); }}
                className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-brand-500"
              >
                {isSelected
                  ? <CheckSquare className="h-4 w-4 text-brand-500" />
                  : <Square className="h-4 w-4" />
                }
              </button>

              {/* Channel icon */}
              <button
                className="flex flex-1 items-start gap-4 text-left"
                onClick={() => onSelect?.(ticket)}
              >
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm dark:bg-gray-800">
                  {CHANNELS_ICON[ticket.channel] ?? '📋'}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">{ticket.id}</span>
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                    {ticket.tags?.map((tag) => (
                      <span key={tag} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                    {ticket.subject}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                    {ticket.contactName && <span>{ticket.contactName}</span>}
                    {ticket.assigneeName && <span>→ {ticket.assigneeName}</span>}
                    {ticket.repliesCount ? (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {ticket.repliesCount}
                      </span>
                    ) : null}
                    <span>{relTime(ticket.updatedAt)}</span>
                  </div>
                </div>
              </button>

              {/* SLA */}
              {ticket.slaBreachAt && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                <div className={cn(
                  'flex-shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium',
                  isBreaching ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20',
                )}>
                  <Clock className="h-3 w-3" />
                  {slaCountdown(ticket.slaBreachAt)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
