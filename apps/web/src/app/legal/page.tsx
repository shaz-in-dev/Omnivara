import { FileText, Download, Mail, Shield, Lock, Users } from 'lucide-react';

export const metadata = {
  title: 'Legal & Compliance — Omnivara',
  description: 'Download procurement and compliance documents: DPA, security questionnaire, sub-processor list, and more.',
};

const DOCS = [
  {
    icon: FileText,
    title: 'Data Processing Agreement (DPA)',
    description: 'GDPR-compliant DPA covering data controller/processor relationships, data subject rights, and sub-processor obligations.',
    action: 'Download PDF',
    href: '/legal/dpa.pdf',
    badge: 'GDPR',
  },
  {
    icon: Shield,
    title: 'Security Questionnaire Answers',
    description: 'Pre-filled answers to the standard 30-question InfoSec questionnaire covering encryption, access control, SDLC, and incident response.',
    action: 'Download PDF',
    href: '/legal/security-questionnaire.pdf',
    badge: 'InfoSec',
  },
  {
    icon: Users,
    title: 'Sub-Processor List',
    description: 'Complete list of third-party sub-processors: AWS, Stripe, Anthropic, OpenAI, Resend, Sentry, and PostHog — with their data roles and locations.',
    action: 'Download PDF',
    href: '/legal/sub-processors.pdf',
    badge: 'GDPR Art. 28',
  },
  {
    icon: Lock,
    title: 'Penetration Test Summary',
    description: 'Executive summary of our most recent third-party penetration test results. Full report available to Enterprise customers under NDA.',
    action: 'Request access',
    href: 'mailto:security@omnivara.io?subject=Pen test report request',
    badge: 'Enterprise',
  },
  {
    icon: FileText,
    title: 'Terms of Service',
    description: 'Our standard customer terms covering subscription, acceptable use, SLAs, and limitation of liability.',
    action: 'View',
    href: '/legal/terms',
    badge: null,
  },
  {
    icon: FileText,
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal data. Includes GDPR and CCPA disclosures.',
    action: 'View',
    href: '/privacy',
    badge: null,
  },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Legal & Compliance</h1>
        <p className="mt-2 text-gray-500">
          Everything your procurement and legal teams need to approve Omnivara. All documents are
          available for self-serve download. Enterprise customers can request custom agreements via{' '}
          <a href="mailto:legal@omnivara.io" className="text-brand-600 hover:underline">
            legal@omnivara.io
          </a>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {DOCS.map((doc) => (
          <div
            key={doc.title}
            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <doc.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{doc.title}</h3>
                  {doc.badge && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                      {doc.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{doc.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <a
                href={doc.href}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {doc.action.includes('Download') ? (
                  <Download className="h-4 w-4" />
                ) : doc.action.includes('Request') ? (
                  <Mail className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {doc.action}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Procurement FAQ */}
      <div className="mt-12">
        <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Procurement FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Where is data stored?',
              a: 'Customer data is stored on AWS in us-east-1. Enterprise customers can request EU data residency (eu-west-1). All storage is encrypted at rest (AES-256) and in transit (TLS 1.3).',
            },
            {
              q: 'Do you offer a custom DPA?',
              a: 'Our standard DPA covers most requirements. Enterprise customers (Business plan and above) can request a custom DPA via legal@omnivara.io. Standard turnaround is 5 business days.',
            },
            {
              q: 'What is your SLA?',
              a: 'Growth and Business plans include 99.9% uptime SLA with 24-hour support response. Enterprise plans include 99.99% uptime and 2-hour response SLA with dedicated Slack channel.',
            },
            {
              q: 'Can we do a security assessment?',
              a: 'Yes. We provide security questionnaire answers, pen test summaries, and architecture documentation. For full technical assessments, contact security@omnivara.io.',
            },
            {
              q: 'Do you support SSO/SAML?',
              a: 'Yes — SAML 2.0 is available on Business and Enterprise plans. We support Okta, Azure AD, Google Workspace, and any generic SAML 2.0 IdP. See our SSO setup guide at /docs/sso.',
            },
            {
              q: 'What are your data retention policies?',
              a: 'Customer data is retained for the duration of the subscription plus 30 days after cancellation. Audit logs: 90 days on Business, 1 year on Enterprise. Data export is available at any time.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <p className="font-semibold text-gray-900 dark:text-white">{q}</p>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Need something not listed here?{' '}
          <a href="mailto:legal@omnivara.io" className="font-medium text-brand-600 hover:underline">
            legal@omnivara.io
          </a>{' '}
          ·{' '}
          <a href="mailto:security@omnivara.io" className="font-medium text-brand-600 hover:underline">
            security@omnivara.io
          </a>
        </p>
      </div>
    </div>
  );
}
