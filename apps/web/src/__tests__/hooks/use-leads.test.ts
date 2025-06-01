import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLeads, useCreateLead, useDeleteLead, type Lead } from '@/hooks/use-leads';

// ── Mock api ──────────────────────────────────────────────────────────────────
const mockGet  = jest.fn();
const mockPost = jest.fn();
const mockDel  = jest.fn();

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: (...a: unknown[]) => mockGet(...a), post: (...a: unknown[]) => mockPost(...a), delete: (...a: unknown[]) => mockDel(...a) },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const MOCK_LEAD: Lead = {
  id: 'lead-1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: null,
  company: 'Acme',
  title: null,
  status: 'new',
  source: null,
  notes: null,
  ownerId: null,
  orgId: 'org-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useLeads', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches leads and returns them', async () => {
    mockGet.mockResolvedValue({
      data: { data: { items: [MOCK_LEAD], total: 1, page: 1, totalPages: 1 } },
    });

    const { result } = renderHook(
      () => useLeads({ orgId: 'org-1' }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].name).toBe('Alice Smith');
  });

  it('passes status filter as query param', async () => {
    mockGet.mockResolvedValue({ data: { data: { items: [], total: 0, page: 1, totalPages: 0 } } });

    renderHook(
      () => useLeads({ orgId: 'org-1', status: 'qualified' }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    const [, config] = mockGet.mock.calls[0] as [string, { params: Record<string, unknown> }];
    expect(config.params.status).toBe('qualified');
  });

  it('does not fetch when orgId is empty', () => {
    renderHook(
      () => useLeads({ orgId: '' }),
      { wrapper: makeWrapper() },
    );
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('handles API error gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useLeads({ orgId: 'org-1' }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useCreateLead', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts to /crm/leads and returns created lead', async () => {
    mockPost.mockResolvedValue({ data: { data: MOCK_LEAD } });

    const { result } = renderHook(
      () => useCreateLead('org-1'),
      { wrapper: makeWrapper() },
    );

    result.current.mutate({ name: 'Alice Smith' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = mockPost.mock.calls[0] as [string, unknown];
    expect(endpoint).toBe('/crm/leads');
    expect((body as { name: string }).name).toBe('Alice Smith');
  });
});

describe('useDeleteLead', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends DELETE to /crm/leads/:id', async () => {
    mockDel.mockResolvedValue({ data: {} });

    const { result } = renderHook(
      () => useDeleteLead('org-1'),
      { wrapper: makeWrapper() },
    );

    result.current.mutate('lead-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint] = mockDel.mock.calls[0] as [string];
    expect(endpoint).toBe('/crm/leads/lead-1');
  });
});
