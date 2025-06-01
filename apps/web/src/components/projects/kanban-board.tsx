'use client';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard, type Task, type TaskStatus } from './task-card';
import { cn } from '@/lib/utils';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO',        label: 'To Do',       color: 'border-t-gray-300' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-400' },
  { id: 'IN_REVIEW',   label: 'In Review',   color: 'border-t-yellow-400' },
  { id: 'DONE',        label: 'Done',        color: 'border-t-green-400' },
];

interface Props {
  projectId?: string;
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
  /** Called after optimistic update — use to PATCH the API */
  onTaskDrop?: (taskId: string, newStatus: TaskStatus) => void;
}

export function KanbanBoard({ tasks = [], onTaskClick, onAddTask, onTaskDrop }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Sync when upstream tasks change (e.g. after API refetch)
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const getColumnTasks = (status: TaskStatus) =>
    localTasks.filter((t) => t.status === status);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    setDraggingId(task.id);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = localTasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) {
      setDraggingId(null);
      setOverColumn(null);
      return;
    }
    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
    );
    setDraggingId(null);
    setOverColumn(null);
    // Fire callback so parent can PATCH the API
    onTaskDrop?.(taskId, targetStatus);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colTasks = getColumnTasks(col.id);
        const isOver = overColumn === col.id;

        return (
          <div
            key={col.id}
            className={cn(
              'flex w-72 flex-shrink-0 flex-col rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50',
              'border-t-4',
              col.color,
              isOver && 'ring-2 ring-brand-400',
            )}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {col.label}
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask?.(col.id)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-3">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className="touch-none"
                >
                  <TaskCard
                    task={task}
                    isDragging={draggingId === task.id}
                    onClick={() => onTaskClick?.(task)}
                  />
                </div>
              ))}

              {/* Drop zone hint */}
              {isOver && (
                <div className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 py-6 text-center text-xs text-brand-500 dark:border-brand-700 dark:bg-brand-900/10">
                  Drop here
                </div>
              )}

              {colTasks.length === 0 && !isOver && (
                <button
                  onClick={() => onAddTask?.(col.id)}
                  className="w-full rounded-xl border-2 border-dashed border-gray-200 py-5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-500 dark:border-gray-700"
                >
                  + Add task
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
