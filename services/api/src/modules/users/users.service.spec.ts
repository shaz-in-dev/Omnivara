import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  avatarUrl: null,
  emailVerified: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns the user when the id exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });

    it('throws NotFoundException when id does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException with descriptive message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('ghost')).rejects.toThrow('User not found');
    });

    it('queries with a select projection that excludes passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await service.findById('user-1');

      const callArgs = mockPrisma.user.findUnique.mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.select.passwordHash).toBeUndefined();
    });

    it('includes expected fields in the select projection', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await service.findById('user-1');

      const { select } = mockPrisma.user.findUnique.mock.calls[0][0];
      expect(select).toMatchObject({
        id: true,
        email: true,
        name: true,
      });
    });
  });

  // ── findByEmail ──────────────────────────────────────────────────────────────

  describe('findByEmail', () => {
    it('returns the full user record when the email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('alice@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'alice@example.com' } }),
      );
    });

    it('returns null (not throws) when the email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });

    it('does NOT throw NotFoundException for a missing email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByEmail('missing@example.com')).resolves.not.toThrow();
    });

    it('calls prisma with the correct where clause', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.findByEmail('test@domain.io');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@domain.io' } });
    });
  });
});
