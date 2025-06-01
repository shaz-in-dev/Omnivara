import { Test } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

const mockService = { search: jest.fn() };

describe('SearchController', () => {
  let controller: SearchController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [SearchController],
      providers:   [{ provide: SearchService, useValue: mockService }],
    }).compile();
    controller = module.get(SearchController);
  });

  describe('query', () => {
    it('calls service with orgId, query, and default limit 20', async () => {
      mockService.search.mockResolvedValue([]);
      await controller.query('org-1', 'alice');
      expect(mockService.search).toHaveBeenCalledWith('org-1', 'alice', 20);
    });

    it('passes numeric limit when provided', async () => {
      mockService.search.mockResolvedValue([]);
      await controller.query('org-1', 'test', '10');
      expect(mockService.search).toHaveBeenCalledWith('org-1', 'test', 10);
    });

    it('returns search results', async () => {
      const results = [
        { id: 'l-1', type: 'lead', title: 'Alice', url: '/crm/leads?id=l-1' },
      ];
      mockService.search.mockResolvedValue(results);
      const out = await controller.query('org-1', 'alice');
      expect(out).toEqual(results);
    });
  });
});
