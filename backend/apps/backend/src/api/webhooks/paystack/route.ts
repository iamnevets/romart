import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import crypto from "crypto";
import { sendOrderConfirmationEmail } from "../../../lib/email";

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    metadata: {
      order_id?: string;
      customer_name?: string;
      items_count?: number;
    };
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    };
  };
}

/**
 * Verifies the webhook signature from Paystack
 * This ensures the webhook is genuinely from Paystack
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secretKey: string
): boolean {
  if (!signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

/**
 * POST /webhooks/paystack
 *
 * Handles webhook events from Paystack.
 * Events include: charge.success, transfer.success, transfer.failed, etc.
 *
 * IMPORTANT: Configure this URL in your Paystack dashboard:
 * https://your-domain.com/webhooks/paystack
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackSecretKey) {
    console.error("PAYSTACK_SECRET_KEY not configured for webhook verification");
    // Still return 200 to prevent Paystack from retrying
    return res.sendStatus(200);
  }

  // Get the raw body for signature verification
  // Note: In production, you may need to configure raw body parsing for this route
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers["x-paystack-signature"] as string | undefined;

  // Verify webhook signature
  if (!verifyWebhookSignature(rawBody, signature, paystackSecretKey)) {
    console.error("Invalid Paystack webhook signature");
    // Return 200 anyway to prevent retry loops, but log the issue
    return res.sendStatus(200);
  }

  const event = req.body as PaystackWebhookEvent;

  console.log(`Received Paystack webhook: ${event.event}`, {
    reference: event.data?.reference,
    status: event.data?.status,
  });

  try {
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;

      case "transfer.success":
        await handleTransferSuccess(event.data);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data);
        break;

      case "refund.processed":
        await handleRefundProcessed(event.data);
        break;

      default:
        console.log(`Unhandled Paystack event: ${event.event}`);
    }
  } catch (error) {
    console.error(`Error processing Paystack webhook ${event.event}:`, error);
    // Still return 200 - we don't want Paystack to keep retrying
    // Log the error for manual investigation
  }

  // Always respond with 200 to acknowledge receipt
  return res.sendStatus(200);
}

/**
 * Handle successful charge (payment)
 */
async function handleChargeSuccess(data: PaystackWebhookEvent["data"]) {
  console.log("Processing successful charge:", {
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
    orderId: data.metadata?.order_id,
    customerEmail: data.customer?.email,
    paidAt: data.paid_at,
  });

  const orderId = data.metadata?.order_id;
  const customerEmail = data.customer?.email;
  const customerName = data.metadata?.customer_name || "Customer";

  if (orderId) {
    // TODO: Update order status in Medusa
    // This would use Medusa's order service to:
    // 1. Mark payment as captured
    // 2. Update order status to "processing"
    // 3. Trigger fulfillment workflow if applicable

    console.log(`Would update order ${orderId} - payment confirmed`);
  }

  // Send order confirmation email
  if (customerEmail && orderId) {
    try {
      // Note: In a full implementation, we'd fetch the order details from Medusa
      // For now, we use the metadata available from Paystack
      const emailResult = await sendOrderConfirmationEmail({
        orderId,
        customerName,
        customerEmail,
        items: [], // Would be fetched from order
        subtotal: data.amount,
        shippingCost: 0,
        total: data.amount,
        shippingAddress: {
          address: "See order details",
          city: "",
          region: "",
        },
        paymentReference: data.reference,
      });

      if (emailResult.success) {
        console.log(`Order confirmation email sent for ${orderId}`);
      } else {
        console.warn(`Failed to send order confirmation email: ${emailResult.error}`);
      }
    } catch (error) {
      console.error("Error sending order confirmation email:", error);
    }
  }
}

/**
 * Handle successful transfer (payout)
 */
async function handleTransferSuccess(data: PaystackWebhookEvent["data"]) {
  console.log("Transfer successful:", {
    reference: data.reference,
    amount: data.amount,
  });

  // Handle successful payouts if applicable
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: PaystackWebhookEvent["data"]) {
  console.log("Transfer failed:", {
    reference: data.reference,
    reason: data.gateway_response,
  });

  // Handle failed payouts - might need manual intervention
}

/**
 * Handle processed refund
 */
async function handleRefundProcessed(data: PaystackWebhookEvent["data"]) {
  console.log("Refund processed:", {
    reference: data.reference,
    amount: data.amount,
  });

  // TODO: Update order status in Medusa to reflect refund
}
