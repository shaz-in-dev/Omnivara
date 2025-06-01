'use client';
import { useState } from 'react';
import { Mail, X, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  email: string;
}

export function EmailVerifyBanner({ email }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      await api.post('/auth/verify-email/resend');
      setSent(true);
      setTimeout(() => setSent(false), 8000);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative flex items-center gap-3 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-900/20">
      {/* Icon */}
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
        {sent ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>

      {/* Text */}
      <p className="flex-1 text-amber-800 dark:text-amber-300">
        {sent ? (
          <>
            <span className="font-semibold">Email sent!</span>{' '}
            Check <span className="font-medium">{email}</span> for your verification link.
          </>
        ) : error ? (
          <>
            <span className="text-red-600 dark:text-red-400">{error}</span>{' '}
            <button
              onClick={handleResend}
              className="font-semibold underline underline-offset-2 hover:text-amber-700"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <span className="font-semibold">Verify your email address.</span>{' '}
            We sent a link to <span className="font-medium">{email}</span>.{' '}
            Didn&apos;t get it?{' '}
            <button
              onClick={handleResend}
              disabled={sending}
              className="inline-flex items-center gap-1 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700 disabled:opacity-60 dark:text-amber-200 dark:hover:text-amber-100"
            >
              {sending && <Loader2 className="h-3 w-3 animate-spin" />}
              {sending ? 'Sending…' : 'Resend'}
            </button>
          </>
        )}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto flex-shrink-0 rounded-md p-1 text-amber-600 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/40"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
