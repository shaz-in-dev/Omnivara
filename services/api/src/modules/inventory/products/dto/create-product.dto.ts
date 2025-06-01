import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty() @IsString() sku!: string;
  @ApiProperty() @IsString() name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseLocation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierId?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() unitCost?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() salePrice?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) reorderPoint?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) reorderQuantity?: number;
}

export class AdjustStockDto {
  @ApiProperty({ description: 'Positive = add, negative = remove' }) @Type(() => Number) @IsInt() quantity!: number;
  @ApiProperty() @IsString() type!: string; // PURCHASE | SALE | ADJUSTMENT | RETURN | DAMAGE
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
