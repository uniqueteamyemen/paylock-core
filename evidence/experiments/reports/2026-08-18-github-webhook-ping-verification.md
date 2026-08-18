# GitHub Webhook Ping Verification — 2026-08-18

## Scope

This record covers one GitHub-generated `ping` delivery to the narrow DS&D test receiver. It does **not** establish a `release.published` business event, invoke PayLock Core, create H0/H1, or assert provider readiness.

## Verified configuration

| Control | Observed result |
|---|---|
| Destination | DS&D GitHub test receiver (`/api/test-webhooks/github`) |
| Subscription | `release` only |
| Content type | `application/json` |
| TLS verification | Enabled |
| Shared signing secret | Configured; value not retained here |
| Hook state | Active |

## Delivery result

| Field | Result |
|---|---|
| Event | `ping` |
| Delivery reference | Redacted |
| HTTP method | `POST` |
| Response | `202` |
| Completion time | `0.09 seconds` |
| Signature header | `X-Hub-Signature-256` present; value excluded |
| Outcome | GitHub marked the delivery successful |

## Interpretation and boundary

The successful, signed GitHub `ping` confirms that the configured GitHub endpoint is reachable and that the receiver accepted the configured signed test request. The GitHub configuration view also showed the subscription was restricted to `release`, with JSON delivery, TLS verification, and an obscured configured secret. This is a connectivity and signing-path check only. The receiver remains intentionally release-scoped; an actual release event requires a separate controlled release action and is not inferred from this `ping`.

## Controlled redelivery

Exactly one owner-authorized redelivery of the existing signed `ping` was submitted after the configuration review. GitHub recorded the redelivery as successful and the receiver returned HTTP `202`. The source review in `server/githubDelivery.ts` establishes that HMAC validation occurs before the event-scope filter, so this response supports a valid shared-secret signing path and endpoint reachability. No release event was created and no additional delivery was requested.

> Evidence boundary: this verifies signed `ping` connectivity only. The receiver deliberately classifies `ping` as outside the release-only test scope after signature validation. It does not demonstrate an actual `release.published` payload, a provider-ready candidate, an Adapter, or a PayLock Core call.

No customer data, model output, payment data, secret value, raw headers, raw payload, or delivery identifier is retained in this record.
