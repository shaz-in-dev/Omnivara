import { Test } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

// Provide empty/default mock results for all 10 parallel queries
function buildEmptyMockPrisma() {
  return {
    invoice:     { findMany: jest.fn().mockResolvedValue([]) },
    expense:     { findMany: jest.fn().mockResolvedValue([]) },
    contact:     { findMany: jest.fn().mockResolvedValue([]) },
    opportunity: {
      findMany:  jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
      groupBy:   jest.fn().mockResolvedValue([]),
    },
    ticket:      { findMany: jest.fn().mockResolvedValue([]) },
    lead:        { groupBy: jest.fn().mockResolvedValue([]) },
  };
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPrisma: ReturnType<typeof buildEmptyMockPrisma>;

  beforeEach(async () => {
    mockPrisma = buildEmptyMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AnalyticsService);
  });

  describe('getAnalytics', () => {
    it('returns the full analytics structure', async () => {
      const result = await service.getAnalytics('org-1');

      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('revenueChart');
      expect(result).toHaveProperty('leadFunnel');
      expect(result).toHaveProperty('ticketVolume');
    });

    it('kpis object has all required keys', async () => {
      const result = await service.getAnalytics('org-1');
      const { kpis } = result;
      expect(kpis).toHaveProperty('mrr');
      expect(kpis).toHaveProperty('newCustomers');
      expect(kpis).toHaveProperty('pipelineValue');
      expect(kpis).toHaveProperty('winRate');
      expect(kpis).toHaveProperty('avgDealSize');
      expect(kpis).toHaveProperty('avgResolutionHours');
    });

    it('each KPI has value, change, and sparkline fields', async () => {
      const result = await service.getAnalytics('org-1');
      for (const kpi of Object.values(result.kpis)) {
        expect(kpi).toHaveProperty('value');
        expect(kpi).toHaveProperty('change');
        expect(kpi).toHaveProperty('sparkline');
        expect(Array.isArray(kpi.sparkline)).toBe(true);
      }
    });

    it('revenueChart has 12-month depth with matching array lengths', async () => {
      const result = await service.getAnalytics('org-1');
      const { revenueChart } = result;
      expect(revenueChart.months).toHaveLength(12);
      expect(revenueChart.revenue).toHaveLength(12);
      expect(revenueChart.expenses).toHaveLength(12);
    });

    it('ticketVolume has 12-week depth', async () => {
      const result = await service.getAnalytics('org-1');
      const { ticketVolume } = result;
      expect(ticketVolume.weeks).toHaveLength(12);
      expect(ticketVolume.opened).toHaveLength(12);
      expect(ticketVolume.resolved).toHaveLength(12);
    });

    it('returns zeroed KPIs when no data exists (empty org)', async () => {
      const result = await service.getAnalytics('org-empty');
      expect(result.kpis.mrr.value).toBe(0);
      expect(result.kpis.newCustomers.value).toBe(0);
      expect(result.kpis.pipelineValue.value).toBe(0);
    });

    it('aggregates paid invoice revenue into MRR sparkline', async () => {
      const paidAt = new Date();
      mockPrisma.invoice.findMany.mockResolvedValue([
        { paidAt, total: 1000 },
        { paidAt, total: 500 },
      ]);

      const result = await service.getAnalytics('org-1');
      // The current month bucket should reflect the sum 1500
      const lastMrr = result.kpis.mrr.sparkline[result.kpis.mrr.sparkline.length - 1];
      expect(lastMrr).toBe(1500);
    });

    it('leadFunnel is an array with label/count/value entries', async () => {
      const result = await service.getAnalytics('org-1');
      expect(Array.isArray(result.leadFunnel)).toBe(true);
      for (const entry of result.leadFunnel) {
        expect(entry).toHaveProperty('label');
        expect(entry).toHaveProperty('count');
        expect(entry).toHaveProperty('value');
      }
    });

    it('invertTrend is true on avgResolutionHours KPI', async () => {
      const result = await service.getAnalytics('org-1');
      expect(result.kpis.avgResolutionHours.invertTrend).toBe(true);
    });
  });
});
