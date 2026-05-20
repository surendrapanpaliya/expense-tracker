let templates;
let nextId;

function init() {
  templates = new Map();
  nextId = 1;
}

function getAll() {
  return Array.from(templates.values());
}

function getById(id) {
  return templates.get(id) || null;
}

function save(template) {
  if (template.id == null) template.id = nextId++;
  templates.set(template.id, template);
  return template;
}

function reset() {
  init();
}

init();

module.exports = { getAll, getById, save, reset };
