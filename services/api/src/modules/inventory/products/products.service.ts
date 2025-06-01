import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import type { CreateProductDto, AdjustStockDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page = 1, limit = 50, category?: string, status?: string) {
    const where = {
      orgId,
      ...(category && { category }),
      ...(status && { status: status as any }),
    };
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        ...paginate(page, limit),
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findLowStock(orgId: string) {
    // Products at or below reorder point (but not out of stock)
    return this.prisma.$queryRaw`
      SELECT * FROM products
      WHERE org_id = ${orgId}
        AND stock_quantity > 0
        AND stock_quantity <= reorder_point
        AND status != 'discontinued'
      ORDER BY stock_quantity ASC
    `;
  }

  async findOne(orgId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, orgId },
      include: {
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(orgId: string, dto: CreateProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { orgId, sku: dto.sku } });
    if (existing) throw new ConflictException(`SKU "${dto.sku}" already exists`);
    return this.prisma.product.create({
      data: {
        orgId,
        ...dto,
        status: (dto.stockQuantity ?? 0) === 0 ? 'out_of_stock' : 'in_stock',
      },
    });
  }

  async update(orgId: string, id: string, dto: Partial<CreateProductDto>) {
    await this.findOne(orgId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async adjustStock(orgId: string, id: string, dto: AdjustStockDto, performedBy: string) {
    const product = await this.findOne(orgId, id);
    const newQty = product.stockQuantity + dto.quantity;

    const [updated] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: {
          stockQuantity: { increment: dto.quantity },
          status: newQty <= 0 ? 'out_of_stock' : newQty <= product.reorderPoint ? 'low_stock' : 'in_stock',
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          orgId,
          productId: id,
          quantity: dto.quantity,
          type: dto.type,
          reference: dto.reference,
          notes: dto.notes,
          performedBy,
        },
      }),
    ]);

    return updated;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.product.delete({ where: { id } });
  }
}
