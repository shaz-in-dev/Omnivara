'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Mail, Lock, Bell, Shield, LogOut, Camera,
  Eye, EyeOff, Loader2, Check, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';

/* ── Schemas ──────────────────────────────────────────────────────────────── */
const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  email:     z.string().email('Valid email required'),
  jobTitle:  z.string().optional(),
  phone:     z.string().optional(),
  timezone:  z.string(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current:  z.string().min(1, 'Enter current password'),
    password: z.string().min(8, 'Minimum 8 characters').regex(/[A-Z]/, 'Include uppercase').regex(/[0-9]/, 'Include a number'),
    confirm:  z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore'];

const NOTIFICATION_PREFS = [
  { id: 'task_assigned',    label: 'Task assigned to me',        desc: 'When a task is assigned to you' },
  { id: 'task_comment',     label: 'New comment on my task',     desc: 'When someone comments on your task' },
  { id: 'mention',          label: 'Mentions',                   desc: 'When you are @mentioned' },
  { id: 'ticket_update',    label: 'Helpdesk ticket updates',    desc: 'Status changes on tickets you own' },
  { id: 'invoice_status',   label: 'Invoice status changes',     desc: 'When an invoice is paid or overdue' },
  { id: 'weekly_digest',    label: 'Weekly activity digest',     desc: 'Summary of activity every Monday' },
];

/* ── Tab nav ──────────────────────────────────────────────────────────────── */
type Tab = 'profile' | 'security' | 'notifications';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',       icon: Shield },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
];

/* ── Profile tab ──────────────────────────────────────────────────────────── */
function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.name?.split(' ')[0] ?? '',
      lastName:  user?.name?.split(' ').slice(1).join(' ') ?? '',
      email:     user?.email ?? '',
      timezone:  'UTC',
    },
  });

  const onSubmit = async (values: ProfileForm) => {
    await api.patch('/auth/me', {
      name: `${values.firstName} ${values.lastName}`.trim(),
      jobTitle: values.jobTitle,
      phone: values.phone,
      timezone: values.timezone,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div
          className="relative cursor-pointer"
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
            {initials}
          </div>
          {avatarHover && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Camera className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name ?? 'Your Name'}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <button type="button" className="mt-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
            Upload photo
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
          <input
            {...register('firstName')}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
          <input
            {...register('lastName')}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /> Email address</span>
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Job title + phone */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Job title</label>
          <input
            {...register('jobTitle')}
            placeholder="e.g. Software Engineer"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
          <input
            {...register('phone')}
            type="tel"
            placeholder="+1 555 000 0000"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
        <select
          {...register('timezone')}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save changes'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <Check className="h-4 w-4" /> Saved!
          </div>
        )}
      </div>
    </form>
  );
}

/* ── Security tab ─────────────────────────────────────────────────────────── */
function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (values: PasswordForm) => {
    setServerError('');
    try {
      await api.patch('/auth/me/password', {
        current: values.current,
        password: values.password,
      });
      reset();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Failed to update password. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Change password */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">Change password</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {serverError}
            </div>
          )}

          {([
            { key: 'current' as const, label: 'Current password', show: showCurrent, setShow: setShowCurrent },
            { key: 'password' as const, label: 'New password',     show: showNew,     setShow: setShowNew },
            { key: 'confirm'  as const, label: 'Confirm password', show: showConfirm, setShow: setShowConfirm },
          ]).map(({ key, label, show, setShow }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  {...register(key)}
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-12 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]?.message}</p>}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : 'Update password'}
            </button>
            {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><Check className="h-4 w-4" /> Updated!</span>}
          </div>
        </form>
      </div>

      {/* Sessions */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">Active sessions</h3>
        <div className="space-y-3">
          {[
            { device: 'Chrome on macOS', location: 'San Francisco, US', lastActive: 'Now', current: true },
            { device: 'Safari on iPhone', location: 'San Francisco, US', lastActive: '2 hours ago', current: false },
            { device: 'Firefox on Windows', location: 'New York, US', lastActive: '3 days ago', current: false },
          ].map((session) => (
            <div key={session.device} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{session.device}</p>
                  {session.current && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">Current</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{session.location} · {session.lastActive}</p>
              </div>
              {!session.current && (
                <button className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                  <LogOut className="h-3.5 w-3.5" /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
        <h3 className="mb-1 text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</h3>
        <p className="mb-3 text-xs text-red-600 dark:text-red-500">Deleting your account is permanent and cannot be undone.</p>
        <button className="rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30">
          Delete my account
        </button>
      </div>
    </div>
  );
}

/* ── Notifications tab ────────────────────────────────────────────────────── */
function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, true])),
  );
  const [emailDigest, setEmailDigest] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">In-app notifications</h3>
        <p className="mb-4 text-xs text-gray-500">Choose which events trigger notifications in the notification drawer.</p>
        <div className="space-y-3">
          {NOTIFICATION_PREFS.map((pref) => (
            <label key={pref.id} className="flex cursor-pointer items-start justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{pref.label}</p>
                <p className="text-xs text-gray-400">{pref.desc}</p>
              </div>
              <div
                onClick={() => setPrefs((p) => ({ ...p, [pref.id]: !p[pref.id] }))}
                className={cn(
                  'relative ml-4 mt-0.5 h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors',
                  prefs[pref.id] ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700',
                )}
              >
                <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all', prefs[pref.id] ? 'left-[18px]' : 'left-0.5')} />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">Email notifications</h3>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Weekly digest</p>
            <p className="text-xs text-gray-400">Receive a weekly summary of your activity every Monday morning</p>
          </div>
          <div
            onClick={() => setEmailDigest((v) => !v)}
            className={cn('relative ml-4 h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors', emailDigest ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700')}
          >
            <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all', emailDigest ? 'left-[18px]' : 'left-0.5')} />
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Save preferences
        </button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><Check className="h-4 w-4" /> Saved!</span>}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile, security and notification preferences</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        {tab === 'profile'       && <ProfileTab />}
        {tab === 'security'      && <SecurityTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}
