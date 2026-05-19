import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { order_id, h0 } = (req.body || {}) as {
    order_id?: string
    h0?: string
  }

  if (!order_id || !h0) {
    return res.status(400).json({
      message: "order_id and h0 are required",
    })
  }

  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const order = await orderModuleService.updateOrders(order_id, {
    metadata: {
      paylock_h0: h0,
    },
  })

  return res.status(200).json({
    ok: true,
    order_id: order.id,
    metadata: order.metadata,
  })
}
