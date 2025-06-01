import { Calendar, User, MessageSquare, Paperclip, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: { id: string; firstName: string; lastName: string };
  commentsCount?: number;
  attachmentsCount?: number;
  tags?: string[];
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  LOW:    { label: 'Low',    color: 'text-gray-400',  dot: 'bg-gray-300' },
  MEDIUM: { label: 'Medium', color: 'text-blue-500',  dot: 'bg-blue-400' },
  HIGH:   { label: 'High',   color: 'text-orange-500', dot: 'bg-orange-400' },
  URGENT: { label: 'Urgent', color: 'text-red-500',   dot: 'bg-red-500' },
};

interface Props {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

export function TaskCard({ task, isDragging, onClick }: Props) {
  const priority = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  const initials = task.assignee
    ? `${task.assignee.firstName[0]}${task.assignee.lastName[0]}`.toUpperCase()
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs cursor-pointer transition-all',
        'hover:border-brand-300 hover:shadow-sm',
        isDragging && 'rotate-2 shadow-lg border-brand-400 opacity-90',
        'dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-600',
      )}
    >
      {/* Priority + tags */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className={cn('h-2 w-2 rounded-full', priority.dot)} />
          <span className={cn('text-xs font-medium', priority.color)}>{priority.label}</span>
        </div>
        {task.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug text-gray-900 dark:text-white line-clamp-2">
        {task.title}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {task.dueDate && (
            <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500')}>
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {(task.commentsCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.commentsCount}
            </span>
          )}
          {(task.attachmentsCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {task.attachmentsCount}
            </span>
          )}
        </div>

        {initials && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}
