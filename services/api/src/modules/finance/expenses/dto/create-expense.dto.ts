import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExpenseCategory {
  TRAVEL  = 'travel',
  MEALS   = 'meals',
  SOFTWARE = 'software',
  OFFICE  = 'office',
  OTHER   = 'other',
}

export class CreateExpenseDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty({ enum: ExpenseCategory }) @IsEnum(ExpenseCategory) category!: ExpenseCategory;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiProperty() @IsDateString() date!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vendor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() receiptUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
