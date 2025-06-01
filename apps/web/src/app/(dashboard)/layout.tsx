'use client';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';
import { CommandPalette } from '@/components/command-palette';
import { NotificationDrawer } from '@/components/notifications/notification-drawer';
import { CopilotPanel } from '@/components/ai/copilot-panel';
import { EmailVerifyBanner } from '@/components/shared/email-verify-banner';
import { TrialNudgeBar } from '@/components/billing/trial-nudge-bar';
import { NpsWidget } from '@/components/feedback/nps-widget';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

function DashboardShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const showVerifyBanner = user && user.emailVerified === false;

  // Sync user profile on mount (refreshes emailVerified, orgId, etc.)
  useEffect(() => {
    if (!accessToken) return;
    authApi.me().then(({ data }) => {
      const u = data?.data ?? data;
      if (u) {
        // Extract orgId — API returns it inside orgs[] array
        const orgId = u.orgs?.[0]?.orgId ?? u.orgId ?? user?.orgId;
        setAuth(
          {
            id: u.id ?? user?.id ?? '',
            email: u.email ?? user?.email ?? '',
            name: u.name ?? user?.name ?? '',
            avatarUrl: u.avatarUrl ?? user?.avatarUrl,
            orgId,
            emailVerified: u.emailVerified ?? user?.emailVerified,
          },
          accessToken,
          useAuthStore.getState().refreshToken ?? '',
        );
      }
    }).catch(() => {/* ignore if API not reachable */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {showVerifyBanner && <EmailVerifyBanner email={user.email} />}
        <TrialNudgeBar />
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      {/* Global overlays */}
      <CommandPalette />
      <NotificationDrawer />
      <CopilotPanel />
      <NpsWidget />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
