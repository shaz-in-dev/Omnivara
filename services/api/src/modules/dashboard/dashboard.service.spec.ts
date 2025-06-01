import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

function buildMockPrisma() {
  return {
    lead:        { count: jest.fn().mockResolvedValue(0) },
    contact:     { count: jest.fn().mockResolvedValue(0) },
    opportunity: {
      count:     jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    ticket:      {
      count:    jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    invoice:     {
      count:     jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { total: null } }),
    },
    project:     { count: jest.fn().mockResolvedValue(0) },
    task:        { count: jest.fn().mockResolvedValue(0) },
  };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    mockPrisma = buildMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  describe('getStats', () => {
    it('returns object with all 18 required fields', async () => {
      const stats = await service.getStats('org-1');
      const requiredFields = [
        'totalLeads', 'newLeadsThisMonth', 'totalContacts',
        'openOpportunities', 'pipelineValue', 'closedWonThisMonth',
        'openTickets', 'overdueTickets', 'resolvedThisWeek', 'avgResolutionHours',
        'totalRevenue', 'outstanding', 'overdue', 'invoicesSentThisMonth',
        'activeProjects', 'tasksInProgress', 'tasksDueThisWeek', 'tasksCompleted',
      ];
      for (const field of requiredFields) {
        expect(stats).toHaveProperty(field);
      }
    });

    it('all numeric fields are numbers (not null/undefined)', async () => {
      const stats = await service.getStats('org-1');
      for (const [key, val] of Object.entries(stats)) {
        expect(typeof val).toBe('number');
      }
    });

    it('returns zeros when org has no data', async () => {
      const stats = await service.getStats('org-empty');
      expect(stats.totalLeads).toBe(0);
      expect(stats.openTickets).toBe(0);
      expect(stats.pipelineValue).toBe(0);
      expect(stats.totalRevenue).toBe(0);
    });

    it('reflects actual lead count from DB', async () => {
      mockPrisma.lead.count
        .mockResolvedValueOnce(42)  // totalLeads
        .mockResolvedValueOnce(5);  // newLeadsThisMonth

      const stats = await service.getStats('org-1');
      expect(stats.totalLeads).toBe(42);
      expect(stats.newLeadsThisMonth).toBe(5);
    });

    it('converts decimal pipeline amount to number', async () => {
      mockPrisma.opportunity.aggregate
        .mockResolvedValueOnce({ _sum: { amount: '125000.50' } })  // open pipeline
        .mockResolvedValueOnce({ _sum: { amount: '30000.00' } });  // closed won this month

      const stats = await service.getStats('org-1');
      expect(stats.pipelineValue).toBe(125000.50);
      expect(stats.closedWonThisMonth).toBe(30000);
    });

    it('computes avgResolutionHours from resolved ticket timestamps', async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 3_600_000);
      mockPrisma.ticket.findMany.mockResolvedValue([
        { createdAt: twoHoursAgo, resolvedAt: now },
      ]);

      const stats = await service.getStats('org-1');
      expect(stats.avgResolutionHours).toBe(2);
    });

    it('returns 0 avgResolutionHours when no resolved tickets', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);
      const stats = await service.getStats('org-1');
      expect(stats.avgResolutionHours).toBe(0);
    });
  });
});
