import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  activity: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    count:     jest.fn(),
    findFirst: jest.fn(),
    update:    jest.fn(),
  },
};

function makeActivity(overrides: Record<string, unknown> = {}) {
  return {
    id:          overrides.id          ?? 'act-1',
    orgId:       overrides.orgId       ?? 'org-1',
    userId:      overrides.userId      ?? 'user-1',
    type:        overrides.type        ?? 'call',
    subject:     overrides.subject     ?? 'Follow-up call',
    completedAt: overrides.completedAt ?? null,
    createdAt:   overrides.createdAt   ?? new Date(),
    ...overrides,
  };
}

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ActivitiesService);
  });

  describe('create', () => {
    it('creates activity scoped to org and caller', async () => {
      mockPrisma.activity.create.mockResolvedValue(makeActivity());
      await service.create('org-1', 'user-1', { type: 'call', subject: 'Call' } as any);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1' }),
        }),
      );
    });

    it('uses caller userId as default', async () => {
      mockPrisma.activity.create.mockResolvedValue(makeActivity());
      await service.create('org-1', 'user-1', { type: 'email' } as any);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('respects explicit userId override', async () => {
      mockPrisma.activity.create.mockResolvedValue(makeActivity({ userId: 'user-2' }));
      await service.create('org-1', 'user-1', { type: 'call', userId: 'user-2' } as any);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-2' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated activities', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([makeActivity()]);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await service.findAll('org-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by opportunityId when provided', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.findAll('org-1', 1, 25, { opportunityId: 'opp-1' });
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ opportunityId: 'opp-1' }),
        }),
      );
    });

    it('filters by contactId when provided', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.findAll('org-1', 1, 25, { contactId: 'contact-1' });
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ contactId: 'contact-1' }),
        }),
      );
    });
  });

  describe('complete', () => {
    it('sets completedAt on the activity', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(makeActivity());
      mockPrisma.activity.update.mockResolvedValue(makeActivity({ completedAt: new Date() }));

      const result = await service.complete('org-1', 'act-1');
      expect(mockPrisma.activity.update).toHaveBeenCalledWith({
        where: { id: 'act-1' },
        data:  { completedAt: expect.any(Date) },
      });
      expect(result.completedAt).not.toBeNull();
    });

    it('throws NotFoundException for unknown activity', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(null);
      await expect(service.complete('org-1', 'unknown')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.activity.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when activity belongs to different org', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(null);
      await expect(service.complete('org-2', 'act-1')).rejects.toThrow(NotFoundException);
    });
  });
});
