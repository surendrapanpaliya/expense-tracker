const entries = [];

function append({ action, expenseId, actorId, before, after }) {
  entries.push({ action, expenseId, actorId, before, after, timestamp: new Date().toISOString() });
}

function getAll() {
  return [...entries];
}

module.exports = { append, getAll };
