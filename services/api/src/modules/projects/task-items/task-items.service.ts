import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TaskItemsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Comments ──────────────────────────────────────────────────────────────

  async findComments(orgId: string, taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId, orgId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createComment(orgId: string, taskId: string, authorId: string, content: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.taskComment.create({
      data: { taskId, orgId, authorId, content },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  // ── Checklist ──────────────────────────────────────────────────────────────

  async findChecklist(orgId: string, taskId: string) {
    return this.prisma.taskChecklist.findMany({
      where: { taskId, orgId },
      orderBy: { position: 'asc' },
    });
  }

  async createChecklistItem(orgId: string, taskId: string, text: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, orgId } });
    if (!task) throw new NotFoundException('Task not found');
    const count = await this.prisma.taskChecklist.count({ where: { taskId } });
    return this.prisma.taskChecklist.create({
      data: { taskId, orgId, text, position: count },
    });
  }

  async updateChecklistItem(orgId: string, itemId: string, data: { done?: boolean; text?: string }) {
    return this.prisma.taskChecklist.update({
      where: { id: itemId },
      data,
    });
  }
}
