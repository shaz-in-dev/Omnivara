import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { ExpenseStatus } from './update-expense.dto';
import { ExpenseCategory } from './create-expense.dto';

export class ListExpensesDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() submittedBy?: string;
  @ApiPropertyOptional({ enum: ExpenseStatus }) @IsOptional() @IsEnum(ExpenseStatus) status?: ExpenseStatus;
  @ApiPropertyOptional({ enum: ExpenseCategory }) @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
}
