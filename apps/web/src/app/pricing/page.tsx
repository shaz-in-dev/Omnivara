'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check, X, Zap, Building2, Building, Users, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Plan definitions ──────────────────────────────────────────────────────────

const PLANS = [
  {
    id:          'starter',
    name:        'Starter',
    badge:       null,
    price:       { monthly: 0,   annual: 0 },
    description: 'For individuals and tiny teams exploring the platform.',
    icpBullet:   'Perfect for solo consultants and freelancers starting out',
    cta:         'Start free',
    ctaVariant:  'outline' as const,
    icon:        Users,
    limits:      '1 user · 500 records · Community support',
    features: [
      'CRM (leads + contacts)',
      'Project management',
      'Helpdesk (25 tickets/mo)',
      'Basic finance (invoices)',
      '1 GB storage',
    ],
    missing: [
      'AI Copilot',
      'Integrations (Slack, webhooks)',
      'Analytics',
      'HR & Inventory',
      'Priority support',
    ],
  },
  {
    id:          'growth',
    name:        'Growth',
    badge:       'Most popular',
    price:       { monthly: 49,  annual: 39 },
    description: 'Everything a growing team needs to close deals and delight customers.',
    icpBullet:   'Best for agencies with 5–25 people managing multiple clients',
    cta:         'Start 14-day trial',
    ctaVariant:  'primary' as const,
    icon:        Zap,
    limits:      'Up to 10 users · Unlimited records · Email support',
    features: [
      'Everything in Starter',
      'AI Copilot (200 msgs/mo)',
      'Analytics dashboard',
      'Slack + Webhook integrations',
      'HR module',
      'Inventory management',
      'Advanced finance (expenses)',
      '20 GB storage',
      'API access',
    ],
    missing: [
      'Unlimited AI messages',
      'Claude Sonnet model',
      'SAML SSO',
      'Audit logs',
      'Custom roles',
      'Dedicated CSM',
    ],
  },
  {
    id:          'business',
    name:        'Business',
    badge:       null,
    price:       { monthly: 99, annual: 79 },
    description: 'Unlimited AI, enterprise security, and white-glove support.',
    icpBullet:   'Ideal for IT services firms and MSPs needing HR + advanced analytics',
    cta:         'Start 14-day trial',
    ctaVariant:  'primary' as const,
    icon:        Building2,
    limits:      'Unlimited users · Unlimited records · Priority support',
    features: [
      'Everything in Growth',
      'Unlimited AI (Claude Sonnet)',
      'SAML SSO / OIDC',
      'Audit logs & compliance',
      'Custom roles & permissions',
      'Data export (GDPR)',
      '100 GB storage',
      'SLA guarantee',
      'Dedicated CSM',
    ],
    missing: [],
  },
  {
    id:          'enterprise',
    name:        'Enterprise',
    badge:       null,
    price:       { monthly: null, annual: null },
    description: 'Custom pricing for large organisations with complex needs.',
    icpBullet:   'For consulting firms with 100+ headcount needing SSO + custom contracts',
    cta:         'Contact sales',
    ctaVariant:  'outline' as const,
    icon:        Building,
    limits:      'Custom users · Custom SLA · Dedicated infrastructure',
    features: [
      'Everything in Business',
      'On-premise or private cloud',
      'Custom integrations',
      'Volume AI discounts',
      '24/7 phone support',
      'Custom contract & billing',
      'Dedicated infrastructure',
    ],
    missing: [],
  },
] as const;

const COMPARISON_ROWS = [
  { label: 'Users',               starter: '1',        growth: 'Up to 10',   business: 'Unlimited', enterprise: 'Custom' },
  { label: 'Records',             starter: '500',      growth: 'Unlimited',  business: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Storage',             starter: '1 GB',     growth: '20 GB',      business: '100 GB',    enterprise: 'Custom' },
  { label: 'CRM (leads/contacts)',starter: true,       growth: true,         business: true,        enterprise: true },
  { label: 'Projects & tasks',    starter: true,       growth: true,         business: true,        enterprise: true },
  { label: 'Helpdesk',            starter: '25/mo',    growth: 'Unlimited',  business: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Finance & invoicing', starter: true,       growth: true,         business: true,        enterprise: true },
  { label: 'Analytics',           starter: false,      growth: true,         business: true,        enterprise: true },
  { label: 'AI Copilot',          starter: false,      growth: '200 msg/mo', business: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Claude model',        starter: false,      growth: 'Haiku',      business: 'Sonnet',    enterprise: 'Sonnet' },
  { label: 'HR module',           starter: false,      growth: true,         business: true,        enterprise: true },
  { label: 'Inventory',           starter: false,      growth: true,         business: true,        enterprise: true },
  { label: 'Slack integration',   starter: false,      growth: true,         business: true,        enterprise: true },
  { label: 'Webhooks / API',      starter: false,      growth: true,         business: true,        enterprise: true },
  { label: 'SAML SSO',            starter: false,      growth: false,        business: true,        enterprise: true },
  { label: 'Audit logs',          starter: false,      growth: false,        business: true,        enterprise: true },
  { label: 'Custom roles',        starter: false,      growth: false,        business: true,        enterprise: true },
  { label: 'Data export (GDPR)',  starter: false,      growth: false,        business: true,        enterprise: true },
  { label: 'Support',             starter: 'Community',growth: 'Email',      business: 'Priority',  enterprise: '24/7 phone' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Cell({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="mx-auto h-4 w-4 text-brand-500" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-gray-300 dark:text-gray-600" />;
  return <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

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
          <Star className="h-3.5 w-3.5" />
          14-day free trial on all paid plans
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-gray-400">
          One platform. CRM, projects, helpdesk, finance, HR, inventory, and AI — all included.
          No per-seat AI fees. No surprise add-ons.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={cn('text-sm font-medium', !annual ? 'text-gray-900 dark:text-white' : 'text-gray-400')}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              annual ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700',
            )}
          >
            <span className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              annual ? 'translate-x-5' : 'translate-x-0.5',
            )} />
          </button>
          <span className={cn('text-sm font-medium', annual ? 'text-gray-900 dark:text-white' : 'text-gray-400')}>
            Annual
            <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Compare CTA */}
      <div className="pb-6 text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
        >
          See how we compare to Zoho and HubSpot
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = annual ? plan.price.annual : plan.price.monthly;
            const isPrimary = plan.ctaVariant === 'primary';

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6',
                  plan.id === 'growth'
                    ? 'border-brand-500 shadow-lg shadow-brand-500/10 dark:border-brand-400'
                    : 'border-gray-200 dark:border-gray-800',
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-500 px-3 py-0.5 text-xs font-bold text-white">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4 flex items-center gap-2">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    plan.id === 'growth' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{plan.name}</span>
                </div>

                {price === null ? (
                  <p className="mb-1 text-3xl font-bold text-gray-900 dark:text-white">Custom</p>
                ) : price === 0 ? (
                  <p className="mb-1 text-3xl font-bold text-gray-900 dark:text-white">Free</p>
                ) : (
                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">${price}</span>
                    <span className="mb-1 text-sm text-gray-400">/mo</span>
                  </div>
                )}
                {price !== null && price !== 0 && annual && (
                  <p className="mb-1 text-xs text-gray-400">billed annually (${price * 12}/yr)</p>
                )}

                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                  {plan.icpBullet}
                </p>
                <p className="mb-5 text-xs font-medium text-gray-400">{plan.limits}</p>

                <Link
                  href={plan.id === 'enterprise'
                    ? 'mailto:sales@omnivara.io?subject=Enterprise inquiry'
                    : `/register?plan=${plan.id}`}
                  className={cn(
                    'mb-6 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                    isPrimary
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
                  )}
                >
                  {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-400 line-through opacity-60">
                      <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full comparison table */}
      <div className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Full feature comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 text-left font-medium text-gray-500">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className={cn('pb-3 text-center font-semibold', p.id === 'growth' && 'text-brand-600')}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={cn('border-b border-gray-100 dark:border-gray-900', i % 2 === 0 && 'bg-gray-50/50 dark:bg-gray-900/30')}>
                  <td className="py-3 font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                  <td className="py-3 text-center"><Cell value={row.starter} /></td>
                  <td className="py-3 text-center"><Cell value={row.growth} /></td>
                  <td className="py-3 text-center"><Cell value={row.business} /></td>
                  <td className="py-3 text-center"><Cell value={row.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-24 max-w-3xl px-4 pb-24 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Common questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: 'Can I change plans later?',
              a: 'Yes — upgrade or downgrade at any time from Settings → Billing. Upgrades take effect immediately; downgrades apply at the end of your billing period.',
            },
            {
              q: 'What counts as an AI message?',
              a: 'One Copilot conversation turn (your prompt + the AI response) counts as one message. Brief generation is separate and doesn\'t count against your chat limit.',
            },
            {
              q: 'Is there a free trial?',
              a: 'All paid plans include a 14-day free trial with full access and no credit card required.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major cards (Visa, Mastercard, Amex) and bank transfers for annual contracts above $1,000/yr. All payments are processed by Stripe.',
            },
            {
              q: 'How does per-user billing work?',
              a: 'Growth plan includes up to 10 users. Business and Enterprise are unlimited — one flat price for your whole team, no per-seat surprises.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-gray-100 p-6 dark:border-gray-800">
              <p className="mb-2 font-semibold text-gray-900 dark:text-white">{q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA banner */}
      <div className="mx-auto mb-24 max-w-4xl rounded-3xl bg-brand-500 px-8 py-12 text-center sm:px-12">
        <h2 className="mb-2 text-3xl font-bold text-white">Ready to get started?</h2>
        <p className="mb-8 text-brand-100">
          Join hundreds of teams running their entire business on Omnivara.
          14 days free, no credit card required.
        </p>
        <Link
          href="/register?plan=growth"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-brand-600 hover:bg-brand-50"
        >
          Start free trial <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
