import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsIn } from 'class-validator';
import { CreateTicketDto } from './create-ticket.dto';

const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'] as const;

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional() @IsIn(TICKET_STATUSES) status?: (typeof TICKET_STATUSES)[number];
}
