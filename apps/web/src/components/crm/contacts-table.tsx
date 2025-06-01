'use client';

import type { Contact } from '@/hooks/use-contacts';

interface ContactsTableProps {
  contacts: Contact[];
  onRowClick?: (id: string) => void;
}

export function ContactsTable({ contacts, onRowClick }: ContactsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {['Name', 'Email', 'Company', 'Title', 'Added'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {contacts.map((c) => (
            <tr
              key={c.id}
              onClick={() => onRowClick?.(c.id)}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {c.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500">{c.account?.name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500">{c.title ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No contacts yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
