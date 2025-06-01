import type { ID, Timestamps } from './common';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified';
export type OpportunityStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Lead extends Timestamps {
  id: ID;
  orgId: ID;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: string | null;
  ownerId: ID | null;
}

export interface Contact extends Timestamps {
  id: ID;
  orgId: ID;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  accountId: ID | null;
  ownerId: ID | null;
}

export interface Account extends Timestamps {
  id: ID;
  orgId: ID;
  name: string;
  domain: string | null;
  industry: string | null;
  employeeCount: number | null;
  annualRevenue: number | null;
  ownerId: ID | null;
}

export interface Opportunity extends Timestamps {
  id: ID;
  orgId: ID;
  name: string;
  accountId: ID | null;
  stage: OpportunityStage;
  amount: number | null;
  currency: string;
  probability: number | null;
  expectedCloseDate: string | null;
  ownerId: ID | null;
}
