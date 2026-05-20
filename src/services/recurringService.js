const templateStore = require('../store/recurringTemplates');
const expenseStore = require('../store/expenses');
const { BUDGETS } = require('../config/budgets');

const VALID_CATEGORIES = Object.keys(BUDGETS);
const VALID_CADENCES = ['monthly', 'weekly'];

function createTemplate({ name, amount, category, cadence, dayOfMonth, startDate, endDate }) {
  const errors = [];
  if (!name || name.length < 1) errors.push('name is required');
  if (!amount || amount <= 0) errors.push('amount must be positive');
  if (!VALID_CATEGORIES.includes(category)) errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  if (!VALID_CADENCES.includes(cadence)) errors.push(`cadence must be one of: ${VALID_CADENCES.join(', ')}`);
  if (cadence === 'monthly' && (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31)) {
    errors.push('dayOfMonth must be between 1 and 31 for monthly cadence');
  }
  if (!startDate) errors.push('startDate is required');
  if (errors.length) throw Object.assign(new Error('VALIDATION_ERROR'), { errors });

  return templateStore.save({
    name,
    amount,
    category,
    cadence,
    dayOfMonth: cadence === 'monthly' ? dayOfMonth : null,
    startDate,
    endDate: endDate || null,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
}

function computePeriod(cadence, date) {
  const d = new Date(date);
  if (cadence === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // ISO week: days since Jan 1 / 7, rounded up
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function nextDueDate(template) {
  const childRows = expenseStore.getAll()
    .filter(e => e.recurringTemplateId === template.id)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  if (childRows.length === 0) {
    return new Date(template.startDate);
  }

  if (template.cadence === 'monthly') {
    const lastPeriod = childRows[childRows.length - 1].period; // 'YYYY-MM'
    const [year, month] = lastPeriod.split('-').map(Number);
    // month is 1-based from the period string; new Date(year, month, day) advances to the next calendar month
    return new Date(year, month, template.dayOfMonth);
  }

  // weekly: add 7 days to the last generated row's date
  const last = new Date(childRows[childRows.length - 1].submittedAt);
  last.setDate(last.getDate() + 7);
  return last;
}

function generateChildRow(templateId) {
  const template = templateStore.getById(templateId);
  if (!template) throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 });
  if (template.status !== 'active') throw Object.assign(new Error('TEMPLATE_INACTIVE'), { statusCode: 422 });

  const dueDate = nextDueDate(template);
  const period = computePeriod(template.cadence, dueDate);

  if (template.endDate && dueDate > new Date(template.endDate)) {
    throw Object.assign(new Error('TEMPLATE_ENDED'), { statusCode: 422 });
  }

  const duplicate = expenseStore.getAll().find(
    e => e.recurringTemplateId === templateId && e.period === period
  );
  if (duplicate) throw Object.assign(new Error('DUPLICATE_CHILD'), { statusCode: 409 });

  return expenseStore.save({
    description: template.name,
    amount: template.amount,
    category: template.category,
    submittedBy: 'recurring-system',
    status: 'pending',
    submittedAt: dueDate.toISOString(),
    reviewedBy: null,
    recurringTemplateId: templateId,
    period,
  });
}

function updateTemplate(id, { status, endDate }) {
  const template = templateStore.getById(id);
  if (!template) throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 });

  const errors = [];
  if (status !== undefined && !['active', 'paused'].includes(status)) {
    errors.push('status must be one of: active, paused');
  }
  if (endDate !== undefined && endDate !== null && isNaN(Date.parse(endDate))) {
    errors.push('endDate must be a valid date string');
  }
  if (errors.length) throw Object.assign(new Error('VALIDATION_ERROR'), { errors });

  if (status !== undefined) template.status = status;
  if (endDate !== undefined) template.endDate = endDate;
  return templateStore.save(template);
}

module.exports = { createTemplate, generateChildRow, updateTemplate };
