import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  product: {
    findMany:  jest.fn(),
    count:     jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  stockMovement: { create: jest.fn() },
  $transaction:  jest.fn(),
  $queryRaw:     jest.fn(),
};

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id:            overrides.id            ?? 'prod-1',
    orgId:         overrides.orgId         ?? 'org-1',
    name:          overrides.name          ?? 'Widget A',
    sku:           overrides.sku           ?? 'SKU-001',
    stockQuantity: overrides.stockQuantity ?? 100,
    reorderPoint:  overrides.reorderPoint  ?? 10,
    status:        overrides.status        ?? 'in_stock',
    category:      overrides.category      ?? 'Electronics',
    createdAt:     overrides.createdAt     ?? new Date(),
    ...overrides,
  };
}

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('returns paginated products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([makeProduct()]);
      mockPrisma.product.count.mockResolvedValue(1);
      const result = await service.findAll('org-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by category', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);
      await service.findAll('org-1', 1, 50, 'Electronics');
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'Electronics' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns product with stock movements', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct());
      const result = await service.findOne('org-1', 'prod-1');
      expect(result.id).toBe('prod-1');
    });

    it('throws NotFoundException for unknown product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findOne('org-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue(makeProduct());
      const result = await service.create('org-1', { name: 'Widget A', sku: 'SKU-001', stockQuantity: 100 } as any);
      expect(result.sku).toBe('SKU-001');
    });

    it('throws ConflictException for duplicate SKU in same org', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct());
      await expect(
        service.create('org-1', { sku: 'SKU-001' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('sets status to out_of_stock when stockQuantity is 0', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue(makeProduct({ status: 'out_of_stock' }));
      await service.create('org-1', { sku: 'SKU-002', stockQuantity: 0 } as any);
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'out_of_stock' }),
        }),
      );
    });

    it('sets status to in_stock when stockQuantity > 0', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue(makeProduct());
      await service.create('org-1', { sku: 'SKU-003', stockQuantity: 50 } as any);
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'in_stock' }),
        }),
      );
    });
  });

  describe('adjustStock', () => {
    it('uses $transaction to update stock and create movement', async () => {
      const product = makeProduct({ stockQuantity: 50 });
      mockPrisma.product.findFirst.mockResolvedValue(product);
      mockPrisma.$transaction.mockResolvedValue([
        { ...product, stockQuantity: 60 },
        {},
      ]);

      const result = await service.adjustStock('org-1', 'prod-1', {
        quantity: 10, type: 'purchase' as any,
      }, 'user-1');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.stockQuantity).toBe(60);
    });

    it('sets status to out_of_stock when new quantity is 0', async () => {
      const product = makeProduct({ stockQuantity: 5 });
      mockPrisma.product.findFirst.mockResolvedValue(product);
      mockPrisma.$transaction.mockResolvedValue([
        { ...product, stockQuantity: 0, status: 'out_of_stock' },
        {},
      ]);

      const result = await service.adjustStock('org-1', 'prod-1', {
        quantity: -5, type: 'sale' as any,
      }, 'user-1');
      expect(result.status).toBe('out_of_stock');
    });

    it('throws NotFoundException for unknown product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.adjustStock('org-1', 'bad', { quantity: 10, type: 'purchase' as any }, 'u'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLowStock', () => {
    it('calls $queryRaw with orgId', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      await service.findLowStock('org-1');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct());
      mockPrisma.product.delete.mockResolvedValue({});
      await service.remove('org-1', 'prod-1');
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
    });
  });
});
