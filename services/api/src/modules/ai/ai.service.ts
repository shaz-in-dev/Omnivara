import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { PLANS } from '@omnivara/config';

const AI_URL_DEFAULT = 'http://localhost:8000';

export interface EmbedRecordInput {
  orgId:      string;
  recordType: 'lead' | 'contact' | 'ticket' | 'invoice';
  recordId:   string;
  content:    string;
  metadata?:  Record<string, unknown>;
}

/**
 * Manages AI features: embedding hooks, usage tracking, plan gating.
 * Acts as the internal API for the AI microservice.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.aiUrl = this.config.get<string>('AI_SERVICE_URL', AI_URL_DEFAULT);
  }

  /** Listens to embed.record events emitted by services after create/update. */
  @OnEvent('embed.record')
  onEmbedRecord(input: EmbedRecordInput): void {
    this.embedRecord(input);
  }

  /** Listens to embed.delete events emitted by services after delete. */
  @OnEvent('embed.delete')
  onEmbedDelete(input: { orgId: string; recordType: string; recordId: string }): void {
    void this.deleteEmbedding(input.orgId, input.recordType, input.recordId);
  }

  /** Fire-and-forget: index a record in the vector store after create/update. */
  embedRecord(input: EmbedRecordInput): void {
    void this._doEmbed(input).catch((err: Error) => {
      this.logger.warn(`embedRecord failed for ${input.recordType}:${input.recordId} — ${err.message}`);
    });
  }

  private async _doEmbed(input: EmbedRecordInput): Promise<void> {
    const { orgId, recordType, recordId, content, metadata } = input;
    await firstValueFrom(
      this.http.post(`${this.aiUrl}/embeddings/index`, {
        org_id:        orgId,
        document_id:   `${recordType}:${recordId}`,
        document_type: recordType,
        content,
        metadata: metadata ?? {},
      }),
    );
  }

  /** Remove a record from the vector store (on delete). */
  async deleteEmbedding(orgId: string, recordType: string, recordId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.aiUrl}/embeddings/index/${orgId}/${recordType}:${recordId}`),
      );
    } catch {
      // Non-fatal
    }
  }

  /** Get the org's current plan and check AI access. Throws ForbiddenException if denied. */
  async assertAiAccess(orgId: string): Promise<{ planId: string; model: string }> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { planId: true },
    });
    const planId = (org?.planId ?? 'starter') as keyof typeof PLANS;
    const plan = PLANS[planId];

    // AI module must be in the plan's modules list
    if (!plan?.modules.includes('ai')) {
      throw new ForbiddenException(
        'AI Copilot is not available on the Starter plan. Upgrade to Growth or Business in Settings → Billing.',
      );
    }

    // Check monthly credit limit (-1 = unlimited)
    const creditLimit = plan.limits.ai_credits_per_month;
    if (creditLimit !== -1) {
      const month = new Date().toISOString().slice(0, 7);
      const aiUsage = await this.prisma.aiUsage.findUnique({
        where: { orgId_month: { orgId, month } },
        select: { messages: true },
      });
      if ((aiUsage?.messages ?? 0) >= creditLimit) {
        throw new ForbiddenException(
          `Monthly AI limit reached (${aiUsage?.messages ?? 0}/${creditLimit} messages). Upgrade to Business for more.`,
        );
      }
    }

    // Model based on plan: Business/Enterprise get Sonnet, others get Haiku
    const model = (planId === 'business' || planId === 'enterprise')
      ? 'claude-sonnet-4-6'
      : 'claude-haiku-4-5-20251001';

    return { planId, model };
  }

  /** Increment AI usage counter after a successful message. */
  async incrementUsage(orgId: string, tokensUsed = 0): Promise<void> {
    const month = new Date().toISOString().slice(0, 7);
    await this.prisma.aiUsage.upsert({
      where:  { orgId_month: { orgId, month } },
      create: { orgId, month, messages: 1, tokens: tokensUsed },
      update: { messages: { increment: 1 }, tokens: { increment: tokensUsed } },
    });
  }

  /** Get current AI usage for an org. */
  async getUsage(orgId: string) {
    const month = new Date().toISOString().slice(0, 7);
    const [usage, org] = await Promise.all([
      this.prisma.aiUsage.findUnique({ where: { orgId_month: { orgId, month } } }),
      this.prisma.organization.findUnique({ where: { id: orgId }, select: { planId: true } }),
    ]);
    const planId = (org?.planId ?? 'starter') as keyof typeof PLANS;
    const plan = PLANS[planId];
    const creditLimit = plan?.limits.ai_credits_per_month ?? 0;
    const limit = creditLimit === -1 ? null : creditLimit; // null = unlimited
    const messages = usage?.messages ?? 0;

    return {
      messages,
      tokens:  usage?.tokens ?? 0,
      limit,
      percent: limit && limit > 0 ? Math.round((messages / limit) * 100) : 0,
      planId,
    };
  }

  /** Generate the daily brief for a user — proxied to AI service. */
  async generateBrief(orgId: string, userId: string, role: string) {
    const response = await firstValueFrom(
      this.http.post<unknown>(`${this.aiUrl}/briefs/generate`, {
        org_id:  orgId,
        user_id: userId,
        role,
      }),
    );
    return response.data;
  }
}
