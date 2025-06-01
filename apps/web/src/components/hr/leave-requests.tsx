'use client';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLeaveRequests, useReviewLeaveRequest, type ApiLeaveRequest } from '@/hooks/use-employees';

const TYPE_COLORS: Record<string, string> = {
  annual:   'bg-blue-100 text-blue-700',
  ANNUAL:   'bg-blue-100 text-blue-700',
  sick:     'bg-red-100 text-red-700',
  SICK:     'bg-red-100 text-red-700',
  personal: 'bg-purple-100 text-purple-700',
  PERSONAL: 'bg-purple-100 text-purple-700',
  parental: 'bg-amber-100 text-amber-700',
  PARENTAL: 'bg-amber-100 text-amber-700',
};

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-indigo-500',
];

function avatarColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'bg-brand-500';
}

interface Props {
  orgId: string;
}

export function LeaveRequests({ orgId }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');
  const { data, isLoading } = useLeaveRequests(orgId, 'pending');
  const review = useReviewLeaveRequest(orgId);

  // API returns plain array
  const requests: ApiLeaveRequest[] = Array.isArray(data) ? data : (data as { items?: ApiLeaveRequest[] })?.items ?? [];

  const handle = async (req: ApiLeaveRequest, action: 'approved' | 'denied') => {
    await review.mutateAsync({
      requestId: req.id,
      action,
      reviewedBy: currentUserId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 dark:border-gray-700">
        <CheckCircle2 className="mb-3 h-8 w-8 text-green-400" />
        <p className="text-sm font-medium text-gray-500">All caught up!</p>
        <p className="text-xs text-gray-400">No pending leave requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const emp = req.employee;
        const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
        const empTitle = emp?.jobTitle ?? '';
        const initials = empName.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
        const color = avatarColor(req.employeeId);
        const isPending = review.isPending && review.variables?.requestId === req.id;
        const typeLabel = req.type.charAt(0).toUpperCase() + req.type.slice(1).toLowerCase();

        return (
          <div key={req.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start gap-4 p-4">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${color} text-sm font-bold text-white`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{empName}</span>
                  <span className="text-xs text-gray-400">{empTitle}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLORS[req.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {typeLabel}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {req.startDate !== req.endDate && ` – ${new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    {' '}·{' '}<strong>{req.days} day{req.days !== 1 ? 's' : ''}</strong>
                  </span>
                </div>
                {req.reason && (
                  <p className="mt-1 text-xs text-gray-400 italic">"{req.reason}"</p>
                )}
                <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-300">
                  <Clock className="h-3 w-3" />
                  Requested {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => void handle(req, 'denied')}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/10"
              >
                <XCircle className="h-4 w-4" />
                Deny
              </button>
              <div className="w-px bg-gray-100 dark:bg-gray-800" />
              <button
                onClick={() => void handle(req, 'approved')}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/10"
              >
                {isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
