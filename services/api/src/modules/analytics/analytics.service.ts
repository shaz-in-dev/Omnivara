import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceStatus, OpportunityStage } from '@prisma/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const CHART_MONTHS = 12; // revenue chart depth
const SPARK_MONTHS = 7;  // KPI sparkline depth (includes current + 6 prior)
const CHART_WEEKS  = 12; // ticket volume chart depth

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthBuckets(count: number, now: Date) {
  const buckets: Array<{ key: string; label: string }> = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: monthKey(d),
      label: d.toLocaleString('en-US', { month: 'short' }),
    });
  }
  return buckets;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

// ── Types (exported for controller) ──────────────────────────────────────────

export interface AnalyticsKpi {
  value: number;
  change: number;       // % change vs prior period
  sparkline: number[];  // SPARK_MONTHS data points
  invertTrend?: boolean;
}

export interface AnalyticsData {
  kpis: {
    mrr: AnalyticsKpi;
    newCustomers: AnalyticsKpi;
    pipelineValue: AnalyticsKpi;
    winRate: AnalyticsKpi;
    avgDealSize: AnalyticsKpi;
    avgResolutionHours: AnalyticsKpi;
  };
  revenueChart: {
    months: string[];
    revenue: number[];
    expenses: number[];
  };
  leadFunnel: Array<{
    label: string;
    count: number;
    value: number;
  }>;
  ticketVolume: {
    weeks: string[];
    opened: number[];
    resolved: number[];
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(orgId: string): Promise<AnalyticsData> {
    const now = new Date();

    // Date windows
    const chartStart = new Date(now.getFullYear(), now.getMonth() - CHART_MONTHS, 1);
    const sparkStart = new Date(now.getFullYear(), now.getMonth() - SPARK_MONTHS, 1);
    const weeksAgo   = new Date(now.getTime() - CHART_WEEKS * 7 * 24 * 60 * 60 * 1000);

    // ── Parallel DB queries ──────────────────────────────────────────────────
    const [
      paidInvoices,
      approvedExpenses,
      newContacts,
      closedOpps,
      openOppsAgg,
      oppsByStage,
      resolvedTicketsMonth,
      createdTicketsWeek,
      resolvedTicketsWeek,
      leadsByStatus,
    ] = await Promise.all([

      // 1. Paid invoices for revenue chart + MRR sparkline
      this.prisma.invoice.findMany({
        where: {
          orgId,
          status: InvoiceStatus.paid,
          paidAt: { gte: chartStart, not: null },
        },
        select: { paidAt: true, total: true },
      }),

      // 2. Approved/reimbursed expenses for expense chart
      this.prisma.expense.findMany({
        where: {
          orgId,
          status: { in: ['approved', 'reimbursed'] },
          date: { gte: chartStart },
        },
        select: { date: true, amount: true },
      }),

      // 3. New contacts per month (proxy for new customers)
      this.prisma.contact.findMany({
        where: { orgId, createdAt: { gte: sparkStart } },
        select: { createdAt: true },
      }),

      // 4. Closed opps (won + lost) for win-rate + avg deal size sparklines
      this.prisma.opportunity.findMany({
        where: {
          orgId,
          stage: { in: [OpportunityStage.closed_won, OpportunityStage.closed_lost] },
          updatedAt: { gte: sparkStart },
        },
        select: { stage: true, amount: true, updatedAt: true },
      }),

      // 5. Open pipeline total (current snapshot)
      this.prisma.opportunity.aggregate({
        where: {
          orgId,
          stage: { notIn: [OpportunityStage.closed_won, OpportunityStage.closed_lost] },
        },
        _sum: { amount: true },
      }),

      // 6. All opps by stage (lead funnel)
      this.prisma.opportunity.groupBy({
        by: ['stage'],
        where: { orgId },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // 7. Resolved tickets in last SPARK_MONTHS (avg resolution time sparkline)
      this.prisma.ticket.findMany({
        where: {
          orgId,
          resolvedAt: { gte: sparkStart, not: null },
        },
        select: { createdAt: true, resolvedAt: true },
      }),

      // 8. Tickets CREATED in last CHART_WEEKS (for "opened" series)
      this.prisma.ticket.findMany({
        where: { orgId, createdAt: { gte: weeksAgo } },
        select: { createdAt: true },
      }),

      // 9. Tickets RESOLVED in last CHART_WEEKS (for "resolved" series)
      this.prisma.ticket.findMany({
        where: { orgId, resolvedAt: { gte: weeksAgo, not: null } },
        select: { resolvedAt: true },
      }),

      // 10. Lead counts by status (funnel top)
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),
    ]);

    // ── Month buckets ────────────────────────────────────────────────────────

    const chartBuckets = buildMonthBuckets(CHART_MONTHS, now);
    const sparkBuckets = buildMonthBuckets(SPARK_MONTHS, now);

    // Revenue map
    const revenueByMonth = new Map<string, number>();
    for (const inv of paidInvoices) {
      if (!inv.paidAt) continue;
      const k = monthKey(inv.paidAt);
      revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + Number(inv.total));
    }

    // Expense map
    const expenseByMonth = new Map<string, number>();
    for (const exp of approvedExpenses) {
      const k = monthKey(exp.date);
      expenseByMonth.set(k, (expenseByMonth.get(k) ?? 0) + Number(exp.amount));
    }

    // New contacts map
    const contactsByMonth = new Map<string, number>();
    for (const c of newContacts) {
      const k = monthKey(c.createdAt);
      contactsByMonth.set(k, (contactsByMonth.get(k) ?? 0) + 1);
    }

    // Closed opp maps
    const wonByMonth  = new Map<string, { count: number; amount: number }>();
    const lostByMonth = new Map<string, number>();
    for (const opp of closedOpps) {
      const k = monthKey(opp.updatedAt);
      if (opp.stage === OpportunityStage.closed_won) {
        const e = wonByMonth.get(k) ?? { count: 0, amount: 0 };
        wonByMonth.set(k, { count: e.count + 1, amount: e.amount + Number(opp.amount ?? 0) });
      } else {
        lostByMonth.set(k, (lostByMonth.get(k) ?? 0) + 1);
      }
    }

    // Resolution time map
    const resByMonth = new Map<string, { total: number; count: number }>();
    for (const t of resolvedTicketsMonth) {
      if (!t.resolvedAt) continue;
      const k = monthKey(t.resolvedAt);
      const hours = (t.resolvedAt.getTime() - t.createdAt.getTime()) / 3_600_000;
      const e = resByMonth.get(k) ?? { total: 0, count: 0 };
      resByMonth.set(k, { total: e.total + hours, count: e.count + 1 });
    }

    // ── KPI sparklines ───────────────────────────────────────────────────────

    const mrrSpark       = sparkBuckets.map(b => revenueByMonth.get(b.key) ?? 0);
    const customersSpark = sparkBuckets.map(b => contactsByMonth.get(b.key) ?? 0);

    // Pipeline: use won-deal value as monthly proxy (true snapshot needs history table)
    const pipelineSpark  = sparkBuckets.map(b => wonByMonth.get(b.key)?.amount ?? 0);
    const pipelineCurrent = Number(openOppsAgg._sum.amount ?? 0);

    const winRateSpark = sparkBuckets.map(b => {
      const won  = wonByMonth.get(b.key)?.count ?? 0;
      const lost = lostByMonth.get(b.key) ?? 0;
      const total = won + lost;
      return total > 0 ? Math.round((won / total) * 1000) / 10 : 0;
    });

    const avgDealSpark = sparkBuckets.map(b => {
      const e = wonByMonth.get(b.key);
      return e && e.count > 0 ? Math.round(e.amount / e.count) : 0;
    });

    const resSpark = sparkBuckets.map(b => {
      const e = resByMonth.get(b.key);
      return e && e.count > 0 ? Math.round((e.total / e.count) * 10) / 10 : 0;
    });

    // ── KPI change helpers ───────────────────────────────────────────────────

    const last  = <T>(arr: T[]) => arr[arr.length - 1] ?? (0 as unknown as T);
    const prev  = <T>(arr: T[]) => arr[arr.length - 2] ?? (0 as unknown as T);

    // ── Revenue chart arrays ─────────────────────────────────────────────────

    const revenueArr  = chartBuckets.map(b => revenueByMonth.get(b.key) ?? 0);
    const expensesArr = chartBuckets.map(b => expenseByMonth.get(b.key) ?? 0);

    // ── Lead funnel ──────────────────────────────────────────────────────────

    const leadMap  = Object.fromEntries(leadsByStatus.map(l => [l.status, l._count.id]));
    const stageMap = Object.fromEntries(
      oppsByStage.map(o => [o.stage, { count: o._count.id, amount: Number(o._sum.amount ?? 0) }]),
    );

    const totalLeads     = Object.values(leadMap).reduce((s, c) => s + c, 0);
    const contactedLeads = (leadMap['contacted'] ?? 0) + (leadMap['qualified'] ?? 0);
    const qualifiedLeads = (leadMap['qualified'] ?? 0) + (stageMap[OpportunityStage.qualification]?.count ?? 0);

    const leadFunnel = [
      { label: 'Leads',       count: totalLeads,     value: 0 },
      { label: 'Contacted',   count: contactedLeads,  value: 0 },
      { label: 'Qualified',   count: qualifiedLeads,  value: stageMap[OpportunityStage.qualification]?.amount ?? 0 },
      { label: 'Proposal',    count: stageMap[OpportunityStage.proposal]?.count    ?? 0, value: stageMap[OpportunityStage.proposal]?.amount    ?? 0 },
      { label: 'Negotiation', count: stageMap[OpportunityStage.negotiation]?.count ?? 0, value: stageMap[OpportunityStage.negotiation]?.amount ?? 0 },
      { label: 'Closed Won',  count: stageMap[OpportunityStage.closed_won]?.count  ?? 0, value: stageMap[OpportunityStage.closed_won]?.amount  ?? 0 },
    ];

    // ── Ticket volume chart ──────────────────────────────────────────────────

    const msPerWeek    = 7 * 24 * 60 * 60 * 1000;
    const openedByWeek = new Array<number>(CHART_WEEKS).fill(0);
    const resolvedByWk = new Array<number>(CHART_WEEKS).fill(0);

    for (const t of createdTicketsWeek) {
      const idx = Math.floor((t.createdAt.getTime() - weeksAgo.getTime()) / msPerWeek);
      if (idx >= 0 && idx < CHART_WEEKS) openedByWeek[idx]!++;
    }
    for (const t of resolvedTicketsWeek) {
      if (!t.resolvedAt) continue;
      const idx = Math.floor((t.resolvedAt.getTime() - weeksAgo.getTime()) / msPerWeek);
      if (idx >= 0 && idx < CHART_WEEKS) resolvedByWk[idx]!++;
    }

    const weekLabels = Array.from({ length: CHART_WEEKS }, (_, i) => `W${i + 1}`);

    // ── Return ───────────────────────────────────────────────────────────────

    return {
      kpis: {
        mrr: {
          value:     last(mrrSpark),
          change:    pctChange(last(mrrSpark), prev(mrrSpark)),
          sparkline: mrrSpark,
        },
        newCustomers: {
          value:     last(customersSpark),
          change:    pctChange(last(customersSpark), prev(customersSpark)),
          sparkline: customersSpark,
        },
        pipelineValue: {
          value:     pipelineCurrent,
          change:    pctChange(last(pipelineSpark), prev(pipelineSpark)),
          sparkline: pipelineSpark,
        },
        winRate: {
          value:     last(winRateSpark),
          change:    pctChange(last(winRateSpark), prev(winRateSpark)),
          sparkline: winRateSpark,
        },
        avgDealSize: {
          value:     last(avgDealSpark),
          change:    pctChange(last(avgDealSpark), prev(avgDealSpark)),
          sparkline: avgDealSpark,
        },
        avgResolutionHours: {
          value:       last(resSpark),
          change:      pctChange(last(resSpark), prev(resSpark)),
          sparkline:   resSpark,
          invertTrend: true,
        },
      },
      revenueChart: {
        months:   chartBuckets.map(b => b.label),
        revenue:  revenueArr,
        expenses: expensesArr,
      },
      leadFunnel,
      ticketVolume: {
        weeks:    weekLabels,
        opened:   openedByWeek,
        resolved: resolvedByWk,
      },
    };
  }
}
