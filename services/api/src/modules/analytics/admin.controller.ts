import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { HealthScoreService } from './health-score.service';

/**
 * Internal admin endpoints — protected by JWT only.
 * In production, additionally restrict to admin role or internal IP.
 */
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(private readonly healthScore: HealthScoreService) {}

  @Get('health-scores')
  @ApiOperation({ summary: 'List all org health scores (internal admin use)' })
  @ApiQuery({ name: 'tier', required: false, enum: ['green', 'yellow', 'red'] })
  async getHealthScores(@Query('tier') tier?: string) {
    if (tier === 'red') return this.healthScore.getAtRiskOrgs(40);
    if (tier === 'yellow') {
      const all = await this.healthScore.getAllOrgHealthScores();
      return all.filter((o) => o.tier === 'yellow');
    }
    return this.healthScore.getAllOrgHealthScores();
  }

  @Get('at-risk')
  @ApiOperation({ summary: 'List orgs at risk of churn (score < 40)' })
  getAtRisk() {
    return this.healthScore.getAtRiskOrgs(40);
  }
}
