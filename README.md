كلامك صحيح 100%. أنا مخطئ. حذف التوثيق خطأ استراتيجي فادح. الناس لن يفهموا المشروع بدون شرح. يجب أن نجمع الاثنين معًا.

### 🎯 الحل الصحيح
1. **الشارات في الأعلى** (أول ما يراه الزائر، إثبات حي).
2. **التوثيق الكامل في الأسفل** (شرح كامل للمطورين).

هذا هو ملف `README.md` النهائي الذي يجمع الاثنين. انسخه بالكامل، واستبدل به محتوى الملف الحالي:

```markdown
# PayLock Core

![Health Check](https://api.checklyhq.com/v1/badges/checks/c7dc410d-96a2-4409-8524-7b7fa272182a?style=flat&theme=default)
![Full Cycle](https://api.checklyhq.com/v1/badges/checks/1de56a50-79c5-42a2-9ce6-3fa5b462aae9?style=flat&theme=default)

[Live System Status](https://qpm5p92k.checkly-status-page.com/)

**Deterministic Payment Execution Engine**

PayLock Core is a lightweight, stateless protocol that guarantees a payment is captured **only after** a digital service has been successfully executed. It acts as a trustless orchestration layer between payment providers and service providers, eliminating chargebacks and disputes by design.

---

## How It Works

1.  **Session (H0)** – A client initiates a session, creating a frozen intent. No funds are moved.
2.  **Signal** – An external signal (e.g., a provider's acknowledgment) is appended to the session. No state change occurs yet.
3.  **Resolve (H1)** – Once the required signal (`provider_ack`) is present, the engine deterministically issues a proof of execution (`H1`). This proof can be used to trigger fund capture.

The engine **does not handle money, identity, or business logic**. It only records signals and deterministically resolves whether execution is proven.

---

## Base URL

```
https://paylock-core-production.up.railway.app
```

---

## Authentication

No authentication is required in this MVP version. Future releases will include API key verification.

---

## Endpoints

### 1. Health Check

`GET /v1/health`

Returns the status of the service and its connection to Redis.

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

---

### 2. Create Session (H0)

`POST /v1/session`

Creates a new deterministic session. The session starts in `INITIATED` state.

**Request Body**
```json
{
  "service_id": "premium-vpn",
  "device_id": "device-xyz",
  "constraints": { "amount": 9.99 }
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `service_id` | string | **Yes** | Identifier of the service being purchased. |
| `device_id` | string | **Yes** | Unique identifier of the customer's device. |
| `constraints` | object | No | Any constraints (e.g., amount, duration). |

**Response `200 OK`**
```json
{
  "h0": "f7c191ddc49ddbff11e282f1db457eb219a832d60f154d2e35513a09c8a51469",
  "status": "INITIATED"
}
```

| Field | Description |
| :--- | :--- |
| `h0` | Unique session identifier (SHA-256 HMAC). |
| `status` | Initial state of the session. |

---

### 3. Append Signal

`POST /v1/signal`

Appends an immutable signal to an existing session. **This does not change the session state.** Signals are used as inputs for the deterministic `resolve` step.

**Request Body**
```json
{
  "h0": "f7c191dd...",
  "signal_type": "provider_ack",
  "signal_ref": "ack-001"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `h0` | string | **Yes** | Session identifier. |
| `signal_type` | string | **Yes** | Type of signal. Must be `provider_ack` for execution proof. |
| `signal_ref` | string | **Yes** | A reference for this signal (e.g., transaction ID). |

**Response `200 OK`**
```json
{
  "h0": "f7c191dd...",
  "signal_recorded": true
}
```

**Error Responses**
- `400 Bad Request` – Missing required fields.
- `404 Not Found` – Session does not exist.

---

### 4. Resolve & Issue Proof (H1)

`POST /v1/resolve`

Deterministically resolves whether the session can be proven as executed. If a signal of type `provider_ack` exists, the engine generates the final execution proof (`H1`) and transitions the session to `EXECUTION_PROVEN`.

**This endpoint is idempotent.** Calling it multiple times with the same `h0` will always return the same `H1`.

**Request Body**
```json
{
  "h0": "f7c191dd..."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `h0` | string | **Yes** | Session identifier. |

**Response `200 OK`**
```json
{
  "h1": "78950cbaa46394d6df55efbd3123ab955e56def6a346a66029cbe5c6a3cb0647",
  "status": "EXECUTION_PROVEN"
}
```

**Error Responses**
- `400 Bad Request` – `h0` missing, or no `provider_ack` signal found.
- `404 Not Found` – Session does not exist.

---

## Complete Example (cURL)

A full lifecycle from session creation to execution proof.

```bash
# 1. Create session
H0=$(curl -s -X POST https://paylock-core-production.up.railway.app/v1/session \
  -H "Content-Type: application/json" \
  -d '{"service_id":"test","device_id":"device123"}' | jq -r '.h0')

echo "H0: $H0"

# 2. Append provider acknowledgment signal
curl -X POST https://paylock-core-production.up.railway.app/v1/signal \
  -H "Content-Type: application/json" \
  -d "{\"h0\":\"$H0\",\"signal_type\":\"provider_ack\",\"signal_ref\":\"ack123\"}"

# 3. Resolve and get H1
curl -X POST https://paylock-core-production.up.railway.app/v1/resolve \
  -H "Content-Type: application/json" \
  -d "{\"h0\":\"$H0\"}"
```

---

## State Machine

```
INITIATED ──(signal: provider_ack)──> EXECUTION_PROVEN (H1 issued)
```

- **INITIATED**: Session created, waiting for signals.
- **EXECUTION_PROVEN**: Required signal received, deterministic proof (`H1`) generated.

No other states. No payment state.

---

## Idempotency & Replay Protection

- `POST /v1/resolve` is fully idempotent. Once an `H1` is generated, subsequent calls return the same `H1`.
- For stronger replay protection, include an `idempotency-key` header in requests. The engine caches responses for 5 minutes.
