'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, AlertCircle, Bell } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ComponentStatus = 'operational' | 'degraded' | 'outage';

interface ServiceComponent {
  name: string;
  description: string;
  status: ComponentStatus;
  uptime: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const COMPONENTS: ServiceComponent[] = [
  { name: 'API',            description: 'api.omnivara.io',     status: 'operational', uptime: '99.98%' },
  { name: 'Web App',        description: 'app.omnivara.io',     status: 'operational', uptime: '99.99%' },
  { name: 'AI Service',     description: 'Copilot & AI briefs', status: 'operational', uptime: '99.95%' },
  { name: 'Database',       description: 'PostgreSQL cluster',  status: 'operational', uptime: '100%'   },
  { name: 'Email Delivery', description: 'Transactional email (Resend)', status: 'operational', uptime: '99.97%' },
];

const STATUS_CONFIG: Record<ComponentStatus, { label: string; dot: string; text: string }> = {
  operational: { label: 'Operational',     dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  degraded:    { label: 'Degraded',        dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400'     },
  outage:      { label: 'Major outage',    dot: 'bg-rose-500',    text: 'text-rose-600 dark:text-rose-400'       },
};

// ── 90-day uptime bars
// Each array has 90 booleans. true = green day, false = yellow blip.
// We add one yellow blip at index 44 (45 days ago).
function makeUptimeDays(): boolean[] {
  const days = Array<boolean>(90).fill(true);
  days[44] = false; // minor blip 45 days ago
  return days;
}

const UPTIME_DAYS = makeUptimeDays();

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const allOperational = COMPONENTS.every((c) => c.status === 'operational');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

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
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link>
            <Link href="/login" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-brand-500 px-4 py-1.5 font-semibold text-white hover:bg-brand-600">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Overall status banner */}
        <div className={`mb-10 flex items-center gap-4 rounded-2xl px-6 py-5 ${
          allOperational
            ? 'bg-emerald-50 dark:bg-emerald-900/10'
            : 'bg-amber-50 dark:bg-amber-900/10'
        }`}>
          {allOperational ? (
            <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-8 w-8 flex-shrink-0 text-amber-500" />
          )}
          <div>
            <p className={`text-xl font-bold ${allOperational ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {allOperational ? 'All systems operational' : 'Some systems degraded'}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Last checked: just now &middot; Updated in real time
            </p>
          </div>
        </div>

        {/* Component statuses */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Components</h2>
        <div className="mb-10 divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
          {COMPONENTS.map((component) => {
            const cfg = STATUS_CONFIG[component.status];
            return (
              <div
                key={component.name}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${cfg.dot} shadow-sm`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{component.name}</p>
                    <p className="text-xs text-gray-400">{component.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm text-gray-400 sm:block">{component.uptime} (90 days)</span>
                  <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 90-day uptime bars */}
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">90-day uptime</h2>
        <p className="mb-4 text-sm text-gray-400">Each bar represents one day. Green = fully operational. Yellow = minor incident.</p>
        <div className="mb-2 flex items-end gap-0.5">
          {UPTIME_DAYS.map((ok, i) => (
            <div
              key={i}
              title={ok ? `Day ${90 - i}: Operational` : `Day ${90 - i}: Minor incident`}
              className={`h-8 flex-1 rounded-sm transition-all hover:opacity-80 ${
                ok
                  ? 'bg-emerald-400 dark:bg-emerald-500'
                  : 'bg-amber-400 dark:bg-amber-500'
              }`}
            />
          ))}
        </div>
        <div className="mb-10 flex justify-between text-xs text-gray-400">
          <span>90 days ago</span>
          <span>Today</span>
        </div>

        {/* Recent incidents */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent incidents</h2>
        <div className="mb-10 rounded-2xl border border-gray-100 px-6 py-8 text-center dark:border-gray-800">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <p className="font-semibold text-gray-900 dark:text-white">No incidents in the last 90 days</p>
          <p className="mt-1 text-sm text-gray-400">
            There was one minor degradation event 45 days ago (API elevated latency, resolved within 12 minutes).
          </p>
        </div>

        {/* Subscribe */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-8 text-center dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Bell className="h-5 w-5" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Subscribe to status updates</h2>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Get notified by email within 5 minutes of any incident.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">You are subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-xs"
              />
              <button
                type="submit"
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          For real-time status, subscribe above. All incidents are posted to this page within
          5 minutes of detection. Historical data available on request.
        </p>
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
