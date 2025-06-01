import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  auditLog: {
    create:   jest.fn(),
    findMany: jest.fn(),
    count:    jest.fn(),
  },
};

function makeAuditEvent(overrides: Record<string, unknown> = {}) {
  return {
    orgId:        overrides.orgId        ?? 'org-1',
    userId:       overrides.userId       ?? 'user-1',
    action:       overrides.action       ?? 'CREATE',
    resourceType: overrides.resourceType ?? 'lead',
    resourceId:   overrides.resourceId   ?? 'lead-1',
    ipAddress:    overrides.ipAddress    ?? '127.0.0.1',
    userAgent:    overrides.userAgent    ?? 'Mozilla/5.0',
    ...overrides,
  };
}

function makeAuditRow(overrides: Record<string, unknown> = {}) {
  return {
    id:           overrides.id           ?? 'log-1',
    orgId:        overrides.orgId        ?? 'org-1',
    userId:       overrides.userId       ?? 'user-1',
    action:       overrides.action       ?? 'CREATE',
    resourceType: overrides.resourceType ?? 'lead',
    resourceId:   overrides.resourceId   ?? 'lead-1',
    ipAddress:    overrides.ipAddress    ?? '127.0.0.1',
    userAgent:    overrides.userAgent    ?? 'Mozilla/5.0',
    createdAt:    overrides.createdAt    ?? new Date(),
    user:         overrides.user         ?? { name: 'Alice', email: 'alice@x.com' },
    ...overrides,
  };
}

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AuditService);
  });

  // ── handleAuditEvent ──────────────────────────────────────────────────────

  describe('handleAuditEvent', () => {
    it('persists audit event to DB', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});
      await service.handleAuditEvent(makeAuditEvent() as any);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId:  'org-1',
          userId: 'user-1',
          action: 'CREATE',
        }),
      });
    });

    it('swallows DB errors silently — never throws', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('DB down'));
      await expect(service.handleAuditEvent(makeAuditEvent() as any)).resolves.not.toThrow();
    });

    it('handles events without userId (anonymous/system actions)', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});
      await service.handleAuditEvent(makeAuditEvent({ userId: undefined }) as any);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated audit logs for org', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([makeAuditRow()]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll('org-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('applies userId filter', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll('org-1', { userId: 'user-1' });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('applies action filter (case-insensitive contains)', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll('org-1', { action: 'DELETE' });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: expect.objectContaining({ contains: 'DELETE' }),
          }),
        }),
      );
    });

    it('applies date range filter', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      const from = new Date('2026-01-01');
      const to   = new Date('2026-01-31');

      await service.findAll('org-1', { dateFrom: from, dateTo: to });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: from, lte: to }),
          }),
        }),
      );
    });

    it('caps limit at 200', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll('org-1', { limit: 9999 });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });

    it('returns meta with correct page/pages', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([makeAuditRow()]);
      mockPrisma.auditLog.count.mockResolvedValue(100);

      const result = await service.findAll('org-1', { page: 2, limit: 50 });
      expect(result.meta.page).toBe(2);
      expect(result.meta.pages).toBe(2);
    });
  });

  // ── exportCsv ─────────────────────────────────────────────────────────────

  describe('exportCsv', () => {
    it('returns CSV string starting with header row', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([makeAuditRow()]);
      const csv = await service.exportCsv('org-1', {});
      expect(typeof csv).toBe('string');
      expect(csv.startsWith('id,timestamp')).toBe(true);
    });

    it('includes one data row per audit log', async () => {
      const rows = [makeAuditRow({ id: 'log-1' }), makeAuditRow({ id: 'log-2' })];
      mockPrisma.auditLog.findMany.mockResolvedValue(rows);

      const csv = await service.exportCsv('org-1', {});
      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(3); // header + 2 data rows
    });

    it('returns just header when no audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      const csv = await service.exportCsv('org-1', {});
      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(1);
    });
  });
});
