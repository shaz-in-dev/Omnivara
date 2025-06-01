import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  findByOrg(orgId: string) {
    return this.prisma.team.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  }
}
