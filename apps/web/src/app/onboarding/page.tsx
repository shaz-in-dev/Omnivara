'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2, Users, Puzzle, Rocket, ChevronRight, ChevronLeft,
  Check, Loader2, LayoutGrid, Headphones, DollarSign, Package,
  BarChart2, UserCog, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

/* ── Steps ────────────────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Your organisation', icon: Building2 },
  { id: 2, label: 'Invite team',       icon: Users },
  { id: 3, label: 'Select modules',   icon: Puzzle },
  { id: 4, label: 'Business type',     icon: BarChart2 },
  { id: 5, label: 'Ready to go',       icon: Rocket },
] as const;

/* ── Module tiles ─────────────────────────────────────────────────────────── */
const MODULES = [
  { id: 'crm',       label: 'CRM',        desc: 'Leads, contacts, pipeline', icon: Users,      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  { id: 'projects',  label: 'Projects',   desc: 'Tasks, sprints, kanban',    icon: LayoutGrid, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'helpdesk',  label: 'Helpdesk',   desc: 'Tickets, SLAs, queues',     icon: Headphones, color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  { id: 'finance',   label: 'Finance',    desc: 'Invoices, expenses',        icon: DollarSign, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'hr',        label: 'HR',         desc: 'Employees, leave, payroll', icon: UserCog,    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  { id: 'inventory', label: 'Inventory',  desc: 'Products, stock, orders',   icon: Package,    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 'analytics', label: 'Analytics',  desc: 'Dashboards, reports',       icon: BarChart2,  color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
] as const;

type ModuleId = (typeof MODULES)[number]['id'];

/* ── Schemas ──────────────────────────────────────────────────────────────── */
const orgSchema = z.object({
  name:     z.string().min(2, 'Organisation name is required'),
  industry: z.string().min(1, 'Select an industry'),
  size:     z.string().min(1, 'Select a team size'),
  website:  z.string().url('Enter a valid URL').optional().or(z.literal('')),
});
type OrgForm = z.infer<typeof orgSchema>;

const inviteSchema = z.object({
  emails: z.string().optional(),
});
type InviteForm = z.infer<typeof inviteSchema>;

const INDUSTRIES = ['SaaS / Technology', 'E-commerce / Retail', 'Professional Services', 'Healthcare', 'Finance / Fintech', 'Manufacturing', 'Education', 'Other'];
const SIZES = ['Just me', '2–10', '11–50', '51–200', '200+'];

/* ── Step 1: Organisation ─────────────────────────────────────────────────── */
function StepOrg({ onNext, saving }: { onNext: (d: OrgForm) => void; saving: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Organisation name <span className="text-red-400">*</span></label>
        <input
          {...register('name')}
          placeholder="Acme Corp"
          autoFocus
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Industry <span className="text-red-400">*</span></label>
          <select
            {...register('industry')}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select…</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          {errors.industry && <p className="mt-1 text-xs text-red-500">{errors.industry.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Team size <span className="text-red-400">*</span></label>
          <select
            {...register('size')}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select…</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.size && <p className="mt-1 text-xs text-red-500">{errors.size.message}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-gray-400" /> Website <span className="text-gray-400 font-normal">(optional)</span></span>
        </label>
        <input
          {...register('website')}
          type="url"
          placeholder="https://acme.com"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>}
      </div>

      <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Continue <ChevronRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

/* ── Step 2: Invite team ──────────────────────────────────────────────────── */
function StepInvite({ onNext, onBack, saving }: { onNext: (emails: string[]) => void; onBack: () => void; saving: boolean }) {
  const { register } = useForm<InviteForm>();
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTag = (val: string) => {
    const emails = val.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e && /^[^@]+@[^@]+\.[^@]+$/.test(e));
    setTags((prev) => [...new Set([...prev, ...emails])]);
    setInput('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Invite teammates by email</label>
        <div className="min-h-[100px] rounded-xl border border-gray-200 bg-gray-50 p-3 focus-within:border-brand-500 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                {tag}
                <button type="button" onClick={() => setTags((p) => p.filter((t) => t !== tag))} className="ml-0.5 text-brand-400 hover:text-brand-700">×</button>
              </span>
            ))}
          </div>
          <input
            {...register('emails')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (['Enter', ',', ' ', 'Tab'].includes(e.key)) {
                e.preventDefault();
                if (input.trim()) addTag(input);
              }
            }}
            onBlur={() => { if (input.trim()) addTag(input); }}
            placeholder={tags.length === 0 ? 'sarah@company.com, alex@company.com…' : 'Add more…'}
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-white"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-400">Separate multiple emails with comma, space, or Enter</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onNext(tags)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Inviting…</>
          ) : tags.length > 0 ? (
            `Invite ${tags.length} teammate${tags.length > 1 ? 's' : ''} →`
          ) : (
            'Skip for now →'
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Modules ──────────────────────────────────────────────────────── */
function StepModules({ onNext, onBack, saving }: { onNext: (modules: ModuleId[]) => void; onBack: () => void; saving: boolean }) {
  const [selected, setSelected] = useState<ModuleId[]>(['crm', 'projects', 'helpdesk']);

  const toggle = (id: ModuleId) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Pick the modules you want to start with. You can always enable more later.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {MODULES.map(({ id, label, desc, icon: Icon, color }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                active
                  ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
              )}
            >
              {active && (
                <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-[11px] text-gray-400">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => onNext(selected)}
          disabled={selected.length === 0 || saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            `Continue with ${selected.length} module${selected.length !== 1 ? 's' : ''} →`
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Business type / template ─────────────────────────────────────── */
const TEMPLATE_OPTIONS = [
  { id: 'agency',      name: 'Agency & Creative Studio',          icon: '🎨', desc: 'Pipeline stages, project types, and helpdesk categories for agencies' },
  { id: 'msp',         name: 'IT Services & MSP',                 icon: '🖥️', desc: 'Ticket categories, SLA presets, and pipeline stages for managed service providers' },
  { id: 'consulting',  name: 'Consulting & Professional Services', icon: '📊', desc: 'Engagement phases, milestone billing, and project structures for consulting firms' },
  { id: 'other',       name: 'Other',                             icon: '⚙️', desc: 'Skip templates and set up your workspace manually' },
] as const;

type TemplateId = (typeof TEMPLATE_OPTIONS)[number]['id'];

function StepTemplate({
  orgId,
  onNext,
  onBack,
  saving,
}: {
  orgId: string;
  onNext: (templateId: TemplateId) => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<TemplateId | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<TemplateId | null>(null);

  const handleApply = async () => {
    if (!selected) return;
    if (selected === 'other') { onNext('other'); return; }
    setApplying(true);
    try {
      await api.post(`/orgs/${orgId}/templates/${selected}/apply`);
      setApplied(selected);
      setTimeout(() => onNext(selected), 1200);
    } catch {
      // non-fatal — just skip template application
      onNext(selected);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        We&apos;ll pre-configure pipeline stages, categories, and invoice line items for your industry.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATE_OPTIONS.map((t) => {
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={cn(
                'relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all',
                isSelected
                  ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
              )}
            >
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {applied && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <Check className="h-4 w-4 flex-shrink-0" />
          Your workspace is configured for{' '}
          {TEMPLATE_OPTIONS.find((t) => t.id === applied)?.name} ✓
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={!selected || applying || saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {applying ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Applying template…</>
          ) : selected === 'other' ? (
            'Skip & continue →'
          ) : selected ? (
            'Apply & continue →'
          ) : (
            'Select a business type'
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Step 5: All done ─────────────────────────────────────────────────────── */
function StepDone({ orgName, modules, onFinish, finishing }: { orgName: string; modules: ModuleId[]; onFinish: () => void; finishing: boolean }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
        <Rocket className="h-10 w-10 text-brand-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {orgName} is ready to launch! 🎉
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          We&apos;ve set up {modules.length} module{modules.length !== 1 ? 's' : ''} for your team.
          Your workspace is configured and waiting.
        </p>
      </div>

      {/* Module summary */}
      <div className="flex flex-wrap justify-center gap-2">
        {modules.map((id) => {
          const mod = MODULES.find((m) => m.id === id)!;
          const Icon = mod.icon;
          return (
            <span key={id} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold', mod.color)}>
              <Icon className="h-3.5 w-3.5" /> {mod.label}
            </span>
          );
        })}
      </div>

      <button
        onClick={onFinish}
        disabled={finishing}
        className="flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {finishing ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up…</> : <>Go to dashboard →</>}
      </button>
    </div>
  );
}

/* ── Shell ────────────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [step, setStep] = useState(1);
  const [orgData, setOrgData] = useState<OrgForm | null>(null);
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([]);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  // Step 4 template selection (no extra state needed — handled inside StepTemplate)

  /* Step 1: save org metadata into settings JSON */
  const handleOrgNext = async (data: OrgForm) => {
    setSaving(true);
    try {
      await api.patch(`/orgs/${orgId}/settings`, {
        settings: { industry: data.industry, size: data.size, website: data.website || undefined },
      });
      setOrgData(data);
      setStep(2);
    } catch {
      // non-fatal — continue anyway
      setOrgData(data);
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  /* Step 2: send invites (fire-and-forget per email) */
  const handleInviteNext = async (emails: string[]) => {
    setSaving(true);
    try {
      await Promise.allSettled(
        emails.map((email) => api.post(`/orgs/${orgId}/members/invite`, { email })),
      );
    } finally {
      setSaving(false);
      setStep(3);
    }
  };

  /* Step 3: save selected modules */
  const handleModulesNext = async (modules: ModuleId[]) => {
    setSaving(true);
    try {
      await api.patch(`/orgs/${orgId}/settings`, {
        settings: { modules },
      });
      setSelectedModules(modules);
      setStep(4);
    } catch {
      setSelectedModules(modules);
      setStep(4);
    } finally {
      setSaving(false);
    }
  };

  /* Step 4: template applied (or skipped) — move to step 5 */
  const handleTemplateNext = (_templateId: TemplateId) => {
    setStep(5);
  };

  /* Step 5: mark onboarding complete, redirect */
  const handleFinish = async () => {
    setFinishing(true);
    try {
      await api.patch(`/orgs/${orgId}/settings`, { onboardingCompleted: true });
    } finally {
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <span className="text-lg font-bold text-white">O</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Omnivara</span>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {STEPS.map(({ id, label, icon: Icon }, idx) => {
            const done = step > id;
            const active = step === id;
            return (
              <div key={id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                    done   ? 'border-brand-500 bg-brand-500 text-white'
                    : active ? 'border-brand-500 bg-white text-brand-600 dark:bg-gray-900'
                    : 'border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900',
                  )}>
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={cn('hidden text-[11px] font-medium sm:block', active ? 'text-brand-600' : done ? 'text-gray-500' : 'text-gray-400')}>
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('mx-2 mb-5 h-0.5 w-12 transition-all sm:w-16', done ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700')} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Step headings */}
          {step !== 5 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {step === 1 && 'Tell us about your organisation'}
                {step === 2 && 'Invite your team'}
                {step === 3 && 'Choose your modules'}
                {step === 4 && 'What kind of business are you?'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {step === 1 && 'This helps us customise Omnivara for you.'}
                {step === 2 && 'Get your team up and running from day one.'}
                {step === 3 && 'Enable only what you need — less clutter, more focus.'}
                {step === 4 && 'We\'ll pre-configure your workspace to match your industry.'}
              </p>
            </div>
          )}

          {step === 1 && <StepOrg onNext={handleOrgNext} saving={saving} />}
          {step === 2 && <StepInvite onNext={handleInviteNext} onBack={() => setStep(1)} saving={saving} />}
          {step === 3 && <StepModules onNext={handleModulesNext} onBack={() => setStep(2)} saving={saving} />}
          {step === 4 && (
            <StepTemplate
              orgId={orgId}
              onNext={handleTemplateNext}
              onBack={() => setStep(3)}
              saving={saving}
            />
          )}
          {step === 5 && (
            <StepDone
              orgName={orgData?.name ?? 'Your workspace'}
              modules={selectedModules}
              onFinish={handleFinish}
              finishing={finishing}
            />
          )}
        </div>
      </div>
    </div>
  );
}
