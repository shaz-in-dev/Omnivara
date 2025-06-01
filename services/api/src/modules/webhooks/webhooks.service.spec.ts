import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  webhook: {
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  webhookDelivery: {
    findMany: jest.fn(),
    create:   jest.fn(),
    update:   jest.fn(),
  },
};

const mockHttp = {
  post:   jest.fn(() => of({ status: 200, data: 'ok' })),
  delete: jest.fn(() => of({})),
};

function makeWebhook(overrides: Record<string, unknown> = {}) {
  return {
    id:        overrides.id        ?? 'wh-1',
    orgId:     overrides.orgId     ?? 'org-1',
    url:       overrides.url       ?? 'https://example.com/hook',
    events:    overrides.events    ?? ['lead.created'],
    secret:    overrides.secret    ?? 'super-secret-32-chars-minimum!!',
    active:    overrides.active    ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides,
  };
}

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HttpService,   useValue: mockHttp },
      ],
    }).compile();
    service = module.get(WebhooksService);
  });

  describe('findAll', () => {
    it('returns all webhooks for org', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([makeWebhook()]);
      const result = await service.findAll('org-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.webhook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orgId: 'org-1' } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the webhook', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(makeWebhook());
      const result = await service.findOne('org-1', 'wh-1');
      expect(result.id).toBe('wh-1');
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(null);
      await expect(service.findOne('org-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates a random secret and persists the webhook', async () => {
      mockPrisma.webhook.create.mockResolvedValue(makeWebhook());
      await service.create('org-1', { url: 'https://a.com/hook', events: ['lead.created'] });
      const call = mockPrisma.webhook.create.mock.calls[0]![0] as { data: Record<string, unknown> };
      expect(call.data['secret']).toBeDefined();
      expect(typeof call.data['secret']).toBe('string');
      expect((call.data['secret'] as string).length).toBeGreaterThanOrEqual(32);
    });

    it('two webhooks get different secrets', async () => {
      mockPrisma.webhook.create.mockResolvedValue(makeWebhook());
      await service.create('org-1', { url: 'https://a.com/1', events: ['lead.created'] });
      await service.create('org-1', { url: 'https://a.com/2', events: ['ticket.created'] });
      const secret1 = (mockPrisma.webhook.create.mock.calls[0]![0] as any).data.secret as string;
      const secret2 = (mockPrisma.webhook.create.mock.calls[1]![0] as any).data.secret as string;
      expect(secret1).not.toBe(secret2);
    });

    it('stores orgId, url, events in DB', async () => {
      mockPrisma.webhook.create.mockResolvedValue(makeWebhook());
      await service.create('org-1', { url: 'https://a.com/hook', events: ['invoice.paid'] });
      expect(mockPrisma.webhook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1', url: 'https://a.com/hook' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates active flag', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(makeWebhook());
      mockPrisma.webhook.update.mockResolvedValue(makeWebhook({ active: false }));
      await service.update('org-1', 'wh-1', { active: false });
      expect(mockPrisma.webhook.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ active: false }) }),
      );
    });

    it('throws NotFoundException when webhook not found', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(null);
      await expect(service.update('org-1', 'bad', { active: false })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the webhook', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(makeWebhook());
      mockPrisma.webhook.delete.mockResolvedValue({});
      await service.remove('org-1', 'wh-1');
      expect(mockPrisma.webhook.delete).toHaveBeenCalledWith({ where: { id: 'wh-1' } });
    });

    it('throws NotFoundException for unknown webhook', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(null);
      await expect(service.remove('org-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDeliveries', () => {
    it('returns delivery history for a webhook', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(makeWebhook());
      mockPrisma.webhookDelivery.findMany.mockResolvedValue([
        { id: 'del-1', webhookId: 'wh-1', event: 'lead.created', status: 'success' },
      ]);
      const result = await service.getDeliveries('org-1', 'wh-1');
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when webhook not found', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(null);
      await expect(service.getDeliveries('org-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('HMAC signing', () => {
    it('_sign produces consistent output for same inputs', () => {
      const sign = (service as any)._sign.bind(service);
      const sig1 = sign('secret123', 1234567890, '{"event":"test"}');
      const sig2 = sign('secret123', 1234567890, '{"event":"test"}');
      expect(sig1).toBe(sig2);
    });

    it('_sign produces different output for different secrets', () => {
      const sign = (service as any)._sign.bind(service);
      const sig1 = sign('secret-A', 1234567890, '{"event":"test"}');
      const sig2 = sign('secret-B', 1234567890, '{"event":"test"}');
      expect(sig1).not.toBe(sig2);
    });

    it('_sign produces different output for different payloads', () => {
      const sign = (service as any)._sign.bind(service);
      const sig1 = sign('secret', 1234567890, '{"event":"lead.created"}');
      const sig2 = sign('secret', 1234567890, '{"event":"ticket.created"}');
      expect(sig1).not.toBe(sig2);
    });

    it('_sign output is a 64-char hex string (SHA-256 HMAC)', () => {
      const sign = (service as any)._sign.bind(service);
      const sig = sign('secret', 1234567890, 'payload');
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
