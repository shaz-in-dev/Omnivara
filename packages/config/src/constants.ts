/** Shared application constants */

export const APP_NAME = 'Omnivara One';
export const APP_VERSION = '0.1.0';

export const MODULES = [
  'crm',
  'projects',
  'helpdesk',
  'finance',
  'hr',
  'inventory',
  'analytics',
  'ai',
] as const;

export type ModuleName = (typeof MODULES)[number];

export const MODULE_LABELS: Record<ModuleName, string> = {
  crm: 'CRM Pro',
  projects: 'Projects & Agile',
  helpdesk: 'Helpdesk & Success',
  finance: 'Finance & Billing',
  hr: 'HR & People Ops',
  inventory: 'Inventory & Procurement',
  analytics: 'Analytics & Data Studio',
  ai: 'AI Copilot',
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
