#!/usr/bin/env node
/**
 * validate_spec.js — validate spec files against docs/specs/_schema.md.
 *
 * Usage:
 *   node scripts/validate_spec.js [path ...]
 *
 * If no paths given, validates all *.md files in docs/specs/features/
 * (except _template.md which is intentionally non-conformant).
 *
 * Exit codes:
 *   0 — all specs valid (or no specs to validate)
 *   1 — at least one spec failed validation, or invocation error
 *
 * This script encodes _schema.md as JS constants. When _schema.md changes,
 * update this file in the same commit.
 *
 * Conforms to Athenahealth SDD §3.4 (system-enforced, not discipline-enforced).
 *
 * Pure Node.js stdlib — no npm install required.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---- Schema constants (mirror docs/specs/_schema.md §1 and §2) ----

const REQUIRED_FRONTMATTER_FIELDS = ['id', 'risk', 'owner', 'toggle', 'status'];
const VALID_RISK = new Set(['low', 'medium', 'high']);
const VALID_STATUS = new Set(['draft', 'ready', 'in-progress', 'done', 'archived']);
const ID_PATTERN = /^APR-\d{4}$/;
const TOGGLE_PATTERN = /^[a-z][a-z0-9.\-]*$/;
const REQUIRED_SECTIONS = [
  'Why',
  'What changes',
  'Capabilities',
  'Rollback',
  'Escalation conditions',
  'Tests',
];

// ---- Frontmatter parser (minimal, schema-tailored) ----

function parseFrontmatter(content) {
  // Strip UTF-8 BOM if present (PowerShell often writes one)
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { fm: null, body: content };
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      const fm = {};
      for (const line of lines.slice(1, i)) {
        if (line.includes(':') && !line.trimStart().startsWith('#')) {
          const idx = line.indexOf(':');
          const key = line.substring(0, idx).trim();
          const value = line.substring(idx + 1).trim();
          fm[key] = value;
        }
      }
      const body = lines.slice(i + 1).join('\n');
      return { fm, body };
    }
  }
  return { fm: null, body: content };
}

// ---- Validation ----

function validate(filePath) {
  const errors = [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return [`Could not read file: ${e.message}`];
  }

  const { fm, body } = parseFrontmatter(content);
  if (fm === null) {
    errors.push("No frontmatter found (file must start with '---' line)");
    return errors;
  }

  // Required fields
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (!(field in fm)) {
      errors.push(`Missing required frontmatter field: ${field}`);
    }
  }

  // Field values
  if ('id' in fm && !ID_PATTERN.test(fm.id)) {
    errors.push(`Invalid id: '${fm.id}' (must match pattern APR-NNNN)`);
  }
  if ('risk' in fm && !VALID_RISK.has(fm.risk)) {
    errors.push(`Invalid risk: '${fm.risk}' (must be one of [${[...VALID_RISK].sort().join(', ')}])`);
  }
  if ('status' in fm && !VALID_STATUS.has(fm.status)) {
    errors.push(`Invalid status: '${fm.status}' (must be one of [${[...VALID_STATUS].sort().join(', ')}])`);
  }
  if ('owner' in fm && !fm.owner) {
    errors.push('owner field is empty');
  }
  if ('toggle' in fm) {
    const toggle = fm.toggle;
    if (toggle !== 'none' && !TOGGLE_PATTERN.test(toggle)) {
      errors.push(`Invalid toggle: '${toggle}' (must be 'none' or a lowercase flag key)`);
    }
    // Cross-field rule from _schema.md §1.1
    if (toggle === 'none' && fm.risk !== 'low') {
      errors.push(`toggle: none requires risk: low (got risk: ${fm.risk || 'missing'})`);
    }
  }

  // Body sections — presence
  const found = [];
  for (const section of REQUIRED_SECTIONS) {
    const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^## ${escaped}\\s*$`, 'm');
    const match = body.match(pattern);
    if (match) {
      found.push([section, match.index]);
    } else {
      errors.push(`Missing required body section: ## ${section}`);
    }
  }

  // Body sections — order (independent of presence; checks whatever sections ARE found)
  if (found.length >= 2) {
    const documentOrder = [...found].sort((a, b) => a[1] - b[1]).map(([s]) => s);
    const requiredIndices = documentOrder.map(s => REQUIRED_SECTIONS.indexOf(s));
    const isMonotonic = requiredIndices.every((v, i, a) => i === 0 || v > a[i - 1]);
    if (!isMonotonic) {
      const expected = REQUIRED_SECTIONS.filter(s => documentOrder.includes(s));
      errors.push(`Body sections out of order: found [${documentOrder.join(', ')}], expected order [${expected.join(', ')}]`);
    }
  }

  // High-risk specs require a linked ADR (_schema.md §3 #4)
  if (fm.risk === 'high') {
    const adrPattern = /docs[/\\]adr[/\\]\d{4}-[a-z0-9\-]+\.md/i;
    if (!adrPattern.test(body)) {
      errors.push('risk: high requires a linked ADR (reference like docs/adr/NNNN-*.md in body)');
    }
  }

  return errors;
}

// ---- Driver ----

function main() {
  const args = process.argv.slice(2);
  let paths;
  if (args.length > 0) {
    paths = args;
  } else {
    const featuresDir = path.join('docs', 'specs', 'features');
    if (!fs.existsSync(featuresDir)) {
      console.error(`ERROR: ${featuresDir} does not exist (run from repo root)`);
      process.exit(1);
    }
    paths = fs.readdirSync(featuresDir)
      .filter(name => name.endsWith('.md') && name !== '_template.md')
      .sort()
      .map(name => path.join(featuresDir, name));
  }

  if (paths.length === 0) {
    console.log('No specs to validate (docs/specs/features/ is empty).');
    process.exit(0);
  }

  let totalErrors = 0;
  for (const p of paths) {
    if (path.basename(p) === '_template.md') {
      console.log(`SKIP ${p} (template file)`);
      continue;
    }
    const errors = validate(p);
    if (errors.length > 0) {
      console.log(`FAIL ${p}`);
      for (const e of errors) {
        console.log(`  - ${e}`);
      }
      totalErrors += errors.length;
    } else {
      console.log(`PASS ${p}`);
    }
  }

  if (totalErrors > 0) {
    console.error(`\n${totalErrors} error(s) across specs. FAIL.`);
    process.exit(1);
  }
  console.log('\nAll specs valid.');
  process.exit(0);
}

main();