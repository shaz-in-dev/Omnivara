import { Test } from '@nestjs/testing';
import { WebhooksController, WEBHOOK_EVENTS } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

const mockService = {
  findAll:      jest.fn(),
  findOne:      jest.fn(),
  create:       jest.fn(),
  update:       jest.fn(),
  remove:       jest.fn(),
  getDeliveries: jest.fn(),
};

describe('WebhooksController', () => {
  let controller: WebhooksController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers:   [{ provide: WebhooksService, useValue: mockService }],
    }).compile();
    controller = module.get(WebhooksController);
  });

  describe('WEBHOOK_EVENTS', () => {
    it('exports a non-empty array of event names', () => {
      expect(Array.isArray(WEBHOOK_EVENTS)).toBe(true);
      expect(WEBHOOK_EVENTS.length).toBeGreaterThan(0);
      expect(WEBHOOK_EVENTS).toContain('lead.created');
      expect(WEBHOOK_EVENTS).toContain('invoice.paid');
    });
  });

  describe('getEvents', () => {
    it('returns the list of supported event names', () => {
      const result = controller.getEvents();
      expect(result).toEqual(WEBHOOK_EVENTS);
    });
  });

  describe('findAll', () => {
    it('returns webhooks for the org', async () => {
      mockService.findAll.mockResolvedValue([{ id: 'wh-1' }]);
      const result = await controller.findAll('org-1');
      expect(mockService.findAll).toHaveBeenCalledWith('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('creates a webhook and returns it', async () => {
      mockService.create.mockResolvedValue({ id: 'wh-new', secret: 'abc123' });
      const result = await controller.create('org-1', {
        url: 'https://example.com/hook',
        events: ['lead.created'],
      });
      expect(mockService.create).toHaveBeenCalledWith('org-1', {
        url: 'https://example.com/hook',
        events: ['lead.created'],
      });
      expect(result.id).toBe('wh-new');
    });
  });

  describe('update', () => {
    it('updates webhook fields', async () => {
      mockService.update.mockResolvedValue({ id: 'wh-1', active: false });
      const result = await controller.update('org-1', 'wh-1', { active: false });
      expect(mockService.update).toHaveBeenCalledWith('org-1', 'wh-1', { active: false });
      expect(result.active).toBe(false);
    });
  });

  describe('remove', () => {
    it('removes a webhook', async () => {
      mockService.remove.mockResolvedValue(undefined);
      await controller.remove('org-1', 'wh-1');
      expect(mockService.remove).toHaveBeenCalledWith('org-1', 'wh-1');
    });
  });

  describe('getDeliveries', () => {
    it('returns delivery history for a webhook', async () => {
      mockService.getDeliveries.mockResolvedValue([{ id: 'del-1', status: 'success' }]);
      const result = await controller.getDeliveries('org-1', 'wh-1', 50);
      expect(mockService.getDeliveries).toHaveBeenCalledWith('org-1', 'wh-1', 50);
      expect(result).toHaveLength(1);
    });
  });
});
