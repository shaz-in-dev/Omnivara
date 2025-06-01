/** Email-related Temporal activities */

export async function sendWelcomeEmail(params: { email: string; orgName: string }): Promise<void> {
  console.log(`[Activity] Sending welcome email to ${params.email} for org: ${params.orgName}`);
  // TODO: Integrate with SMTP / Resend / SendGrid
}

export async function scheduleOnboardingCheckin(params: { userId: string; email: string }): Promise<void> {
  console.log(`[Activity] Sending onboarding check-in to ${params.email}`);
  // TODO: Send personalized check-in email
}

export async function sendInvoiceReminder(params: {
  invoiceId: string;
  recipientEmail: string;
  daysUntilDue: number;
  amount: number;
  currency: string;
}): Promise<void> {
  console.log(
    `[Activity] Invoice reminder to ${params.recipientEmail}: ${params.currency} ${params.amount} due in ${params.daysUntilDue} days`,
  );
  // TODO: Send invoice reminder email
}
