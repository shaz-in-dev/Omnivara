export const MSP_TEMPLATE = {
  id: 'msp',
  name: 'IT Services & MSP',
  description: 'Ticket categories, SLA presets, and pipeline stages for managed service providers',
  icon: '🖥️',
  pipelineStages: ['Prospect', 'Assessment', 'Proposal', 'Onboarding', 'Active', 'Renewal', 'Churned'],
  ticketCategories: ['Hardware', 'Software', 'Network', 'Security Incident', 'Billing', 'Access Request'],
  slaPresets: [
    { name: 'P1 - Critical', responseMinutes: 30, resolutionHours: 2 },
    { name: 'P2 - High', responseMinutes: 60, resolutionHours: 8 },
    { name: 'P3 - Medium', responseMinutes: 240, resolutionHours: 48 },
    { name: 'P4 - Low', responseMinutes: 480, resolutionHours: 120 },
  ],
  invoiceLineItems: [
    { description: 'Monthly managed services', unitPrice: 2500 },
    { description: 'Remote support hours', unitPrice: 95 },
    { description: 'On-site support hours', unitPrice: 145 },
    { description: 'Hardware procurement markup', unitPrice: 0 },
  ],
};
