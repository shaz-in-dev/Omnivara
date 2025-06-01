import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Connection pool sizes are tuned for a NestJS API under concurrent load.
// The DATABASE_URL can override via ?connection_limit=N&pool_timeout=N query params.
const isProd = process.env.NODE_ENV === 'production';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL ?? '';

    // Append connection pool settings to the URL if not already specified
    const separator = dbUrl.includes('?') ? '&' : '?';
    const pooledUrl = dbUrl.includes('connection_limit')
      ? dbUrl
      : `${dbUrl}${separator}connection_limit=${isProd ? 20 : 5}&pool_timeout=10`;

    super({
      datasources: { db: { url: pooledUrl } },
      log: isProd
        ? [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
        : [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }],
    });
  }

  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        this.logger.warn(`Database connection failed, retrying in 3s… (${retries} attempts left)`);
        await new Promise((r) => setTimeout(r, 3_000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Soft-delete helper — returns true if a record exists before deletion */
  async exists(model: string, where: Record<string, unknown>): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (this as any)[model].findFirst({ where, select: { id: true } });
    return result !== null;
  }
}
