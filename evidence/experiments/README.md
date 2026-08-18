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

## Added external-event routes

The matrix now contains three additional, evidence-bounded routes. GitHub may provide a no-cost signed **artifact-ready** signal. Shopify may later provide a development-store-only fulfilment-ready signal. Gemini may later provide an authoritative asynchronous digital-service-completion signal, but only with a genuine Google-issued test credential. These routes remain distinct: no result is treated as a payment, entitlement, or broad production claim.

## Current conclusion

The owner-side Envia dashboard was reached after interactive login. That alone does **not** prove the active account context is Sandbox, that an API credential is available, that a webhook endpoint exists, or that provider-originated events reach PayLock. No shipment, label, webhook configuration, or API request was created during this evidence-capture session.

The next executable gate is an explicit, non-production Envia API credential plus a webhook signing secret, with the dashboard or provider documentation confirming the test environment. Until that gate is satisfied, all integration cases remain `NOT_EXECUTED`.

## Claim boundary

> This branch records test readiness and evidence only. It does not establish provider attestation, webhook-origin verification, tenant isolation, payment processing, or broad commercial-service readiness.

## References

1. [Envia webhooks documentation](https://docs.envia.com/docs/webhooks)
2. [PayLock readiness assessment, private review record](../../../../paylock-audit-notes/paylock-yaqeen-readiness-assessment-2026-08-18.md)
