'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, Loader2, AlertCircle, Upload, UserPlus } from 'lucide-react';
import { LeadDetail } from '@/components/crm/lead-detail';
import { LeadStatusBadge } from '@/components/shared/status-badge';
import { CreateLeadModal } from '@/components/modals/create-lead-modal';
import { CsvImportModal } from '@/components/shared/csv-import-modal';
import { EmptyState } from '@/components/shared/empty-state';
import { SampleDataBanner } from '@/components/onboarding/sample-data-banner';
import { useLeads, type Lead } from '@/hooks/use-leads';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_ORDER = ['all', 'new', 'contacted', 'qualified', 'disqualified'];

/* Map API Lead → lead-detail Lead (same shape now after type alignment) */
function toDetailLead(l: Lead) {
  return {
    id: l.id,
    name: l.name,
    company: l.company ?? '',
    email: l.email ?? '',
    status: l.status,
    source: l.source ?? '',
    ...(l.phone != null ? { phone: l.phone } : {}),
    ...(l.notes != null ? { notes: l.notes } : {}),
    createdAt: l.createdAt,
  };
}

export default function LeadsPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<ReturnType<typeof toDetailLead> | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useLeads({
    orgId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
  });

  const items: Lead[] = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleSelect = useCallback((lead: Lead) => {
    setSelectedLead(toDetailLead(lead));
    setDrawerOpen(true);
  }, []);

  const isEmpty = !isLoading && !isError && items.length === 0;
  const isFiltered = !!(search || statusFilter !== 'all');

  return (
    <>
      <div className="space-y-5">
        {/* Sample data banner */}
        <SampleDataBanner />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isLoading ? 'Loading…' : `${total} lead${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Upload className="h-4 w-4" /> Import CSV
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" /> Add Lead
            </button>
          </div>
        </div>

        {/* Search + status filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center gap-3 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              <span className="text-sm">Loading leads…</span>
            </div>
          ) : isError ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-gray-400">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Could not load leads</p>
              <button
                onClick={() => void refetch()}
                className="text-sm text-brand-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : isEmpty && !isFiltered ? (
            <EmptyState
              icon={<UserPlus className="h-8 w-8" />}
              title="No leads yet"
              description="Start adding your prospects to build your pipeline."
              action={{ label: '+ Add your first lead', onClick: () => setCreateOpen(true), icon: <Plus className="h-4 w-4" /> }}
              secondaryAction={{ label: 'Import CSV', onClick: () => setImportOpen(true), icon: <Upload className="h-4 w-4" /> }}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Lead', 'Company', 'Source', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {items.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleSelect(lead)}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{lead.name}</p>
                      {lead.email && <p className="text-xs text-gray-400">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.company ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{lead.source ?? '—'}</td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-brand-600 dark:text-brand-400">View →</span>
                    </td>
                  </tr>
                ))}
                {isEmpty && isFiltered && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                      No leads match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <LeadDetail
        lead={selectedLead}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <CreateLeadModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refetch()}
      />

      <CsvImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => void refetch()}
        importUrl="/crm/leads/import"
        templateUrl="/crm/leads/import/template"
        entity="leads"
      />
    </>
  );
}
