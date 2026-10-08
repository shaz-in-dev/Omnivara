'use client';
import { useState, useEffect } from 'react';
import {
  Calendar, User, Tag, MessageSquare, Paperclip,
  CheckSquare, Clock, Edit2, Trash2, Send, Plus,
} from 'lucide-react';
import { SlideOver } from '@/components/shared/slide-over';
import { useTaskComments, useCreateTaskComment, useTaskChecklist, useCreateChecklistItem, useUpdateChecklistItem } from '@/hooks/use-task-items';
import { useUpdateTask } from '@/hooks/use-projects';
import { useMembers } from '@/hooks/use-members';
import type { Task, TaskPriority, TaskStatus } from './task-card';

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'TODO', label: 'To Do', color: 'text-gray-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-500' },
  { value: 'IN_REVIEW', label: 'In Review', color: 'text-purple-500' },
  { value: 'DONE', label: 'Done', color: 'text-green-500' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: 'LOW', label: 'Low', dot: 'bg-gray-300' },
  { value: 'MEDIUM', label: 'Medium', dot: 'bg-blue-400' },
  { value: 'HIGH', label: 'High', dot: 'bg-orange-400' },
  { value: 'URGENT', label: 'Urgent', dot: 'bg-red-500' },
];

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500',
];

function avatarColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'bg-brand-500';
}

interface Props {
  orgId: string;
  projectId: string;
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export function TaskDetail({ orgId, projectId, task, open, onClose, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assigneeId: '',
  });
  const [saveError, setSaveError] = useState('');
  const [comment, setComment] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [tab, setTab] = useState<'overview' | 'comments' | 'activity'>('overview');

  useEffect(() => {
    setEditing(false);
    setSaveError('');
  }, [task?.id]);

  const effectiveTask = task;

  const { data: comments = [], isLoading: commentsLoading } = useTaskComments(
    orgId, projectId, effectiveTask?.id ?? '',
  );
  const { data: members = [], isLoading: membersLoading } = useMembers(orgId);
  const updateTask = useUpdateTask(orgId, projectId);
  const createComment = useCreateTaskComment(orgId, projectId);
  const { data: checklist = [], isLoading: checklistLoading } = useTaskChecklist(
    orgId, projectId, effectiveTask?.id ?? '',
  );
  const createChecklistItem = useCreateChecklistItem(orgId, projectId);
  const updateChecklistItem = useUpdateChecklistItem(orgId, projectId, effectiveTask?.id ?? '');

  if (!effectiveTask) return null;

  const beginEditing = () => {
    setSaveError('');
    setEditValues({
      title: effectiveTask.title,
      description: effectiveTask.description ?? '',
      dueDate: effectiveTask.dueDate ? effectiveTask.dueDate.slice(0, 10) : '',
      status: effectiveTask.status,
      priority: effectiveTask.priority,
      assigneeId: effectiveTask.assignee?.id ?? '',
    });
    setEditing(true);
  };

  const currentValues = {
    title: effectiveTask.title,
    description: effectiveTask.description ?? '',
    dueDate: effectiveTask.dueDate ? effectiveTask.dueDate.slice(0, 10) : '',
    status: effectiveTask.status,
    priority: effectiveTask.priority,
    assigneeId: effectiveTask.assignee?.id ?? '',
  };

  const saveTask = async (values = currentValues) => {
    setSaveError('');
    try {
      const updated = await updateTask.mutateAsync({
        id: effectiveTask.id,
        title: values.title.trim(),
        description: values.description.trim() || null,
        dueDate: values.dueDate ? new Date(`${values.dueDate}T00:00:00`).toISOString() : null,
        status: ({
          TODO: 'todo',
          IN_PROGRESS: 'in_progress',
          IN_REVIEW: 'in_review',
          DONE: 'done',
        } as const)[values.status],
        priority: ({
          LOW: 'low',
          MEDIUM: 'medium',
          HIGH: 'high',
          URGENT: 'critical',
        } as const)[values.priority],
        assigneeId: values.assigneeId || null,
      });
      const nameParts = (updated.assignee?.name ?? '').trim().split(/\s+/);
      const { assignee: _previousAssignee, ...taskWithoutAssignee } = effectiveTask;
      onUpdate?.({
        ...taskWithoutAssignee,
        id: updated.id,
        title: updated.title,
        ...(updated.description ? { description: updated.description } : {}),
        ...(updated.dueDate ? { dueDate: updated.dueDate } : {}),
        status: ({
          backlog: 'TODO',
          todo: 'TODO',
          in_progress: 'IN_PROGRESS',
          in_review: 'IN_REVIEW',
          done: 'DONE',
          cancelled: 'DONE',
        } as const)[updated.status],
        priority: ({
          low: 'LOW',
          medium: 'MEDIUM',
          high: 'HIGH',
          critical: 'URGENT',
        } as const)[updated.priority],
        ...(updated.assignee ? {
          assignee: {
            id: updated.assignee.id,
            firstName: nameParts[0] ?? '',
            lastName: nameParts.slice(1).join(' '),
          },
        } : {}),
      });
      setEditing(false);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setSaveError(Array.isArray(message) ? message.join(', ') : message ?? 'Could not save task changes. Please try again.');
    }
  };

  const doneCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;

  const sendComment = async () => {
    if (!comment.trim()) return;
    await createComment.mutateAsync({ taskId: effectiveTask.id, content: comment.trim() });
    setComment('');
  };

  const addChecklistItem = async () => {
    if (!newChecklistText.trim()) return;
    await createChecklistItem.mutateAsync({ taskId: effectiveTask.id, text: newChecklistText.trim() });
    setNewChecklistText('');
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={effectiveTask.title}
      subtitle={`Task · ${effectiveTask.status.replace('_', ' ')}`}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => { setEditing(false); setSaveError(''); }}
                  disabled={updateTask.isPending}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void saveTask()}
                  disabled={!editValues.title.trim() || updateTask.isPending}
                  className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {updateTask.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </>
            ) : (
              <button
                onClick={beginEditing}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            <button
              onClick={() => { onDelete?.(effectiveTask.id); onClose(); }}
              disabled={updateTask.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
          <button
            onClick={() => void saveTask({ ...currentValues, status: 'DONE' })}
            disabled={effectiveTask.status === 'DONE' || updateTask.isPending || editing}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
          >
            <CheckSquare className="h-4 w-4" />
            {effectiveTask.status === 'DONE' ? 'Completed ✓' : 'Mark complete'}
          </button>
        </div>
      }
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {saveError && (
          <p role="alert" className="mx-6 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {saveError}
          </p>
        )}
        {/* Status + Priority row */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <div className="relative">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-400">Status</label>
            {editing ? (
              <select
                value={editValues.status}
                onChange={(e) => setEditValues((v) => ({ ...v, status: e.target.value as TaskStatus }))}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            ) : (
              <span className="block rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {STATUS_OPTIONS.find((s) => s.value === effectiveTask.status)?.label}
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-400">Priority</label>
            {editing ? (
              <select
                value={editValues.priority}
                onChange={(e) => setEditValues((v) => ({ ...v, priority: e.target.value as TaskPriority }))}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            ) : (
              <span className="block rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {PRIORITY_OPTIONS.find((p) => p.value === effectiveTask.priority)?.label}
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-4 px-6 py-4 text-sm">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">Assignee</p>
            {editing ? (
              <select
                aria-label="Assignee"
                value={editValues.assigneeId}
                onChange={(e) => setEditValues((v) => ({ ...v, assigneeId: e.target.value }))}
                disabled={membersLoading}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-brand-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">{membersLoading ? 'Loading members…' : 'Unassigned'}</option>
                {members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                {effectiveTask.assignee ? (
                  <>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                      {effectiveTask.assignee.firstName[0]}{effectiveTask.assignee.lastName[0]}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{effectiveTask.assignee.firstName} {effectiveTask.assignee.lastName}</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-gray-400"><User className="h-4 w-4" /> Unassigned</span>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">Due date</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-300" />
              {editing ? (
                <input
                  aria-label="Due date"
                  type="date"
                  value={editValues.dueDate}
                  onChange={(e) => setEditValues((v) => ({ ...v, dueDate: e.target.value }))}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              ) : effectiveTask.dueDate ? (
                <span className={`${new Date(effectiveTask.dueDate) < new Date() && effectiveTask.status !== 'DONE' ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {new Date(effectiveTask.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              ) : (
                <span className="text-gray-400">No due date</span>
              )}
            </div>
          </div>
          {effectiveTask.tags && effectiveTask.tags.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">Tags</p>
              <div className="flex flex-wrap gap-1">
                {effectiveTask.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    <Tag className="h-2.5 w-2.5" />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 dark:border-gray-800">
          {(['overview', 'comments', 'activity'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px mr-5 border-b-2 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
              {t === 'comments' && comments.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] dark:bg-gray-800">{comments.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-5 px-6 py-5">
            {/* Description */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Description</p>
              {editing ? (
                <div>
                  <input
                    aria-label="Task title"
                    value={editValues.title}
                    onChange={(e) => setEditValues((v) => ({ ...v, title: e.target.value }))}
                    className="mb-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <textarea
                    aria-label="Task description"
                    value={editValues.description}
                    onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
                    rows={4}
                    placeholder="Add a description…"
                    className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              ) : effectiveTask.description ? (
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{effectiveTask.description}</p>
              ) : (
                <p className="text-sm text-gray-400">No description</p>
              )}
            </div>

            {/* Checklist */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Checklist</p>
                <span className="text-xs text-gray-400">{doneCount}/{totalCount}</span>
              </div>
              {totalCount > 0 && (
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              )}
              {checklistLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-6 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => void updateChecklistItem.mutateAsync({ itemId: item.id, done: !item.done })}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 accent-brand-500"
                      />
                      <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                  {/* Add item */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void addChecklistItem(); }}
                      placeholder="Add checklist item…"
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      onClick={() => void addChecklistItem()}
                      disabled={!newChecklistText.trim() || createChecklistItem.isPending}
                      className="flex items-center gap-1 rounded-lg bg-brand-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments placeholder */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Attachments</p>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:border-gray-700">
                <Paperclip className="h-4 w-4" />
                Drop files here or click to upload
              </button>
            </div>
          </div>
        )}

        {tab === 'comments' && (
          <div className="flex flex-col px-6 py-5">
            <div className="flex-1 space-y-4">
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
                </div>
              ) : comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No comments yet. Add one below.</p>
              ) : (
                comments.map((c) => {
                  const color = avatarColor(c.authorId);
                  const name = c.author?.name ?? c.authorId.slice(0, 6);
                  const initials = name.split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{c.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-5 flex items-end gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment… (Enter to send)"
                rows={2}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendComment(); } }}
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={() => void sendComment()}
                disabled={!comment.trim() || createComment.isPending}
                className="rounded-xl bg-brand-500 p-2.5 text-white hover:bg-brand-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="px-6 py-5">
            <ol className="relative space-y-4 border-l border-gray-100 pl-5 dark:border-gray-800">
              {[
                { text: 'Task created', time: effectiveTask.dueDate ?? effectiveTask.id, author: 'System' },
              ].map((act, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Clock className="h-2.5 w-2.5 text-gray-400" />
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{act.text}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{act.author}</p>
                </li>
              ))}
              {/* Real comments as activity items */}
              {comments.map((c) => (
                <li key={`act-${c.id}`} className="relative">
                  <span className="absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
                    <MessageSquare className="h-2.5 w-2.5 text-brand-500" />
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Comment: "{c.content.slice(0, 60)}{c.content.length > 60 ? '…' : ''}"
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {c.author?.name ?? 'You'} · {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </SlideOver>
  );
}
