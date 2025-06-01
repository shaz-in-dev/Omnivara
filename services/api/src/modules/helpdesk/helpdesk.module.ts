import { Module } from '@nestjs/common';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';
import { TicketRepliesService } from './tickets/ticket-replies.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketRepliesService],
  exports: [TicketsService, TicketRepliesService],
})
export class HelpdeskModule {}
