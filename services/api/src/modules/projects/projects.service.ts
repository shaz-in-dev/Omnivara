import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page = 1, limit = 25) {
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({ where: { orgId }, orderBy: { updatedAt: 'desc' }, ...paginate(page, limit) }),
      this.prisma.project.count({ where: { orgId } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, orgId },
      include: { sprints: { orderBy: { startDate: 'desc' } }, tasks: { orderBy: { createdAt: 'desc' } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(orgId: string, data: { name: string; description?: string; ownerId?: string }) {
    return this.prisma.project.create({ data: { ...data, orgId } });
  }

  async update(orgId: string, id: string, data: Partial<{ name: string; description: string; status: string }>) {
    await this.findOne(orgId, id);
    return this.prisma.project.update({ where: { id }, data });
  }

  // ── Sprints ────────────────────────────────────────────────────────────────

  async getSprints(orgId: string, projectId: string) {
    // Verify project belongs to org
    const project = await this.prisma.project.findFirst({ where: { id: projectId, orgId } });
    if (!project) throw new (await import('@nestjs/common').then(m => m.NotFoundException))('Project not found');
    return this.prisma.sprint.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async createSprint(orgId: string, projectId: string, data: {
    name: string; goal?: string; startDate: string; endDate: string; status?: string;
  }) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, orgId } });
    if (!project) throw new (await import('@nestjs/common').then(m => m.NotFoundException))('Project not found');
    return this.prisma.sprint.create({ data: { projectId, ...data } as Parameters<typeof this.prisma.sprint.create>[0]['data'] });
  }
}
