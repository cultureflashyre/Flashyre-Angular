#!/usr/bin/env node
// `npm run start:qa` : starts the QA runner and the Angular dev server together; Ctrl+C stops both.
import { spawn } from 'node:child_process';
const run = (cmd, args) => spawn(cmd, args, { stdio: 'inherit', shell: true });
const kids = [run('node', ['tools/qa-runner.mjs']), run('npm', ['start'])];
const stop = () => kids.forEach(k => { try { k.kill(); } catch { /* ignore */ } });
process.on('SIGINT', () => { stop(); process.exit(0); });
kids.forEach(k => k.on('exit', stop));
