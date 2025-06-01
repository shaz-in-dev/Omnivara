/**
 * Prisma seed script — populates dev database with realistic demo data.
 * Run: pnpm --filter @omnivara/api db:seed
 */
import { PrismaClient, LeadStatus, OpportunityStage, TaskStatus, TaskPriority, TicketStatus, TicketPriority, TicketChannel, InvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // ── Clean existing data ──────────────────────────────────────────────────────
  await prisma.$executeRaw`TRUNCATE invoice_line_items, invoices, tickets, tasks, sprints, projects, activities, opportunities, leads, contacts, accounts, audit_logs, refresh_tokens, organization_members, roles, teams, users, organizations CASCADE`;

  // ── Organization ─────────────────────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      planId: 'growth',
    },
  });
  console.log(`  ✓ Organization: ${org.name} (${org.id})`);

  // ── Roles ─────────────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.create({
    data: {
      orgId: org.id,
      name: 'Admin',
      permissions: ['*'],
      isSystem: true,
    },
  });
  const memberRole = await prisma.role.create({
    data: {
      orgId: org.id,
      name: 'Member',
      permissions: ['crm:read', 'crm:write', 'projects:read', 'projects:write', 'helpdesk:read', 'helpdesk:write'],
      isSystem: true,
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      passwordHash,
      name: 'Alex Admin',
      orgs: {
        create: { orgId: org.id, roleId: adminRole.id },
      },
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sarah@acme.com',
      passwordHash,
      name: 'Sarah Sales',
      orgs: {
        create: { orgId: org.id, roleId: memberRole.id },
      },
    },
  });

  const supportUser = await prisma.user.create({
    data: {
      email: 'support@acme.com',
      passwordHash,
      name: 'Mike Support',
      orgs: {
        create: { orgId: org.id, roleId: memberRole.id },
      },
    },
  });
  console.log(`  ✓ Users: ${adminUser.email}, ${salesUser.email}, ${supportUser.email}`);

  // ── Accounts ──────────────────────────────────────────────────────────────────
  const accounts = await Promise.all([
    prisma.account.create({ data: { orgId: org.id, name: 'TechCorp Inc', industry: 'Technology', employeeCount: 300, website: 'https://techcorp.io', annualRevenue: 5_000_000, ownerId: salesUser.id } }),
    prisma.account.create({ data: { orgId: org.id, name: 'Global Logistics Ltd', industry: 'Logistics', employeeCount: 750, website: 'https://globallogistics.com', annualRevenue: 25_000_000, ownerId: salesUser.id } }),
    prisma.account.create({ data: { orgId: org.id, name: 'Startup XYZ', industry: 'SaaS', employeeCount: 8, website: 'https://startupxyz.co', annualRevenue: 200_000, ownerId: adminUser.id } }),
  ]);
  console.log(`  ✓ Accounts: ${accounts.length}`);

  // ── Contacts ──────────────────────────────────────────────────────────────────
  // Contact model: name (single field), title (not jobTitle), no firstName/lastName
  const contacts = await Promise.all([
    prisma.contact.create({ data: { orgId: org.id, name: 'Emma Thompson', email: 'emma@techcorp.io', title: 'VP Engineering', accountId: accounts[0].id, ownerId: salesUser.id } }),
    prisma.contact.create({ data: { orgId: org.id, name: 'James Wilson', email: 'j.wilson@globallogistics.com', title: 'COO', accountId: accounts[1].id, ownerId: salesUser.id } }),
    prisma.contact.create({ data: { orgId: org.id, name: 'Priya Sharma', email: 'priya@startupxyz.co', title: 'Founder', accountId: accounts[2].id, ownerId: adminUser.id } }),
    prisma.contact.create({ data: { orgId: org.id, name: 'Carlos Rivera', email: 'carlos.r@example.com', title: 'Director of Operations', ownerId: salesUser.id } }),
  ]);
  console.log(`  ✓ Contacts: ${contacts.length}`);

  // ── Leads ────────────────────────────────────────────────────────────────────
  // Lead model: name (single field), all enums lowercase
  const leadData = [
    { name: 'Alice Cooper', email: 'alice@fintech.com', company: 'FinTech Solutions', status: LeadStatus.new, source: 'LinkedIn' },
    { name: 'Bob Martinez', email: 'bob@retail.com', company: 'Retail Giant', status: LeadStatus.contacted, source: 'Website' },
    { name: 'Chen Wei', email: 'chen@cloudco.io', company: 'CloudCo', status: LeadStatus.qualified, source: 'Referral' },
    { name: 'Diana Prince', email: 'diana@medtech.com', company: 'MedTech Pro', status: LeadStatus.new, source: 'Event' },
    { name: 'Ethan Hunt', email: 'ethan@agency.com', company: 'Creative Agency', status: LeadStatus.disqualified, source: 'Cold Outreach' },
    { name: 'Fiona Green', email: 'fiona@consulting.com', company: 'Strategy Plus', status: LeadStatus.qualified, source: 'Website' },
  ];
  await prisma.lead.createMany({
    data: leadData.map((l) => ({ orgId: org.id, ownerId: salesUser.id, ...l })),
  });
  console.log(`  ✓ Leads: ${leadData.length}`);

  // ── Opportunities ─────────────────────────────────────────────────────────────
  // All OpportunityStage values are lowercase
  const oppData = [
    { name: 'TechCorp Enterprise License', stage: OpportunityStage.proposal, amount: 84_000, probability: 65, contactId: contacts[0]!.id, accountId: accounts[0]!.id },
    { name: 'Global Logistics Platform', stage: OpportunityStage.negotiation, amount: 240_000, probability: 80, contactId: contacts[1]!.id, accountId: accounts[1]!.id },
    { name: 'Startup XYZ Starter Plan', stage: OpportunityStage.qualification, amount: 9_600, probability: 40, contactId: contacts[2]!.id, accountId: accounts[2]!.id },
    { name: 'FinTech Pilot Project', stage: OpportunityStage.prospecting, amount: 24_000, probability: 20 },
    { name: 'CloudCo Scale Plan', stage: OpportunityStage.closed_won, amount: 48_000, probability: 100 },
    { name: 'Agency Retainer', stage: OpportunityStage.closed_lost, amount: 18_000, probability: 0 },
  ];
  await prisma.opportunity.createMany({
    data: oppData.map((o) => ({ orgId: org.id, ownerId: salesUser.id, expectedCloseDate: new Date(Date.now() + 30 * 86_400_000), ...o })),
  });
  console.log(`  ✓ Opportunities: ${oppData.length}`);

  // ── Project + Sprints + Tasks ─────────────────────────────────────────────────
  // Project.status is a String field, default 'active' (lowercase)
  const project = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Omnivara Platform v1',
      description: 'Build the core platform modules',
      status: 'active',
      ownerId: adminUser.id,
    },
  });

  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 3',
      goal: 'Complete CRM UI and auth flow',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 86_400_000),
      status: 'active',
    },
  });

  await prisma.task.createMany({
    data: [
      { projectId: project.id, sprintId: sprint.id, orgId: org.id, title: 'Implement login page with JWT', status: TaskStatus.done, priority: TaskPriority.high, assigneeId: adminUser.id },
      { projectId: project.id, sprintId: sprint.id, orgId: org.id, title: 'CRM Pipeline kanban board', status: TaskStatus.in_review, priority: TaskPriority.high, assigneeId: salesUser.id },
      { projectId: project.id, sprintId: sprint.id, orgId: org.id, title: 'Command palette (⌘K)', status: TaskStatus.in_progress, priority: TaskPriority.medium, assigneeId: adminUser.id, dueDate: new Date(Date.now() + 3 * 86_400_000) },
      { projectId: project.id, sprintId: sprint.id, orgId: org.id, title: 'Notification WebSocket gateway', status: TaskStatus.todo, priority: TaskPriority.medium, assigneeId: adminUser.id },
      { projectId: project.id, sprintId: sprint.id, orgId: org.id, title: 'Write E2E tests for auth flow', status: TaskStatus.todo, priority: TaskPriority.low, dueDate: new Date(Date.now() - 2 * 86_400_000) },
    ],
  });
  console.log(`  ✓ Project + Sprint + Tasks`);

  // ── Helpdesk Tickets ──────────────────────────────────────────────────────────
  // All TicketStatus values are lowercase; IN_PROGRESS → pending, WAITING → on_hold
  const resolvedAt = new Date(Date.now() - 3 * 3_600_000); // 3 hours ago
  await prisma.ticket.createMany({
    data: [
      { orgId: org.id, subject: 'Cannot log in — says invalid credentials', status: TicketStatus.open, priority: TicketPriority.high, channel: TicketChannel.email, contactId: contacts[0].id, assigneeId: supportUser.id, slaBreachAt: new Date(Date.now() + 2 * 3_600_000) },
      { orgId: org.id, subject: 'Dashboard loads slowly', status: TicketStatus.pending, priority: TicketPriority.medium, channel: TicketChannel.chat, contactId: contacts[1].id, assigneeId: supportUser.id },
      { orgId: org.id, subject: 'Invoice PDF not generating', status: TicketStatus.on_hold, priority: TicketPriority.urgent, channel: TicketChannel.portal, contactId: contacts[2].id },
      { orgId: org.id, subject: 'Feature request: bulk import leads', status: TicketStatus.open, priority: TicketPriority.low, channel: TicketChannel.email },
      { orgId: org.id, subject: 'API rate limit hit unexpectedly', status: TicketStatus.resolved, priority: TicketPriority.high, channel: TicketChannel.api, resolvedAt },
    ],
  });
  console.log(`  ✓ Tickets: 5`);

  // ── Invoices ──────────────────────────────────────────────────────────────────
  // Invoice: no contactId, no issueDate, taxAmount (not tax), lineItem amount (not total)
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        orgId: org.id,
        number: 'INV-001',
        status: InvoiceStatus.paid,
        accountId: accounts[0].id,
        dueDate: new Date(Date.now() - 15 * 86_400_000),
        paidAt: new Date(Date.now() - 14 * 86_400_000),
        currency: 'USD',
        subtotal: 12_000,
        taxAmount: 1_440,
        total: 13_440,
        lineItems: {
          create: [
            { description: 'Platform license (monthly)', quantity: 1, unitPrice: 12_000, amount: 12_000 },
          ],
        },
      },
    }),
    prisma.invoice.create({
      data: {
        orgId: org.id,
        number: 'INV-002',
        status: InvoiceStatus.sent,
        accountId: accounts[1].id,
        dueDate: new Date(Date.now() + 20 * 86_400_000),
        currency: 'USD',
        subtotal: 48_000,
        taxAmount: 5_760,
        total: 53_760,
        lineItems: {
          create: [
            { description: 'Enterprise onboarding', quantity: 1, unitPrice: 8_000, amount: 8_000 },
            { description: 'Annual platform license', quantity: 1, unitPrice: 40_000, amount: 40_000 },
          ],
        },
      },
    }),
    prisma.invoice.create({
      data: {
        orgId: org.id,
        number: 'INV-003',
        status: InvoiceStatus.overdue,
        accountId: accounts[2].id,
        dueDate: new Date(Date.now() - 15 * 86_400_000),
        currency: 'USD',
        subtotal: 2_400,
        taxAmount: 288,
        total: 2_688,
        lineItems: {
          create: [
            { description: 'Starter plan (3 months)', quantity: 3, unitPrice: 800, amount: 2_400 },
          ],
        },
      },
    }),
  ]);
  console.log(`  ✓ Invoices: ${invoices.length}`);

  console.log('\n✅ Seed complete!');
  console.log('\n📧 Demo credentials:');
  console.log('   Admin:   admin@acme.com  / Password123!');
  console.log('   Sales:   sarah@acme.com  / Password123!');
  console.log('   Support: support@acme.com / Password123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
