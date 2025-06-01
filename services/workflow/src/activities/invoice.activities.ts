/** Invoice lifecycle activities */

export async function markInvoiceOverdue(params: { invoiceId: string; orgId: string }): Promise<void> {
  console.log(`[Activity] Marking invoice ${params.invoiceId} as overdue for org: ${params.orgId}`);
  // TODO: Call API service to update invoice status and trigger notifications
}
