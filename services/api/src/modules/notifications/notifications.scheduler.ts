import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

/**
 * Cleanup job: deletes notifications older than 90 days once per day at 3 AM UTC.
 */
@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly svc: NotificationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'notification-cleanup', timeZone: 'UTC' })
  async cleanupOldNotifications(): Promise<void> {
    try {
      const deleted = await this.svc.cleanup();
      this.logger.log(`Notification cleanup: removed ${deleted} old records`);
    } catch (err: unknown) {
      this.logger.warn(`Notification cleanup failed: ${(err as Error).message}`);
    }
  }
}
