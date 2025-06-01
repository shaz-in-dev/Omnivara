import Link from 'next/link';
import {
  Lock,
  Shield,
  Database,
  Server,
  Eye,
  RefreshCw,
  FileSearch,
  Mail,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────────────────────

const SECURITY_SECTIONS = [
  {
    icon: Lock,
    title: 'Encryption',
    color: 'brand',
    items: [
      'AES-256 encryption at rest for all customer data',
      'TLS 1.3 enforced in transit — no fallback to older versions',
      'Encrypted database backups stored in isolated S3 buckets',
      'Encryption keys managed via AWS KMS with automatic rotation',
    ],
  },
  {
    icon: Shield,
    title: 'Access Control',
    color: 'indigo',
    items: [
      'Role-Based Access Control (RBAC) + Attribute-Based Access Control (ABAC)',
      'JWT access tokens with 15-minute expiry — short-lived by design',
      'Automatic refresh token rotation on every use',
      'SSO/SAML 2.0 + OIDC for Enterprise customers',
      'MFA available on all plans (TOTP)',
    ],
  },
  {
    icon: Server,
    title: 'Infrastructure',
    color: 'violet',
    items: [
      'Hosted on AWS (US-East primary, EU available for Enterprise)',
      'Tenant data isolated via Row-Level Security in PostgreSQL',
      'No shared application state between tenants',
      'Private VPC with no public database endpoints',
      'WAF and DDoS protection via AWS Shield Standard',
    ],
  },
  {
    icon: Database,
    title: 'Backups & Recovery',
    color: 'emerald',
    items: [
      'Daily automated database snapshots',
      '30-day backup retention with point-in-time recovery',
      'Cross-region backup replication for Enterprise',
      'Restore tested monthly in isolated environment',
    ],
  },
  {
    icon: Eye,
    title: 'Monitoring & Alerting',
    color: 'amber',
    items: [
      'Sentry for real-time error tracking and anomaly detection',
      'Uptime monitoring with sub-minute check intervals',
      'On-call alerting within 5 minutes of any incident',
      'All authentication events logged and auditable',
      'Automated anomalous-access detection',
    ],
  },
  {
    icon: RefreshCw,
    title: 'Vulnerability Management',
    color: 'rose',
    items: [
      'Annual third-party penetration tests — summary available on request',
      'Dependabot automated dependency patching',
      'OWASP Top 10 mitigations applied across all services',
      'Internal security review for all significant feature changes',
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  brand:   'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
  indigo:  'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  violet:  'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  amber:   'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  rose:    'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
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
            <Link href="/security" className="font-medium text-brand-600 dark:text-brand-400">Security</Link>
            <Link href="/compliance" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Compliance</Link>
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
          <Lock className="h-3.5 w-3.5" />
          Security first, always
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Security you can trust.<br className="hidden sm:block" />
          Transparency you deserve.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          Omnivara is built security-first. From encrypted data at rest to isolated tenant
          infrastructure, we treat your data with the same care you do. Here is exactly what
          we do to protect it.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          {['AES-256 at rest', 'TLS 1.3', 'Row-Level Security', 'JWT + RBAC', 'SOC 2 in progress'].map((badge) => (
            <span key={badge} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Security cards grid */}
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_SECTIONS.map((section) => {
            const Icon = section.icon;
            const iconClasses = COLOR_MAP[section.color] ?? COLOR_MAP.brand;
            return (
              <div
                key={section.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconClasses}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* SOC 2 Roadmap */}
      <div className="border-y border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <FileSearch className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                In progress
              </div>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">SOC 2 Type II Certification</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We are actively pursuing SOC 2 Type II certification. We have implemented all
                required controls and are currently undergoing the observation period with our
                auditor. <strong className="font-semibold text-gray-800 dark:text-gray-200">Expected completion: Q2 2026.</strong> Existing
                customers will receive the final report upon certification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Penetration Testing */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Penetration Testing</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            We commission annual third-party penetration tests from independent security firms.
            The most recent test was completed in <strong className="font-semibold text-gray-800 dark:text-gray-200">Q4 2025</strong>.
            A high-level executive summary is available on request to prospective Business and
            Enterprise customers under NDA.
          </p>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">
            All critical and high findings from pen tests are remediated within 30 days. Medium
            findings within 90 days.
          </p>
        </div>
      </div>

      {/* Responsible Disclosure */}
      <div className="border-y border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Responsible Disclosure</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            We welcome and appreciate responsible security research. If you discover a
            vulnerability, please follow our coordinated disclosure policy.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Report to us', body: 'Email security@omnivara.io with a detailed description and reproduction steps. PGP key available on request.' },
              { title: '90-day timeline', body: 'We ask researchers to give us 90 days to investigate and remediate before public disclosure.' },
              { title: 'Good-faith protection', body: 'We will not pursue legal action against researchers acting in good faith under this policy.' },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Questions about security?</h2>
        <p className="mx-auto mt-2 max-w-md text-gray-500 dark:text-gray-400">
          Our security team responds to all inquiries within one business day.
        </p>
        <a
          href="mailto:security@omnivara.io"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
        >
          security@omnivara.io <ArrowRight className="h-4 w-4" />
        </a>
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
