import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: { ...dto, orgId, userId: dto.userId ?? userId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async findAll(
    orgId: string,
    page = 1,
    limit = 25,
    filters?: { opportunityId?: string; contactId?: string; leadId?: string },
  ) {
    const where = { orgId, ...filters };
    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.activity.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async complete(orgId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({ where: { id, orgId } });
    if (!activity) throw new NotFoundException('Activity not found');
    return this.prisma.activity.update({ where: { id }, data: { completedAt: new Date() } });
  }
}
