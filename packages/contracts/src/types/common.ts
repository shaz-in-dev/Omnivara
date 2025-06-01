/** Common utility types used across all modules */

export type ID = string;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
}

export type OmnivaraModule =
  | 'crm'
  | 'projects'
  | 'helpdesk'
  | 'finance'
  | 'hr'
  | 'inventory'
  | 'analytics'
  | 'ai'
  | 'platform';

export type Permission = `${OmnivaraModule}:${'read' | 'write' | 'delete' | 'admin'}` | '*';
