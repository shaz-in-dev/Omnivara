import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import { TicketStatus, TicketPriority, TicketChannel } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  async findAll(orgId: string, page = 1, limit = 25, status?: TicketStatus) {
    const where = { orgId, ...(status && { status }) };
    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          contact: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, orgId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(orgId: string, data: { subject: string; description?: string; priority?: TicketPriority | string; channel?: TicketChannel | string; contactName?: string; tags?: string[] }) {
    const { contactName: _cn, tags: _t, priority, channel, ...rest } = data;
    const ticket = await this.prisma.ticket.create({
      data: {
        orgId,
        ...rest,
        ...(priority ? { priority: priority as TicketPriority } : {}),
        ...(channel  ? { channel:  channel  as TicketChannel  } : {}),
      },
    });
    this.emitter.emit('embed.record', {
      orgId,
      recordType: 'ticket',
      recordId:   ticket.id,
      content:    `Ticket: ${ticket.subject}. Priority: ${ticket.priority}. Description: ${ticket.description ?? ''}. Status: ${ticket.status}.`,
    });
    // Webhook + Slack domain events
    this.emitter.emit('webhook.dispatch', {
      orgId, event: 'ticket.created',
      payload: { id: ticket.id, subject: ticket.subject, priority: ticket.priority, channel: ticket.channel },
    });
    this.emitter.emit('slack.notify', {
      orgId, type: 'ticket.created',
      payload: { id: ticket.id, subject: ticket.subject, priority: ticket.priority, channel: ticket.channel },
    });
    return ticket;
  }

  async updateStatus(orgId: string, id: string, status: TicketStatus) {
    await this.findOne(orgId, id);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status,
        ...(status === TicketStatus.resolved && { resolvedAt: new Date() }),
      },
    });
    // Fire webhook/slack when resolved
    if (status === TicketStatus.resolved || status === TicketStatus.closed) {
      const eventName = status === TicketStatus.resolved ? 'ticket.resolved' : 'ticket.closed';
      this.emitter.emit('webhook.dispatch', {
        orgId, event: eventName,
        payload: { id: ticket.id, subject: ticket.subject, status: ticket.status },
      });
      if (status === TicketStatus.resolved) {
        this.emitter.emit('slack.notify', {
          orgId, type: 'ticket.resolved',
          payload: { id: ticket.id, subject: ticket.subject },
        });
      }
    }
    return ticket;
  }

  async assign(orgId: string, id: string, assigneeId: string) {
    await this.findOne(orgId, id);
    return this.prisma.ticket.update({ where: { id }, data: { assigneeId } });
  }
}
