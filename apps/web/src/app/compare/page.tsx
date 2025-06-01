import Link from 'next/link';
import { ArrowRight, Check, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type CellValue = 'yes' | 'no' | 'partial' | string;

interface CompareRow {
  feature: string;
  omnivara: CellValue;
  zoho: CellValue;
  hubspot: CellValue;
  monday: CellValue;
  fiveTool: CellValue;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const COMPARE_ROWS: CompareRow[] = [
  {
    feature:   'CRM (leads, contacts, pipeline)',
    omnivara:  'yes',
    zoho:      'yes',
    hubspot:   'yes',
    monday:    'partial',
    fiveTool:  'yes',
  },
  {
    feature:   'Project management',
    omnivara:  'yes',
    zoho:      'partial',
    hubspot:   'no',
    monday:    'yes',
    fiveTool:  'yes',
  },
  {
    feature:   'Helpdesk / ticketing',
    omnivara:  'yes',
    zoho:      'yes',
    hubspot:   'partial',
    monday:    'no',
    fiveTool:  'yes',
  },
  {
    feature:   'Finance (invoices, expenses)',
    omnivara:  'yes',
    zoho:      'yes',
    hubspot:   'no',
    monday:    'no',
    fiveTool:  'yes',
  },
  {
    feature:   'HR management',
    omnivara:  'yes',
    zoho:      'partial',
    hubspot:   'no',
    monday:    'no',
    fiveTool:  'yes',
  },
  {
    feature:   'Inventory tracking',
    omnivara:  'yes',
    zoho:      'partial',
    hubspot:   'no',
    monday:    'no',
    fiveTool:  'partial',
  },
  {
    feature:   'Built-in AI copilot',
    omnivara:  'yes',
    zoho:      'partial',
    hubspot:   'partial',
    monday:    'partial',
    fiveTool:  'no',
  },
  {
    feature:   'Unified search',
    omnivara:  'yes',
    zoho:      'partial',
    hubspot:   'partial',
    monday:    'partial',
    fiveTool:  'no',
  },
  {
    feature:   'Single sign-on (SSO)',
    omnivara:  'yes',
    zoho:      'yes',
    hubspot:   'yes',
    monday:    'yes',
    fiveTool:  'partial',
  },
  {
    feature:   'Price per user / month',
    omnivara:  'From $49',
    zoho:      '~$45',
    hubspot:   '~$90',
    monday:    '~$22',
    fiveTool:  '~$180',
  },
];

const COLS = [
  { key: 'omnivara', label: 'Omnivara', highlight: true },
  { key: 'zoho',     label: 'Zoho One',    highlight: false },
  { key: 'hubspot',  label: 'HubSpot',     highlight: false },
  { key: 'monday',   label: 'Monday.com',  highlight: false },
  { key: 'fiveTool', label: '5-tool stack', highlight: false },
] as const;

const COST_CARDS = [
  {
    label: '5-tool stack',
    price: '~$180',
    unit: '/user/mo',
    tools: ['CRM ($35)', 'PM ($15)', 'Helpdesk ($40)', 'Finance ($45)', 'HR ($45)'],
    highlight: false,
    note: 'Plus separate logins, integrations, and training.',
  },
  {
    label: 'Omnivara Growth',
    price: '$49',
    unit: '/user/mo',
    tools: ['CRM ✓', 'Projects ✓', 'Helpdesk ✓', 'Finance ✓', 'HR ✓'],
    highlight: true,
    note: 'Everything unified. AI included. One login.',
  },
  {
    label: 'Omnivara Business',
    price: '$99',
    unit: '/user/mo',
    tools: ['Everything in Growth', 'Unlimited AI (Sonnet)', 'SSO + Audit logs', 'Custom roles', 'SLA + CSM'],
    highlight: false,
    note: 'Enterprise-ready. Still cheaper than the stack.',
  },
];

// ── Cell component ─────────────────────────────────────────────────────────────

function CompareCell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === 'yes') {
    return (
      <td className={cn('py-3.5 text-center', highlight && 'bg-brand-50/60 dark:bg-brand-900/10')}>
        <Check className="mx-auto h-4 w-4 text-brand-500" />
      </td>
    );
  }
  if (value === 'no') {
    return (
      <td className={cn('py-3.5 text-center', highlight && 'bg-brand-50/60 dark:bg-brand-900/10')}>
        <X className="mx-auto h-4 w-4 text-gray-300 dark:text-gray-600" />
      </td>
    );
  }
  if (value === 'partial') {
    return (
      <td className={cn('py-3.5 text-center', highlight && 'bg-brand-50/60 dark:bg-brand-900/10')}>
        <span title="Partial support">
          <Zap className="mx-auto h-4 w-4 text-amber-400" />
        </span>
      </td>
    );
  }
  return (
    <td className={cn('py-3.5 text-center text-xs font-semibold', highlight ? 'bg-brand-50/60 text-brand-700 dark:bg-brand-900/10 dark:text-brand-400' : 'text-gray-600 dark:text-gray-300')}>
      {value}
    </td>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
              <span className="text-sm font-bold text-white">O</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Omnivara</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              Sign in
            </Link>
            <Link href="/register" className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center sm:px-6">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
          Honest comparison · Last updated May 2026
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Omnivara vs. the alternatives
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-gray-400">
          One unified platform vs. paying for five separate tools
        </p>
      </div>

      {/* Legend */}
      <div className="mx-auto mb-6 flex max-w-7xl flex-wrap items-center justify-center gap-5 px-4 text-sm text-gray-500 sm:px-6">
        <div className="flex items-center gap-1.5">
          <Check className="h-4 w-4 text-brand-500" />
          <span>Fully supported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Partial / add-on required</span>
        </div>
        <div className="flex items-center gap-1.5">
          <X className="h-4 w-4 text-gray-300 dark:text-gray-600" />
          <span>Not available</span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="pb-4 text-left font-medium text-gray-500 dark:text-gray-400">Feature</th>
              {COLS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'pb-4 text-center text-sm font-bold',
                    col.highlight
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-700 dark:text-gray-300',
                  )}
                >
                  {col.highlight && (
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-brand-500">
                      ★ Winner
                    </span>
                  )}
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, i) => (
              <tr
                key={row.feature}
                className={cn(
                  'border-b border-gray-100 dark:border-gray-900',
                  i % 2 === 0 && 'bg-gray-50/50 dark:bg-gray-900/30',
                )}
              >
                <td className="py-3.5 font-medium text-gray-700 dark:text-gray-300">{row.feature}</td>
                {COLS.map((col) => (
                  <CompareCell
                    key={col.key}
                    value={row[col.key as keyof CompareRow]}
                    highlight={col.highlight}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost breakdown */}
      <div className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Why pay for 5 tools when one does it all?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-gray-500 dark:text-gray-400">
            The average agency cobbles together a CRM, project tool, helpdesk, finance app, and HR system.
            That adds up — fast.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {COST_CARDS.map((card) => (
            <div
              key={card.label}
              className={cn(
                'relative flex flex-col rounded-2xl border p-7',
                card.highlight
                  ? 'border-brand-500 shadow-lg shadow-brand-500/10 dark:border-brand-400'
                  : 'border-gray-200 dark:border-gray-800',
              )}
            >
              {card.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-500 px-3 py-0.5 text-xs font-bold text-white">
                  Best value
                </div>
              )}
              <p className="mb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</p>
              <div className="mb-4 flex items-end gap-1">
                <span className={cn('text-4xl font-extrabold', card.highlight ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-white')}>
                  {card.price}
                </span>
                <span className="mb-1 text-sm text-gray-400">{card.unit}</span>
              </div>
              <ul className="mb-4 space-y-2">
                {card.tools.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Check className={cn('h-3.5 w-3.5 flex-shrink-0', card.highlight ? 'text-brand-500' : 'text-gray-400')} />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-auto text-xs text-gray-400">{card.note}</p>
            </div>
          ))}
        </div>

        {/* Savings callout */}
        <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
          <p className="text-lg font-bold text-green-800 dark:text-green-300">
            Switch to Omnivara Growth and save ~$131/user/mo vs a 5-tool stack
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            A 10-person agency saves $15,720/year. Plus hours of context-switching every week.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto mt-20 mb-24 max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl bg-brand-500 px-8 py-12 text-center sm:px-12">
          <h2 className="mb-2 text-3xl font-bold text-white">
            Ready to simplify your stack?
          </h2>
          <p className="mb-8 text-brand-100">
            Join hundreds of agencies that replaced their fragmented tools with Omnivara.
            14-day free trial, no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register?plan=growth"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-brand-600 hover:bg-brand-50"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 rounded-xl border border-brand-400 px-8 py-3 font-semibold text-white hover:bg-brand-400/30"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
