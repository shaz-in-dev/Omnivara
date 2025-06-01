import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  task: {
    findMany:   jest.fn(),
    count:      jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    deleteMany: jest.fn(),
  },
};

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id:        overrides.id        ?? 'task-1',
    orgId:     overrides.orgId     ?? 'org-1',
    projectId: overrides.projectId ?? 'proj-1',
    sprintId:  overrides.sprintId  ?? 'sprint-1',
    title:     overrides.title     ?? 'Implement feature',
    status:    overrides.status    ?? 'todo',
    priority:  overrides.priority  ?? 'medium',
    createdAt: overrides.createdAt ?? new Date(),
    ...overrides,
  };
}

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TasksService);
  });

  describe('findByProject', () => {
    it('returns paginated tasks for a project', async () => {
      mockPrisma.task.findMany.mockResolvedValue([makeTask()]);
      mockPrisma.task.count.mockResolvedValue(1);

      const result = await service.findByProject('org-1', 'proj-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', projectId: 'proj-1' }),
        }),
      );
    });

    it('filters by sprintId when provided', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await service.findByProject('org-1', 'proj-1', 1, 50, 'sprint-2');
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sprintId: 'sprint-2' }),
        }),
      );
    });

    it('sets sprintId=null for backlog filter', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await service.findByProject('org-1', 'proj-1', 1, 50, 'backlog');
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sprintId: null }),
        }),
      );
    });

    it('does not filter by sprint when sprintId is undefined', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await service.findByProject('org-1', 'proj-1');
      const call = mockPrisma.task.findMany.mock.calls[0]![0] as any;
      expect(call.where).not.toHaveProperty('sprintId');
    });
  });

  describe('create', () => {
    it('creates a task scoped to org and project', async () => {
      mockPrisma.task.create.mockResolvedValue(makeTask());
      await service.create('org-1', { projectId: 'proj-1', title: 'New task' });
      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1', projectId: 'proj-1', title: 'New task' }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates task status', async () => {
      mockPrisma.task.update.mockResolvedValue(makeTask({ status: 'in_progress' }));
      await service.updateStatus('org-1', 'task-1', 'in_progress');
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data:  { status: 'in_progress' },
      });
    });
  });

  describe('updateTask', () => {
    it('updates multiple task fields at once', async () => {
      const updated = makeTask({ status: 'done', priority: 'high', sprintId: 'sprint-2' });
      mockPrisma.task.update.mockResolvedValue(updated);

      const result = await service.updateTask('org-1', 'task-1', {
        status: 'done', priority: 'high', sprintId: 'sprint-2',
      });
      expect(result.status).toBe('done');
      expect(result.priority).toBe('high');
    });

    it('can move task to backlog by setting sprintId=null', async () => {
      mockPrisma.task.update.mockResolvedValue(makeTask({ sprintId: null }));
      await service.updateTask('org-1', 'task-1', { sprintId: null });
      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sprintId: null }),
        }),
      );
    });
  });

  describe('deleteTask', () => {
    it('deletes task using deleteMany (scoped to orgId)', async () => {
      mockPrisma.task.deleteMany.mockResolvedValue({ count: 1 });
      await service.deleteTask('org-1', 'task-1');
      expect(mockPrisma.task.deleteMany).toHaveBeenCalledWith({
        where: { id: 'task-1', orgId: 'org-1' },
      });
    });
  });
});
