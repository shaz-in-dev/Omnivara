import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { type Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface AuditEvent {
  orgId:        string;
  userId:       string | null;
  action:       string;  // e.g. "POST /crm/leads"
  resourceType: string | null; // e.g. "lead"
  resourceId:   string | null;
  ipAddress:    string | null;
  userAgent:    string | null;
}

/**
 * Global audit interceptor — fires after every successful mutating request.
 * Emits an 'audit.log' event that AuditService persists asynchronously.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly emitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: { id?: string; orgId?: string } }
    >();

    if (!WRITE_METHODS.has(request.method)) return next.handle();

    const { method, url, user, ip, headers } = request;
    const orgId = user?.orgId ?? null;

    return next.handle().pipe(
      tap(() => {
        if (!orgId) return; // don't log unauthenticated writes

        // Derive resourceType from URL segments: /crm/leads/xyz → "lead"
        const segments = url.split('/').filter(Boolean);
        const resourceSegment = segments[segments.length - 2] ?? segments[segments.length - 1] ?? null;
        const resourceType = resourceSegment ? singularize(resourceSegment) : null;

        // Last URL segment is likely the ID on PATCH/DELETE
        const lastSeg = segments[segments.length - 1] ?? '';
        const resourceId = (method === 'PATCH' || method === 'DELETE') && !lastSeg.includes('?')
          ? lastSeg
          : null;

        const event: AuditEvent = {
          orgId,
          userId:       user?.id ?? null,
          action:       `${method} ${url}`,
          resourceType,
          resourceId,
          ipAddress:    ip ?? null,
          userAgent:    (headers['user-agent'] ?? null) as string | null,
        };

        this.emitter.emit('audit.log', event);
      }),
    );
  }
}

/** Very simple singularizer for common resource names */
function singularize(word: string): string {
  const map: Record<string, string> = {
    leads: 'lead', contacts: 'contact', accounts: 'account',
    opportunities: 'opportunity', tickets: 'ticket', invoices: 'invoice',
    projects: 'project', tasks: 'task', employees: 'employee',
    expenses: 'expense', products: 'product', activities: 'activity',
    members: 'member', roles: 'role', users: 'user', orgs: 'org',
    'api-keys': 'api_key',
  };
  return map[word.toLowerCase()] ?? word.replace(/s$/, '');
}
