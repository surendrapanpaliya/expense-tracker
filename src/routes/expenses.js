const router = require('express').Router();
const expenseService = require('../services/expenseService');
const expenseStore = require('../store/expenses');
const { isEnabled, FLAGS } = require('../config/featureFlags');

router.get('/', (req, res) => {
  let expenses = expenseStore.getAll();
  if (req.query.status) expenses = expenses.filter(e => e.status === req.query.status);
  if (req.query.category) expenses = expenses.filter(e => e.category === req.query.category);

  // Strip recurring fields when the flag is off so already-approved child rows
  // remain queryable as ordinary expenses without exposing the template link.
  if (!isEnabled(FLAGS.RECURRING_EXPENSES)) {
    expenses = expenses.map(({ recurringTemplateId, period, ...rest }) => rest);
  }

  res.json(expenses);
});

router.get('/:id', (req, res) => {
  const expense = expenseStore.getById(parseInt(req.params.id));
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

router.post('/', (req, res) => {
  try {
    const expense = expenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (err) {
    if (err.message === 'VALIDATION_ERROR') return res.status(400).json({ errors: err.errors });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const expense = expenseService.updateExpense(parseInt(req.params.id), req.body);
    res.json(expense);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Expense not found' });
    if (err.message === 'VALIDATION_ERROR') return res.status(400).json({ errors: err.errors });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/approve', (req, res) => {
  try {
    const expense = expenseService.approveExpense(parseInt(req.params.id), req.body.reviewedBy);
    res.json(expense);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Expense not found' });
    if (err.statusCode === 409) return res.status(409).json({ error: 'Expense is not pending' });
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/reject', (req, res) => {
  try {
    const expense = expenseService.rejectExpense(parseInt(req.params.id), req.body.reviewedBy);
    res.json(expense);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Expense not found' });
    if (err.statusCode === 409) return res.status(409).json({ error: 'Expense is not pending' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
