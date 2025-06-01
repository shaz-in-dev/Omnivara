import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuditEvent } from '../../common/interceptors/audit.interceptor';

export interface AuditLogFilters {
  userId?:    string;
  action?:    string;
  dateFrom?:  Date;
  dateTo?:    Date;
  page?:      number;
  limit?:     number;
}

/**
 * Listens to 'audit.log' events emitted by AuditInterceptor
 * and persists them to the audit_logs table.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Called asynchronously after every mutating HTTP request */
  @OnEvent('audit.log')
  async handleAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          orgId:        event.orgId,
          userId:       event.userId,
          action:       event.action,
          resourceType: event.resourceType,
          resourceId:   event.resourceId,
          ipAddress:    event.ipAddress,
          userAgent:    event.userAgent,
        },
      });
    } catch {
      // Non-fatal — never crash the request pipeline
    }
  }

  async findAll(orgId: string, filters: AuditLogFilters) {
    const { userId, action, dateFrom, dateTo, page = 1, limit = 50 } = filters;
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;

    const where = {
      orgId,
      ...(userId && { userId }),
      ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
      ...(dateFrom || dateTo
        ? { createdAt: { ...(dateFrom && { gte: dateFrom }), ...(dateTo && { lte: dateTo }) } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id:           true,
          action:       true,
          resourceType: true,
          resourceId:   true,
          ipAddress:    true,
          userAgent:    true,
          createdAt:    true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit: take, pages: Math.ceil(total / take) },
    };
  }

  /** Export all audit logs for an org as CSV rows */
  async exportCsv(orgId: string, filters: Omit<AuditLogFilters, 'page' | 'limit'>): Promise<string> {
    const { userId, action, dateFrom, dateTo } = filters;

    const rows = await this.prisma.auditLog.findMany({
      where: {
        orgId,
        ...(userId && { userId }),
        ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
        ...(dateFrom || dateTo
          ? { createdAt: { ...(dateFrom && { gte: dateFrom }), ...(dateTo && { lte: dateTo }) } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
      select: {
        id: true, action: true, resourceType: true, resourceId: true,
        ipAddress: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    const header = 'id,timestamp,action,resourceType,resourceId,userName,userEmail,ipAddress\n';
    const csvRows = rows.map((r) => [
      r.id,
      r.createdAt.toISOString(),
      `"${r.action}"`,
      r.resourceType ?? '',
      r.resourceId ?? '',
      `"${r.user?.name ?? ''}"`,
      r.user?.email ?? '',
      r.ipAddress ?? '',
    ].join(','));

    return header + csvRows.join('\n');
  }
}
