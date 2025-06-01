import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page = 1, limit = 50, department?: string, status?: string) {
    const where = {
      orgId,
      ...(department && { department }),
      ...(status && { status: status as any }),
    };
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          manager: { select: { id: true, firstName: true, lastName: true } },
          leaveRequests: {
            where: { status: 'pending' },
            select: { id: true },
          },
        },
        orderBy: [{ department: 'asc' }, { firstName: 'asc' }],
        ...paginate(page, limit),
      }),
      this.prisma.employee.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, orgId },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        reports: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(orgId: string, dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({ where: { orgId, email: dto.email } });
    if (existing) throw new ConflictException('An employee with this email already exists');
    return this.prisma.employee.create({
      data: {
        orgId,
        ...dto,
        startDate: new Date(dto.startDate),
      },
    });
  }

  async update(orgId: string, id: string, dto: Partial<CreateEmployeeDto>) {
    await this.findOne(orgId, id);
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      },
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.employee.delete({ where: { id } });
  }

  // ── Leave requests ────────────────────────────────────────

  async getLeaveRequests(orgId: string, employeeId?: string, status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        orgId,
        ...(employeeId && { employeeId }),
        ...(status && { status: status as any }),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveRequest(orgId: string, employeeId: string, dto: {
    type: string; startDate: string; endDate: string; days: number; reason?: string;
  }) {
    return this.prisma.leaveRequest.create({
      data: {
        orgId,
        employeeId,
        type: dto.type as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        days: dto.days,
        reason: dto.reason,
      },
    });
  }

  async reviewLeaveRequest(orgId: string, requestId: string, action: 'approved' | 'denied', reviewedBy: string) {
    const req = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, orgId } });
    if (!req) throw new NotFoundException('Leave request not found');
    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: action, reviewedBy, reviewedAt: new Date() },
    });
  }
}
