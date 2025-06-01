import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmploymentStatusDto {
  active = 'active',
  on_leave = 'on_leave',
  terminated = 'terminated',
  offboarding = 'offboarding',
}

export class CreateEmployeeDto {
  @ApiProperty() @IsString() firstName!: string;
  @ApiProperty() @IsString() lastName!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() jobTitle!: string;
  @ApiProperty() @IsString() department!: string;
  @ApiProperty() @IsDateString() startDate!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() managerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employeeNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salary?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(EmploymentStatusDto) status?: EmploymentStatusDto;
}
