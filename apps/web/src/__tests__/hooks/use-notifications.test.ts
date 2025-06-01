import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNotifications, useMarkRead, useMarkAllRead, useDismiss } from '@/hooks/use-notifications';

const mockGet   = jest.fn();
const mockPatch = jest.fn();
const mockDel   = jest.fn();

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get:    (...a: unknown[]) => mockGet(...a),
    patch:  (...a: unknown[]) => mockPatch(...a),
    delete: (...a: unknown[]) => mockDel(...a),
  },
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const MOCK_NOTIFICATION = {
  id: 'notif-1',
  type: 'task_assigned',
  title: 'Task assigned',
  body: 'You have been assigned Task #42',
  read: false,
  createdAt: new Date().toISOString(),
};

describe('useNotifications', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches notifications for org and user', async () => {
    mockGet.mockResolvedValue({ data: { data: [MOCK_NOTIFICATION] } });

    const { result } = renderHook(
      () => useNotifications({ orgId: 'org-1', userId: 'user-1' }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].title).toBe('Task assigned');
  });

  it('does not fetch when orgId is empty', () => {
    renderHook(
      () => useNotifications({ orgId: '', userId: 'user-1' }),
      { wrapper: makeWrapper() },
    );
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('useMarkRead', () => {
  afterEach(() => jest.clearAllMocks());

  it('PATCHes notification to mark as read', async () => {
    mockPatch.mockResolvedValue({ data: { ...MOCK_NOTIFICATION, read: true } });

    const { result } = renderHook(
      () => useMarkRead('org-1'),
      { wrapper: makeWrapper() },
    );

    act(() => { result.current.mutate('notif-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint] = mockPatch.mock.calls[0] as [string];
    expect(endpoint).toContain('notif-1');
    expect(endpoint).toContain('read');
  });
});

describe('useMarkAllRead', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends mark-all-read request', async () => {
    mockPatch.mockResolvedValue({ data: { count: 5 } });

    const { result } = renderHook(
      () => useMarkAllRead('org-1'),
      { wrapper: makeWrapper() },
    );

    act(() => { result.current.mutate(); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPatch).toHaveBeenCalledTimes(1);
  });
});

describe('useDismiss', () => {
  afterEach(() => jest.clearAllMocks());

  it('DELETEs notification by id', async () => {
    mockDel.mockResolvedValue({ data: {} });

    const { result } = renderHook(
      () => useDismiss('org-1'),
      { wrapper: makeWrapper() },
    );

    act(() => { result.current.mutate('notif-1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint] = mockDel.mock.calls[0] as [string];
    expect(endpoint).toContain('notif-1');
  });
});
