import { ApiCheck } from 'checkly/constructs'

new ApiCheck('paylock-lifecycle', {
  name: 'PayLock Deterministic Lifecycle',
  activated: true,
  frequency: 10,

  request: {
    method: 'GET',
    url: 'https://paylock-core-production.up.railway.app/v1/health',
  },

  runScript: async () => {
    const base = process.env.BASE_URL || 'https://paylock-core-production.up.railway.app'
    const apiKey = process.env.API_KEY || 'test-key'

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    }

    function assert(condition: boolean, message: string) {
      if (!condition) throw new Error(message)
    }

    const rid = `ord-${Date.now()}-${Math.floor(Math.random() * 100000)}`

    // 1) session
    const sessionRes = await fetch(`${base}/v1/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        service_id: 'checkly-demo',
        device_id: 'checkly-device-1',
        receipt_id: rid,
      }),
    })

    assert(sessionRes.ok, `session failed: ${sessionRes.status}`)

    const sessionData = await sessionRes.json()
    assert(sessionData.h0, 'session missing h0')

    const h0 = sessionData.h0

    // 2) signal
    const ackRes = await fetch(`${base}/v1/signal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        h0,
        signal_type: 'provider_ack',
        signal_ref: `ack-${Date.now()}`,
      }),
    })

    assert(ackRes.ok, `signal failed: ${ackRes.status}`)

    // 3) unlock
    const unlockRes = await fetch(`${base}/v1/unlock`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        h0,
        device_fingerprint: 'checkly-fp-1',
      }),
    })

    assert(unlockRes.ok, `unlock failed: ${unlockRes.status}`)

    const unlockData = await unlockRes.json()

    // 4) resolve
    const resolveRes = await fetch(`${base}/v1/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ h0 }),
    })

    assert(resolveRes.ok, `resolve failed: ${resolveRes.status}`)

    const resolveData = await resolveRes.json()

    assert(resolveData.h1, 'resolve missing h1')

    // 5) deterministic replay
    const resolve2Res = await fetch(`${base}/v1/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ h0 }),
    })

    assert(resolve2Res.ok, `resolve retry failed: ${resolve2Res.status}`)

    const resolve2Data = await resolve2Res.json()

    assert(
      resolve2Data.h1 === resolveData.h1,
      'resolve not idempotent'
    )

    console.log(
      JSON.stringify({
        ok: true,
        h0,
        h1: resolveData.h1,
        unlock_status: unlockData.status || null,
      })
    )
  },
})
