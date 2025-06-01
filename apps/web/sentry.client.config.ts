import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Reduce noise in dev; full replay in production
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Traces: sample 10% in prod (1.0 = 100%)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay: capture 10% of sessions, 100% of errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Silence in dev unless DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
