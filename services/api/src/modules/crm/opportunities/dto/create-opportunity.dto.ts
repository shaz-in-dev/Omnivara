import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityStage } from '@prisma/client';

export class CreateOpportunityDto {
  @ApiProperty() @IsString() @MaxLength(300) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactId?: string;
  @ApiPropertyOptional({ enum: OpportunityStage }) @IsOptional() @IsEnum(OpportunityStage) stage?: OpportunityStage;
  @ApiPropertyOptional() @IsOptional() amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) probability?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expectedCloseDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}
