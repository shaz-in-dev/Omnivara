import { Test } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { of } from 'rxjs';

const mockService = {
  getRecent:          jest.fn(),
  unreadCount:        jest.fn(),
  markRead:           jest.fn(),
  markAllRead:        jest.fn(),
  deleteNotification: jest.fn(),
  getStream:          jest.fn(),
};

const mockRequest = (orgId = 'org-1', userId = 'user-1') =>
  ({ user: { sub: userId } } as any);

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers:   [{ provide: NotificationsService, useValue: mockService }],
    }).compile();
    controller = module.get(NotificationsController);
  });

  describe('list', () => {
    it('returns notifications from service', async () => {
      mockService.getRecent.mockResolvedValue([{ id: 'n-1' }]);
      const result = await controller.list('org-1', mockRequest(), 1, 25);
      expect(mockService.getRecent).toHaveBeenCalledWith('org-1', 'user-1', 1, 25);
      expect(result).toHaveLength(1);
    });
  });

  describe('unreadCount', () => {
    it('returns unread count', async () => {
      mockService.unreadCount.mockResolvedValue(7);
      const result = await controller.unreadCount('org-1', mockRequest());
      expect(result).toEqual({ count: 7 });
    });
  });

  describe('markRead', () => {
    it('marks single notification as read', async () => {
      mockService.markRead.mockResolvedValue({ id: 'n-1', read: true });
      const result = await controller.markRead('org-1', 'n-1', mockRequest());
      expect(mockService.markRead).toHaveBeenCalledWith('org-1', 'user-1', 'n-1');
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read', async () => {
      mockService.markAllRead.mockResolvedValue({ count: 5 });
      const result = await controller.markAllRead('org-1', mockRequest());
      expect(mockService.markAllRead).toHaveBeenCalledWith('org-1', 'user-1');
    });
  });

  describe('dismiss', () => {
    it('deletes a notification', async () => {
      mockService.deleteNotification.mockResolvedValue({});
      await controller.dismiss('org-1', 'n-1', mockRequest());
      expect(mockService.deleteNotification).toHaveBeenCalledWith('org-1', 'user-1', 'n-1');
    });
  });

  describe('stream (SSE)', () => {
    it('returns an Observable from the service', () => {
      const fakeStream = of({ data: { type: 'system', title: 'Test' } });
      mockService.getStream.mockReturnValue(fakeStream);

      const result = controller.stream('org-1', mockRequest());
      expect(mockService.getStream).toHaveBeenCalledWith('org-1', 'user-1');
      expect(result).toBe(fakeStream);
    });
  });
});
