import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { TeamsModule } from './modules/teams/teams.module';
import { RolesModule } from './modules/roles/roles.module';
import { CrmModule } from './modules/crm/crm.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { HelpdeskModule } from './modules/helpdesk/helpdesk.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EmailModule } from './modules/email/email.module';
import { SearchModule } from './modules/search/search.module';
import { BillingModule } from './modules/billing/billing.module';
import { AuditModule } from './modules/audit/audit.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AiModule } from './modules/ai/ai.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SlackModule } from './modules/slack/slack.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['../../.env', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 600 },
    ]),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    ScheduleModule.forRoot(),
    // Cache (Redis/ioredis) — TTL 60 s, falls back to in-memory when REDIS_URL is unset
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) {
          // In-memory fallback (dev without Redis)
          return { ttl: 60_000 };
        }
        const { redisStore } = await import('cache-manager-ioredis-yet');
        return {
          store: redisStore,
          url: redisUrl,
          ttl: 60_000, // milliseconds
        };
      },
    }),
    // Database
    PrismaModule,
    // Platform
    HealthModule,
    AuthModule,
    UsersModule,
    OrgsModule,
    TeamsModule,
    RolesModule,
    NotificationsModule,
    DashboardModule,
    AnalyticsModule,
    EmailModule,
    SearchModule,
    BillingModule,
    AuditModule,
    ApiKeysModule,
    AiModule,
    WebhooksModule,
    SlackModule,
    // Business modules
    CrmModule,
    ProjectsModule,
    HelpdeskModule,
    FinanceModule,
    HrModule,
    InventoryModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally — every route is rate-limited by default.
    // Use @SkipThrottle() on specific routes (e.g. SSE streams) that must be exempt.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
