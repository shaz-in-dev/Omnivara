import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TicketRepliesService } from './ticket-replies.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  ticket:      { findFirst: jest.fn() },
  ticketReply: { findMany: jest.fn(), create: jest.fn() },
  user:        { findUnique: jest.fn() },
};

function makeTicket(overrides: Record<string, unknown> = {}) {
  return {
    id:    overrides.id    ?? 'ticket-1',
    orgId: overrides.orgId ?? 'org-1',
    ...overrides,
  };
}

function makeReply(overrides: Record<string, unknown> = {}) {
  return {
    id:         overrides.id         ?? 'reply-1',
    ticketId:   overrides.ticketId   ?? 'ticket-1',
    orgId:      overrides.orgId      ?? 'org-1',
    body:       overrides.body       ?? 'Thanks for reaching out.',
    isAgent:    overrides.isAgent    ?? true,
    authorName: overrides.authorName ?? 'Agent',
    createdAt:  overrides.createdAt  ?? new Date(),
    author:     overrides.author     ?? null,
    ...overrides,
  };
}

describe('TicketRepliesService', () => {
  let service: TicketRepliesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TicketRepliesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TicketRepliesService);
  });

  describe('findByTicket', () => {
    it('returns replies for a ticket in chronological order', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(makeTicket());
      mockPrisma.ticketReply.findMany.mockResolvedValue([makeReply(), makeReply({ id: 'reply-2' })]);
      const result = await service.findByTicket('org-1', 'ticket-1');
      expect(result).toHaveLength(2);
      expect(mockPrisma.ticketReply.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
      );
    });

    it('throws NotFoundException when ticket not found', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(null);
      await expect(service.findByTicket('org-1', 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when ticket belongs to different org', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(null);
      await expect(service.findByTicket('org-2', 'ticket-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a reply for a valid ticket', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(makeTicket());
      mockPrisma.ticketReply.create.mockResolvedValue(makeReply());

      await service.create('org-1', 'ticket-1', { body: 'Thanks!', isAgent: true });
      expect(mockPrisma.ticketReply.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ticketId: 'ticket-1', body: 'Thanks!' }),
        }),
      );
    });

    it('throws NotFoundException when ticket not found', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(null);
      await expect(
        service.create('org-1', 'bad-ticket', { body: 'Hi' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('fetches authorName from user record when authorId provided without authorName', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(makeTicket());
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Bob Support' });
      mockPrisma.ticketReply.create.mockResolvedValue(makeReply({ authorName: 'Bob Support' }));

      await service.create('org-1', 'ticket-1', { body: 'Hi', authorId: 'user-5' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-5' }, select: { name: true },
      });
      expect(mockPrisma.ticketReply.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorName: 'Bob Support' }),
        }),
      );
    });

    it('uses provided authorName without querying user table', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(makeTicket());
      mockPrisma.ticketReply.create.mockResolvedValue(makeReply());

      await service.create('org-1', 'ticket-1', {
        body: 'Reply', authorId: 'user-5', authorName: 'Alice',
      });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('defaults isAgent to false when not specified', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(makeTicket());
      mockPrisma.ticketReply.create.mockResolvedValue(makeReply({ isAgent: false }));

      await service.create('org-1', 'ticket-1', { body: 'Customer reply' });
      expect(mockPrisma.ticketReply.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isAgent: false }),
        }),
      );
    });
  });
});
