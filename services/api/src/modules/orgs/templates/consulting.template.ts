export const CONSULTING_TEMPLATE = {
  id: 'consulting',
  name: 'Consulting & Professional Services',
  description: 'Engagement phases, milestone billing, and project structures for consulting firms',
  icon: '📊',
  pipelineStages: ['Inquiry', 'Scoping', 'Engagement Letter', 'Active Engagement', 'Delivery', 'Review', 'Renewal'],
  projectPhases: ['Discovery', 'Strategy', 'Implementation', 'Delivery', 'Review & Close'],
  invoiceLineItems: [
    { description: 'Monthly retainer', unitPrice: 8000 },
    { description: 'Discovery & scoping', unitPrice: 4500 },
    { description: 'Strategy workshop (half day)', unitPrice: 3500 },
    { description: 'Delivery milestone', unitPrice: 12000 },
  ],
  billingModels: ['Retainer', 'Milestone', 'Time & Materials', 'Fixed Fee'],
};
