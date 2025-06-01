import { Test } from '@nestjs/testing';
import { NotificationsService, NotificationType } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { firstValueFrom, take } from 'rxjs';

// ── Mock PrismaService ────────────────────────────────────────────────────────

const mockPrisma = {
  notification: {
    create:     jest.fn(),
    findMany:   jest.fn(),
    count:      jest.fn(),
    findFirst:  jest.fn(),
    update:     jest.fn(),
    updateMany: jest.fn(),
    delete:     jest.fn(),
    deleteMany: jest.fn(),
  },
};

function makeRow(overrides: Partial<{
  id: string; orgId: string; userId: string | null; type: string;
  title: string; body: string; url: string | null;
  read: boolean; readAt: Date | null; createdAt: Date;
}> = {}) {
  return {
    id:        overrides.id        ?? 'ntf_test_1',
    orgId:     overrides.orgId     ?? 'org-1',
    userId:    overrides.userId    ?? 'user-1',
    type:      overrides.type      ?? 'task_assigned',
    title:     overrides.title     ?? 'Test',
    body:      overrides.body      ?? 'Test body',
    url:       overrides.url       ?? null,
    read:      overrides.read      ?? false,
    readAt:    overrides.readAt    ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  // ── emit ─────────────────────────────────────────────────────────────────────

  describe('emit', () => {
    it('persists to DB and returns a NotificationEvent', async () => {
      const row = makeRow({ id: 'ntf_abc', type: 'task_assigned' });
      mockPrisma.notification.create.mockResolvedValue(row);

      const result = await service.emit({
        orgId:  'org-1',
        userId: 'user-1',
        type:   'task_assigned',
        title:  'Task assigned',
        body:   'You have a new task',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('ntf_abc');
      expect(result.read).toBe(false);
      expect(result.type).toBe('task_assigned');
    });

    it('falls back to ephemeral event when DB fails', async () => {
      mockPrisma.notification.create.mockRejectedValue(new Error('DB down'));

      const result = await service.emit({
        orgId: 'org-1',
        type:  'system',
        title: 'Fallback',
        body:  'DB was unavailable',
      });

      expect(result.id).toMatch(/^ntf_/);
      expect(result.read).toBe(false);
    });
  });

  // ── getStream (SSE) ────────────────────────────────────────────────────────

  describe('getStream', () => {
    it('delivers events to matching orgId and userId after emit', async () => {
      const row = makeRow({ orgId: 'org-1', userId: 'user-1', title: 'Live event' });
      mockPrisma.notification.create.mockResolvedValue(row);

      const stream = service.getStream('org-1', 'user-1');
      const msgProm = firstValueFrom(stream.pipe(take(1)));

      await service.emit({ orgId: 'org-1', userId: 'user-1', type: 'mention', title: 'Live event', body: 'body' });

      const msg = await msgProm;
      expect((msg as { data: { title: string } }).data.title).toBe('Live event');
    });

    it('does not deliver events for a different org', (done) => {
      mockPrisma.notification.create.mockResolvedValue(makeRow({ orgId: 'org-99' }));
      const stream = service.getStream('org-1', 'user-1');
      let received = false;

      stream.pipe(take(1)).subscribe(() => { received = true; });

      void service.emit({ orgId: 'org-99', userId: 'user-1', type: 'ticket_update', title: 'Wrong org', body: 'x' });

      setTimeout(() => { expect(received).toBe(false); done(); }, 20);
    });

    it('delivers org-wide broadcasts (no userId) to all org subscribers', async () => {
      const row = makeRow({ orgId: 'org-1', userId: null, type: 'stock_low' });
      mockPrisma.notification.create.mockResolvedValue(row);

      const stream = service.getStream('org-1', 'user-2');
      const msgProm = firstValueFrom(stream.pipe(take(1)));

      await service.emit({ orgId: 'org-1', type: 'stock_low', title: 'Low stock', body: 'SKU-001' });

      const msg = await msgProm;
      expect((msg as { data: { type: string } }).data.type).toBe('stock_low');
    });
  });

  // ── getRecent ─────────────────────────────────────────────────────────────────

  describe('getRecent', () => {
    it('returns notifications from DB', async () => {
      const rows = [makeRow({ orgId: 'org-1', userId: 'user-1' })];
      mockPrisma.notification.findMany.mockResolvedValue(rows);

      const result = await service.getRecent('org-1', 'user-1');

      expect(mockPrisma.notification.findMany).toHaveBeenCalledTimes(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]!.orgId).toBe('org-1');
    });

    it('returns items with required fields', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([makeRow()]);
      const result = await service.getRecent('org-1', 'user-1');
      const first  = result[0]!;

      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('type');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('body');
      expect(first).toHaveProperty('createdAt');
      expect(typeof first.read).toBe('boolean');
    });
  });

  // ── unreadCount ───────────────────────────────────────────────────────────────

  describe('unreadCount', () => {
    it('returns the count from DB', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);
      const count = await service.unreadCount('org-1', 'user-1');
      expect(count).toBe(5);
    });
  });

  // ── markAllRead ───────────────────────────────────────────────────────────────

  describe('markAllRead', () => {
    it('returns the number of updated records', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });
      const result = await service.markAllRead('org-1', 'user-1');
      expect(result.count).toBe(3);
    });
  });
});
