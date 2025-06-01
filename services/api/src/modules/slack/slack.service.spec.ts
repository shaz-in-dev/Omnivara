import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { SlackService } from './slack.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  slackIntegration: {
    findUnique: jest.fn(),
    upsert:     jest.fn(),
    delete:     jest.fn(),
  },
};

const mockHttp = {
  post: jest.fn(() => of({ data: { ok: true } })),
};

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    id:          overrides.id          ?? 'si-1',
    orgId:       overrides.orgId       ?? 'org-1',
    accessToken: overrides.accessToken ?? 'xoxb-test-token',
    channelId:   overrides.channelId   ?? 'C01234',
    channelName: overrides.channelName ?? '#general',
    installedBy: overrides.installedBy ?? 'user-1',
    createdAt:   overrides.createdAt   ?? new Date(),
    ...overrides,
  };
}

describe('SlackService', () => {
  let service: SlackService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SlackService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HttpService,   useValue: mockHttp },
      ],
    }).compile();
    service = module.get(SlackService);
  });

  describe('getConfig', () => {
    it('returns integration config when configured', async () => {
      mockPrisma.slackIntegration.findUnique.mockResolvedValue(makeConfig());
      const result = await service.getConfig('org-1');
      expect(result?.channelId).toBe('C01234');
    });

    it('returns null when not configured', async () => {
      mockPrisma.slackIntegration.findUnique.mockResolvedValue(null);
      const result = await service.getConfig('org-1');
      expect(result).toBeNull();
    });
  });

  describe('saveConfig', () => {
    it('upserts the slack integration', async () => {
      mockPrisma.slackIntegration.upsert.mockResolvedValue(makeConfig());
      await service.saveConfig('org-1', 'user-1', {
        accessToken: 'xoxb-new', channelId: 'C99', channelName: '#alerts',
      });
      expect(mockPrisma.slackIntegration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where:  { orgId: 'org-1' },
          create: expect.objectContaining({ orgId: 'org-1', installedBy: 'user-1' }),
          update: expect.objectContaining({ accessToken: 'xoxb-new' }),
        }),
      );
    });
  });

  describe('removeConfig', () => {
    it('deletes the integration', async () => {
      mockPrisma.slackIntegration.findUnique.mockResolvedValue(makeConfig());
      mockPrisma.slackIntegration.delete.mockResolvedValue({});
      await service.removeConfig('org-1');
      expect(mockPrisma.slackIntegration.delete).toHaveBeenCalledWith({ where: { orgId: 'org-1' } });
    });

    it('throws NotFoundException when not configured', async () => {
      mockPrisma.slackIntegration.findUnique.mockResolvedValue(null);
      await expect(service.removeConfig('org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendTest', () => {
    it('posts a test message to the configured channel', async () => {
      mockPrisma.slackIntegration.findUnique.mockResolvedValue(makeConfig());
      const result = await service.sendTest('org-1');
      expect(result.ok).toBe(true);
      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.stringContaining('/chat.postMessage'),
        expect.objectContaining({ channel: 'C01234' }),
        expect.any(Object),
      );
    });

    it('throws NotFoundException when not configured', async () => {
      mockPrisma.slackIntegration.findUnique.mockResolvedValue(null);
      await expect(service.sendTest('org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('_buildMessage', () => {
    function buildMsg(type: string, payload: Record<string, unknown>) {
      return (service as any)._buildMessage({ orgId: 'org-1', type, payload });
    }

    it('returns message for lead.created with name in text', () => {
      const msg = buildMsg('lead.created', { name: 'John Doe', email: 'j@x.com', status: 'new' });
      expect(msg).not.toBeNull();
      expect(msg.text).toContain('John Doe');
    });

    it('returns message for ticket.created with subject', () => {
      const msg = buildMsg('ticket.created', { subject: 'Login broken', priority: 'high' });
      expect(msg.text).toContain('Login broken');
    });

    it('returns message for opportunity.won with deal name', () => {
      const msg = buildMsg('opportunity.won', { name: 'BigCo Deal', value: '50000' });
      expect(msg.text).toContain('BigCo Deal');
    });

    it('returns message for invoice.paid with amount', () => {
      const msg = buildMsg('invoice.paid', { number: 'INV-001', total: '1500', currency: 'USD' });
      expect(msg.text).toContain('INV-001');
      expect(msg.text).toContain('1500');
    });

    it('returns message for ticket.resolved', () => {
      const msg = buildMsg('ticket.resolved', { subject: 'Issue fixed' });
      expect(msg.text).toContain('Issue fixed');
    });

    it('returns null for unknown event type', () => {
      const msg = buildMsg('unknown.event', {});
      expect(msg).toBeNull();
    });

    it('each message has a blocks array for rich formatting', () => {
      const msg = buildMsg('lead.created', { name: 'Test', email: 't@x.com', status: 'new' });
      expect(msg.blocks).toBeDefined();
      expect(Array.isArray(msg.blocks)).toBe(true);
    });
  });

  describe('onSlackEvent', () => {
    it('does not throw when integration not configured (no-op)', async () => {
      mockPrisma.slackIntegration.findUnique.mockResolvedValue(null);
      await expect(
        (service as any)._handleEvent({ orgId: 'org-1', type: 'lead.created', payload: { name: 'X' } }),
      ).resolves.not.toThrow();
    });
  });
});
