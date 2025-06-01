import * as Sentry from '@sentry/node';

// Init Sentry before anything else (if DSN provided)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV ?? 'development',
  });
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

// ── Startup env validation ─────────────────────────────────────────────────────
// Fail immediately with a clear message instead of a cryptic runtime crash.

interface EnvRule {
  key:        string;
  required:   boolean | 'production-only';
  description: string;
}

const ENV_RULES: EnvRule[] = [
  { key: 'DATABASE_URL',    required: true,                description: 'PostgreSQL connection string' },
  { key: 'JWT_SECRET',      required: true,                description: 'JWT signing secret (min 32 chars)' },
  { key: 'NODE_ENV',        required: false,               description: 'Deployment environment' },
  { key: 'REDIS_URL',       required: false,               description: 'Redis URL (optional, falls back to in-memory)' },
  { key: 'STRIPE_SECRET_KEY', required: 'production-only', description: 'Stripe secret key' },
  { key: 'RESEND_API_KEY',  required: 'production-only',   description: 'Resend email API key' },
];

function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  for (const rule of ENV_RULES) {
    const val = process.env[rule.key];
    const isRequired = rule.required === true || (rule.required === 'production-only' && isProd);
    if (isRequired && !val) {
      errors.push(`  ✗ ${rule.key} — ${rule.description}`);
    }
  }

  // Extra: JWT_SECRET must be at least 32 chars in production
  const jwtSecret = process.env.JWT_SECRET ?? '';
  if (isProd && jwtSecret.length < 32) {
    errors.push('  ✗ JWT_SECRET must be at least 32 characters in production');
  }
  if (isProd && jwtSecret === 'dev-secret-change-in-production') {
    errors.push('  ✗ JWT_SECRET is still the default placeholder — change it');
  }

  if (errors.length > 0) {
    console.error('\n❌ Missing or invalid environment variables:\n');
    errors.forEach((e) => console.error(e));
    console.error('\nSet these in your .env file or environment and restart.\n');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 4000);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // Security
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: [
      config.get<string>('APP_URL', 'http://localhost:3001'),
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger (dev only)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Omnivara One API')
      .setDescription('Unified Business OS API — modular NestJS backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 Omnivara API running on http://localhost:${port}`);
  logger.log(`Environment: ${nodeEnv}`);
}

void bootstrap();
