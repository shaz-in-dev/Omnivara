import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  apiKey: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    delete:    jest.fn(),
    update:    jest.fn(),
  },
};

function makeKeyRecord(overrides: Record<string, unknown> = {}) {
  return {
    id:        overrides.id        ?? 'key-1',
    orgId:     overrides.orgId     ?? 'org-1',
    name:      overrides.name      ?? 'My Key',
    prefix:    overrides.prefix    ?? 'omni_abc',
    createdBy: overrides.createdBy ?? 'user-1',
    createdAt: overrides.createdAt ?? new Date(),
    expiresAt: overrides.expiresAt ?? null,
    lastUsed:  overrides.lastUsed  ?? null,
    ...overrides,
  };
}

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ApiKeysService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns full key starting with omni_ (only time it is shown)', async () => {
      const record = makeKeyRecord();
      mockPrisma.apiKey.create.mockResolvedValue(record);

      const result = await service.create('org-1', 'user-1', 'My Key');
      expect(result.key).toMatch(/^omni_/);
    });

    it('key has correct length: omni_ + 40 hex chars = 45 chars', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(makeKeyRecord());
      const result = await service.create('org-1', 'user-1', 'CI Key');
      expect(result.key).toHaveLength(45);
    });

    it('never stores the raw key — only its hash', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(makeKeyRecord());
      await service.create('org-1', 'user-1', 'Key');

      const createCall = mockPrisma.apiKey.create.mock.calls[0]![0] as { data: Record<string, unknown> };
      expect(createCall.data['keyHash']).toBeDefined();
      expect(createCall.data['keyHash']).toHaveLength(64); // SHA-256 hex = 64 chars
      expect(createCall.data).not.toHaveProperty('key');
    });

    it('two calls generate different keys (entropy)', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(makeKeyRecord());
      const r1 = await service.create('org-1', 'user-1', 'K1');
      const r2 = await service.create('org-1', 'user-1', 'K2');
      expect(r1.key).not.toBe(r2.key);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns keys for org without keyHash field', async () => {
      const records = [makeKeyRecord(), makeKeyRecord({ id: 'key-2', name: 'Key 2' })];
      mockPrisma.apiKey.findMany.mockResolvedValue(records);

      const result = await service.findAll('org-1');
      expect(result).toHaveLength(2);
      // The select in service never includes keyHash — verify the call
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({ keyHash: true }),
        }),
      );
    });

    it('returns empty array when org has no keys', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([]);
      const result = await service.findAll('org-1');
      expect(result).toHaveLength(0);
    });
  });

  // ── revoke ────────────────────────────────────────────────────────────────

  describe('revoke', () => {
    it('deletes the key record', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(makeKeyRecord());
      mockPrisma.apiKey.delete.mockResolvedValue({});

      await service.revoke('org-1', 'key-1');
      expect(mockPrisma.apiKey.delete).toHaveBeenCalledWith({ where: { id: 'key-1' } });
    });

    it('throws NotFoundException when key not found for this org', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.revoke('org-1', 'key-x')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.apiKey.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when key exists but in different org', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null); // findFirst({where: {id, orgId}}) returns null
      await expect(service.revoke('org-2', 'key-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── authenticate ──────────────────────────────────────────────────────────

  describe('authenticate', () => {
    it('returns orgId and id for a valid, non-expired key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1', orgId: 'org-1', expiresAt: null,
      });
      mockPrisma.apiKey.update.mockResolvedValue({});

      const result = await service.authenticate('omni_abc123validkey_40hexchars_total00');
      expect(result).not.toBeNull();
      expect(result?.orgId).toBe('org-1');
    });

    it('returns null for unknown key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      const result = await service.authenticate('omni_nonexistent');
      expect(result).toBeNull();
    });

    it('returns null for expired key', async () => {
      const yesterday = new Date(Date.now() - 86_400_000);
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1', orgId: 'org-1', expiresAt: yesterday,
      });

      const result = await service.authenticate('omni_expiredkey');
      expect(result).toBeNull();
    });

    it('returns valid result for key that expires in the future', async () => {
      const tomorrow = new Date(Date.now() + 86_400_000);
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1', orgId: 'org-1', expiresAt: tomorrow,
      });
      mockPrisma.apiKey.update.mockResolvedValue({});

      const result = await service.authenticate('omni_futurekey');
      expect(result?.orgId).toBe('org-1');
    });
  });
});
