import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Scheduler: sends AI daily briefs to active users every morning at 8:00 AM UTC.
 * Only sends to users in orgs with Growth or Business plans.
 */
@Injectable()
export class AiBriefScheduler {
  private readonly logger = new Logger(AiBriefScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 8 * * *', { name: 'daily-ai-brief', timeZone: 'UTC' })
  async sendDailyBriefs(): Promise<void> {
    this.logger.log('Starting daily AI brief delivery…');

    // Only send to orgs with paid plans
    const activeOrgs = await this.prisma.organization.findMany({
      where: { planId: { in: ['growth', 'business', 'enterprise'] } },
      select: {
        id: true,
        users: {
          select: {
            user: { select: { id: true, name: true } },
            role: { select: { name: true } },
          },
        },
      },
    });

    let sent = 0;
    let errors = 0;

    for (const org of activeOrgs) {
      for (const member of org.users) {
        try {
          const role = this._mapRole(member.role.name);
          const brief = await this.aiService.generateBrief(org.id, member.user.id, role) as {
            greeting?: string;
            items?: Array<{ title: string; priority: string; action_url?: string }>;
          };

          const topItem = brief.items?.[0];
          if (!topItem) continue;

          // Persist + broadcast in-app notification
          await this.notifications.emit({
            orgId:  org.id,
            userId: member.user.id,
            type:   'system',
            title:  '📋 Your Daily Brief is ready',
            body:   topItem.title,
            url:    '/ai',
          });

          sent++;
        } catch (err: unknown) {
          errors++;
          this.logger.warn(`Brief failed for user ${member.user.id}: ${(err as Error).message}`);
        }
      }
    }

    this.logger.log(`Daily briefs sent: ${sent}, errors: ${errors}`);
  }

  private _mapRole(roleName: string): string {
    const lower = roleName.toLowerCase();
    if (lower.includes('sales'))   return 'SALES';
    if (lower.includes('support')) return 'SUPPORT';
    if (lower.includes('finance')) return 'FINANCE';
    if (lower.includes('hr'))      return 'HR';
    return 'ADMIN';
  }
}
