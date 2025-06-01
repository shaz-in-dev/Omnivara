'use client';
import {
  TrendingUp,
  Users,
  FolderKanban,
  Headphones,
  FileText,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { DailyBrief } from '@/components/ai/daily-brief';
import { AiUsageBar } from '@/components/ai/ai-usage-bar';
import { OnboardingChecklist } from '@/components/onboarding/onboarding-checklist';
import { SampleDataBanner } from '@/components/onboarding/sample-data-banner';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading } = useDashboardStats(orgId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8">
      {/* Sample data banner */}
      <SampleDataBanner />

      {/* Onboarding checklist — shown for new users until dismissed or complete */}
      <OnboardingChecklist />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening across your business today.
        </p>
      </div>

      {/* AI Usage warning (shows when ≥80% of monthly limit) */}
      <AiUsageBar />

      {/* Daily Brief */}
      <DailyBrief />

      {/* CRM KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">CRM</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="New Leads This Week"
            value={stats?.crm.newLeadsThisWeek ?? 0}
            subtitle={`${stats?.crm.totalLeads ?? 0} total leads`}
            icon={Users}
            trend={{ value: 12, label: 'vs last week' }}
            loading={isLoading}
          />
          <StatCard
            title="Open Opportunities"
            value={stats?.crm.openOpportunities ?? 0}
            subtitle="Active deals"
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            title="Pipeline Value"
            value={formatCurrency(stats?.crm.pipelineValue ?? 0)}
            subtitle={`${stats?.crm.closedWonThisMonth ?? 0} closed this month`}
            icon={DollarSign}
            variant="success"
            trend={{ value: 8, label: 'vs last month' }}
            loading={isLoading}
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats?.crm.conversionRate ?? 0}%`}
            subtitle="Lead to opportunity"
            icon={CheckCircle2}
            variant="success"
            loading={isLoading}
          />
        </div>
      </section>

      {/* Helpdesk + Finance */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Helpdesk</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Open Tickets"
              value={stats?.helpdesk.openTickets ?? 0}
              subtitle={`${stats?.helpdesk.resolvedToday ?? 0} resolved today`}
              icon={Headphones}
              loading={isLoading}
            />
            <StatCard
              title="Breaching SLA"
              value={stats?.helpdesk.breachingSla ?? 0}
              subtitle={`Avg ${stats?.helpdesk.avgResponseTimeHours ?? 0}h response`}
              icon={AlertTriangle}
              variant={stats?.helpdesk.breachingSla ? 'danger' : 'default'}
              loading={isLoading}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Finance</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Revenue This Month"
              value={formatCurrency(stats?.finance.revenueThisMonth ?? 0)}
              subtitle={`${formatCurrency(stats?.finance.outstandingAmount ?? 0)} outstanding`}
              icon={DollarSign}
              variant="success"
              loading={isLoading}
            />
            <StatCard
              title="Overdue Invoices"
              value={stats?.finance.overdueInvoices ?? 0}
              subtitle={formatCurrency(stats?.finance.overdueAmount ?? 0)}
              icon={FileText}
              variant={stats?.finance.overdueInvoices ? 'warning' : 'default'}
              loading={isLoading}
            />
          </div>
        </section>
      </div>

      {/* Projects */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Projects</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Projects"
            value={stats?.projects.activeProjects ?? 0}
            icon={FolderKanban}
            loading={isLoading}
          />
          <StatCard
            title="Tasks Due Today"
            value={stats?.projects.tasksDueToday ?? 0}
            icon={CheckCircle2}
            loading={isLoading}
          />
          <StatCard
            title="Overdue Tasks"
            value={stats?.projects.tasksOverdue ?? 0}
            icon={AlertTriangle}
            variant={stats?.projects.tasksOverdue ? 'warning' : 'default'}
            loading={isLoading}
          />
          <StatCard
            title="Completed This Week"
            value={stats?.projects.completedThisWeek ?? 0}
            icon={CheckCircle2}
            variant="success"
            trend={{ value: 15, label: 'vs last week' }}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '+ New Lead', href: '/crm/leads', color: 'brand' },
            { label: '+ New Deal', href: '/crm/pipeline', color: 'brand' },
            { label: '+ New Ticket', href: '/helpdesk', color: 'brand' },
            { label: '+ New Invoice', href: '/finance', color: 'brand' },
            { label: '+ New Project', href: '/projects', color: 'brand' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              {action.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
