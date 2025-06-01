'use client';
import { useState } from 'react';
import { Plus, Search, Users, Clock, Calendar, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { EmployeeDetail, type Employee } from '@/components/hr/employee-detail';
import { LeaveRequests } from '@/components/hr/leave-requests';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees, type ApiEmployee } from '@/hooks/use-employees';

const DEPARTMENTS = ['All', 'Engineering', 'Product', 'Sales', 'Marketing', 'CS', 'Executive'];

const DEPT_COLORS: Record<string, string> = {
  Engineering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  Product:     'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Sales:       'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Marketing:   'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  CS:          'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  Executive:   'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
};

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-indigo-500',
];

function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'bg-brand-500';
}

// ── Normalization ─────────────────────────────────────────────────────────────

function toUIEmployee(e: ApiEmployee): Employee {
  const statusMap: Record<string, Employee['status']> = {
    active:      'ACTIVE',
    on_leave:    'ON_LEAVE',
    offboarding: 'OFFBOARDING',
    terminated:  'OFFBOARDING',
  };
  const managerName = e.manager
    ? `${e.manager.firstName} ${e.manager.lastName}`
    : undefined;
  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    ...(e.phone ? { phone: e.phone } : {}),
    jobTitle: e.jobTitle,
    department: e.department,
    location: e.location ?? 'Remote',
    status: statusMap[e.status] ?? 'ACTIVE',
    startDate: e.startDate.split('T')[0] ?? e.startDate,
    ...(e.salary != null ? { salary: Number(e.salary) } : {}),
    ...(managerName ? { manager: managerName } : {}),
    avatarColor: getAvatarColor(e.id),
  };
}

type Tab = 'employees' | 'leave';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HrPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [tab, setTab] = useState<Tab>('employees');
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useEmployees({
    orgId,
    department: dept === 'All' ? undefined : dept,
  });

  const apiEmployees = data?.items ?? [];
  const employees: Employee[] = apiEmployees.map(toUIEmployee);

  // Client-side search filter (name / title / dept)
  const filtered = employees.filter((e) => {
    if (!search) return true;
    return `${e.firstName} ${e.lastName} ${e.jobTitle} ${e.department}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length;

  const stats = [
    { icon: Users,     label: 'Total Headcount',      value: data?.total ?? 0,         color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
    { icon: TrendingUp, label: 'Active Employees',     value: employees.filter(e => e.status === 'ACTIVE').length, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { icon: Calendar,  label: 'On Leave Today',        value: onLeaveCount,             color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { icon: Clock,     label: 'Pending Leave Requests', value: '—',                     color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR & People Ops</h1>
            <p className="mt-1 text-sm text-gray-500">Employee directory, leave management, and performance</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            const parts = s.color.split(' ');
            const textC = parts[0] ?? '';
            const bgC = parts.slice(1).join(' ');
            return (
              <div key={s.label} className={`flex items-center gap-3 rounded-2xl p-4 ${bgC}`}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/10">
                  <Icon className={`h-4 w-4 ${textC}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${textC}`}>{isLoading ? '—' : s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit dark:border-gray-700 dark:bg-gray-800">
          {(['employees', 'leave'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t === 'leave' ? 'Leave Requests' : 'Employees'}
            </button>
          ))}
        </div>

        {tab === 'employees' && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex h-48 items-center justify-center gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                <span className="text-sm">Loading employees…</span>
              </div>
            )}

            {/* Error */}
            {isError && !isLoading && (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-gray-400">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm">Could not load employees</p>
                <button onClick={() => void refetch()} className="text-sm text-brand-600 hover:underline">
                  Try again
                </button>
              </div>
            )}

            {/* Employee grid */}
            {!isLoading && !isError && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((emp) => {
                  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
                  return (
                    <button
                      key={emp.id}
                      onClick={() => { setSelectedEmployee(emp); setDrawerOpen(true); }}
                      className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-center transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${emp.avatarColor} text-xl font-bold text-white shadow-sm`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400">{emp.jobTitle}</p>
                        <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${DEPT_COLORS[emp.department] ?? 'bg-gray-100 text-gray-600'}`}>
                            {emp.department}
                          </span>
                          {emp.status === 'ON_LEAVE' && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">Leave</span>
                          )}
                          {emp.status === 'OFFBOARDING' && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">Offboarding</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-full py-16 text-center text-sm text-gray-400">
                    {search || dept !== 'All' ? 'No employees match your filter.' : 'No employees yet.'}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'leave' && (
          <div className="max-w-xl">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Pending Approval</h2>
            <LeaveRequests orgId={orgId} />
          </div>
        )}
      </div>

      <EmployeeDetail
        orgId={orgId}
        employee={selectedEmployee}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
