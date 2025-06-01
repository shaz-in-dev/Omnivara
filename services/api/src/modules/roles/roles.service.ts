import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findByOrg(orgId: string) {
    return this.prisma.role.findMany({
      where: { OR: [{ orgId }, { isSystem: true }] },
      orderBy: { name: 'asc' },
    });
  }
}
