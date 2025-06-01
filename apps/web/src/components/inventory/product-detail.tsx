'use client';
import { useState } from 'react';
import { Package, Tag, AlertTriangle, BarChart2, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { SlideOver } from '@/components/shared/slide-over';
import { useProduct, useAdjustStock } from '@/hooks/use-products';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reorderPoint: number;
  unitCost: number;
  salePrice: number;
  supplier?: string;
  warehouseLocation?: string;
  description?: string;
  updatedAt: string;
}

function StockBar({ stock, reorder }: { stock: number; reorder: number }) {
  const max = Math.max(stock, reorder * 3);
  const pct = Math.min((stock / max) * 100, 100);
  const reorderPct = (reorder / max) * 100;
  const color = stock === 0 ? 'bg-red-500' : stock <= reorder ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      <div
        className="absolute top-0 h-full w-0.5 bg-orange-400"
        style={{ left: `${reorderPct}%` }}
        title={`Reorder at ${reorder}`}
      />
    </div>
  );
}

const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  PURCHASE:   'Restock',
  SALE:       'Sale',
  ADJUSTMENT: 'Adjustment',
  RETURN:     'Return',
  DAMAGE:     'Damage',
  purchase:   'Restock',
  sale:       'Sale',
  adjustment: 'Adjustment',
  return:     'Return',
  damage:     'Damage',
};

interface Props {
  orgId: string;
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductDetail({ orgId, product, open, onClose }: Props) {
  const [adjusting, setAdjusting] = useState(false);
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Fetch full product with stock movements when drawer is open
  const { data: fullProduct } = useProduct(
    orgId,
    product?.id ?? '',
  );
  const adjustStock = useAdjustStock(orgId);

  if (!product) return null;

  const stockMovements = fullProduct?.stockMovements ?? [];
  const stockStatus = product.stock === 0 ? 'out' : product.stock <= product.reorderPoint ? 'low' : 'ok';
  const margin = product.salePrice > 0 ? ((product.salePrice - product.unitCost) / product.salePrice * 100).toFixed(1) : '0';

  const handleAdjust = async () => {
    const qty = parseInt(adjQty, 10);
    if (!adjQty || isNaN(qty)) return;
    const type = qty >= 0 ? 'adjustment' : 'adjustment';
    await adjustStock.mutateAsync({
      id: product.id,
      type,
      quantity: Math.abs(qty),
      ...(adjReason ? { reason: adjReason } : {}),
    });
    setAdjusting(false);
    setAdjQty('');
    setAdjReason('');
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={product.name}
      subtitle={`SKU: ${product.sku}`}
      width="md"
      footer={
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => setAdjusting(!adjusting)}
            className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Adjust Stock
          </button>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      }
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Stock status */}
        <div className="px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock Level</span>
            {stockStatus !== 'ok' && (
              <span className={`flex items-center gap-1 text-xs font-medium ${stockStatus === 'out' ? 'text-red-500' : 'text-amber-500'}`}>
                <AlertTriangle className="h-3.5 w-3.5" />
                {stockStatus === 'out' ? 'Out of stock' : 'Low stock'}
              </span>
            )}
          </div>
          <StockBar stock={product.stock} reorder={product.reorderPoint} />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span><strong className="text-gray-700 dark:text-gray-300">{product.stock}</strong> units available</span>
            <span>Reorder at <strong className="text-orange-500">{product.reorderPoint}</strong></span>
          </div>
        </div>

        {/* Adjust stock form */}
        {adjusting && (
          <div className="bg-brand-50/50 px-6 py-4 dark:bg-brand-900/10">
            <h4 className="mb-3 text-xs font-semibold text-gray-700 dark:text-gray-300">Stock Adjustment</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  placeholder="Qty (+ add / - remove)"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <input
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Reason (restock, damaged, audit…)"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setAdjusting(false); setAdjQty(''); setAdjReason(''); }}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleAdjust()}
                  disabled={!adjQty || adjustStock.isPending}
                  className="flex-1 rounded-xl bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {adjustStock.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="grid grid-cols-3 gap-4 px-6 py-5">
          {[
            { label: 'Unit Cost', value: `$${Number(product.unitCost).toFixed(2)}` },
            { label: 'Sale Price', value: `$${Number(product.salePrice).toFixed(2)}` },
            { label: 'Margin', value: `${margin}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-base font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="px-6 py-5">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Details</h4>
          <dl className="space-y-2.5">
            {[
              { icon: Tag, label: 'Category', value: product.category },
              { icon: Package, label: 'Location', value: product.warehouseLocation ?? '—' },
              { icon: BarChart2, label: 'Status', value: product.stock === 0 ? 'Out of stock' : product.stock <= product.reorderPoint ? 'Low stock' : 'In stock' },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 flex-shrink-0 text-gray-300" />
                  <span className="w-20 flex-shrink-0 text-xs font-medium text-gray-400">{row.label}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{row.value}</span>
                </div>
              );
            })}
          </dl>
          {product.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-500">{product.description}</p>
          )}
        </div>

        {/* Movement history */}
        <div className="px-6 py-5">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Stock Movement</h4>
          {stockMovements.length === 0 ? (
            <p className="text-sm text-gray-400">No stock movements recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {stockMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {MOVEMENT_TYPE_LABEL[m.type] ?? m.type}
                    </span>
                    {m.notes && (
                      <span className="text-xs text-gray-400 italic">({m.notes})</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
}
