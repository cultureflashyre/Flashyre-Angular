#!/usr/bin/env node
// Optional: export e2e/data/<page>.json to e2e/data/<page>.xlsx so non-developers can review/edit scenarios.
// Each row keeps the nested parts (input, expect) as JSON text in a cell. Round-trip with excel-to-json.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = process.argv[2] || 'candidate';
const file = path.join(root, 'e2e', 'data', `${page}.json`);
const src = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = src.scenarios.map(s => ({
  id: s.id, title: s.title, tags: (s.tags || []).join(','), action: s.action, role: s.role || '',
  skipOn: (s.skipOn || []).join(','), knownIssue: s.knownIssue || '',
  input: JSON.stringify(s.input ?? {}), expect: JSON.stringify(s.expect ?? {}),
}));
const ws = XLSX.utils.json_to_sheet(rows);
ws['!cols'] = [{ wch: 14 }, { wch: 60 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 60 }, { wch: 40 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'scenarios');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ page: src.page, route: src.route }]), 'meta');
const out = path.join(root, 'e2e', 'data', `${page}.xlsx`);
XLSX.writeFile(wb, out);
console.log(`wrote ${out} (${rows.length} rows)`);
