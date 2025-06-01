'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Loader2, CheckCircle2, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  jobTitle: z.string().max(100).optional(),
  timezone: z.string().max(60).optional(),
  phone: z.string().max(30).optional(),
});
type FormValues = z.infer<typeof schema>;

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const { data } = await api.patch('/auth/me', values);
    const updated = data?.data ?? data;
    if (user && accessToken) {
      setAuth(
        { ...user, name: updated.name ?? values.name },
        accessToken,
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = data?.data ?? data;
      if (user && accessToken) {
        setAuth(
          { ...user, avatarUrl: updated.avatarUrl ?? user.avatarUrl },
          accessToken,
        );
      }
    } catch {
      // Keep preview but show nothing — silent fail
    } finally {
      setAvatarUploading(false);
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  const avatarSrc = avatarPreview ?? user?.avatarUrl;

  return (
    <div className="p-6 space-y-6">
      {/* Avatar */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Profile photo</h3>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user?.name}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/30">
                <span className="text-xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Camera className="h-4 w-4" />
              {avatarUploading ? 'Uploading…' : 'Change photo'}
            </button>
            <p className="mt-1.5 text-xs text-gray-400">JPG, PNG or GIF · max 5 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personal information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="Alex Admin"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Job title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Job title
            </label>
            <input
              {...register('jobTitle')}
              type="text"
              placeholder="Head of Sales"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+1 555 000 0000"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Timezone */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Timezone
            </label>
            <select
              {...register('timezone')}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select timezone…</option>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Email (read-only) */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-700/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</span>
              {user?.emailVerified ? (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  Unverified
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">Contact support to change your email address.</p>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
