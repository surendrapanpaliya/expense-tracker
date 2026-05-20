const express = require('express');
const expenseRoutes = require('./src/routes/expenses');
const recurringRoutes = require('./src/routes/recurringExpenses');

const app = express();
app.use(express.json());
app.use('/api/expenses', expenseRoutes);
app.use('/api/recurring-expenses', recurringRoutes);

module.exports = app;

if (require.main === module) {
  app.listen(3000, () => console.log('Expense tracker running on :3000'));
}
