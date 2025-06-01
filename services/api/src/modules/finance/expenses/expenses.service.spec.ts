import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  expense: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    count:     jest.fn(),
    findFirst: jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
    aggregate: jest.fn(),
    groupBy:   jest.fn(),
  },
};

function makeExpense(overrides: Record<string, unknown> = {}) {
  return {
    id:          overrides.id          ?? 'exp-1',
    orgId:       overrides.orgId       ?? 'org-1',
    submittedBy: overrides.submittedBy ?? 'user-1',
    title:       overrides.title       ?? 'Team lunch',
    amount:      overrides.amount      ?? 50,
    category:    overrides.category    ?? 'meals',
    status:      overrides.status      ?? 'draft',
    date:        overrides.date        ?? new Date(),
    createdAt:   overrides.createdAt   ?? new Date(),
    ...overrides,
  };
}

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ExpensesService);
  });

  describe('create', () => {
    it('creates expense scoped to org and userId', async () => {
      mockPrisma.expense.create.mockResolvedValue(makeExpense());
      await service.create('org-1', 'user-1', { title: 'Lunch', amount: 50, category: 'meals', date: '2026-05-01' } as any);
      expect(mockPrisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1', submittedBy: 'user-1' }),
        }),
      );
    });

    it('converts date string to Date object', async () => {
      mockPrisma.expense.create.mockResolvedValue(makeExpense());
      await service.create('org-1', 'user-1', { date: '2026-05-01' } as any);
      const call = mockPrisma.expense.create.mock.calls[0]![0] as any;
      expect(call.data.date).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('returns paginated expenses', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([makeExpense()]);
      mockPrisma.expense.count.mockResolvedValue(1);
      const result = await service.findAll('org-1', {} as any);
      expect(result.data).toHaveLength(1);
    });

    it('filters by status', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);
      await service.findAll('org-1', { status: 'approved' } as any);
      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'approved' }),
        }),
      );
    });

    it('applies search filter', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);
      await service.findAll('org-1', { search: 'lunch' } as any);
      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns expense', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(makeExpense());
      const result = await service.findOne('org-1', 'exp-1');
      expect(result.id).toBe('exp-1');
    });

    it('throws NotFoundException for unknown expense', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);
      await expect(service.findOne('org-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('submitter can update their own draft expense', async () => {
      const expense = makeExpense({ submittedBy: 'user-1', status: 'draft' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      mockPrisma.expense.update.mockResolvedValue({ ...expense, title: 'Updated' });
      await service.update('org-1', 'exp-1', 'user-1', { title: 'Updated' } as any);
      expect(mockPrisma.expense.update).toHaveBeenCalled();
    });

    it('throws ForbiddenException when non-submitter tries to edit', async () => {
      const expense = makeExpense({ submittedBy: 'user-1', status: 'draft' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      await expect(
        service.update('org-1', 'exp-1', 'user-2', { title: 'Hack' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('reviewer can approve an expense (status change allowed for non-submitter)', async () => {
      const expense = makeExpense({ submittedBy: 'user-1', status: 'submitted' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      mockPrisma.expense.update.mockResolvedValue({ ...expense, status: 'approved' });
      // Reviewer (user-2) can approve
      await expect(
        service.update('org-1', 'exp-1', 'user-2', { status: 'approved' } as any),
      ).resolves.not.toThrow();
    });

    it('sets reviewedBy and reviewedAt when approving', async () => {
      const expense = makeExpense({ submittedBy: 'user-1' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      mockPrisma.expense.update.mockResolvedValue({ ...expense, status: 'approved' });
      await service.update('org-1', 'exp-1', 'user-2', { status: 'approved' } as any);
      expect(mockPrisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reviewedBy: 'user-2', reviewedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('submitter can delete their own draft expense', async () => {
      const expense = makeExpense({ submittedBy: 'user-1', status: 'draft' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      mockPrisma.expense.delete.mockResolvedValue({});
      const result = await service.remove('org-1', 'exp-1', 'user-1');
      expect(result.message).toBe('Expense deleted');
    });

    it('throws ForbiddenException when non-submitter tries to delete', async () => {
      const expense = makeExpense({ submittedBy: 'user-1', status: 'draft' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      await expect(service.remove('org-1', 'exp-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when expense is submitted (not draft)', async () => {
      const expense = makeExpense({ submittedBy: 'user-1', status: 'submitted' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      await expect(service.remove('org-1', 'exp-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('submitter can delete a rejected expense', async () => {
      const expense = makeExpense({ submittedBy: 'user-1', status: 'rejected' });
      mockPrisma.expense.findFirst.mockResolvedValue(expense);
      mockPrisma.expense.delete.mockResolvedValue({});
      await expect(service.remove('org-1', 'exp-1', 'user-1')).resolves.not.toThrow();
    });
  });

  describe('getSummary', () => {
    it('returns total, byCategory, and byStatus', async () => {
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 500 }, _count: 3 });
      mockPrisma.expense.groupBy.mockResolvedValue([]);

      const result = await service.getSummary('org-1');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byCategory');
      expect(result).toHaveProperty('byStatus');
    });
  });
});
