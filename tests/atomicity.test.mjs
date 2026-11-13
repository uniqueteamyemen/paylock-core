/**
 * Regression test for the atomicity fix: one session, one completion.
 *
 * Before the fix: 40 concurrent unlocks returned 40 x 200, and a provider_ack arriving at the
 * same moment as a user_unlock was overwritten (0/20 sessions could then resolve).
 *
 * The test needs a network store, because in the in-memory fallback the awaits resolve as
 * microtasks and the race cannot happen. Locally: REDIS_URL=redis://127.0.0.1:6399 node ...
 * In CI: a redis service is started and REDIS_URL is set.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 4123);
const KEY = process.env.API_KEY || 'atomicity-key';
const SECRET = process.env.PLATFORM_SECRET || 'atomicity-secret';
const REDIS_URL = process.env.REDIS_URL;
const BASE = `http://127.0.0.1:${PORT}`;
const RACE = 40;
const SESSIONS = 10;

let failures = 0;
const check = (name, condition, detail = '') => {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}${condition ? '' : ' ' + detail}`);
  if (!condition) failures += 1;
};

const post = async (path, body) => {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY },
    body: JSON.stringify(body),
  });
  let json = {};
  try { json = await res.json(); } catch { /* empty body */ }
  return { code: res.status, body: json };
};

const waitForHealth = async (tries = 100) => {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(BASE + '/v1/health');
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  return false;
};

const main = async () => {
  if (!REDIS_URL) {
    console.error('REDIS_URL is required: this test must run against a network store.');
    process.exit(2);
  }
  const app = spawn('node', ['platform.js'], {
    env: { ...process.env, PLATFORM_SECRET: SECRET, API_KEY: KEY, PORT: String(PORT), REDIS_URL },
    stdio: 'inherit',
  });
  try {
    if (!(await waitForHealth())) {
      console.error('service did not start');
      process.exit(2);
    }

    // 1. a burst of unlocks produces exactly one completion
    const created = await post('/v1/session', { service_id: 'svc-race', device_id: 'dev-race', receipt_id: `R-${Date.now()}` });
    const h0 = created.body.h0;
    await post('/v1/signal', { h0, signal_type: 'provider_ack', signal_ref: 'ack-race' });
    const results = await Promise.all(Array.from({ length: RACE }, () => post('/v1/unlock', { h0 })));
    const ok = results.filter((r) => r.code === 200);
    const conflicts = results.filter((r) => r.code === 409);
    const h1s = new Set(ok.map((r) => r.body.h1).filter(Boolean));
    check(`${RACE} concurrent unlocks -> exactly one 200`, ok.length === 1, `got ${ok.length}`);
    check(`${RACE} concurrent unlocks -> the rest are 409`, conflicts.length === RACE - 1, `got ${conflicts.length}`);
    check('exactly one H1 value issued', h1s.size === 1, `got ${h1s.size}`);

    // 2. two different signals arriving together must both survive
    let resolved = 0;
    for (let i = 0; i < SESSIONS; i += 1) {
      const s = await post('/v1/session', { service_id: 'svc-two', device_id: `dev-${i}` });
      const id = s.body.h0;
      await Promise.all([
        post('/v1/signal', { h0: id, signal_type: 'provider_ack', signal_ref: `ack-${i}` }),
        post('/v1/unlock', { h0: id }),
      ]);
      const r = await post('/v1/resolve', { h0: id });
      if (r.code === 200) resolved += 1;
    }
    check(`${SESSIONS} sessions with concurrent ack+unlock resolve`, resolved === SESSIONS, `got ${resolved}/${SESSIONS}`);
  } finally {
    app.kill('SIGTERM');
  }

  console.log(failures === 0 ? '\nATOMICITY OK' : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
