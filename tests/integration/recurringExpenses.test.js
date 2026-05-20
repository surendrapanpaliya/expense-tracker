const request = require('supertest');
const app = require('../../server');
const { FLAGS, _override, _clearOverrides } = require('../../src/config/featureFlags');
const expenseStore = require('../../src/store/expenses');
const templateStore = require('../../src/store/recurringTemplates');

const VALID_TEMPLATE = {
  name: 'Monthly Rent',
  amount: 1500,
  category: 'other',
  cadence: 'monthly',
  dayOfMonth: 1,
  startDate: '2026-05-01',
};

beforeEach(() => {
  _clearOverrides();
  expenseStore.reset();
  templateStore.reset();
});

afterEach(() => {
  _clearOverrides();
});

describe('GET /recurring-expenses', () => {
  it('should return 404 when flag is disabled', async () => {
    _override(FLAGS.RECURRING_EXPENSES, false);
    const { status } = await request(app).get('/api/recurring-expenses');
    expect(status).toBe(404);
  });

  it('should return empty list when no templates exist', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);
    const { status, body } = await request(app).get('/api/recurring-expenses');
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it('should return created templates', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);
    await request(app).post('/api/recurring-expenses').send(VALID_TEMPLATE);
    const { status, body } = await request(app).get('/api/recurring-expenses');
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Monthly Rent');
  });
});

describe('GET /recurring-expenses/:id', () => {
  it('should return 404 for unknown template', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);
    const { status } = await request(app).get('/api/recurring-expenses/999');
    expect(status).toBe(404);
  });

  it('should return the template by id', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);
    const { body: created } = await request(app).post('/api/recurring-expenses').send(VALID_TEMPLATE);
    const { status, body } = await request(app).get(`/api/recurring-expenses/${created.id}`);
    expect(status).toBe(200);
    expect(body.id).toBe(created.id);
    expect(body.name).toBe('Monthly Rent');
  });
});

// Scenario 1: Monthly template generates child rows on the correct dates.
describe('Scenario 1 — monthly template generates child rows', () => {
  it('should generate child rows dated the 15th, then the following 15th', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);

    const { body: template } = await request(app)
      .post('/api/recurring-expenses')
      .send({ ...VALID_TEMPLATE, dayOfMonth: 15, startDate: '2026-05-15' });

    const { status: s1, body: child1 } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);
    expect(s1).toBe(201);
    expect(child1.status).toBe('pending');
    expect(child1.period).toBe('2026-05');

    const { status: s2, body: child2 } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);
    expect(s2).toBe(201);
    expect(child2.period).toBe('2026-06');
  });
});

// Scenario 2: Duplicate child row (same template + period) returns 409.
describe('Scenario 2 — duplicate child row returns 409', () => {
  it('should return 409 when the period already has a child row', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);

    const { body: template } = await request(app)
      .post('/api/recurring-expenses')
      .send({ ...VALID_TEMPLATE, dayOfMonth: 1, startDate: '2026-05-01' });

    // nextDueDate picks the last child row by submittedAt and advances one period from it.
    // To make nextDueDate compute '2026-05', seed an "anchor" row with period '2026-04'
    // that sorts last by submittedAt. Also seed the "duplicate" row with period '2026-05'
    // and an earlier submittedAt so it isn't the anchor but is found by the duplicate check.
    expenseStore.save({
      description: template.name, amount: template.amount, category: template.category,
      submittedBy: 'recurring-system', status: 'pending', reviewedBy: null,
      recurringTemplateId: template.id,
      period: '2026-05',
      submittedAt: new Date('2026-03-01').toISOString(), // sorted before the anchor
    });
    expenseStore.save({
      description: template.name, amount: template.amount, category: template.category,
      submittedBy: 'recurring-system', status: 'pending', reviewedBy: null,
      recurringTemplateId: template.id,
      period: '2026-04',
      submittedAt: new Date('2026-04-01').toISOString(), // sorted last → nextDueDate advances to 2026-05
    });

    const { status } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);
    expect(status).toBe(409);
  });
});

// Scenario 3: Disabling the LD flag mid-session returns 404 from generate;
// already-approved child rows remain queryable without recurringTemplateId.
describe('Scenario 3 — LD flag disabled mid-session', () => {
  it('should return 404 from POST /generate after the flag is disabled', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);

    const { body: template, status: ts } = await request(app)
      .post('/api/recurring-expenses')
      .send(VALID_TEMPLATE);
    expect(ts).toBe(201);

    const { status: gs1 } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);
    expect(gs1).toBe(201);

    // Simulate mid-session flag disable.
    _override(FLAGS.RECURRING_EXPENSES, false);

    const { status: gs2 } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);
    expect(gs2).toBe(404);
  });

  it('should return already-approved child rows from GET /expenses without recurringTemplateId when flag is off', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);

    const { body: template } = await request(app)
      .post('/api/recurring-expenses')
      .send(VALID_TEMPLATE);

    const { body: child } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);

    await request(app)
      .patch(`/api/expenses/${child.id}/approve`)
      .send({ reviewedBy: 'Manager A' });

    // Disable flag — recurring section goes dark.
    _override(FLAGS.RECURRING_EXPENSES, false);

    const { status, body: expenses } = await request(app).get('/api/expenses');
    expect(status).toBe(200);

    const childRow = expenses.find(e => e.id === child.id);
    expect(childRow).toBeDefined();
    expect(childRow.status).toBe('approved');
    // Field must be absent, not null, when flag is off.
    expect(childRow).not.toHaveProperty('recurringTemplateId');
    expect(childRow).not.toHaveProperty('period');
  });
});

// Spec: GET /expenses includes generated child rows with recurringTemplateId while flag is on.
describe('GET /expenses includes child rows with recurringTemplateId when flag is on', () => {
  it('should include a pending child row with recurringTemplateId and period fields', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);

    const { body: template } = await request(app)
      .post('/api/recurring-expenses')
      .send(VALID_TEMPLATE);

    const { body: child } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);

    const { status, body: expenses } = await request(app).get('/api/expenses');
    expect(status).toBe(200);

    const childRow = expenses.find(e => e.id === child.id);
    expect(childRow).toBeDefined();
    expect(childRow.status).toBe('pending');
    expect(childRow.recurringTemplateId).toBe(template.id);
    expect(typeof childRow.period).toBe('string');
  });
});

// Scenario 4: endDate on active template stops generation from that date forward.
describe('Scenario 4 — endDate stops generation', () => {
  it('should return 422 when the next due date is after endDate', async () => {
    _override(FLAGS.RECURRING_EXPENSES, true);

    const { body: template } = await request(app)
      .post('/api/recurring-expenses')
      .send({ ...VALID_TEMPLATE, dayOfMonth: 1, startDate: '2026-05-01', endDate: '2026-05-31' });

    // First generate lands on 2026-05-01, within the endDate.
    const { status: s1 } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);
    expect(s1).toBe(201);

    // Second generate would land on 2026-06-01, past endDate — should be rejected.
    const { status: s2 } = await request(app)
      .post(`/api/recurring-expenses/${template.id}/generate`);
    expect(s2).toBe(422);
  });
});
