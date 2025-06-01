'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, Trash2, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface SlackConfig {
  configured:  boolean;
  channelId?:  string;
  channelName?: string;
  createdAt?:  string;
}

export function SlackTab() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');

  const [config,    setConfig]    = useState<SlackConfig | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  // Form state
  const [token,       setToken]       = useState('');
  const [channelId,   setChannelId]   = useState('');
  const [channelName, setChannelName] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [removing,    setRemoving]    = useState(false);
  const [testing,     setTesting]     = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data } = await api.get<SlackConfig>(`/orgs/${orgId}/slack/config`);
      setConfig(data);
    } catch {
      setError('Failed to load Slack integration.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void fetchConfig(); }, [fetchConfig]);

  const showMsg = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setError(null); }
    else                    { setError(msg);   setSuccess(null); }
    setTimeout(() => { setSuccess(null); setError(null); }, 4000);
  };

  const handleSave = async () => {
    if (!token.trim() || !channelId.trim() || !channelName.trim()) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/orgs/${orgId}/slack/config`, {
        accessToken: token.trim(),
        channelId:   channelId.trim(),
        channelName: channelName.trim(),
      });
      setToken('');
      setChannelId('');
      setChannelName('');
      void fetchConfig();
      showMsg('Slack integration saved successfully.', 'success');
    } catch {
      showMsg('Failed to save Slack integration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove Slack integration? Omnivara will stop posting to your channel.')) return;
    setRemoving(true);
    try {
      await api.delete(`/orgs/${orgId}/slack/config`);
      setConfig({ configured: false });
      showMsg('Slack integration removed.', 'success');
    } catch {
      showMsg('Failed to remove Slack integration.', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await api.post(`/orgs/${orgId}/slack/test`, {});
      showMsg('Test message sent! Check your Slack channel.', 'success');
    } catch {
      showMsg('Test message failed. Check your token and channel settings.', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Slack Integration</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Post notifications to a Slack channel when deals are won, tickets are created, invoices are paid, and more.
        </p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
        </div>
      )}

      {config?.configured ? (
        /* Connected state */
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4A154B] text-white text-lg font-bold">
                #
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  #{config.channelName ?? config.channelId}
                </p>
                <p className="text-xs text-gray-500">Slack channel · Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 transition-colors"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Test
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 transition-colors"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Disconnect
              </button>
            </div>
          </div>

          {/* What gets posted */}
          <div className="mt-4 border-t border-green-200 pt-4 dark:border-green-800">
            <p className="mb-2 text-xs font-medium text-green-800 dark:text-green-300">Posts to this channel when:</p>
            <ul className="grid grid-cols-2 gap-1 text-xs text-green-700 dark:text-green-400">
              {[
                '🎯 New lead is created',
                '🎫 Support ticket is created',
                '✅ Ticket is resolved',
                '💰 Invoice is paid',
                '🏆 Deal is won',
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Setup form */
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Connect Slack</h4>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Bot Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="xoxb-••••••••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Create a Slack App at api.slack.com, add the <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">chat:write</code> scope, and paste the Bot Token here.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Channel ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="C0XXXXXXXXX"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Channel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="general"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !token.trim() || !channelId.trim() || !channelName.trim()}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Connect Slack
            </button>
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Getting your Bot Token</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to <strong>api.slack.com/apps</strong> → Create New App → From Scratch</li>
          <li>Under <em>OAuth & Permissions</em>, add the <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">chat:write</code> Bot Token Scope</li>
          <li>Install app to your workspace — copy the <strong>Bot User OAuth Token</strong> (<code className="rounded bg-gray-200 px-1 dark:bg-gray-700">xoxb-...</code>)</li>
          <li>Invite the bot to your target channel: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">/invite @YourApp</code></li>
        </ol>
      </div>
    </div>
  );
}
