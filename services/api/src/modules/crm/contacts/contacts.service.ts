import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateContactDto } from './dto/create-contact.dto';
import type { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: { ...dto, orgId, ownerId: dto.ownerId ?? userId },
    });
  }

  async findAll(orgId: string, page = 1, limit = 25, search?: string, accountId?: string) {
    const where = {
      orgId,
      ...(accountId && { accountId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          account: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { name: 'asc' },
        ...paginate(page, limit),
      }),
      this.prisma.contact.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, orgId },
      include: {
        account: true,
        opportunities: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        tickets: { where: { status: { not: 'closed' } } },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async update(orgId: string, id: string, dto: UpdateContactDto) {
    await this.findOne(orgId, id);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.contact.delete({ where: { id } });
    return { message: 'Contact deleted' };
  }
}
