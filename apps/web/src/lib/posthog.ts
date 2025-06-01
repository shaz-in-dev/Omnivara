/**
 * PostHog analytics client
 * Usage: import posthog from '@/lib/posthog'; posthog.capture('event_name', { ... });
 */
import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We capture manually via usePostHog hook
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug();
    },
  });

  initialized = true;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

export { posthog };
export default posthog;
