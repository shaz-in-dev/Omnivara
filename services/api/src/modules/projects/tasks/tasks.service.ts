import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProject(orgId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, orgId } });
    if (!project) throw new NotFoundException('Project not found');
  }

  private async ensureAssigneeIsMember(orgId: string, assigneeId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { orgId, userId: assigneeId },
      select: { id: true },
    });
    if (!membership) throw new BadRequestException('Assignee must be a member of this organization');
  }

  private parseStatus(status: string): TaskStatus {
    const statuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'];
    if (!statuses.includes(status as TaskStatus)) throw new BadRequestException('Invalid task status');
    return status as TaskStatus;
  }

  private parsePriority(priority: string): TaskPriority {
    const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
    if (!priorities.includes(priority as TaskPriority)) throw new BadRequestException('Invalid task priority');
    return priority as TaskPriority;
  }

  async findByProject(orgId: string, projectId: string, page = 1, limit = 50, sprintId?: string | null) {
    await this.ensureProject(orgId, projectId);
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

  async create(orgId: string, data: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    sprintId?: string;
    dueDate?: string;
  }) {
    await this.ensureProject(orgId, data.projectId);
    if (data.assigneeId) await this.ensureAssigneeIsMember(orgId, data.assigneeId);
    return this.prisma.task.create({
      data: {
        orgId,
        projectId: data.projectId,
        title: data.title,
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status ? { status: this.parseStatus(data.status) } : {}),
        ...(data.priority ? { priority: this.parsePriority(data.priority) } : {}),
        ...(data.assigneeId ? { assigneeId: data.assigneeId } : {}),
        ...(data.sprintId ? { sprintId: data.sprintId } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
      },
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async updateStatus(orgId: string, projectId: string, id: string, status: string) {
    return this.updateTask(orgId, projectId, id, { status });
  }

  async updateTask(orgId: string, projectId: string, id: string, data: {
    sprintId?: string | null;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    title?: string;
    description?: string | null;
  }) {
    const task = await this.prisma.task.findFirst({ where: { id, orgId, projectId } });
    if (!task) throw new NotFoundException('Task not found');
    if (data.assigneeId) await this.ensureAssigneeIsMember(orgId, data.assigneeId);
    const updateData: Prisma.TaskUncheckedUpdateInput = {};
    if (data.sprintId !== undefined) updateData.sprintId = data.sprintId;
    if (data.status !== undefined) updateData.status = this.parseStatus(data.status);
    if (data.priority !== undefined) updateData.priority = this.parsePriority(data.priority);
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate === null ? null : new Date(data.dueDate);
      if (updateData.dueDate instanceof Date && Number.isNaN(updateData.dueDate.getTime())) {
        throw new BadRequestException('Invalid task due date');
      }
    }
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async deleteTask(orgId: string, projectId: string, id: string) {
    const result = await this.prisma.task.deleteMany({ where: { id, orgId, projectId } });
    if (result.count === 0) throw new NotFoundException('Task not found');
  }
}
