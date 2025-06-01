import { Test } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock the Stripe constructor so no real HTTP calls are made
const mockStripeInstance = {
  checkout: {
    sessions: { create: jest.fn() },
  },
  billingPortal: {
    sessions: { create: jest.fn() },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  customers: {
    create: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

const mockPrisma = {
  subscription: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  organizationMember: {
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  aiUsage: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string, fallback?: string) => {
    const map: Record<string, string> = {
      STRIPE_SECRET_KEY:       'sk_test_fake',
      STRIPE_WEBHOOK_SECRET:   'whsec_fake',
      APP_URL:                 'http://localhost:3000',
      STRIPE_PRICE_ID_STARTER: 'price_starter_test',
      STRIPE_PRICE_ID_GROWTH:  'price_growth_test',
      STRIPE_PRICE_ID_BUSINESS:'price_business_test',
    };
    return map[key] ?? fallback ?? '';
  }),
};

const mockEmail = {
  sendPaymentFailedEmail: jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService,  useValue: mockPrisma },
        { provide: ConfigService,  useValue: mockConfig },
        { provide: EmailService,   useValue: mockEmail },
      ],
    }).compile();

    service = module.get(BillingService);
    jest.clearAllMocks();
  });

  // ── getSubscription ─────────────────────────────────────────────────────────

  describe('getSubscription', () => {
    it('returns subscription and planId for an org', async () => {
      const mockSub = { orgId: 'org-1', stripeCustomerId: 'cus_123', status: 'active' };
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub);
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'growth' });

      const result = await service.getSubscription('org-1');

      expect(result.subscription).toEqual(mockSub);
      expect(result.planId).toBe('growth');
    });

    it('returns starter planId when org has no subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'starter' });

      const result = await service.getSubscription('org-1');

      expect(result.planId).toBe('starter');
      expect(result.subscription).toBeNull();
    });
  });

  // ── incrementAiUsage ────────────────────────────────────────────────────────

  describe('incrementAiUsage', () => {
    it('returns allowed=true when within limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'growth' });
      mockPrisma.aiUsage.upsert.mockResolvedValue({ messages: 100 });

      const result = await service.incrementAiUsage('org-1');

      expect(result.allowed).toBe(true);
    });

    it('returns allowed=false when over limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'starter' });
      // Starter has 100 ai_credits_per_month; usage is now 101
      mockPrisma.aiUsage.upsert.mockResolvedValue({ messages: 101 });

      const result = await service.incrementAiUsage('org-1');

      expect(result.allowed).toBe(false);
    });

    it('always returns allowed=true for enterprise (limit = -1)', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ planId: 'enterprise' });
      mockPrisma.aiUsage.upsert.mockResolvedValue({ messages: 999999 });

      const result = await service.incrementAiUsage('org-1');

      expect(result.allowed).toBe(true);
    });
  });

  // ── createCheckoutSession ────────────────────────────────────────────────────

  describe('createCheckoutSession', () => {
    it('throws BadRequestException when plan has no Stripe price configured', async () => {
      // 'unknown_plan' has no configured Stripe price ID
      await expect(service.createCheckoutSession('org-1', 'unknown_plan_xyz', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('creates a checkout session for growth plan', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Acme' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'admin@acme.com' });
      mockStripeInstance.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.com/pay/xxx' });

      const result = await service.createCheckoutSession('org-1', 'growth', 'user-1');

      expect(result.url).toBe('https://stripe.com/pay/xxx');
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'subscription' }),
      );
    });

    it('reuses existing Stripe customer when subscription exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({ stripeCustomerId: 'cus_existing' });
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.com/pay/yyy' });

      await service.createCheckoutSession('org-1', 'growth', 'user-1');

      expect(mockStripeInstance.customers.create).not.toHaveBeenCalled();
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_existing' }),
      );
    });
  });

  // ── createPortalSession ──────────────────────────────────────────────────────

  describe('createPortalSession', () => {
    it('throws NotFoundException when org has no subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.createPortalSession('org-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('creates a portal session with existing customer', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({ stripeCustomerId: 'cus_123' });
      mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/p/xxx' });

      const result = await service.createPortalSession('org-1');

      expect(result.url).toContain('stripe.com');
    });
  });

  // ── handleWebhook ────────────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('throws BadRequestException on invalid webhook signature', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      await expect(
        service.handleWebhook(Buffer.from('{}'), 'invalid-sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('processes subscription.created event', async () => {
      const fakeEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            metadata: { orgId: 'org-1', planId: 'growth' },
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            cancel_at_period_end: false,
          },
        },
      };
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(fakeEvent);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.handleWebhook(Buffer.from('{}'), 'v1,fake_sig');

      expect(result).toEqual({ received: true });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('downgrades org to starter on subscription.deleted', async () => {
      const fakeEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
            metadata: { orgId: 'org-1' },
            current_period_end: Math.floor(Date.now() / 1000),
            cancel_at_period_end: false,
          },
        },
      };
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(fakeEvent);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.handleWebhook(Buffer.from('{}'), 'v1,fake_sig');

      // $transaction called with downgrade to starter
      const txArgs = mockPrisma.$transaction.mock.calls[0][0] as unknown[];
      expect(txArgs).toHaveLength(2);
    });
  });
});
