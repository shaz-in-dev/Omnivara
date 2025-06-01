import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TicketRepliesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTicket(orgId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, orgId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.ticketReply.findMany({
      where: { ticketId, orgId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    orgId: string,
    ticketId: string,
    data: { body: string; isAgent?: boolean; authorId?: string; authorName?: string },
  ) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, orgId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // If authorId provided, fetch their name
    let authorName = data.authorName ?? 'Agent';
    if (data.authorId && !data.authorName) {
      const user = await this.prisma.user.findUnique({ where: { id: data.authorId }, select: { name: true } });
      authorName = user?.name ?? 'Agent';
    }

    return this.prisma.ticketReply.create({
      data: {
        ticketId,
        orgId,
        body: data.body,
        isAgent: data.isAgent ?? false,
        ...(data.authorId ? { authorId: data.authorId } : {}),
        authorName,
      },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }
}
