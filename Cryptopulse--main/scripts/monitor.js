#!/usr/bin/env node
// Simple monitor: checks backend and frontend, fetches dev logs, outputs JSON, exits non-zero on degradation
import fs from 'fs';
import path from 'path';

const BACKEND_URL = process.env.RENDER_BACKEND_URL || process.env.BACKEND_URL || '';
const FRONTEND_URL = process.env.RENDER_FRONTEND_URL || process.env.FRONTEND_URL || '';
const DEV_LOG_DAYS = parseInt(process.env.DEV_LOG_DAYS || '1', 10);
const ERROR_THRESHOLD = parseInt(process.env.ERROR_THRESHOLD || '3', 10);
const WARN_THRESHOLD = parseInt(process.env.WARN_THRESHOLD || '10', 10);

async function ensureFetch() {
  if (typeof fetch !== 'function') {
    const nf = await import('node-fetch').then(m => m.default).catch(() => null);
    if (nf) global.fetch = nf;
  }
}

async function getJson(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json().catch(() => ({}));
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function getText(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function main() {
  await ensureFetch();
  const report = { timestamp: new Date().toISOString(), backend: {}, frontend: {}, logs: {} };
  let degraded = false;

  if (BACKEND_URL) {
    const base = BACKEND_URL.replace(/\/$/, '');
    report.backend.status = await getJson(`${base}/api/status`);
    report.backend.health = await getJson(`${base}/health`);
    report.backend.healthDetailed = await getJson(`${base}/health/detailed`);
    report.logs.export = await getJson(`${base}/api/dev-log/export?days=${DEV_LOG_DAYS}`);
    const logs = (report.logs.export.ok && report.logs.export.data?.logs) || [];
    const errorCount = logs.filter(l => (l?.level || 'error') === 'error').length;
    const warnCount = logs.filter(l => (l?.level || '') === 'warn').length;
    report.logs.summary = { count: logs.length, errorCount, warnCount };
    if (!report.backend.status.ok || !report.backend.health.ok) degraded = true;
    if (errorCount > ERROR_THRESHOLD || warnCount > WARN_THRESHOLD) degraded = true;
  }

  if (FRONTEND_URL) {
    const base = FRONTEND_URL.replace(/\/$/, '');
    report.frontend.root = await getText(`${base}/`);
    if (!report.frontend.root.ok) degraded = true;
  }

  const outPath = path.join(process.cwd(), 'monitor-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Monitor report written to ${outPath}`);
  if (degraded) {
    console.error('Service degraded according to thresholds.');
    process.exit(2);
  }
}

main();


