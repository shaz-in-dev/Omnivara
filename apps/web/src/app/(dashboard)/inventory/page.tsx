'use client';
import { useState } from 'react';
import { Plus, Search, AlertTriangle, Package, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { ProductDetail, type Product } from '@/components/inventory/product-detail';
import { useAuthStore } from '@/stores/auth.store';
import { useProducts, type ApiProduct } from '@/hooks/use-products';

const CATEGORIES = ['All', 'Software', 'Hardware', 'Accessories', 'Networking', 'Office'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function StockPill({ stock, reorder }: { stock: number; reorder: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" />Out of stock
      </span>
    );
  if (stock <= reorder)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />Low stock
      </span>
    );
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
      In stock
    </span>
  );
}

// ── Normalization: API → UI ───────────────────────────────────────────────────

function toUIProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category ?? 'Other',
    stock: p.stockQuantity,           // API uses stockQuantity, UI uses stock
    reorderPoint: p.reorderPoint,
    unitCost: Number(p.unitCost),     // Decimal -> number
    salePrice: Number(p.salePrice),
    ...(p.warehouseLocation ? { warehouseLocation: p.warehouseLocation } : {}),
    ...(p.description ? { description: p.description } : {}),
    updatedAt: (p.updatedAt ?? '').split('T')[0] ?? p.updatedAt,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useProducts({
    orgId,
    category: category === 'All' ? undefined : category,
  });

  const apiProducts = data?.items ?? [];
  const products: Product[] = apiProducts.map(toUIProduct);

  // Client-side filters (search + stock level)
  const filtered = products.filter((p) => {
    const matchSearch = !search || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(search.toLowerCase());
    const matchStock =
      stockFilter === 'all' ||
      (stockFilter === 'out' && p.stock === 0) ||
      (stockFilter === 'low' && p.stock > 0 && p.stock <= p.reorderPoint);
    return matchSearch && matchStock;
  });

  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.reorderPoint).length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.unitCost, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory & Procurement</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isLoading ? 'Loading…' : `${data?.total ?? 0} product${(data?.total ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        {/* Alert banner */}
        {!isLoading && (outOfStock > 0 || lowStock > 0) && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-800/50 dark:bg-amber-900/10">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {outOfStock > 0 && <><strong>{outOfStock} product{outOfStock > 1 ? 's' : ''}</strong> out of stock · </>}
              {lowStock > 0 && <><strong>{lowStock} product{lowStock > 1 ? 's' : ''}</strong> below reorder point</>}
              {' — '}
              <button onClick={() => setStockFilter('low')} className="underline hover:no-underline">
                View all low-stock items
              </button>
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Package,      label: 'Total SKUs',       value: isLoading ? '—' : data?.total ?? 0,           color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
            { icon: AlertTriangle, label: 'Out of Stock',    value: isLoading ? '—' : outOfStock,                  color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
            { icon: TrendingDown, label: 'Low Stock',        value: isLoading ? '—' : lowStock,                    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
            { icon: DollarSign,   label: 'Inventory Value',  value: isLoading ? '—' : `$${(totalValue / 1000).toFixed(1)}k`, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          ].map((s) => {
            const Icon = s.icon;
            const parts = s.color.split(' ');
            const textC = parts[0] ?? '';
            const bgC = parts.slice(1).join(' ');
            return (
              <div key={s.label} className={`flex items-center gap-3 rounded-2xl p-4 ${bgC}`}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/10">
                  <Icon className={`h-4 w-4 ${textC}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${textC}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
            {([['all', 'All'], ['low', 'Low stock'], ['out', 'Out of stock']] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setStockFilter(v)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  stockFilter === v ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex h-48 items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            <span className="text-sm">Loading products…</span>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-gray-400">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm">Could not load products</p>
            <button onClick={() => void refetch()} className="text-sm text-brand-600 hover:underline">Try again</button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Product', 'SKU', 'Category', 'Stock', 'Unit Price', 'Value', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => { setSelectedProduct(product); setDrawerOpen(true); }}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{product.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock <= product.reorderPoint ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {product.salePrice > 0 ? `$${product.salePrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {product.unitCost > 0 ? `$${(product.stock * product.unitCost).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StockPill stock={product.stock} reorder={product.reorderPoint} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-brand-600 dark:text-brand-400">Details →</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                      {search || category !== 'All' || stockFilter !== 'all'
                        ? 'No products match your filter.'
                        : 'No products yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductDetail
        orgId={orgId}
        product={selectedProduct}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
