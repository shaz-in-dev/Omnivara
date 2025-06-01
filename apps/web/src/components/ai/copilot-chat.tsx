'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Trash2, Sparkles, User, Copy, Check, ChevronRight, Lock } from 'lucide-react';
import { useCopilot, type CopilotMessage } from '@/hooks/use-copilot';

function MarkdownText({ content }: { content: string }) {
  // Simple markdown renderer: bold, inline code, bullet lists
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <p key={i} className="font-semibold text-gray-900 dark:text-white">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const text = line.slice(2);
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
              <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
            </div>
          );
        }
        if (line === '') return <div key={i} className="h-2" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />;
      })}
    </div>
  );
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono dark:bg-gray-700">$1</code>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function MessageBubble({ message }: { message: CopilotMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-3 text-sm text-white shadow-sm">
          {message.content}
        </div>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="group relative max-w-[90%] rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {message.streaming && message.content === '' ? (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:300ms]" />
            </div>
          ) : (
            <MarkdownText content={message.content} />
          )}
          {message.streaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand-500" />
          )}
          {!message.streaming && message.content && (
            <button
              onClick={copy}
              className="absolute right-2 top-2 rounded-lg p-1 text-gray-300 opacity-0 hover:text-gray-500 group-hover:opacity-100 dark:hover:text-gray-400"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Suggested actions */}
        {!message.streaming && message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.suggestedActions.map((action) => (
              <button
                key={action}
                className="flex items-center gap-1 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300"
              >
                {action}
                <ChevronRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <p className="px-1 text-[11px] text-gray-300 dark:text-gray-600">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  'Give me a business overview',
  'Which leads need follow-up?',
  'Summarize open helpdesk tickets',
  'What invoices are overdue?',
  'Show me this week\'s pipeline',
];

interface Props {
  orgId?: string;
}

export function CopilotChat({ orgId }: Props) {
  const { messages, isStreaming, planError, sendMessage, stopStreaming, clearHistory } = useCopilot(orgId);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
    inputRef.current?.focus();
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-sm shadow-brand-500/30">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Omnivara Copilot</h2>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <p className="text-xs text-gray-400">Powered by Claude · RAG-enabled</p>
            </div>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Plan error banner */}
      {planError && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm dark:border-yellow-800 dark:bg-yellow-900/20">
          <Lock className="h-4 w-4 flex-shrink-0 text-yellow-500" />
          <span className="text-yellow-800 dark:text-yellow-300">{planError}</span>
          <a href="/settings" className="ml-auto flex-shrink-0 text-xs font-medium text-yellow-700 underline dark:text-yellow-400">Upgrade</a>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="border-t border-gray-100 px-6 py-3 dark:border-gray-800">
          <p className="mb-2 text-xs font-medium text-gray-400">Quick questions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => { setInput(p); inputRef.current?.focus(); }}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/20 dark:border-gray-700 dark:bg-gray-800">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask anything about your business… (Enter to send)"
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-200"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600"
              title="Stop"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1.5 px-1 text-center text-[11px] text-gray-300 dark:text-gray-600">
          Shift+Enter for new line · Ctrl+/ to open Copilot from anywhere
        </p>
      </div>
    </div>
  );
}
