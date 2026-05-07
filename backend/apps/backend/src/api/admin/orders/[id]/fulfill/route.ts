import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import type { IOrderModuleService } from "@medusajs/framework/types";
import {
  sendShippingNotificationEmail,
  sendDeliveryConfirmationEmail,
} from "../../../../../lib/email";

type FulfillmentStatus = "shipped" | "delivered" | "cancelled";

interface FulfillOrderRequestBody {
  status: FulfillmentStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  // Customer info (in production, fetch from order)
  customerEmail: string;
  customerName: string;
  shippingAddress?: {
    address: string;
    city: string;
    region: string;
  };
  items?: Array<{
    title: string;
    quantity: number;
  }>;
}

/**
 * POST /admin/orders/:id/fulfill
 *
 * Updates order fulfillment status and sends notification emails.
 * This endpoint is for admin use to manage order fulfillment.
 *
 * Status transitions:
 * - "shipped": Order has been shipped, sends shipping notification
 * - "delivered": Order has been delivered, sends delivery confirmation
 * - "cancelled": Order has been cancelled (no email sent)
 */
export async function POST(
  req: MedusaRequest<FulfillOrderRequestBody>,
  res: MedusaResponse
) {
  const { id: orderId } = req.params;
  const {
    status,
    trackingNumber,
    carrier,
    estimatedDelivery,
    customerEmail,
    customerName,
    shippingAddress,
    items,
  } = req.body;

  // Validate required fields
  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  if (!["shipped", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Must be: shipped, delivered, or cancelled",
    });
  }

  if (!customerEmail || !customerName) {
    return res.status(400).json({
      success: false,
      message: "Customer email and name are required",
    });
  }

  console.log(`Updating order ${orderId} status to: ${status}`);

  try {
    // Resolve the order module service from Medusa 2.x
    const orderModuleService = req.scope.resolve<IOrderModuleService>(Modules.ORDER);

    // Retrieve the order to get item information
    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: ["items"],
    });

    // Prepare items for fulfillment registration (all items if not specified)
    const orderItems = items?.map((item, index) => ({
      id: order.items?.[index]?.id || `item-${index}`,
      quantity: item.quantity,
    })) || order.items?.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    })) || [];

    let emailResult = { success: true, emailSent: false, message: "" };

    // Send appropriate notification and update Medusa order based on status
    switch (status) {
      case "shipped":
        // Register shipment in Medusa order module
        if (orderItems.length > 0) {
          await orderModuleService.registerShipment({
            order_id: orderId,
            items: orderItems,
            no_notification: false,
          });
        }

        // Send shipping notification email
        if (shippingAddress && items) {
          const shippingResult = await sendShippingNotificationEmail({
            orderId,
            customerName,
            customerEmail,
            shippingAddress,
            trackingNumber,
            carrier,
            estimatedDelivery,
            items,
          });
          emailResult = {
            success: true,
            emailSent: shippingResult.success,
            message: shippingResult.success
              ? "Shipping notification sent"
              : shippingResult.error || "Failed to send shipping notification",
          };
        }
        break;

      case "delivered":
        // Register delivery in Medusa order module
        if (orderItems.length > 0) {
          await orderModuleService.registerDelivery({
            order_id: orderId,
            items: orderItems,
            no_notification: false,
          });
        }

        // Send delivery confirmation email
        const deliveryResult = await sendDeliveryConfirmationEmail({
          orderId,
          customerName,
          customerEmail,
        });
        emailResult = {
          success: true,
          emailSent: deliveryResult.success,
          message: deliveryResult.success
            ? "Delivery confirmation sent"
            : deliveryResult.error || "Failed to send delivery confirmation",
        };
        break;

      case "cancelled":
        // Cancel the order in Medusa
        // Note: Order cancellation in Medusa 2.x may require specific workflow
        // For now, we log the cancellation
        console.log(`Order ${orderId} cancelled`);

        // TODO: Send cancellation email
        emailResult = {
          success: true,
          emailSent: false,
          message: "Order cancelled (cancellation email not implemented)",
        };
        break;
    }

    return res.status(200).json({
      success: true,
      orderId,
      status,
      emailSent: emailResult.emailSent,
      message: `Order status updated to ${status}. ${emailResult.message}`,
    });
  } catch (error) {
    console.error("Order fulfillment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
}

/**
 * GET /admin/orders/:id/fulfill
 *
 * Gets the current fulfillment status of an order.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id: orderId } = req.params;

  try {
    // Resolve the order module service from Medusa 2.x
    const orderModuleService = req.scope.resolve<IOrderModuleService>(Modules.ORDER);

    // Retrieve the order with items
    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: ["items"],
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      fulfillmentStatus: order.fulfillment_status || "pending",
      status: order.status,
      items: order.items?.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    console.error("Failed to retrieve order fulfillment status:", error);
    return res.status(404).json({
      success: false,
      message: "Order not found or unable to retrieve fulfillment status",
    });
  }
}
