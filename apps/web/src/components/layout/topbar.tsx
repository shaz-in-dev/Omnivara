'use client';
import { Search, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from './notification-bell';
import { useAuthStore } from '@/stores/auth.store';

export function TopBar() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const [dark, setDark]     = useState(false);
  const [search, setSearch] = useState('');

  // Sync dark mode with document class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800">
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search anything… (⌘K)"
          className="w-56 bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400 dark:text-gray-300"
        />
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification bell — real unread badge + dropdown */}
        <NotificationBell />

        {/* Avatar */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          title={user?.name ?? 'Profile'}
          onClick={() => router.push('/settings?tab=profile')}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
