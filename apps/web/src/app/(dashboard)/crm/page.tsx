import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Building2, Target, TrendingUp } from 'lucide-react';

export const metadata: Metadata = { title: 'CRM' };

const crmLinks = [
  { href: '/crm/pipeline', label: 'Pipeline', icon: Target, description: 'Manage deal stages', color: 'bg-brand-50 text-brand-600' },
  { href: '/crm/contacts', label: 'Contacts', icon: Users, description: 'People & relationships', color: 'bg-blue-50 text-blue-600' },
  { href: '/crm/accounts', label: 'Accounts', icon: Building2, description: 'Companies & orgs', color: 'bg-purple-50 text-purple-600' },
  { href: '/crm/leads', label: 'Leads', icon: TrendingUp, description: 'Inbound pipeline', color: 'bg-green-50 text-green-600' },
];

export default function CrmPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM Pro</h1>
        <p className="mt-1 text-sm text-gray-500">Leads, contacts, accounts, and pipeline management</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {crmLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.color}`}>
              <link.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{link.label}</p>
              <p className="text-sm text-gray-500">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
