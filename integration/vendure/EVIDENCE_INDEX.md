# Vendure Evidence Index

## Primary Artifacts

- `evidence/Paylock Vendure Runtime Evidence Artifact V1.pdf`
- `evidence/screenshots/vendure-runtime-log-bootstrap-signal.png`
- `evidence/screenshots/vendure-paylock-webhook-unlock-h1.png`
- `evidence/screenshots/vendure-shop-additem-mutation.png`
- `evidence/screenshots/vendure-shop-additem-response.png`

## Supporting Runtime Screenshots

### Dashboard and catalog context

- `evidence/screenshots/vendure-dashboard-products.png`
- `evidence/screenshots/vendure-dashboard-product-detail.png`
- `evidence/screenshots/vendure-dashboard-customer-detail.png`
- `evidence/screenshots/vendure-dashboard-order-context.png`

### Tooling blemish

- `evidence/screenshots/vendure-dashboard-vite-overlay.png`

## Screenshot Notes

### `vendure-runtime-log-bootstrap-signal.png`

Shows Vendure server startup, PayLock bootstrap initialization, and persisted signal logging.

### `vendure-shop-additem-mutation.png`

Shows the Shop API mutation used to create order activity through GraphiQL.

### `vendure-shop-additem-response.png`

Shows the returned order with a real code and `AddingItems` state.

### `vendure-paylock-webhook-unlock-h1.png`

Shows session creation, webhook signal recording, and PayLock unlock with returned `h1`.

### `vendure-dashboard-products.png`

Shows live product catalog context.

### `vendure-dashboard-product-detail.png`

Shows product variants and asset context.

### `vendure-dashboard-customer-detail.png`

Shows live customer context.

### `vendure-dashboard-order-context.png`

Shows order-side dashboard context used during the runtime exercise.

### `vendure-dashboard-vite-overlay.png`

Shows a dashboard tooling issue that should be treated separately from PayLock protocol evidence.
