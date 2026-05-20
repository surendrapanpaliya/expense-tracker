const request = require('supertest');
const app = require('../../server');
const expenseStore = require('../../src/store/expenses');

const BASE_EXPENSE = {
  description: 'Office supplies',
  amount: 50,
  category: 'other',
  submittedBy: 'Alice',
};

beforeEach(() => {
  expenseStore.reset();
});

describe('POST /api/expenses — priority field', () => {
  it('should default priority to medium when not provided', async () => {
    const { status, body } = await request(app).post('/api/expenses').send(BASE_EXPENSE);
    expect(status).toBe(201);
    expect(body.priority).toBe('medium');
  });

  it('should accept all valid priority values', async () => {
    for (const priority of ['low', 'medium', 'high', 'critical']) {
      const { status, body } = await request(app)
        .post('/api/expenses')
        .send({ ...BASE_EXPENSE, priority });
      expect(status).toBe(201);
      expect(body.priority).toBe(priority);
    }
  });

  it('should return 400 for an invalid priority value', async () => {
    const { status, body } = await request(app)
      .post('/api/expenses')
      .send({ ...BASE_EXPENSE, priority: 'urgent' });
    expect(status).toBe(400);
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/priority must be one of/)])
    );
  });
});

describe('PATCH /api/expenses/:id — update priority', () => {
  it('should update the priority of an existing expense', async () => {
    const { body: created } = await request(app).post('/api/expenses').send(BASE_EXPENSE);
    expect(created.priority).toBe('medium');

    const { status, body } = await request(app)
      .patch(`/api/expenses/${created.id}`)
      .send({ priority: 'critical' });
    expect(status).toBe(200);
    expect(body.priority).toBe('critical');
  });

  it('should return 400 for an invalid priority on update', async () => {
    const { body: created } = await request(app).post('/api/expenses').send(BASE_EXPENSE);

    const { status, body } = await request(app)
      .patch(`/api/expenses/${created.id}`)
      .send({ priority: 'urgent' });
    expect(status).toBe(400);
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/priority must be one of/)])
    );
  });

  it('should return 404 when updating a non-existent expense', async () => {
    const { status } = await request(app)
      .patch('/api/expenses/9999')
      .send({ priority: 'high' });
    expect(status).toBe(404);
  });
});

describe('GET /api/expenses — priority field present', () => {
  it('should include priority on listed expenses', async () => {
    const { body: expenses } = await request(app).get('/api/expenses');
    expect(expenses.length).toBeGreaterThan(0);
    expenses.forEach(e => expect(e).toHaveProperty('priority'));
  });
});
