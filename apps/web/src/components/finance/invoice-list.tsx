'use client';
import { useState } from 'react';
import { Search, FileText, Loader2, Plus, Receipt } from 'lucide-react';
import { InvoiceStatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency } from '@/lib/utils';

export interface Invoice {
  id: string;
  number: string;
  status: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  total: number;
  currency: string;
}

interface Props {
  invoices?: Invoice[];
  isLoading?: boolean;
  onNew?: () => void;
  onSelect?: (invoice: Invoice) => void;
}

export function InvoiceList({ invoices = [], isLoading = false, onNew, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const STATUSES = ['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

  const filtered = invoices.filter((inv) => {
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchSearch =
      !search ||
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRevenue = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status === 'SENT').reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Revenue (paid)', value: formatCurrency(totalRevenue), color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Outstanding', value: formatCurrency(outstanding), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Overdue', value: formatCurrency(overdue), color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl ${card.bg} p-5`}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            <span className="text-sm">Loading invoices…</span>
          </div>
        ) : invoices.length === 0 && !search && statusFilter === 'ALL' ? (
          <EmptyState
            icon={<Receipt className="h-8 w-8" />}
            title="No invoices yet"
            description="Create your first invoice to start getting paid. Track what's due, what's been sent, and what's overdue — all in one place."
            {...(onNew ? { action: { label: 'Create invoice', onClick: onNew, icon: <Plus className="h-4 w-4" /> } } : {})}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Invoice', 'Client', 'Issue date', 'Due date', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => onSelect?.(inv)}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-300" />
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{inv.number}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{inv.clientName}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    <span className={inv.status === 'OVERDUE' ? 'font-medium text-red-500' : ''}>
                      {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
                      View →
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (search || statusFilter !== 'ALL') && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    No invoices match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
