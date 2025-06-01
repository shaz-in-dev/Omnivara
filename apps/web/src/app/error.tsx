'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log to Sentry / observability in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[GlobalError]', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 dark:bg-gray-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          An unexpected error occurred. The issue has been logged and we&apos;ll look into it.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <a
          href="/"
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
