#!/usr/bin/env node
/*
  Dev Log Analyzer & Auto-Fix Runner
  - Scans .dev-logs for recent entries
  - Emits a brief summary
  - Runs lint:fix and optional routines
  - Auto-commits and pushes if changes exist
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

async function fetchRemoteLogs(days) {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];
    const endpoint = `${backendUrl.replace(/\/$/, '')}/api/dev-log/export?days=${days}`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({ logs: [] }));
    return Array.isArray(data.logs) ? data.logs : [];
  } catch {
    return [];
  }
}

function readRecentLocalLogs(days = 2) {
  const logsDir = path.join(repoRoot, '.dev-logs');
  const results = [];
  if (!fs.existsSync(logsDir)) return results;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const name = d.toISOString().slice(0, 10) + '.json';
    const file = path.join(logsDir, name);
    if (!fs.existsSync(file)) continue;
    try {
      const arr = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (Array.isArray(arr)) results.push(...arr);
    } catch {}
  }
  return results;
}

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: repoRoot, ...opts });
}

async function main() {
  const days = parseInt(process.env.DEV_LOG_DAYS || '2', 10);
  let logs = readRecentLocalLogs(days);
  if (logs.length === 0) {
    try {
      const nodeFetch = await import('node-fetch').then(m => m.default).catch(() => null);
      if (nodeFetch) {
        global.fetch = nodeFetch;
      }
    } catch {}
    const remote = await fetchRemoteLogs(days);
    if (Array.isArray(remote) && remote.length > 0) logs = remote;
  }
  const errorCount = logs.filter(l => (l?.level || 'error') === 'error').length;
  const warnCount = logs.filter(l => (l?.level || '') === 'warn').length;
  console.log(`Dev Log Summary (last 2 days): errors=${errorCount} warnings=${warnCount} total=${logs.length}`);

  // Run auto-fix routines
  try {
    run('pnpm -r lint:fix');
  } catch {}

  // Optional format
  try {
    run('pnpm format:all');
  } catch {}

  // Check if changes exist
  let changed = false;
  try {
    const out = execSync('git status --porcelain', { cwd: repoRoot }).toString().trim();
    changed = out.length > 0;
  } catch {}

  if (changed) {
    const ts = new Date().toISOString();
    try { run('git add -A'); } catch {}
    try { run(`git commit -m "Auto-fix from dev logs ${ts}"`); } catch {}
    try { run('git push'); } catch {}
    console.log('Auto-fix commit pushed.');
  } else {
    console.log('No changes to commit.');
  }
}

main();


