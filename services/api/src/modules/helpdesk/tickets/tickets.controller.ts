import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './tickets.service';
import { TicketRepliesService } from './ticket-replies.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CurrentOrg, CurrentUser } from '../../../common';
import type { CurrentUserPayload } from '../../../common';
import { TicketStatus } from '@prisma/client';

@ApiTags('Helpdesk - Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('helpdesk/tickets')
export class TicketsController {
  constructor(
    private readonly tickets: TicketsService,
    private readonly replies: TicketRepliesService,
  ) {}

  @Get()
  findAll(@CurrentOrg() orgId: string, @Query('status') status?: TicketStatus) {
    return this.tickets.findAll(orgId, 1, 25, status);
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) { return this.tickets.findOne(orgId, id); }

  @Post()
  create(@CurrentOrg() orgId: string, @Body() body: CreateTicketDto) {
    return this.tickets.create(orgId, body);
  }

  @Patch(':id/status')
  updateStatus(@CurrentOrg() orgId: string, @Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.tickets.updateStatus(orgId, id, status);
  }

  @Patch(':id/assign')
  assign(@CurrentOrg() orgId: string, @Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    return this.tickets.assign(orgId, id, assigneeId);
  }

  // ── Replies ────────────────────────────────────────────────────────────────

  @Get(':ticketId/replies')
  findReplies(@CurrentOrg() orgId: string, @Param('ticketId') ticketId: string) {
    return this.replies.findByTicket(orgId, ticketId);
  }

  @Post(':ticketId/replies')
  createReply(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('ticketId') ticketId: string,
    @Body() body: { body: string; isAgent?: boolean },
  ) {
    return this.replies.create(orgId, ticketId, {
      ...body,
      authorId: user.id,
      isAgent: body.isAgent ?? true,
    });
  }
}
