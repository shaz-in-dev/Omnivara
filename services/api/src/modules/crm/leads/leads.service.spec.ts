import { Test } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1';
const USER_ID = 'user-1';

const mockLead = {
  id: 'lead-1',
  orgId: ORG_ID,
  name: 'Alice Smith',
  email: 'alice@example.com',
  company: 'Acme',
  status: 'new',
  ownerId: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  lead: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(LeadsService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a lead with orgId and ownerId', async () => {
      mockPrisma.lead.create.mockResolvedValue(mockLead);

      const result = await service.create(ORG_ID, USER_ID, {
        name: 'Alice Smith',
        email: 'alice@example.com',
        company: 'Acme',
      });

      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: ORG_ID, ownerId: USER_ID }),
        }),
      );
      expect(result.id).toBe('lead-1');
    });

    it('uses provided ownerId if given, not the userId', async () => {
      mockPrisma.lead.create.mockResolvedValue({ ...mockLead, ownerId: 'other-user' });

      await service.create(ORG_ID, USER_ID, {
        name: 'Bob',
        ownerId: 'other-user',
      });

      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: 'other-user' }),
        }),
      );
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated leads', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([mockLead]);
      mockPrisma.lead.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID, { page: 1, limit: 25 });

      // paginatedResponse returns { data, meta }
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('applies status filter when provided', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, { page: 1, limit: 25, status: 'new' as const });

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'new' }),
        }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns lead when found', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(mockLead);

      const result = await service.findOne(ORG_ID, 'lead-1');

      expect(result.id).toBe('lead-1');
    });

    it('throws NotFoundException when lead does not exist', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(null);

      await expect(service.findOne(ORG_ID, 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls prisma.lead.update with correct id', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, status: 'qualified' });

      const result = await service.update(ORG_ID, 'lead-1', { status: 'qualified' as const });

      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'lead-1' } }),
      );
      expect(result.status).toBe('qualified');
    });
  });
});
