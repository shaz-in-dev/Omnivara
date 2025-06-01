'use client';

import { useEffect, useState } from 'react';
import { X, BarChart2, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';

const LS_KEY = 'omnivara-sample-data-shown';

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(LS_KEY) === 'dismissed';
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(LS_KEY, 'dismissed');
  } catch {
    // ignore
  }
}

export function SampleDataBanner() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const qc = useQueryClient();

  const [visible, setVisible] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    // Only show if NOT dismissed yet
    if (!isDismissed()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    markDismissed();
    setVisible(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await api.delete(`/orgs/${orgId}/seed-sample-data`);
      // Invalidate all relevant query caches
      await qc.invalidateQueries({ queryKey: ['crm'] });
      await qc.invalidateQueries({ queryKey: ['invoices'] });
      await qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch {
      // non-fatal
    } finally {
      setRemoving(false);
      markDismissed();
      setVisible(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800/50 dark:bg-amber-900/20">
      <BarChart2 className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />

      <span className="flex-1 text-amber-800 dark:text-amber-200">
        <strong>You&apos;re viewing sample data</strong>
        &nbsp;&middot;&nbsp;This is pre-loaded so you can explore Omnivara.
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRemove}
          disabled={removing}
          className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        >
          {removing ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Removing…</>
          ) : (
            'Remove sample data'
          )}
        </button>

        <button
          onClick={handleDismiss}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
        >
          Got it <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
