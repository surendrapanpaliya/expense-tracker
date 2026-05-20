const SEED_EXPENSES = [
  { id: 1, description: 'Flight to NYC conference', amount: 450.00, category: 'travel',    priority: 'high',     submittedBy: 'Alice',   status: 'approved', submittedAt: '2026-01-10T10:00:00.000Z', reviewedBy: 'Manager A', recurringTemplateId: null, period: null },
  { id: 2, description: 'Team lunch Friday',        amount: 85.50,  category: 'meals',     priority: 'low',      submittedBy: 'Bob',     status: 'approved', submittedAt: '2026-01-11T12:00:00.000Z', reviewedBy: 'Manager A', recurringTemplateId: null, period: null },
  { id: 3, description: 'IDE license renewal',      amount: 299.99, category: 'software',  priority: 'medium',   submittedBy: 'Alice',   status: 'pending',  submittedAt: '2026-01-12T09:00:00.000Z', reviewedBy: null,        recurringTemplateId: null, period: null },
  { id: 4, description: 'Standing desk',            amount: 650.00, category: 'equipment', priority: 'medium',   submittedBy: 'Charlie', status: 'pending',  submittedAt: '2026-01-13T14:00:00.000Z', reviewedBy: null,        recurringTemplateId: null, period: null },
  { id: 5, description: 'Taxi to client site',      amount: 42.00,  category: 'travel',    priority: 'critical', submittedBy: 'Bob',     status: 'rejected', submittedAt: '2026-01-14T08:00:00.000Z', reviewedBy: 'Manager A', recurringTemplateId: null, period: null },
];

module.exports = { SEED_EXPENSES };
