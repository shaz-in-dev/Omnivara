'use client';
import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { getAccessToken } from '@/lib/auth';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
  streaming?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useCopilot(orgId?: string) {
  const storeOrgId = useAuthStore((s) => s.user?.orgId ?? '');
  const effectiveOrgId = orgId || storeOrgId;

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Omnivara Copilot. Ask me anything about your leads, tickets, invoices, or team — I'll help you make sense of your business data and suggest next steps.",
      timestamp: new Date(),
      suggestedActions: ['Summarize open tickets', 'Show pipeline value', 'List overdue invoices'],
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string, context?: Record<string, unknown>) => {
    if (!text.trim() || isStreaming) return;
    setPlanError(null);

    const userMsg: CopilotMessage = {
      id: uid(), role: 'user', content: text.trim(), timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
    ]);
    setIsStreaming(true);

    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/ai/copilot/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-org-id': effectiveOrgId,
        },
        body: JSON.stringify({
          org_id:   effectiveOrgId,
          user_id:  '',
          messages: history,
          context:  context ?? null,
          stream:   true,
        }),
        signal: abortRef.current.signal,
      });

      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({ message: 'AI not available on your current plan.' }));
        const errorMsg = (errorData as { message?: string }).message ?? 'AI not available on your current plan.';
        setPlanError(errorMsg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]' || data.startsWith('[ERROR]')) continue;
          accumulated += data;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
          );
        }
      }

      const actions = extractActions(accumulated);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: accumulated, streaming: false, suggestedActions: actions }
            : m,
        ),
      );
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (!isAbort) {
        const fallback = generateFallback(text);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: fallback.content, streaming: false, suggestedActions: fallback.actions }
              : m,
          ),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, effectiveOrgId, isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setMessages((prev) => prev.filter((m) => m.id === 'welcome'));
    setPlanError(null);
  }, []);

  return { messages, isStreaming, planError, sendMessage, stopStreaming, clearHistory };
}

function extractActions(content: string): string[] {
  const lower = content.toLowerCase();
  const actions: string[] = [];
  if (lower.includes('follow up') || lower.includes('email')) actions.push('Draft follow-up email');
  if (lower.includes('schedule') || lower.includes('meeting') || lower.includes('call')) actions.push('Schedule a call');
  if (lower.includes('invoice') || lower.includes('payment')) actions.push('Open Finance module');
  if (lower.includes('ticket') || lower.includes('issue')) actions.push('Go to Helpdesk');
  if (lower.includes('lead') || lower.includes('pipeline')) actions.push('Open CRM Pipeline');
  return actions.slice(0, 3);
}

function generateFallback(query: string): { content: string; actions: string[] } {
  const lower = query.toLowerCase();
  if (lower.includes('ticket') || lower.includes('helpdesk')) {
    return {
      content: "I'm having trouble connecting to the AI service right now. Please try again in a moment, or go to the **Helpdesk** module to view your tickets directly.",
      actions: ['Go to Helpdesk'],
    };
  }
  return {
    content: "I'm having trouble connecting to the AI service. Please ensure the AI service is running and your plan includes AI access.",
    actions: ['View Dashboard', 'Open CRM'],
  };
}
