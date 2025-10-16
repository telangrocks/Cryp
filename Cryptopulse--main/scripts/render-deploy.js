#!/usr/bin/env node
// Minimal Render API deploy + wait script
import { setTimeout as sleep } from 'timers/promises';

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const SERVICE_IDS = (process.env.RENDER_SERVICE_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const TIMEOUT_MS = parseInt(process.env.RENDER_DEPLOY_TIMEOUT_MS || '600000', 10); // 10m

if (!RENDER_API_KEY || SERVICE_IDS.length === 0) {
  console.error('Missing RENDER_API_KEY or RENDER_SERVICE_IDS');
  process.exit(1);
}

async function ensureFetch() {
  if (typeof fetch !== 'function') {
    const nf = await import('node-fetch').then(m => m.default).catch(() => null);
    if (nf) global.fetch = nf;
  }
}

async function triggerDeploy(serviceId) {
  const res = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RENDER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clearCache: true })
  });
  if (!res.ok) throw new Error(`Deploy trigger failed ${serviceId}: ${res.status}`);
  return res.json();
}

async function getDeploy(deployId) {
  const res = await fetch(`https://api.render.com/v1/deploys/${deployId}`, {
    headers: { 'Authorization': `Bearer ${RENDER_API_KEY}` }
  });
  if (!res.ok) throw new Error(`Get deploy failed ${deployId}: ${res.status}`);
  return res.json();
}

async function waitForHealthy(deployId) {
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    const d = await getDeploy(deployId);
    const s = d?.status || '';
    if (s === 'live') return d;
    if (['build_failed', 'update_failed', 'canceled'].includes(s)) throw new Error(`Deploy failed: ${s}`);
    await sleep(5000);
  }
  throw new Error('Timeout waiting for deploy to become live');
}

async function main() {
  await ensureFetch();
  const results = [];
  for (const sid of SERVICE_IDS) {
    console.log(`Triggering deploy for ${sid}`);
    const deploy = await triggerDeploy(sid);
    console.log(`Waiting for live: ${deploy.id}`);
    const live = await waitForHealthy(deploy.id);
    results.push({ serviceId: sid, deployId: deploy.id, status: live.status });
  }
  console.log(JSON.stringify({ results }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });


