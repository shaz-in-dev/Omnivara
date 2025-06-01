import Link from 'next/link';
import { ArrowRight, Target, Briefcase, Wrench } from 'lucide-react';

const PERSONA_PROPS = [
  {
    icon: Target,
    emoji: '🎯',
    label: 'For founders',
    copy: 'Every metric in one dashboard. Know your pipeline, cash flow, and team health at a glance.',
  },
  {
    icon: Briefcase,
    emoji: '💼',
    label: 'For sales teams',
    copy: 'CRM built for how agencies actually sell — relationship-led, not deal-led.',
  },
  {
    icon: Wrench,
    emoji: '🛠',
    label: 'For ops teams',
    copy: 'Projects, helpdesk, and HR in one place. Stop copy-pasting between tools.',
  },
] as const;

const SOCIAL_LOGOS = ['AgencyX', 'Brightline', 'StudioFlow', 'Nexus Co.', 'Rapid MSP'] as const;

const FEATURES = [
  { title: 'CRM', desc: 'Leads, contacts, pipeline, and activity timeline — built for relationship-led sales.' },
  { title: 'Projects', desc: 'Kanban, backlog, milestones, and time tracking. Ship client work on time.' },
  { title: 'Helpdesk', desc: 'Shared inbox, ticket routing, and SLA tracking so nothing slips through.' },
  { title: 'Finance', desc: 'Invoices, expenses, and reports. Get paid faster, stay audit-ready.' },
  { title: 'HR', desc: 'Employee records, leave management, and org charts for your growing team.' },
  { title: 'AI Copilot', desc: 'Ask anything about your business. Drafts, summaries, and smart suggestions built in.' },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
              <span className="text-sm font-bold text-white">O</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Omnivara</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link>
            <Link href="/compare" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Compare</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign in</Link>
          </div>
          <Link
            href="/register"
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-24 text-center sm:px-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Now in public beta — free for the first 3 months
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
          The operating system{' '}
          <span className="bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
            for agencies
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl font-medium text-gray-700 dark:text-gray-300">
          CRM, projects, helpdesk, and finance in one place. AI included.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          Stop juggling five tools. Omnivara gives agencies and professional services firms everything
          they need to run their business, beautifully unified.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-brand-600/30"
          >
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demo"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            See a demo
          </Link>
        </div>

        <p className="mt-4 text-sm text-gray-400">No credit card required · 14-day free trial · Cancel any time</p>
      </section>

      {/* ── Social proof strip ──────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50 py-8 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            Trusted by agencies, consultants, and IT services firms
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {SOCIAL_LOGOS.map((name) => (
              <div
                key={name}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
              >
                [{name}]
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Persona value props ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Built for every role in your agency
          </h2>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            One platform, everyone on the same page.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {PERSONA_PROPS.map(({ emoji, label, copy }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 text-3xl">{emoji}</div>
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{label}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Everything your agency needs
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
              Six modules. One subscription. Zero context-switching.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 inline-flex rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  {title}
                </div>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-brand-500 px-8 py-14 text-center sm:px-12">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            Replace five subscriptions with one
          </h2>
          <p className="mb-2 text-brand-100">
            Omnivara Business replaces your CRM, project tool, helpdesk, finance app, and HR system.
          </p>
          <p className="mb-8 text-sm text-brand-200">
            Average team saves $2,000+/year vs a 5-tool stack.
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
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500">
              <span className="text-xs font-bold text-white">O</span>
            </div>
            <span>Omnivara © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300">Pricing</Link>
            <Link href="/compare" className="hover:text-gray-600 dark:hover:text-gray-300">Compare</Link>
            <Link href="/login" className="hover:text-gray-600 dark:hover:text-gray-300">Sign in</Link>
            <Link href="mailto:hello@omnivara.io" className="hover:text-gray-600 dark:hover:text-gray-300">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
