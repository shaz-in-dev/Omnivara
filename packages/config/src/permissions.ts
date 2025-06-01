/** Role permissions matrix for RBAC */

export const SYSTEM_PERMISSIONS = {
  ALL: '*',
  // CRM
  CRM_READ: 'crm:read',
  CRM_WRITE: 'crm:write',
  CRM_DELETE: 'crm:delete',
  CRM_ADMIN: 'crm:admin',
  // Projects
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_ADMIN: 'projects:admin',
  // Helpdesk
  HELPDESK_READ: 'helpdesk:read',
  HELPDESK_WRITE: 'helpdesk:write',
  HELPDESK_ADMIN: 'helpdesk:admin',
  // Finance
  FINANCE_READ: 'finance:read',
  FINANCE_WRITE: 'finance:write',
  FINANCE_ADMIN: 'finance:admin',
  // HR
  HR_READ: 'hr:read',
  HR_WRITE: 'hr:write',
  HR_ADMIN: 'hr:admin',
  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  INVENTORY_ADMIN: 'inventory:admin',
  // Platform
  MEMBERS_INVITE: 'platform:members:invite',
  MEMBERS_REMOVE: 'platform:members:remove',
  ROLES_MANAGE: 'platform:roles:manage',
  BILLING_MANAGE: 'platform:billing:manage',
  ORG_SETTINGS: 'platform:org:settings',
} as const;

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[keyof typeof SYSTEM_PERMISSIONS];

export const ROLE_PRESETS = {
  ADMIN: Object.values(SYSTEM_PERMISSIONS),
  MEMBER: [
    SYSTEM_PERMISSIONS.CRM_READ,
    SYSTEM_PERMISSIONS.CRM_WRITE,
    SYSTEM_PERMISSIONS.PROJECTS_READ,
    SYSTEM_PERMISSIONS.PROJECTS_WRITE,
    SYSTEM_PERMISSIONS.HELPDESK_READ,
  ],
  VIEWER: [
    SYSTEM_PERMISSIONS.CRM_READ,
    SYSTEM_PERMISSIONS.PROJECTS_READ,
    SYSTEM_PERMISSIONS.HELPDESK_READ,
    SYSTEM_PERMISSIONS.FINANCE_READ,
  ],
} as const;
