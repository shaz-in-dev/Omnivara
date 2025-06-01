import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: bcrypt.hashSync('Password123!', 1),
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  organization: {
    create: jest.fn(),
  },
  organizationMember: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('test-secret'),
};

const mockEmail = {
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

const mockStorage = {
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/avatars/test.jpg'),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,   useValue: mockPrisma },
        { provide: JwtService,      useValue: mockJwt },
        { provide: ConfigService,   useValue: mockConfig },
        { provide: EmailService,    useValue: mockEmail },
        { provide: StorageService,  useValue: mockStorage },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  // ── validateUser ────────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns user without passwordHash when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'Password123!');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe('user-1');
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('unknown@example.com', 'any'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.validateUser('test@example.com', 'WrongPassword'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns accessToken, refreshToken, and user', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, orgs: [] });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login('user-1');

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.user.id).toBe('user-1');
    });

    it('calls jwt.sign with correct sub and email', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, orgs: [] });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await service.login('user-1', 'org-1');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', email: 'test@example.com', orgId: 'org-1' }),
      );
    });
  });

  // ── register ─────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws ConflictException when email is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'Password123!', name: 'Test', orgName: 'Acme' }),
      ).rejects.toThrow(ConflictException);
    });

    it('calls prisma.$transaction when email is available', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue({
        id: 'user-2',
        email: 'new@example.com',
        orgs: [],
        passwordHash: 'hashed',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockJwt.sign.mockReturnValue('new.token');

      await service.register({ email: 'new@example.com', password: 'Password123!', name: 'New User', orgName: 'New Org' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
