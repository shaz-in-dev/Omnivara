import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardStats {
  // CRM
  totalLeads: number;
  newLeadsThisMonth: number;
  totalContacts: number;
  openOpportunities: number;
  pipelineValue: number;
  closedWonThisMonth: number;
  // Helpdesk
  openTickets: number;
  overdueTickets: number;
  resolvedThisWeek: number;
  avgResolutionHours: number;
  // Finance
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  invoicesSentThisMonth: number;
  // Projects
  activeProjects: number;
  tasksInProgress: number;
  tasksDueThisWeek: number;
  tasksCompleted: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(orgId: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const [
      totalLeads,
      newLeadsThisMonth,
      totalContacts,
      openOpportunities,
      pipelineAgg,
      closedWonOpps,
      openTickets,
      overdueTickets,
      resolvedThisWeek,
      resolvedTickets,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      invoicesSentThisMonth,
      activeProjects,
      tasksInProgress,
      tasksDueThisWeek,
      tasksCompleted,
    ] = await Promise.all([
      // CRM
      this.prisma.lead.count({ where: { orgId } }),
      this.prisma.lead.count({ where: { orgId, createdAt: { gte: startOfMonth } } }),
      this.prisma.contact.count({ where: { orgId } }),
      this.prisma.opportunity.count({ where: { orgId, stage: { notIn: ['closed_won', 'closed_lost'] } } }),
      this.prisma.opportunity.aggregate({
        where: { orgId, stage: { notIn: ['closed_won', 'closed_lost'] } },
        _sum: { amount: true },
      }),
      this.prisma.opportunity.aggregate({
        where: { orgId, stage: 'closed_won', updatedAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // Helpdesk
      this.prisma.ticket.count({ where: { orgId, status: { in: ['open', 'pending'] } } }),
      this.prisma.ticket.count({ where: { orgId, slaBreachAt: { lt: now, not: null }, status: { notIn: ['resolved', 'closed'] } } }),
      this.prisma.ticket.count({ where: { orgId, status: 'resolved', updatedAt: { gte: startOfWeek, lt: endOfWeek } } }),
      // Fetch resolved tickets to compute avg resolution hours
      this.prisma.ticket.findMany({
        where: { orgId, status: 'resolved', resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        take: 100,
        orderBy: { resolvedAt: 'desc' },
      }),
      // Finance — sent (outstanding)
      this.prisma.invoice.aggregate({
        where: { orgId, status: 'sent' },
        _sum: { total: true },
      }),
      // Finance — paid (revenue)
      this.prisma.invoice.aggregate({
        where: { orgId, status: 'paid' },
        _sum: { total: true },
      }),
      // Finance — overdue
      this.prisma.invoice.aggregate({
        where: { orgId, status: 'overdue' },
        _sum: { total: true },
      }),
      this.prisma.invoice.count({ where: { orgId, status: { in: ['sent', 'paid'] }, createdAt: { gte: startOfMonth } } }),
      // Projects
      this.prisma.project.count({ where: { orgId, status: 'active' } }),
      this.prisma.task.count({ where: { orgId, status: 'in_progress' } }),
      this.prisma.task.count({ where: { orgId, dueDate: { gte: startOfWeek, lt: endOfWeek }, status: { not: 'done' } } }),
      this.prisma.task.count({ where: { orgId, status: 'done', updatedAt: { gte: startOfMonth } } }),
    ]);

    // Compute average resolution hours from actual ticket data
    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalMs = resolvedTickets.reduce((sum, t) => {
        const resolved = t.resolvedAt as Date;
        return sum + (resolved.getTime() - t.createdAt.getTime());
      }, 0);
      avgResolutionHours = Math.round((totalMs / resolvedTickets.length / 3_600_000) * 10) / 10;
    }

    return {
      totalLeads,
      newLeadsThisMonth,
      totalContacts,
      openOpportunities,
      pipelineValue: Number(pipelineAgg._sum.amount ?? 0),
      closedWonThisMonth: Number(closedWonOpps._sum.amount ?? 0),
      openTickets,
      overdueTickets,
      resolvedThisWeek,
      avgResolutionHours,
      totalRevenue: Number(paidInvoices._sum.total ?? 0),
      outstanding: Number(sentInvoices._sum.total ?? 0),
      overdue: Number(overdueInvoices._sum.total ?? 0),
      invoicesSentThisMonth,
      activeProjects,
      tasksInProgress,
      tasksDueThisWeek,
      tasksCompleted,
    };
  }
}
