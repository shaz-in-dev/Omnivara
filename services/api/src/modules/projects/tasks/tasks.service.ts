import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(orgId: string, projectId: string, page = 1, limit = 50, sprintId?: string | null) {
    const where: Prisma.TaskWhereInput = { orgId, projectId };
    if (sprintId === 'backlog' || sprintId === 'null') {
      where.sprintId = null;
    } else if (sprintId) {
      where.sprintId = sprintId;
    }
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.task.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async create(orgId: string, data: { projectId: string; title: string; assigneeId?: string; priority?: string; sprintId?: string }) {
    return this.prisma.task.create({ data: { orgId, ...data } as unknown as Prisma.TaskUncheckedCreateInput });
  }

  async updateStatus(orgId: string, id: string, status: string) {
    return this.prisma.task.update({ where: { id }, data: { status: status as 'todo' } });
  }

  async updateTask(orgId: string, id: string, data: {
    sprintId?: string | null;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    title?: string;
  }) {
    return this.prisma.task.update({
      where: { id },
      data: data as Prisma.TaskUpdateInput,
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async deleteTask(orgId: string, id: string) {
    await this.prisma.task.deleteMany({ where: { id, orgId } });
  }
}
