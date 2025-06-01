'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { saveTokens } from '@/lib/auth';
import type { AuthUser } from '@/stores/auth.store';

/**
 * Landing page after SAML SSO callback.
 * The backend redirects here with `#token=<jwt>` (fragment, not query param).
 * Fragments never appear in server logs, CDN logs, or Referer headers.
 */
export default function SsoCallbackPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    // Read from fragment (#token=...) — window.location.hash is client-only
    const hash  = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    const token = new URLSearchParams(hash).get('token');

    if (!token) {
      router.replace('/login?error=sso_failed');
      return;
    }

    // Persist the access token to cookies (no refresh token from SSO — will get one on next /auth/me or activity)
    saveTokens(token, '');

    // Fetch the authenticated user profile
    api.get<AuthUser & { orgId?: string }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        setAuth(data, token);
        router.replace('/');
      })
      .catch(() => {
        router.replace('/login?error=sso_failed');
      });
  }, [router, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
        <p className="mt-3 text-sm text-gray-500">Completing sign-in…</p>
      </div>
    </div>
  );
}
