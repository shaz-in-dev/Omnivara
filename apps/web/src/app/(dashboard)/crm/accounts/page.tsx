'use client';

import { useState, useCallback } from 'react';
import { Plus, Building2, Loader2, AlertCircle, Search } from 'lucide-react';
import { useAccounts, type Account } from '@/hooks/use-accounts';
import { useAuthStore } from '@/stores/auth.store';
import { CreateAccountModal } from '@/components/crm/create-account-modal';

export default function AccountsPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useAccounts(orgId, search.trim() || undefined);

  // normalise to array regardless of API shape
  const accounts: Account[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: Account[] } | undefined)?.data)
      ? (data as { data: Account[] }).data
      : [];

  const total = (data as { meta?: { total: number } } | undefined)?.meta?.total ?? accounts.length;

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  return (
    <div className="space-y-5">
      <CreateAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        orgId={orgId}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${total} account${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Add Account
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
        <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts…"
          className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-300"
        />
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span className="text-sm">Loading accounts…</span>
        </div>
      ) : isError ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-gray-500">Could not load accounts</p>
          <button onClick={() => void refetch()} className="text-sm text-brand-600 hover:underline">Try again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.industry ?? 'Unknown industry'}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-gray-400">
                <span>{account._count.contacts} contacts</span>
                <span>{account._count.opportunities} deals</span>
                {account.employeeCount && (
                  <span>{account.employeeCount.toLocaleString()} employees</span>
                )}
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="col-span-3 flex h-48 items-center justify-center text-sm text-gray-400">
              {search ? 'No accounts match your search.' : 'No accounts yet.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
