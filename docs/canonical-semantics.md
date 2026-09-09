# Canonical Signal Semantics

session_created = PayLock session initialized and H0 issued

provider_ack = provider-side settlement or authorization confirmation

user_unlock = user/device execution unlock signal

Device verification is a pre-unlock fact recorded through `/v1/device-verification`. The Adapter or digital product entity extracts and canonicalizes actual device data before unlock; Core stores the result and makes the final decision. `/v1/unlock` only records the user's action after an `ACCEPTED` verification exists. `device_id` is a requester-defined logical label and is not compared with `device_fingerprint`.

execution_proven = deterministic execution proof finalized (H1)

payment_attested = provider receipt/payment attestation received

payment_cancelled = provider-side cancellation confirmation

reject = execution rejected by policy or validation logic

timeout = execution window expired

rollback = execution reverted or invalidated
