"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
const utils_1 = require("@medusajs/framework/utils");
const paylock_fulfillment_gate_1 = require("../services/paylock-fulfillment-gate");
async function paylockDeliveredGuard(req, _res, next) {
    console.log("[PayLock] mark-as-delivered middleware invoked", {
        params: req.params,
    });
    const { id: orderId, fulfillment_id: fulfillmentId } = req.params;
    if (!orderId || !fulfillmentId) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Missing orderId or fulfillmentId in route params");
    }
    const query = req.scope.resolve("query");
    const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "fulfillments.id", "fulfillments.provider_id"],
        filters: { id: orderId },
    });
    const order = orders?.[0];
    const h0 = String(order?.metadata?.paylock_h0 || "");
    if (!h0) {
        console.log("[PayLock] mark-as-delivered blocked: missing h0", {
            orderId,
            fulfillmentId,
        });
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "PAYLOCK_FULFILLMENT_BLOCKED: PAYLOCK_MISSING_H0 - order metadata.paylock_h0 is required");
    }
    const fulfillment = order?.fulfillments?.find((f) => f.id === fulfillmentId) || null;
    if (!fulfillment) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, `Fulfillment ${fulfillmentId} not found on order ${orderId}`);
    }
    const result = await (0, paylock_fulfillment_gate_1.validateFulfillmentProgression)({
        h0,
        orderId,
        fulfillmentId,
        providerId: fulfillment.provider_id,
    });
    console.log("[PayLock] mark-as-delivered gate result", result);
    if (!result.progressionAllowed) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_ALLOWED, `PAYLOCK_FULFILLMENT_BLOCKED: ${result.code} - ${result.details}`);
    }
    next();
}
exports.default = (0, http_1.defineMiddlewares)({
    routes: [
        {
            matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered",
            middlewares: [paylockDeliveredGuard],
        },
    ],
});
