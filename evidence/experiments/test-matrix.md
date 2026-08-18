# Envia × PayLock / Yaqeen Sandbox Test Matrix

## Preconditions

The cases below may run only when all of the following are confirmed: the provider account is explicitly in **Sandbox or non-production mode**; a test-only API credential is supplied by the owner through the approved secret path; a test-only webhook signing secret is available; a disposable receiver URL has been approved; and the test namespace cannot affect a real shipment, label, payment, customer, or merchant record.

| Precondition | Status on 2026-08-18 | Evidence required before execution |
|---|---:|---|
| Owner can reach Envia dashboard | Observed | `raw/2026-08-18/envia-dashboard-access.json` |
| Provider-designated Sandbox context | Not established | Account or provider confirmation that is retained without secrets |
| Test-only API credential | Not available to test harness | Secure secret provision and a read-only credential-scope record |
| Webhook signing secret | Not available to test harness | Secure secret provision and verification configuration record |
| Disposable, approved webhook receiver | Not configured | Endpoint ownership and retention policy |
| PayLock adapter mapping for provider events | Not implemented/proven | Named mapping definition and review |

## Recommended free provider path: Paddle Sandbox

The recommended replacement for the blocked/uncertain provider path is **Paddle Sandbox**. It is selected only as a test-event source because the official documentation describes a separate Sandbox account, data set, credentials, API base, signed webhook header, retry behavior, delivery logs, replay, and a webhook simulator. This is not a payment-processing claim for PayLock and does not authorize a live Paddle account or a customer-facing checkout. [3] [4] [5]

| Additional precondition | Required evidence before execution |
|---|---|
| Explicit Paddle Sandbox account and `*_sdbx` key | Redacted account-environment observation and scoped test credential through the approved secret path |
| Test notification destination | Disposable receiver URL with a documented retention/deletion policy |
| Paddle notification-destination secret | Secure secret provision; raw-body signature verification record |
| Named Paddle-to-Dictionary mapping | Reviewed mapping for the exact event types under test; no generic Adapter claim |
| Allowed test set | A declared list of simulator/test events; no live checkout, customer, payment, or production data |

## Test cases

Every executed row must include a redacted request/response trace, a UTC time, an SHA-256 entry in the manifest, and an explicit result. A missing trace means `NOT_EXECUTED`, not pass.

| ID | Scenario | Expected PayLock/Yaqeen boundary | Initial status |
|---|---|---|---|
| ENV-PL-001 | Create one disposable provider-side Sandbox lifecycle item | No PayLock resolution before the defined acknowledgement signal and user unlock. | NOT_EXECUTED — Sandbox/API gate open |
| ENV-PL-002 | Deliver an authentic signed provider webhook | Receiver verifies origin before mapping a canonical signal. | NOT_EXECUTED — signing-secret and adapter gates open |
| ENV-PL-003 | Send an invalid-signature webhook | Reject; preserve last valid state; generate no resolution proof. | NOT_EXECUTED — signing-secret and receiver gates open |
| ENV-PL-004 | Replay the same valid webhook | Idempotent handling; no duplicate canonical transition or proof. | NOT_EXECUTED — receiver and adapter gates open |
| ENV-PL-005 | Deliver events out of order | Retain defined lifecycle boundary; do not infer a valid final state. | NOT_EXECUTED — receiver and adapter gates open |
| ENV-PL-006 | Deliver cancellation/failure state before user unlock | Resolution must remain blocked; retain rejection trace. | NOT_EXECUTED — receiver and adapter gates open |
| ENV-PL-007 | Complete permitted acknowledgement plus user unlock | Produce one inspectable proof only if the named contract conditions are satisfied. | NOT_EXECUTED — adapter and Core test credential gates open |
| ENV-PL-008 | Retry after transient receiver failure | Record retry behavior; no uncontrolled duplicate transition. | NOT_EXECUTED — receiver and provider retry configuration gates open |
| ENV-PL-009 | Compare provider event to retained PayLock evidence | Store a redacted correlation reference without retaining provider-private payloads. | NOT_EXECUTED — all integration gates open |

## Paddle Sandbox cases

| ID | Scenario | Expected PayLock/Yaqeen boundary | Initial status |
|---|---|---|---|
| PDL-PL-001 | Generate one declared Paddle Sandbox lifecycle event through the provider simulator | No canonical signal is accepted until the event passes raw-body signature verification and the reviewed mapping. | NOT_EXECUTED — Sandbox, receiver, signature, and mapping gates open |
| PDL-PL-002 | Deliver an authentic `Paddle-Signature` event | Verify origin and freshness before mapping a named event to a canonical signal. | NOT_EXECUTED — receiver, secret, and mapping gates open |
| PDL-PL-003 | Submit altered payload or invalid signature | Reject without changing the last valid state or creating a proof. | NOT_EXECUTED — receiver and signature gates open |
| PDL-PL-004 | Replay a retained valid event | Deduplicate by documented provider event identity; no duplicate canonical transition or proof. | NOT_EXECUTED — receiver and mapping gates open |
| PDL-PL-005 | Deliver provider events out of generation order | Do not infer a final valid state from arrival order; preserve correlation and rejection/deferral evidence. | NOT_EXECUTED — receiver and mapping gates open |
| PDL-PL-006 | Force a non-2xx receiver response and observe provider retry | Preserve every delivery attempt; no uncontrolled repeated transition after retry. | NOT_EXECUTED — receiver and provider-retry gates open |
| PDL-PL-007 | Use simulator replay after a recorded rejection | Retain the original failed evidence and record whether replay remains blocked or succeeds only after corrected conditions. | NOT_EXECUTED — simulator, receiver, and mapping gates open |
| PDL-PL-008 | Pair a valid mapped acknowledgement with a valid user unlock | Allow exactly one Core resolution proof only if the named contract conditions are satisfied. | NOT_EXECUTED — adapter/Core test credential gates open |

## GitHub signed-release readiness cases

GitHub is used here only as an external source of an **artifact-ready** declaration. A release event can establish that a named digital artifact was published by the configured repository; it does not establish a payment, customer entitlement, or a complete production Provider ACK to PayLock Core. The local receiver validates raw payload HMAC, delivery identity, and a narrow `release.published` event filter, but has no Core invocation.

| ID | Scenario | Expected PayLock boundary | Initial status |
|---|---|---|---|
| GHB-PL-001 | Receive a valid, signed `release.published` delivery for the named test repository | Classify as a provider-declared artifact-ready signal only; record a redacted correlation reference; do not create H1 or invoke Core. | NOT_EXECUTED — external webhook creation blocked by browser-connection failure |
| GHB-PL-002 | Submit a release payload with a mismatched HMAC | Reject before signal classification; preserve no readiness state and create no proof. | LOCAL_VERIFIED — receiver unit and HTTP-route test |
| GHB-PL-003 | Replay an accepted delivery identifier | Acknowledge idempotently with no duplicate readiness transition or proof. | LOCAL_VERIFIED — receiver unit and HTTP-route test |
| GHB-PL-004 | Submit an unsupported GitHub event or non-published release action | Reject as outside the reviewed readiness mapping. | LOCAL_VERIFIED — receiver unit test |
| GHB-PL-005 | Connect a valid provider-ready signal to an explicitly reviewed H0/H1 contract harness | Permit a later, separately approved adapter/Core test only; the website receiver itself must never substitute for Core. | NOT_EXECUTED — protected-source and reviewed-mapping gate |

## Shopify development-store fulfilment cases

Shopify is reserved for a later merchant-platform scenario. The permitted source event must be an explicitly named **fulfilment or digital-product-ready** event from a development store using test data, not order-payment data. The exact topic and Adapter mapping remain open until reviewed against the chosen application architecture.

| ID | Scenario | Expected PayLock boundary | Initial status |
|---|---|---|---|
| SHP-PL-001 | Create a development-store-only fulfilment scenario using test data | No PayLock action until a reviewed, signed provider-ready topic arrives. | NOT_EXECUTED — development-store and app-scope gate |
| SHP-PL-002 | Deliver one valid raw-body HMAC-verified fulfilment-ready webhook | Translate only the named fulfilment-ready condition; preserve a redacted delivery reference. | NOT_EXECUTED — store, webhook subscription, and reviewed Adapter mapping gates |
| SHP-PL-003 | Deliver invalid HMAC, duplicate delivery, and out-of-order events | Reject or defer without creating a proof or changing the last valid readiness state. | NOT_EXECUTED — receiver and provider setup gates |
| SHP-PL-004 | Pair the reviewed provider-ready signal with the contract's required client unlock and any owner-approved additional gates | Allow one evidence-bound resolution only through an approved separate harness; no payment data is read or retained. | NOT_EXECUTED — reviewed contract, Adapter, and Core test-harness gates |

## Gemini digital-service completion cases

Gemini is reserved for a digital-service completion scenario. It may produce evidence that a requested asynchronous digital output reached a defined provider-complete state. It does not prove payment, entitlement, or universal provider compatibility. Execution requires a real, Google-issued test API key; no locally generated secret can substitute for provider authentication.

| ID | Scenario | Expected PayLock boundary | Initial status |
|---|---|---|---|
| GEM-PL-001 | Submit a permitted non-production asynchronous Gemini request with a synthetic prompt | Retain only a redacted request correlation and await an independently verifiable completion signal. | NOT_EXECUTED — real Google-issued test API key required |
| GEM-PL-002 | Receive or independently verify a signed/authoritative provider-complete event | Classify only the named digital-service-ready condition after authenticity review. | NOT_EXECUTED — official callback or verified completion mechanism and API key required |
| GEM-PL-003 | Submit a stale, altered, duplicate, or unsupported completion signal | Reject or deduplicate before any readiness transition or proof. | NOT_EXECUTED — provider completion mechanism and test receiver required |
| GEM-PL-004 | Pair the reviewed completion signal with user unlock and any owner-approved contract gates | Permit a later evidence-bound resolution only through a reviewed Adapter/Core harness; never read payment or entitlement state. | NOT_EXECUTED — reviewed mapping, protected-source test harness, and API key required |

## Mandatory failure evidence

For every rejection, invalid signature, duplicate, out-of-order event, provider cancellation, or receiver failure, retain the redacted input classification, the state before/after, the rejection reason, and the manifest hash. Failed evidence must never be removed merely because a later attempt succeeds.

## Boundaries

This matrix validates only a specifically named integration path once built and approved. It does not show that Dictionary/Adapter is a universal production translation engine, that any provider attests every commercial outcome, that PayLock processes, inspects, verifies, or controls payment or entitlement state, or that Yaqeen has become a required PayLock dependency.

## References

1. [Envia webhooks documentation](https://docs.envia.com/docs/webhooks)
2. [PayLock readiness assessment, private review record](../../../../paylock-audit-notes/paylock-yaqeen-readiness-assessment-2026-08-18.md)
3. [Paddle Sandbox documentation](https://developer.paddle.com/sdks/sandbox)
4. [Paddle webhook signature verification](https://developer.paddle.com/webhooks/about/signature-verification)
5. [Paddle webhook response, retries, replay, and simulator guidance](https://developer.paddle.com/webhooks/about/respond-to-webhooks)
6. [GitHub webhook signature validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
7. [Shopify webhook delivery verification](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)
8. [Shopify development stores](https://help.shopify.com/en/partners/dashboard/managing-stores/development-stores)
9. [Gemini API webhooks](https://ai.google.dev/gemini-api/docs/webhooks)
