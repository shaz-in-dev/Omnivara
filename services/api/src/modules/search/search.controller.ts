import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SearchService } from './search.service';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global full-text search across all modules' })
  @ApiQuery({ name: 'q', description: 'Search query (min 2 chars)', required: true })
  @ApiQuery({ name: 'limit', description: 'Max results (default 20, max 50)', required: false })
  query(
    @Param('orgId') orgId: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search(orgId, q, limit ? parseInt(limit, 10) : 20);
  }
}
