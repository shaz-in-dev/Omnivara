import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

export interface SlackConfigDto {
  accessToken: string;
  channelId:   string;
  channelName: string;
}

export interface SlackDomainEvent {
  orgId:   string;
  type:    'lead.created' | 'ticket.created' | 'ticket.resolved' | 'invoice.paid' | 'opportunity.won';
  payload: Record<string, unknown>;
}

const SLACK_API = 'https://slack.com/api';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly http:   HttpService,
  ) {}

  // ── Config ───────────────────────────────────────────────────────────────────

  async getConfig(orgId: string) {
    return this.prisma.slackIntegration.findUnique({ where: { orgId } });
  }

  async saveConfig(orgId: string, installedBy: string, dto: SlackConfigDto) {
    return this.prisma.slackIntegration.upsert({
      where:  { orgId },
      create: { orgId, installedBy, ...dto },
      update: { ...dto },
    });
  }

  async removeConfig(orgId: string) {
    const existing = await this.prisma.slackIntegration.findUnique({ where: { orgId } });
    if (!existing) throw new NotFoundException('Slack integration not configured');
    await this.prisma.slackIntegration.delete({ where: { orgId } });
  }

  // ── Event Listeners ──────────────────────────────────────────────────────────

  @OnEvent('slack.notify')
  onSlackEvent(event: SlackDomainEvent): void {
    void this._handleEvent(event).catch((err: Error) => {
      this.logger.warn(`Slack notify failed: ${err.message}`);
    });
  }

  // ── Messaging ────────────────────────────────────────────────────────────────

  async sendTest(orgId: string) {
    const config = await this.prisma.slackIntegration.findUnique({ where: { orgId } });
    if (!config) throw new NotFoundException('Slack integration not configured');
    await this._postMessage(config.accessToken, config.channelId, {
      text: '✅ Omnivara connection test — everything looks good!',
    });
    return { ok: true };
  }

  private async _handleEvent(event: SlackDomainEvent): Promise<void> {
    const config = await this.prisma.slackIntegration.findUnique({ where: { orgId: event.orgId } });
    if (!config) return;

    const message = this._buildMessage(event);
    if (!message) return;

    await this._postMessage(config.accessToken, config.channelId, message);
  }

  private _buildMessage(event: SlackDomainEvent): { text: string; blocks?: unknown[] } | null {
    const p = event.payload;

    switch (event.type) {
      case 'lead.created':
        return {
          text: `🎯 New lead: *${String(p.name ?? 'Unknown')}*`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🎯 *New Lead Created*\n*Name:* ${String(p.name ?? '—')}\n*Email:* ${String(p.email ?? '—')}\n*Status:* ${String(p.status ?? 'new')}`,
              },
              accessory: p.id ? {
                type:  'button',
                text:  { type: 'plain_text', text: 'View Lead' },
                url:   `${String(p.appUrl ?? '')}/crm/leads`,
                style: 'primary',
              } : undefined,
            },
          ],
        };

      case 'ticket.created':
        return {
          text: `🎫 New ticket: *${String(p.subject ?? 'Untitled')}*`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🎫 *New Support Ticket*\n*Subject:* ${String(p.subject ?? '—')}\n*Priority:* ${String(p.priority ?? 'medium')}\n*Channel:* ${String(p.channel ?? 'email')}`,
              },
            },
          ],
        };

      case 'ticket.resolved':
        return {
          text: `✅ Ticket resolved: *${String(p.subject ?? 'Untitled')}*`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Ticket Resolved*\n*Subject:* ${String(p.subject ?? '—')}`,
              },
            },
          ],
        };

      case 'invoice.paid':
        return {
          text: `💰 Invoice paid: *${String(p.number ?? '—')}* — ${String(p.total ?? '0')} ${String(p.currency ?? 'USD')}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `💰 *Invoice Paid*\n*Invoice:* ${String(p.number ?? '—')}\n*Amount:* ${String(p.total ?? '0')} ${String(p.currency ?? 'USD')}`,
              },
            },
          ],
        };

      case 'opportunity.won':
        return {
          text: `🏆 Deal won: *${String(p.name ?? 'Unknown')}*`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🏆 *Deal Won!* 🎉\n*Opportunity:* ${String(p.name ?? '—')}\n*Value:* ${String(p.value ?? '0')}`,
              },
            },
          ],
        };

      default:
        return null;
    }
  }

  private async _postMessage(
    token: string,
    channel: string,
    message: { text: string; blocks?: unknown[] },
  ): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ ok: boolean; error?: string }>(
        `${SLACK_API}/chat.postMessage`,
        { channel, ...message },
        {
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error ?? 'unknown'}`);
    }
  }
}
