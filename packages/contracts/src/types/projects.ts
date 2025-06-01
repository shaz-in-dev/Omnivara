import type { ID, Timestamps } from './common';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Project extends Timestamps {
  id: ID;
  orgId: ID;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  ownerId: ID | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Task extends Timestamps {
  id: ID;
  orgId: ID;
  projectId: ID;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: ID | null;
  dueDate: string | null;
  estimatedHours: number | null;
  sprintId: ID | null;
}

export interface Sprint extends Timestamps {
  id: ID;
  projectId: ID;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
}
