import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

export type SearchResultType =
  | 'lead' | 'contact' | 'opportunity' | 'task'
  | 'ticket' | 'invoice' | 'employee' | 'product';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
}

const TYPE_URL: Record<SearchResultType, (id: string) => string> = {
  lead:        (id) => `/crm/leads?id=${id}`,
  contact:     (id) => `/crm/contacts?id=${id}`,
  opportunity: (id) => `/crm/pipeline?id=${id}`,
  task:        (id) => `/projects?taskId=${id}`,
  ticket:      (id) => `/helpdesk?ticketId=${id}`,
  invoice:     (id) => `/finance?invoiceId=${id}`,
  employee:    (id) => `/hr?employeeId=${id}`,
  product:     (id) => `/inventory?productId=${id}`,
};

/** Offline fallback mock — used when the API isn't running */
const MOCK_RESULTS: SearchResult[] = [
  { id: 'l1', type: 'lead',     title: 'Acme Corp',          subtitle: 'Lead · Qualified',       url: '/crm/leads' },
  { id: 'c1', type: 'contact',  title: 'Sarah Chen',         subtitle: 'Contact · Acme Corp',    url: '/crm/contacts' },
  { id: 'o1', type: 'opportunity', title: 'Acme Enterprise Deal', subtitle: 'Opportunity · $42 000', url: '/crm/pipeline' },
  { id: 't1', type: 'ticket',   title: 'Login page 500 error', subtitle: 'Ticket · Open · High', url: '/helpdesk' },
  { id: 'i1', type: 'invoice',  title: 'INV-0042',           subtitle: 'Invoice · $8 400 · Sent', url: '/finance' },
  { id: 'tk1', type: 'task',    title: 'JWT refresh queue',  subtitle: 'Task · In Progress',     url: '/projects' },
  { id: 'e1', type: 'employee', title: 'Alex Johnson',       subtitle: 'Employee · Engineering', url: '/hr' },
  { id: 'p1', type: 'product',  title: 'Pro Keyboard MK3',  subtitle: 'Product · In Stock',     url: '/inventory' },
];

function mockSearch(query: string): SearchResult[] {
  const q = query.toLowerCase();
  return MOCK_RESULTS.filter(
    (r) => r.title.toLowerCase().includes(q) || r.subtitle?.toLowerCase().includes(q),
  );
}

export function useSearch(orgId: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (q.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get(`/orgs/${orgId}/search`, {
            params: { q: q.trim(), limit: 12 },
          });
          const raw: Array<{ id: string; type: SearchResultType; title: string; subtitle?: string }> =
            data?.data ?? data ?? [];
          setResults(
            raw.map((r) => ({
              ...r,
              url: TYPE_URL[r.type]?.(r.id) ?? '/',
            })),
          );
        } catch {
          // API not running in dev — use mock
          setResults(mockSearch(q));
        } finally {
          setLoading(false);
        }
      }, 280);
    },
    [orgId],
  );

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setLoading(false);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return { query, results, loading, search, clear };
}
