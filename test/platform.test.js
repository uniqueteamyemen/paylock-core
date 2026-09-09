const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const port = 3400 + Math.floor(Math.random() * 200);
const base = `http://127.0.0.1:${port}`;
const headers = { 'content-type': 'application/json', 'x-api-key': 'test-key' };
const target = {
  device_type: 'desktop',
  device_specs: { cpu: 'Intel Core i7', ram_gb: 16, gpu: 'RTX 3060' }
};

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = canonicalize(value[key]);
      return result;
    }, {});
  }
  return value;
}

function profileHash(profile) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(canonicalize(profile)))
    .digest('hex');
}

const targetHash = profileHash(target);

async function request(path, body) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

async function createSession(withReceipt = false) {
  const body = {
    service_id: `test-${Date.now()}-${Math.random()}`,
    device_id: 'requester-target-label',
    ...target
  };
  if (withReceipt) body.receipt_id = `receipt-${Date.now()}-${Math.random()}`;
  const session = await request('/v1/session', body);
  assert.equal(session.status, 200, JSON.stringify(session.body));
  return session.body.h0;
}

async function acknowledge(h0) {
  const response = await request('/v1/signal', {
    h0,
    signal_type: 'provider_ack',
    signal_ref: `ack-${Date.now()}-${Math.random()}`
  });
  assert.equal(response.status, 200, JSON.stringify(response.body));
}

async function verifyDevice(h0, decision = 'ACCEPT', overrides = {}) {
  const response = await request('/v1/device-verification', {
    h0,
    device_fingerprint: 'adapter-device-fingerprint-1',
    target_profile_hash: targetHash,
    actual_profile_hash: targetHash,
    verification_ref: `adapter-verification-${Date.now()}-${Math.random()}`,
    decision,
    ...overrides
  });
  return response;
}

function unlockBody(h0) {
  return {
    h0
  };
}

let server;

test.before(async () => {
  server = spawn(process.execPath, ['platform.js'], {
    cwd: __dirname + '/..',
    env: { ...process.env, PORT: String(port), PLATFORM_SECRET: 'test-secret', API_KEY: 'test-key' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  const startup = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`PayLock Core did not start: ${output}`)), 5000);
    server.stdout.on('data', chunk => {
      output += chunk.toString();
      if (output.includes('running on port')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.stderr.on('data', chunk => { output += chunk.toString(); });
    server.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    server.once('exit', (code, signal) => {
      if (code !== null || signal !== null) {
        clearTimeout(timer);
        reject(new Error(`PayLock Core exited (${code ?? signal}): ${output}`));
      }
    });
  });
  await startup;
});

test.after(() => server?.kill());

test('exact target and actual profile match allows unlock and issues H1', async () => {
  const h0 = await createSession();
  await acknowledge(h0);
  const verification = await verifyDevice(h0);
  assert.equal(verification.status, 200);
  const unlock = await request('/v1/unlock', unlockBody(h0));
  assert.equal(unlock.status, 200);
  assert.equal(unlock.body.proof_status, 'EXECUTION_PROVEN');
  assert.ok(unlock.body.h1);
});

test('mismatched actual profile is rejected and cannot resolve to H1', async () => {
  const h0 = await createSession();
  await acknowledge(h0);
  const verification = await verifyDevice(h0, 'REJECT', {
    actual_profile_hash: profileHash({ ...target, device_specs: { ...target.device_specs, ram_gb: 32 } })
  });
  assert.equal(verification.status, 409);
  const rejected = await request('/v1/unlock', unlockBody(h0));
  assert.equal(rejected.status, 409);
  const resolved = await request('/v1/resolve', { h0 });
  assert.equal(resolved.status, 400);
  assert.equal(resolved.body.missing.user_unlock, true);
});

test('each target profile field mismatch is rejected', async () => {
  const mismatches = [
    { device_type: 'laptop', device_specs: target.device_specs },
    { device_type: target.device_type, device_specs: { ...target.device_specs, cpu: 'Intel Core i5' } },
    { device_type: target.device_type, device_specs: { ...target.device_specs, ram_gb: 32 } },
    { device_type: target.device_type, device_specs: { ...target.device_specs, gpu: 'RTX 3070' } }
  ];
  for (const actualProfile of mismatches) {
    const h0 = await createSession();
    const verification = await verifyDevice(h0, 'REJECT', { actual_profile_hash: profileHash(actualProfile) });
    assert.equal(verification.status, 409);
    const rejected = await request('/v1/unlock', unlockBody(h0));
    assert.equal(rejected.status, 409);
    const resolved = await request('/v1/resolve', { h0 });
    assert.equal(resolved.status, 400);
    assert.equal(resolved.body.missing.user_unlock, true);
  }
});

test('missing fingerprint and incomplete verification are rejected', async () => {
  const h0 = await createSession();
  const missing = await request('/v1/device-verification', { h0, target_profile_hash: targetHash, actual_profile_hash: targetHash, verification_ref: 'ref', decision: 'ACCEPT' });
  assert.equal(missing.status, 400);
  const incomplete = await request('/v1/unlock', unlockBody(h0));
  assert.equal(incomplete.status, 409);
  assert.equal(incomplete.body.code, 'DEVICE_NOT_VERIFIED');
});

test('resolve cannot forge user_unlock through the generic signal endpoint', async () => {
  const h0 = await createSession();
  await acknowledge(h0);
  await verifyDevice(h0);
  const forged = await request('/v1/signal', { h0, signal_type: 'user_unlock', signal_ref: 'forged' });
  assert.equal(forged.status, 400);
  const resolved = await request('/v1/resolve', { h0 });
  assert.equal(resolved.status, 400);
  assert.equal(resolved.body.missing.user_unlock, true);
});

test('duplicate valid unlock remains rejected', async () => {
  const h0 = await createSession();
  await verifyDevice(h0);
  const first = await request('/v1/unlock', unlockBody(h0));
  assert.equal(first.status, 200);
  const second = await request('/v1/unlock', unlockBody(h0));
  assert.equal(second.status, 409);
});

test('cancelled session remains closed for unlock and resolve', async () => {
  const receiptId = `cancel-receipt-${Date.now()}`;
  const session = await request('/v1/session', {
    service_id: `cancel-${Date.now()}`,
    device_id: 'requester-target-label',
    ...target,
    receipt_id: receiptId
  });
  assert.equal(session.status, 200);
  const cancelledH0 = session.body.h0;
  const closed = await request('/v1/webhook/cancel', { h0: cancelledH0, receipt_id: receiptId });
  assert.equal(closed.status, 200);
  const unlock = await request('/v1/unlock', unlockBody(cancelledH0));
  assert.equal(unlock.status, 409);
  const resolved = await request('/v1/resolve', { h0: cancelledH0 });
  assert.equal(resolved.status, 409);
});
