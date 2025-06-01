import {
  Controller, Post, Get, Body, Req, Res, UseGuards, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import axios from 'axios';
import { AiService } from './ai.service';
import { CurrentOrg, CurrentUser, type CurrentUserPayload } from '../../common';

/**
 * AI Copilot proxy controller.
 * All requests are authenticated by NestJS (JWT guard) before being
 * forwarded to the AI microservice with the org plan header attached.
 */
@ApiTags('AI Copilot')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  private readonly aiUrl: string;

  constructor(
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {
    this.aiUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  /* ── Usage ─────────────────────────────────────────────────────────────── */

  @Get('usage')
  @ApiOperation({ summary: 'Get current AI usage for the org' })
  async getUsage(@CurrentOrg() orgId: string) {
    return this.aiService.getUsage(orgId);
  }

  /* ── Non-streaming chat ─────────────────────────────────────────────────── */

  @Post('copilot/ask')
  @ApiOperation({ summary: 'AI Copilot — non-streaming chat (plan-gated)' })
  async ask(
    @CurrentOrg() orgId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const { planId, model } = await this.aiService.assertAiAccess(orgId);

    const { data } = await axios.post(
      `${this.aiUrl}/copilot/ask`,
      { ...body, org_id: orgId },
      { headers: { 'X-Org-Plan': planId } },
    );

    await this.aiService.incrementUsage(orgId, (data as { tokens_used?: number }).tokens_used ?? 0);
    return data;
  }

  /* ── Streaming chat proxy ───────────────────────────────────────────────── */

  @Post('copilot/stream')
  @ApiOperation({ summary: 'AI Copilot — streaming SSE (plan-gated)' })
  async stream(
    @CurrentOrg() orgId: string,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const { planId } = await this.aiService.assertAiAccess(orgId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const upstream = await axios.post(
        `${this.aiUrl}/copilot/stream`,
        { ...body, org_id: orgId },
        {
          headers:      { 'X-Org-Plan': planId },
          responseType: 'stream',
        },
      );

      // Pipe the SSE stream through
      (upstream.data as NodeJS.ReadableStream).pipe(res);

      (upstream.data as NodeJS.ReadableStream).on('end', () => {
        void this.aiService.incrementUsage(orgId);
        res.end();
      });

      (upstream.data as NodeJS.ReadableStream).on('error', () => {
        res.write('data: [ERROR] upstream\n\n');
        res.end();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI service unavailable';
      res.write(`data: [ERROR] ${msg}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  /* ── Daily Brief ────────────────────────────────────────────────────────── */

  @Get('brief')
  @ApiOperation({ summary: 'Get today\'s AI daily brief for the current user' })
  async getDailyBrief(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Brief is available on all plans (lightweight, no chat usage consumed)
    return this.aiService.generateBrief(orgId, user.id, 'ADMIN');
  }
}
