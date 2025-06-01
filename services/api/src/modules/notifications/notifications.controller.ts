import {
  Controller, Get, Patch, Delete, Param, Query,
  UseGuards, Req, Sse, MessageEvent, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

type AuthReq = Request & { user: { sub: string } };

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent notifications for the requesting user' })
  getRecent(
    @Param('orgId') orgId: string,
    @Req() req: AuthReq,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.svc.getRecent(orgId, req.user.sub, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(
    @Param('orgId') orgId: string,
    @Req() req: AuthReq,
  ) {
    const count = await this.svc.unreadCount(orgId, req.user.sub);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(
    @Param('orgId') orgId: string,
    @Req() req: AuthReq,
  ) {
    return this.svc.markAllRead(orgId, req.user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: AuthReq,
  ) {
    return this.svc.markRead(orgId, req.user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  delete(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: AuthReq,
  ) {
    return this.svc.deleteNotification(orgId, req.user.sub, id);
  }

  @SkipThrottle()
  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream of real-time notifications' })
  stream(
    @Param('orgId') orgId: string,
    @Req() req: AuthReq,
  ): Observable<MessageEvent> {
    return this.svc.getStream(orgId, req.user.sub);
  }
}
