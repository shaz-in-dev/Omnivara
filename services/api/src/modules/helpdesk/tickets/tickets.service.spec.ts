import { Test } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { TicketStatus, TicketPriority, TicketChannel } from '@prisma/client';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1';

const mockTicket = {
  id: 'ticket-1',
  orgId: ORG_ID,
  subject: 'Login button broken on mobile',
  description: 'The login button does nothing on iOS Safari.',
  status: 'open' as TicketStatus,
  priority: 'high' as TicketPriority,
  channel: 'email' as TicketChannel,
  assigneeId: null,
  contactId: null,
  tags: [],
  slaBreachAt: null,
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  ticket: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(TicketsService);
    jest.clearAllMocks();
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated tickets for the org', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.ticket.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('filters by status when provided', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([mockTicket]);
      mockPrisma.ticket.count.mockResolvedValue(1);

      await service.findAll(ORG_ID, 1, 25, TicketStatus.open);

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TicketStatus.open }),
        }),
      );
    });

    it('does not include status filter when not provided', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);
      mockPrisma.ticket.count.mockResolvedValue(0);

      await service.findAll(ORG_ID);

      const call = mockPrisma.ticket.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
      expect(call.where).not.toHaveProperty('status');
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns ticket when found', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(mockTicket);

      const result = await service.findOne(ORG_ID, 'ticket-1');

      expect(result.id).toBe('ticket-1');
      expect(result.subject).toBe('Login button broken on mobile');
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(null);

      await expect(service.findOne(ORG_ID, 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a ticket scoped to orgId', async () => {
      mockPrisma.ticket.create.mockResolvedValue(mockTicket);

      const result = await service.create(ORG_ID, {
        subject: 'Login button broken on mobile',
        priority: TicketPriority.high,
        channel: TicketChannel.email,
      });

      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: ORG_ID, subject: 'Login button broken on mobile' }),
        }),
      );
      expect(result.id).toBe('ticket-1');
    });
  });

  // ── updateStatus ─────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('updates the ticket status', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({ ...mockTicket, status: TicketStatus.resolved });

      const result = await service.updateStatus(ORG_ID, 'ticket-1', TicketStatus.resolved);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
          data: { status: TicketStatus.resolved },
        }),
      );
      expect(result.status).toBe(TicketStatus.resolved);
    });

    it('throws NotFoundException when ticket not found before update', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(null);

      await expect(service.updateStatus(ORG_ID, 'ghost', TicketStatus.resolved))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── assign ───────────────────────────────────────────────────────────────────

  describe('assign', () => {
    it('assigns the ticket to a user', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({ ...mockTicket, assigneeId: 'user-1' });

      const result = await service.assign(ORG_ID, 'ticket-1', 'user-1');

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
          data: { assigneeId: 'user-1' },
        }),
      );
      expect(result.assigneeId).toBe('user-1');
    });
  });
});
