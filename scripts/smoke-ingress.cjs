#!/usr/bin/env node
// Explicit opt-in: adds uniquely named demo records to the EXISTING database.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
if (!process.argv.includes('--write-demo-data')) {
  console.error('This test creates Admin/Member accounts and demo records in Atlas. Run with --write-demo-data to opt in.');
  process.exit(1);
}
const base = process.env.GYM_BASE_URL || 'http://127.0.0.1:8080';
const stamp = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const password = crypto.randomBytes(24).toString('base64url');
const local = path.join(__dirname, '../k8s/local');
fs.mkdirSync(local, { recursive: true, mode: 0o700 });
const evidence = [];
const privateResult = { base, password, stamp };
const privateFile = path.join(local, `demo-${stamp}.json`);
const save = () => fs.writeFileSync(privateFile, JSON.stringify(privateResult, null, 2), { mode: 0o600 });
const request = async (label, method, route, expected, token, body) => {
  const headers = { Host: 'gym.aupp.com' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  // Native HTTP preserves the explicit Host header across Node versions.
  const { response, data } = await new Promise((resolve, reject) => {
    const url = new URL(base + route);
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(url, { method, headers }, incoming => {
      let text = '';
      incoming.setEncoding('utf8');
      incoming.on('data', chunk => { text += chunk; });
      incoming.on('error', reject);
      incoming.on('end', () => {
        try {
          resolve({ data: JSON.parse(text), response: {
            status: incoming.statusCode,
            headers: { get: key => incoming.headers[key.toLowerCase()] }
          } });
        } catch {
          reject(new Error(`${label}: HTTP ${incoming.statusCode}, expected JSON; check Ingress Host routing`));
        }
      });
    });
    request.setTimeout(30000, () => request.destroy(new Error(`${label}: request timed out`)));
    request.on('error', reject);
    request.end(body ? JSON.stringify(body) : undefined);
  });
  const result = `${label}: HTTP ${response.status} (expected ${expected})`;
  console.log(result); evidence.push(result);
  if (response.status !== expected) throw new Error(`${label} did not return expected status; inspect privately`);
  return { data, response };
};
(async () => {
  await request('Ingress gateway root', 'GET', '/', 200);
  for (const role of ['admin', 'member']) {
    const email = `cld376-${role}-${stamp}@example.com`;
    privateResult[`${role}Email`] = email;
    const { data } = await request(`${role} registration`, 'POST', '/register', 201, null, { name: `CLD376 Demo ${role} ${stamp}`, email, password, role });
    privateResult[`${role}Id`] = data.user.id;
    save();
    const login = await request(`${role} login`, 'POST', '/login', 200, null, { email, password });
    if (!login.data.token || login.data.user.role !== role) throw new Error('Unexpected login payload');
    privateResult[`${role}Token`] = login.data.token;
    save();
  }
  const admin = privateResult.adminToken, member = privateResult.memberToken, userId = privateResult.memberId;
  await request('Wrong password', 'POST', '/login', 401, null, { email: privateResult.memberEmail, password: 'incorrect' });
  await request('Missing JWT', 'GET', '/classes', 401);
  await request('Invalid JWT', 'GET', '/classes', 401, 'invalid');
  const classBody = { className: `CLD376 Demo ${stamp}`, trainer: 'Demo Trainer', schedule: 'Friday 18:00', capacity: 10, status: 'available' };
  await request('Member denied admin operation', 'POST', '/classes', 403, member, classBody);
  await request('Ownership restriction', 'GET', `/payments/${privateResult.adminId}`, 403, member);
  const membership = await request('Membership create', 'POST', '/memberships', 201, admin, { userId, plan: 'monthly', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30*86400000).toISOString(), status: 'active' });
  privateResult.membershipId = membership.data.membership._id; save();
  await request('Membership view', 'GET', `/memberships/${userId}`, 200, member);
  await request('Membership update', 'PATCH', `/memberships/${privateResult.membershipId}`, 200, admin, { plan: 'quarterly' });
  const payment = await request('Payment create', 'POST', '/payments', 201, admin, { userId, amount: 25, paymentMethod: 'cash', status: 'paid' });
  privateResult.paymentId = payment.data.payment._id; save();
  await request('Payment view', 'GET', `/payments/${userId}`, 200, member);
  await request('Payment update', 'PATCH', `/payments/${privateResult.paymentId}`, 200, admin, { status: 'pending' });
  const gymClass = await request('Class create', 'POST', '/classes', 201, admin, classBody);
  privateResult.classId = gymClass.data.gymClass._id; save();
  await request('Class list', 'GET', '/classes', 200, member);
  await request('Class update', 'PATCH', `/classes/${privateResult.classId}`, 200, admin, { capacity: 12 });
  const booking = await request('Booking create', 'POST', '/bookings', 201, member, { classId: privateResult.classId });
  privateResult.bookingId = booking.data.booking._id; save();
  const bookings = await request('Booking paginated list', 'GET', `/bookings/${userId}?page=1&limit=20`, 200, member);
  if (!Array.isArray(bookings.data) || bookings.response.headers.get('X-Page') !== '1') throw new Error('Pagination contract failed');
  await request('Booking cancel', 'PATCH', `/bookings/${privateResult.bookingId}/cancel`, 200, member, {});
  const replicas = new Set();
  for (let i = 0; i < 30; i++) {
    const { data } = await request(`Replica request ${i + 1}`, 'GET', '/server', 200, member);
    replicas.add(data.server);
  }
  privateResult.replicaNames = [...replicas]; save();
  console.log(`Observed membership replicas: ${[...replicas].join(', ')}`);
  console.log('Private demo credentials and record IDs saved under ignored k8s/local/; no existing records deleted.');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => {
  save();
  fs.writeFileSync(path.join(local, `smoke-${stamp}.txt`), evidence.join('\n') + '\n', { mode: 0o600 });
});
