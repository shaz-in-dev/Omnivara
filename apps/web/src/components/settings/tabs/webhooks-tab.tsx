'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const ALL_EVENTS = [
  'lead.created',        'lead.updated',       'lead.deleted',
  'contact.created',
  'opportunity.created', 'opportunity.won',    'opportunity.lost',
  'ticket.created',      'ticket.resolved',    'ticket.closed',
  'invoice.created',     'invoice.paid',
];

interface Webhook {
  id:        string;
  url:       string;
  events:    string[];
  secret:    string;
  active:    boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id:           string;
  event:        string;
  status:       string;
  statusCode:   number | null;
  attempts:     number;
  deliveredAt:  string | null;
  createdAt:    string;
}

export function WebhooksTab() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');

  const [webhooks,   setWebhooks]   = useState<Webhook[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  // Expanded delivery logs
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  const [loadingDel, setLoadingDel] = useState<string | null>(null);

  // Create form
  const [newUrl,    setNewUrl]    = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);

  // Secret reveal
  const [revealSecret, setRevealSecret] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data } = await api.get<Webhook[]>(`/orgs/${orgId}/webhooks`);
      setWebhooks(data);
    } catch {
      setError('Failed to load webhooks.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void fetchWebhooks(); }, [fetchWebhooks]);

  const handleCreate = async () => {
    if (!newUrl.trim() || newEvents.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      await api.post(`/orgs/${orgId}/webhooks`, { url: newUrl.trim(), events: newEvents });
      setShowCreate(false);
      setNewUrl('');
      setNewEvents([]);
      void fetchWebhooks();
    } catch {
      setError('Failed to create webhook.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook? Deliveries history will also be removed.')) return;
    setDeleting(id);
    try {
      await api.delete(`/orgs/${orgId}/webhooks/${id}`);
      setWebhooks((w) => w.filter((wh) => wh.id !== id));
    } catch {
      setError('Failed to delete webhook.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (deliveries[id]) return;
    setLoadingDel(id);
    try {
      const { data } = await api.get<WebhookDelivery[]>(`/orgs/${orgId}/webhooks/${id}/deliveries`);
      setDeliveries((d) => ({ ...d, [id]: data }));
    } catch {
      setDeliveries((d) => ({ ...d, [id]: [] }));
    } finally {
      setLoadingDel(null);
    }
  };

  const toggleEvent = (evt: string) => {
    setNewEvents((prev) =>
      prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt],
    );
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (status === 'failed')  return <XCircle      className="h-3.5 w-3.5 text-red-500"   />;
    return                           <Clock        className="h-3.5 w-3.5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Webhooks</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Receive HTTP POST events to your endpoint when things happen in Omnivara.
            Payloads are signed with HMAC-SHA256.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Webhook
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">New Webhook</h4>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Endpoint URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks/omnivara"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Subscribe to events <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {ALL_EVENTS.map((evt) => (
                  <label key={evt} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={newEvents.includes(evt)}
                      onChange={() => toggleEvent(evt)}
                      className="h-3.5 w-3.5 accent-brand-500"
                    />
                    <span className="font-mono text-gray-700 dark:text-gray-300">{evt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newUrl.trim() || newEvents.length === 0}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Webhook
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewUrl(''); setNewEvents([]); }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-14 dark:border-gray-700">
          <div className="mb-3 text-3xl">🔗</div>
          <p className="text-sm font-medium text-gray-500">No webhooks configured</p>
          <p className="mt-1 text-xs text-gray-400">Add a webhook to receive real-time event notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((hook) => (
            <div key={hook.id} className="rounded-xl border border-gray-200 dark:border-gray-800">
              {/* Header row */}
              <div className="flex items-center gap-3 p-4">
                <div className={`h-2 w-2 flex-shrink-0 rounded-full ${hook.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-mono text-sm text-gray-900 dark:text-white">{hook.url}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {hook.events.map((e) => (
                      <span key={e} className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRevealSecret(revealSecret === hook.id ? null : hook.id)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400"
                    title="Show signing secret"
                  >
                    Secret
                  </button>
                  <button
                    onClick={() => toggleExpand(hook.id)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 flex items-center gap-1"
                  >
                    Deliveries
                    {expanded === hook.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(hook.id)}
                    disabled={deleting === hook.id}
                    className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 transition-colors"
                  >
                    {deleting === hook.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Secret reveal */}
              {revealSecret === hook.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Signing Secret</p>
                  <p className="break-all font-mono text-xs text-gray-800 dark:text-gray-200">{hook.secret}</p>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Verify: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">X-Omnivara-Signature: sha256=&#123;HMAC-SHA256(secret, &quot;&#123;timestamp&#125;.&#123;body&#125;&quot;)&#125;</code>
                  </p>
                </div>
              )}

              {/* Deliveries panel */}
              {expanded === hook.id && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {loadingDel === hook.id ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : (deliveries[hook.id]?.length ?? 0) === 0 ? (
                    <p className="py-6 text-center text-xs text-gray-400">No deliveries yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {(deliveries[hook.id] ?? []).map((del) => (
                        <div key={del.id} className="flex items-center gap-3 px-4 py-2.5">
                          <StatusIcon status={del.status} />
                          <span className="w-32 flex-shrink-0 font-mono text-[11px] text-gray-600 dark:text-gray-400">{del.event}</span>
                          <span className="flex-1 text-[11px] text-gray-500">
                            {del.statusCode && `HTTP ${del.statusCode} · `}
                            {del.attempts} attempt{del.attempts !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {del.deliveredAt
                              ? format(new Date(del.deliveredAt), 'MMM d, HH:mm')
                              : format(new Date(del.createdAt), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Docs hint */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Signature Verification</p>
        <p>Every request includes <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">X-Omnivara-Signature</code> and <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">X-Omnivara-Timestamp</code> headers.
          Compute <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">HMAC-SHA256(secret, &ldquo;&#123;timestamp&#125;.&#123;body&#125;&rdquo;)</code> and compare. Failed deliveries are retried 3× with exponential backoff.</p>
      </div>
    </div>
  );
}
