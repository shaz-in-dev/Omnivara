import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSubscription, useBillingUsage, useCreateCheckout, useCreatePortal, PLAN_DETAILS } from '@/hooks/use-billing';

const mockGet  = jest.fn();
const mockPost = jest.fn();

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get:  (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

// Save and restore window.location
const originalLocation = window.location;
beforeAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: { href: '' } });
});
afterAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('PLAN_DETAILS', () => {
  it('contains all four plan tiers', () => {
    expect(Object.keys(PLAN_DETAILS)).toEqual(['starter', 'growth', 'business', 'enterprise']);
  });

  it('enterprise plan has price -1 (custom)', () => {
    expect(PLAN_DETAILS.enterprise.price).toBe(-1);
  });

  it('starter plan is free', () => {
    expect(PLAN_DETAILS.starter.price).toBe(0);
  });
});

describe('useSubscription', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches subscription data', async () => {
    const mockSub = { subscription: { id: 'sub-1', planId: 'growth', status: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: '2025-12-01T00:00:00Z', orgId: 'org-1' }, planId: 'growth' };
    mockGet.mockResolvedValue({ data: mockSub });

    const { result } = renderHook(() => useSubscription(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.planId).toBe('growth');
  });

  it('handles null subscription (free plan)', async () => {
    mockGet.mockResolvedValue({ data: { subscription: null, planId: 'starter' } });
    const { result } = renderHook(() => useSubscription(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.subscription).toBeNull();
  });
});

describe('useBillingUsage', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches usage data', async () => {
    mockGet.mockResolvedValue({
      data: { planId: 'growth', limits: { ai_credits_per_month: 1000 }, usage: { users: 3, ai_credits_used: 120, month: '2024-01' } },
    });

    const { result } = renderHook(() => useBillingUsage(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.usage.ai_credits_used).toBe(120);
  });
});

describe('useCreateCheckout', () => {
  afterEach(() => jest.clearAllMocks());

  it('POSTs to /billing/checkout and redirects to checkout URL', async () => {
    mockPost.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/pay/cs_test_123' } });

    const { result } = renderHook(() => useCreateCheckout(), { wrapper: makeWrapper() });

    act(() => { result.current.mutate('growth'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith('/billing/checkout', { planId: 'growth' });
    expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_test_123');
  });
});

describe('useCreatePortal', () => {
  afterEach(() => jest.clearAllMocks());

  it('POSTs to /billing/portal and opens URL in new tab', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    mockPost.mockResolvedValue({ data: { url: 'https://billing.stripe.com/session/bps_123' } });

    const { result } = renderHook(() => useCreatePortal(), { wrapper: makeWrapper() });
    act(() => { result.current.mutate(); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(openSpy).toHaveBeenCalledWith('https://billing.stripe.com/session/bps_123', '_blank');
    openSpy.mockRestore();
  });
});
