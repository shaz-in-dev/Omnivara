'use client';
import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Zap, Circle, Clock,
  AlertCircle, CheckSquare, GripVertical, BarChart2, Flag,
  Play, Archive, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSprints, useTasks, useAssignTaskToSprint, type ApiSprint, type ApiTask } from '@/hooks/use-projects';
import type { Task, TaskPriority, TaskStatus } from './task-card';

/* ── Type mapping ──────────────────────────────────────────────────────────── */

const STATUS_MAP: Record<string, TaskStatus> = {
  backlog:     'TODO',
  todo:        'TODO',
  in_progress: 'IN_PROGRESS',
  in_review:   'IN_REVIEW',
  done:        'DONE',
  cancelled:   'DONE',
};

const PRIORITY_MAP: Record<string, TaskPriority> = {
  low:    'LOW',
  medium: 'MEDIUM',
  high:   'HIGH',
  urgent: 'URGENT',
};

function toUITask(t: ApiTask): Task & { points: number; sprintId: string | null } {
  const nameParts = (t.assignee?.name ?? '').split(' ');
  return {
    id: t.id,
    title: t.title,
    status: STATUS_MAP[t.status] ?? 'TODO',
    priority: PRIORITY_MAP[t.priority] ?? 'MEDIUM',
    ...(t.dueDate != null ? { dueDate: t.dueDate } : {}),
    ...(t.description != null ? { description: t.description } : {}),
    tags: t.tags ?? [],
    commentsCount: 0,
    points: t.points ?? 1,
    sprintId: t.sprintId,
    ...(t.assignee ? {
      assignee: {
        id: t.assignee.id,
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' ') || '?',
      },
    } : {}),
  };
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const STATUS_ICON: Record<TaskStatus, { icon: React.ElementType; color: string }> = {
  TODO:        { icon: Circle,      color: 'text-gray-400' },
  IN_PROGRESS: { icon: Clock,       color: 'text-blue-500' },
  IN_REVIEW:   { icon: AlertCircle, color: 'text-purple-500' },
  DONE:        { icon: CheckSquare, color: 'text-green-500' },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW:    'bg-gray-300',
  MEDIUM: 'bg-blue-400',
  HIGH:   'bg-orange-400',
  URGENT: 'bg-red-500',
};

const POINTS_COLOR = (p: number) =>
  p <= 2 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  : p <= 5 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
  : p <= 8 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';

/* ── Velocity bar ─────────────────────────────────────────────────────────── */
function VelocityBar({ sprints }: { sprints: ApiSprint[] }) {
  const bars = sprints
    .filter((s) => s.status === 'completed' || s.status === 'active')
    .map((s) => ({
      name: (s.name.split('—')[0] ?? s.name).trim(),
      done: (s.tasks ?? []).filter((t) => t.status === 'done').reduce((a) => a + 1, 0),
      capacity: (s.tasks ?? []).length || 1,
    }));
  const max = Math.max(...bars.map((b) => b.capacity), 10);

  if (bars.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-brand-500" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Velocity</p>
      </div>
      <div className="flex items-end gap-3">
        {bars.map((b) => (
          <div key={b.name} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-gray-500">{b.done}</span>
            <div className="relative w-full rounded-t-sm overflow-hidden" style={{ height: 48 }}>
              <div className="absolute bottom-0 w-full rounded-t-sm bg-gray-200 dark:bg-gray-700" style={{ height: `${(b.capacity / max) * 48}px` }} />
              <div className="absolute bottom-0 w-full rounded-t-sm bg-brand-400 transition-all" style={{ height: `${(b.done / max) * 48}px` }} />
            </div>
            <span className="text-[10px] text-gray-400 text-center truncate w-full">{b.name.replace('Sprint ', 'S')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Backlog task row ──────────────────────────────────────────────────────── */
interface BacklogRowProps {
  task: Task & { points: number; sprintId: string | null };
  onClick: (task: Task) => void;
  sprints: ApiSprint[];
  onMoveToSprint?: (taskId: string, sprintId: string) => void;
  onMoveToBacklog?: (taskId: string) => void;
  showMoveToBacklog?: boolean;
}

function BacklogRow({ task, onClick, sprints, onMoveToSprint, onMoveToBacklog, showMoveToBacklog }: BacklogRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { icon: StatusIcon, color } = STATUS_ICON[task.status];

  return (
    <div className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-200 group-hover:text-gray-400 cursor-grab" />
      <StatusIcon className={cn('h-4 w-4 flex-shrink-0', color)} />

      <span
        className={cn('flex-1 text-sm font-medium text-gray-800 dark:text-gray-200', task.status === 'DONE' && 'line-through text-gray-400')}
        onClick={() => onClick(task)}
      >
        {task.title}
      </span>

      {task.tags?.map((tag) => (
        <span key={tag} className="hidden rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 group-hover:inline-block dark:bg-gray-700 dark:text-gray-400">
          {tag}
        </span>
      ))}

      <div className="flex items-center gap-1.5">
        <div className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
        <span className="text-xs text-gray-400 capitalize">{task.priority.toLowerCase()}</span>
      </div>

      {task.assignee && (
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {task.assignee.firstName[0]}{task.assignee.lastName[0]}
        </div>
      )}

      <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-semibold', POINTS_COLOR(task.points))}>
        {task.points}
      </span>

      {/* Move to sprint / backlog */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          className="rounded-md p-1 text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-7 z-20 w-52 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {showMoveToBacklog && (
              <button
                onClick={() => { onMoveToBacklog?.(task.id); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Archive className="h-3 w-3 text-gray-400" /> Move to Backlog
              </button>
            )}
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Move to sprint</p>
            {sprints.filter((s) => s.status !== 'completed').map((s) => (
              <button
                key={s.id}
                onClick={() => { onMoveToSprint?.(task.id, s.id); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {s.status === 'active' && <Play className="h-3 w-3 text-green-500" />}
                {s.status !== 'active' && <Circle className="h-3 w-3 text-gray-400" />}
                {(s.name.split('—')[0] ?? s.name).trim()}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sprint section ───────────────────────────────────────────────────────── */
interface SprintSectionProps {
  sprint: ApiSprint;
  onTaskClick: (task: Task) => void;
  onMoveToBacklog: (taskId: string) => void;
  onMoveToSprint: (taskId: string, sprintId: string) => void;
  allSprints: ApiSprint[];
}

function SprintSection({ sprint, onTaskClick, onMoveToBacklog, onMoveToSprint, allSprints }: SprintSectionProps) {
  const [collapsed, setCollapsed] = useState(sprint.status === 'completed');

  const tasks = (sprint.tasks ?? []).map(toUITask);
  const totalPoints = tasks.reduce((a, t) => a + t.points, 0);
  const donePoints = tasks.filter((t) => t.status === 'DONE').reduce((a, t) => a + t.points, 0);
  const capacity = Math.max(totalPoints, 1);
  const pct = Math.round((totalPoints / capacity) * 100);
  const donePct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  const statusColor = sprint.status === 'active'
    ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
    : sprint.status === 'planning' || sprint.status === 'planned'
    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    : 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex cursor-pointer items-center gap-3 px-4 py-3" onClick={() => setCollapsed((v) => !v)}>
        {collapsed ? <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{sprint.name}</span>
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize', statusColor)}>
            {sprint.status === 'active' ? '● Active' : sprint.status === 'completed' ? '✓ Done' : '○ Planning'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {sprint.status === 'active' && totalPoints > 0 && (
            <div className="hidden sm:block w-20">
              <div className="mb-0.5 flex justify-between text-[10px] text-gray-400">
                <span>Done</span><span>{donePct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${donePct}%` }} />
              </div>
            </div>
          )}
          <span className="w-16 text-right text-xs text-gray-400">{tasks.length} tasks</span>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-gray-100 px-2 pb-2 pt-1 dark:border-gray-800">
          {tasks.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">No tasks in this sprint yet.</p>
          ) : (
            tasks.map((task) => (
              <BacklogRow
                key={task.id}
                task={task}
                onClick={onTaskClick}
                sprints={allSprints}
                onMoveToBacklog={() => onMoveToBacklog(task.id)}
                onMoveToSprint={(taskId, sid) => onMoveToSprint(taskId, sid)}
                showMoveToBacklog={true}
              />
            ))
          )}
          <div className="mt-1 px-3">
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add task to sprint
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
interface Props {
  orgId: string;
  projectId: string;
  onTaskClick: (task: Task) => void;
}

export function BacklogView({ orgId, projectId, onTaskClick }: Props) {
  const [backlogCollapsed, setBacklogCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const { data: sprints = [], isLoading: sprintsLoading } = useSprints(orgId, projectId);
  const { data: backlogData, isLoading: backlogLoading } = useTasks(orgId, projectId, 'backlog');
  const assignToSprint = useAssignTaskToSprint(orgId, projectId);

  const backlogTasks = (backlogData?.items ?? []).map(toUITask);
  const filteredBacklog = backlogTasks.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totalBacklogPoints = backlogTasks.reduce((a, t) => a + t.points, 0);

  const handleMoveToBacklog = (taskId: string) => {
    void assignToSprint.mutateAsync({ taskId, sprintId: null });
  };

  const handleMoveToSprint = (taskId: string, sprintId: string) => {
    void assignToSprint.mutateAsync({ taskId, sprintId });
  };

  if (sprintsLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
        <span className="text-sm">Loading sprints…</span>
      </div>
    );
  }

  const activeSprint = sprints.find((s) => s.status === 'active');

  return (
    <div className="flex gap-4">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        {/* Sprints */}
        {sprints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
            <p className="text-sm font-medium text-gray-500">No sprints yet</p>
            <p className="mt-1 text-xs text-gray-400">Create a sprint to start planning</p>
          </div>
        ) : (
          sprints.map((sprint) => (
            <SprintSection
              key={sprint.id}
              sprint={sprint}
              onTaskClick={onTaskClick}
              onMoveToBacklog={handleMoveToBacklog}
              onMoveToSprint={handleMoveToSprint}
              allSprints={sprints}
            />
          ))
        )}

        {/* Backlog */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div
            className="flex cursor-pointer items-center gap-3 px-4 py-3"
            onClick={() => setBacklogCollapsed((v) => !v)}
          >
            {backlogCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            <Archive className="h-4 w-4 text-gray-400" />
            <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200">Backlog</span>
            <span className="text-xs text-gray-400">{backlogTasks.length} items · {totalBacklogPoints} pts</span>
          </div>

          {!backlogCollapsed && (
            <div className="border-t border-gray-100 px-2 pb-2 pt-2 dark:border-gray-800">
              <div className="mb-2 px-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search backlog…"
                  className="h-7 w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              {backlogLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : filteredBacklog.length === 0 ? (
                <p className="py-4 text-center text-xs text-gray-400">
                  {search ? 'No items match your search.' : 'No backlog items.'}
                </p>
              ) : (
                filteredBacklog.map((task) => (
                  <BacklogRow
                    key={task.id}
                    task={task}
                    onClick={onTaskClick}
                    sprints={sprints}
                    onMoveToSprint={handleMoveToSprint}
                  />
                ))
              )}
              <div className="mt-1 px-3">
                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add to backlog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: stats */}
      <div className="hidden w-52 flex-shrink-0 flex-col gap-3 xl:flex">
        <VelocityBar sprints={sprints} />

        {/* Active sprint summary */}
        {activeSprint && (() => {
          const tasks = (activeSprint.tasks ?? []).map(toUITask);
          const done = tasks.filter((t) => t.status === 'DONE').length;
          const inProg = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
          const todo = tasks.filter((t) => t.status === 'TODO').length;
          const daysLeft = Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / 86400000));
          return (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Sprint</p>
              </div>
              <p className="mb-3 text-xs text-gray-500">{(activeSprint.name.split('—')[0] ?? activeSprint.name).trim()}</p>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Done', val: done, color: 'text-green-600' },
                  { label: 'In progress', val: inProg, color: 'text-blue-600' },
                  { label: 'To do', val: todo, color: 'text-gray-500' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className={cn('font-semibold', color)}>{val}</span>
                  </div>
                ))}
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Days left</span>
                  <span className={cn('font-semibold', daysLeft <= 2 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300')}>{daysLeft}d</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Legend */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Story points</p>
          {[
            { label: '1–2  (XS)', cls: 'bg-green-100 text-green-700' },
            { label: '3–5  (S/M)', cls: 'bg-blue-100 text-blue-700' },
            { label: '6–8  (L)', cls: 'bg-orange-100 text-orange-700' },
            { label: '13+  (XL)', cls: 'bg-red-100 text-red-700' },
          ].map(({ label, cls }) => (
            <div key={label} className="mb-1 flex items-center gap-2">
              <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-semibold', cls)}>#</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
