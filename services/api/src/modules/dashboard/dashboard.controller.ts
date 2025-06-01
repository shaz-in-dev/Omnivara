import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated dashboard statistics for an org' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000) // 60 seconds
  getStats(@Param('orgId') orgId: string) {
    return this.dashboard.getStats(orgId);
  }
}
