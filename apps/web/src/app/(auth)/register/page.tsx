'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { authApi, api } from '@/lib/api';
import { saveTokens } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth.store';

const PLAN_LABELS: Record<string, string> = {
  growth:   'Growth — $49/mo (14-day free trial, no card required)',
  business: 'Business — $149/mo (14-day free trial, no card required)',
};

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid work email'),
  orgName: z.string().min(2, 'Company name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
});
type FormValues = z.infer<typeof schema>;

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'A number', test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
  const router      = useRouter();
  const params      = useSearchParams();
  const selectedPlan = params.get('plan') ?? 'starter';
  const isPaidPlan  = selectedPlan === 'growth' || selectedPlan === 'business';
  const setAuth     = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      const { data } = await authApi.register(values);
      const { accessToken, refreshToken, user } = data;
      const orgId = user?.orgs?.[0]?.orgId ?? user?.orgId;
      saveTokens(accessToken, refreshToken);
      setAuth({ ...user, orgId }, accessToken, refreshToken);

      // For paid plans, redirect to Stripe checkout immediately after registration
      if (isPaidPlan && user?.orgId) {
        try {
          const { data: session } = await api.post<{ url: string }>(
            '/billing/checkout',
            { planId: selectedPlan },
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          if (session?.url) {
            window.location.href = session.url;
            return;
          }
        } catch {
          // Checkout failed — fall through to dashboard, user can upgrade from billing page
        }
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(msg) ? (msg[0] ?? 'Registration failed.') : (msg ?? 'Registration failed. Please try again.');
      setServerError(text);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
              <span className="text-xl font-bold text-white">O</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isPaidPlan ? 'Start your 14-day free trial — no credit card yet' : 'Free forever — upgrade anytime'}
          </p>
        </div>

        {/* Plan badge */}
        {isPaidPlan && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
            <Zap className="h-4 w-4 flex-shrink-0" />
            <span>{PLAN_LABELS[selectedPlan]}</span>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First name
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  autoComplete="given-name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last name
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  autoComplete="family-name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Work email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company name
              </label>
              <input
                {...register('orgName')}
                type="text"
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.orgName && <p className="mt-1 text-xs text-red-500">{errors.orgName.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(passwordValue);
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        <CheckCircle2 className={`h-3.5 w-3.5 ${met ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            By signing up you agree to our{' '}
            <Link href="/terms" className="text-brand-600 hover:underline">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
          </p>
          <div className="mt-3 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
