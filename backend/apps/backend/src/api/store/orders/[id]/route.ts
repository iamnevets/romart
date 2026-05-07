import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import type { IOrderModuleService } from "@medusajs/framework/types";

/**
 * GET /store/orders/:id
 *
 * Retrieves order details for a customer.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id: orderId } = req.params;

  try {
    // Resolve the order module service from Medusa 2.x
    const orderModuleService = req.scope.resolve<IOrderModuleService>(Modules.ORDER);

    // Retrieve the order with related data
    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address"],
    });

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        display_id: order.display_id,
        status: order.status,
        fulfillment_status: "pending", // Note: not available on OrderDTO in Medusa 2.x
        payment_status: "pending", // Note: not available on OrderDTO in Medusa 2.x
        created_at: order.created_at,
        items: order.items?.map((item) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })) || [],
        shipping_address: order.shipping_address,
        subtotal: order.subtotal || 0,
        shipping_total: order.shipping_total || 0,
        total: order.total || 0,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve order:", error);
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }
}
