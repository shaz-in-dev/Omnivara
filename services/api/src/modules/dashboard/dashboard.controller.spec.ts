import { Test } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

const mockService = { getStats: jest.fn() };

const ZERO_STATS = {
  totalLeads: 0, newLeadsThisMonth: 0, totalContacts: 0,
  openOpportunities: 0, pipelineValue: 0, closedWonThisMonth: 0,
  openTickets: 0, overdueTickets: 0, resolvedThisWeek: 0, avgResolutionHours: 0,
  totalRevenue: 0, outstanding: 0, overdue: 0, invoicesSentThisMonth: 0,
  activeProjects: 0, tasksInProgress: 0, tasksDueThisWeek: 0, tasksCompleted: 0,
};

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers:   [{ provide: DashboardService, useValue: mockService }],
    }).compile();
    controller = module.get(DashboardController);
  });

  it('returns stats from service', async () => {
    mockService.getStats.mockResolvedValue(ZERO_STATS);
    const result = await controller.getStats('org-1');
    expect(mockService.getStats).toHaveBeenCalledWith('org-1');
    expect(result).toEqual(ZERO_STATS);
  });

  it('result has all 18 required fields', async () => {
    mockService.getStats.mockResolvedValue(ZERO_STATS);
    const result = await controller.getStats('org-1');
    for (const key of Object.keys(ZERO_STATS)) {
      expect(result).toHaveProperty(key);
    }
  });
});
