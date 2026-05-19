# PayLock Deterministic Enforcement Evidence Brief

## Scope
This brief documents operational evidence that PayLock is enforcing deterministic progression rules, not merely exposing API flow.

## Core Claim
The same progression class that can appear operationally contradictory in commerce systems is denied until deterministic proof conditions are satisfied.

## Demonstrated Chain
Operational contradiction reproduced  
-> Deterministic gate inserted  
-> Same progression class denied until proof is complete

## Runtime Evidence (Smoke Execution)
Environment execution returned:

- `ok: true`
- `unlock-before-ack`
- `resolve-before-ack=400`
- `ack-then-resolve`
- `resolve-idempotent`
- `duplicate-unlock=409`
- `duplicate-receipt=409`
- `cancel-before-unlock=blocked`

This confirms the enforcement behavior across replay, duplicate unlock, pre-ack resolve, idempotency consistency, and cancellation-before-unlock scenarios.

## Live Deterministic Audit Artifact
Archived evidence file:

- [paylock-enforcement-audit.json](/C:/Users/Thinkpad/Documents/Codex/2026-05-14/https-github-com-uniqueteamyemen-paylock-core/paylock-enforcement-audit.json)

Generated at:

- `2026-05-18T18:26:00.033Z`

Target:

- `https://paylock-core-production.up.railway.app`

### Recorded Outcomes
1. Session initiated (`200`) with unique `h0`.
2. Resolve before `provider_ack` and `user_unlock` denied (`400`) with explicit missing signals.
3. `provider_ack` recorded (`200`).
4. `user_unlock` recorded (`200`) and proof state attached.
5. Resolve after both conditions returns `EXECUTION_PROVEN` (`200`).

## Why This Matters
This evidence does **not** claim that PayLock solves all commerce disputes globally.  
It proves a narrower and stronger claim:

PayLock enforces deterministic progression governance and blocks critical state transitions until required attestation events are complete.

