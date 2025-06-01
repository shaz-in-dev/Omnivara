import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateOpportunityDto } from './dto/create-opportunity.dto';
import type { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityStage } from '@prisma/client';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma:   PrismaService,
    private readonly emitter:  EventEmitter2,
  ) {}

  async create(orgId: string, userId: string, dto: CreateOpportunityDto) {
    const opp = await this.prisma.opportunity.create({
      data: { ...dto, orgId, ownerId: dto.ownerId ?? userId },
    });
    this.emitter.emit('webhook.dispatch', {
      orgId, event: 'opportunity.created',
      payload: { id: opp.id, name: opp.name, stage: opp.stage, amount: opp.amount },
    });
    return opp;
  }

  async findAll(orgId: string, page = 1, limit = 25, stage?: OpportunityStage, ownerId?: string) {
    const where = { orgId, ...(stage && { stage }), ...(ownerId && { ownerId }) };
    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        include: {
          account: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.opportunity.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  /** Pipeline view — opportunities grouped by stage */
  async getPipeline(orgId: string, ownerId?: string) {
    const opps = await this.prisma.opportunity.findMany({
      where: { orgId, ...(ownerId && { ownerId }) },
      include: {
        account: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Object.values(OpportunityStage).map((stage) => ({
      stage,
      opportunities: opps.filter((o) => o.stage === stage),
      totalAmount: opps
        .filter((o) => o.stage === stage)
        .reduce((sum, o) => sum + Number(o.amount ?? 0), 0),
    }));
  }

  async findOne(orgId: string, id: string) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, orgId },
      include: {
        account: true,
        contact: true,
        owner: { select: { id: true, name: true, avatarUrl: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return opp;
  }

  async update(orgId: string, id: string, dto: UpdateOpportunityDto) {
    const before = await this.findOne(orgId, id);
    const opp = await this.prisma.opportunity.update({ where: { id }, data: dto });
    // Fire won/lost events on stage transitions
    if (dto.stage && dto.stage !== before.stage) {
      if (dto.stage === OpportunityStage.closed_won) {
        this.emitter.emit('webhook.dispatch', {
          orgId, event: 'opportunity.won',
          payload: { id: opp.id, name: opp.name, amount: opp.amount },
        });
        this.emitter.emit('slack.notify', {
          orgId, type: 'opportunity.won',
          payload: { id: opp.id, name: opp.name, value: String(opp.amount ?? '0') },
        });
      } else if (dto.stage === OpportunityStage.closed_lost) {
        this.emitter.emit('webhook.dispatch', {
          orgId, event: 'opportunity.lost',
          payload: { id: opp.id, name: opp.name, amount: opp.amount },
        });
      }
    }
    return opp;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.opportunity.delete({ where: { id } });
    return { message: 'Opportunity deleted' };
  }
}
