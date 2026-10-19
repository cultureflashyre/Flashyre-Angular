#!/usr/bin/env node
// Optional: read e2e/data/<page>.xlsx back into e2e/data/<page>.json (the file the tests actually use).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = process.argv[2] || 'candidate';
const wb = XLSX.readFile(path.join(root, 'e2e', 'data', `${page}.xlsx`));
const rows = XLSX.utils.sheet_to_json(wb.Sheets['scenarios']);
const meta = XLSX.utils.sheet_to_json(wb.Sheets['meta'])[0] || {};
const list = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const scenarios = rows.map(r => {
  const s = { id: r.id, title: r.title, tags: list(r.tags), action: r.action };
  if (r.role) s.role = r.role;
  if (r.skipOn) s.skipOn = list(r.skipOn);
  s.input = r.input ? JSON.parse(r.input) : {};
  s.expect = r.expect ? JSON.parse(r.expect) : {};
  if (r.knownIssue) s.knownIssue = r.knownIssue;
  return s;
});
fs.writeFileSync(path.join(root, 'e2e', 'data', `${page}.json`), JSON.stringify({ page: meta.page, route: meta.route, scenarios }, null, 2));
console.log(`wrote ${page}.json (${scenarios.length} scenarios)`);
