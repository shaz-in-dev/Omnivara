import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  employee: {
    findMany:  jest.fn(),
    count:     jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  leaveRequest: {
    findMany:  jest.fn(),
    create:    jest.fn(),
    findFirst: jest.fn(),
    update:    jest.fn(),
  },
};

function makeEmployee(overrides: Record<string, unknown> = {}) {
  return {
    id:         overrides.id         ?? 'emp-1',
    orgId:      overrides.orgId      ?? 'org-1',
    firstName:  overrides.firstName  ?? 'Alice',
    lastName:   overrides.lastName   ?? 'Smith',
    email:      overrides.email      ?? 'alice@example.com',
    jobTitle:   overrides.jobTitle   ?? 'Engineer',
    department: overrides.department ?? 'Engineering',
    status:     overrides.status     ?? 'active',
    startDate:  overrides.startDate  ?? new Date('2024-01-01'),
    createdAt:  overrides.createdAt  ?? new Date(),
    ...overrides,
  };
}

function makeLeaveRequest(overrides: Record<string, unknown> = {}) {
  return {
    id:         overrides.id         ?? 'lr-1',
    orgId:      overrides.orgId      ?? 'org-1',
    employeeId: overrides.employeeId ?? 'emp-1',
    type:       overrides.type       ?? 'annual',
    startDate:  overrides.startDate  ?? new Date(),
    endDate:    overrides.endDate    ?? new Date(),
    days:       overrides.days       ?? 5,
    status:     overrides.status     ?? 'pending',
    ...overrides,
  };
}

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(EmployeesService);
  });

  describe('findAll', () => {
    it('returns paginated employees', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([makeEmployee()]);
      mockPrisma.employee.count.mockResolvedValue(1);
      const result = await service.findAll('org-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by department', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.employee.count.mockResolvedValue(0);
      await service.findAll('org-1', 1, 50, 'Engineering');
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ department: 'Engineering' }),
        }),
      );
    });

    it('filters by status', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.employee.count.mockResolvedValue(0);
      await service.findAll('org-1', 1, 50, undefined, 'active');
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns employee with manager and reports', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(makeEmployee());
      const result = await service.findOne('org-1', 'emp-1');
      expect(result.id).toBe('emp-1');
    });

    it('throws NotFoundException for unknown employee', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      await expect(service.findOne('org-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates employee', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null); // no duplicate
      mockPrisma.employee.create.mockResolvedValue(makeEmployee());
      const result = await service.create('org-1', {
        firstName: 'Alice', lastName: 'Smith', email: 'alice@x.com',
        jobTitle: 'Dev', department: 'Eng', startDate: '2024-01-01',
      } as any);
      expect(result.email).toBe('alice@example.com');
    });

    it('throws ConflictException when email already exists in org', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(makeEmployee());
      await expect(
        service.create('org-1', { email: 'alice@example.com' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('converts startDate string to Date object', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      mockPrisma.employee.create.mockResolvedValue(makeEmployee());
      await service.create('org-1', { email: 'new@x.com', startDate: '2024-06-01' } as any);
      const createCall = mockPrisma.employee.create.mock.calls[0]![0] as any;
      expect(createCall.data.startDate).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('updates employee fields', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(makeEmployee());
      mockPrisma.employee.update.mockResolvedValue(makeEmployee({ jobTitle: 'Senior Engineer' }));
      const result = await service.update('org-1', 'emp-1', { jobTitle: 'Senior Engineer' } as any);
      expect(result.jobTitle).toBe('Senior Engineer');
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      await expect(service.update('org-1', 'bad', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes employee', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(makeEmployee());
      mockPrisma.employee.delete.mockResolvedValue({});
      await service.remove('org-1', 'emp-1');
      expect(mockPrisma.employee.delete).toHaveBeenCalledWith({ where: { id: 'emp-1' } });
    });
  });

  describe('getLeaveRequests', () => {
    it('returns leave requests for org', async () => {
      mockPrisma.leaveRequest.findMany.mockResolvedValue([makeLeaveRequest()]);
      const result = await service.getLeaveRequests('org-1');
      expect(result).toHaveLength(1);
    });

    it('filters by employeeId', async () => {
      mockPrisma.leaveRequest.findMany.mockResolvedValue([]);
      await service.getLeaveRequests('org-1', 'emp-1');
      expect(mockPrisma.leaveRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ employeeId: 'emp-1' }),
        }),
      );
    });
  });

  describe('createLeaveRequest', () => {
    it('creates leave request', async () => {
      mockPrisma.leaveRequest.create.mockResolvedValue(makeLeaveRequest());
      const result = await service.createLeaveRequest('org-1', 'emp-1', {
        type: 'annual', startDate: '2026-07-01', endDate: '2026-07-05', days: 5,
      });
      expect(mockPrisma.leaveRequest.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('reviewLeaveRequest', () => {
    it('approves a leave request', async () => {
      mockPrisma.leaveRequest.findFirst.mockResolvedValue(makeLeaveRequest());
      mockPrisma.leaveRequest.update.mockResolvedValue(makeLeaveRequest({ status: 'approved' }));
      const result = await service.reviewLeaveRequest('org-1', 'lr-1', 'approved', 'manager-1');
      expect(mockPrisma.leaveRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved', reviewedBy: 'manager-1' }),
        }),
      );
    });

    it('throws NotFoundException for unknown leave request', async () => {
      mockPrisma.leaveRequest.findFirst.mockResolvedValue(null);
      await expect(service.reviewLeaveRequest('org-1', 'bad', 'approved', 'mgr')).rejects.toThrow(NotFoundException);
    });
  });
});
