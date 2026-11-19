#!/usr/bin/env node
// Reads existing service .env files without logging their contents.
const fs = require('node:fs');
const path = require('node:path');
process.chdir(path.join(__dirname, '..'));
const services = ['registration', 'login', 'membership', 'payment', 'class', 'booking'];
const data = {};
let sharedSecret;
for (const service of services) {
  const dotenv = require(`../${service}-service/node_modules/dotenv`);
  const env = dotenv.parse(fs.readFileSync(`${service}-service/.env`));
  if (!env.MONGO_URI || !/^mongodb(\+srv)?:\/\//.test(env.MONGO_URI)) {
    throw new Error(`Missing or invalid MONGO_URI in ${service}-service/.env`);
  }
  data[`${service.toUpperCase()}_MONGO_URI`] = env.MONGO_URI;
  if (service !== 'registration') {
    if (!env.JWT_SECRET) throw new Error(`Missing JWT_SECRET for ${service}`);
    if (sharedSecret && sharedSecret !== env.JWT_SECRET) throw new Error('JWT secrets differ; resolve existing configuration before deployment');
    sharedSecret = env.JWT_SECRET;
  }
}
if (data.REGISTRATION_MONGO_URI !== data.LOGIN_MONGO_URI) {
  throw new Error('Registration and login URIs differ. Confirm they share the users database and prepare the Secret manually.');
}
data.JWT_SECRET = sharedSecret;
fs.mkdirSync('k8s/local', { recursive: true, mode: 0o700 });
// JSON-quoted strings are also YAML scalars: preserve special characters safely.
const yaml = 'apiVersion: v1\nkind: Secret\nmetadata:\n  name: gym-secrets\n  namespace: gym-management\ntype: Opaque\nstringData:\n'
  + Object.entries(data).map(([key, value]) => `  ${key}: ${JSON.stringify(value)}\n`).join('');
fs.writeFileSync('k8s/local/secret.yaml', yaml, { mode: 0o600, flag: 'wx' });
console.log('Created ignored k8s/local/secret.yaml from existing configuration; no values printed.');
