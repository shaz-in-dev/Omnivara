import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Local types (API schema) ──────────────────────────────────────────────────

export interface ApiStockMovement {
  id: string;
  quantity: number; // positive = in, negative = out
  type: string;     // PURCHASE | SALE | ADJUSTMENT | RETURN | DAMAGE
  notes: string | null;
  reference: string | null;
  createdAt: string;
}

export interface ApiProduct {
  id: string;
  orgId: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  /** Decimal — may arrive as string from Prisma JSON; coerce with Number() */
  unitCost: number;
  salePrice: number;
  /** Note: API field name is stockQuantity (Prisma schema), not stock */
  stockQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  warehouseLocation: string | null;
  supplierId: string | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  /** Only present on single-product GET (findOne) */
  stockMovements?: ApiStockMovement[];
  createdAt: string;
  updatedAt: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface ListProductsParams {
  orgId: string;
  category?: string | undefined;
  status?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get(`/orgs/${params.orgId}/inventory/products`, {
        params: {
          ...(params.category ? { category: params.category } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
      });
      const payload = data?.data ?? data;
      return payload as { items: ApiProduct[]; total: number; page: number; totalPages: number };
    },
    enabled: !!params.orgId,
  });
}

export function useProduct(orgId: string, productId: string) {
  return useQuery({
    queryKey: ['products', orgId, productId],
    queryFn: async () => {
      const { data } = await api.get(`/orgs/${orgId}/inventory/products/${productId}`);
      return (data?.data ?? data) as ApiProduct;
    },
    enabled: !!orgId && !!productId,
  });
}

export function useCreateProduct(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      sku: string;
      name: string;
      category?: string;
      unitCost?: number;
      salePrice?: number;
      reorderPoint?: number;
      warehouseLocation?: string;
    }) => {
      const { data } = await api.post(`/orgs/${orgId}/inventory/products`, body);
      return (data?.data ?? data) as ApiProduct;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<ApiProduct> & { id: string }) => {
      const { data } = await api.put(`/orgs/${orgId}/inventory/products/${id}`, body);
      return (data?.data ?? data) as ApiProduct;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useAdjustStock(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      type,
      quantity,
      reason,
    }: {
      id: string;
      type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage';
      quantity: number;
      reason?: string;
    }) => {
      const { data } = await api.post(`/orgs/${orgId}/inventory/products/${id}/adjust`, {
        type,
        quantity,
        ...(reason ? { reason } : {}),
      });
      return (data?.data ?? data) as ApiProduct;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
