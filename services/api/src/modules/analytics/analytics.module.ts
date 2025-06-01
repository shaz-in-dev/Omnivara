import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AdminController } from './admin.controller';
import { HealthScoreService } from './health-score.service';

@Module({
  controllers: [AnalyticsController, AdminController],
  providers:   [AnalyticsService, HealthScoreService],
  exports:     [HealthScoreService],
})
export class AnalyticsModule {}
