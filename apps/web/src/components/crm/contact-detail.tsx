'use client';
import { useState } from 'react';
import { Mail, Phone, Building2, Briefcase, MessageSquare, Calendar, Edit2, Trash2 } from 'lucide-react';
import { SlideOver } from '@/components/shared/slide-over';
import { useActivities, useCreateActivity, type ApiActivity } from '@/hooks/use-activities';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  title?: string | null;
  /** account.name convenience field — may be populated from API join */
  company?: string | null;
  account?: { id: string; name: string } | null;
  notes?: string | null;
  createdAt?: string;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  email:   Mail,
  meeting: Calendar,
  note:    MessageSquare,
  call:    Phone,
  task:    MessageSquare,
  other:   MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  email:   'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  meeting: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  note:    'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  call:    'text-green-500 bg-green-50 dark:bg-green-900/20',
  task:    'text-rose-500 bg-rose-50 dark:bg-rose-900/20',
  other:   'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

interface Props {
  orgId: string;
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
}

function Avatar({ contact }: { contact: Contact }) {
  const initials = contact.name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-lg font-bold text-white">
      {initials}
    </div>
  );
}

export function ContactDetail({ orgId, contact, open, onClose }: Props) {
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  const { data: activities = [], isLoading: activitiesLoading } = useActivities({
    orgId,
    contactId: contact?.id,
  });
  const createActivity = useCreateActivity(orgId);

  if (!contact) return null;

  const fullName = contact.name;
  const companyName = contact.company ?? contact.account?.name ?? null;

  const handleAddNote = async () => {
    if (!note.trim()) return;
    await createActivity.mutateAsync({
      type: 'note',
      subject: note.trim().slice(0, 100),
      body: note.trim(),
      contactId: contact.id,
    });
    setNote('');
  };

  const infoRows = [
    { icon: Mail, label: 'Email', value: contact.email ?? '—', href: contact.email ? `mailto:${contact.email}` : undefined },
    { icon: Phone, label: 'Phone', value: contact.phone ?? '—' },
    { icon: Briefcase, label: 'Title', value: contact.title ?? '—' },
    { icon: Building2, label: 'Company', value: companyName ?? '—' },
    {
      icon: Calendar,
      label: 'Added',
      value: contact.createdAt
        ? new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '—',
    },
  ];

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={fullName}
      subtitle={[contact.title, companyName].filter(Boolean).join(' at ') || 'Contact'}
      width="md"
      footer={
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
            <Mail className="h-3.5 w-3.5" />
            Send email
          </button>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      }
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Profile header */}
        <div className="flex items-center gap-4 px-6 py-5">
          <Avatar contact={contact} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{fullName}</h3>
            {contact.title && (
              <p className="text-sm text-gray-500">{contact.title}</p>
            )}
            {companyName && (
              <p className="text-sm text-gray-400">{companyName}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100 px-6 dark:border-gray-800">
          {(['details', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`-mb-px border-b-2 px-1 pb-3 pt-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              } mr-4`}
            >
              {tab}
              {tab === 'activity' && activities.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] dark:bg-gray-800">
                  {activities.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <>
            {/* Info grid */}
            <div className="px-6 py-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Details</h4>
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
                        <span className={`text-sm ${row.value === '—' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                          {row.value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* Notes */}
            {contact.notes && (
              <div className="px-6 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Notes</h4>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{contact.notes}</p>
              </div>
            )}

            {/* Linked opportunities placeholder */}
            <div className="px-6 py-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Linked Opportunities</h4>
              <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center dark:border-gray-700">
                <p className="text-sm text-gray-400">No opportunities linked yet</p>
                <button className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  + Link opportunity
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <>
            {/* Add note */}
            <div className="px-6 py-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Log a call, meeting, or note…"
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => void handleAddNote()}
                  disabled={!note.trim() || createActivity.isPending}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {createActivity.isPending ? 'Saving…' : 'Log activity'}
                </button>
              </div>
            </div>

            {/* Activity feed */}
            <div className="px-6 py-4">
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No activity yet. Log the first one above.</p>
              ) : (
                <ol className="relative space-y-5 border-l border-gray-100 pl-5 dark:border-gray-800">
                  {(activities as ApiActivity[]).map((act) => {
                    const Icon = ACTIVITY_ICONS[act.type] ?? MessageSquare;
                    const colorClass = ACTIVITY_COLORS[act.type] ?? 'text-gray-500 bg-gray-50';
                    return (
                      <li key={act.id} className="relative">
                        <span className={`absolute -left-7 flex h-5 w-5 items-center justify-center rounded-full ${colorClass}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{act.subject}</p>
                        {act.body && act.body !== act.subject && (
                          <p className="mt-0.5 text-xs text-gray-500 italic">{act.body}</p>
                        )}
                        <p className="mt-0.5 text-xs text-gray-400">
                          {act.user?.name ?? 'Unknown'} · {relTime(act.createdAt)}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </>
        )}
      </div>
    </SlideOver>
  );
}
