import {
  Controller, Get, Param, Res, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import archiver from 'archiver';

/**
 * GDPR / Data Export controller.
 * Allows org admins to export their data as CSV (per-entity) or as a full ZIP.
 */
@ApiTags('Data Export')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/export')
export class ExportController {
  constructor(private readonly prisma: PrismaService) {}

  /* ── Leads CSV ──────────────────────────────────────────────────────────── */

  @Get('leads')
  @ApiOperation({ summary: 'Export leads as CSV' })
  async exportLeads(@Param('orgId') orgId: string, @Res() res: Response) {
    const rows = await this.prisma.lead.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true, company: true,
        title: true, status: true, source: true,
        createdAt: true, updatedAt: true,
      },
    });

    const csv = toCsv(
      ['id','name','email','phone','company','title','status','source','createdAt','updatedAt'],
      rows.map((r) => [r.id, r.name, r.email??'', r.phone??'', r.company??'', r.title??'', r.status, r.source??'', r.createdAt.toISOString(), r.updatedAt.toISOString()]),
    );

    sendCsv(res, csv, 'leads');
  }

  /* ── Contacts CSV ───────────────────────────────────────────────────────── */

  @Get('contacts')
  @ApiOperation({ summary: 'Export contacts as CSV' })
  async exportContacts(@Param('orgId') orgId: string, @Res() res: Response) {
    const rows = await this.prisma.contact.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true,
        phone: true, title: true, department: true,
        createdAt: true, updatedAt: true,
      },
    });

    const csv = toCsv(
      ['id','name','email','phone','title','department','createdAt','updatedAt'],
      rows.map((r) => [r.id, r.name, r.email??'', r.phone??'', r.title??'', r.department??'', r.createdAt.toISOString(), r.updatedAt.toISOString()]),
    );

    sendCsv(res, csv, 'contacts');
  }

  /* ── Invoices CSV ───────────────────────────────────────────────────────── */

  @Get('invoices')
  @ApiOperation({ summary: 'Export invoices as CSV' })
  async exportInvoices(@Param('orgId') orgId: string, @Res() res: Response) {
    const rows = await this.prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, number: true, status: true, total: true,
        currency: true, dueDate: true, paidAt: true,
        createdAt: true, updatedAt: true,
        account: { select: { name: true } },
      },
    });

    const csv = toCsv(
      ['id','number','status','total','currency','dueDate','paidAt','account','createdAt'],
      rows.map((r) => [
        r.id, r.number, r.status, String(r.total), r.currency,
        r.dueDate?.toISOString() ?? '', r.paidAt?.toISOString() ?? '',
        r.account?.name ?? '',
        r.createdAt.toISOString(),
      ]),
    );

    sendCsv(res, csv, 'invoices');
  }

  /* ── Full ZIP export ────────────────────────────────────────────────────── */

  @Get('full')
  @ApiOperation({ summary: 'Export all org data as a ZIP archive (GDPR)' })
  async exportFull(@Param('orgId') orgId: string, @Res() res: Response) {
    // Gather all data in parallel
    const [leads, contacts, invoices, employees, projects, tickets] = await Promise.all([
      this.prisma.lead.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.contact.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.invoice.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, include: { account: true } }),
      this.prisma.employee.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.project.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.ticket.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }),
    ]);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="omnivara-export-${new Date().toISOString().slice(0,10)}.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    // Leads
    archive.append(toCsv(
      ['id','name','email','phone','company','status','source','createdAt'],
      leads.map((r) => [r.id,r.name,r.email??'',r.phone??'',r.company??'',r.status,r.source??'',r.createdAt.toISOString()]),
    ), { name: 'leads.csv' });

    // Contacts
    archive.append(toCsv(
      ['id','name','email','phone','title','department','createdAt'],
      contacts.map((r) => [r.id,r.name,r.email??'',r.phone??'',r.title??'',r.department??'',r.createdAt.toISOString()]),
    ), { name: 'contacts.csv' });

    // Invoices
    archive.append(toCsv(
      ['id','number','status','total','currency','dueDate','paidAt','account','createdAt'],
      invoices.map((r) => [r.id,r.number,r.status,String(r.total),r.currency,r.dueDate?.toISOString()??'',r.paidAt?.toISOString()??'',r.account?.name??'',r.createdAt.toISOString()]),
    ), { name: 'invoices.csv' });

    // Employees
    archive.append(toCsv(
      ['id','firstName','lastName','email','jobTitle','department','status','startDate','createdAt'],
      employees.map((r) => [r.id,r.firstName,r.lastName,r.email??'',r.jobTitle,r.department,r.status,r.startDate.toISOString(),r.createdAt.toISOString()]),
    ), { name: 'employees.csv' });

    // Projects
    archive.append(toCsv(
      ['id','name','status','startDate','endDate','createdAt'],
      projects.map((r) => [r.id,r.name,r.status,r.startDate?.toISOString()??'',r.endDate?.toISOString()??'',r.createdAt.toISOString()]),
    ), { name: 'projects.csv' });

    // Tickets
    archive.append(toCsv(
      ['id','subject','status','priority','channel','createdAt'],
      tickets.map((r) => [r.id,r.subject,r.status,r.priority,r.channel,r.createdAt.toISOString()]),
    ), { name: 'tickets.csv' });

    await archive.finalize();
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function escapeCsvCell(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function toCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\n');
}

function sendCsv(res: Response, csv: string, name: string) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0,10)}.csv"`);
  res.status(200).send(csv);
}
