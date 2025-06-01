'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, Tag, Users, TrendingUp, CheckSquare, Headphones,
  FileText, UserCog, Package, Loader2, ArrowRight, SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useSearch, type SearchResult, type SearchResultType } from '@/hooks/use-search';

/* ── Config ───────────────────────────────────────────────────────────────── */
const TYPE_META: Record<SearchResultType, { label: string; icon: React.ElementType; color: string }> = {
  lead:        { label: 'Lead',        icon: Tag,        color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  contact:     { label: 'Contact',     icon: Users,      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  opportunity: { label: 'Opportunity', icon: TrendingUp, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  task:        { label: 'Task',        icon: CheckSquare, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ticket:      { label: 'Ticket',      icon: Headphones, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  invoice:     { label: 'Invoice',     icon: FileText,   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  employee:    { label: 'Employee',    icon: UserCog,    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  product:     { label: 'Product',     icon: Package,    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

const ALL_TYPES = Object.keys(TYPE_META) as SearchResultType[];

/* ── Result card ──────────────────────────────────────────────────────────── */
function ResultCard({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const meta = TYPE_META[result.type];
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-brand-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-600"
    >
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', meta.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">{result.title}</p>
        {result.subtitle && (
          <p className="mt-0.5 text-sm text-gray-500 truncate">{result.subtitle}</p>
        )}
      </div>
      <span className={cn('hidden rounded-full px-2.5 py-1 text-xs font-semibold group-hover:inline-flex', meta.color)}>
        {meta.label}
      </span>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-brand-500 transition-colors" />
    </button>
  );
}

/* ── Main content ─────────────────────────────────────────────────────────── */
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const orgId = useAuthStore((s) => s.user?.orgId ?? 'demo');

  const { query, results, loading, search } = useSearch(orgId);
  const [activeType, setActiveType] = useState<SearchResultType | null>(null);
  const [localQ, setLocalQ] = useState(initialQ);

  // Trigger search on initial load
  useEffect(() => {
    if (initialQ) search(initialQ);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = activeType ? results.filter((r) => r.type === activeType) : results;

  // Group by type
  const grouped = filtered.reduce<Partial<Record<SearchResultType, SearchResult[]>>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type]!.push(r);
    return acc;
  }, {});

  const typeCounts = results.reduce<Partial<Record<SearchResultType, number>>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});

  const handleSearch = (q: string) => {
    setLocalQ(q);
    search(q);
    const url = q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search';
    window.history.replaceState(null, '', url);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
        <p className="mt-1 text-sm text-gray-500">Find anything across your workspace</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-brand-500" />
        ) : (
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        )}
        <input
          type="text"
          value={localQ}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
          placeholder="Search leads, contacts, tickets, tasks, invoices…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {/* Type filter pills */}
      {results.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveType(null)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              !activeType
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400',
            )}
          >
            All <span className="ml-1 opacity-75">{results.length}</span>
          </button>
          {ALL_TYPES.filter((t) => (typeCounts[t] ?? 0) > 0).map((type) => {
            const meta = TYPE_META[type];
            const count = typeCounts[type] ?? 0;
            const active = activeType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveType(active ? null : type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  active ? meta.color + ' ring-2 ring-offset-1 ring-brand-400' : meta.color + ' opacity-80 hover:opacity-100',
                )}
              >
                <meta.icon className="h-3 w-3" />
                {meta.label} <span className="opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty states */}
      {!loading && localQ.trim().length < 2 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Search className="h-8 w-8 text-gray-300" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Start typing to search</p>
            <p className="mt-1 text-sm text-gray-400">Search across leads, contacts, tickets, tasks, and more</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            {(['lead','contact','ticket','task','invoice'] as SearchResultType[]).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              return (
                <span key={t} className={cn('flex items-center gap-1 rounded-full px-2.5 py-1', meta.color)}>
                  <Icon className="h-3 w-3" /> {meta.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {!loading && localQ.trim().length >= 2 && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SlidersHorizontal className="h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            No results for &ldquo;{localQ}&rdquo;
          </p>
          <p className="text-sm text-gray-400">Try a different keyword or check the spelling</p>
        </div>
      )}

      {/* Results grouped by type */}
      {Object.entries(grouped).map(([type, items]) => {
        if (!items) return null;
        const meta = TYPE_META[type as SearchResultType];
        const Icon = meta.icon;
        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn('flex h-5 w-5 items-center justify-center rounded-md', meta.color)}>
                <Icon className="h-3 w-3" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {meta.label}s <span className="normal-case font-normal">({items.length})</span>
              </h3>
            </div>
            <div className="space-y-2">
              {items.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  onClick={() => router.push(result.url)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
