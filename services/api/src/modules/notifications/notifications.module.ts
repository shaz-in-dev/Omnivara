import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsScheduler } from './notifications.scheduler';

@Module({
  controllers: [NotificationsController],
  providers:   [NotificationsService, NotificationsGateway, NotificationsScheduler],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
