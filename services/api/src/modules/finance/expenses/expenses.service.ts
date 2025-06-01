import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';
import type { ListExpensesDto } from './dto/list-expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...dto,
        orgId,
        submittedBy: userId,
        date: new Date(dto.date),
      },
    });
  }

  async findAll(orgId: string, query: ListExpensesDto) {
    const { page, limit, status, category, submittedBy, search, from, to } = query;
    const where = {
      orgId,
      ...(status && { status }),
      ...(category && { category }),
      ...(submittedBy && { submittedBy }),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { vendor: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.expense.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id, orgId } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async update(orgId: string, id: string, userId: string, dto: UpdateExpenseDto) {
    const expense = await this.findOne(orgId, id);
    // Only submitter can edit draft/submitted; reviewer can approve/reject
    if (expense.submittedBy !== userId && !['approved', 'rejected', 'reimbursed'].includes(dto.status ?? '')) {
      throw new ForbiddenException('Only the submitter can edit this expense');
    }
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(dto.status && ['approved', 'rejected', 'reimbursed'].includes(dto.status)
          ? { reviewedBy: userId, reviewedAt: new Date() }
          : {}),
      },
    });
  }

  async remove(orgId: string, id: string, userId: string) {
    const expense = await this.findOne(orgId, id);
    if (expense.submittedBy !== userId) {
      throw new ForbiddenException('Only the submitter can delete this expense');
    }
    if (!['draft', 'rejected'].includes(expense.status)) {
      throw new ForbiddenException('Cannot delete a submitted or approved expense');
    }
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Expense deleted' };
  }

  async getSummary(orgId: string) {
    const [all, byCategory, byStatus] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { orgId },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: { orgId, status: { in: ['approved', 'reimbursed'] } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.groupBy({
        by: ['status'],
        where: { orgId },
        _sum: { amount: true },
        _count: true,
      }),
    ]);
    return { total: all, byCategory, byStatus };
  }
}
