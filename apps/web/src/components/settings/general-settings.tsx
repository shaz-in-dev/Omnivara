'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Loader2, Globe, Clock, Building2, Download, Users, Receipt, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  orgName: z.string().min(2, 'At least 2 characters'),
  domain: z.string().optional(),
  timezone: z.string(),
  dateFormat: z.string(),
  currency: z.string(),
});
type FormValues = z.infer<typeof schema>;

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'];
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];

const EXPORT_OPTIONS = [
  { key: 'leads'    as const, label: 'Leads',       icon: Users,    desc: 'All CRM leads as CSV',            accent: false },
  { key: 'contacts' as const, label: 'Contacts',    icon: Users,    desc: 'All contacts as CSV',             accent: false },
  { key: 'invoices' as const, label: 'Invoices',    icon: Receipt,  desc: 'All invoices as CSV',             accent: false },
  { key: 'full'     as const, label: 'Full Export', icon: Package,  desc: 'Complete data ZIP (GDPR)',        accent: true  },
];

type ExportKey = typeof EXPORT_OPTIONS[number]['key'];

function DataExport() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [downloading, setDownloading] = useState<ExportKey | null>(null);

  const download = async (key: ExportKey) => {
    setDownloading(key);
    try {
      const ext  = key === 'full' ? 'zip' : 'csv';
      const mime = key === 'full' ? 'application/zip' : 'text/csv';
      const { data } = await api.get(`/orgs/${orgId}/export/${key}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnivara-${key}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — user can retry
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Data Export</h3>
      <p className="mb-4 text-sm text-gray-500">Download your organization's data. Exports are generated on demand.</p>
      <div className="grid grid-cols-2 gap-3">
        {EXPORT_OPTIONS.map(({ key, label, icon: Icon, desc, accent }) => (
          <button
            key={key}
            onClick={() => download(key)}
            disabled={downloading === key}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
              accent
                ? 'border-brand-200 bg-brand-50 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:hover:bg-brand-900/40'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800'
            }`}
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-white dark:bg-gray-700'}`}>
              {downloading === key
                ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                : <Icon className={`h-4 w-4 ${accent ? 'text-brand-500' : 'text-gray-500'}`} />}
            </div>
            <div>
              <div className={`text-sm font-medium ${accent ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
            <Download className={`ml-auto h-4 w-4 flex-shrink-0 ${accent ? 'text-brand-400' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function GeneralSettings() {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { orgName: 'Acme Corp', timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', currency: 'USD' },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Logo */}
      <section>
        <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Organization Logo</h3>
        <p className="mb-4 text-sm text-gray-500">Displayed in emails, invoices, and the sidebar.</p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-bold text-white">
            A
          </div>
          <div>
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <Upload className="h-4 w-4" />
              Upload logo
            </button>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG or SVG. Max 2MB. Square recommended.</p>
          </div>
        </div>
      </section>

      <hr className="border-gray-100 dark:border-gray-800" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Building2 className="h-4 w-4 text-gray-400" />
            Organization Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Organization name</label>
              <input {...register('orgName')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Custom domain</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input {...register('domain')} placeholder="app.yourcompany.com" className={`${inputCls} pl-9`} />
              </div>
              <p className="mt-1 text-xs text-gray-400">Custom domain for white-labeling (Enterprise plan)</p>
            </div>
          </div>
        </section>

        {/* Regional */}
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Clock className="h-4 w-4 text-gray-400" />
            Regional Settings
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
              <select {...register('timezone')} className={inputCls}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date format</label>
              <select {...register('dateFormat')} className={inputCls}>
                {DATE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Default currency</label>
              <select {...register('currency')} className={inputCls}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
          {saved && <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Saved</span>}
        </div>
      </form>

      <hr className="border-gray-100 dark:border-gray-800" />

      <DataExport />
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white';
