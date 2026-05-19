import { defineMiddlewares } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { validateFulfillmentProgression } from "../services/paylock-fulfillment-gate"

async function paylockDeliveredGuard(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  console.log("[PayLock] mark-as-delivered middleware invoked", {
    params: req.params,
  })

  const { id: orderId, fulfillment_id: fulfillmentId } = req.params as {
    id?: string
    fulfillment_id?: string
  }

  if (!orderId || !fulfillmentId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing orderId or fulfillmentId in route params"
    )
  }

  const query = req.scope.resolve("query")
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "metadata", "fulfillments.id", "fulfillments.provider_id"],
    filters: { id: orderId },
  })

  const order = orders?.[0] as any
  const h0 = String(order?.metadata?.paylock_h0 || "")

  if (!h0) {
    console.log("[PayLock] mark-as-delivered blocked: missing h0", {
      orderId,
      fulfillmentId,
    })
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "PAYLOCK_FULFILLMENT_BLOCKED: PAYLOCK_MISSING_H0 - order metadata.paylock_h0 is required"
    )
  }

  const fulfillment =
    order?.fulfillments?.find((f: any) => f.id === fulfillmentId) || null

  if (!fulfillment) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment ${fulfillmentId} not found on order ${orderId}`
    )
  }

  const result = await validateFulfillmentProgression({
    h0,
    orderId,
    fulfillmentId,
    providerId: fulfillment.provider_id,
  })

  console.log("[PayLock] mark-as-delivered gate result", result)

  if (!result.progressionAllowed) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `PAYLOCK_FULFILLMENT_BLOCKED: ${result.code} - ${result.details}`
    )
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered",
      middlewares: [paylockDeliveredGuard],
    },
  ],
})
