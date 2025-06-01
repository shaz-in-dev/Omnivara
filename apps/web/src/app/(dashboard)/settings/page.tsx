'use client';
import { useState, Suspense } from 'react';
import { Settings, Users, Shield, Bell, CreditCard, Plug, Lock, ChevronRight, Loader2, UserCircle, ClipboardList } from 'lucide-react';
import { GeneralSettings } from '@/components/settings/general-settings';
import { MembersSettings } from '@/components/settings/members-settings';
import { RolesSettings } from '@/components/settings/roles-settings';
import { BillingSettings } from '@/components/settings/billing-settings';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { SecuritySettings } from '@/components/settings/security-settings';
import { AuditSettings } from '@/components/settings/audit-settings';
import { IntegrationsSettings } from '@/components/settings/integrations-settings';
import { useAuthStore } from '@/stores/auth.store';

type TabId = 'profile' | 'general' | 'members' | 'roles' | 'security' | 'audit' | 'notifications' | 'billing' | 'integrations';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  comingSoon?: boolean;
}

const TABS: Tab[] = [
  { id: 'profile',       label: 'Profile',              icon: UserCircle,     description: 'Your name, avatar, timezone' },
  { id: 'general',       label: 'General',              icon: Settings,       description: 'Org name, logo, timezone, data export' },
  { id: 'members',       label: 'Members',              icon: Users,          description: 'Invite and manage team members', badge: '5' },
  { id: 'roles',         label: 'Roles & Permissions',  icon: Shield,         description: 'Configure access control' },
  { id: 'billing',       label: 'Billing',              icon: CreditCard,     description: 'Plan, usage, and invoices' },
  { id: 'security',      label: 'Security',             icon: Lock,           description: 'SSO, MFA, session policies' },
  { id: 'audit',         label: 'Audit Log',            icon: ClipboardList,  description: 'Track all write operations' },
  { id: 'integrations',  label: 'Integrations',         icon: Plug,           description: 'API keys, webhooks, and connectors' },
  { id: 'notifications', label: 'Notifications',        icon: Bell,           description: 'Email and in-app alerts', comingSoon: true },
];

function ComingSoonPlaceholder({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <Lock className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{label}</h3>
      <p className="mt-1 max-w-xs text-sm text-gray-400">{description} — coming in the next release.</p>
      <span className="mt-4 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
        Coming soon
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile and organization preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-52 flex-shrink-0">
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span className="flex-1 font-medium">{tab.label}</span>
                  {tab.badge && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      isActive ? 'bg-brand-100 text-brand-600 dark:bg-brand-800 dark:text-brand-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.comingSoon && (
                    <span className="rounded-md bg-gray-100 px-1 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-gray-800">
                      Soon
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3 w-3 text-brand-400" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content panel */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Panel header */}
          <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <currentTab.icon className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{currentTab.label}</h2>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">{currentTab.description}</p>
          </div>

          {/* Tab content */}
          {activeTab === 'profile'      && <ProfileSettings />}
          {activeTab === 'general'      && <GeneralSettings />}
          {activeTab === 'members'      && <MembersSettings orgId={orgId} />}
          {activeTab === 'roles'        && <RolesSettings />}
          {activeTab === 'billing'      && (
            <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>}>
              <BillingSettings />
            </Suspense>
          )}
          {activeTab === 'security'     && <SecuritySettings />}
          {activeTab === 'audit'        && <AuditSettings />}
          {activeTab === 'integrations' && <IntegrationsSettings />}
          {activeTab === 'notifications' && (
            <ComingSoonPlaceholder label={currentTab.label} description={currentTab.description} />
          )}
        </div>
      </div>
    </div>
  );
}
