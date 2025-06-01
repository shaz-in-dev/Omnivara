'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Shield, Edit2, Trash2, Check, X, Lock, ExternalLink } from 'lucide-react';
import { RolesMatrix } from './roles-matrix';

interface Permission {
  key: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: 'CRM',
    permissions: [
      { key: 'crm.view', label: 'View leads & contacts', description: 'Read-only access to CRM data' },
      { key: 'crm.create', label: 'Create leads & contacts', description: 'Add new CRM records' },
      { key: 'crm.edit', label: 'Edit CRM records', description: 'Modify existing CRM data' },
      { key: 'crm.delete', label: 'Delete CRM records', description: 'Permanently remove CRM data' },
    ],
  },
  {
    group: 'Finance',
    permissions: [
      { key: 'finance.view', label: 'View invoices', description: 'See all invoice data' },
      { key: 'finance.create', label: 'Create invoices', description: 'Draft and issue invoices' },
      { key: 'finance.send', label: 'Send invoices', description: 'Email invoices to clients' },
      { key: 'finance.delete', label: 'Void / delete invoices', description: 'Remove invoice records' },
    ],
  },
  {
    group: 'Helpdesk',
    permissions: [
      { key: 'helpdesk.view', label: 'View tickets', description: 'Access the helpdesk inbox' },
      { key: 'helpdesk.reply', label: 'Reply to tickets', description: 'Send messages to customers' },
      { key: 'helpdesk.assign', label: 'Assign tickets', description: 'Route tickets to team members' },
      { key: 'helpdesk.close', label: 'Close tickets', description: 'Resolve and close tickets' },
    ],
  },
  {
    group: 'Settings',
    permissions: [
      { key: 'settings.view', label: 'View settings', description: 'Access the settings area' },
      { key: 'settings.manage', label: 'Manage settings', description: 'Modify organization settings' },
      { key: 'members.invite', label: 'Invite members', description: 'Send team invitations' },
      { key: 'members.remove', label: 'Remove members', description: 'Kick members from the org' },
    ],
  },
];

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

const DEFAULT_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to everything. Cannot be modified.',
    isSystem: true,
    memberCount: 1,
    permissions: PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key)),
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Manage the org, members, and all modules.',
    isSystem: true,
    memberCount: 1,
    permissions: ['crm.view','crm.create','crm.edit','crm.delete','finance.view','finance.create','finance.send','helpdesk.view','helpdesk.reply','helpdesk.assign','helpdesk.close','settings.view','settings.manage','members.invite','members.remove'],
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Standard access across all modules.',
    isSystem: true,
    memberCount: 2,
    permissions: ['crm.view','crm.create','crm.edit','finance.view','finance.create','helpdesk.view','helpdesk.reply','helpdesk.assign','helpdesk.close','settings.view'],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access. Cannot create or modify data.',
    isSystem: true,
    memberCount: 1,
    permissions: ['crm.view','finance.view','helpdesk.view','settings.view'],
  },
  {
    id: 'billing-only',
    name: 'Billing Manager',
    description: 'Custom role with finance access only.',
    isSystem: false,
    memberCount: 0,
    permissions: ['finance.view','finance.create','finance.send','finance.delete'],
  },
];

export function RolesSettings() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('member');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const selectedRole = roles.find((r) => r.id === selectedRoleId)!;

  const togglePermission = (key: string) => {
    if (selectedRole.isSystem) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId
          ? {
              ...r,
              permissions: r.permissions.includes(key)
                ? r.permissions.filter((p) => p !== key)
                : [...r.permissions, key],
            }
          : r,
      ),
    );
  };

  const addCustomRole = () => {
    const newRole: Role = {
      id: `custom-${Date.now()}`,
      name: 'New Role',
      description: 'Custom role',
      isSystem: false,
      memberCount: 0,
      permissions: ['crm.view', 'helpdesk.view', 'settings.view'],
    };
    setRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
  };

  const deleteRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    setSelectedRoleId('member');
  };

  return (
    <div className="flex h-full min-h-[480px] divide-x divide-gray-100 dark:divide-gray-800">
      {/* Roles sidebar */}
      <div className="flex w-56 flex-shrink-0 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Roles</p>
          <button
            onClick={addCustomRole}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="Add custom role"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-1">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                selectedRoleId === role.id
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {role.isSystem ? (
                  <Lock className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                ) : (
                  <Shield className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" />
                )}
                <span className="font-medium">{role.name}</span>
              </div>
              <span className="text-xs text-gray-400">{role.memberCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Permission editor */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        {/* Role header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            {editingName && !selectedRole.isSystem ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="rounded-lg border border-brand-300 px-2 py-1 text-base font-semibold outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={() => {
                    if (nameInput.trim()) {
                      setRoles((prev) => prev.map((r) => r.id === selectedRoleId ? { ...r, name: nameInput.trim() } : r));
                    }
                    setEditingName(false);
                  }}
                  className="rounded-lg p-1 text-green-500 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{selectedRole.name}</h3>
                {!selectedRole.isSystem && (
                  <button
                    onClick={() => { setNameInput(selectedRole.name); setEditingName(true); }}
                    className="rounded-lg p-1 text-gray-300 hover:text-gray-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {selectedRole.isSystem && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                    <Lock className="h-2.5 w-2.5" /> System
                  </span>
                )}
              </div>
            )}
            <p className="mt-0.5 text-sm text-gray-500">{selectedRole.description}</p>
            <p className="mt-1 text-xs text-gray-400">{selectedRole.memberCount} member{selectedRole.memberCount !== 1 ? 's' : ''} with this role</p>
          </div>
          {!selectedRole.isSystem && (
            <button
              onClick={() => deleteRole(selectedRole.id)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete role
            </button>
          )}
        </div>

        {/* Permission groups */}
        <div className="space-y-6">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.group}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.group}</h4>
              <div className="space-y-2">
                {group.permissions.map((perm) => {
                  const enabled = selectedRole.permissions.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                        enabled
                          ? 'border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-900/10'
                          : 'border-gray-100 bg-white hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900'
                      } ${selectedRole.isSystem ? 'pointer-events-none' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{perm.label}</p>
                        <p className="text-xs text-gray-400">{perm.description}</p>
                      </div>
                      <div
                        onClick={() => togglePermission(perm.key)}
                        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                          enabled ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            enabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!selectedRole.isSystem && (
          <div className="mt-6 flex items-center gap-3">
            <button className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Save changes
            </button>
            <p className="text-xs text-gray-400">Changes apply immediately to all members with this role.</p>
          </div>
        )}
      </div>

      {/* Full permissions matrix */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Full Permissions Reference</h3>
          <Link
            href="/docs/permissions"
            target="_blank"
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open full page
          </Link>
        </div>
        <RolesMatrix />
      </div>
    </div>
  );
}
