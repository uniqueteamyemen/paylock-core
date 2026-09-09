import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

const BASE_URL = process.env.PAYLOCK_BASE_URL || "https://paylock-core-production.up.railway.app"
const API_KEY = process.env.PAYLOCK_API_KEY || "test-key"
const OUT_FILE = process.env.PAYLOCK_AUDIT_FILE || "paylock-enforcement-audit.json"

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex")
}

const targetDevice = {
  device_type: "desktop",
  device_specs: { cpu: "audit-cpu", gpu: "audit-gpu", ram_gb: 16 },
}
const targetProfileHash = sha256(JSON.stringify({
  device_specs: { cpu: "audit-cpu", gpu: "audit-gpu", ram_gb: 16 },
  device_type: "desktop",
}))

async function postJson(route, body) {
  const res = await fetch(`${BASE_URL}${route}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }

  return {
    status: res.status,
    bodyText: text,
    bodyJson: json,
    payloadHash: sha256(JSON.stringify(body)),
  }
}

async function run() {
  const receiptId = `audit-${Date.now()}`

  const sessionReq = {
    service_id: "medusa_fulfillment",
    device_id: "audit-device-1",
    ...targetDevice,
    receipt_id: receiptId,
  }
  const session = await postJson("/v1/session", sessionReq)
  if (!session.bodyJson?.h0) {
    throw new Error(`session failed: ${session.status} ${session.bodyText}`)
  }

  const h0 = session.bodyJson.h0

  const deniedResolveReq = { h0 }
  const deniedResolve = await postJson("/v1/resolve", deniedResolveReq)

  const ackReq = {
    h0,
    signal_type: "provider_ack",
    signal_ref: `audit-ack-${Date.now()}`,
  }
  const ack = await postJson("/v1/signal", ackReq)

  const verificationReq = {
    h0,
    device_fingerprint: "audit-fp-1",
    target_profile_hash: targetProfileHash,
    actual_profile_hash: targetProfileHash,
    verification_ref: `audit-verification-${Date.now()}`,
    decision: "ACCEPT",
  }
  const verification = await postJson("/v1/device-verification", verificationReq)

  const unlockReq = { h0 }
  const unlock = await postJson("/v1/unlock", unlockReq)

  const allowedResolveReq = { h0 }
  const allowedResolve = await postJson("/v1/resolve", allowedResolveReq)

  const log = {
    generated_at: new Date().toISOString(),
    target: BASE_URL,
    chain: "Operational contradiction reproduced -> deterministic gate satisfied",
    session: {
      receipt_id: receiptId,
      h0,
      request_hash: session.payloadHash,
      status: session.status,
      response: session.bodyJson || session.bodyText,
      result_hash: sha256(session.bodyText),
    },
    denied_before_ack_unlock: {
      expected: "DENIED",
      request_hash: deniedResolve.payloadHash,
      status: deniedResolve.status,
      response: deniedResolve.bodyJson || deniedResolve.bodyText,
      result_hash: sha256(deniedResolve.bodyText),
    },
    provider_ack: {
      request_hash: ack.payloadHash,
      status: ack.status,
      response: ack.bodyJson || ack.bodyText,
      result_hash: sha256(ack.bodyText),
    },
    user_unlock: {
      request_hash: unlock.payloadHash,
      status: unlock.status,
      response: unlock.bodyJson || unlock.bodyText,
      result_hash: sha256(unlock.bodyText),
    },
    device_verification: {
      request_hash: verification.payloadHash,
      status: verification.status,
      response: verification.bodyJson || verification.bodyText,
      result_hash: sha256(verification.bodyText),
    },
    allowed_after_ack_unlock: {
      expected: "EXECUTION_PROVEN",
      request_hash: allowedResolve.payloadHash,
      status: allowedResolve.status,
      response: allowedResolve.bodyJson || allowedResolve.bodyText,
      result_hash: sha256(allowedResolve.bodyText),
    },
  }

  const outPath = path.resolve(process.cwd(), OUT_FILE)
  await fs.writeFile(outPath, `${JSON.stringify(log, null, 2)}\n`, "utf8")
  console.log(`Audit evidence written: ${outPath}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

