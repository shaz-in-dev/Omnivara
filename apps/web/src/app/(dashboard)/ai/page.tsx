'use client';
import { CopilotChat } from '@/components/ai/copilot-chat';
import { DailyBrief } from '@/components/ai/daily-brief';
import { AiUsageBar } from '@/components/ai/ai-usage-bar';

export default function AiPage() {
  return (
    <div className="flex h-[calc(100vh-64px)] gap-4 -m-6 p-6 overflow-hidden">
      {/* Left panel: Daily Brief + usage bar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto">
        <AiUsageBar />
        <DailyBrief />
      </aside>

      {/* Main chat panel */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <CopilotChat />
      </div>
    </div>
  );
}
