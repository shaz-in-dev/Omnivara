import { Test } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1';

const mockInvoice = {
  id: 'inv-1',
  orgId: ORG_ID,
  number: 'INV-0001',
  status: 'draft',
  accountId: null,
  account: null,
  currency: 'USD',
  subtotal: 1000,
  taxAmount: 100,
  total: 1100,
  dueDate: null,
  paidAt: null,
  notes: null,
  lineItems: [
    { id: 'li-1', invoiceId: 'inv-1', description: 'Consulting', quantity: 10, unitPrice: 100, amount: 1000 },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(InvoicesService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calculates subtotal, taxAmount, and total from line items', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue(mockInvoice);

      await service.create(ORG_ID, {
        clientName: 'Acme Corp',
        taxRate: 10,
        lineItems: [{ description: 'Consulting', quantity: 10, unitPrice: 100 }],
      });

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 1000,
            taxAmount: 100,
            total: 1100,
          }),
        }),
      );
    });

    it('auto-generates invoice number when none provided', async () => {
      mockPrisma.invoice.count.mockResolvedValue(4);
      mockPrisma.invoice.create.mockResolvedValue({ ...mockInvoice, number: 'INV-0005' });

      await service.create(ORG_ID, {
        clientName: 'Beta Corp',
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 50 }],
      });

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ number: 'INV-0005' }),
        }),
      );
    });

    it('uses provided number when given', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue(mockInvoice);

      await service.create(ORG_ID, {
        clientName: 'Gamma LLC',
        number: 'CUSTOM-001',
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 200 }],
      });

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ number: 'CUSTOM-001' }),
        }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns invoice when found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.findOne(ORG_ID, 'inv-1');

      expect(result.id).toBe('inv-1');
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.findOne(ORG_ID, 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── send ────────────────────────────────────────────────────────────────────

  describe('send', () => {
    it('updates invoice status to sent', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'sent' });

      const result = await service.send(ORG_ID, 'inv-1');

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({ status: 'sent' }),
        }),
      );
      expect(result.status).toBe('sent');
    });
  });

  // ── updateStatus ────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('updates to provided status', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'paid' });

      await service.updateStatus(ORG_ID, 'inv-1', 'paid' as any);

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'paid' } }),
      );
    });
  });
});
