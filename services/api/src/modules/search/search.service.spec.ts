import { Test } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  lead:        { findMany: jest.fn() },
  contact:     { findMany: jest.fn() },
  account:     { findMany: jest.fn() },
  opportunity: { findMany: jest.fn() },
  ticket:      { findMany: jest.fn() },
  invoice:     { findMany: jest.fn() },
  project:     { findMany: jest.fn() },
  task:        { findMany: jest.fn() },
};

function emptyResults() {
  Object.values(mockPrisma).forEach((m) => m.findMany.mockResolvedValue([]));
}

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SearchService);
  });

  describe('search', () => {
    it('returns empty array for empty query', async () => {
      const result = await service.search('org-1', '');
      expect(result).toHaveLength(0);
      expect(mockPrisma.lead.findMany).not.toHaveBeenCalled();
    });

    it('returns empty array for single-character query', async () => {
      const result = await service.search('org-1', 'a');
      expect(result).toHaveLength(0);
    });

    it('returns empty array for whitespace-only query', async () => {
      const result = await service.search('org-1', '   ');
      expect(result).toHaveLength(0);
    });

    it('searches all 8 entity types for a valid query', async () => {
      emptyResults();
      await service.search('org-1', 'alice');
      expect(mockPrisma.lead.findMany).toHaveBeenCalled();
      expect(mockPrisma.contact.findMany).toHaveBeenCalled();
      expect(mockPrisma.account.findMany).toHaveBeenCalled();
      expect(mockPrisma.opportunity.findMany).toHaveBeenCalled();
      expect(mockPrisma.ticket.findMany).toHaveBeenCalled();
      expect(mockPrisma.invoice.findMany).toHaveBeenCalled();
      expect(mockPrisma.project.findMany).toHaveBeenCalled();
      expect(mockPrisma.task.findMany).toHaveBeenCalled();
    });

    it('all DB calls are scoped to orgId', async () => {
      emptyResults();
      await service.search('org-99', 'test');
      for (const model of Object.values(mockPrisma)) {
        if (model.findMany.mock.calls.length > 0) {
          expect(model.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ orgId: 'org-99' }) }),
          );
        }
      }
    });

    it('returns results from multiple entity types with correct shape', async () => {
      emptyResults();
      mockPrisma.lead.findMany.mockResolvedValue([
        { id: 'l-1', name: 'Alice Lead', email: 'alice@x.com', company: 'Acme', status: 'new' },
      ]);
      mockPrisma.contact.findMany.mockResolvedValue([
        { id: 'c-1', name: 'Alice Contact', email: 'alice@y.com', title: 'CEO' },
      ]);

      const results = await service.search('org-1', 'alice');
      expect(results.length).toBeGreaterThanOrEqual(2);

      const lead = results.find((r) => r.type === 'lead');
      expect(lead).toBeDefined();
      expect(lead?.id).toBe('l-1');
      expect(lead?.url).toContain('/crm/leads');

      const contact = results.find((r) => r.type === 'contact');
      expect(contact).toBeDefined();
      expect(contact?.url).toContain('/crm/contacts');
    });

    it('sorts exact-title-starts-with matches first', async () => {
      emptyResults();
      mockPrisma.lead.findMany.mockResolvedValue([
        { id: 'l-1', name: 'Test Lead',     email: '', company: null, status: 'new' },
        { id: 'l-2', name: 'Great Test Co', email: '', company: null, status: 'new' },
      ]);

      const results = await service.search('org-1', 'test');
      const leadResults = results.filter((r) => r.type === 'lead');
      // 'Test Lead' starts with 'test' (case-insensitive) so should come first
      expect(leadResults[0]?.id).toBe('l-1');
    });

    it('respects limit parameter (default 20)', async () => {
      emptyResults();
      const manyLeads = Array.from({ length: 30 }, (_, i) => ({
        id: `l-${i}`, name: `Lead ${i}`, email: '', company: null, status: 'new',
      }));
      mockPrisma.lead.findMany.mockResolvedValue(manyLeads);

      const results = await service.search('org-1', 'lead', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('result url fields contain correct route prefixes', async () => {
      emptyResults();
      mockPrisma.ticket.findMany.mockResolvedValue([
        { id: 't-1', subject: 'Login bug', status: 'open', priority: 'high' },
      ]);
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'inv-1', number: 'INV-001', status: 'sent', total: 500 },
      ]);

      const results = await service.search('org-1', 'bug');
      const ticket  = results.find((r) => r.type === 'ticket');
      const invoice = results.find((r) => r.type === 'invoice');
      expect(ticket?.url).toContain('/helpdesk');
      expect(invoice?.url).toContain('/finance');
    });
  });
});
