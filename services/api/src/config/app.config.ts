import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '4000', 10),
  appUrl: process.env['APP_URL'] ?? 'http://localhost:3000',
  apiUrl: process.env['API_URL'] ?? 'http://localhost:4000',
}));
