#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const local = path.join(__dirname, '../k8s/local');
const files = fs.readdirSync(local).filter(name => /^demo-.*\.json$/.test(name)).sort().reverse();
const record = files.map(name => JSON.parse(fs.readFileSync(path.join(local, name)))).find(item => item.memberToken && item.membershipId);
if (!record) throw new Error('No completed private demo record found; run the live smoke test first');
const base = process.env.GYM_BASE_URL || record.base;
const get = route => new Promise((resolve, reject) => {
  const url = new URL(base + route);
  const request = (url.protocol === 'https:' ? https : http).get(url, { agent: false, headers: { Host: 'gym.aupp.com', Authorization: `Bearer ${record.memberToken}` } }, response => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => {
      if (response.statusCode !== 200) return reject(new Error(`Read-only request returned HTTP ${response.statusCode}`));
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Expected JSON')); }
    });
    response.on('error', reject);
  });
  request.setTimeout(15000, () => request.destroy(new Error('Read-only request timeout')));
  request.on('error', reject);
});
(async () => {
  const membership = await get(`/memberships/${record.memberId}`);
  if (membership._id !== record.membershipId || membership.plan !== 'quarterly') throw new Error('Persisted membership does not match demo record');
  console.log('Persisted membership matches original _id and updated quarterly plan');
  if (!process.argv.includes('--replicas')) return;
  const replicas = new Set(record.replicaNames || []);
  for (let attempt = 0; attempt < 12; attempt++) {
    const info = await get('/server');
    replicas.add(info.server);
    console.log(`Membership replica observed: ${info.server}`);
    if (replicas.size >= 2) break;
    // Leave upstream connection idle beyond Node globalAgent's default timeout.
    await new Promise(resolve => setTimeout(resolve, 6000));
  }
  fs.writeFileSync(path.join(local, 'replica-proof.json'), JSON.stringify({ time: new Date().toISOString(), replicas: [...replicas] }, null, 2), { mode: 0o600 });
  console.log(`Distinct membership replicas observed across demo requests: ${replicas.size}`);
  if (replicas.size < 2) { console.error('Two replicas not observed; inspect ready endpoints and connection reuse'); process.exitCode = 1; }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
