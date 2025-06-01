'use client';
import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, CheckSquare, Square, Circle,
  Clock, AlertCircle, ArrowUpDown, User, Calendar, Tag,
  MoreHorizontal, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from './task-card';


/* ── Helpers ──────────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  TODO:        { label: 'To Do',       icon: Circle,      color: 'text-gray-400',   bg: 'bg-gray-100 dark:bg-gray-800' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock,       color: 'text-blue-500',   bg: 'bg-blue-50  dark:bg-blue-900/20' },
  IN_REVIEW:   { label: 'In Review',   icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  DONE:        { label: 'Done',        icon: CheckSquare, color: 'text-green-500',  bg: 'bg-green-50  dark:bg-green-900/20' },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW:    'bg-gray-300',
  MEDIUM: 'bg-blue-400',
  HIGH:   'bg-orange-400',
  URGENT: 'bg-red-500',
};

const PRIORITY_ORDER: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

type SortKey = 'title' | 'priority' | 'dueDate' | 'assignee';

/* ── Row ──────────────────────────────────────────────────────────────────── */
interface RowProps {
  task: Task;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function TaskRow({ task, selected, onSelect, onClick, onStatusChange }: RowProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusCfg = STATUS_CONFIG[task.status];
  const StatusIcon = statusCfg.icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <tr
      className={cn(
        'group border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50',
        selected && 'bg-brand-50/50 dark:bg-brand-900/10',
      )}
    >
      {/* Checkbox */}
      <td className="w-10 py-2.5 pl-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onSelect(task.id)}
          className="text-gray-300 hover:text-brand-500 transition-colors"
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-brand-500" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      </td>

      {/* Status */}
      <td className="w-8 py-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu((v) => !v)}
            className={cn('rounded-md p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700', statusCfg.color)}
          >
            <StatusIcon className="h-4 w-4" />
          </button>
          {showStatusMenu && (
            <div className="absolute left-0 top-8 z-20 w-40 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(task.id, s); setShowStatusMenu(false); }}
                    className={cn('flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700', cfg.color)}
                  >
                    <Icon className="h-3.5 w-3.5" /> {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </td>

      {/* Title */}
      <td
        className="min-w-0 cursor-pointer py-2.5 pr-4"
        onClick={() => onClick(task)}
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium text-gray-800 dark:text-gray-200', task.status === 'DONE' && 'line-through text-gray-400')}>
            {task.title}
          </span>
          {task.tags?.map((tag) => (
            <span key={tag} className="hidden rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 group-hover:inline-flex dark:bg-gray-700 dark:text-gray-400 items-center gap-0.5">
              <Tag className="h-2.5 w-2.5" />{tag}
            </span>
          ))}
        </div>
      </td>

      {/* Priority */}
      <td className="w-28 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[task.priority])} />
          <span className="text-xs text-gray-500 capitalize">{task.priority.toLowerCase()}</span>
        </div>
      </td>

      {/* Assignee */}
      <td className="w-36 py-2.5">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              {task.assignee.firstName[0]}{task.assignee.lastName[0]}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{task.assignee.firstName}</span>
          </div>
        ) : (
          <button className="flex items-center gap-1 text-xs text-gray-300 hover:text-brand-500">
            <User className="h-3.5 w-3.5" /> Assign
          </button>
        )}
      </td>

      {/* Due date */}
      <td className="w-32 py-2.5">
        {task.dueDate ? (
          <div className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-500' : 'text-gray-500')}>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="w-10 py-2.5 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

/* ── Group ────────────────────────────────────────────────────────────────── */
interface GroupProps {
  status: TaskStatus;
  tasks: Task[];
  selected: string[];
  onSelect: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function TaskGroup({ status, tasks, selected, onSelect, onTaskClick, onStatusChange }: GroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  return (
    <>
      <tr className={cn('border-b border-gray-100 dark:border-gray-800', cfg.bg)}>
        <td colSpan={7} className="py-2 pl-3 pr-4">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
            <StatusIcon className={cn('h-4 w-4', cfg.color)} />
            <span className={cn('font-semibold', cfg.color)}>{cfg.label}</span>
            <span className="ml-1 rounded-full bg-white/80 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700">{tasks.length}</span>
          </button>
        </td>
      </tr>
      {!collapsed && tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          selected={selected.includes(task.id)}
          onSelect={onSelect}
          onClick={onTaskClick}
          onStatusChange={onStatusChange}
        />
      ))}
      {!collapsed && (
        <tr className="border-b border-gray-100 dark:border-gray-800">
          <td colSpan={7} className="py-1.5 pl-16">
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
interface Props {
  projectId: string;
  tasks?: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export function TaskListView({ projectId: _projectId, tasks: tasksProp = [], onTaskClick, onStatusChange }: Props) {
  const [tasks, setTasks] = useState<Task[]>(tasksProp);
  const [selected, setSelected] = useState<string[]>([]);

  // Sync when upstream tasks update (e.g. after API refetch or project switch)
  useEffect(() => {
    setTasks(tasksProp);
    setSelected([]);
  }, [tasksProp]);
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState('');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelected((prev) => prev.length === tasks.length ? [] : tasks.map((t) => t.id));
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    onStatusChange?.(id, status);
  };

  const filtered = tasks.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortKey === 'dueDate') cmp = (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
    else if (sortKey === 'assignee') cmp = (a.assignee?.firstName ?? '').localeCompare(b.assignee?.firstName ?? '');
    return sortAsc ? cmp : -cmp;
  });

  const grouped = (Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => ({
    status,
    tasks: sorted.filter((t) => t.status === status),
  })).filter((g) => g.tasks.length > 0);

  const SortBtn = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn('flex items-center gap-1 text-xs font-medium uppercase tracking-wider', sortKey === k ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600')}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="h-8 w-56 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {selected.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800">
            <span className="text-gray-500">{selected.length} selected</span>
            <button className="text-red-500 hover:text-red-600">Delete</button>
            <button className="text-brand-600 hover:text-brand-700">Mark done</button>
          </div>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} tasks</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
              <th className="w-10 py-2.5 pl-4">
                <button onClick={handleSelectAll} className="text-gray-300 hover:text-brand-500">
                  {selected.length === tasks.length && tasks.length > 0
                    ? <CheckSquare className="h-4 w-4 text-brand-500" />
                    : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="w-8 py-2.5" />
              <th className="min-w-0 py-2.5 pr-4">
                <SortBtn label="Task" k="title" />
              </th>
              <th className="w-28 py-2.5"><SortBtn label="Priority" k="priority" /></th>
              <th className="w-36 py-2.5"><SortBtn label="Assignee" k="assignee" /></th>
              <th className="w-32 py-2.5"><SortBtn label="Due" k="dueDate" /></th>
              <th className="w-10 py-2.5 pr-3" />
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ status, tasks: groupTasks }) => (
              <TaskGroup
                key={status}
                status={status}
                tasks={groupTasks}
                selected={selected}
                onSelect={handleSelect}
                onTaskClick={onTaskClick}
                onStatusChange={handleStatusChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
