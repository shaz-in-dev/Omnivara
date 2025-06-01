import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpportunitiesService } from './opportunities.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { OpportunityStage } from '@prisma/client';

const mockPrisma = {
  opportunity: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    count:     jest.fn(),
    findFirst: jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
    aggregate: jest.fn(),
  },
};

const mockEmitter = { emit: jest.fn() };

function makeOpp(overrides: Record<string, unknown> = {}) {
  return {
    id:        overrides.id        ?? 'opp-1',
    orgId:     overrides.orgId     ?? 'org-1',
    ownerId:   overrides.ownerId   ?? 'user-1',
    name:      overrides.name      ?? 'Big Deal',
    title:     overrides.title     ?? 'Big Deal',
    stage:     overrides.stage     ?? OpportunityStage.qualification,
    amount:    overrides.amount    ?? 50000,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides,
  };
}

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(OpportunitiesService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates opportunity and emits webhook.dispatch event', async () => {
      const opp = makeOpp();
      mockPrisma.opportunity.create.mockResolvedValue(opp);

      await service.create('org-1', 'user-1', { name: 'Big Deal', stage: OpportunityStage.qualification } as any);

      expect(mockPrisma.opportunity.create).toHaveBeenCalledTimes(1);
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'webhook.dispatch',
        expect.objectContaining({ orgId: 'org-1', event: 'opportunity.created' }),
      );
    });

    it('uses caller as default owner when ownerId not in dto', async () => {
      mockPrisma.opportunity.create.mockResolvedValue(makeOpp());
      await service.create('org-1', 'user-1', { name: 'Deal' } as any);
      expect(mockPrisma.opportunity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ownerId: 'user-1' }),
      });
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated opportunities', async () => {
      mockPrisma.opportunity.findMany.mockResolvedValue([makeOpp()]);
      mockPrisma.opportunity.count.mockResolvedValue(1);

      const result = await service.findAll('org-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by stage', async () => {
      mockPrisma.opportunity.findMany.mockResolvedValue([]);
      mockPrisma.opportunity.count.mockResolvedValue(0);

      await service.findAll('org-1', 1, 25, OpportunityStage.proposal);
      expect(mockPrisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stage: OpportunityStage.proposal }),
        }),
      );
    });
  });

  // ── getPipeline ───────────────────────────────────────────────────────────

  describe('getPipeline', () => {
    it('returns opportunities grouped by stage', async () => {
      const opps = [
        makeOpp({ stage: OpportunityStage.qualification }),
        makeOpp({ id: 'opp-2', stage: OpportunityStage.proposal }),
      ];
      mockPrisma.opportunity.findMany.mockResolvedValue(opps);

      const result = await service.getPipeline('org-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((group) => {
        expect(group).toHaveProperty('stage');
        expect(group).toHaveProperty('opportunities');
        expect(group).toHaveProperty('totalAmount');
      });
    });

    it('totalAmount sums amounts for each stage group', async () => {
      const opps = [
        makeOpp({ stage: OpportunityStage.qualification, amount: 10000 }),
        makeOpp({ id: 'opp-2', stage: OpportunityStage.qualification, amount: 5000 }),
      ];
      mockPrisma.opportunity.findMany.mockResolvedValue(opps);

      const result = await service.getPipeline('org-1');
      const qualGroup = result.find((g) => g.stage === OpportunityStage.qualification);
      expect(qualGroup?.totalAmount).toBe(15000);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the opportunity', async () => {
      mockPrisma.opportunity.findFirst.mockResolvedValue(makeOpp());
      const result = await service.findOne('org-1', 'opp-1');
      expect(result.id).toBe('opp-1');
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.opportunity.findFirst.mockResolvedValue(null);
      await expect(service.findOne('org-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates opportunity fields', async () => {
      const before = makeOpp({ stage: OpportunityStage.qualification });
      const after  = { ...before, stage: OpportunityStage.proposal };
      mockPrisma.opportunity.findFirst.mockResolvedValue(before);
      mockPrisma.opportunity.update.mockResolvedValue(after);

      const result = await service.update('org-1', 'opp-1', { stage: OpportunityStage.proposal } as any);
      expect(result.stage).toBe(OpportunityStage.proposal);
      // Non-terminal stage change — no won/lost event
      expect(mockEmitter.emit).not.toHaveBeenCalledWith('webhook.dispatch', expect.objectContaining({ event: 'opportunity.won' }));
    });

    it('emits opportunity.won on transition to closed_won', async () => {
      const before = makeOpp({ stage: OpportunityStage.negotiation });
      const after  = { ...before, stage: OpportunityStage.closed_won };
      mockPrisma.opportunity.findFirst.mockResolvedValue(before);
      mockPrisma.opportunity.update.mockResolvedValue(after);

      await service.update('org-1', 'opp-1', { stage: OpportunityStage.closed_won } as any);

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'webhook.dispatch',
        expect.objectContaining({ event: 'opportunity.won' }),
      );
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'slack.notify',
        expect.objectContaining({ type: 'opportunity.won' }),
      );
    });

    it('emits opportunity.lost on transition to closed_lost', async () => {
      const before = makeOpp({ stage: OpportunityStage.negotiation });
      const after  = { ...before, stage: OpportunityStage.closed_lost };
      mockPrisma.opportunity.findFirst.mockResolvedValue(before);
      mockPrisma.opportunity.update.mockResolvedValue(after);

      await service.update('org-1', 'opp-1', { stage: OpportunityStage.closed_lost } as any);

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'webhook.dispatch',
        expect.objectContaining({ event: 'opportunity.lost' }),
      );
    });

    it('does not emit won/lost when stage unchanged', async () => {
      const before = makeOpp({ stage: OpportunityStage.qualification });
      mockPrisma.opportunity.findFirst.mockResolvedValue(before);
      mockPrisma.opportunity.update.mockResolvedValue({ ...before, name: 'Renamed' });

      await service.update('org-1', 'opp-1', { name: 'Renamed' } as any);
      expect(mockEmitter.emit).not.toHaveBeenCalledWith('webhook.dispatch', expect.objectContaining({ event: 'opportunity.won' }));
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes opportunity', async () => {
      mockPrisma.opportunity.findFirst.mockResolvedValue(makeOpp());
      mockPrisma.opportunity.delete.mockResolvedValue({});

      const result = await service.remove('org-1', 'opp-1');
      expect(result.message).toBe('Opportunity deleted');
      expect(mockPrisma.opportunity.delete).toHaveBeenCalledWith({ where: { id: 'opp-1' } });
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.opportunity.findFirst.mockResolvedValue(null);
      await expect(service.remove('org-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });
});
