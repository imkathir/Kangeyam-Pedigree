#!/usr/bin/env node
/**
 * Lists English strings used with {{tr …}} that have no Tamil entry, so gaps
 * fail loudly instead of silently rendering in English.
 *
 *   npm run i18n:check          # report
 *   npm run i18n:check -- --ci  # exit 1 when something is missing
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dictSrc = fs.readFileSync(path.join(root, 'app/utils/dictionary.js'), 'utf8');
const dict = {};
for (const m of dictSrc.matchAll(/"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)"/g)) {
  dict[JSON.parse('"' + m[1] + '"')] = JSON.parse('"' + m[2] + '"');
}

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(hbs|js)$/.test(entry.name)) files.push(p);
  }
})(path.join(root, 'app'));

// not copy: aria values, icons, form-example placeholders and code identifiers
const IGNORE = new Set([
  'true', 'false', '✕', '☰', '🔓', '🔑', '⌄', '×',
  'partner_animal', 'n₁+n₂+1',
  'Kangeyam Rekla Race 2026', '1st Place — 200m (23.9s) / Pidipadaatha Kaalai / Peak 3.5 L/day A2',
  '2019-04 or 2019', 'KGR-2026-001', 'Registered {{name}}',
]);

const used = new Map();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  // {{tr "…"}} and subexpressions such as (tr "…") in {{if}} / ternary positions
  for (const m of src.matchAll(/(?:\{\{|\()tr\s+("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)) {
    const raw = m[1];
    const text = raw.startsWith('"') ? JSON.parse(raw) : raw.slice(1, -1).replace(/\\'/g, "'");
    if (!used.has(text)) used.set(text, file.replace(root + '/', ''));
  }
}

const missing = [...used.entries()].filter(([text]) => dict[text] === undefined && !IGNORE.has(text));
console.log(`${used.size} strings used · ${Object.keys(dict).length} translated · ${missing.length} missing`);
for (const [text, file] of missing) console.log(`  ${file}: ${text.slice(0, 100)}`);

if (process.argv.includes('--ci') && missing.length) process.exit(1);
