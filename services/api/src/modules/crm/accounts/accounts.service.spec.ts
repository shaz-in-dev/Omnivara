import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  account: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    count:     jest.fn(),
    findFirst: jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
};

function makeAccount(overrides: Record<string, unknown> = {}) {
  return {
    id:        overrides.id        ?? 'acc-1',
    orgId:     overrides.orgId     ?? 'org-1',
    ownerId:   overrides.ownerId   ?? 'user-1',
    name:      overrides.name      ?? 'Acme Corp',
    domain:    overrides.domain    ?? 'acme.com',
    industry:  overrides.industry  ?? 'Technology',
    createdAt: overrides.createdAt ?? new Date(),
    ...overrides,
  };
}

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AccountsService);
  });

  describe('create', () => {
    it('creates account scoped to orgId', async () => {
      mockPrisma.account.create.mockResolvedValue(makeAccount());
      await service.create('org-1', 'user-1', { name: 'Acme Corp' } as any);
      expect(mockPrisma.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ orgId: 'org-1' }),
      });
    });

    it('uses caller as default owner', async () => {
      mockPrisma.account.create.mockResolvedValue(makeAccount());
      await service.create('org-1', 'user-1', { name: 'Acme' } as any);
      expect(mockPrisma.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ownerId: 'user-1' }),
      });
    });

    it('respects explicit ownerId in dto', async () => {
      mockPrisma.account.create.mockResolvedValue(makeAccount({ ownerId: 'user-2' }));
      await service.create('org-1', 'user-1', { name: 'Acme', ownerId: 'user-2' } as any);
      expect(mockPrisma.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ownerId: 'user-2' }),
      });
    });
  });

  describe('findAll', () => {
    it('returns paginated accounts', async () => {
      mockPrisma.account.findMany.mockResolvedValue([makeAccount()]);
      mockPrisma.account.count.mockResolvedValue(1);

      const result = await service.findAll('org-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies search filter on name', async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);
      mockPrisma.account.count.mockResolvedValue(0);

      await service.findAll('org-1', 1, 25, 'acme');
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({ contains: 'acme' }),
          }),
        }),
      );
    });

    it('returns empty list when no accounts exist', async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);
      mockPrisma.account.count.mockResolvedValue(0);
      const result = await service.findAll('org-1');
      expect(result.data).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('returns account by id', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(makeAccount());
      const result = await service.findOne('org-1', 'acc-1');
      expect(result.id).toBe('acc-1');
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'acc-1', orgId: 'org-1' } }),
      );
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      await expect(service.findOne('org-1', 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when id belongs to different org', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      await expect(service.findOne('org-2', 'acc-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates account and returns updated record', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(makeAccount());
      mockPrisma.account.update.mockResolvedValue(makeAccount({ name: 'New Name' }));

      const result = await service.update('org-1', 'acc-1', { name: 'New Name' } as any);
      expect(result.name).toBe('New Name');
    });

    it('does not update when account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      await expect(service.update('org-1', 'bad', {} as any)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.account.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes account and returns message', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(makeAccount());
      mockPrisma.account.delete.mockResolvedValue({});

      const result = await service.remove('org-1', 'acc-1');
      expect(result.message).toBe('Account deleted');
    });

    it('throws NotFoundException before deleting if not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      await expect(service.remove('org-1', 'bad')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.account.delete).not.toHaveBeenCalled();
    });
  });
});
