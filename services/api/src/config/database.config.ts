import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env['DATABASE_URL'] ?? 'postgresql://omnivara:omnivara@localhost:5432/omnivara_dev',
}));
