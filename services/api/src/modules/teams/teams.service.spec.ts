import { Test } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../../prisma/prisma.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockTeams = [
  { id: 'team-1', name: 'Alpha Squad', orgId: 'org-1', createdAt: new Date() },
  { id: 'team-2', name: 'Beta Team',  orgId: 'org-1', createdAt: new Date() },
];

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  team: {
    findMany: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(TeamsService);
    jest.clearAllMocks();
  });

  // ── findByOrg ───────────────────────────────────────────────────────────────

  describe('findByOrg', () => {
    it('returns all teams belonging to the given org', async () => {
      mockPrisma.team.findMany.mockResolvedValue(mockTeams);

      const result = await service.findByOrg('org-1');

      expect(result).toEqual(mockTeams);
      expect(result).toHaveLength(2);
    });

    it('passes the correct where clause scoped to the orgId', async () => {
      mockPrisma.team.findMany.mockResolvedValue([]);

      await service.findByOrg('org-99');

      expect(mockPrisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orgId: 'org-99' } }),
      );
    });

    it('orders results by name ascending', async () => {
      mockPrisma.team.findMany.mockResolvedValue(mockTeams);

      await service.findByOrg('org-1');

      expect(mockPrisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });

    it('returns an empty array when the org has no teams', async () => {
      mockPrisma.team.findMany.mockResolvedValue([]);

      const result = await service.findByOrg('org-empty');

      expect(result).toEqual([]);
    });

    it('does not bleed data across different org ids', async () => {
      mockPrisma.team.findMany
        .mockResolvedValueOnce(mockTeams)
        .mockResolvedValueOnce([]);

      const org1Result = await service.findByOrg('org-1');
      const org2Result = await service.findByOrg('org-2');

      expect(org1Result).toHaveLength(2);
      expect(org2Result).toHaveLength(0);

      const firstCall  = mockPrisma.team.findMany.mock.calls[0][0];
      const secondCall = mockPrisma.team.findMany.mock.calls[1][0];
      expect(firstCall.where.orgId).toBe('org-1');
      expect(secondCall.where.orgId).toBe('org-2');
    });
  });
});
