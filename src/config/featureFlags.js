const FLAGS = {
  RECURRING_EXPENSES: 'expense-tracker.recurring-expenses.enabled',
};

// In-process overrides for testing; empty in production.
const _overrides = new Map();

function isEnabled(flagKey) {
  if (_overrides.has(flagKey)) return _overrides.get(flagKey);
  if (flagKey === FLAGS.RECURRING_EXPENSES) {
    return process.env.RECURRING_EXPENSES_ENABLED === 'true';
  }
  return false;
}

function _override(flagKey, value) {
  _overrides.set(flagKey, value);
}

function _clearOverrides() {
  _overrides.clear();
}

module.exports = { FLAGS, isEnabled, _override, _clearOverrides };
