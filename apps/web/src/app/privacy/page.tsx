import Link from 'next/link';
import { ArrowRight, Download, Mail } from 'lucide-react';

// ── Shared nav + footer are inlined per page (no shared layout for public pages yet) ──

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-3 text-gray-600 dark:text-gray-400">{children}</div>
    </section>
  );
}

const TOC = [
  { id: 'controller',   label: '1. Data Controller' },
  { id: 'collect',      label: '2. What We Collect' },
  { id: 'why',          label: '3. Why We Collect It' },
  { id: 'legal',        label: '4. Legal Basis' },
  { id: 'retention',    label: '5. Data Retention' },
  { id: 'rights',       label: '6. Your Rights' },
  { id: 'transfers',    label: '7. Data Transfers' },
  { id: 'cookies',      label: '8. Cookies' },
  { id: 'children',     label: '9. Children' },
  { id: 'contact',      label: '10. Contact & DPA' },
];

export default function PrivacyPage() {
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
            <Link href="/compliance" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Compliance</Link>
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link>
            <Link href="/login" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-brand-500 px-4 py-1.5 font-semibold text-white hover:bg-brand-600">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">

          {/* Sidebar ToC */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-20">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Contents</p>
              <nav className="space-y-1">
                {TOC.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-12">
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-400">Last updated: January 2026</p>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                This Privacy Policy explains how Omnivara Inc. collects, uses, stores, and
                shares your personal data when you use our services. We are committed to
                full GDPR compliance and to giving you meaningful control over your data.
              </p>
            </div>

            <Section id="controller" title="1. Data Controller">
              <p>
                <strong className="font-semibold text-gray-900 dark:text-white">Omnivara Inc.</strong> is the data controller for personal data
                processed through the Omnivara platform. For queries about this policy or to
                exercise your rights, contact us at{' '}
                <a href="mailto:privacy@omnivara.io" className="text-brand-600 hover:underline dark:text-brand-400">
                  privacy@omnivara.io
                </a>.
              </p>
            </Section>

            <Section id="collect" title="2. What Data We Collect">
              <p>We collect the following categories of personal data:</p>
              <ul className="ml-4 list-disc space-y-2 text-sm">
                <li>
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Account information:</strong>{' '}
                  Name, email address, password (hashed), organisation name, and profile photo.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Usage data:</strong>{' '}
                  Pages visited, features used, session duration, browser and device type, IP
                  address, and timestamps of actions performed within the platform.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Payment information:</strong>{' '}
                  Billing name, address, and card details. Card numbers are never stored by
                  Omnivara — all payment processing is handled by{' '}
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Stripe</strong>, a PCI-DSS Level 1 certified processor.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Customer business data:</strong>{' '}
                  Data you import or create within the platform (CRM contacts, projects, helpdesk
                  tickets, etc.). This data is processed strictly on your behalf and you remain
                  the data controller for it.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Communications:</strong>{' '}
                  Emails and support messages you send to us.
                </li>
              </ul>
            </Section>

            <Section id="why" title="3. Why We Collect It">
              <ul className="ml-4 list-disc space-y-2 text-sm">
                <li><strong className="font-semibold text-gray-800 dark:text-gray-200">Service delivery:</strong> To create and manage your account, run the platform, and deliver the features you have paid for.</li>
                <li><strong className="font-semibold text-gray-800 dark:text-gray-200">Billing:</strong> To process subscription payments and issue invoices.</li>
                <li><strong className="font-semibold text-gray-800 dark:text-gray-200">Support:</strong> To respond to your support requests and diagnose technical issues.</li>
                <li><strong className="font-semibold text-gray-800 dark:text-gray-200">Security:</strong> To detect and prevent fraud, abuse, and security incidents.</li>
                <li><strong className="font-semibold text-gray-800 dark:text-gray-200">Product improvement:</strong> Aggregated, anonymised analytics to understand how the platform is used and where to improve it.</li>
                <li><strong className="font-semibold text-gray-800 dark:text-gray-200">Communications:</strong> Transactional emails (password resets, billing receipts) and, with your consent, product updates.</li>
              </ul>
            </Section>

            <Section id="legal" title="4. Legal Basis (GDPR)">
              <p>We rely on the following legal bases under Article 6 GDPR:</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Legal basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                    {[
                      ['Account creation & platform access', 'Contract performance (Art. 6(1)(b))'],
                      ['Payment processing', 'Contract performance (Art. 6(1)(b))'],
                      ['Security and fraud prevention', 'Legitimate interest (Art. 6(1)(f))'],
                      ['Aggregated product analytics', 'Legitimate interest (Art. 6(1)(f))'],
                      ['Marketing emails', 'Consent (Art. 6(1)(a)) — opt-in only'],
                      ['Legal obligations', 'Legal obligation (Art. 6(1)(c))'],
                    ].map(([purpose, basis]) => (
                      <tr key={purpose}>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{purpose}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="retention" title="5. Data Retention">
              <p>
                We retain your personal data for as long as your account is active. Upon account
                deletion, your data is marked for deletion and permanently purged within{' '}
                <strong className="font-semibold text-gray-800 dark:text-gray-200">30 days</strong>, except where we are legally
                required to retain it longer (e.g., financial records under applicable tax law).
              </p>
              <p className="text-sm">
                Backup copies may persist for up to 30 days after the purge date as part of our
                disaster-recovery snapshots. These backups are encrypted and access-controlled.
              </p>
            </Section>

            <Section id="rights" title="6. Your Rights">
              <p>
                Under the GDPR (and equivalent legislation in other jurisdictions), you have the
                following rights with respect to your personal data:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { right: 'Access', desc: 'Request a copy of the personal data we hold about you.' },
                  { right: 'Portability', desc: 'Receive your data in a structured, machine-readable format (JSON/CSV).' },
                  { right: 'Erasure', desc: 'Request deletion of your personal data ("right to be forgotten").' },
                  { right: 'Correction', desc: 'Request correction of inaccurate or incomplete personal data.' },
                  { right: 'Restriction', desc: 'Ask us to restrict processing of your data in certain circumstances.' },
                  { right: 'Objection', desc: 'Object to processing based on legitimate interests.' },
                ].map(({ right, desc }) => (
                  <div key={right} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                    <p className="mb-1 font-semibold text-gray-900 dark:text-white">{right}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                To exercise any right, email{' '}
                <a href="mailto:privacy@omnivara.io" className="text-brand-600 hover:underline dark:text-brand-400">privacy@omnivara.io</a>.
                We will respond within 30 days. You also have the right to lodge a complaint with
                your local data protection authority.
              </p>
            </Section>

            <Section id="transfers" title="7. Data Transfers">
              <p>
                Your data is primarily stored on{' '}
                <strong className="font-semibold text-gray-800 dark:text-gray-200">AWS US-East-1</strong>. Enterprise
                customers may request EU data residency (AWS eu-west-1). We transfer data to the
                following sub-processors:
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Sub-processor</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                    {[
                      ['AWS', 'Infrastructure & storage', 'US / EU'],
                      ['Stripe', 'Payment processing', 'US / EU'],
                      ['Anthropic', 'AI Copilot (Claude)', 'US'],
                      ['OpenAI', 'Embeddings', 'US'],
                      ['Resend', 'Transactional email', 'US'],
                      ['Sentry', 'Error tracking', 'US'],
                      ['PostHog', 'Product analytics', 'US / EU'],
                    ].map(([proc, purpose, location]) => (
                      <tr key={proc}>
                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{proc}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{purpose}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm">
                All sub-processors are subject to Data Processing Agreements and provide
                adequate safeguards for international data transfers (Standard Contractual
                Clauses or adequacy decisions where applicable).
              </p>
            </Section>

            <Section id="cookies" title="8. Cookies">
              <p>We use the following categories of cookies:</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Required?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                    {[
                      ['Session', 'Keeps you logged in during your browser session', 'Yes'],
                      ['Preference', 'Remembers theme (dark/light) and UI preferences', 'Yes'],
                      ['Analytics (PostHog)', 'Aggregated usage analytics to improve the product', 'No — opt-out available'],
                    ].map(([cat, purpose, required]) => (
                      <tr key={cat}>
                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{cat}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{purpose}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{required}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm">
                You can opt out of analytics cookies at any time from Settings → Privacy.
              </p>
            </Section>

            <Section id="children" title="9. Children">
              <p>
                Omnivara is a business-to-business platform. We do not knowingly collect personal
                data from individuals under the age of <strong className="font-semibold text-gray-800 dark:text-gray-200">16</strong>. If
                you believe a minor has provided us personal data, please contact{' '}
                <a href="mailto:privacy@omnivara.io" className="text-brand-600 hover:underline dark:text-brand-400">
                  privacy@omnivara.io
                </a>{' '}
                and we will delete it promptly.
              </p>
            </Section>

            <Section id="contact" title="10. Contact Us & DPA">
              <p>
                For any privacy-related question, to exercise your rights, or to request our
                Data Processing Agreement, contact our privacy team:
              </p>
              <a
                href="mailto:privacy@omnivara.io"
                className="mt-2 inline-flex items-center gap-2 font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                <Mail className="h-4 w-4" />
                privacy@omnivara.io
              </a>

              {/* DPA download */}
              <div className="mt-6 flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-5 dark:border-brand-900/30 dark:bg-brand-900/10">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Data Processing Agreement</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Download our standard DPA template. Enterprise customers requiring a custom
                    DPA should contact{' '}
                    <a href="mailto:legal@omnivara.io" className="text-brand-600 hover:underline dark:text-brand-400">
                      legal@omnivara.io
                    </a>.
                  </p>
                  <a
                    href="/legal/dpa.pdf"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    Download DPA template <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </Section>
          </main>
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
