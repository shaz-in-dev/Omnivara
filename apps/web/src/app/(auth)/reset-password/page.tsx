'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

/* ── Password strength indicator ─────────────────────────────────────────── */
function StrengthBar({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor = score <= 1 ? 'bg-red-400' : score === 2 ? 'bg-orange-400' : score === 3 ? 'bg-yellow-400' : 'bg-green-500';
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < score ? barColor : 'bg-gray-200 dark:bg-gray-700'}`}
          />
        ))}
        <span className={`ml-2 text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        {checks.map(({ label, ok }) => (
          <div key={label} className={`flex items-center gap-1 text-[11px] ${ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main form ────────────────────────────────────────────────────────────── */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const password = watch('password', '');

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    if (!token) {
      setServerError('Reset token is missing or invalid. Request a new link.');
      return;
    }
    try {
      await api.post('/reset-password', { token, password: values.password });
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Something went wrong. Please try again.');
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <XCircle className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Password updated!</p>
          <p className="mt-1 text-xs text-gray-500">You can now sign in with your new password.</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Sign in →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {serverError}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          New password
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPw ? 'text' : 'password'}
            autoFocus
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        <StrengthBar password={password} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm new password
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Updating password…</>
        ) : (
          'Set new password →'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create a new password</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a strong password to secure your account</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-5 text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-brand-600">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
