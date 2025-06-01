'use client';
import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const NPS_STORAGE_KEY = 'omnivara-nps-last-shown';
const NPS_COOLDOWN_DAYS = 90;

export function NpsWidget() {
  const user  = useAuthStore((s) => s.user);
  const orgId = user?.orgId;
  const [open,      setOpen]      = useState(false);
  const [score,     setScore]     = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback,  setFeedback]  = useState('');
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    const last = localStorage.getItem(NPS_STORAGE_KEY);
    if (last) {
      const daysSince = (Date.now() - parseInt(last, 10)) / 86_400_000;
      if (daysSince < NPS_COOLDOWN_DAYS) return;
    }
    // Show after 30s on page
    const t = setTimeout(() => setOpen(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(NPS_STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  const submit = async () => {
    if (score === null) return;
    setLoading(true);
    try {
      await api.post(`/orgs/${orgId}/feedback/nps`, { score, comment: feedback });
    } catch { /* non-fatal */ }
    setLoading(false);
    setSubmitted(true);
    localStorage.setItem(NPS_STORAGE_KEY, String(Date.now()));
    setTimeout(() => setOpen(false), 3000);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between px-4 pt-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {submitted ? '🎉 Thanks for your feedback!' : 'How likely are you to recommend Omnivara?'}
        </p>
        <button onClick={dismiss} className="ml-2 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!submitted ? (
        <>
          <div className="px-4 py-3">
            <p className="mb-3 text-xs text-gray-400">0 = Not likely · 10 = Extremely likely</p>
            <div className="flex gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    score === i
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400',
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {score !== null && score < 7 && (
            <div className="px-4 pb-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What could we do better?"
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {score !== null && score > 8 && (
            <div className="px-4 pb-3">
              <a
                href="https://g2.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Leave us a review on G2
              </a>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">Not now</button>
            <button
              onClick={submit}
              disabled={score === null || loading}
              className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 pb-4 pt-2 text-sm text-gray-500">
          {score !== null && score < 7
            ? "We'll use your feedback to improve. Our team may reach out."
            : 'Your support means the world to us. 💜'}
        </div>
      )}
    </div>
  );
}
