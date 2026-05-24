# PayLock Core – Deterministic Execution & Matching Engine

![Health Check](https://api.checklyhq.com/v1/badges/checks/c7dc410d-96a2-4409-8524-7b7fa272182a?style=flat&theme=default)
![Full Cycle](https://api.checklyhq.com/v1/badges/checks/1de56a50-79c5-42a2-9ce6-3fa5b462aae9?style=flat&theme=default)

[Live System Status](https://qpm5p92k.checkly-status-page.com/)

**"You only pay when execution is provably complete."**

PayLock Core is a lightweight deterministic protocol runtime that records operational signals and issues execution proof only after lifecycle completeness is established.

> No payment processing.  
> No custody of funds.  
> Only deterministic execution verification.

**Canonical boundaries (Source of Truth):** see `CANONICAL_BOUNDARIES.md`.

---

## Quick Start (Docker)

Run the engine locally with the required runtime secrets.

### Quick Demo (No Redis Required)

Run PayLock Core in ephemeral in-memory demo mode.

```bash
docker pull uniqueteamyemen/paylock-core:latest
docker run -d -p 3000:3000 \
  -e PLATFORM_SECRET=test-secret \
  -e API_KEY=test-key \
  uniqueteamyemen/paylock-core:latest
```

Health check:

```bash
curl http://localhost:3000/v1/health
```

Expected response:

```json
{"status":"ok","redis":false,"service":"paylock-core"}
```

Container logs:

```bash
docker logs <container_id>
```

Example log output:

```text
⚠️ Redis not found. Running in ephemeral in-memory demo mode.
PayLock Core [Ephemeral Evaluation Mode (RAM-only)] running on port 3000
```

### Full Stack Mode (Redis Enabled)

Run PayLock Core with a persistent Redis backend.

```bash
docker network create paylock-net
docker run -d --name redis-paylock --network paylock-net redis
docker run -d -p 3000:3000 \
  --network paylock-net \
  -e REDIS_URL=redis://redis-paylock:6379 \
  -e PLATFORM_SECRET=test-secret \
  -e API_KEY=test-key \
  uniqueteamyemen/paylock-core:latest
```

Health check:

```bash
curl http://localhost:3000/v1/health
```

Expected response:

```json
{"status":"ok","redis":true,"service":"paylock-core"}
```

**Notes**
- Demo mode uses temporary in-memory storage and is intended for evaluation and local testing only.
- Full Stack mode uses Redis persistence and reflects the recommended production-style runtime architecture.
- Railway deployments automatically connect to Redis through the configured `REDIS_URL`.
- `PLATFORM_SECRET` and `API_KEY` are required in all modes.

---

## How It Works

1. **Session (H0)**: A client initiates a session, creating a frozen execution intent.
2. **Signal**: A provider-side operational signal such as `provider_ack` is attached to the session.
3. **Unlock (User)**: The user explicitly breaks the lock with `user_unlock`.
4. **Resolve (H1)**: Once `provider_ack` and `user_unlock` both exist, the engine deterministically issues execution proof (`H1`).

If `user_unlock` arrives after `provider_ack`, PayLock may issue the proof opportunistically during `/v1/unlock`. If not, `/v1/resolve` completes the same convergence deterministically.

**Optional (Provider-Enabled):** If a provider chooses to send payment attestation or cancellation signals to PayLock via webhooks, PayLock can record the attestation and automatically cancel later unlock or resolve attempts for the affected session.

The engine does not handle money, identity, fulfillment policy, or business logic. It only records signals and resolves whether execution is proven.

---

## Real-World Flow

PayLock is designed for digital service delivery where a provider must verify that the requested service matches the user's device, region, and eligibility before execution is considered complete.

1. The user submits the requested service, selected provider, service URL, device details, and geographic region.
2. PayLock creates `H0`, a frozen execution intent for that request.
3. The request can be passed through an adapter or translator layer to send the provider only the operational data required for review.
4. The provider checks service availability, device compatibility, geographic or political restrictions, network constraints, fulfillment readiness, and payment validity.
5. If the provider approves, the provider immediately delivers the service behind the lock and PayLock records `provider_ack`.
6. When the user opens the locked link, PayLock records `user_unlock` with the user's device fingerprint.
7. When `provider_ack` and `user_unlock` both exist, PayLock issues `H1` as deterministic proof that execution was completed.

---

## Why This Matters

This flow reduces post-sale support because the service is approved and released against the exact data supplied by the user. It also limits multi-device abuse by binding unlock evidence to the user's device fingerprint, and it strengthens defense against friendly fraud and chargebacks because the provider approval and user unlock are both recorded before `H1` is issued.

PayLock also reduces race-condition risk at the two critical points of the lifecycle: session creation (`H0`) and final unlock/proof issuance (`H1`).

---

## Live Demo

Public deterministic execution demo:

https://yaqeen-platform-production.up.railway.app/demo.html

---

## Base URL

```text
https://paylock-core-production.up.railway.app
```

---

## Authentication

All endpoints except `GET /v1/health` require:

- request header `x-api-key`
- server-side `API_KEY`

**Note:** The default API key `test-key` is for demo purposes only. Change it immediately before any production use.

---

## Endpoints

### 1. Health Check

`GET /v1/health`

Returns service status and Redis availability.

**Response `200 OK`**

```json
{
  "status": "ok",
  "redis": true,
  "service": "paylock-core"
}
```

**Response `500 Internal Server Error`**

```json
{
  "status": "error",
  "redis": false
}
```

### 2. Create Session (H0)

`POST /v1/session`

Creates a new deterministic session in `INITIATED` state.

**Request Body**

```json
{
  "service_id": "premium-vpn",
  "device_id": "device-xyz",
  "constraints": { "amount": 9.99 },
  "receipt_id": "order-123"
}
```

**Required fields**
- `service_id`
- `device_id`

**Optional fields**
- `service_name`
- `provider_id`
- `provider_name`
- `device_type`
- `device_specs`
- `payment_method`
- `service_url`
- `constraints`
- `receipt_id`

**Response `200 OK`**

```json
{
  "h0": "f7c191ddc49ddbff11e282f1db457eb219a832d60f154d2e35513a09c8a51469",
  "status": "INITIATED"
}
```

**Response `409 Conflict`**

```json
{
  "error": "Duplicate receipt_id"
}
```

### 3. Append Signal

`POST /v1/signal`

Records an immutable signal on an existing session.

**Request Body**

```json
{
  "h0": "f7c191dd...",
  "signal_type": "provider_ack",
  "signal_ref": "ack-001"
}
```

**Required fields**
- `h0`
- `signal_type`
- `signal_ref`

**Response `200 OK`**

```json
{
  "h0": "f7c191dd...",
  "signal_recorded": true
}
```

Duplicate replays with the same `signal_type` and `signal_ref` are accepted and returned as:

```json
{
  "h0": "f7c191dd...",
  "signal_recorded": true,
  "duplicate_ignored": true
}
```

### 4. Unlock

`POST /v1/unlock`

Records `user_unlock`. If `provider_ack` already exists, PayLock may issue `H1` immediately.

**Request Body**

```json
{
  "h0": "f7c191dd...",
  "device_fingerprint": "fp-device-001"
}
```

**Required fields**
- `h0`

**Response `200 OK`**

```json
{
  "h0": "f7c191dd...",
  "status": "UNLOCKED"
}
```

**Response `200 OK` when proof is issued opportunistically**

```json
{
  "h0": "f7c191dd...",
  "status": "UNLOCKED",
  "h1": "78950cbaa46394d6df55efbd3123ab955e56def6a346a66029cbe5c6a3cb0647",
  "proof_status": "EXECUTION_PROVEN"
}
```

### 5. Resolve & Issue Proof (H1)

`POST /v1/resolve`

Deterministically resolves whether execution is proven. This endpoint is idempotent: once `H1` exists for `h0`, repeated calls return the same proof.

**Request Body**

```json
{
  "h0": "f7c191dd..."
}
```

**Response `200 OK`**

```json
{
  "h1": "78950cbaa46394d6df55efbd3123ab955e56def6a346a66029cbe5c6a3cb0647",
  "status": "EXECUTION_PROVEN"
}
```

**Response `400 Bad Request`**

```json
{
  "error": "Missing required signals",
  "missing": {
    "provider_ack": false,
    "user_unlock": true
  }
}
```

### 6. Optional Provider Webhooks

`POST /v1/webhook/payment`

Attaches provider-supplied attestation data to an existing session.

**Request Body**

```json
{
  "h0": "f7c191dd...",
  "receipt_id": "order-123"
}
```

`POST /v1/webhook/cancel`

Cancels a session and prevents later unlock or resolve success.

**Request Body**

```json
{
  "h0": "f7c191dd...",
  "receipt_id": "order-123",
  "reason": "payment reversed"
}
```

---

## Complete Example (cURL)

```bash
BASE=https://paylock-core-production.up.railway.app
KEY=test-key

# 1. Create session
H0=$(curl -s -X POST "$BASE/v1/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d '{"service_id":"test","device_id":"device123"}' | jq -r '.h0')

echo "H0: $H0"

# 2. Append provider acknowledgment signal
curl -X POST "$BASE/v1/signal" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d "{\"h0\":\"$H0\",\"signal_type\":\"provider_ack\",\"signal_ref\":\"ack123\"}"

# 3. Record user unlock
curl -X POST "$BASE/v1/unlock" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d "{\"h0\":\"$H0\",\"device_fingerprint\":\"fp-device123\"}"

# 4. Resolve and get H1
curl -X POST "$BASE/v1/resolve" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d "{\"h0\":\"$H0\"}"
```

---

## Runtime Model

- Session starts in `INITIATED`.
- `provider_ack` and `user_unlock` are recorded as signals.
- Proof completion returns `EXECUTION_PROVEN`.
- Provider-enabled cancellation can move a session to `CANCELLED`.

Response statuses may include `UNLOCKED` during the unlock step, while final proof convergence is represented by `EXECUTION_PROVEN`.

---

## Idempotency & Replay Protection

- `POST /v1/resolve` is proof-idempotent. Once `H1` exists, repeated calls return the same `H1`.
- Request replay caching is available through the `idempotency-key` header.
- The replay cache key is derived from `idempotency-key + request path + request body hash`.
- Cached responses preserve both response body and HTTP status code.

---

## Links

- GitHub: https://github.com/uniqueteamyemen/paylock-core
- Live Demo (Yaqeen Platform): https://yaqeen-platform-production.up.railway.app/demo.html
- Railway API: https://paylock-core-production.up.railway.app
- Checkly Status Page: https://qpm5p92k.checkly-status-page.com/
- LinkedIn Announcement: https://www.linkedin.com/posts/abobker-awadh-4a69bb72_fintech-trustinfrastructure-deterministicsystems-share-7456464135115948033-QIml

## License

MIT License © 2026 Dr. Abobker Ahmed Awadh
