import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';

export interface WelcomeEmailContext {
  recipientName: string;
  recipientEmail: string;
  orgName: string;
  loginUrl: string;
}

export interface InvoiceEmailContext {
  recipientName: string;
  recipientEmail: string;
  invoiceNumber: string;
  orgName: string;
  amount: string;
  currency: string;
  dueDate: string;
  invoiceUrl: string;
}

export interface PasswordResetContext {
  recipientName: string;
  recipientEmail: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface PaymentFailedContext {
  recipientName: string;
  recipientEmail: string;
  orgName: string;
  amount: string;
  currency: string;
  updatePaymentUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private resend: Resend | null = null;

  constructor(private readonly config: ConfigService) {
    this.transporter = this.createTransporter();

    // Use Resend in production if API key is configured
    const resendKey = this.config.get<string>('RESEND_API_KEY', '');
    if (resendKey) {
      this.resend = new Resend(resendKey);
      this.logger.log('Email provider: Resend');
    } else {
      this.logger.log('Email provider: SMTP (MailHog in dev)');
    }
  }

  private createTransporter(): Transporter {
    const host = this.config.get<string>('SMTP_HOST', 'localhost');
    const port = this.config.get<number>('SMTP_PORT', 1025); // MailHog default
    const user = this.config.get<string>('SMTP_USER', '');
    const pass = this.config.get<string>('SMTP_PASS', '');
    const secure = this.config.get<boolean>('SMTP_SECURE', false);

    return nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  private get fromAddress(): string {
    const name = this.config.get<string>('EMAIL_FROM_NAME', 'Omnivara');
    const email = this.config.get<string>('EMAIL_FROM_ADDRESS', 'no-reply@omnivara.io');
    return `${name} <${email}>`;
  }

  private get fromName(): string {
    return this.config.get<string>('EMAIL_FROM_NAME', 'Omnivara');
  }

  private get fromEmail(): string {
    return this.config.get<string>('EMAIL_FROM_ADDRESS', 'no-reply@omnivara.io');
  }

  private async send(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
      if (this.resend) {
        // Use Resend in production
        await this.resend.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to,
          subject,
          html,
          text: text ?? html.replace(/<[^>]*>/g, ''),
        });
      } else {
        // Fallback to SMTP (MailHog in dev)
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html,
          text: text ?? html.replace(/<[^>]*>/g, ''),
        });
      }
      this.logger.log(`Email sent to ${to} — "${subject}"`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
      // Don't throw — email failure should not break the main flow
    }
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  async sendWelcomeEmail(ctx: WelcomeEmailContext): Promise<void> {
    const subject = `Welcome to Omnivara, ${ctx.recipientName}! 🎉`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#6366f1;padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Omnivara One</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your Business Operating System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Welcome aboard, ${ctx.recipientName}! 👋</h2>
            <p style="margin:0 0 20px;color:#475569;line-height:1.6;">
              Your account at <strong>${ctx.orgName}</strong> is ready. You now have access to CRM, Projects,
              Helpdesk, Finance, and more — all in one place.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:12px;background:#6366f1;">
                  <a href="${ctx.loginUrl}"
                     style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;">
                    Log in to Omnivara →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:32px 0 0;color:#94a3b8;font-size:13px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} Omnivara Inc · <a href="#" style="color:#6366f1;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.send(ctx.recipientEmail, subject, html);
  }

  async sendInvoiceEmail(ctx: InvoiceEmailContext): Promise<void> {
    const subject = `Invoice ${ctx.invoiceNumber} from ${ctx.orgName} — ${ctx.amount} ${ctx.currency} due ${ctx.dueDate}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h2 style="margin:0;color:#fff;font-size:18px;font-weight:700;">${ctx.orgName}</h2>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Invoice</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;color:#6366f1;font-size:22px;font-weight:700;">${ctx.invoiceNumber}</p>
            </div>
          </td>
        </tr>
        <!-- Summary band -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Amount Due</p>
                  <p style="margin:4px 0 0;color:#0f172a;font-size:28px;font-weight:700;">${ctx.amount} <span style="font-size:16px;color:#64748b;">${ctx.currency}</span></p>
                </td>
                <td style="text-align:right;">
                  <p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Due Date</p>
                  <p style="margin:4px 0 0;color:#0f172a;font-size:16px;font-weight:600;">${ctx.dueDate}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;color:#475569;line-height:1.6;">
              Dear ${ctx.recipientName},<br><br>
              Please find your invoice attached. You can view and pay it online using the button below.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:12px;background:#6366f1;">
                  <a href="${ctx.invoiceUrl}"
                     style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;">
                    View &amp; Pay Invoice →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;">
              Questions? Reply to this email or contact us directly.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Sent via Omnivara · ${ctx.orgName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.send(ctx.recipientEmail, subject, html);
  }

  async sendPasswordResetEmail(ctx: PasswordResetContext): Promise<void> {
    const subject = 'Reset your Omnivara password';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#6366f1;padding:28px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Reset Password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 16px;color:#475569;line-height:1.6;">
              Hi ${ctx.recipientName}, we received a request to reset the password for your account.
              Click the button below — the link expires in <strong>${ctx.expiresInMinutes} minutes</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:12px;background:#6366f1;">
                  <a href="${ctx.resetUrl}"
                     style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;">
                    Reset my password →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;">
              If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Omnivara Inc</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.send(ctx.recipientEmail, subject, html);
  }

  async sendPaymentFailedEmail(ctx: PaymentFailedContext): Promise<void> {
    const subject = `Action required: payment failed for ${ctx.orgName}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#ef4444;padding:28px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">⚠️ Payment Failed</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 16px;color:#475569;line-height:1.6;">
              Hi ${ctx.recipientName}, we were unable to process your payment of
              <strong>${ctx.amount} ${ctx.currency}</strong> for <strong>${ctx.orgName}</strong>.
            </p>
            <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
              Please update your payment method to avoid service interruption.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:12px;background:#ef4444;">
                  <a href="${ctx.updatePaymentUrl}"
                     style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;">
                    Update payment method →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Omnivara Inc</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    await this.send(ctx.recipientEmail, subject, html);
  }

  /** Send an arbitrary one-off email (HTML). Used by the EmailController. */
  async sendRaw(to: string, subject: string, html: string): Promise<void> {
    return this.send(to, subject, html);
  }

  /** Verify SMTP connection — useful in health checks */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
