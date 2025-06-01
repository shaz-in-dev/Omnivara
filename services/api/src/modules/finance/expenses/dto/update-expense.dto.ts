import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateExpenseDto } from './create-expense.dto';

export enum ExpenseStatus {
  DRAFT      = 'draft',
  SUBMITTED  = 'submitted',
  APPROVED   = 'approved',
  REJECTED   = 'rejected',
  REIMBURSED = 'reimbursed',
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @ApiPropertyOptional({ enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;
}
