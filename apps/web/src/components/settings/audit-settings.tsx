'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface AuditEntry {
  id:           string;
  action:       string;
  resourceType: string | null;
  resourceId:   string | null;
  ipAddress:    string | null;
  createdAt:    string;
  user:         { id: string; name: string; email: string } | null;
}

interface AuditMeta {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

const METHOD_COLORS: Record<string, string> = {
  POST:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PATCH:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PUT:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export function AuditSettings() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [meta,    setMeta]    = useState<AuditMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search,   setSearch]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [page,     setPage]     = useState(1);

  const [exporting, setExporting] = useState(false);

  const fetchAudit = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        ...(search   && { action: search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo   && { dateTo }),
      });

      const { data } = await api.get<{ data: AuditEntry[]; meta: AuditMeta }>(
        `/orgs/${orgId}/audit?${params.toString()}`,
      );
      setEntries(data.data);
      setMeta(data.meta);
    } catch {
      // keep stale
    } finally {
      setLoading(false);
    }
  }, [orgId, page, search, dateFrom, dateTo]);

  useEffect(() => { void fetchAudit(); }, [fetchAudit]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        ...(search   && { action: search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo   && { dateTo }),
      });
      const { data } = await api.get(`/orgs/${orgId}/audit/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore
    } finally {
      setExporting(false);
    }
  };

  const methodBadge = (action: string) => {
    const method = action.split(' ')[0] ?? '';
    const cls = METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${cls}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-gray-100 p-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Action search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by action…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <button
            onClick={() => void fetchAudit()}
            className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No audit log entries found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                    {format(new Date(e.createdAt), 'MMM d, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3">
                    {e.user ? (
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{e.user.name}</div>
                        <div className="text-xs text-gray-400">{e.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {methodBadge(e.action)}
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                        {e.action.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {e.resourceType ? (
                      <span>
                        {e.resourceType}
                        {e.resourceId && <span className="ml-1 font-mono text-gray-400">{e.resourceId.slice(0, 8)}…</span>}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {e.ipAddress ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, meta.total)} of {meta.total} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-500">Page {page} of {meta.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page === meta.pages}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
