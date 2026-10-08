import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  project: {
    findFirst: jest.fn(),
  },
  organizationMember: {
    findFirst: jest.fn(),
  },
  task: {
    findMany:   jest.fn(),
    count:      jest.fn(),
    findFirst:  jest.fn(),
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
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', orgId: 'org-1' });
    mockPrisma.organizationMember.findFirst.mockResolvedValue({ id: 'member-1' });
    mockPrisma.task.findFirst.mockResolvedValue(makeTask());
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
      expect(result.meta.total).toBe(1);
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
      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({ where: { id: 'proj-1', orgId: 'org-1' } });
    });

    it('rejects creation for a project outside the organization', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      await expect(service.create('org-1', { projectId: 'foreign-project', title: 'New task' }))
        .rejects.toThrow('Project not found');
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it('rejects an assignee who is not an organization member', async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
      await expect(service.create('org-1', {
        projectId: 'proj-1', title: 'New task', assigneeId: 'foreign-user',
      })).rejects.toThrow('Assignee must be a member of this organization');
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('updates task status', async () => {
      mockPrisma.task.update.mockResolvedValue(makeTask({ status: 'in_progress' }));
      await service.updateStatus('org-1', 'proj-1', 'task-1', 'in_progress');
      expect(mockPrisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'task-1' },
        data: { status: 'in_progress' },
      }));
    });
  });

  describe('updateTask', () => {
    it('updates multiple task fields at once', async () => {
      const updated = makeTask({ status: 'done', priority: 'high', sprintId: 'sprint-2' });
      mockPrisma.task.update.mockResolvedValue(updated);

      const result = await service.updateTask('org-1', 'proj-1', 'task-1', {
        status: 'done', priority: 'high', sprintId: 'sprint-2',
      });
      expect(result.status).toBe('done');
      expect(result.priority).toBe('high');
    });

    it('can move task to backlog by setting sprintId=null', async () => {
      mockPrisma.task.update.mockResolvedValue(makeTask({ sprintId: null }));
      await service.updateTask('org-1', 'proj-1', 'task-1', { sprintId: null });
      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sprintId: null }),
        }),
      );
    });

    it('updates title, description, date, and assignee and includes the assigned user', async () => {
      mockPrisma.task.update.mockResolvedValue(makeTask({
        title: 'Updated title',
        description: 'Updated description',
        dueDate: new Date('2026-10-09T00:00:00.000Z'),
        assigneeId: 'member-user',
        assignee: { id: 'member-user', name: 'Member User', avatarUrl: null },
      }));
      await service.updateTask('org-1', 'proj-1', 'task-1', {
        title: 'Updated title',
        description: 'Updated description',
        dueDate: '2026-10-09T00:00:00.000Z',
        assigneeId: 'member-user',
      });
      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 'task-1', orgId: 'org-1', projectId: 'proj-1' },
      });
      expect(mockPrisma.organizationMember.findFirst).toHaveBeenCalledWith({
        where: { orgId: 'org-1', userId: 'member-user' },
        select: { id: true },
      });
      expect(mockPrisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          title: 'Updated title',
          description: 'Updated description',
          dueDate: new Date('2026-10-09T00:00:00.000Z'),
          assigneeId: 'member-user',
        }),
      }));
    });

    it('does not update a task outside the organization and project', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(service.updateTask('org-1', 'proj-1', 'foreign-task', { title: 'Nope' }))
        .rejects.toThrow('Task not found');
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it('rejects assignment to a user outside the organization', async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
      await expect(service.updateTask('org-1', 'proj-1', 'task-1', { assigneeId: 'foreign-user' }))
        .rejects.toThrow('Assignee must be a member of this organization');
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('deletes task using deleteMany (scoped to orgId)', async () => {
      mockPrisma.task.deleteMany.mockResolvedValue({ count: 1 });
      await service.deleteTask('org-1', 'proj-1', 'task-1');
      expect(mockPrisma.task.deleteMany).toHaveBeenCalledWith({
        where: { id: 'task-1', orgId: 'org-1', projectId: 'proj-1' },
      });
    });
  });
});
