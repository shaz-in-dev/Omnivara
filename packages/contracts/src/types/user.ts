import type { ID, Timestamps } from './common';

export interface User extends Timestamps {
  id: ID;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface AuthUser extends User {
  orgId?: ID;
}

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
}
