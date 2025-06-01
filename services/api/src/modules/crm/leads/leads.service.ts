import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import type { ListLeadsDto } from './dto/list-leads.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(orgId: string, userId: string, dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: { ...dto, orgId, ownerId: dto.ownerId ?? userId },
    });
    this._embed(orgId, lead.id, `Lead: ${lead.name}. Company: ${lead.company ?? ''}. Email: ${lead.email ?? ''}. Status: ${lead.status}.`);
    // Webhook + Slack domain events
    this.emitter.emit('webhook.dispatch', {
      orgId, event: 'lead.created',
      payload: { id: lead.id, name: lead.name, email: lead.email, company: lead.company, status: lead.status },
    });
    this.emitter.emit('slack.notify', {
      orgId, type: 'lead.created',
      payload: { id: lead.id, name: lead.name, email: lead.email, status: lead.status },
    });
    return lead;
  }

  async findAll(orgId: string, query: ListLeadsDto) {
    const { page, limit, status, ownerId, search } = query;
    const where = {
      orgId,
      ...(status && { status }),
      ...(ownerId && { ownerId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { company: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: { owner: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.lead.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, orgId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(orgId: string, id: string, dto: UpdateLeadDto) {
    await this.findOne(orgId, id);
    const lead = await this.prisma.lead.update({ where: { id }, data: dto });
    this._embed(orgId, lead.id, `Lead: ${lead.name}. Company: ${lead.company ?? ''}. Email: ${lead.email ?? ''}. Status: ${lead.status}.`);
    return lead;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.lead.delete({ where: { id } });
    this.emitter.emit('embed.delete', { orgId, recordType: 'lead', recordId: id });
    return { message: 'Lead deleted' };
  }

  private _embed(orgId: string, recordId: string, content: string) {
    this.emitter.emit('embed.record', { orgId, recordType: 'lead', recordId, content });
  }
}
