'use client';
import { useState } from 'react';
import { Send, User, Clock, Tag, Link2, CheckCircle2 } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/shared/status-badge';
import { SlideOver } from '@/components/shared/slide-over';
import { cn } from '@/lib/utils';
import { useTicketReplies, useCreateTicketReply } from '@/hooks/use-ticket-replies';
import type { Ticket } from './ticket-list';

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
  orgId: string;
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function TicketDetail({ orgId, ticket, open, onClose }: Props) {
  const [reply, setReply] = useState('');

  const { data: replies = [], isLoading: repliesLoading } = useTicketReplies(orgId, ticket?.id ?? '');
  const createReply = useCreateTicketReply(orgId);

  const handleSend = async () => {
    if (!reply.trim() || !ticket) return;
    await createReply.mutateAsync({ ticketId: ticket.id, body: reply.trim(), isAgent: true });
    setReply('');
  };

  if (!ticket) return null;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={ticket.subject}
      subtitle={`${ticket.id} · ${ticket.channel}`}
      width="lg"
      footer={
        <div className="space-y-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply… (Shift+Enter for new line)"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
                Use template
              </button>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
                📎 Attach
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve
              </button>
              <button
                onClick={() => void handleSend()}
                disabled={!reply.trim() || createReply.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {createReply.isPending ? 'Sending…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex h-full">
        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Ticket meta */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            {ticket.slaBreachAt && (
              <div className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-900/20">
                <Clock className="h-3 w-3" />
                SLA: {new Date(ticket.slaBreachAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {ticket.tags?.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 dark:bg-gray-800">
                <Tag className="h-3 w-3" />{tag}
              </span>
            ))}
          </div>

          {/* Replies */}
          {repliesLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
            </div>
          ) : replies.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">No replies yet. Send the first reply below.</p>
            </div>
          ) : (
            replies.map((r) => (
              <div key={r.id} className={cn('flex gap-3', r.isAgent && 'flex-row-reverse')}>
                <div className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  r.isAgent ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800',
                )}>
                  {r.authorName.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()}
                </div>
                <div className={cn('flex-1 max-w-[80%]', r.isAgent && 'items-end flex flex-col')}>
                  <div className={cn(
                    'rounded-2xl px-4 py-3 text-sm',
                    r.isAgent
                      ? 'rounded-tr-sm bg-brand-50 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100'
                      : 'rounded-tl-sm bg-white border border-gray-200 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
                  )}>
                    {r.body}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium">{r.authorName}</span>
                    <span>·</span>
                    <span>{relTime(r.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 border-l border-gray-100 bg-gray-50/50 p-4 space-y-5 dark:border-gray-800 dark:bg-gray-900/50">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Assignee</p>
            {ticket.assigneeName ? (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {ticket.assigneeName.split(' ').map(n => n[0] ?? '').join('').slice(0, 2)}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.assigneeName}</span>
              </div>
            ) : (
              <button className="w-full rounded-lg border border-dashed border-gray-200 py-1.5 text-xs text-gray-400 hover:border-brand-300 dark:border-gray-700">
                + Assign
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</p>
            {ticket.contactName ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.contactName}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No contact linked</span>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Details</p>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Channel</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{ticket.channel}</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{relTime(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Replies</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{replies.length}</span>
              </div>
            </div>
          </div>

          <div>
            <button className="flex w-full items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              <Link2 className="h-3.5 w-3.5" />
              Link opportunity
            </button>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
