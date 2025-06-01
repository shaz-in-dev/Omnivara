import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ContactsImportService } from './contacts.import.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  account: { findMany:    jest.fn() },
  contact: { createMany: jest.fn() },
};

function csvBuffer(rows: string[]): Buffer {
  return Buffer.from(['name,email,phone,title,company,department', ...rows].join('\n'));
}

describe('ContactsImportService', () => {
  let service: ContactsImportService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.account.findMany.mockResolvedValue([]);
    const module = await Test.createTestingModule({
      providers: [
        ContactsImportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ContactsImportService);
  });

  describe('importCsv', () => {
    it('imports valid rows and returns imported count', async () => {
      mockPrisma.contact.createMany.mockResolvedValue({ count: 2 });
      const csv = csvBuffer([
        'Emma Thompson,emma@techcorp.io,+1 555 0200,VP Engineering,TechCorp Inc,Engineering',
        'James Wilson,j.wilson@example.com,,COO,,Operations',
      ]);

      const result = await service.importCsv('org-1', 'user-1', csv);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('throws BadRequestException for empty CSV', async () => {
      const csv = Buffer.from('name,email,phone,title,company,department\n');
      await expect(service.importCsv('org-1', 'user-1', csv)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when CSV exceeds 5000 rows', async () => {
      const rows = Array.from({ length: 5001 }, (_, i) => `Contact ${i},c${i}@x.com,,,,`);
      const csv = csvBuffer(rows);
      await expect(service.importCsv('org-1', 'user-1', csv)).rejects.toThrow(BadRequestException);
    });

    it('skips rows with missing name and records error with row number', async () => {
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer([
        'Alice,alice@x.com,,,,',  // valid row 2
        ',noname@x.com,,,,',      // invalid row 3
      ]);

      const result = await service.importCsv('org-1', 'user-1', csv);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.row).toBe(3);
      expect(result.errors[0]!.reason).toContain('name');
    });

    it('resolves company name to accountId using pre-loaded account list', async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        { id: 'acc-1', name: 'Acme Corp' },
      ]);
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer(['Bob Smith,bob@acme.com,,,Acme Corp,Sales']);

      await service.importCsv('org-1', 'user-1', csv);
      const call = mockPrisma.contact.createMany.mock.calls[0]![0] as any;
      expect(call.data[0].accountId).toBe('acc-1');
    });

    it('omits accountId when company name does not match any account', async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer(['Carol,carol@x.com,,,Unknown Corp,']);

      await service.importCsv('org-1', 'user-1', csv);
      const call = mockPrisma.contact.createMany.mock.calls[0]![0] as any;
      expect(call.data[0]).not.toHaveProperty('accountId');
    });

    it('company name matching is case-insensitive', async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        { id: 'acc-1', name: 'TechCorp Inc' },
      ]);
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer(['Dave,d@x.com,,,techcorp inc,']);

      await service.importCsv('org-1', 'user-1', csv);
      const call = mockPrisma.contact.createMany.mock.calls[0]![0] as any;
      expect(call.data[0].accountId).toBe('acc-1');
    });

    it('scopes all contacts to orgId', async () => {
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer(['Eve,e@x.com,,,,']);
      await service.importCsv('org-99', 'user-1', csv);
      const call = mockPrisma.contact.createMany.mock.calls[0]![0] as any;
      expect(call.data[0].orgId).toBe('org-99');
    });

    it('uses caller userId as ownerId', async () => {
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer(['Frank,f@x.com,,,,']);
      await service.importCsv('org-1', 'owner-99', csv);
      const call = mockPrisma.contact.createMany.mock.calls[0]![0] as any;
      expect(call.data[0].ownerId).toBe('owner-99');
    });

    it('calls createMany with skipDuplicates', async () => {
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer(['Grace,g@x.com,,,,']);
      await service.importCsv('org-1', 'user-1', csv);
      expect(mockPrisma.contact.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
    });

    it('omits optional fields when blank', async () => {
      mockPrisma.contact.createMany.mockResolvedValue({ count: 1 });
      const csv = csvBuffer(['Henry,,,,, ']); // only name
      await service.importCsv('org-1', 'user-1', csv);
      const call = mockPrisma.contact.createMany.mock.calls[0]![0] as any;
      const row = call.data[0];
      expect(row).not.toHaveProperty('email');
      expect(row).not.toHaveProperty('phone');
    });

    it('throws BadRequestException when all rows are invalid', async () => {
      const csv = csvBuffer([
        ',noname1@x.com,,,,',
        ',noname2@x.com,,,,',
      ]);
      await expect(service.importCsv('org-1', 'user-1', csv)).rejects.toThrow(BadRequestException);
    });
  });

  describe('csvTemplate', () => {
    it('returns header line first', () => {
      const template = ContactsImportService.csvTemplate();
      expect(template.startsWith('name,email')).toBe(true);
    });

    it('includes at least 2 example rows', () => {
      const lines = ContactsImportService.csvTemplate().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });
  });
});
