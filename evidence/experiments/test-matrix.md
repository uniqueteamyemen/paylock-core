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

## Mandatory failure evidence

For every rejection, invalid signature, duplicate, out-of-order event, provider cancellation, or receiver failure, retain the redacted input classification, the state before/after, the rejection reason, and the manifest hash. Failed evidence must never be removed merely because a later attempt succeeds.

## Boundaries

This matrix validates only a specifically named integration path once built and approved. It does not show that Dictionary/Adapter is a universal production translation engine, that Envia attests every commercial outcome, that PayLock processes payment, or that Yaqeen has become a required PayLock dependency.

## References

1. [Envia webhooks documentation](https://docs.envia.com/docs/webhooks)
2. [PayLock readiness assessment, private review record](../../../../paylock-audit-notes/paylock-yaqeen-readiness-assessment-2026-08-18.md)
