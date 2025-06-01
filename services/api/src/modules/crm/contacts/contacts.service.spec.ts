import { Test } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1';
const USER_ID = 'user-1';
const ACCOUNT_ID = 'account-1';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'contact-1',
  orgId: ORG_ID,
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '+1-555-0100',
  accountId: ACCOUNT_ID,
  ownerId: USER_ID,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  contact: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ContactsService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a contact with orgId and falls back to userId as ownerId', async () => {
      const row = makeRow();
      mockPrisma.contact.create.mockResolvedValue(row);

      const result = await service.create(ORG_ID, USER_ID, {
        name: 'Alice Smith',
        email: 'alice@example.com',
      });

      expect(mockPrisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: ORG_ID, ownerId: USER_ID }),
        }),
      );
      expect(result.id).toBe('contact-1');
    });

    it('uses dto.ownerId when explicitly supplied', async () => {
      const row = makeRow({ ownerId: 'other-user' });
      mockPrisma.contact.create.mockResolvedValue(row);

      await service.create(ORG_ID, USER_ID, {
        name: 'Bob Jones',
        ownerId: 'other-user',
      });

      expect(mockPrisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: 'other-user' }),
        }),
      );
    });

    it('passes all dto fields through to prisma', async () => {
      const row = makeRow({ phone: '+1-555-0200' });
      mockPrisma.contact.create.mockResolvedValue(row);

      await service.create(ORG_ID, USER_ID, {
        name: 'Carol',
        email: 'carol@example.com',
        phone: '+1-555-0200',
        accountId: ACCOUNT_ID,
      });

      expect(mockPrisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+1-555-0200',
            accountId: ACCOUNT_ID,
          }),
        }),
      );
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated contacts for an org', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([makeRow()]);
      mockPrisma.contact.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID, 1, 25);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(25);
      expect(result.meta.totalPages).toBe(1);
    });

    it('applies search filter to findMany where clause', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([]);
      mockPrisma.contact.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, 1, 25, 'alice');

      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'alice' }) }),
              expect.objectContaining({ email: expect.objectContaining({ contains: 'alice' }) }),
            ]),
          }),
        }),
      );
    });

    it('applies accountId filter when provided', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([makeRow()]);
      mockPrisma.contact.count.mockResolvedValue(1);

      await service.findAll(ORG_ID, 1, 25, undefined, ACCOUNT_ID);

      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ accountId: ACCOUNT_ID }),
        }),
      );
    });

    it('scopes query to orgId and returns empty page when no contacts exist', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([]);
      mockPrisma.contact.count.mockResolvedValue(0);

      const result = await service.findAll(ORG_ID, 2, 10);

      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ orgId: ORG_ID }) }),
      );
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the contact when found', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(makeRow());

      const result = await service.findOne(ORG_ID, 'contact-1');

      expect(result.id).toBe('contact-1');
      expect(mockPrisma.contact.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'contact-1', orgId: ORG_ID } }),
      );
    });

    it('throws NotFoundException when contact does not exist', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.findOne(ORG_ID, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when contact belongs to a different org', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.findOne('other-org', 'contact-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates the contact and returns the updated record', async () => {
      const updated = makeRow({ name: 'Alice Updated' });
      mockPrisma.contact.findFirst.mockResolvedValue(makeRow());
      mockPrisma.contact.update.mockResolvedValue(updated);

      const result = await service.update(ORG_ID, 'contact-1', { name: 'Alice Updated' });

      expect(mockPrisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'contact-1' } }),
      );
      expect(result.name).toBe('Alice Updated');
    });

    it('throws NotFoundException via findOne when contact does not exist', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.update(ORG_ID, 'bad-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.contact.update).not.toHaveBeenCalled();
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes the contact and returns a success message', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(makeRow());
      mockPrisma.contact.delete.mockResolvedValue(makeRow());

      const result = await service.remove(ORG_ID, 'contact-1');

      expect(mockPrisma.contact.delete).toHaveBeenCalledWith({ where: { id: 'contact-1' } });
      expect(result).toEqual({ message: 'Contact deleted' });
    });

    it('throws NotFoundException when contact does not exist', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.remove(ORG_ID, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.contact.delete).not.toHaveBeenCalled();
    });
  });
});
