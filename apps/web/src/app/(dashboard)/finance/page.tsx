'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { InvoiceList, type Invoice } from '@/components/finance/invoice-list';
import { InvoiceBuilder } from '@/components/finance/invoice-builder';
import { useAuthStore } from '@/stores/auth.store';
import { useInvoices, type ApiInvoice } from '@/hooks/use-invoices';

type View = 'list' | 'new' | 'edit';

// ── Normalization: API (lowercase) → UI (uppercase) ───────────────────────────

function toUIInvoice(inv: ApiInvoice): Invoice {
  const statusMap: Record<string, string> = {
    draft:      'DRAFT',
    sent:       'SENT',
    viewed:     'SENT',
    partial:    'SENT',
    paid:       'PAID',
    overdue:    'OVERDUE',
    cancelled:  'CANCELLED',
    refunded:   'CANCELLED',
  };
  return {
    id: inv.id,
    number: inv.number,
    status: statusMap[inv.status] ?? inv.status.toUpperCase(),
    clientName: inv.account?.name ?? '—',
    issueDate: inv.createdAt,
    dueDate: inv.dueDate ?? inv.createdAt,
    total: Number(inv.total),
    currency: inv.currency,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useInvoices({ orgId });
  const apiInvoices = data?.items ?? [];
  const uiInvoices: Invoice[] = apiInvoices.map(toUIInvoice);

  if (view === 'new' || view === 'edit') {
    return (
      <div className="-m-6 flex h-full flex-col">
        <InvoiceBuilder
          orgId={orgId}
          {...(selectedId ? { invoiceId: selectedId } : {})}
          onSaved={() => { setView('list'); void refetch(); }}
        />
        <div className="border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setView('list')}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back to invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance & Billing</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${data?.total ?? 0} invoice${(data?.total ?? 0) !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => { setSelectedId(null); setView('new'); }}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      <InvoiceList
        invoices={uiInvoices}
        isLoading={isLoading}
        onNew={() => { setSelectedId(null); setView('new'); }}
        onSelect={(inv) => { setSelectedId(inv.id); setView('edit'); }}
      />
    </div>
  );
}
