import fs from 'fs';
import path from 'path';
import { RunInfo } from '../config/env';

export interface Scenario {
  id: string;
  title: string;
  tags: string[];
  role?: string;
  action: string;
  files?: string[];
  input?: Record<string, any>;
  expect?: Record<string, any>;
  knownIssue?: string;  // bug id; the test still asserts the correct behaviour and stays red until fixed
  skipOn?: string[];   // environments where this scenario must not run, e.g. ["prod"]
}

export interface PageData { page: string; route: string; scenarios: Scenario[]; }

function fill(value: any, run: RunInfo): any {
  if (typeof value === 'string') {
    return value.replace(/\{\{runId\}\}/g, run.runId).replace(/\{\{tag\}\}/g, run.tag).replace(/\{\{letters\}\}/g, run.letters);
  }
  if (Array.isArray(value)) return value.map(v => fill(v, run));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, run)]));
  return value;
}

/** Load one page's JSON data file. `tag` keeps only scenarios carrying that tag (e.g. "functional"). */
export function loadScenarios(pageName: string, run: RunInfo, tag?: string): Scenario[] {
  const file = path.join(__dirname, '..', 'data', `${pageName}.json`);
  const data: PageData = JSON.parse(fs.readFileSync(file, 'utf8'));
  return data.scenarios
    .filter(s => !tag || s.tags.includes(tag))
    .filter(s => !(s.skipOn ?? []).includes(run.env))
    .map(s => fill(s, run) as Scenario);
}
