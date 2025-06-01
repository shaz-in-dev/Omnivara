import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

const { sendWelcomeEmail, createDefaultWorkspaces, scheduleOnboardingCheckin } =
  proxyActivities<typeof activities>({ startToCloseTimeout: '30 seconds' });

export interface OnboardingInput {
  userId: string;
  orgId: string;
  email: string;
  orgName: string;
}

/** Orchestrates the full user onboarding sequence */
export async function onboardingWorkflow(input: OnboardingInput): Promise<void> {
  // 1. Send welcome email immediately
  await sendWelcomeEmail({ email: input.email, orgName: input.orgName });

  // 2. Create default workspaces
  await createDefaultWorkspaces({ orgId: input.orgId });

  // 3. Wait 1 day, then send check-in
  await sleep('1 day');
  await scheduleOnboardingCheckin({ userId: input.userId, email: input.email });
}
