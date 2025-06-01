import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1';
const PROJECT_ID = 'proj-1';

const mockProject = {
  id: PROJECT_ID,
  orgId: ORG_ID,
  name: 'Omnivara Platform',
  description: 'Core platform development',
  status: 'active',
  sprints: [],
  tasks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSprint = {
  id: 'sprint-1',
  projectId: PROJECT_ID,
  name: 'Sprint 1',
  goal: 'Launch auth module',
  status: 'active',
  startDate: new Date(),
  endDate: new Date(Date.now() + 14 * 24 * 3600_000),
  tasks: [],
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  project: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  sprint: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ProjectsService);
    jest.clearAllMocks();
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated projects for the org', async () => {
      mockPrisma.project.findMany.mockResolvedValue([mockProject]);
      mockPrisma.project.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('scopes query to orgId', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await service.findAll(ORG_ID);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orgId: ORG_ID } }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns project with sprints and tasks when found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.findOne(ORG_ID, PROJECT_ID);

      expect(result.id).toBe(PROJECT_ID);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findOne(ORG_ID, 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a project scoped to the org', async () => {
      mockPrisma.project.create.mockResolvedValue(mockProject);

      const result = await service.create(ORG_ID, { name: 'Omnivara Platform' });

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: ORG_ID, name: 'Omnivara Platform' }),
        }),
      );
      expect(result.id).toBe(PROJECT_ID);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates the project name', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue({ ...mockProject, name: 'Renamed' });

      const result = await service.update(ORG_ID, PROJECT_ID, { name: 'Renamed' });

      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: PROJECT_ID } }),
      );
      expect(result.name).toBe('Renamed');
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.update(ORG_ID, 'ghost', { name: 'X' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── getSprints ───────────────────────────────────────────────────────────────

  describe('getSprints', () => {
    it('returns sprints for a valid project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.sprint.findMany.mockResolvedValue([mockSprint]);

      const result = await service.getSprints(ORG_ID, PROJECT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sprint 1');
    });

    it('throws NotFoundException when project does not belong to org', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.getSprints(ORG_ID, 'foreign-proj'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── createSprint ─────────────────────────────────────────────────────────────

  describe('createSprint', () => {
    it('creates sprint under a valid project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.sprint.create.mockResolvedValue(mockSprint);

      const result = await service.createSprint(ORG_ID, PROJECT_ID, {
        name: 'Sprint 1',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 3600_000).toISOString(),
      });

      expect(result.id).toBe('sprint-1');
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.createSprint(ORG_ID, 'ghost', {
        name: 'S1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      })).rejects.toThrow(NotFoundException);
    });
  });
});
