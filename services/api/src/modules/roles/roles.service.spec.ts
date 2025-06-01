import { Test } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  role: { findMany: jest.fn() },
};

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(RolesService);
  });

  describe('findByOrg', () => {
    it('returns org-specific and system roles combined', async () => {
      const roles = [
        { id: 'r-1', orgId: 'org-1', name: 'Admin',  isSystem: false },
        { id: 'r-2', orgId: null,    name: 'Viewer', isSystem: true  },
      ];
      mockPrisma.role.findMany.mockResolvedValue(roles);

      const result = await service.findByOrg('org-1');

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        where:   { OR: [{ orgId: 'org-1' }, { isSystem: true }] },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('returns only system roles when org has no custom roles', async () => {
      mockPrisma.role.findMany.mockResolvedValue([
        { id: 'r-sys', orgId: null, name: 'Member', isSystem: true },
      ]);

      const result = await service.findByOrg('org-empty');
      expect(result).toHaveLength(1);
      expect(result[0]!.isSystem).toBe(true);
    });

    it('returns empty array when no roles exist at all', async () => {
      mockPrisma.role.findMany.mockResolvedValue([]);
      const result = await service.findByOrg('org-new');
      expect(result).toHaveLength(0);
    });
  });
});
