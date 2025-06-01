'use client';
import { useState, useCallback, useEffect } from 'react';
import {
  Receipt, Plus, Search, Filter, Loader2, MoreHorizontal,
  Plane, UtensilsCrossed, Monitor, Briefcase, Tag,
  CheckCircle2, Clock, XCircle, DollarSign, TrendingUp, RefreshCw, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  useExpenses, useCreateExpense, useUpdateExpense,
  type ApiExpense, type ApiExpenseCategory, type ApiExpenseStatus,
  type CreateExpensePayload,
} from '@/hooks/use-expenses';

/* ── Types ──────────────────────────────────────────────────────────────── */
type ExpenseCategory = ApiExpenseCategory;
type ExpenseStatus   = ApiExpenseStatus;

interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  notes?: string;
  status: ExpenseStatus;
  submittedBy: string;
  receiptUrl?: string;
}

/* ── Config ─────────────────────────────────────────────────────────────── */
const CATEGORY_CFG: Record<ExpenseCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  travel:   { label: 'Travel',   icon: Plane,           color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  meals:    { label: 'Meals',    icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  software: { label: 'Software', icon: Monitor,         color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  office:   { label: 'Office',   icon: Briefcase,       color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20' },
  other:    { label: 'Other',    icon: Tag,             color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-gray-700' },
};

const STATUS_CFG: Record<ExpenseStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft:      { label: 'Draft',      icon: Clock,        color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  submitted:  { label: 'Submitted',  icon: Clock,        color: 'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
  approved:   { label: 'Approved',   icon: CheckCircle2, color: 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
  rejected:   { label: 'Rejected',   icon: XCircle,      color: 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
  reimbursed: { label: 'Reimbursed', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

// ── Normalization: API → UI ────────────────────────────────────────────────

function toUIExpense(e: ApiExpense): Expense {
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    amount: Number(e.amount),
    currency: e.currency,
    date: e.date.split('T')[0] ?? e.date,
    ...(e.vendor   ? { vendor: e.vendor }       : {}),
    ...(e.notes    ? { notes: e.notes }         : {}),
    ...(e.receiptUrl ? { receiptUrl: e.receiptUrl } : {}),
    status: e.status,
    submittedBy: e.submittedBy,
  };
}

/* ── Form modal ──────────────────────────────────────────────────────────── */
interface ExpenseFormProps {
  onClose: () => void;
  onSave: (e: Omit<Expense, 'id' | 'submittedBy'>) => Promise<void>;
  isPending?: boolean;
}

function ExpenseForm({ onClose, onSave, isPending = false }: ExpenseFormProps) {
  const [form, setForm] = useState({
    title: '', category: 'travel' as ExpenseCategory, amount: '',
    date: new Date().toISOString().substring(0, 10),
    vendor: '', notes: '', currency: 'USD',
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (asDraft: boolean) => {
    if (!form.title.trim() || !form.amount) return;
    await onSave({
      title: form.title,
      category: form.category,
      amount: parseFloat(form.amount),
      currency: form.currency,
      date: form.date,
      ...(form.vendor.trim() ? { vendor: form.vendor.trim() } : {}),
      ...(form.notes.trim()  ? { notes: form.notes.trim() }  : {}),
      status: asDraft ? 'draft' : 'submitted',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Expense</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
        </div>

        <div className="space-y-4 p-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
            <input
              value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Flight to NYC"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
              <select
                value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {(Object.keys(CATEGORY_CFG) as ExpenseCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_CFG[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number" min="0" step="0.01"
                  value={form.amount} onChange={(e) => set('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Date + Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
              <input
                type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</label>
              <input
                value={form.vendor} onChange={(e) => set('vendor', e.target.value)}
                placeholder="e.g. Delta Airlines"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Receipt upload placeholder */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt</label>
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="text-center">
                <Receipt className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Drop file here or <span className="text-brand-500 cursor-pointer">browse</span></p>
                <p className="mt-0.5 text-xs text-gray-400">PNG, JPG, PDF up to 10 MB</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional context…"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={() => void handleSubmit(true)}
            disabled={isPending}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Save as Draft
          </button>
          <button
            onClick={() => void handleSubmit(false)}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Expense row ─────────────────────────────────────────────────────────── */
function ExpenseRow({
  expense,
  onStatusChange,
}: {
  expense: Expense;
  onStatusChange: (id: string, s: ExpenseStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = CATEGORY_CFG[expense.category];
  const status = STATUS_CFG[expense.status];
  const CatIcon = cat.icon;
  const StatusIcon = status.icon;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(n);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <tr className="group hover:bg-gray-50 dark:hover:bg-gray-800/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', cat.bg)}>
            <CatIcon className={cn('h-4 w-4', cat.color)} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{expense.title}</p>
            {expense.vendor && <p className="text-xs text-gray-500">{expense.vendor}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', cat.bg, cat.color)}>
          {cat.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(expense.date)}</td>
      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(expense.amount)}</td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', status.color)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {expense.status === 'draft' && (
                <button
                  onClick={() => { onStatusChange(expense.id, 'submitted'); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Submit for Approval
                </button>
              )}
              {expense.status === 'submitted' && (
                <>
                  <button
                    onClick={() => { onStatusChange(expense.id, 'approved'); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { onStatusChange(expense.id, 'rejected'); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Reject
                  </button>
                </>
              )}
              {expense.status === 'approved' && (
                <button
                  onClick={() => { onStatusChange(expense.id, 'reimbursed'); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Mark Reimbursed
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ExpensesPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>('all');
  const [filterCat, setFilterCat]       = useState<ExpenseCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  // Derive server-side filter params (status + category) — search is client-side
  const { data, isLoading, isError, refetch } = useExpenses({
    orgId,
    ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
    ...(filterCat    !== 'all' ? { category: filterCat } : {}),
  });

  const createExpense  = useCreateExpense(orgId);
  const updateExpense  = useUpdateExpense(orgId);

  // Map API → UI; keep a local copy so optimistic status updates are instant
  const apiExpenses = data?.items ?? [];
  const [expenses, setExpenses] = useState<Expense[]>([]);
  useEffect(() => { setExpenses(apiExpenses.map(toUIExpense)); }, [data]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(async (payload: Omit<Expense, 'id' | 'submittedBy'>) => {
    const createPayload: CreateExpensePayload = {
      title:    payload.title,
      category: payload.category,
      amount:   payload.amount,
      currency: payload.currency,
      date:     payload.date,
      status:   payload.status,
      ...(payload.vendor    ? { vendor: payload.vendor }       : {}),
      ...(payload.notes     ? { notes: payload.notes }         : {}),
      ...(payload.receiptUrl ? { receiptUrl: payload.receiptUrl } : {}),
    };
    await createExpense.mutateAsync(createPayload);
  }, [createExpense]);

  const handleStatusChange = useCallback((id: string, status: ExpenseStatus) => {
    // Optimistic update
    setExpenses((p) => p.map((e) => e.id === id ? { ...e, status } : e));
    updateExpense.mutate({ id, status });
  }, [updateExpense]);

  // ── Client-side search filter ──────────────────────────────────────────────

  const filtered = expenses.filter((e) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || (e.vendor ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  // ── Summary stats ──────────────────────────────────────────────────────────

  const totalAmount    = expenses.reduce((s, e) => s + e.amount, 0);
  const approvedAmount = expenses
    .filter((e) => ['approved', 'reimbursed'].includes(e.status))
    .reduce((s, e) => s + e.amount, 0);
  const pendingAmount  = expenses
    .filter((e) => e.status === 'submitted')
    .reduce((s, e) => s + e.amount, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${data?.total ?? 0} expense${(data?.total ?? 0) !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> New Expense
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Submitted',
            value: isLoading ? '—' : fmt(totalAmount),
            icon: DollarSign,
            color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
            count: expenses.length,
          },
          {
            label: 'Approved / Reimbursed',
            value: isLoading ? '—' : fmt(approvedAmount),
            icon: CheckCircle2,
            color: 'bg-green-50 text-green-600 dark:bg-green-900/20',
            count: expenses.filter((e) => ['approved', 'reimbursed'].includes(e.status)).length,
          },
          {
            label: 'Pending Review',
            value: isLoading ? '—' : fmt(pendingAmount),
            icon: TrendingUp,
            color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
            count: expenses.filter((e) => e.status === 'submitted').length,
          },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl', kpi.color)}>
                <KpiIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
                <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                <p className="text-xs text-gray-400">{kpi.count} expense{kpi.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex h-48 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span className="text-sm">Loading expenses…</span>
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-gray-400">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm">Could not load expenses</p>
          <button onClick={() => void refetch()} className="text-sm text-brand-600 hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Table card */}
      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ExpenseStatus | 'all')}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Statuses</option>
                {(Object.keys(STATUS_CFG) as ExpenseStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                ))}
              </select>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value as ExpenseCategory | 'all')}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Categories</option>
                {(Object.keys(CATEGORY_CFG) as ExpenseCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_CFG[c].label}</option>
                ))}
              </select>
            </div>

            {(createExpense.isPending || updateExpense.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  {['Expense', 'Category', 'Date', 'Amount', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400',
                        h === 'Amount' ? 'text-right' : 'text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Receipt className="mx-auto h-10 w-10 text-gray-200 dark:text-gray-700" />
                      <p className="mt-3 text-sm font-medium text-gray-500">No expenses found</p>
                      <p className="text-xs text-gray-400">
                        {search || filterStatus !== 'all' || filterCat !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Submit your first expense above'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <ExpenseRow key={e.id} expense={e} onStatusChange={handleStatusChange} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
              <p className="text-xs text-gray-500">
                Showing {filtered.length} of {expenses.length} expenses
              </p>
              <button
                onClick={() => void refetch()}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* New expense modal */}
      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          isPending={createExpense.isPending}
        />
      )}
    </div>
  );
}
