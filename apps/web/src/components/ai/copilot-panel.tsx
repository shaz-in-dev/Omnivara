'use client';
import { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useUiStore } from '@/stores/ui.store';
import { CopilotChat } from './copilot-chat';

export function CopilotPanel() {
  const { copilotOpen, setCopilotOpen } = useUiStore();

  // Ctrl+/ global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setCopilotOpen(!copilotOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [copilotOpen, setCopilotOpen]);

  return (
    <>
      {/* Floating trigger button */}
      {!copilotOpen && (
        <button
          onClick={() => setCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/40 transition-all hover:scale-110 hover:bg-brand-600 hover:shadow-xl"
          title="AI Copilot (Ctrl+/)"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* Panel */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex flex-col border-l border-gray-200 bg-white shadow-2xl transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          copilotOpen ? 'h-[600px] w-[420px] rounded-tl-2xl' : 'h-0 w-0 overflow-hidden'
        }`}
      >
        {copilotOpen && (
          <>
            {/* Panel close bar */}
            <div className="absolute right-3 top-3 z-10">
              <button
                onClick={() => setCopilotOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CopilotChat />
            </div>
          </>
        )}
      </div>

      {/* Backdrop (mobile) */}
      {copilotOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setCopilotOpen(false)}
        />
      )}
    </>
  );
}
