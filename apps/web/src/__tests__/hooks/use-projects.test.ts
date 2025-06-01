import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useProjects, useProject, useCreateProject,
  useTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask,
  useSprints, useAssignTaskToSprint,
  type ApiProject, type ApiTask, type ApiSprint,
} from '@/hooks/use-projects';

const mockGet   = jest.fn();
const mockPost  = jest.fn();
const mockPatch = jest.fn();
const mockDel   = jest.fn();

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get:    (...a: unknown[]) => mockGet(...a),
    post:   (...a: unknown[]) => mockPost(...a),
    patch:  (...a: unknown[]) => mockPatch(...a),
    delete: (...a: unknown[]) => mockDel(...a),
  },
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const MOCK_PROJECT: ApiProject = {
  id: 'proj-1', orgId: 'org-1', name: 'Alpha Project',
  description: null, status: 'active', ownerId: null,
  startDate: null, endDate: null,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

const MOCK_TASK: ApiTask = {
  id: 'task-1', projectId: 'proj-1', orgId: 'org-1', title: 'Build feature',
  description: null, status: 'todo', priority: 'medium',
  assigneeId: null, dueDate: null, tags: [], points: null,
  sprintId: null, estimatedHours: null,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

const MOCK_SPRINT: ApiSprint = {
  id: 'sprint-1', projectId: 'proj-1', name: 'Sprint 1',
  goal: null, startDate: '2024-01-01', endDate: '2024-01-14',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

describe('useProjects', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches project list', async () => {
    mockGet.mockResolvedValue({ data: { data: { items: [MOCK_PROJECT], total: 1, page: 1, totalPages: 1 } } });
    const { result } = renderHook(() => useProjects({ orgId: 'org-1' }), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0].name).toBe('Alpha Project');
  });

  it('does not fetch when orgId is empty', () => {
    renderHook(() => useProjects({ orgId: '' }), { wrapper: makeWrapper() });
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('useCreateProject', () => {
  afterEach(() => jest.clearAllMocks());

  it('POSTs to /projects', async () => {
    mockPost.mockResolvedValue({ data: { data: MOCK_PROJECT } });
    const { result } = renderHook(() => useCreateProject('org-1'), { wrapper: makeWrapper() });
    act(() => { result.current.mutate({ name: 'Alpha Project' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [endpoint, body] = mockPost.mock.calls[0] as [string, { name: string }];
    expect(endpoint).toBe('/projects');
    expect(body.name).toBe('Alpha Project');
  });
});

describe('useTasks', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches tasks for a project', async () => {
    mockGet.mockResolvedValue({ data: { data: { items: [MOCK_TASK], total: 1 } } });
    const { result } = renderHook(() => useTasks('org-1', 'proj-1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0].title).toBe('Build feature');
  });
});

describe('useUpdateTaskStatus', () => {
  afterEach(() => jest.clearAllMocks());

  it('PATCHes task status', async () => {
    mockPatch.mockResolvedValue({ data: { data: { ...MOCK_TASK, status: 'in_progress' } } });
    const { result } = renderHook(() => useUpdateTaskStatus('org-1', 'proj-1'), { wrapper: makeWrapper() });
    act(() => { result.current.mutate({ id: 'task-1', status: 'in_progress' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [endpoint] = mockPatch.mock.calls[0] as [string];
    expect(endpoint).toContain('task-1');
    expect(endpoint).toContain('status');
  });
});

describe('useDeleteTask', () => {
  afterEach(() => jest.clearAllMocks());

  it('DELETEs the task', async () => {
    mockDel.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useDeleteTask('org-1', 'proj-1'), { wrapper: makeWrapper() });
    act(() => { result.current.mutate('task-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [endpoint] = mockDel.mock.calls[0] as [string];
    expect(endpoint).toContain('task-1');
  });
});

describe('useSprints', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches sprints for a project', async () => {
    mockGet.mockResolvedValue({ data: { data: [MOCK_SPRINT] } });
    const { result } = renderHook(() => useSprints('org-1', 'proj-1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].name).toBe('Sprint 1');
  });
});

describe('useAssignTaskToSprint', () => {
  afterEach(() => jest.clearAllMocks());

  it('patches task with sprintId', async () => {
    mockPatch.mockResolvedValue({ data: { data: { ...MOCK_TASK, sprintId: 'sprint-1' } } });
    const { result } = renderHook(() => useAssignTaskToSprint('org-1', 'proj-1'), { wrapper: makeWrapper() });
    act(() => { result.current.mutate({ taskId: 'task-1', sprintId: 'sprint-1' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, body] = mockPatch.mock.calls[0] as [string, { sprintId: string }];
    expect(body.sprintId).toBe('sprint-1');
  });

  it('can unassign task from sprint by passing null sprintId', async () => {
    mockPatch.mockResolvedValue({ data: { data: { ...MOCK_TASK, sprintId: null } } });
    const { result } = renderHook(() => useAssignTaskToSprint('org-1', 'proj-1'), { wrapper: makeWrapper() });
    act(() => { result.current.mutate({ taskId: 'task-1', sprintId: null }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, body] = mockPatch.mock.calls[0] as [string, { sprintId: null }];
    expect(body.sprintId).toBeNull();
  });
});
