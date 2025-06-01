'use client';
import { useState } from 'react';
import { Mail, Phone, Building2, Globe, Tag, Calendar, MessageSquare, CheckCircle2, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { SlideOver } from '@/components/shared/slide-over';
import { LeadStatusBadge } from '@/components/shared/status-badge';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  source: string;
  phone?: string;
  website?: string;
  notes?: string;
  createdAt?: string;
}

const ACTIVITY_LOG = [
  { id: '1', type: 'note', text: 'Left voicemail, will follow up next week.', author: 'Sarah Chen', time: '2 days ago' },
  { id: '2', type: 'email', text: 'Sent initial outreach email with product deck.', author: 'Alex Johnson', time: '5 days ago' },
  { id: '3', type: 'status', text: 'Status changed from New → Contacted', author: 'System', time: '5 days ago' },
  { id: '4', type: 'created', text: 'Lead created via Website form', author: 'System', time: '7 days ago' },
];

const ACTIVITY_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  note: { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  email: { icon: Mail, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  status: { icon: ArrowRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  created: { icon: CheckCircle2, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
};

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'disqualified'];

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onConvert?: (lead: Lead) => void;
}

export function LeadDetail({ lead, open, onClose, onConvert }: Props) {
  const [note, setNote] = useState('');
  const [localStatus, setLocalStatus] = useState(lead?.status ?? 'new');
  const [savingNote, setSavingNote] = useState(false);

  if (!lead) return null;

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingNote(false);
    setNote('');
  };

  const infoRows = [
    { icon: Mail, label: 'Email', value: lead.email, href: `mailto:${lead.email}` },
    { icon: Phone, label: 'Phone', value: lead.phone ?? '—' },
    { icon: Building2, label: 'Company', value: lead.company },
    { icon: Globe, label: 'Website', value: lead.website ?? '—', href: lead.website },
    { icon: Tag, label: 'Source', value: lead.source },
    { icon: Calendar, label: 'Created', value: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
  ];

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={lead.name}
      subtitle={lead.company}
      width="md"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
          <button
            onClick={() => onConvert?.(lead)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Convert to contact
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      }
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Status section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status</span>
              <LeadStatusBadge status={localStatus} />
            </div>
            <select
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info grid */}
        <div className="px-6 py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Contact Info</h4>
          <dl className="space-y-3">
            {infoRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 flex-shrink-0 text-gray-300" />
                  <span className="w-16 flex-shrink-0 text-xs font-medium text-gray-400">{row.label}</span>
                  {row.href && row.value !== '—' ? (
                    <a href={row.href} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
                      {row.value}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-700 dark:text-gray-300">{row.value}</span>
                  )}
                </div>
              );
            })}
          </dl>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div className="px-6 py-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Notes</h4>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{lead.notes}</p>
          </div>
        )}

        {/* Add note */}
        <div className="px-6 py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Add Note</h4>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Log a call, add context, or leave a follow-up note…"
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleAddNote}
              disabled={!note.trim() || savingNote}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {savingNote ? 'Saving…' : 'Add note'}
            </button>
          </div>
        </div>

        {/* Activity log */}
        <div className="px-6 py-4">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Activity</h4>
          <ol className="relative space-y-4 border-l border-gray-100 pl-4 dark:border-gray-800">
            {ACTIVITY_LOG.map((activity) => {
              const cfg = ACTIVITY_ICON[activity.type as keyof typeof ACTIVITY_ICON];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <li key={activity.id} className="relative">
                  <span className={`absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full ${cfg.color}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{activity.text}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{activity.author} · {activity.time}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </SlideOver>
  );
}
