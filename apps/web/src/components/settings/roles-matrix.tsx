'use client';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Permissions matrix definition — single source of truth
const RESOURCES = [
  { id: 'leads',       label: 'Leads',       module: 'CRM' },
  { id: 'contacts',    label: 'Contacts',    module: 'CRM' },
  { id: 'accounts',    label: 'Accounts',    module: 'CRM' },
  { id: 'pipeline',    label: 'Pipeline',    module: 'CRM' },
  { id: 'projects',    label: 'Projects',    module: 'Projects' },
  { id: 'tasks',       label: 'Tasks',       module: 'Projects' },
  { id: 'tickets',     label: 'Tickets',     module: 'Helpdesk' },
  { id: 'invoices',    label: 'Invoices',    module: 'Finance' },
  { id: 'expenses',    label: 'Expenses',    module: 'Finance' },
  { id: 'employees',   label: 'Employees',   module: 'HR' },
  { id: 'leave',       label: 'Leave',       module: 'HR' },
  { id: 'inventory',   label: 'Inventory',   module: 'Inventory' },
  { id: 'members',     label: 'Members',     module: 'Settings' },
  { id: 'roles',       label: 'Roles',       module: 'Settings' },
  { id: 'billing',     label: 'Billing',     module: 'Settings' },
  { id: 'audit_logs',  label: 'Audit Logs',  module: 'Settings' },
  { id: 'api_keys',    label: 'API Keys',    module: 'Settings' },
  { id: 'webhooks',    label: 'Webhooks',    module: 'Settings' },
] as const;

type ResourceId = typeof RESOURCES[number]['id'];

type Permission = 'full' | 'read' | 'own' | 'none';

interface RolePermissions {
  create: Permission;
  read:   Permission;
  update: Permission;
  delete: Permission;
}

const ROLES = ['Admin', 'Manager', 'Member', 'Viewer'] as const;
type RoleName = typeof ROLES[number];

const MATRIX: Record<ResourceId, Record<RoleName, RolePermissions>> = {
  leads:      { Admin: f(), Manager: f(), Member: f(), Viewer: ro() },
  contacts:   { Admin: f(), Manager: f(), Member: f(), Viewer: ro() },
  accounts:   { Admin: f(), Manager: f(), Member: f(), Viewer: ro() },
  pipeline:   { Admin: f(), Manager: f(), Member: own(), Viewer: ro() },
  projects:   { Admin: f(), Manager: f(), Member: own(), Viewer: ro() },
  tasks:      { Admin: f(), Manager: f(), Member: own(), Viewer: ro() },
  tickets:    { Admin: f(), Manager: f(), Member: f(), Viewer: ro() },
  invoices:   { Admin: f(), Manager: f(), Member: none(), Viewer: none() },
  expenses:   { Admin: f(), Manager: f(), Member: own(), Viewer: none() },
  employees:  { Admin: f(), Manager: ro(), Member: none(), Viewer: none() },
  leave:      { Admin: f(), Manager: f(), Member: own(), Viewer: none() },
  inventory:  { Admin: f(), Manager: f(), Member: ro(), Viewer: ro() },
  members:    { Admin: f(), Manager: ro(), Member: none(), Viewer: none() },
  roles:      { Admin: f(), Manager: none(), Member: none(), Viewer: none() },
  billing:    { Admin: f(), Manager: none(), Member: none(), Viewer: none() },
  audit_logs: { Admin: f(), Manager: ro(), Member: none(), Viewer: none() },
  api_keys:   { Admin: f(), Manager: none(), Member: none(), Viewer: none() },
  webhooks:   { Admin: f(), Manager: none(), Member: none(), Viewer: none() },
};

function f():    RolePermissions { return { create: 'full', read: 'full', update: 'full',   delete: 'full' }; }
function ro():   RolePermissions { return { create: 'none', read: 'full', update: 'none',   delete: 'none' }; }
function own():  RolePermissions { return { create: 'full', read: 'full', update: 'own',    delete: 'own'  }; }
function none(): RolePermissions { return { create: 'none', read: 'none', update: 'none',   delete: 'none' }; }

function Cell({ perm }: { perm: Permission }) {
  if (perm === 'full') return <Check className="mx-auto h-4 w-4 text-green-500" />;
  if (perm === 'own')  return <span className="block text-center text-xs font-medium text-amber-500">Own</span>;
  if (perm === 'read') return <Minus className="mx-auto h-4 w-4 text-gray-400" />;
  return <span className="block text-center text-xs text-gray-300 dark:text-gray-700">—</span>;
}

export function RolesMatrix() {
  const modules = [...new Set(RESOURCES.map((r) => r.module))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Permissions Matrix</h2>
        <p className="mt-1 text-sm text-gray-500">
          What each role can do across all modules.{' '}
          <span className="inline-flex items-center gap-1 text-xs">
            <Check className="h-3 w-3 text-green-500" /> Full
          </span>{' '}
          <span className="text-xs text-amber-500 font-medium">Own</span> = own records only{' '}
          <Minus className="inline h-3 w-3 text-gray-400" /> = read-only{' '}
          — = no access
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Resource</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Module</th>
              {ROLES.map((role) => (
                <th key={role} className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {modules.map((mod) => {
              const modResources = RESOURCES.filter((r) => r.module === mod);
              return modResources.map((resource, i) => (
                <tr key={resource.id} className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{resource.label}</td>
                  <td className="px-4 py-2.5">
                    {i === 0 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {mod}
                      </span>
                    )}
                  </td>
                  {ROLES.map((role) => {
                    const perms = MATRIX[resource.id][role];
                    const allFull = Object.values(perms).every((p) => p === 'full');
                    const allNone = Object.values(perms).every((p) => p === 'none');
                    return (
                      <td key={role} className="px-4 py-2.5 text-center">
                        {allFull ? (
                          <Check className="mx-auto h-4 w-4 text-green-500" />
                        ) : allNone ? (
                          <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
                        ) : (
                          <div className="flex justify-center gap-0.5">
                            {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                              <div key={action} title={`${action}: ${perms[action]}`}>
                                <Cell perm={perms[action]} />
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Custom roles can be created in{' '}
        <a href="/settings/roles" className="text-brand-600 hover:underline">Settings → Roles</a>.
        Contact support to request changes to system roles.
      </p>
    </div>
  );
}
