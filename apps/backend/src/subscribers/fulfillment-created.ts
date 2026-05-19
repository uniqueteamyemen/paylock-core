import { Subscriber } from "@medusajs/framework"
import { validateFulfillmentProgression } from "../services/paylock-fulfillment-gate"

export default async function fulfillmentCreated({
  event,
  container,
}: Subscriber<string>) {
  const fulfillment = event.data as any
  console.log("[PayLock] fulfillment.created subscriber invoked", {
    fulfillment_id: fulfillment.id,
    order_id: fulfillment.order_id,
  })

  const orderService = container.resolve("orderService")

  const orders = await orderService.listOrders(
    { id: fulfillment.order_id },
    { select: ["id", "metadata"] }
  )

  const order = orders[0]

  const h0 = order?.metadata?.paylock_h0

  if (!h0) {
    console.log("[PayLock] fulfillment.created blocked: missing h0")
    throw new Error("PAYLOCK_FULFILLMENT_BLOCKED: PAYLOCK_MISSING_H0 - order metadata.paylock_h0 is required")
  }

  const result = await validateFulfillmentProgression({
    h0,
    orderId: order.id,
    fulfillmentId: fulfillment.id,
    providerId: fulfillment.provider_id,
  })

  console.log("[PayLock] fulfillment.created gate result", result)

  if (!result.progressionAllowed) {
    throw new Error(
      `PAYLOCK_FULFILLMENT_BLOCKED: ${result.code || "UNKNOWN"} - ${result.details || "No details"}`
    )
  }
}

export const config = {
  event: "fulfillment.created",
}
