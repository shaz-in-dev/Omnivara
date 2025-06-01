import type { ID } from './common';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  orgName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface JwtPayload {
  sub: ID;
  email: string;
  orgId?: ID;
  iat: number;
  exp: number;
}
