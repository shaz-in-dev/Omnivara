'use client';
import { useState } from 'react';
import { Plus, Trash2, Send, Download, Loader2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InvoiceStatusBadge } from '@/components/shared/status-badge';
import { useCreateInvoice, useSendInvoice } from '@/hooks/use-invoices';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Required'),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
});

const schema = z.object({
  number: z.string().optional(),
  dueDate: z.string(),
  clientName: z.string().min(1, 'Required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  currency: z.string().default('USD'),
  taxRate: z.number().min(0).max(100).default(10),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one item'),
});
type FormValues = z.infer<typeof schema>;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];
const TAX_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'CA$', SGD: 'S$', AED: 'AED' };

interface Props {
  orgId: string;
  invoiceId?: string;
  onSaved?: () => void;
}

export function InvoiceBuilder({ orgId, invoiceId, onSaved }: Props) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState('DRAFT');

  const createInvoice = useCreateInvoice(orgId);
  const sendInvoice   = useSendInvoice(orgId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      number: '',
      dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString().substring(0, 10),
      clientName: '',
      clientEmail: '',
      currency: 'USD',
      taxRate: 10,
      notes: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const values = watch();
  const subtotal = values.lineItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const taxAmount = subtotal * ((values.taxRate || 0) / 100);
  const total = subtotal + taxAmount;
  const currencySymbol = TAX_SYMBOL[values.currency] ?? '$';

  const onSave = handleSubmit(async (data) => {
    const invoice = await createInvoice.mutateAsync({
      ...(data.number?.trim() ? { number: data.number.trim() } : {}),
      clientName: data.clientName,
      ...(data.clientEmail?.trim() ? { clientEmail: data.clientEmail.trim() } : {}),
      currency: data.currency,
      taxRate: data.taxRate,
      dueDate: data.dueDate,
      ...(data.notes?.trim() ? { notes: data.notes.trim() } : {}),
      lineItems: data.lineItems,
    });
    setCreatedId(invoice.id);
    onSaved?.();
  });

  const onSend = async () => {
    const id = createdId ?? invoiceId;
    if (!id) {
      // Save first, then send
      await handleSubmit(async (data) => {
        const invoice = await createInvoice.mutateAsync({
          ...(data.number?.trim() ? { number: data.number.trim() } : {}),
          clientName: data.clientName,
          ...(data.clientEmail?.trim() ? { clientEmail: data.clientEmail.trim() } : {}),
          currency: data.currency,
          taxRate: data.taxRate,
          dueDate: data.dueDate,
          ...(data.notes?.trim() ? { notes: data.notes.trim() } : {}),
          lineItems: data.lineItems,
        });
        await sendInvoice.mutateAsync(invoice.id);
        setCreatedId(invoice.id);
        setInvoiceStatus('SENT');
        onSaved?.();
      })();
      return;
    }
    await sendInvoice.mutateAsync(id);
    setInvoiceStatus('SENT');
  };

  const saving  = createInvoice.isPending;
  const sending = sendInvoice.isPending;
  const isSent  = invoiceStatus === 'SENT';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {invoiceId ? `Invoice #${values.number || invoiceId}` : 'New Invoice'}
          </h2>
          <InvoiceStatusBadge status={invoiceStatus} />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
          <button
            onClick={() => void onSend()}
            disabled={sending || saving || isSent}
            className="flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-700 dark:bg-brand-900/20"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? 'Sending…' : isSent ? 'Sent ✓' : 'Send Invoice'}
          </button>
          <button
            onClick={onSave}
            disabled={saving || isSent}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Invoice meta */}
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Bill To</h3>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Client name *</label>
                <input {...register('clientName')} className={inputCls} placeholder="Acme Corp" />
                {errors.clientName && <p className="mt-1 text-xs text-red-500">{errors.clientName.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
                <input {...register('clientEmail')} type="email" className={inputCls} placeholder="billing@acme.com" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Invoice # (auto if blank)</label>
                  <input {...register('number')} placeholder="INV-0001" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Currency</label>
                  <select {...register('currency')} className={inputCls}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Due date</label>
                <input {...register('dueDate')} type="date" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-6 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Line Items</h3>
            </div>

            <div className="grid grid-cols-12 gap-3 px-6 py-2 text-xs font-medium uppercase tracking-wider text-gray-400">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {fields.map((field, i) => {
                const qty = watch(`lineItems.${i}.quantity`) || 0;
                const price = watch(`lineItems.${i}.unitPrice`) || 0;
                const lineTotal = qty * price;
                return (
                  <div key={field.id} className="group grid grid-cols-12 items-center gap-3 px-6 py-3">
                    <div className="col-span-6">
                      <input
                        {...register(`lineItems.${i}.description`)}
                        placeholder="Service or product description"
                        className={`${inputCls} text-sm`}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        {...register(`lineItems.${i}.quantity`, { valueAsNumber: true })}
                        type="number" min={0} step={0.01}
                        className={`${inputCls} text-right text-sm`}
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{currencySymbol}</span>
                        <input
                          {...register(`lineItems.${i}.unitPrice`, { valueAsNumber: true })}
                          type="number" min={0} step={0.01}
                          className={`${inputCls} pl-6 text-right text-sm`}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {currencySymbol}{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        disabled={fields.length === 1}
                        className="rounded-lg p-1 text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 px-6 py-3 dark:border-gray-800">
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Plus className="h-4 w-4" />
                Add line item
              </button>
            </div>
          </div>

          {/* Totals + notes */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Notes / Payment terms</label>
              <textarea
                {...register('notes')}
                rows={4}
                placeholder="Payment due within 30 days. Bank transfer or credit card accepted."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>Tax</span>
                    <input
                      {...register('taxRate', { valueAsNumber: true })}
                      type="number" min={0} max={100} step={0.5}
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-center text-xs dark:border-gray-700 dark:bg-gray-800"
                    />
                    <span>%</span>
                  </div>
                  <span>{currencySymbol}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 dark:border-gray-800">
                  <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{currencySymbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white';
