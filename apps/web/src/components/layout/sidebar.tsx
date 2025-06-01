'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderKanban, Headphones,
  DollarSign, UserCircle, Package, BarChart3, Sparkles,
  Settings, ChevronDown, LogOut, Receipt, FileText,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { clearTokens } from '@/lib/auth';

type NavItem =
  | { name: string; href: string; icon: React.ElementType; children?: undefined }
  | { name: string; href: string; icon: React.ElementType; children: { name: string; href: string; icon: React.ElementType }[] };

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard',  icon: LayoutDashboard },
  { name: 'CRM',       href: '/crm',        icon: Users },
  { name: 'Projects',  href: '/projects',   icon: FolderKanban },
  { name: 'Helpdesk',  href: '/helpdesk',   icon: Headphones },
  {
    name: 'Finance', href: '/finance', icon: DollarSign,
    children: [
      { name: 'Invoices', href: '/finance',          icon: FileText },
      { name: 'Expenses', href: '/finance/expenses', icon: Receipt },
    ],
  },
  { name: 'HR',        href: '/hr',         icon: UserCircle },
  { name: 'Inventory', href: '/inventory',  icon: Package },
  { name: 'Analytics', href: '/analytics',  icon: BarChart3 },
  { name: 'AI Copilot',href: '/ai',         icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  // Track which expandable groups are open; default finance open if on finance route
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Finance: pathname.startsWith('/finance') });
  const toggleGroup = (name: string) => setExpanded((p) => ({ ...p, [name]: !p[name] }));

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  const handleLogout = async () => {
    try {
      const rt = useAuthStore.getState().refreshToken;
      if (rt) await authApi.logout(rt).catch(() => {});
    } finally {
      clearTokens();
      clearAuth();
      router.push('/auth/login');
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5 dark:border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
          <span className="text-sm font-bold text-white">O</span>
        </div>
        <span className="text-base font-bold text-gray-900 dark:text-white">Omnivara</span>
      </div>

      {/* Org switcher */}
      <button className="mx-3 mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-brand-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Acme Corp</span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const active = pathname.startsWith(item.href);
          if (item.children) {
            const isOpen = expanded[item.name] ?? false;
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                            childActive
                              ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                          }`}
                        >
                          <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="border-t border-gray-200 p-3 space-y-1 dark:border-gray-800">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        {/* User row */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5">
          <Link href="/profile" className="flex flex-1 items-center gap-2.5 min-w-0 group">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 group-hover:text-brand-600 dark:text-gray-200">
                {user?.name ?? 'Account'}
              </p>
              <p className="truncate text-[11px] text-gray-400">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
