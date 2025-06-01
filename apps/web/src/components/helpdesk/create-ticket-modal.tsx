'use client';
import { useState } from 'react';
import { X, Headphones, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateTicket } from '@/hooks/use-tickets';

/* ── Options ─────────────────────────────────────────────────────────────── */
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const CHANNELS   = ['EMAIL', 'CHAT', 'PHONE', 'PORTAL', 'API'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH:   'bg-amber-100 text-amber-600',
  URGENT: 'bg-red-100 text-red-600',
};

type Priority = typeof PRIORITIES[number];
type Channel  = typeof CHANNELS[number];

interface FormState {
  subject: string;
  description: string;
  priority: Priority;
  channel: Channel;
  contactName: string;
  contactEmail: string;
  tags: string;
}

interface Props {
  orgId: string;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
export function CreateTicketModal({ orgId, onClose, onCreated }: Props) {
  const createTicket = useCreateTicket(orgId);
  const [form, setForm] = useState<FormState>({
    subject: '', description: '', priority: 'MEDIUM', channel: 'EMAIL',
    contactName: '', contactEmail: '', tags: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      e.contactEmail = 'Enter a valid email';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const parsedTags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    try {
      await createTicket.mutateAsync({
        subject: form.subject.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        priority: form.priority.toLowerCase(),
        channel: form.channel,
        ...(form.contactName.trim() ? { contactName: form.contactName.trim() } : {}),
        ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
      });
      onCreated();
      onClose();
    } catch {
      // error handled by mutation — modal stays open
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <Headphones className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Ticket</h2>
              <p className="text-xs text-gray-500">Create a support request</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              placeholder="Brief description of the issue"
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-white',
                errors.subject ? 'border-red-400' : 'border-gray-200 dark:border-gray-700',
              )}
            />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Provide full details — steps to reproduce, expected vs actual behaviour…"
              className={cn(
                'w-full resize-none rounded-xl border px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-white',
                errors.description ? 'border-red-400' : 'border-gray-200 dark:border-gray-700',
              )}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Priority + Channel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('priority', p)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                      form.priority === p
                        ? PRIORITY_COLORS[p] + ' ring-2 ring-offset-1 ring-brand-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => set('channel', e.target.value as Channel)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Contact (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <input
                value={form.contactName}
                onChange={(e) => set('contactName', e.target.value)}
                placeholder="Full name"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div>
                <input
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-white',
                    errors.contactEmail ? 'border-red-400' : 'border-gray-200 dark:border-gray-700',
                  )}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags <span className="text-xs font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="auth, billing, urgent…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createTicket.isPending}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {createTicket.isPending ? 'Creating…' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
