import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth.store';

const MOCK_USER = {
  id: 'u-1',
  email: 'test@example.com',
  name: 'Test User',
  orgId: 'org-1',
  emailVerified: true,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  describe('initial state', () => {
    it('starts unauthenticated with null user and tokens', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('sets user, tokens and marks authenticated', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuth(MOCK_USER, 'access-token-123', 'refresh-token-abc');
      });
      expect(result.current.user).toEqual(MOCK_USER);
      expect(result.current.accessToken).toBe('access-token-123');
      expect(result.current.refreshToken).toBe('refresh-token-abc');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('preserves existing refreshToken when new one is not provided', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuth(MOCK_USER, 'access-1', 'refresh-1');
      });
      act(() => {
        result.current.setAuth(MOCK_USER, 'access-2'); // no refreshToken
      });
      expect(result.current.refreshToken).toBe('refresh-1');
    });

    it('updates refreshToken when explicitly provided', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuth(MOCK_USER, 'access-1', 'refresh-1');
        result.current.setAuth(MOCK_USER, 'access-2', 'refresh-2');
      });
      expect(result.current.refreshToken).toBe('refresh-2');
    });
  });

  describe('clearAuth', () => {
    it('clears all auth state and marks unauthenticated', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuth(MOCK_USER, 'access-token-123', 'refresh-token-abc');
        result.current.clearAuth();
      });
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setOrgId', () => {
    it('updates orgId on the user object', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuth({ ...MOCK_USER, orgId: undefined }, 'tok');
        result.current.setOrgId('new-org-999');
      });
      expect(result.current.user?.orgId).toBe('new-org-999');
    });

    it('does nothing when user is null', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setOrgId('org-999');
      });
      expect(result.current.user).toBeNull();
    });
  });
});
