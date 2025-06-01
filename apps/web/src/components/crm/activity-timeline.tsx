'use client';

import { Phone, Mail, Calendar, FileText, CheckSquare, Presentation } from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  subject: string;
  body?: string | null;
  completedAt?: string | null;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

const ICONS: Record<string, React.ElementType> = {
  call: Phone, email: Mail, meeting: Calendar,
  note: FileText, task: CheckSquare, demo: Presentation,
};
const COLORS: Record<string, string> = {
  call: 'bg-green-100 text-green-600',
  email: 'bg-blue-100 text-blue-600',
  meeting: 'bg-purple-100 text-purple-600',
  note: 'bg-amber-100 text-amber-600',
  task: 'bg-gray-100 text-gray-600',
  demo: 'bg-brand-100 text-brand-600',
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-3xl">📋</span>
        <p className="text-sm font-medium text-gray-500">No activities yet</p>
        <p className="text-xs text-gray-400">Log a call, email, or meeting to get started</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-0 left-5 top-0 w-px bg-gray-200 dark:bg-gray-700" />
      {activities.map((a) => {
        const Icon = ICONS[a.type] ?? FileText;
        const color = COLORS[a.type] ?? 'bg-gray-100 text-gray-600';
        return (
          <div key={a.id} className="relative flex gap-4 pb-6 pl-12">
            <div className={`absolute left-2 flex h-7 w-7 items-center justify-center rounded-full ${color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{a.subject}</p>
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              {a.body && <p className="mt-1 text-xs text-gray-500">{a.body}</p>}
              <div className="mt-2 flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{a.type}</span>
                {a.user && <span className="text-xs text-gray-400">by {a.user.name}</span>}
                {a.completedAt && <span className="text-xs text-green-600">✓ Completed</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
