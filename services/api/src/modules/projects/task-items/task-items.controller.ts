import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TaskItemsService } from './task-items.service';
import { CurrentOrg, CurrentUser } from '../../../common';
import type { CurrentUserPayload } from '../../../common';

@ApiTags('Projects - Task Items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/tasks/:taskId')
export class TaskItemsController {
  constructor(private readonly items: TaskItemsService) {}

  // ── Comments ──────────────────────────────────────────────────────────────

  @Get('comments')
  findComments(@CurrentOrg() orgId: string, @Param('taskId') taskId: string) {
    return this.items.findComments(orgId, taskId);
  }

  @Post('comments')
  createComment(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('taskId') taskId: string,
    @Body('content') content: string,
  ) {
    return this.items.createComment(orgId, taskId, user.id, content);
  }

  // ── Checklist ──────────────────────────────────────────────────────────────

  @Get('checklist')
  findChecklist(@CurrentOrg() orgId: string, @Param('taskId') taskId: string) {
    return this.items.findChecklist(orgId, taskId);
  }

  @Post('checklist')
  createChecklistItem(
    @CurrentOrg() orgId: string,
    @Param('taskId') taskId: string,
    @Body('text') text: string,
  ) {
    return this.items.createChecklistItem(orgId, taskId, text);
  }

  @Patch('checklist/:itemId')
  updateChecklistItem(
    @CurrentOrg() orgId: string,
    @Param('itemId') itemId: string,
    @Body() body: { done?: boolean; text?: string },
  ) {
    return this.items.updateChecklistItem(orgId, itemId, body);
  }
}
