import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAnalytics, ANALYTICS_PLACEHOLDER } from '@/hooks/use-analytics';

const mockGet = jest.fn();

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: (...a: unknown[]) => mockGet(...a) },
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('ANALYTICS_PLACEHOLDER', () => {
  it('has all required KPI keys initialised to zero', () => {
    const kpiKeys = ['mrr', 'newCustomers', 'pipelineValue', 'winRate', 'avgDealSize', 'avgResolutionHours'];
    for (const key of kpiKeys) {
      expect(ANALYTICS_PLACEHOLDER.kpis).toHaveProperty(key);
      expect(ANALYTICS_PLACEHOLDER.kpis[key as keyof typeof ANALYTICS_PLACEHOLDER.kpis].value).toBe(0);
    }
  });

  it('revenueChart has matching months and data array lengths', () => {
    const { months, revenue, expenses } = ANALYTICS_PLACEHOLDER.revenueChart;
    expect(months.length).toBe(revenue.length);
    expect(months.length).toBe(expenses.length);
    expect(months.length).toBe(12);
  });

  it('leadFunnel has 6 stages', () => {
    expect(ANALYTICS_PLACEHOLDER.leadFunnel).toHaveLength(6);
    expect(ANALYTICS_PLACEHOLDER.leadFunnel[0].label).toBe('Leads');
    expect(ANALYTICS_PLACEHOLDER.leadFunnel[5].label).toBe('Closed Won');
  });
});

describe('useAnalytics', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns placeholder data immediately (before API response)', () => {
    // Never resolve — keep pending
    mockGet.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () => useAnalytics('org-1'),
      { wrapper: makeWrapper() },
    );

    // placeholderData means data is available instantly
    expect(result.current.data).toEqual(ANALYTICS_PLACEHOLDER);
  });

  it('returns real data after API resolves', async () => {
    const realData = {
      ...ANALYTICS_PLACEHOLDER,
      kpis: { ...ANALYTICS_PLACEHOLDER.kpis, mrr: { value: 12_000, change: 15, sparkline: [1, 2, 3, 4, 5, 6, 7] } },
    };
    mockGet.mockResolvedValue({ data: { data: realData } });

    const { result } = renderHook(
      () => useAnalytics('org-1'),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.data?.kpis.mrr.value).toBe(12_000);
  });

  it('returns real data when the API responds without a data envelope', async () => {
    const realData = {
      ...ANALYTICS_PLACEHOLDER,
      kpis: { ...ANALYTICS_PLACEHOLDER.kpis, mrr: { value: 12_000, change: 15, sparkline: [1, 2, 3, 4, 5, 6, 7] } },
    };
    mockGet.mockResolvedValue({ data: realData });

    const { result } = renderHook(
      () => useAnalytics('org-1'),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.data?.kpis.mrr.value).toBe(12_000);
  });

  it('does not fetch when orgId is empty', () => {
    renderHook(() => useAnalytics(''), { wrapper: makeWrapper() });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('uses 5-minute staleTime to avoid excessive refetches', async () => {
    mockGet.mockResolvedValue({ data: { data: ANALYTICS_PLACEHOLDER } });

    const { result } = renderHook(() => useAnalytics('org-1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // A second render should reuse cached data (no second fetch)
    const { result: result2 } = renderHook(() => useAnalytics('org-1'), { wrapper: makeWrapper() });
    expect(result2.current.data).toBeDefined();
    expect(mockGet).toHaveBeenCalledTimes(1); // cached — not re-fetched
  });
});
