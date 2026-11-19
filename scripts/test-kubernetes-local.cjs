const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const root = path.join(__dirname, '..');
const listen = async (app) => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
};
const close = server => new Promise(resolve => server.close(resolve));

test('verified liveness, database readiness and JWT rejection for six backend apps', async () => {
  for (const service of ['registration', 'login', 'membership', 'payment', 'class', 'booking']) {
    const { server, url } = await listen(require(`${root}/${service}-service/app`));
    try {
      assert.equal((await fetch(url)).status, 200, service);
      const readiness = await fetch(`${url}/readyz`);
      assert.equal(readiness.status, 503, service);
      assert.deepEqual(await readiness.json(), { ready: false });
      if (['membership', 'payment', 'class', 'booking'].includes(service)) {
        const route = { membership: '/server', payment: '/payments/user', class: '/classes', booking: '/bookings/user' }[service];
        assert.equal((await fetch(url + route)).status, 401);
        assert.equal((await fetch(url + route, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
      }
    } finally { await close(server); }
  }
});

test('gateway preserves paths, queries, JSON bodies and auth; shared log redacts sensitive data', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gym-log-test-'));
  const upstream = await listen((req, res) => {
    let body = '';
    req.on('data', part => { body += part; });
    req.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ path: req.url, method: req.method, body, auth: req.headers.authorization })); });
  });
  for (const key of ['REGISTRATION_SERVICE', 'LOGIN_SERVICE', 'MEMBERSHIP_SERVICES', 'PAYMENT_SERVICE', 'CLASS_SERVICE', 'BOOKING_SERVICE']) process.env[key] = upstream.url;
  process.env.ACCESS_LOG_FILE = path.join(dir, 'access.log');
  const gateway = await listen(require(`${root}/api-gateway/app`));
  try {
    assert.equal((await fetch(gateway.url)).status, 200);
    for (const prefix of ['register', 'login', 'memberships', 'server', 'payments', 'classes', 'bookings']) {
      const response = await fetch(`${gateway.url}/${prefix}/item?secret=QUERY_SECRET`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer HEADER_SECRET' }, body: '{"password":"BODY_SECRET"}' });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.path, `/${prefix}/item?secret=QUERY_SECRET`);
      assert.equal(result.method, 'PATCH');
      assert.equal(result.auth, 'Bearer HEADER_SECRET');
      assert.equal(result.body, '{"password":"BODY_SECRET"}');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    const logs = await fs.readFile(process.env.ACCESS_LOG_FILE, 'utf8');
    assert.equal(logs.includes('SECRET'), false);
    assert.equal(logs.includes('item'), false);
    const records = logs.trim().split('\n').map(JSON.parse);
    assert(records.some(record => record.route === '/bookings' && record.status === 200));
  } finally {
    await close(gateway.server); await close(upstream.server);
    await fs.rm(dir, { recursive: true, force: true });
  }
});
