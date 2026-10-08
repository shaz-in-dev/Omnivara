'use client';
import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, GitBranch, Loader2, FolderKanban } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { KanbanBoard } from '@/components/projects/kanban-board';
import { TaskListView } from '@/components/projects/task-list-view';
import { BacklogView } from '@/components/projects/backlog-view';
import { TaskDetail } from '@/components/projects/task-detail';
import { CreateTaskModal } from '@/components/projects/create-task-modal';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/components/projects/task-card';
import { useAuthStore } from '@/stores/auth.store';
import { SampleDataBanner } from '@/components/onboarding/sample-data-banner';
import {
  useProjects,
  useTasks,
  useUpdateTaskStatus,
  useCreateTask,
  useDeleteTask,
  useCreateProject,
  type ApiTask,
} from '@/hooks/use-projects';

type ViewMode = 'board' | 'list' | 'backlog';

// ── Status / priority normalization ───────────────────────────────────────────

function toTaskStatus(s: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    todo:        'TODO',
    in_progress: 'IN_PROGRESS',
    in_review:   'IN_REVIEW',
    done:        'DONE',
    backlog:     'TODO',
    cancelled:   'DONE',
  };
  return map[s] ?? 'TODO';
}

function toApiStatus(s: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    TODO:        'todo',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW:   'in_review',
    DONE:        'done',
  };
  return map[s];
}

function toTaskPriority(p: string): TaskPriority {
  const map: Record<string, TaskPriority> = {
    low:    'LOW',
    medium: 'MEDIUM',
    high:   'HIGH',
    critical: 'URGENT',
    urgent: 'URGENT',
  };
  return map[p] ?? 'MEDIUM';
}

function toUITask(apiTask: ApiTask): Task {
  const nameParts = (apiTask.assignee?.name ?? '').trim().split(/\s+/);
  return {
    id: apiTask.id,
    title: apiTask.title,
    ...(apiTask.description ? { description: apiTask.description } : {}),
    status: toTaskStatus(apiTask.status),
    priority: toTaskPriority(apiTask.priority),
    ...(apiTask.dueDate ? { dueDate: apiTask.dueDate } : {}),
    ...(apiTask.assignee
      ? {
          assignee: {
            id: apiTask.assignee.id,
            firstName: nameParts[0] ?? '',
            lastName: nameParts.slice(1).join(' '),
          },
        }
      : {}),
    ...(apiTask.tags?.length ? { tags: apiTask.tags } : {}),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [view, setView] = useState<ViewMode>('board');
  const [activeProjectId, setActiveProjectId] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>('TODO');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useProjects({ orgId });
  const projects = projectsData?.items ?? [];

  // Auto-select the first project once loaded
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0]?.id ?? '');
    }
  }, [projects, activeProjectId]);

  const { data: tasksData, isLoading: tasksLoading } = useTasks(orgId, activeProjectId);
  const apiTasks = tasksData?.items ?? [];
  const uiTasks: Task[] = apiTasks.map(toUITask);

  const updateStatus  = useUpdateTaskStatus(orgId, activeProjectId);
  const createTask    = useCreateTask(orgId, activeProjectId);
  const deleteTask    = useDeleteTask(orgId, activeProjectId);
  const createProject = useCreateProject(orgId);

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleTaskDrop = (taskId: string, newStatus: TaskStatus) => {
    updateStatus.mutate({ id: taskId, status: toApiStatus(newStatus) });
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateStatus.mutate({ id: taskId, status: toApiStatus(newStatus) });
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateTaskStatus(status);
    setCreateTaskOpen(true);
  };

  const handleCreateTask = async (payload: { title: string; status: string; priority: string; description?: string }) => {
    await createTask.mutateAsync(payload);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate(id);
    setDetailOpen(false);
  };

  const handleCreateProject = async (payload: { name: string; description?: string }) => {
    const proj = await createProject.mutateAsync(payload);
    setActiveProjectId(proj.id);
  };

  const viewButtons: { id: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { id: 'board',   icon: LayoutGrid, label: 'Board' },
    { id: 'list',    icon: List,       label: 'List' },
    { id: 'backlog', icon: GitBranch,  label: 'Backlog' },
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Sample data banner */}
      <SampleDataBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Kanban boards, sprints, and backlog</p>
        </div>
        <button
          onClick={() => setCreateProjectOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Project tabs + view switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3 dark:border-gray-800">
        <div className="flex gap-1 overflow-x-auto">
          {projectsLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : projects.length === 0 ? (
            <span className="px-3 py-1.5 text-sm text-gray-400">No projects yet</span>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  activeProjectId === p.id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {p.name}
              </button>
            ))
          )}
        </div>

        <div className="flex rounded-xl border border-gray-200 p-0.5 dark:border-gray-700">
          {viewButtons.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              title={label}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                view === id
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* No project — empty state with CTA */}
      {!activeProjectId && !projectsLoading && (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="No projects yet"
          description="Create your first project to start tracking work."
          action={{ label: '+ New project', onClick: () => setCreateProjectOpen(true), icon: <Plus className="h-4 w-4" /> }}
          className="flex-1"
        />
      )}

      {/* Loading tasks */}
      {activeProjectId && tasksLoading && (
        <div className="flex h-48 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span className="text-sm">Loading tasks…</span>
        </div>
      )}

      {/* Board view */}
      {view === 'board' && activeProjectId && !tasksLoading && (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            projectId={activeProjectId}
            tasks={uiTasks}
            onTaskClick={openTask}
            onTaskDrop={handleTaskDrop}
            onAddTask={handleAddTask}
          />
        </div>
      )}

      {/* List view */}
      {view === 'list' && activeProjectId && !tasksLoading && (
        <div className="flex-1 overflow-auto">
          <TaskListView
            projectId={activeProjectId}
            tasks={uiTasks}
            onTaskClick={openTask}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* Backlog view */}
      {view === 'backlog' && activeProjectId && (
        <div className="flex-1 overflow-auto pb-4">
          <BacklogView
            orgId={orgId}
            projectId={activeProjectId}
            onTaskClick={openTask}
          />
        </div>
      )}

      {/* Task detail slide-over */}
      <TaskDetail
        orgId={orgId}
        projectId={activeProjectId}
        task={selectedTask}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={(updated) => setSelectedTask(updated)}
        onDelete={handleDeleteTask}
      />

      {/* Create task modal */}
      {createTaskOpen && (
        <CreateTaskModal
          defaultStatus={createTaskStatus}
          onClose={() => setCreateTaskOpen(false)}
          onSubmit={handleCreateTask}
          isPending={createTask.isPending}
        />
      )}

      {/* Create project modal */}
      {createProjectOpen && (
        <CreateProjectModal
          onClose={() => setCreateProjectOpen(false)}
          onSubmit={handleCreateProject}
          isPending={createProject.isPending}
        />
      )}
    </div>
  );
}
