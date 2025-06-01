import {
  IsString, IsOptional, IsNumber, IsArray, ValidateNested,
  IsEmail, Min, IsDateString, IsNotEmpty, IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LineItemDto {
  @IsString() @IsNotEmpty() description!: string;
  @IsNumber() @IsPositive() quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class CreateInvoiceDto {
  /** Optional — auto-generated if omitted */
  @IsOptional() @IsString() number?: string;

  @IsString() @IsNotEmpty() clientName!: string;

  @IsOptional() @IsEmail() clientEmail?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto)
  lineItems!: LineItemDto[];

  /** ISO date string, e.g. "2026-06-30" */
  @IsOptional() @IsDateString() dueDate?: string;

  @IsOptional() @IsString() notes?: string;

  /** ISO-4217 currency code, defaults to "USD" */
  @IsOptional() @IsString() currency?: string;

  /** Tax rate as a percentage, e.g. 10 for 10%. Defaults to 0. */
  @IsOptional() @IsNumber() @Min(0) taxRate?: number;
}
