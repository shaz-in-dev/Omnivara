'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Briefcase, Award, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { SlideOver } from '@/components/shared/slide-over';
import { useLeaveRequests, type ApiLeaveRequest } from '@/hooks/use-employees';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  department: string;
  location: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'OFFBOARDING';
  startDate: string;
  salary?: number;
  manager?: string;
  avatarColor: string;
}

const LEAVE_TYPE_COLOR: Record<string, string> = {
  annual:   'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  ANNUAL:   'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  sick:     'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  SICK:     'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  PERSONAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  parental: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  PARENTAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
};

const STATUS_ICON: Record<string, React.ElementType> = {
  approved: CheckCircle2,
  APPROVED: CheckCircle2,
  denied:   XCircle,
  DENIED:   XCircle,
  pending:  Clock,
  PENDING:  Clock,
};
const STATUS_COLOR: Record<string, string> = {
  approved: 'text-green-500',
  APPROVED: 'text-green-500',
  denied:   'text-red-400',
  DENIED:   'text-red-400',
  pending:  'text-amber-400',
  PENDING:  'text-amber-400',
};

interface Props {
  orgId: string;
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

// Compute used days per leave type from approved requests this year
function computeBalance(requests: ApiLeaveRequest[]) {
  const year = new Date().getFullYear();
  const used: Record<string, number> = {};
  for (const r of requests) {
    if (r.status !== 'approved') continue;
    if (new Date(r.startDate).getFullYear() !== year) continue;
    const key = r.type.toUpperCase();
    used[key] = (used[key] ?? 0) + (r.days ?? 0);
  }
  return used;
}

const LEAVE_BALANCE_TOTAL: Record<string, number> = { ANNUAL: 20, SICK: 10, PERSONAL: 3 };

export function EmployeeDetail({ orgId, employee, open, onClose }: Props) {
  const [tab, setTab] = useState<'profile' | 'leave' | 'performance'>('profile');

  const { data: leaveData, isLoading: leaveLoading } = useLeaveRequests(
    orgId,
    undefined,
  );
  // Filter client-side to this employee
  const allLeave: ApiLeaveRequest[] = Array.isArray(leaveData)
    ? leaveData
    : (leaveData as { items?: ApiLeaveRequest[] })?.items ?? [];
  const employeeLeave = employee ? allLeave.filter((r) => r.employeeId === employee.id) : [];
  const usedBalance = computeBalance(employeeLeave);

  if (!employee) return null;
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase();
  const tenureMonths = Math.floor((Date.now() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30));

  return (
    <SlideOver open={open} onClose={onClose} title={fullName} subtitle={`${employee.jobTitle} · ${employee.department}`} width="md">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Avatar + status */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${employee.avatarColor} text-xl font-bold text-white`}>
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{fullName}</h3>
            <p className="text-sm text-gray-500">{employee.jobTitle}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : employee.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {employee.status === 'ACTIVE' ? 'Active' : employee.status === 'ON_LEAVE' ? 'On Leave' : 'Offboarding'}
              </span>
              <span className="text-xs text-gray-400">{tenureMonths} months tenure</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 dark:border-gray-800">
          {(['profile', 'leave', 'performance'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px mr-5 border-b-2 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="space-y-5 px-6 py-5">
            <dl className="space-y-3">
              {[
                { icon: Mail, label: 'Email', value: employee.email, href: `mailto:${employee.email}` },
                { icon: Phone, label: 'Phone', value: employee.phone ?? '—' },
                { icon: MapPin, label: 'Location', value: employee.location },
                { icon: Briefcase, label: 'Department', value: employee.department },
                { icon: Award, label: 'Manager', value: employee.manager ?? '—' },
                { icon: Calendar, label: 'Start Date', value: new Date(employee.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    <span className="w-20 flex-shrink-0 text-xs font-medium text-gray-400">{row.label}</span>
                    {row.href ? (
                      <a href={row.href} className="text-sm text-brand-600 hover:underline dark:text-brand-400">{row.value}</a>
                    ) : (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.value}</span>
                    )}
                  </div>
                );
              })}
            </dl>

            {/* Quick actions */}
            <div className="flex gap-2 pt-2">
              <button className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
                Send email
              </button>
              <button className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
                Schedule 1:1
              </button>
            </div>
          </div>
        )}

        {tab === 'leave' && (
          <div className="px-6 py-5 space-y-5">
            {/* Balance bars (used days from real approved requests) */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Leave Balance (Current Year)</h4>
              {leaveLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(LEAVE_BALANCE_TOTAL).map(([type, total]) => {
                    const used = usedBalance[type] ?? 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {type.charAt(0) + type.slice(1).toLowerCase()} Leave
                          </span>
                          <span className="text-gray-400">{used} / {total} days used</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all"
                            style={{ width: `${Math.min((used / total) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leave history */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Recent Requests</h4>
              {leaveLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
                </div>
              ) : employeeLeave.length === 0 ? (
                <p className="text-sm text-gray-400">No leave requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {employeeLeave.slice(0, 5).map((req) => {
                    const Icon = STATUS_ICON[req.status] ?? Clock;
                    const typeLabel = req.type.charAt(0).toUpperCase() + req.type.slice(1).toLowerCase();
                    return (
                      <div key={req.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                        <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${STATUS_COLOR[req.status] ?? 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${LEAVE_TYPE_COLOR[req.type] ?? 'bg-gray-100 text-gray-600'}`}>
                              {typeLabel}
                            </span>
                            <span className="text-xs text-gray-500">{req.days} day{req.days !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {req.startDate !== req.endDate && ` – ${new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </p>
                          {req.reason && <p className="mt-0.5 text-xs text-gray-400 italic">"{req.reason}"</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'performance' && (
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
              <Award className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Performance Reviews</p>
              <p className="mt-1 text-xs text-gray-400">360° reviews and OKR tracking coming in Sprint 9-10</p>
            </div>
          </div>
        )}
      </div>
    </SlideOver>
  );
}
