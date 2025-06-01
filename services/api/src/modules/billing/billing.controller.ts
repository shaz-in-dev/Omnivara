import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  RawBodyRequest,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentOrg } from '../../common';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /* ── GET /billing/subscription ─────────────────────────────────────────── */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription and plan for org' })
  getSubscription(@CurrentOrg() orgId: string) {
    return this.billingService.getSubscription(orgId);
  }

  /* ── GET /billing/usage ─────────────────────────────────────────────────── */
  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current usage vs plan limits' })
  getUsage(@CurrentOrg() orgId: string) {
    return this.billingService.getUsage(orgId);
  }

  /* ── POST /billing/checkout ─────────────────────────────────────────────── */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout Session for plan upgrade' })
  createCheckout(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { planId: string },
  ) {
    return this.billingService.createCheckoutSession(orgId, body.planId, user.id);
  }

  /* ── POST /billing/portal ───────────────────────────────────────────────── */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Customer Portal session' })
  createPortal(@CurrentOrg() orgId: string) {
    return this.billingService.createPortalSession(orgId);
  }

  /* ── POST /billing/webhook ──────────────────────────────────────────────── */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver — no auth' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody!, signature);
  }
}
