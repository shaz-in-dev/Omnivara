/**
 * Onboarding email sequence configuration.
 * Consumed by a scheduled job or Temporal workflow to trigger at the right time.
 * Each entry defines: when to send (day after registration), what condition must
 * be true, and the email content.
 */

export interface OnboardingEmail {
  day:        number;
  trigger:    'always' | 'no_leads' | 'no_invoice' | 'no_ticket' | 'trial_ending';
  subject:    string;
  templateId: string;
  previewText: string;
  bodyHtml:   string;
}

export const ONBOARDING_SEQUENCE: OnboardingEmail[] = [
  {
    day:         0,
    trigger:     'always',
    subject:     'Welcome to Omnivara — your 3-step quick start',
    templateId:  'welcome',
    previewText: 'Get your workspace set up in under 15 minutes.',
    bodyHtml: `
<h2>Welcome to Omnivara 👋</h2>
<p>You're all set. Here's how to get value in the next 15 minutes:</p>
<ol>
  <li><strong>Import your leads</strong> — bring in your existing contacts or type in a few manually. <a href="https://app.omnivara.io/crm/leads">Go to Leads →</a></li>
  <li><strong>Create a pipeline deal</strong> — track your active opportunities in one place. <a href="https://app.omnivara.io/crm/pipeline">Open Pipeline →</a></li>
  <li><strong>Send your first invoice</strong> — takes 60 seconds, looks professional. <a href="https://app.omnivara.io/finance">Create Invoice →</a></li>
</ol>
<p>Any questions? Reply to this email — we read every one.</p>
`.trim(),
  },
  {
    day:         1,
    trigger:     'no_leads',
    subject:     'Did you import your leads yet?',
    templateId:  'onboarding_day1',
    previewText: 'Your CRM is empty — add leads to get started.',
    bodyHtml: `
<h2>Your pipeline is waiting 🚀</h2>
<p>You registered yesterday but haven't added any leads yet. It only takes 2 minutes.</p>
<p><strong>3 ways to get started:</strong></p>
<ul>
  <li>Type in a lead manually — name, email, company</li>
  <li>Import a CSV from your old CRM or spreadsheet</li>
  <li>Use sample data to explore the product first</li>
</ul>
<p><a href="https://app.omnivara.io/crm/leads">Add your first lead →</a></p>
`.trim(),
  },
  {
    day:         3,
    trigger:     'no_invoice',
    subject:     'Your first invoice takes 60 seconds',
    templateId:  'onboarding_day3',
    previewText: 'Get paid faster with professional invoices.',
    bodyHtml: `
<h2>Get paid faster 💰</h2>
<p>You haven't sent an invoice yet. Here's what Omnivara invoicing gives you:</p>
<ul>
  <li>Professional PDF invoices with your logo</li>
  <li>Automatic payment reminders</li>
  <li>Real-time "invoice viewed" notifications</li>
  <li>Stripe payment links so clients can pay online</li>
</ul>
<p><a href="https://app.omnivara.io/finance">Create your first invoice →</a></p>
<p><em>It really does take 60 seconds.</em></p>
`.trim(),
  },
  {
    day:         7,
    trigger:     'always',
    subject:     "Your trial is going well — here's what's next",
    templateId:  'onboarding_day7',
    previewText: 'Discover AI Copilot, Analytics, and more.',
    bodyHtml: `
<h2>You're one week in 🎉</h2>
<p>Here are three features worth exploring this week:</p>
<h3>🤖 AI Copilot</h3>
<p>Ask anything about your business. "Which leads haven't been contacted in 2 weeks?" "Summarize my open tickets." <a href="https://app.omnivara.io/ai">Try it →</a></p>
<h3>📊 Analytics Dashboard</h3>
<p>See your revenue trend, lead funnel, and team activity in one place. <a href="https://app.omnivara.io/analytics">View Analytics →</a></p>
<h3>📱 Mobile App</h3>
<p>Run your business from anywhere. Dashboard, CRM, and helpdesk in your pocket. <a href="https://omnivara.io/mobile">Download →</a></p>
`.trim(),
  },
  {
    day:         12,
    trigger:     'trial_ending',
    subject:     'Trial ends in 2 days — upgrade to keep your data',
    templateId:  'onboarding_day12',
    previewText: 'Don\'t lose your leads, projects, and invoices.',
    bodyHtml: `
<h2>Your trial ends in 2 days ⏰</h2>
<p>Everything you've built in Omnivara — leads, projects, invoices, tickets — stays with you when you upgrade.</p>
<p><strong>Growth plan: $49/user/month</strong></p>
<ul>
  <li>Everything you've been using, plus:</li>
  <li>Advanced analytics and reporting</li>
  <li>Priority support</li>
  <li>1,000 AI credits/month</li>
</ul>
<p><a href="https://app.omnivara.io/settings/billing">Upgrade now →</a></p>
<p>Questions? Reply to this email or <a href="https://calendly.com/omnivara/demo">book a 20-minute call</a>.</p>
`.trim(),
  },
];

/**
 * Look up which email should fire for a given day and whether its
 * trigger condition is met. Returns null if no email should be sent.
 */
export function getOnboardingEmail(
  day: number,
  context: { hasLeads: boolean; hasInvoice: boolean; isTrialEnding: boolean },
): OnboardingEmail | null {
  const email = ONBOARDING_SEQUENCE.find((e) => e.day === day);
  if (!email) return null;

  switch (email.trigger) {
    case 'always':        return email;
    case 'no_leads':      return context.hasLeads    ? null : email;
    case 'no_invoice':    return context.hasInvoice  ? null : email;
    case 'trial_ending':  return context.isTrialEnding ? email : null;
    default:              return email;
  }
}
