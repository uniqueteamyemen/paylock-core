# Vendure Failure Cases

This file records the visible imperfections and non-goals that appeared during the recorded Vendure run.

## Dashboard Build Overlay

Observed:

- Vendure dashboard displayed a Vite/esbuild overlay
- the message reported:
  `The service is no longer running`
- the path referenced dashboard assets code under `@vendure/dashboard`

Evidence:

- `evidence/screenshots/vendure-dashboard-vite-overlay.png`

Interpretation:

- this is a dashboard/tooling blemish
- it does not invalidate the PayLock runtime evidence
- it should be treated as a UI/runtime stability issue, not a protocol falsification

## Missing Full Guarded Transition Proof

Observed:

- the current Vendure package demonstrates signal flow and `h1` issuance
- it does not yet show a final Vendure-side guarded transition pair

Meaning:

- no explicit captured case yet for `deny before proof`
- no matching explicit captured case yet for `allow after proof`

This is the main gap between the current Vendure package and the stronger Medusa package.

## No Replay or Retry Corpus Yet

Not yet captured in this Vendure evidence set:

- duplicate webhook replay
- duplicate provider signal pressure
- delayed unlock retry sequence
- restart determinism after runtime reset

These are future expansion areas, not missing pieces for the current historical record.
