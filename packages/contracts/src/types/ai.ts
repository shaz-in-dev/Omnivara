import type { ID } from './common';

export type CopilotMode = 'ask' | 'brief' | 'action';
export type PersonaType =
  | 'ceo'
  | 'sales_manager'
  | 'project_manager'
  | 'support_lead'
  | 'finance'
  | 'hr'
  | 'ops';

export interface CopilotRequest {
  query: string;
  orgId: ID;
  userId: ID;
  mode: CopilotMode;
  context?: Record<string, unknown>;
}

export interface CopilotSource {
  title: string;
  module: string;
  resourceId: ID;
  snippet: string;
}

export interface CopilotResponse {
  answer: string;
  sources: CopilotSource[];
  confidence: number;
  suggestedActions: Array<{ label: string; action: string; params: Record<string, unknown> }>;
}

export interface BriefSection {
  title: string;
  summary: string;
  items: string[];
  priority: 'critical' | 'high' | 'normal';
}

export interface DailyBrief {
  persona: PersonaType;
  period: 'daily' | 'weekly';
  sections: BriefSection[];
  generatedAt: string;
}
