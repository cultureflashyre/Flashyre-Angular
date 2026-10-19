#!/usr/bin/env node
// Turns the "api" scenarios of e2e/data/<page>.json into api/data/<page>-api.json for the data-driven Newman collection.
// Scenarios that need seeded records ({{id:x}}) are skipped here; Playwright covers those.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = process.argv[2] || 'candidate';
const src = JSON.parse(fs.readFileSync(path.join(root, 'e2e', 'data', `${page}.json`), 'utf8'));
const rows = [];
let skipped = 0;
for (const s of src.scenarios) {
  if (s.action !== 'api') continue;
  if (JSON.stringify(s.input).includes('{{id:')) { skipped++; continue; }
  rows.push({ id: s.id, title: s.title, role: s.role, method: s.input.method, path: s.input.path,
    status: s.expect.status, form: s.input.form, json: s.input.json, knownIssue: s.knownIssue });
}
fs.mkdirSync(path.join(root, 'api', 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'api', 'data', `${page}-api.json`), JSON.stringify(rows, null, 2));
console.log(`${rows.length} API scenarios written (${skipped} skipped: need seeded records)`);
