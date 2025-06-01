'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Users, TrendingUp, FolderKanban, Headphones, FileText,
  BarChart3, Settings, Plus, ArrowRight, LayoutDashboard, Sparkles,
  Tag, Briefcase, CheckSquare, Package, UserCog, Loader2, ExternalLink,
} from 'lucide-react';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useSearch, type SearchResultType } from '@/hooks/use-search';
import { cn } from '@/lib/utils';

/* ── Static command list ──────────────────────────────────────────────────── */
interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: string;
}

const RESULT_ICON: Record<SearchResultType, React.ElementType> = {
  lead:        Tag,
  contact:     Users,
  opportunity: TrendingUp,
  task:        CheckSquare,
  ticket:      Headphones,
  invoice:     FileText,
  employee:    UserCog,
  product:     Package,
};

const RESULT_COLOR: Record<SearchResultType, string> = {
  lead:        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  contact:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  opportunity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  task:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ticket:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  invoice:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  employee:    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  product:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export function CommandPalette() {
  const router = useRouter();
  const open    = useUiStore((s) => s.commandPaletteOpen);
  const close   = useUiStore((s) => s.closeCommandPalette);
  const orgId   = useAuthStore((s) => s.user?.orgId ?? 'demo');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { query, results: apiResults, loading, search, clear } = useSearch(orgId);

  // ── Static nav + action commands ──────────────────────────────────────────
  const NAV_COMMANDS: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard',  icon: <LayoutDashboard className="h-4 w-4" />, action: () => router.push('/dashboard'),    category: 'Navigation' },
    { id: 'crm',       label: 'CRM',        subtitle: 'Leads, Contacts, Pipeline', icon: <Users className="h-4 w-4" />, action: () => router.push('/crm'),         category: 'Navigation' },
    { id: 'pipeline',  label: 'Pipeline',   subtitle: 'Deal board',  icon: <TrendingUp className="h-4 w-4" />,  action: () => router.push('/crm/pipeline'), category: 'Navigation' },
    { id: 'projects',  label: 'Projects',   icon: <FolderKanban className="h-4 w-4" />, action: () => router.push('/projects'),    category: 'Navigation' },
    { id: 'helpdesk',  label: 'Helpdesk',   icon: <Headphones className="h-4 w-4" />,   action: () => router.push('/helpdesk'),    category: 'Navigation' },
    { id: 'finance',   label: 'Finance',    icon: <FileText className="h-4 w-4" />,     action: () => router.push('/finance'),     category: 'Navigation' },
    { id: 'hr',        label: 'HR',         icon: <Briefcase className="h-4 w-4" />,    action: () => router.push('/hr'),          category: 'Navigation' },
    { id: 'inventory', label: 'Inventory',  icon: <Package className="h-4 w-4" />,     action: () => router.push('/inventory'),   category: 'Navigation' },
    { id: 'analytics', label: 'Analytics',  icon: <BarChart3 className="h-4 w-4" />,   action: () => router.push('/analytics'),   category: 'Navigation' },
    { id: 'ai',        label: 'AI Copilot', icon: <Sparkles className="h-4 w-4" />,    action: () => router.push('/ai'),          category: 'Navigation' },
    { id: 'settings',  label: 'Settings',   icon: <Settings className="h-4 w-4" />,    action: () => router.push('/settings'),    category: 'Navigation' },
  ];

  const ACTION_COMMANDS: CommandItem[] = [
    { id: 'new-lead',    label: 'New Lead',    icon: <Plus className="h-4 w-4" />, action: () => router.push('/crm/leads?new=1'),    category: 'Create' },
    { id: 'new-deal',    label: 'New Deal',    icon: <Plus className="h-4 w-4" />, action: () => router.push('/crm/pipeline?new=1'), category: 'Create' },
    { id: 'new-ticket',  label: 'New Ticket',  icon: <Plus className="h-4 w-4" />, action: () => router.push('/helpdesk?new=1'),     category: 'Create' },
    { id: 'new-invoice', label: 'New Invoice', icon: <Plus className="h-4 w-4" />, action: () => router.push('/finance?new=1'),      category: 'Create' },
    { id: 'new-task',    label: 'New Task',    icon: <Plus className="h-4 w-4" />, action: () => router.push('/projects?new=1'),     category: 'Create' },
  ];

  const ALL_COMMANDS = [...NAV_COMMANDS, ...ACTION_COMMANDS];

  // ── When query is long enough, show API results; else show nav/actions ────
  const showApiResults = query.trim().length >= 2;

  const filteredCommands = !showApiResults
    ? ALL_COMMANDS
    : ALL_COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.subtitle?.toLowerCase().includes(query.toLowerCase()),
      );

  // Group static commands
  const grouped = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) { acc[item.category] = []; }
    acc[item.category]!.push(item);
    return acc;
  }, {});

  // Build flat list for keyboard nav:
  // [api results..., static commands..., "view all" if api results]
  const flatCommands = Object.values(grouped).flat();
  const viewAllEntry = showApiResults && apiResults.length >= 6
    ? [{ id: '__view_all__', label: `View all results for "${query}"`, url: `/search?q=${encodeURIComponent(query)}` }]
    : [];
  const totalCount = apiResults.length + flatCommands.length + viewAllEntry.length;

  const handleSelect = useCallback(
    (action: () => void) => {
      action();
      close();
      clear();
      setSelectedIndex(0);
    },
    [close, clear],
  );

  const handleApiResultSelect = useCallback(
    (url: string) => {
      router.push(url);
      close();
      clear();
      setSelectedIndex(0);
    },
    [router, close, clear],
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, totalCount - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        // api result
        const r = apiResults[selectedIndex];
        if (r) { handleApiResultSelect(r.url); return; }
        // static command
        const cmdIdx = selectedIndex - apiResults.length;
        const cmd = flatCommands[cmdIdx];
        if (cmd) { handleSelect(cmd.action); return; }
        // view all
        if (viewAllEntry.length > 0 && selectedIndex === apiResults.length + flatCommands.length) {
          const entry = viewAllEntry[0];
          if (entry) router.push(entry.url);
          close(); clear();
        }
      } else if (e.key === 'Escape') {
        close(); clear();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, apiResults, flatCommands, viewAllEntry, selectedIndex, handleSelect, handleApiResultSelect, close, clear, router, totalCount]);

  // Auto-focus + reset
  useEffect(() => {
    if (open) {
      clear();
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, clear]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { close(); clear(); }} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">

        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
          {loading ? (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-brand-500" />
          ) : (
            <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search everything… (leads, tickets, tasks, invoices)"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none dark:text-white"
          />
          {query && (
            <button onClick={() => { search(''); }} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
          <kbd className="rounded-md border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[480px] overflow-y-auto">
          {/* API results */}
          {showApiResults && (
            <>
              {loading && apiResults.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">Searching…</div>
              )}
              {!loading && apiResults.length === 0 && query.trim().length >= 2 && flatCommands.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}
              {apiResults.length > 0 && (
                <div>
                  <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Results
                  </div>
                  {apiResults.map((result, i) => {
                    const isSelected = selectedIndex === i;
                    const Icon = RESULT_ICON[result.type];
                    const colorCls = RESULT_COLOR[result.type];
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleApiResultSelect(result.url)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isSelected
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800',
                        )}
                      >
                        <span className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs', colorCls)}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{result.title}</span>
                          {result.subtitle && (
                            <span className="block text-xs text-gray-400 truncate">{result.subtitle}</span>
                          )}
                        </span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', colorCls)}>
                          {result.type}
                        </span>
                        {isSelected && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" />}
                      </button>
                    );
                  })}

                  {/* View all */}
                  {viewAllEntry.map((entry) => {
                    const idx = apiResults.length + flatCommands.length;
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => { router.push(entry.url); close(); clear(); }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-brand-600 transition-colors',
                          isSelected ? 'bg-brand-50 dark:bg-brand-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800',
                        )}
                      >
                        <ExternalLink className="h-4 w-4 text-brand-400" />
                        {entry.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Static commands */}
          {Object.entries(grouped).map(([category, items]) => {
            const firstItem = items[0];
            const flatOffset = apiResults.length + (firstItem ? flatCommands.findIndex((i) => i.id === firstItem.id) : 0);
            return (
              <div key={category}>
                <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {category}
                </div>
                {items.map((item, i) => {
                  const globalIndex = flatOffset + i;
                  const isSelected = selectedIndex === globalIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.action)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800',
                      )}
                    >
                      <span className={cn('flex-shrink-0', isSelected ? 'text-brand-500' : 'text-gray-400')}>
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium">{item.label}</span>
                        {item.subtitle && (
                          <span className="block text-xs text-gray-400 truncate">{item.subtitle}</span>
                        )}
                      </span>
                      {item.shortcut && (
                        <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                          {item.shortcut}
                        </kbd>
                      )}
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
          <span className="text-xs text-gray-400">
            <kbd className="rounded border border-gray-200 bg-gray-100 px-1 dark:border-gray-700 dark:bg-gray-800">↑↓</kbd>{' '}navigate
          </span>
          <span className="text-xs text-gray-400">
            <kbd className="rounded border border-gray-200 bg-gray-100 px-1 dark:border-gray-700 dark:bg-gray-800">↵</kbd>{' '}select
          </span>
          {showApiResults && (
            <button
              onClick={() => { router.push(`/search?q=${encodeURIComponent(query)}`); close(); clear(); }}
              className="ml-auto text-xs text-brand-600 hover:text-brand-700"
            >
              Full search results →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
