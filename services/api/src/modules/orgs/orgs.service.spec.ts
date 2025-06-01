import { Test } from '@nestjs/testing';
import { OrgsService } from './orgs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1';

const mockOrg = {
  id: ORG_ID,
  name: 'Acme Corp',
  slug: 'acme-corp',
  planId: 'starter',
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  users: [],
  teams: [],
  roles: [],
};

const mockMember = {
  id: 'mem-1',
  orgId: ORG_ID,
  userId: 'user-1',
  roleId: 'role-1',
  joinedAt: new Date(),
  user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
  role: { id: 'role-1', name: 'admin' },
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  organization: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  organizationMember: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OrgsService', () => {
  let service: OrgsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrgsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(OrgsService);
    jest.clearAllMocks();
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns org with users and teams', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.findById(ORG_ID);

      expect(result.id).toBe(ORG_ID);
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORG_ID } }),
      );
    });

    it('throws NotFoundException when org does not exist', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── findMembers ─────────────────────────────────────────────────────────────

  describe('findMembers', () => {
    it('returns all members for an org', async () => {
      mockPrisma.organizationMember.findMany.mockResolvedValue([mockMember]);

      const result = await service.findMembers(ORG_ID);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });
  });

  // ── inviteMember ────────────────────────────────────────────────────────────

  describe('inviteMember', () => {
    it('returns existing membership when user is already a member', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'alice@example.com' });
      mockPrisma.organizationMember.findFirst.mockResolvedValue(mockMember);

      const result = await service.inviteMember(ORG_ID, 'alice@example.com');

      expect(result).toEqual(mockMember);
      expect(mockPrisma.organizationMember.create).not.toHaveBeenCalled();
    });

    it('returns invite object when user is not registered', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.inviteMember(ORG_ID, 'new@example.com') as { email: string; status: string };

      expect(result.status).toBe('invited');
      expect(result.email).toBe('new@example.com');
    });

    it('throws ForbiddenException when user limit is reached on starter plan', async () => {
      // Starter plan has 5 users; already at 5
      mockPrisma.organization.findUnique.mockResolvedValue({ ...mockOrg, planId: 'starter' });
      mockPrisma.organizationMember.count.mockResolvedValue(5);

      await expect(service.inviteMember(ORG_ID, 'sixth@example.com'))
        .rejects.toThrow(ForbiddenException);
    });

    it('allows unlimited members on enterprise plan', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ ...mockOrg, planId: 'enterprise' });
      mockPrisma.organizationMember.count.mockResolvedValue(200);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Should NOT throw
      const result = await service.inviteMember(ORG_ID, 'anyone@example.com') as { status: string };

      expect(result.status).toBe('invited');
    });
  });

  // ── removeMember ────────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('deletes the member record', async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue({ id: 'mem-1', orgId: ORG_ID, userId: 'user-1' });
      mockPrisma.organizationMember.delete.mockResolvedValue({});

      const result = await service.removeMember(ORG_ID, 'user-1') as { message: string };

      expect(result.message).toBe('Member removed');
      expect(mockPrisma.organizationMember.delete).toHaveBeenCalledWith({ where: { id: 'mem-1' } });
    });

    it('throws NotFoundException when member does not exist', async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);

      await expect(service.removeMember(ORG_ID, 'ghost'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── updateSettings ──────────────────────────────────────────────────────────

  describe('updateSettings', () => {
    it('merges settings and saves', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ settings: { industry: 'SaaS' } });
      mockPrisma.organization.update.mockResolvedValue({ id: ORG_ID, settings: { industry: 'SaaS', modules: ['crm'] } });

      const result = await service.updateSettings(ORG_ID, { settings: { modules: ['crm'] } });

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { settings: expect.objectContaining({ industry: 'SaaS', modules: ['crm'] }) },
        }),
      );
      expect(result).toBeDefined();
    });

    it('stores onboardingCompleted flag in settings JSON', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ settings: {} });
      mockPrisma.organization.update.mockResolvedValue({ id: ORG_ID, settings: { onboardingCompleted: true } });

      await service.updateSettings(ORG_ID, { onboardingCompleted: true });

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { settings: expect.objectContaining({ onboardingCompleted: true }) },
        }),
      );
    });
  });
});
