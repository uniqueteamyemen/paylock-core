# PayLock Sandbox Evidence

## Purpose and branch boundary

This directory retains reproducible, redacted records for controlled non-production provider-integration work. It is intentionally isolated from PayLock Core source files. The records distinguish **observed results**, **blocked prerequisites**, and **planned test definitions**; a planned case is never presented as an executed case.

The evidence branch does not authorize a production change, public claim, provider activation, payment flow, customer onboarding, or source-code change. It also contains no API token, webhook secret, customer data, cookie, or session identifier.

## Evidence layout

| Path | Purpose |
|---|---|
| `raw/2026-08-18/` | Redacted, point-in-time observations from the permitted access checks. |
| `reports/` | Readable assessment of what the records do and do not establish. |
| `test-matrix.md` | Explicit lifecycle, negative, retry, and authenticity cases for a future authorized Sandbox run. |
| `manifests/` | Reproducibility metadata and SHA-256 inventory. |
| `reports/2026-08-18-github-webhook-ping-verification.md` | Redacted signed GitHub `ping` connectivity record and scope boundary. |

## Added external-event routes

The matrix now contains three additional, evidence-bounded routes. GitHub may provide a no-cost signed **artifact-ready** signal. Shopify may later provide a development-store-only fulfilment-ready signal. Gemini may later provide an authoritative asynchronous digital-service-completion signal, but only with a genuine Google-issued test credential. These routes remain distinct: no result is treated as a payment, entitlement, or broad production claim.

## Current conclusion

The owner-side Envia dashboard was reached after interactive login. That alone does **not** prove the active account context is Sandbox, that an API credential is available, that a webhook endpoint exists, or that provider-originated events reach PayLock. No shipment, label, webhook configuration, or API request was created during this evidence-capture session.

The next executable gate is an explicit, non-production Envia API credential plus a webhook signing secret, with the dashboard or provider documentation confirming the test environment. Until that gate is satisfied, all integration cases remain `NOT_EXECUTED`.

Gemini has a narrower recorded result. An official background Interaction request was accepted with an `in_progress` response using the owner-supplied key, but the observed status request produced a provider-side permission denial and no Google-signed completion callback reached the test receiver. The result is **request acceptance only**, not provider readiness, controlled user unlock, or H1 proof.

GitHub now has an external, signed-connectivity result. A release-only webhook configured with TLS verification accepted the repository `ping` and one owner-authorized redelivery with HTTP `202`. Because the receiver verifies the GitHub HMAC before it ignores non-release events, this demonstrates endpoint reachability and the shared-secret path. It does **not** demonstrate a `release.published` provider-ready candidate, an Adapter, a user unlock, or H1 proof.

## Claim boundary

> This branch records test readiness and evidence only. It does not establish provider attestation, a completed signed Gemini callback, controlled user unlock, H1 issuance, tenant isolation, payment processing, or broad commercial-service readiness.

## References

1. [Envia webhooks documentation](https://docs.envia.com/docs/webhooks)
2. [PayLock readiness assessment, private review record](../../../../paylock-audit-notes/paylock-yaqeen-readiness-assessment-2026-08-18.md)
