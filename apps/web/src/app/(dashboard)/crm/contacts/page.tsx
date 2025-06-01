'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, Loader2, AlertCircle, Upload, Users } from 'lucide-react';
import { ContactDetail } from '@/components/crm/contact-detail';
import { CreateContactModal } from '@/components/modals/create-contact-modal';
import { CsvImportModal } from '@/components/shared/csv-import-modal';
import { EmptyState } from '@/components/shared/empty-state';
import { useContacts, type Contact } from '@/hooks/use-contacts';
import { useAuthStore } from '@/stores/auth.store';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* Adapt API Contact → contact-detail Contact shape */
function toDetailContact(c: Contact) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    title: c.title,
    company: c.account?.name ?? null,
    account: c.account,
    createdAt: c.createdAt,
  };
}

export default function ContactsPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<ReturnType<typeof toDetailContact> | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: contacts, isLoading, isError, refetch } = useContacts(orgId, search.trim() || undefined);
  const items = contacts ?? [];

  const handleSelect = useCallback((c: Contact) => {
    setSelectedContact(toDetailContact(c));
    setDrawerOpen(true);
  }, []);

  const isEmpty = !isLoading && !isError && items.length === 0;

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isLoading ? 'Loading…' : `${items.length} contact${items.length !== 1 ? 's' : ''}`}
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
              <Plus className="h-4 w-4" /> Add Contact
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
          <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-300"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center gap-3 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              <span className="text-sm">Loading contacts…</span>
            </div>
          ) : isError ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-gray-500">Could not load contacts</p>
              <button onClick={() => void refetch()} className="text-sm text-brand-600 hover:underline">Try again</button>
            </div>
          ) : isEmpty && !search ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No contacts yet"
              description="Build your contact book by adding people you work with. Sync them to accounts and track every interaction in one place."
              action={{ label: 'Add your first contact', onClick: () => setCreateOpen(true), icon: <Plus className="h-4 w-4" /> }}
              secondaryAction={{ label: 'Import CSV', onClick: () => setImportOpen(true), icon: <Upload className="h-4 w-4" /> }}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Name', 'Email', 'Title', 'Company', 'Added', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {items.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => handleSelect(contact)}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                          {initials(contact.name)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{contact.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{contact.title ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{contact.account?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-brand-600 dark:text-brand-400">View →</span>
                    </td>
                  </tr>
                ))}
                {isEmpty && search && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      No contacts match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ContactDetail
        orgId={orgId}
        contact={selectedContact}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <CreateContactModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refetch()}
      />

      <CsvImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => void refetch()}
        importUrl="/crm/contacts/import"
        templateUrl="/crm/contacts/import/template"
        entity="contacts"
      />
    </>
  );
}
