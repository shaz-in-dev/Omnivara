import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

const { sendInvoiceReminder, markInvoiceOverdue } =
  proxyActivities<typeof activities>({ startToCloseTimeout: '30 seconds' });

export interface InvoiceReminderInput {
  invoiceId: string;
  orgId: string;
  recipientEmail: string;
  dueDate: string;
  amount: number;
  currency: string;
}

/** Sends invoice reminders and marks overdue invoices */
export async function invoiceReminderWorkflow(input: InvoiceReminderInput): Promise<void> {
  // Reminder 3 days before due
  await sleep('3 days');
  await sendInvoiceReminder({ ...input, daysUntilDue: 3 });

  // Reminder 1 day before due
  await sleep('2 days');
  await sendInvoiceReminder({ ...input, daysUntilDue: 1 });

  // Mark overdue after due date
  await sleep('1 day');
  await markInvoiceOverdue({ invoiceId: input.invoiceId, orgId: input.orgId });
}
