import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Ensures the authenticated user belongs to the requested org.
 * Reads orgId from query, params, or body and compares to JWT payload.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & { user: { orgId?: string } }
    >();
    const user = request.user;
    if (!user?.orgId) throw new ForbiddenException('No active organization context');

    const requestedOrgId =
      (request.params as Record<string, string>)['orgId'] ??
      (request.query as Record<string, string>)['orgId'] ??
      (request.body as Record<string, string> | undefined)?.['orgId'];

    if (requestedOrgId && requestedOrgId !== user.orgId) {
      throw new ForbiddenException('Access denied to this organization');
    }
    return true;
  }
}
