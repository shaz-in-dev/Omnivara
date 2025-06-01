import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AiService } from './ai.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  organization: { findUnique: jest.fn() },
  aiUsage:      { findUnique: jest.fn(), upsert: jest.fn() },
};

const mockHttp = {
  post:   jest.fn(() => of({ data: { greeting: 'Good morning!', items: [] } })),
  delete: jest.fn(() => of({})),
};

const mockConfig = {
  get: jest.fn((key: string, def: unknown) => {
    if (key === 'AI_SERVICE_URL') return 'http://localhost:8000';
    return def;
  }),
};

// Minimal PLANS mock — mirrors @omnivara/config
jest.mock('@omnivara/config', () => ({
  PLANS: {
    starter: {
      modules: ['crm', 'projects'],          // no 'ai'
      limits:  { ai_credits_per_month: 0 },
    },
    growth: {
      modules: ['crm', 'projects', 'ai'],
      limits:  { ai_credits_per_month: 100 },
    },
    business: {
      modules: ['crm', 'projects', 'ai'],
      limits:  { ai_credits_per_month: -1 }, // unlimited
    },
    enterprise: {
      modules: ['crm', 'projects', 'ai'],
      limits:  { ai_credits_per_month: -1 },
    },
  },
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService,  useValue: mockPrisma },
        { provide: HttpService,    useValue: mockHttp },
        { provide: ConfigService,  useValue: mockConfig },
      ],
    }).compile();
    service = module.get(AiService);
  });

  // ── assertAiAccess ────────────────────────────────────────────────────────

  describe('assertAiAccess', () => {
    it('throws ForbiddenException for starter plan (no AI module)', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'starter' });
      await expect(service.assertAiAccess('org-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns model haiku for growth plan', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'growth' });
      mockPrisma.aiUsage.findUnique.mockResolvedValue({ messages: 0 });
      const result = await service.assertAiAccess('org-1');
      expect(result.model).toContain('haiku');
    });

    it('returns model sonnet for business plan', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'business' });
      const result = await service.assertAiAccess('org-1');
      expect(result.model).toContain('sonnet');
    });

    it('throws ForbiddenException when growth plan is at message limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'growth' });
      mockPrisma.aiUsage.findUnique.mockResolvedValue({ messages: 100 }); // at limit
      await expect(service.assertAiAccess('org-1')).rejects.toThrow(ForbiddenException);
    });

    it('allows business plan when at "limit" (unlimited = -1)', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'business' });
      // For unlimited plans, aiUsage is not checked — no mock needed
      await expect(service.assertAiAccess('org-1')).resolves.not.toThrow();
    });

    it('allows growth plan below message limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'growth' });
      mockPrisma.aiUsage.findUnique.mockResolvedValue({ messages: 50 }); // below 100 limit
      await expect(service.assertAiAccess('org-1')).resolves.not.toThrow();
    });

    it('treats missing org as starter plan', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.assertAiAccess('unknown-org')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── incrementUsage ────────────────────────────────────────────────────────

  describe('incrementUsage', () => {
    it('upserts aiUsage with incremented message count', async () => {
      mockPrisma.aiUsage.upsert.mockResolvedValue({});
      await service.incrementUsage('org-1', 150);
      expect(mockPrisma.aiUsage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ messages: 1, tokens: 150 }),
          update: expect.objectContaining({
            messages: { increment: 1 },
            tokens:   { increment: 150 },
          }),
        }),
      );
    });

    it('defaults tokensUsed to 0', async () => {
      mockPrisma.aiUsage.upsert.mockResolvedValue({});
      await service.incrementUsage('org-1');
      const call = mockPrisma.aiUsage.upsert.mock.calls[0]![0] as any;
      expect(call.create.tokens).toBe(0);
    });
  });

  // ── getUsage ──────────────────────────────────────────────────────────────

  describe('getUsage', () => {
    it('returns usage with messages, tokens, limit, percent, planId', async () => {
      mockPrisma.aiUsage.findUnique.mockResolvedValue({ messages: 30, tokens: 5000 });
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'growth' });

      const result = await service.getUsage('org-1');
      expect(result).toHaveProperty('messages', 30);
      expect(result).toHaveProperty('tokens', 5000);
      expect(result).toHaveProperty('planId', 'growth');
      expect(result).toHaveProperty('limit', 100);
      expect(result).toHaveProperty('percent', 30); // 30/100 = 30%
    });

    it('returns limit=null and percent=0 for unlimited plan', async () => {
      mockPrisma.aiUsage.findUnique.mockResolvedValue({ messages: 999, tokens: 100000 });
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'business' });

      const result = await service.getUsage('org-1');
      expect(result.limit).toBeNull();
      expect(result.percent).toBe(0);
    });

    it('returns 0 for messages and tokens when no usage exists', async () => {
      mockPrisma.aiUsage.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'growth' });

      const result = await service.getUsage('org-1');
      expect(result.messages).toBe(0);
      expect(result.tokens).toBe(0);
    });
  });

  // ── generateBrief ─────────────────────────────────────────────────────────

  describe('generateBrief', () => {
    it('posts to AI service and returns response data', async () => {
      const briefData = { greeting: 'Good morning!', items: [] };
      mockHttp.post.mockReturnValueOnce(of({ data: briefData }));

      const result = await service.generateBrief('org-1', 'user-1', 'ADMIN');
      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.stringContaining('/briefs/generate'),
        expect.objectContaining({ org_id: 'org-1', role: 'ADMIN' }),
      );
      expect(result).toEqual(briefData);
    });
  });

  // ── embedRecord ───────────────────────────────────────────────────────────

  describe('embedRecord', () => {
    it('fires HTTP POST to AI service (fire-and-forget)', async () => {
      mockHttp.post.mockReturnValueOnce(of({}));
      service.embedRecord({
        orgId: 'org-1', recordType: 'lead', recordId: 'l-1', content: 'Alice Smith',
      });
      // Fire-and-forget: allow microtasks to flush
      await Promise.resolve();
      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.stringContaining('/embeddings/index'),
        expect.objectContaining({ org_id: 'org-1', document_type: 'lead' }),
      );
    });

    it('does not throw when AI service is unavailable', async () => {
      mockHttp.post.mockReturnValueOnce(
        new (require('rxjs').Observable)((sub: any) => sub.error(new Error('connection refused'))),
      );
      expect(() => service.embedRecord({
        orgId: 'org-1', recordType: 'contact', recordId: 'c-1', content: 'Bob',
      })).not.toThrow();
    });
  });
});
