import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchResult {
  id: string;
  type: 'lead' | 'contact' | 'account' | 'opportunity' | 'ticket' | 'invoice' | 'project' | 'task';
  title: string;
  subtitle?: string;
  url: string;
  meta?: Record<string, string | number | boolean>;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(orgId: string, query: string, limit = 20): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();
    const take = Math.min(limit, 50);

    const [leads, contacts, accounts, opportunities, tickets, invoices, projects, tasks] =
      await Promise.all([
        this.prisma.lead.findMany({
          where: {
            orgId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { company: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, name: true, email: true, company: true, status: true },
        }),
        this.prisma.contact.findMany({
          where: {
            orgId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, name: true, email: true, title: true },
        }),
        this.prisma.account.findMany({
          where: {
            orgId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { domain: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, name: true, industry: true },
        }),
        this.prisma.opportunity.findMany({
          where: {
            orgId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, name: true, stage: true, amount: true },
        }),
        this.prisma.ticket.findMany({
          where: {
            orgId,
            OR: [
              { subject: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, subject: true, status: true, priority: true },
        }),
        this.prisma.invoice.findMany({
          where: {
            orgId,
            OR: [
              { number: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, number: true, status: true, total: true },
        }),
        this.prisma.project.findMany({
          where: {
            orgId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, name: true, status: true },
        }),
        this.prisma.task.findMany({
          where: {
            orgId,
            OR: [{ title: { contains: q, mode: 'insensitive' } }],
          },
          take,
          select: { id: true, title: true, status: true, priority: true },
        }),
      ]);

    const results: SearchResult[] = [
      ...leads.map((l) => ({
        id: l.id,
        type: 'lead' as const,
        title: l.name,
        subtitle: [l.company, l.email].filter(Boolean).join(' · '),
        url: `/crm/leads?id=${l.id}`,
        meta: { status: l.status },
      })),
      ...contacts.map((c) => ({
        id: c.id,
        type: 'contact' as const,
        title: c.name,
        subtitle: [c.title, c.email].filter(Boolean).join(' · '),
        url: `/crm/contacts?id=${c.id}`,
      })),
      ...accounts.map((a) => ({
        id: a.id,
        type: 'account' as const,
        title: a.name,
        subtitle: a.industry ?? undefined,
        url: `/crm/accounts?id=${a.id}`,
      })),
      ...opportunities.map((o) => ({
        id: o.id,
        type: 'opportunity' as const,
        title: o.name,
        subtitle: `${o.stage} · $${Number(o.amount).toLocaleString()}`,
        url: `/crm/pipeline?id=${o.id}`,
      })),
      ...tickets.map((t) => ({
        id: t.id,
        type: 'ticket' as const,
        title: t.subject,
        subtitle: t.status,
        url: `/helpdesk?id=${t.id}`,
        meta: { priority: t.priority },
      })),
      ...invoices.map((i) => ({
        id: i.id,
        type: 'invoice' as const,
        title: i.number,
        subtitle: `${i.status} · $${Number(i.total).toLocaleString()}`,
        url: `/finance?id=${i.id}`,
      })),
      ...projects.map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        subtitle: p.status,
        url: `/projects?id=${p.id}`,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        subtitle: `${t.status} · ${t.priority}`,
        url: `/projects?taskId=${t.id}`,
      })),
    ];

    // Sort: prioritize exact-match starts in title
    results.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      return aStarts - bStarts;
    });

    return results.slice(0, take);
  }
}
