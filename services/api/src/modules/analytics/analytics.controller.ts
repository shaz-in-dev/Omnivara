import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated analytics across all modules for an org' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000) // 60 seconds
  getAnalytics(@Param('orgId') orgId: string) {
    return this.analytics.getAnalytics(orgId);
  }
}
