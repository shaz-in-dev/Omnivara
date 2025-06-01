import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

export interface CreateWebhookDto {
  url:    string;
  events: string[];
}

export type WebhookEventName =
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'contact.created'
  | 'opportunity.created'
  | 'opportunity.won'
  | 'opportunity.lost'
  | 'ticket.created'
  | 'ticket.resolved'
  | 'ticket.closed'
  | 'invoice.created'
  | 'invoice.paid';

export interface WebhookEvent {
  orgId:   string;
  event:   WebhookEventName;
  payload: Record<string, unknown>;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1_000; // 1s, 2s, 4s

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly http:   HttpService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────────

  async findAll(orgId: string) {
    return this.prisma.webhook.findMany({
      where:   { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const hook = await this.prisma.webhook.findFirst({ where: { id, orgId } });
    if (!hook) throw new NotFoundException('Webhook not found');
    return hook;
  }

  async create(orgId: string, dto: CreateWebhookDto) {
    const secret = crypto.randomBytes(32).toString('hex');
    return this.prisma.webhook.create({
      data: { orgId, url: dto.url, events: dto.events, secret },
    });
  }

  async update(orgId: string, id: string, dto: Partial<CreateWebhookDto> & { active?: boolean }) {
    await this.findOne(orgId, id);
    return this.prisma.webhook.update({
      where: { id },
      data:  {
        ...(dto.url    !== undefined && { url:    dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.webhook.delete({ where: { id } });
  }

  async getDeliveries(orgId: string, webhookId: string, limit = 50) {
    await this.findOne(orgId, webhookId);
    return this.prisma.webhookDelivery.findMany({
      where:   { webhookId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });
  }

  // ── Event Listeners ─────────────────────────────────────────────────────────

  @OnEvent('webhook.dispatch')
  onWebhookDispatch(event: WebhookEvent): void {
    void this._dispatch(event).catch((err: Error) => {
      this.logger.warn(`Webhook dispatch error: ${err.message}`);
    });
  }

  // ── Internal Delivery ───────────────────────────────────────────────────────

  private async _dispatch(event: WebhookEvent): Promise<void> {
    // Find all active webhooks for this org that subscribe to this event
    const hooks = await this.prisma.webhook.findMany({
      where: {
        orgId:  event.orgId,
        active: true,
        events: { has: event.event },
      },
    });

    if (hooks.length === 0) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const payloadStr = JSON.stringify({
      event:     event.event,
      timestamp,
      data:      event.payload,
    });

    await Promise.allSettled(
      hooks.map((hook) => this._deliverWithRetry(hook, event.event, payloadStr, timestamp)),
    );
  }

  private async _deliverWithRetry(
    hook: { id: string; url: string; secret: string },
    eventName: string,
    payloadStr: string,
    timestamp: number,
  ): Promise<void> {
    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId: hook.id,
        event:     eventName,
        payload:   JSON.parse(payloadStr) as Parameters<typeof this.prisma.webhookDelivery.create>[0]['data']['payload'],
        status:    'pending',
      },
    });

    let lastError = '';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Exponential backoff on retries (not on first attempt)
      if (attempt > 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * Math.pow(2, attempt - 2)));
      }

      try {
        const sig = this._sign(hook.secret, timestamp, payloadStr);

        const response = await firstValueFrom(
          this.http.post(hook.url, payloadStr, {
            headers: {
              'Content-Type':        'application/json',
              'X-Omnivara-Signature': `sha256=${sig}`,
              'X-Omnivara-Timestamp': String(timestamp),
              'X-Omnivara-Event':     eventName,
            },
            timeout: 10_000,
          }),
        );

        // Success
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status:      'success',
            statusCode:  response.status,
            responseBody: String(response.data ?? '').slice(0, 512),
            attempts:    attempt,
            deliveredAt: new Date(),
          },
        });
        return;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number; data?: unknown }; message?: string };
        lastError = e.message ?? 'Unknown error';
        const statusCode = e.response?.status;

        if (attempt === MAX_ATTEMPTS) {
          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status:       'failed',
              statusCode,
              responseBody: lastError.slice(0, 512),
              attempts:     attempt,
            },
          });
        }
      }
    }

    this.logger.warn(`Webhook ${hook.id} failed after ${MAX_ATTEMPTS} attempts: ${lastError}`);
  }

  private _sign(secret: string, timestamp: number, payload: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
  }
}
