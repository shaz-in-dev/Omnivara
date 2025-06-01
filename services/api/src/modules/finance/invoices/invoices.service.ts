import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate, paginatedResponse } from '../../../common/dto/pagination.dto';
import { InvoiceStatus } from '@prisma/client';

export interface CreateInvoiceDto {
  number?: string;
  clientName: string;
  clientEmail?: string;
  currency?: string;
  taxRate?: number;
  dueDate?: string;
  notes?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  async findAll(orgId: string, page = 1, limit = 25, status?: InvoiceStatus) {
    const where = { orgId, ...(status && { status }) };
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { account: { select: { id: true, name: true } }, lineItems: true },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, orgId }, include: { lineItems: true, account: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(orgId: string, dto: CreateInvoiceDto) {
    const currency = dto.currency ?? 'USD';
    const taxRate  = dto.taxRate  ?? 0;

    const subtotal = dto.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Auto-generate invoice number if not provided
    const number = dto.number?.trim() || await this.nextInvoiceNumber(orgId);

    const invoice = await this.prisma.invoice.create({
      data: {
        orgId,
        number,
        currency,
        subtotal,
        taxAmount,
        total,
        notes: dto.notes ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        lineItems: {
          create: dto.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            amount: li.quantity * li.unitPrice,
          })),
        },
      },
      include: { lineItems: true, account: true },
    });
    this.emitter.emit('embed.record', {
      orgId,
      recordType: 'invoice',
      recordId:   invoice.id,
      content:    `Invoice ${invoice.number} for ${dto.clientName}. Total: ${invoice.total} ${invoice.currency}. Status: ${invoice.status}. Due: ${dto.dueDate ?? 'not set'}.`,
    });
    return invoice;
  }

  async send(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.sent },
      include: { lineItems: true, account: true },
    });
  }

  async updateStatus(orgId: string, id: string, status: InvoiceStatus) {
    await this.findOne(orgId, id);
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === InvoiceStatus.paid && { paidAt: new Date() }),
      },
    });
    if (status === InvoiceStatus.paid) {
      this.emitter.emit('webhook.dispatch', {
        orgId, event: 'invoice.paid',
        payload: { id: invoice.id, number: invoice.number, total: invoice.total, currency: invoice.currency },
      });
      this.emitter.emit('slack.notify', {
        orgId, type: 'invoice.paid',
        payload: { id: invoice.id, number: invoice.number, total: String(invoice.total), currency: invoice.currency },
      });
    }
    return invoice;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async nextInvoiceNumber(orgId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { orgId } });
    return `INV-${String(count + 1).padStart(4, '0')}`;
  }
}
