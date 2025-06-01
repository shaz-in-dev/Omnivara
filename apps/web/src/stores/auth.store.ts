'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  orgId?: string;
  emailVerified?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** refreshToken is optional — callers that don't have it can omit it */
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setOrgId: (orgId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set((prev) => ({
          user,
          accessToken,
          // Keep existing refreshToken if new one not supplied
          refreshToken: refreshToken ?? prev.refreshToken,
          isAuthenticated: true,
        })),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      setOrgId: (orgId) =>
        set((state) => ({ user: state.user ? { ...state.user, orgId } : null })),
    }),
    {
      name: 'omnivara-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
    },
  ),
);
