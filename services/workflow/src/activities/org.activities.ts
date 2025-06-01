/** Organization setup activities */

export async function createDefaultWorkspaces(params: { orgId: string }): Promise<void> {
  console.log(`[Activity] Creating default workspaces for org: ${params.orgId}`);
  // TODO: Call API service to create default project, CRM pipeline, and helpdesk board
}
