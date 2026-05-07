import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { sendOrderConfirmationEmail } from "../../../../lib/email";

interface OrderConfirmationRequestBody {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    region: string;
  };
  paymentReference: string;
}

/**
 * POST /store/notifications/order-confirmation
 *
 * Sends an order confirmation email to the customer.
 * Called after successful payment verification.
 */
export async function POST(
  req: MedusaRequest<OrderConfirmationRequestBody>,
  res: MedusaResponse
) {
  const data = req.body;

  // Validate required fields
  if (!data.orderId || !data.customerEmail || !data.customerName) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: orderId, customerEmail, customerName",
    });
  }

  if (!data.items || data.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Order must contain at least one item",
    });
  }

  try {
    const result = await sendOrderConfirmationEmail({
      orderId: data.orderId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      items: data.items,
      subtotal: data.subtotal || 0,
      shippingCost: data.shippingCost || 0,
      total: data.total || 0,
      shippingAddress: data.shippingAddress || {
        address: "N/A",
        city: "N/A",
        region: "N/A",
      },
      paymentReference: data.paymentReference || "N/A",
    });

    if (!result.success) {
      console.warn("Failed to send order confirmation email:", result.error);
      // Don't fail the request - email failure shouldn't block the order
      return res.status(200).json({
        success: true,
        emailSent: false,
        message: result.error || "Email could not be sent, but order is confirmed",
      });
    }

    return res.status(200).json({
      success: true,
      emailSent: true,
      emailId: result.id,
      message: "Order confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Order confirmation email error:", error);
    // Don't fail - email issues shouldn't block the order
    return res.status(200).json({
      success: true,
      emailSent: false,
      message: "Order confirmed, but email could not be sent",
    });
  }
}
