import type { ID, Timestamps, Permission } from './common';
import type { User } from './user';

export interface Organization extends Timestamps {
  id: ID;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  planId: string;
}

export interface Role extends Timestamps {
  id: ID;
  orgId: ID | null;
  name: string;
  description: string | null;
  permissions: Permission[];
  isSystem: boolean;
}

export interface Team extends Timestamps {
  id: ID;
  orgId: ID;
  name: string;
  description: string | null;
}

export interface OrganizationMember {
  id: ID;
  orgId: ID;
  userId: ID;
  roleId: ID;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  role: Role;
}
