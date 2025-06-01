/**
 * Integration tests for auth flow — runs against a real PostgreSQL database.
 * Requires DATABASE_URL to be set to a test database.
 *
 * Run: pnpm test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // Clean up test users after all tests
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@integration-test.dev' } },
    });
  });

  // ── Register ────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('201 — creates user + org and returns tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name:     'Integration Test User',
          email:    `user_${Date.now()}@integration-test.dev`,
          password: 'Password123!',
          orgName:  'Integration Corp',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        accessToken:  expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: expect.stringContaining('@integration-test.dev'),
        }),
      });
    });

    it('409 — rejects duplicate email', async () => {
      const email = `dup_${Date.now()}@integration-test.dev`;
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'First', email, password: 'Password123!', orgName: 'Corp A' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'Second', email, password: 'Password123!', orgName: 'Corp B' });

      expect(res.status).toBe(409);
    });

    it('400 — rejects weak password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name:    'Weak Pwd',
          email:   `weak_${Date.now()}@integration-test.dev`,
          password: '123',
          orgName: 'Corp',
        });
      expect(res.status).toBe(400);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    const email = `login_${Date.now()}@integration-test.dev`;
    const password = 'Password123!';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'Login User', email, password, orgName: 'Login Corp' });
    });

    it('200 — returns tokens for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('401 — rejects wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword123!' });
      expect(res.status).toBe(401);
    });

    it('401 — rejects unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@integration-test.dev', password });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /me ──────────────────────────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const email = `me_${Date.now()}@integration-test.dev`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'Me User', email, password: 'Password123!', orgName: 'Me Corp' });
      accessToken = res.body.data?.accessToken ?? res.body.accessToken;
    });

    it('200 — returns authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        email: expect.stringContaining('@integration-test.dev'),
      });
    });

    it('401 — rejects missing token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('401 — rejects malformed token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-jwt');
      expect(res.status).toBe(401);
    });
  });

  // ── Refresh token ────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const email = `refresh_${Date.now()}@integration-test.dev`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'Refresh User', email, password: 'Password123!', orgName: 'Refresh Corp' });
      refreshToken = res.body.data?.refreshToken ?? res.body.refreshToken;
    });

    it('200 — issues new access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('401 — rejects invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'totally-invalid-token' });
      expect(res.status).toBe(401);
    });
  });
});
