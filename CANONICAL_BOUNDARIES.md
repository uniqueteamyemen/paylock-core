# Canonical Boundaries (Source of Truth)

This document defines the *non-negotiable* architectural boundaries of PayLock. Any change that violates these boundaries is an **architectural regression**.

## What PayLock Is

PayLock Core is a **neutral deterministic proof layer**. It records signals and deterministically issues proofs. It does **not** implement payment, entitlement policy, product semantics, or platform orchestration.

## What PayLock Is Not

- A payment processor (no custody, no capture, no settlement).
- An entitlement policy engine (no subscription rules, no DRM/product semantics).
- A platform/merchant system (no UI, catalog, billing, user accounts).

## Canonical Definition: H0 (Initial Entitlement / Session Receipt)

> **H0 is a system-issued Session Receipt.** It must be **non-reproducible** and **non-predictable** by the user or an attacker (even if the attacker is the user), so that each entitlement attempt is independent and cannot be pre-computed or replayed technically by repeating the same input data.
>
> **H0 is security logic, not business logic.** It proves the existence of a unique, momentary "entitlement intent" under PayLock issuance, blocking pre-computation and technical session replay.
>
> **Business-level de-duplication is external.** Preventing commercial replays (double spending / order replay) is the responsibility of the integration layer via explicit identifiers such as `idempotency-key` and/or `external_order_id`, not by reusing `H0`.

### Implications

- The same user submitting the same payload twice should yield **two different H0 values** (two independent sessions).
- If the integrator needs "same order, same outcome", they must provide and enforce an external idempotency key at the integration boundary.

