'use client';
import { useState, useEffect } from 'react';
import { Shield, Save, Trash2, ToggleLeft, ToggleRight, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface SsoConfig {
  configured: boolean;
  provider?:  string;
  entryPoint?: string;
  issuer?:    string;
  enabled?:   boolean;
  certHint?:  string | null;
}

export function SecuritySettings() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');

  const [config, setConfig]     = useState<SsoConfig | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [form, setForm] = useState({
    entryPoint: '',
    issuer:     '',
    cert:       '',
    provider:   'saml',
  });

  useEffect(() => {
    if (!orgId) return;
    api.get<SsoConfig>('/auth/sso/config')
      .then(({ data }) => {
        setConfig(data);
        if (data.configured) {
          setForm((f) => ({
            ...f,
            entryPoint: data.entryPoint ?? '',
            issuer:     data.issuer     ?? '',
          }));
        }
      })
      .catch(() => setConfig({ configured: false }))
      .finally(() => setLoading(false));
  }, [orgId]);

  const handleSave = async () => {
    if (!form.entryPoint || !form.issuer || !form.cert) {
      setError('Entry point, issuer, and certificate are required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.post('/auth/sso/config', form);
      const { data } = await api.get<SsoConfig>('/auth/sso/config');
      setConfig(data);
      setSaved(true);
      setForm((f) => ({ ...f, cert: '' })); // clear cert after save
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save SSO configuration. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!config?.configured) return;
    setToggling(true);
    try {
      await api.patch('/auth/sso/config/toggle', { enabled: !config.enabled });
      setConfig((c) => c ? { ...c, enabled: !c.enabled } : c);
    } catch {
      setError('Failed to toggle SSO.');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete SSO configuration? Users will fall back to email/password login.')) return;
    setDeleting(true);
    try {
      await api.delete('/auth/sso/config');
      setConfig({ configured: false });
      setForm({ entryPoint: '', issuer: '', cert: '', provider: 'saml' });
    } catch {
      setError('Failed to delete SSO configuration.');
    } finally {
      setDeleting(false);
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">SAML 2.0 Single Sign-On</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Connect your Identity Provider (Okta, Azure AD, Google Workspace) for enterprise SSO.
          </p>
        </div>
        {config?.configured && (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${config.enabled ? 'text-green-600' : 'text-gray-400'}`}>
              {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="text-gray-400 hover:text-brand-500 disabled:opacity-50 transition-colors"
              title={config.enabled ? 'Disable SSO' : 'Enable SSO'}
            >
              {toggling ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : config.enabled ? (
                <ToggleRight className="h-6 w-6 text-brand-500" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status badge */}
      {config?.configured && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-300">
            SSO is configured ({config.provider?.toUpperCase()}).
            {config.certHint && <> Certificate: <code className="font-mono text-xs">{config.certHint}</code></>}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            SSO Entry Point URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={form.entryPoint}
            onChange={(e) => setForm((f) => ({ ...f, entryPoint: e.target.value }))}
            placeholder="https://your-idp.com/saml/login"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">The IdP's SAML login URL (also called SSO URL or redirect URL).</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Issuer / Entity ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.issuer}
            onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
            placeholder="https://your-idp.com/saml/entity-id"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            X.509 Certificate (PEM) {!config?.configured && <span className="text-red-500">*</span>}
          </label>
          <textarea
            rows={6}
            value={form.cert}
            onChange={(e) => setForm((f) => ({ ...f, cert: e.target.value }))}
            placeholder={config?.configured
              ? `Current certificate hint: ${config.certHint ?? '(stored)'}\n\nPaste new certificate here to replace it…`
              : '-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----'}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">
            Download from your IdP's metadata. {config?.configured && 'Leave blank to keep the current certificate.'}
          </p>
        </div>
      </div>

      {/* SP metadata link */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Service Provider Metadata</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Configure your IdP using the SP metadata URL:
        </p>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/sso/saml/metadata`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
        >
          View SP Metadata XML <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>

        {config?.configured && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Remove SSO
          </button>
        )}
      </div>
    </div>
  );
}
