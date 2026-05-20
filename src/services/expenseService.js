const expenseStore = require('../store/expenses');
const { BUDGETS } = require('../config/budgets');
const audit = require('../audit/auditLog');

const VALID_CATEGORIES = Object.keys(BUDGETS);
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

function createExpense({ description, amount, category, submittedBy, priority = 'medium', recurringTemplateId = null, period = null }) {
  const errors = [];
  if (!description || description.length < 3) errors.push('description must be at least 3 characters');
  if (!amount || amount <= 0) errors.push('amount must be a positive number');
  if (!VALID_CATEGORIES.includes(category)) errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  if (!submittedBy) errors.push('submittedBy is required');
  if (!VALID_PRIORITIES.includes(priority)) errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  if (errors.length) throw Object.assign(new Error('VALIDATION_ERROR'), { errors });

  const expense = expenseStore.save({
    description,
    amount,
    category,
    submittedBy,
    priority,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    recurringTemplateId,
    period,
  });

  audit.append({ action: 'SUBMITTED', expenseId: expense.id, actorId: submittedBy, before: null, after: 'pending' });
  return expense;
}

function approveExpense(id, reviewedBy) {
  const expense = expenseStore.getById(id);
  if (!expense) throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 });
  if (expense.status !== 'pending') throw Object.assign(new Error('CONFLICT'), { statusCode: 409 });

  const spent = expenseStore.getAll()
    .filter(e => e.category === expense.category && e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);

  if (spent + expense.amount > BUDGETS[expense.category]) {
    throw Object.assign(new Error('BUDGET_EXCEEDED'), { statusCode: 400 });
  }

  expense.status = 'approved';
  expense.reviewedBy = reviewedBy;
  expenseStore.save(expense);
  audit.append({ action: 'APPROVED', expenseId: id, actorId: reviewedBy, before: 'pending', after: 'approved' });
  return expense;
}

function rejectExpense(id, reviewedBy) {
  const expense = expenseStore.getById(id);
  if (!expense) throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 });
  if (expense.status !== 'pending') throw Object.assign(new Error('CONFLICT'), { statusCode: 409 });

  expense.status = 'rejected';
  expense.reviewedBy = reviewedBy;
  expenseStore.save(expense);
  audit.append({ action: 'REJECTED', expenseId: id, actorId: reviewedBy, before: 'pending', after: 'rejected' });
  return expense;
}

function updateExpense(id, { priority }) {
  const expense = expenseStore.getById(id);
  if (!expense) throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 });

  const errors = [];
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  if (errors.length) throw Object.assign(new Error('VALIDATION_ERROR'), { errors });

  if (priority !== undefined) expense.priority = priority;
  expenseStore.save(expense);
  return expense;
}

module.exports = { createExpense, approveExpense, rejectExpense, updateExpense };
