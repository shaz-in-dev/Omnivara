import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiBriefScheduler } from './ai-brief.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    HttpModule.register({ timeout: 30_000 }), // AI requests can be slow
    NotificationsModule,
  ],
  controllers: [AiController],
  providers:   [AiService, AiBriefScheduler],
  exports:     [AiService],
})
export class AiModule {}
