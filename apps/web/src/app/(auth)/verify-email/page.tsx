'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

type State = 'verifying' | 'success' | 'expired' | 'error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>('verifying');
  const [countdown, setCountdown] = useState(5);
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }

    api
      .get(`/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        // Mark emailVerified in the auth store so the banner disappears immediately
        if (user && accessToken) {
          setAuth({ ...user, emailVerified: true }, accessToken);
        }
        setState('success');
      })
      .catch((err) => {
        const status = err?.response?.status;
        setState(status === 400 ? 'expired' : 'error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-redirect to dashboard after success
  useEffect(() => {
    if (state !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push('/');
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Verifying */}
          {state === 'verifying' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Verifying your email…</h2>
                <p className="mt-1 text-sm text-gray-500">Just a moment</p>
              </div>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email verified!</h2>
                <p className="mt-1 text-sm text-gray-500">Your account is fully activated.</p>
              </div>
              <div className="mt-2 w-full rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Redirecting to dashboard in <span className="font-bold">{countdown}</span>s…
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Go to dashboard →
              </button>
            </div>
          )}

          {/* Expired token */}
          {state === 'expired' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
                <XCircle className="h-7 w-7 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Link expired</h2>
                <p className="mt-1 text-sm text-gray-500">
                  This verification link has expired or already been used.
                  Request a new one from your dashboard.
                </p>
              </div>
              <Link
                href="/"
                className="w-full rounded-xl bg-brand-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-600"
              >
                Go to dashboard
              </Link>
            </div>
          )}

          {/* Generic error (no token in URL) */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                <XCircle className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Invalid link</h2>
                <p className="mt-1 text-sm text-gray-500">
                  This verification link is invalid. Make sure you copied the full URL from the email.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
