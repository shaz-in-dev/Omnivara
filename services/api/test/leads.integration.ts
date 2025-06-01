/**
 * Integration tests for CRM leads CRUD — real database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Leads CRUD (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let orgId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
    prisma = module.get(PrismaService);

    // Register a test org + user
    const email = `leads_${Date.now()}@integration-test.dev`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Leads Tester', email, password: 'Password123!', orgName: 'Leads Corp' });

    const body = res.body.data ?? res.body;
    accessToken = body.accessToken;
    orgId = body.user?.orgId ?? body.user?.orgs?.[0]?.orgId;
  });

  afterAll(async () => {
    // Clean up
    if (orgId) {
      await prisma.lead.deleteMany({ where: { orgId } });
      await prisma.organizationMember.deleteMany({ where: { orgId } });
      await prisma.organization.deleteMany({ where: { id: orgId } });
    }
    await prisma.user.deleteMany({ where: { email: { contains: '@integration-test.dev' } } });
    await app.close();
  });

  describe('POST /api/v1/orgs/:orgId/crm/leads', () => {
    it('201 — creates a lead', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orgs/${orgId}/crm/leads`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Lead', email: 'lead@example.com', company: 'Test Co' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Test Lead', orgId });
    });

    it('400 — rejects lead without name', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orgs/${orgId}/crm/leads`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'noname@example.com' });
      expect(res.status).toBe(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orgs/${orgId}/crm/leads`)
        .send({ name: 'Unauth Lead' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/orgs/:orgId/crm/leads', () => {
    it('200 — returns paginated leads for the org', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orgs/${orgId}/crm/leads`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data:  expect.any(Array),
        total: expect.any(Number),
        page:  1,
      });
    });

    it('200 — supports search query', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orgs/${orgId}/crm/leads?search=Test`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      // All returned leads should contain "Test" in name or email
      for (const lead of res.body.data as { name: string }[]) {
        expect(lead.name.toLowerCase()).toContain('test');
      }
    });

    it('403 — denies access to another org\'s leads', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orgs/other-org-id/crm/leads`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/orgs/:orgId/crm/leads/:id', () => {
    let leadId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orgs/${orgId}/crm/leads`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Patch Target', email: 'patch@example.com' });
      leadId = res.body.id;
    });

    it('200 — updates lead status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orgs/${orgId}/crm/leads/${leadId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'contacted' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('contacted');
    });

    it('404 — returns 404 for unknown lead id', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orgs/${orgId}/crm/leads/nonexistent-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'contacted' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/orgs/:orgId/crm/leads/:id', () => {
    let leadId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/orgs/${orgId}/crm/leads`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Delete Target' });
      leadId = res.body.id;
    });

    it('200 — deletes the lead', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/orgs/${orgId}/crm/leads/${leadId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
    });

    it('404 — second delete returns 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/orgs/${orgId}/crm/leads/${leadId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(404);
    });
  });
});
