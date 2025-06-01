'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TicketList, type Ticket } from '@/components/helpdesk/ticket-list';
import { TicketDetail } from '@/components/helpdesk/ticket-detail';
import { CreateTicketModal } from '@/components/helpdesk/create-ticket-modal';
import { useAuthStore } from '@/stores/auth.store';
import { useTickets, type ApiTicket } from '@/hooks/use-tickets';
import { SampleDataBanner } from '@/components/onboarding/sample-data-banner';

// ── Normalization: API (lowercase) → UI (uppercase) ───────────────────────────

function toUITicket(t: ApiTicket): Ticket {
  const statusMap: Record<string, string> = {
    open:     'OPEN',
    pending:  'IN_PROGRESS',
    on_hold:  'WAITING',
    resolved: 'RESOLVED',
    closed:   'CLOSED',
  };
  const priorityMap: Record<string, string> = {
    low:    'LOW',
    medium: 'MEDIUM',
    high:   'HIGH',
    urgent: 'URGENT',
  };
  return {
    id: t.id,
    subject: t.subject,
    status: statusMap[t.status] ?? t.status.toUpperCase(),
    priority: priorityMap[t.priority] ?? t.priority.toUpperCase(),
    channel: t.channel.toUpperCase(),
    ...(t.contactName ? { contactName: t.contactName } : {}),
    ...(t.assigneeName ? { assigneeName: t.assigneeName } : {}),
    ...(t.slaBreachAt ? { slaBreachAt: t.slaBreachAt } : {}),
    ...(t.tags.length > 0 ? { tags: t.tags } : {}),
    repliesCount: t.repliesCount,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HelpdeskPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, refetch } = useTickets({ orgId });
  const apiTickets = data?.items ?? [];
  const uiTickets: Ticket[] = apiTickets.map(toUITicket);

  // SLA breach count (tickets where slaBreachAt is within 1h and not resolved/closed)
  const breachingCount = uiTickets.filter((t) => {
    if (!t.slaBreachAt) return false;
    if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
    return new Date(t.slaBreachAt).getTime() - Date.now() < 3_600_000;
  }).length;

  const handleSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailOpen(true);
  };

  return (
    <div className="flex h-full flex-col -m-6">
      {/* Sample data banner */}
      <div className="px-6 pt-4">
        <SampleDataBanner />
      </div>

      {/* Sticky header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Helpdesk</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${data?.total ?? 0} ticket${(data?.total ?? 0) !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {breachingCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 dark:bg-red-900/20">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {breachingCount} breaching SLA
            </div>
          )}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        </div>
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-hidden">
        <TicketList
          tickets={uiTickets}
          isLoading={isLoading}
          onSelect={handleSelect}
          onNew={() => setCreateOpen(true)}
        />
      </div>

      {/* Ticket detail slide-over */}
      <TicketDetail
        orgId={orgId}
        ticket={selectedTicket}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Create ticket modal */}
      {createOpen && (
        <CreateTicketModal
          orgId={orgId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => void refetch()}
        />
      )}
    </div>
  );
}
