'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { initPostHog } from '@/lib/posthog';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Init PostHog once on mount (client-side only)
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" />
      <IntercomWidget />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// ── Intercom widget ───────────────────────────────────────────────────────────
// Only rendered if NEXT_PUBLIC_INTERCOM_APP_ID is set.
// To enable: add the env var and Intercom will boot on every page.

function IntercomWidget() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;
    if (!appId || typeof window === 'undefined') return;

    // Boot Intercom
    (window as Window & { Intercom?: (...args: unknown[]) => void; intercomSettings?: Record<string, unknown> }).intercomSettings = { app_id: appId };

    const w = window as Window & { Intercom?: (...args: unknown[]) => void };
    if (w.Intercom) {
      w.Intercom('reattach_activator');
      w.Intercom('update', (window as Window & { intercomSettings?: Record<string, unknown> }).intercomSettings);
    } else {
      // Inject Intercom loader script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://widget.intercom.io/widget/${appId}`;
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
