export const AGENCY_TEMPLATE = {
  id: 'agency',
  name: 'Agency & Creative Studio',
  description: 'Pipeline stages, project types, and helpdesk categories for agencies',
  icon: '🎨',
  pipelineStages: ['Lead', 'Discovery', 'Proposal', 'Contract', 'Active', 'Closed Won', 'Closed Lost'],
  projectTypes: ['Website Build', 'Brand Identity', 'SEO Retainer', 'Social Campaign', 'Email Marketing'],
  helpdeskCategories: ['Revision Request', 'Bug Report', 'Client Feedback', 'New Feature', 'Billing'],
  invoiceLineItems: [
    { description: 'Design hours', unitPrice: 125 },
    { description: 'Development hours', unitPrice: 150 },
    { description: 'Monthly retainer', unitPrice: 3500 },
    { description: 'Ad spend management', unitPrice: 500 },
  ],
  sampleLeads: ['Marketing Manager', 'Founder & CEO', 'Head of Digital'],
};
