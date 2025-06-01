'use client';
import { useState } from 'react';
import { X, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface FormState {
  name: string;
  industry: string;
  website: string;
  phone: string;
  employeeCount: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  orgId: string;
}

export function CreateAccountModal({ open, onClose, orgId }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({
    name: '', industry: '', website: '', phone: '', employeeCount: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!open) return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Account name is required';
    if (form.employeeCount && isNaN(Number(form.employeeCount))) {
      e.employeeCount = 'Must be a number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      await api.post(
        '/crm/accounts',
        {
          name: form.name.trim(),
          ...(form.industry.trim() ? { industry: form.industry.trim() } : {}),
          ...(form.website.trim() ? { website: form.website.trim() } : {}),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          ...(form.employeeCount ? { employeeCount: Number(form.employeeCount) } : {}),
        },
        { headers: { 'x-org-id': orgId } },
      );
      await queryClient.invalidateQueries({ queryKey: ['crm', 'accounts', orgId] });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Account</h2>
              <p className="text-xs text-gray-500">Add a company to your CRM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto p-6">
          {serverError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {serverError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Acme Corp"
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-white',
                errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700',
              )}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Industry */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Industry
            </label>
            <input
              value={form.industry}
              onChange={(e) => set('industry', e.target.value)}
              placeholder="e.g. Software, Finance, Healthcare"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Website + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Website
              </label>
              <input
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://example.com"
                type="url"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 555 000 0000"
                type="tel"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Employee count */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Employee count
            </label>
            <input
              value={form.employeeCount}
              onChange={(e) => set('employeeCount', e.target.value)}
              placeholder="e.g. 250"
              type="number"
              min={0}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-white',
                errors.employeeCount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700',
              )}
            />
            {errors.employeeCount && <p className="mt-1 text-xs text-red-500">{errors.employeeCount}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
