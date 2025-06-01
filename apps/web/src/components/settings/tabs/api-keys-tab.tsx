'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Copy, Eye, EyeOff, Loader2, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface ApiKey {
  id:        string;
  name:      string;
  prefix:    string;
  lastUsed:  string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
}

interface NewKeyResult {
  key:       string;
  id:        string;
  prefix:    string;
  name:      string;
  createdAt: string;
}

export function ApiKeysTab() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');

  const [keys,    setKeys]    = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [newExpiry,  setNewExpiry]  = useState('');
  const [creating,   setCreating]   = useState(false);

  const [createdKey, setCreatedKey] = useState<NewKeyResult | null>(null);
  const [keyCopied,  setKeyCopied]  = useState(false);
  const [showKey,    setShowKey]    = useState(false);
  const [revoking,   setRevoking]   = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data } = await api.get<ApiKey[]>(`/orgs/${orgId}/api-keys`);
      setKeys(data);
    } catch {
      setError('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const { data } = await api.post<NewKeyResult>(`/orgs/${orgId}/api-keys`, {
        name:      newName.trim(),
        expiresAt: newExpiry || undefined,
      });
      setCreatedKey(data);
      setShowCreate(false);
      setNewName('');
      setNewExpiry('');
      void fetchKeys();
    } catch {
      setError('Failed to create API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? Any services using it will stop working immediately.')) return;
    setRevoking(id);
    try {
      await api.delete(`/orgs/${orgId}/api-keys/${id}`);
      setKeys((k) => k.filter((key) => key.id !== id));
    } catch {
      setError('Failed to revoke API key.');
    } finally {
      setRevoking(null);
    }
  };

  const copyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey.key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">API Keys</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Generate API keys for programmatic access. Keys are shown only once on creation.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New API Key
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {createdKey && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              API key created: <strong>{createdKey.name}</strong>
            </p>
          </div>
          <p className="mb-3 text-xs text-green-700 dark:text-green-400">
            Copy it now — you won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-green-200 bg-white px-3 py-2 font-mono text-xs dark:border-green-800 dark:bg-gray-900">
              {showKey ? createdKey.key : '•'.repeat(createdKey.key.length)}
            </div>
            <button onClick={() => setShowKey((v) => !v)} className="rounded-lg border border-green-200 p-2 text-green-600 hover:bg-green-100 dark:border-green-800">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={copyKey} className="flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 dark:border-green-800">
              <Copy className="h-3.5 w-3.5" />
              {keyCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="mt-3 text-xs text-green-600 hover:underline dark:text-green-400">
            I&apos;ve saved my key, dismiss this
          </button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Create API Key</h4>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. GitHub Actions, Zapier, Production"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Expiry (optional)
              </label>
              <input
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Key
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName(''); setNewExpiry(''); }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-14 dark:border-gray-700">
          <Key className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500">No API keys yet</p>
          <p className="mt-1 text-xs text-gray-400">Generate a key to access the API programmatically.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {keys.map((key) => {
            const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
            return (
              <div key={key.id} className={`flex items-center gap-4 px-4 py-3.5 ${isExpired ? 'opacity-60' : ''}`}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Key className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{key.name}</span>
                    {isExpired && (
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/20">Expired</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-mono">{key.prefix}••••••••</span>
                    {key.lastUsed && <span>Used {format(new Date(key.lastUsed), 'MMM d')}</span>}
                    {key.expiresAt && !isExpired && <span>Expires {format(new Date(key.expiresAt), 'MMM d, yyyy')}</span>}
                    <span>Created {format(new Date(key.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={revoking === key.id}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 transition-colors"
                >
                  {revoking === key.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Revoke
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Using API Keys</p>
        <p>Pass the key in the <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">X-Api-Key</code> header or as a Bearer token in the Authorization header.</p>
      </div>
    </div>
  );
}
