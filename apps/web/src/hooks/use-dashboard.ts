import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface DashboardStats {
  crm: {
    totalLeads: number;
    newLeadsThisWeek: number;
    openOpportunities: number;
    pipelineValue: number;
    closedWonThisMonth: number;
    conversionRate: number;
  };
  helpdesk: {
    openTickets: number;
    breachingSla: number;
    avgResponseTimeHours: number;
    resolvedToday: number;
  };
  finance: {
    overdueInvoices: number;
    overdueAmount: number;
    revenueThisMonth: number;
    outstandingAmount: number;
  };
  projects: {
    activeProjects: number;
    tasksOverdue: number;
    tasksDueToday: number;
    completedThisWeek: number;
  };
}

export function useDashboardStats(orgId: string) {
  return useQuery({
    queryKey: ['dashboard-stats', orgId],
    queryFn: async () => {
      const { data } = await api.get(`/orgs/${orgId}/dashboard/stats`);
      return data.data as DashboardStats;
    },
    enabled: !!orgId,
    staleTime: 60_000, // 1 min
    // Placeholder shown during initial load only — real data replaces it immediately
    placeholderData: {
      crm: {
        totalLeads: 142,
        newLeadsThisWeek: 18,
        openOpportunities: 34,
        pipelineValue: 284_000,
        closedWonThisMonth: 7,
        conversionRate: 23.4,
      },
      helpdesk: {
        openTickets: 28,
        breachingSla: 3,
        avgResponseTimeHours: 4.2,
        resolvedToday: 11,
      },
      finance: {
        overdueInvoices: 5,
        overdueAmount: 14_800,
        revenueThisMonth: 68_400,
        outstandingAmount: 32_600,
      },
      projects: {
        activeProjects: 9,
        tasksOverdue: 7,
        tasksDueToday: 14,
        completedThisWeek: 43,
      },
    } satisfies DashboardStats,
  });
}
