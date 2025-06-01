import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, AdjustStockDto } from './dto/create-product.dto';

@ApiTags('Inventory — Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/inventory/products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products' })
  findAll(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.products.findAll(orgId, page ? +page : 1, limit ? +limit : 50, category, status);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Products at or below reorder point' })
  lowStock(@Param('orgId') orgId: string) {
    return this.products.findLowStock(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product with stock movement history' })
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.products.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product / SKU' })
  create(@Param('orgId') orgId: string, @Body() dto: CreateProductDto) {
    return this.products.create(orgId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product details' })
  update(@Param('orgId') orgId: string, @Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.products.update(orgId, id, dto);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust stock quantity (add or remove units)' })
  adjust(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.products.adjustStock(orgId, id, dto, req.user?.id ?? 'system');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.products.remove(orgId, id);
  }
}
