import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateAccountDto } from './dto/create-account.dto';
import type { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateAccountDto) {
    return this.prisma.account.create({ data: { ...dto, orgId, ownerId: dto.ownerId ?? userId } });
  }

  async findAll(orgId: string, page = 1, limit = 25, search?: string) {
    const where = {
      orgId,
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        include: {
          _count: { select: { contacts: true, opportunities: true } },
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { name: 'asc' },
        ...paginate(page, limit),
      }),
      this.prisma.account.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, orgId },
      include: {
        contacts: { orderBy: { name: 'asc' } },
        opportunities: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(orgId: string, id: string, dto: UpdateAccountDto) {
    await this.findOne(orgId, id);
    return this.prisma.account.update({ where: { id }, data: dto });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.account.delete({ where: { id } });
    return { message: 'Account deleted' };
  }
}
