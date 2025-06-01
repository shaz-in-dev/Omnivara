import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Stripe = require('stripe');
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PLANS } from '@omnivara/config';

// planId keys for config lookup
const PLAN_PRICE_ENV_KEYS: Record<string, string> = {
  starter:  'STRIPE_PRICE_ID_STARTER',
  growth:   'STRIPE_PRICE_ID_GROWTH',
  business: 'STRIPE_PRICE_ID_BUSINESS',
};

// Lean local types for the Stripe webhook data we actually access.
// Stripe v22 CJS exports do not expose Stripe.Event/Subscription/Invoice via node10 resolution.
type StripeSubData = {
  id: string; status: string;
  current_period_end: number; current_period_start: number;
  cancel_at_period_end: boolean;
  customer: string | null;
  metadata: Record<string, string>;
  items: { data: Array<{ price: { id: string } }> };
};
type StripeInvData = {
  id: string; subscription: string | null; customer: string | null;
  amount_paid: number; amount_due: number; currency: string;
};
type StripeEventData = { type: string; data: { object: unknown } };

@Injectable()
export class BillingService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly stripe: any;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  /* ── Subscription read ─────────────────────────────────────────────────── */

  async getSubscription(orgId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { orgId } });
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { planId: true },
    });
    return { subscription: sub, planId: org?.planId ?? 'starter' };
  }

  /* ── Usage ─────────────────────────────────────────────────────────────── */

  async getUsage(orgId: string) {
    const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const [memberCount, aiUsage] = await Promise.all([
      this.prisma.organizationMember.count({ where: { orgId } }),
      this.prisma.aiUsage.findUnique({ where: { orgId_month: { orgId, month } } }),
    ]);

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { planId: true },
    });
    const planId = (org?.planId ?? 'starter') as keyof typeof PLANS;
    const plan = PLANS[planId];

    return {
      planId,
      limits: plan.limits,
      usage: {
        users: memberCount,
        ai_credits_used: aiUsage?.messages ?? 0,
        month,
      },
    };
  }

  /* ── Increment AI usage ─────────────────────────────────────────────────── */

  async incrementAiUsage(orgId: string): Promise<{ allowed: boolean }> {
    const month = new Date().toISOString().slice(0, 7);
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { planId: true },
    });
    const planId = (org?.planId ?? 'starter') as keyof typeof PLANS;
    const limit = PLANS[planId]?.limits.ai_credits_per_month ?? 0;

    const usage = await this.prisma.aiUsage.upsert({
      where: { orgId_month: { orgId, month } },
      update: { messages: { increment: 1 } },
      create: { orgId, month, messages: 1 },
    });

    // -1 means unlimited (enterprise)
    const allowed = limit === -1 || usage.messages <= limit;
    return { allowed };
  }

  /* ── Stripe Checkout ───────────────────────────────────────────────────── */

  async createCheckoutSession(orgId: string, planId: string, userId: string) {
    const envKey = PLAN_PRICE_ENV_KEYS[planId];
    const priceId = envKey ? this.config.get<string>(envKey) : undefined;
    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for plan: ${planId}`);
    }

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    let customerId: string | undefined;

    // Reuse existing Stripe customer if we have a subscription
    const existingSub = await this.prisma.subscription.findUnique({ where: { orgId } });
    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      // Create a new Stripe customer from org data
      const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const customer = await this.stripe.customers.create({
        email: user?.email,
        name: org?.name,
        metadata: { orgId },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?success=1`,
      cancel_url: `${appUrl}/settings/billing?canceled=1`,
      metadata: { orgId, planId },
      subscription_data: { metadata: { orgId, planId } },
    });

    return { url: session.url };
  }

  /* ── Stripe Customer Portal ─────────────────────────────────────────────── */

  async createPortalSession(orgId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { orgId } });
    if (!sub?.stripeCustomerId) {
      throw new NotFoundException('No active subscription found');
    }

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return { url: session.url };
  }

  /* ── Webhook handler ─────────────────────────────────────────────────────── */

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: StripeEventData;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpsert(event.data.object as StripeSubData);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as StripeSubData);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as StripeInvData);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /* ── Private webhook handlers ───────────────────────────────────────────── */

  private async handleSubscriptionUpsert(stripeSub: StripeSubData) {
    const orgId = stripeSub.metadata?.orgId;
    if (!orgId) return;

    // Derive planId from price metadata or use the planId stored in subscription metadata
    const planId: string = (stripeSub.metadata?.planId as string) ?? 'starter';

    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { orgId },
        create: {
          orgId,
          stripeCustomerId: stripeSub.customer as string,
          stripeSubId: stripeSub.id,
          planId,
          status: stripeSub.status as any,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
        update: {
          stripeCustomerId: stripeSub.customer as string,
          stripeSubId: stripeSub.id,
          planId,
          status: stripeSub.status as any,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
      }),
      // Sync planId to Organization
      this.prisma.organization.update({
        where: { id: orgId },
        data: { planId },
      }),
    ]);

    this.logger.log(`Subscription upserted for org ${orgId} → plan ${planId}`);
  }

  private async handleSubscriptionDeleted(stripeSub: StripeSubData) {
    const orgId = stripeSub.metadata?.orgId;
    if (!orgId) return;

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { orgId },
        data: { status: 'canceled' },
      }),
      // Downgrade org to free/starter plan
      this.prisma.organization.update({
        where: { id: orgId },
        data: { planId: 'starter' },
      }),
    ]);

    this.logger.log(`Subscription canceled for org ${orgId} — downgraded to starter`);
  }

  private async handlePaymentFailed(invoice: StripeInvData) {
    const customerId = invoice.customer as string;
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!sub) return;

    const org = await this.prisma.organization.findUnique({ where: { id: sub.orgId } });
    const member = await this.prisma.organizationMember.findFirst({
      where: { orgId: sub.orgId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    if (member?.user) {
      await this.email.sendPaymentFailedEmail({
        recipientEmail: member.user.email,
        recipientName: member.user.name,
        orgName: org?.name ?? 'Your organization',
        amount: (invoice.amount_due / 100).toFixed(2),
        currency: invoice.currency.toUpperCase(),
        updatePaymentUrl: `${this.config.get('APP_URL', 'http://localhost:3000')}/settings/billing`,
      });
    }

    this.logger.warn(`Payment failed for org ${sub.orgId}`);
  }
}
