import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Mock nodemailer before importing the service
const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  verify:   jest.fn().mockResolvedValue(true),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

// Mock resend — not used in these tests (no RESEND_API_KEY configured)
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'resend-id' }) },
  })),
}));

const mockConfig = {
  get: jest.fn((key: string, defaultVal?: unknown) => {
    const map: Record<string, unknown> = {
      SMTP_HOST:          'localhost',
      SMTP_PORT:          1025,
      SMTP_USER:          '',
      SMTP_PASS:          '',
      SMTP_SECURE:        false,
      EMAIL_FROM_NAME:    'Omnivara',
      EMAIL_FROM_ADDRESS: 'no-reply@omnivara.io',
      RESEND_API_KEY:     '', // empty → use SMTP
    };
    return map[key] ?? defaultVal;
  }),
};

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(EmailService);
  });

  // ── sendWelcomeEmail ──────────────────────────────────────────────────────

  describe('sendWelcomeEmail', () => {
    const ctx = {
      recipientName:  'Alice',
      recipientEmail: 'alice@example.com',
      orgName:        'Acme Inc',
      loginUrl:       'https://app.omnivara.io',
    };

    it('sends email via SMTP transporter', async () => {
      await service.sendWelcomeEmail(ctx);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('sends to the correct recipient address', async () => {
      await service.sendWelcomeEmail(ctx);
      const call = mockTransporter.sendMail.mock.calls[0]![0] as any;
      expect(call.to).toBe('alice@example.com');
    });

    it('subject contains recipient name', async () => {
      await service.sendWelcomeEmail(ctx);
      const call = mockTransporter.sendMail.mock.calls[0]![0] as any;
      expect(call.subject).toContain('Alice');
    });

    it('does not throw when SMTP fails (silent swallow)', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP down'));
      await expect(service.sendWelcomeEmail(ctx)).resolves.not.toThrow();
    });
  });

  // ── sendInvoiceEmail ──────────────────────────────────────────────────────

  describe('sendInvoiceEmail', () => {
    const ctx = {
      recipientName:  'Bob',
      recipientEmail: 'bob@example.com',
      invoiceNumber:  'INV-001',
      orgName:        'Acme',
      amount:         '1,500.00',
      currency:       'USD',
      dueDate:        '2026-06-01',
      invoiceUrl:     'https://app.omnivara.io/invoices/inv-1',
    };

    it('sends invoice email', async () => {
      await service.sendInvoiceEmail(ctx);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('subject contains invoice number', async () => {
      await service.sendInvoiceEmail(ctx);
      const call = mockTransporter.sendMail.mock.calls[0]![0] as any;
      expect(call.subject).toContain('INV-001');
    });

    it('does not throw on SMTP failure', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('timeout'));
      await expect(service.sendInvoiceEmail(ctx)).resolves.not.toThrow();
    });
  });

  // ── sendPasswordResetEmail ────────────────────────────────────────────────

  describe('sendPasswordResetEmail', () => {
    const ctx = {
      recipientName:    'Charlie',
      recipientEmail:   'charlie@example.com',
      resetUrl:         'https://app.omnivara.io/reset?token=abc123',
      expiresInMinutes: 30,
    };

    it('sends password reset email', async () => {
      await service.sendPasswordResetEmail(ctx);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('subject is about password reset', async () => {
      await service.sendPasswordResetEmail(ctx);
      const call = mockTransporter.sendMail.mock.calls[0]![0] as any;
      expect(call.subject.toLowerCase()).toContain('password');
    });
  });

  // ── sendPaymentFailedEmail ────────────────────────────────────────────────

  describe('sendPaymentFailedEmail', () => {
    const ctx = {
      recipientName:    'Dave',
      recipientEmail:   'dave@example.com',
      orgName:          'Acme',
      amount:           '299.00',
      currency:         'USD',
      updatePaymentUrl: 'https://billing.stripe.com',
    };

    it('sends payment failed email', async () => {
      await service.sendPaymentFailedEmail(ctx);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('does not throw on SMTP failure', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('auth fail'));
      await expect(service.sendPaymentFailedEmail(ctx)).resolves.not.toThrow();
    });
  });

  // ── verifyConnection ──────────────────────────────────────────────────────

  describe('verifyConnection', () => {
    it('returns true when SMTP is reachable', async () => {
      mockTransporter.verify.mockResolvedValueOnce(true);
      const result = await service.verifyConnection();
      expect(result).toBe(true);
    });

    it('returns false when SMTP verify throws', async () => {
      mockTransporter.verify.mockRejectedValueOnce(new Error('connection refused'));
      const result = await service.verifyConnection();
      expect(result).toBe(false);
    });
  });
});
