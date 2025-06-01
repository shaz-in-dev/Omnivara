import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskItemsService } from './task-items.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  task:          { findFirst: jest.fn() },
  taskComment:   { findMany: jest.fn(), create: jest.fn() },
  taskChecklist: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
};

function makeTask(overrides: Record<string, unknown> = {}) {
  return { id: overrides.id ?? 'task-1', orgId: overrides.orgId ?? 'org-1', ...overrides };
}

function makeComment(overrides: Record<string, unknown> = {}) {
  return {
    id:        overrides.id        ?? 'cmt-1',
    taskId:    overrides.taskId    ?? 'task-1',
    authorId:  overrides.authorId  ?? 'user-1',
    content:   overrides.content   ?? 'Looks good',
    createdAt: overrides.createdAt ?? new Date(),
    author:    overrides.author    ?? { id: 'user-1', name: 'Alice', avatarUrl: null },
    ...overrides,
  };
}

function makeChecklistItem(overrides: Record<string, unknown> = {}) {
  return {
    id:       overrides.id       ?? 'cl-1',
    taskId:   overrides.taskId   ?? 'task-1',
    text:     overrides.text     ?? 'Write unit tests',
    done:     overrides.done     ?? false,
    position: overrides.position ?? 0,
    ...overrides,
  };
}

describe('TaskItemsService', () => {
  let service: TaskItemsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TaskItemsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TaskItemsService);
  });

  // ── Comments ──────────────────────────────────────────────────────────────

  describe('findComments', () => {
    it('returns comments ordered chronologically', async () => {
      mockPrisma.taskComment.findMany.mockResolvedValue([makeComment()]);
      const result = await service.findComments('org-1', 'task-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.taskComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where:   { taskId: 'task-1', orgId: 'org-1' },
          orderBy: { createdAt: 'asc' },
        }),
      );
    });
  });

  describe('createComment', () => {
    it('creates comment on valid task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(makeTask());
      mockPrisma.taskComment.create.mockResolvedValue(makeComment());

      await service.createComment('org-1', 'task-1', 'user-1', 'LGTM');
      expect(mockPrisma.taskComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ taskId: 'task-1', authorId: 'user-1', content: 'LGTM' }),
        }),
      );
    });

    it('throws NotFoundException when task not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(service.createComment('org-1', 'bad', 'user-1', 'Hi')).rejects.toThrow(NotFoundException);
    });

    it('scopes task lookup to orgId', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(service.createComment('org-2', 'task-1', 'user-1', 'Hi')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Checklist ──────────────────────────────────────────────────────────────

  describe('findChecklist', () => {
    it('returns checklist items ordered by position', async () => {
      mockPrisma.taskChecklist.findMany.mockResolvedValue([makeChecklistItem()]);
      const result = await service.findChecklist('org-1', 'task-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.taskChecklist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { position: 'asc' } }),
      );
    });
  });

  describe('createChecklistItem', () => {
    it('creates checklist item with position equal to current count', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(makeTask());
      mockPrisma.taskChecklist.count.mockResolvedValue(3);
      mockPrisma.taskChecklist.create.mockResolvedValue(makeChecklistItem({ position: 3 }));

      await service.createChecklistItem('org-1', 'task-1', 'Add tests');
      expect(mockPrisma.taskChecklist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ text: 'Add tests', position: 3 }),
        }),
      );
    });

    it('throws NotFoundException when task not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(service.createChecklistItem('org-1', 'bad', 'item')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateChecklistItem', () => {
    it('marks item as done', async () => {
      mockPrisma.taskChecklist.update.mockResolvedValue(makeChecklistItem({ done: true }));
      await service.updateChecklistItem('org-1', 'cl-1', { done: true });
      expect(mockPrisma.taskChecklist.update).toHaveBeenCalledWith({
        where: { id: 'cl-1' },
        data:  { done: true },
      });
    });

    it('can update text', async () => {
      mockPrisma.taskChecklist.update.mockResolvedValue(makeChecklistItem({ text: 'New text' }));
      await service.updateChecklistItem('org-1', 'cl-1', { text: 'New text' });
      expect(mockPrisma.taskChecklist.update).toHaveBeenCalledWith({
        where: { id: 'cl-1' },
        data:  { text: 'New text' },
      });
    });
  });
});
