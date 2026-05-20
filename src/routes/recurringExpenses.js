const router = require('express').Router();
const { isEnabled, FLAGS } = require('../config/featureFlags');
const recurringService = require('../services/recurringService');
const templateStore = require('../store/recurringTemplates');

// Checked on every request so a mid-session flag disable takes effect immediately.
function flagGate(req, res, next) {
  if (!isEnabled(FLAGS.RECURRING_EXPENSES)) return res.status(404).json({ error: 'Not found' });
  next();
}

router.get('/', flagGate, (req, res) => {
  res.json(templateStore.getAll());
});

router.get('/:id', flagGate, (req, res) => {
  const template = templateStore.getById(parseInt(req.params.id));
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

router.post('/', flagGate, (req, res) => {
  try {
    const template = recurringService.createTemplate(req.body);
    res.status(201).json(template);
  } catch (err) {
    if (err.message === 'VALIDATION_ERROR') return res.status(400).json({ errors: err.errors });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', flagGate, (req, res) => {
  try {
    const template = recurringService.updateTemplate(parseInt(req.params.id), req.body);
    res.json(template);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Template not found' });
    if (err.message === 'VALIDATION_ERROR') return res.status(400).json({ errors: err.errors });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/generate', flagGate, (req, res) => {
  try {
    const child = recurringService.generateChildRow(parseInt(req.params.id));
    res.status(201).json(child);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Template not found' });
    if (err.statusCode === 409) return res.status(409).json({ error: 'Child row for this period already exists' });
    if (err.statusCode === 422) return res.status(422).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
