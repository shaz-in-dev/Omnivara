import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
  const secret = process.env['JWT_SECRET'];
  if (!secret && process.env['NODE_ENV'] === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return {
    secret: secret ?? 'dev-secret-change-in-production',
    accessExpiry:  process.env['JWT_ACCESS_EXPIRY']  ?? '15m',
    refreshExpiry: process.env['JWT_REFRESH_EXPIRY'] ?? '7d',
  };
});
