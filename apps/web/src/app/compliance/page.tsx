import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ArrowRight,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

// ── Sub-processors ────────────────────────────────────────────────────────────

const SUB_PROCESSORS = [
  { name: 'Stripe',     purpose: 'Payment processing',   location: 'US / EU',  dpa: true  },
  { name: 'AWS',        purpose: 'Infrastructure & storage', location: 'US / EU', dpa: true },
  { name: 'Anthropic',  purpose: 'AI Copilot (Claude)',  location: 'US',       dpa: true  },
  { name: 'OpenAI',     purpose: 'Embeddings',           location: 'US',       dpa: true  },
  { name: 'Resend',     purpose: 'Transactional email',  location: 'US',       dpa: true  },
  { name: 'Sentry',     purpose: 'Error tracking',       location: 'US',       dpa: true  },
  { name: 'PostHog',    purpose: 'Product analytics',    location: 'US / EU',  dpa: true  },
];

// ── Framework cards ───────────────────────────────────────────────────────────

type FrameworkStatus = 'compliant' | 'in-progress' | 'roadmap' | 'not-applicable';

interface Framework {
  name: string;
  status: FrameworkStatus;
  statusLabel: string;
  description: string;
  detail: string;
}

const FRAMEWORKS: Framework[] = [
  {
    name: 'GDPR',
    status: 'compliant',
    statusLabel: 'Compliant',
    description: 'EU General Data Protection Regulation',
    detail:
      'We apply data minimisation principles, honour all eight GDPR data subject rights, and offer a signed DPA to all customers. Enterprise customers may request EU data residency (AWS eu-west-1). Contact privacy@omnivara.io for your DPA.',
  },
  {
    name: 'CCPA',
    status: 'compliant',
    statusLabel: 'Compliant',
    description: 'California Consumer Privacy Act',
    detail:
      'California residents can request a copy of their data, opt out of sale (we do not sell personal data), or request deletion by emailing privacy@omnivara.io. We respond within 45 days.',
  },
  {
    name: 'SOC 2 Type II',
    status: 'in-progress',
    statusLabel: 'In progress — Q2 2026',
    description: 'AICPA Service Organisation Controls',
    detail:
      'We have implemented all five SOC 2 Trust Service Criteria (Security, Availability, Confidentiality, Processing Integrity, Privacy). Our observation period with an independent auditor began Q1 2026. Report expected Q2 2026.',
  },
  {
    name: 'ISO 27001',
    status: 'roadmap',
    statusLabel: 'Roadmap — 2026',
    description: 'International information security management standard',
    detail:
      'ISO 27001 certification is planned for H2 2026 following completion of SOC 2 Type II. Our information security management system (ISMS) is being built in parallel with SOC 2 controls.',
  },
  {
    name: 'HIPAA',
    status: 'not-applicable',
    statusLabel: 'Not currently compliant',
    description: 'Health Insurance Portability and Accountability Act',
    detail:
      'Omnivara is not currently HIPAA-compliant and is not recommended for storing protected health information (PHI). Healthcare organisations requiring HIPAA compliance should not use Omnivara for PHI.',
  },
];

const STATUS_CONFIG: Record<FrameworkStatus, { icon: typeof CheckCircle2; classes: string; iconClasses: string }> = {
  'compliant':       { icon: CheckCircle2, classes: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30', iconClasses: 'text-emerald-500' },
  'in-progress':     { icon: Clock,        classes: 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30',         iconClasses: 'text-amber-500'   },
  'roadmap':         { icon: Clock,        classes: 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30',             iconClasses: 'text-blue-400'    },
  'not-applicable':  { icon: XCircle,      classes: 'bg-gray-50 border-gray-100 dark:bg-gray-900/50 dark:border-gray-800',               iconClasses: 'text-gray-400'    },
};

const BADGE_CONFIG: Record<FrameworkStatus, string> = {
  'compliant':      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'in-progress':    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'roadmap':        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'not-applicable': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
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
          <div className="flex items-center gap-4 text-sm">
            <Link href="/security" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Security</Link>
            <Link href="/compliance" className="font-medium text-brand-600 dark:text-brand-400">Compliance</Link>
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link>
            <Link href="/login" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-brand-500 px-4 py-1.5 font-semibold text-white hover:bg-brand-600">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center sm:px-6">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Compliance & certifications
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Built for compliance
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          We take regulatory compliance seriously. Here is a transparent overview of the
          frameworks we comply with, what we are working toward, and what we do not yet
          support.
        </p>
      </div>

      {/* Framework cards */}
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMEWORKS.map((fw) => {
            const cfg = STATUS_CONFIG[fw.status];
            const Icon = cfg.icon;
            return (
              <div
                key={fw.name}
                className={`rounded-2xl border p-6 ${cfg.classes}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{fw.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fw.description}</p>
                  </div>
                  <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${cfg.iconClasses}`} />
                </div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_CONFIG[fw.status]}`}>
                  {fw.statusLabel}
                </span>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{fw.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="border-y border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <ScrollText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Every user action within Omnivara is logged with a full audit trail including:
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
                {[
                  'Timestamp (UTC)',
                  'User ID and name',
                  'IP address',
                  'Action type (create, update, delete, export)',
                  'Resource affected (entity type + ID)',
                  'Previous and new values for changes',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                Audit logs are available to organisation admins in{' '}
                <Link href="/settings/audit" className="text-brand-600 hover:underline dark:text-brand-400">
                  Settings → Audit Log
                </Link>. Logs are retained for 90 days on Growth, 1 year on Business, and
                configurable on Enterprise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-processors table */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Sub-processors</h2>
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          We use the following third-party sub-processors. All have signed Data Processing
          Agreements and are subject to our data security requirements.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Sub-processor</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Purpose</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Location</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">DPA signed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
              {SUB_PROCESSORS.map((sp) => (
                <tr key={sp.name} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{sp.name}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{sp.purpose}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{sp.location}</td>
                  <td className="px-5 py-3">
                    {sp.dpa ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Last updated: January 2026. We will notify customers 30 days before adding new sub-processors.
        </p>
      </div>

      {/* Request compliance docs */}
      <div className="border-t border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Request compliance documents</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Need our DPA, answers to a security questionnaire, or a pen test executive summary?
            Our legal team will respond within 2 business days.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="mailto:legal@omnivara.io?subject=Compliance documents request — DPA"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
            >
              Request DPA <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="mailto:legal@omnivara.io?subject=Compliance documents request — Security questionnaire"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Security questionnaire
            </a>
            <a
              href="mailto:legal@omnivara.io?subject=Compliance documents request — Pen test summary"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Pen test summary
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">legal@omnivara.io</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
                <span className="text-xs font-bold text-white">O</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Omnivara</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/security" className="hover:text-gray-900 dark:hover:text-white">Security</Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy</Link>
              <Link href="/compliance" className="hover:text-gray-900 dark:hover:text-white">Compliance</Link>
              <Link href="/status" className="hover:text-gray-900 dark:hover:text-white">Status</Link>
              <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link>
              <Link href="/compare" className="hover:text-gray-900 dark:hover:text-white">Compare</Link>
            </div>
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Omnivara Inc.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
