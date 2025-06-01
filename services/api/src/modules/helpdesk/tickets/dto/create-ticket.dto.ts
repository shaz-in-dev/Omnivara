import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const CHANNELS   = ['EMAIL', 'CHAT', 'PHONE', 'PORTAL', 'API'] as const;

export class CreateTicketDto {
  @IsString() @IsNotEmpty() subject!: string;

  @IsOptional() @IsString() description?: string;

  /** Defaults to "medium" */
  @IsOptional() @IsIn(PRIORITIES) priority?: (typeof PRIORITIES)[number];

  /** Defaults to "EMAIL" */
  @IsOptional() @IsIn(CHANNELS) channel?: (typeof CHANNELS)[number];

  @IsOptional() @IsString() contactName?: string;

  @IsOptional() @IsString({ each: true }) tags?: string[];
}
