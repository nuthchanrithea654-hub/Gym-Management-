const fs = require('node:fs');
const path = require('node:path');

// Optional outside Kubernetes. Never record bodies, headers, queries or user IDs.
module.exports = (filename = process.env.ACCESS_LOG_FILE) => {
  if (!filename) return (req, res, next) => next();

  fs.mkdirSync(path.dirname(filename), { recursive: true });
  // Fail startup if the configured shared volume is not writable.
  fs.closeSync(fs.openSync(filename, 'a', 0o640));
  let bytes = fs.statSync(filename).size;
  let pending = 0;
  let writes = Promise.resolve();
  const routes = new Set(['register', 'login', 'memberships', 'server', 'payments', 'classes', 'bookings']);

  return (req, res, next) => {
    const started = process.hrtime.bigint();
    const prefix = req.path.split('/')[1];
    const route = routes.has(prefix) ? `/${prefix}` : (req.path === '/' ? '/' : '[unmatched]');
    res.once('finish', () => {
      if (pending >= 1000) return; // Bound memory if storage falls behind.
      const line = JSON.stringify({
        time: new Date().toISOString(), method: req.method, route,
        status: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - started) / 1e6
      }) + '\n';
      pending += 1;
      writes = writes.then(async () => {
        if (bytes + Buffer.byteLength(line) > 5 * 1024 * 1024) {
          await fs.promises.rename(filename, `${filename}.1`);
          bytes = 0;
        }
        await fs.promises.appendFile(filename, line, { mode: 0o640 });
        bytes += Buffer.byteLength(line);
      }).catch(() => {
        console.error('Access log write failed');
      }).finally(() => { pending -= 1; });
    });
    next();
  };
};
