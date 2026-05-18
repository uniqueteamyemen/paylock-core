# Audit Appendix: Deterministic Proof Record

This appendix summarizes the archived deterministic audit run captured in:

- [paylock-enforcement-audit.json](/C:/Users/Thinkpad/Documents/Codex/2026-05-14/https-github-com-uniqueteamyemen-paylock-core/paylock-enforcement-audit.json)

## Audit Metadata
- `generated_at`: `2026-05-18T18:26:00.033Z`
- `target`: `https://paylock-core-production.up.railway.app`
- `chain`: `Operational contradiction reproduced -> deterministic gate satisfied`
- `receipt_id`: `audit-1779128751818`
- `h0`: `04f455c45ec6a286fb9086c41ddcd5a9fe9472cffaf90964f57b21c4262dd1e8`

## Step-by-Step Record

1. **Session Create**
   - Status: `200`
   - Response status: `INITIATED`
   - Request hash: `f176d6e882bf7e1ed01258d6d0f3806b86adc4c0089786fd256dfad96bfb45c9`
   - Result hash: `5271217035b2d15bb4f8f2423671a0fa324d65b8a4f15070e5cbe878793b4713`

2. **Resolve Before Ack/Unlock (Expected Deny)**
   - Status: `400`
   - Error: `Missing required signals`
   - Missing flags: `provider_ack=true`, `user_unlock=true`
   - Request hash: `7ec8d5b0f1e4a9c3af9992a0b93ffd4a1a14cd5b6dd8a1217530658e4b564f80`
   - Result hash: `3fba6eba82dedb18af8eb06a34c6ac180c42522004bd1a9c9b2f2120c9c14612`

3. **Provider Ack**
   - Status: `200`
   - `signal_recorded=true`
   - Request hash: `9d5b5eccf351c6e6d44c60bc12e3e64d32daa5b375c7baa29eddb06792429361`
   - Result hash: `7212a10024c21eb06ec28c8bf859cde937ce93b8adf2aef243a292d42ad2fa4f`

4. **User Unlock**
   - Status: `200`
   - Response status: `UNLOCKED`
   - Proof status: `EXECUTION_PROVEN`
   - `h1`: `f365a3ae552997fe2955f6688643de41da1c7d889fa50f76a18f31ec2454b467`
   - Request hash: `561ef08bdcae884b378de6c523c74f6404b10866fe16fafa58a4af1de190db95`
   - Result hash: `0e86778af205adab53bf2789f142cd54c14682886ec121d887c2cc55d4dc60ef`

5. **Resolve After Ack/Unlock (Expected Allow)**
   - Status: `200`
   - Response status: `EXECUTION_PROVEN`
   - `h1`: `f365a3ae552997fe2955f6688643de41da1c7d889fa50f76a18f31ec2454b467`
   - Request hash: `7ec8d5b0f1e4a9c3af9992a0b93ffd4a1a14cd5b6dd8a1217530658e4b564f80`
   - Result hash: `213e0a6c374853bbc76b38bd0723e6763958cd3f2517346fdc7f65f7b6276dc6`

## Deterministic Consistency Notes
- Same resolve payload hash appears in deny and allow phases, but outcomes differ strictly by lifecycle completeness.
- Final `h1` is stable between unlock proof response and post-unlock resolve response.
- This supports deterministic progression enforcement rather than nondeterministic acceptance.

