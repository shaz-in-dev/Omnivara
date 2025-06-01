import type { ID, Timestamps } from './common';

export type TicketStatus = 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';
export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketChannel = 'email' | 'chat' | 'phone' | 'portal' | 'api';

export interface Ticket extends Timestamps {
  id: ID;
  orgId: ID;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  contactId: ID | null;
  assigneeId: ID | null;
  teamId: ID | null;
  slaBreachAt: string | null;
  resolvedAt: string | null;
}
