import { ApiCheck } from 'checkly/constructs'

new ApiCheck('paylock-cancel-before-unlock', {
  name: 'PayLock Cancel Before Unlock',
  activated: true,
  frequency: 10,

  request: {
    method: 'GET',
    url: 'https://paylock-core-production.up.railway.app/v1/health',
  },

  runScript: async () => {
    const base =
      process.env.BASE_URL ||
      'https://paylock-core-production.up.railway.app'

    const apiKey = process.env.API_KEY || 'test-key'

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    }

    function assert(condition: boolean, message: string) {
      if (!condition) throw new Error(message)
    }

    const rid = `ord-cancel-${Date.now()}-${Math.floor(Math.random() * 100000)}`

    // 1) create session
    const sessionRes = await fetch(`${base}/v1/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        service_id: 'checkly-cancel-flow',
        device_id: 'checkly-device-cancel',
        receipt_id: rid,
      }),
    })

    assert(sessionRes.ok, `session failed: ${sessionRes.status}`)

    const sessionData = await sessionRes.json()

    assert(sessionData.h0, 'session missing h0')

    const h0 = sessionData.h0

    // 2) provider ack
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

    // 3) cancel webhook
    const cancelRes = await fetch(`${base}/v1/webhook/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        h0,
        receipt_id: rid,
        reason: 'checkly_cancel_before_unlock',
      }),
    })

    assert(cancelRes.ok, `cancel webhook failed: ${cancelRes.status}`)

    // 4) unlock must fail
    const unlockRes = await fetch(`${base}/v1/unlock`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        h0,
        device_fingerprint: 'checkly-fp-cancel',
      }),
    })

    assert(
      unlockRes.status === 409,
      `unlock should fail with 409, got ${unlockRes.status}`
    )

    // 5) resolve must fail
    const resolveRes = await fetch(`${base}/v1/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ h0 }),
    })

    assert(
      resolveRes.status === 409,
      `resolve should fail with 409, got ${resolveRes.status}`
    )

    console.log(
      JSON.stringify({
        ok: true,
        h0,
        unlock_status: unlockRes.status,
        resolve_status: resolveRes.status,
      })
    )
  },
})