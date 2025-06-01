'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderOpen, Headset, DollarSign,
  TrendingUp, AlertCircle, CheckCircle2, Plus, ArrowRight,
  Loader2, BarChart3, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ── Static demo data ──────────────────────────────────────────────────────────

const DEMO_LEADS = [
  { id: '1', name: 'Sarah Chen',      company: 'Brightline Agency',  status: 'qualified', value: '$18,000' },
  { id: '2', name: 'Marcus Rivera',   company: 'StudioFlow Inc',     status: 'contacted', value: '$9,500'  },
  { id: '3', name: 'Priya Patel',     company: 'Nexus Consulting',   status: 'new',       value: '$24,000' },
  { id: '4', name: 'James Wilson',    company: 'Rapid MSP',          status: 'proposal',  value: '$42,000' },
  { id: '5', name: 'Aisha Mohammed',  company: 'Creative Labs',      status: 'new',       value: '$6,200'  },
];

const DEMO_PIPELINE = [
  { stage: 'Lead',      deals: [{ name: 'Website Redesign', value: '$12k', company: 'TechCorp' }] },
  { stage: 'Proposal',  deals: [{ name: 'SEO Retainer', value: '$3.6k/mo', company: 'StartupXYZ' }, { name: 'Brand Identity', value: '$8k', company: 'Agency Plus' }] },
  { stage: 'Negotiation', deals: [{ name: 'App Dev Project', value: '$45k', company: 'Enterprise Inc' }] },
  { stage: 'Won',       deals: [{ name: 'Marketing Campaign', value: '$15k', company: 'Nexus Co.' }] },
];

const DEMO_TICKETS = [
  { id: 'T-001', subject: 'Setup assistance needed', priority: 'low',    status: 'open',     age: '2h' },
  { id: 'T-002', subject: 'Invoice payment question', priority: 'medium', status: 'open',     age: '1d' },
  { id: 'T-003', subject: 'Feature request: CSV export', priority: 'low', status: 'resolved', age: '3d' },
];

const DEMO_KPIS = [
  { label: 'Open Deals',       value: '12',     sub: '$87k pipeline',    icon: TrendingUp,     color: 'text-brand-500' },
  { label: 'Active Projects',  value: '7',      sub: '3 due this week',  icon: FolderOpen,     color: 'text-green-500' },
  { label: 'Open Tickets',     value: '4',      sub: '1 overdue',        icon: AlertCircle,    color: 'text-amber-500' },
  { label: 'Revenue (MTD)',    value: '$28.4k', sub: '+18% vs last month', icon: DollarSign,   color: 'text-blue-500' },
];

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  proposal:  'bg-purple-100 text-purple-700',
  open:      'bg-amber-100 text-amber-700',
  resolved:  'bg-green-100 text-green-700',
  low:       'bg-gray-100 text-gray-500',
  medium:    'bg-amber-100 text-amber-700',
  high:      'bg-red-100 text-red-700',
};

type Tab = 'dashboard' | 'crm' | 'pipeline' | 'helpdesk';

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleAction = () => {
    toast('Create a free account to add your own data', { icon: '👋', duration: 3000 });
    setTimeout(() => router.push('/register'), 500);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-500" />
          <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
            Loading your demo workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Read-only banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-brand-600 px-6 py-2.5">
        <p className="text-sm text-white">
          <span className="font-semibold">📊 Read-only demo</span>
          <span className="ml-2 opacity-80">— Explore Omnivara with pre-loaded agency data</span>
        </p>
        <Link
          href="/register"
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
        >
          Start free <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Fake sidebar + nav */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex lg:flex-col">
          <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-5 dark:border-gray-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">O</div>
            <span className="font-semibold text-gray-900 dark:text-white">Brightline Agency</span>
          </div>
          <nav className="flex-1 space-y-0.5 p-3">
            {([
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'crm',       icon: Users,           label: 'CRM' },
              { id: 'pipeline',  icon: TrendingUp,      label: 'Pipeline' },
              { id: 'helpdesk',  icon: Headset,         label: 'Helpdesk' },
            ] as { id: Tab; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  tab === id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800',
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Get started free
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Topbar */}
          <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white capitalize">{tab}</h1>
            <button
              onClick={handleAction}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </header>

          <div className="p-6">
            {tab === 'dashboard' && <DashboardTab onAction={handleAction} />}
            {tab === 'crm'       && <CrmTab onAction={handleAction} />}
            {tab === 'pipeline'  && <PipelineTab />}
            {tab === 'helpdesk'  && <HelpdeskTab onAction={handleAction} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Tab components ─────────────────────────────────────────────────────────────

function DashboardTab({ onAction }: { onAction: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Good morning, Alex 👋</h2>
        <p className="text-sm text-gray-500">Here's what's happening at Brightline Agency today.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {DEMO_KPIS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>
      {/* Mini revenue chart placeholder */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Revenue (Last 6 months)</h3>
          <BarChart3 className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex h-28 items-end gap-2">
          {[40, 55, 48, 70, 65, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md bg-brand-100 dark:bg-brand-900/30" style={{ height: `${h}%` }}>
              <div className="h-full w-full rounded-t-md bg-brand-400 opacity-70" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-5 text-center dark:border-brand-800 dark:bg-brand-900/10">
        <p className="text-sm text-brand-700 dark:text-brand-400">
          This is demo data.{' '}
          <button onClick={onAction} className="font-semibold underline hover:no-underline">
            Create a free account
          </button>{' '}
          to track your real business metrics.
        </p>
      </div>
    </div>
  );
}

function CrmTab({ onAction }: { onAction: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leads</h2>
        <button onClick={onAction} className="flex items-center gap-1.5 rounded-xl border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
          <Plus className="h-3.5 w-3.5" /> Add lead
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Company</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Est. Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {DEMO_LEADS.map((lead) => (
              <tr key={lead.id} onClick={onAction} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{lead.name}</td>
                <td className="px-5 py-3 text-gray-500">{lead.company}</td>
                <td className="px-5 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[lead.status])}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-medium text-gray-700 dark:text-gray-300">{lead.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pipeline</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {DEMO_PIPELINE.map(({ stage, deals }) => (
          <div key={stage} className="w-56 flex-shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stage}</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {deals.length}
              </span>
            </div>
            <div className="space-y-2">
              {deals.map((deal) => (
                <div key={deal.name} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{deal.name}</p>
                  <p className="text-xs text-gray-400">{deal.company}</p>
                  <p className="mt-1.5 text-sm font-bold text-brand-600">{deal.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HelpdeskTab({ onAction }: { onAction: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tickets</h2>
        <button onClick={onAction} className="flex items-center gap-1.5 rounded-xl border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
          <Plus className="h-3.5 w-3.5" /> New ticket
        </button>
      </div>
      <div className="space-y-3">
        {DEMO_TICKETS.map((ticket) => (
          <div key={ticket.id} onClick={onAction} className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 hover:border-brand-200 dark:border-gray-700 dark:bg-gray-900">
            <span className="font-mono text-xs text-gray-400">{ticket.id}</span>
            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-white">{ticket.subject}</p>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[ticket.priority])}>
              {ticket.priority}
            </span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[ticket.status])}>
              {ticket.status}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" /> {ticket.age}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
