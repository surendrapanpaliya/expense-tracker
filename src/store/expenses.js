const { SEED_EXPENSES } = require('../config/seed');

let expenses;
let nextId;

function init() {
  expenses = new Map();
  SEED_EXPENSES.forEach(e => expenses.set(e.id, { ...e }));
  nextId = SEED_EXPENSES.length + 1;
}

function getAll() {
  return Array.from(expenses.values());
}

function getById(id) {
  return expenses.get(id) || null;
}

function save(expense) {
  if (expense.id == null) expense.id = nextId++;
  expenses.set(expense.id, expense);
  return expense;
}

function reset() {
  init();
}

init();

module.exports = { getAll, getById, save, reset };
