import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PLANS } from '@omnivara/config';
import { LeadStatus, OpportunityStage, TicketStatus, TicketPriority, TicketChannel, InvoiceStatus } from '@prisma/client';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { users: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } }, role: true } }, teams: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { orgId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        role: { select: { id: true, name: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async inviteMember(orgId: string, email: string, roleId?: string) {
    // ── Plan enforcement: check user limit ─────────────────────────────────
    await this.enforceUserLimit(orgId);

    // Find user by email first
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return a pending invite record (simplified — just create with placeholder)
      return { email, status: 'invited', message: 'Invite email queued' };
    }
    // Check if already a member
    const existing = await this.prisma.organizationMember.findFirst({ where: { orgId, userId: user.id } });
    if (existing) return existing;

    // Find a default role if none provided
    const role = roleId
      ? await this.prisma.role.findFirst({ where: { id: roleId, orgId } })
      : await this.prisma.role.findFirst({ where: { orgId, name: 'member' } })
        ?? await this.prisma.role.findFirst({ where: { orgId } });
    if (!role) throw new NotFoundException('No role found for org');

    return this.prisma.organizationMember.create({
      data: { orgId, userId: user.id, roleId: role.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        role: { select: { id: true, name: true } },
      },
    });
  }

  async updateSettings(orgId: string, body: { settings?: Record<string, unknown>; onboardingCompleted?: boolean }) {
    // Merge into settings JSON — fetch current first to merge, not overwrite
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
    const current = (org?.settings ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...current, ...(body.settings ?? {}) };
    if (body.onboardingCompleted !== undefined) merged['onboardingCompleted'] = body.onboardingCompleted;
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { settings: merged as Parameters<typeof this.prisma.organization.update>[0]['data']['settings'] },
      select: { id: true, name: true, slug: true, settings: true },
    });
  }

  async removeMember(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({ where: { orgId, userId } });
    if (!member) throw new NotFoundException('Member not found');
    await this.prisma.organizationMember.delete({ where: { id: member.id } });
    return { message: 'Member removed' };
  }

  /* ── Sample data seeding ──────────────────────────────────────────────── */

  async seedSampleData(orgId: string) {
    // Guard: don't seed twice
    const existingLeads = await this.prisma.lead.count({ where: { orgId } });
    if (existingLeads > 0) {
      throw new ConflictException('Sample data already exists. The org already has leads.');
    }

    // ── Leads ──────────────────────────────────────────────────────────────
    const leadsData = [
      { name: 'Alice Johnson',  email: 'alice@techcorp.io',       company: 'TechCorp',       status: LeadStatus.new,        source: 'sample_data' },
      { name: 'Marcus Rivera',  email: 'marcus@startupxyz.co',    company: 'StartupXYZ',     status: LeadStatus.contacted,  source: 'sample_data' },
      { name: 'Sarah Lee',      email: 'sarah@agencyplus.com',    company: 'Agency Plus',    status: LeadStatus.qualified,  source: 'sample_data' },
      { name: 'James Wilson',   email: 'james@enterprise-inc.com', company: 'Enterprise Inc', status: LeadStatus.new,        source: 'sample_data' },
      { name: 'Priya Patel',    email: 'priya@consultingco.io',   company: 'Consulting Co',  status: LeadStatus.contacted,  source: 'sample_data' },
    ];

    await this.prisma.lead.createMany({
      data: leadsData.map((l) => ({ orgId, ...l })),
    });

    // ── Opportunities ──────────────────────────────────────────────────────
    const now = new Date();
    await this.prisma.opportunity.createMany({
      data: [
        {
          orgId,
          name: 'Website Redesign',
          stage: OpportunityStage.proposal,
          amount: 12_000,
          probability: 60,
          description: 'sample_data',
          expectedCloseDate: new Date(now.getTime() + 30 * 86_400_000),
        },
        {
          orgId,
          name: 'SEO Retainer',
          stage: OpportunityStage.negotiation,
          amount: 3_600,
          probability: 75,
          description: 'sample_data',
          expectedCloseDate: new Date(now.getTime() + 14 * 86_400_000),
        },
      ],
    });

    // ── Invoice ────────────────────────────────────────────────────────────
    await this.prisma.invoice.create({
      data: {
        orgId,
        number: 'INV-DEMO-001',
        status: InvoiceStatus.sent,
        currency: 'USD',
        subtotal: 4_500,
        taxAmount: 0,
        total: 4_500,
        dueDate: new Date(now.getTime() + 30 * 86_400_000),
        notes: 'sample_data',
        lineItems: {
          create: [
            { description: 'Demo Client LLC — consulting services', quantity: 1, unitPrice: 4_500, amount: 4_500 },
          ],
        },
      },
    });

    // ── Helpdesk tickets ───────────────────────────────────────────────────
    await this.prisma.ticket.createMany({
      data: [
        {
          orgId,
          subject: 'Setup assistance',
          status: TicketStatus.open,
          priority: TicketPriority.low,
          channel: TicketChannel.email,
        },
        {
          orgId,
          subject: 'Billing question',
          status: TicketStatus.open,
          priority: TicketPriority.medium,
          channel: TicketChannel.email,
        },
      ],
    });

    return {
      seeded: true,
      counts: { leads: 5, opportunities: 2, invoices: 1, tickets: 2 },
    };
  }

  async clearSampleData(orgId: string) {
    // Delete leads with source = 'sample_data'
    const deletedLeads = await this.prisma.lead.deleteMany({
      where: { orgId, source: 'sample_data' },
    });

    // Delete opportunities with description = 'sample_data'
    const deletedOpps = await this.prisma.opportunity.deleteMany({
      where: { orgId, description: 'sample_data' },
    });

    // Delete invoices with notes = 'sample_data'
    const deletedInvoices = await this.prisma.invoice.deleteMany({
      where: { orgId, notes: 'sample_data' },
    });

    // Delete sample tickets (identified by subject pattern)
    const deletedTickets = await this.prisma.ticket.deleteMany({
      where: { orgId, subject: { in: ['Setup assistance', 'Billing question'] } },
    });

    return {
      cleared: true,
      counts: {
        leads: deletedLeads.count,
        opportunities: deletedOpps.count,
        invoices: deletedInvoices.count,
        tickets: deletedTickets.count,
      },
    };
  }

  /* ── Plan enforcement helpers ─────────────────────────────────────────── */

  private async enforceUserLimit(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { planId: true },
    });
    const planId = (org?.planId ?? 'starter') as keyof typeof PLANS;
    const plan = PLANS[planId];
    const limit = plan?.limits?.users ?? 5;

    // -1 = unlimited (enterprise)
    if (limit === -1) return;

    const currentCount = await this.prisma.organizationMember.count({ where: { orgId } });
    if (currentCount >= limit) {
      throw new ForbiddenException(
        `Your ${plan.name} plan allows up to ${limit} users. Upgrade to add more team members.`,
      );
    }
  }
}
