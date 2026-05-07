import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned" | "pending";
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
      custom_fields?: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
    };
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

interface VerifyRequestBody {
  reference: string;
  orderId?: string;
}

/**
 * POST /store/payment/verify
 *
 * Verifies a Paystack payment server-side.
 * This is critical for security - never trust client-side payment callbacks alone.
 */
export async function POST(
  req: MedusaRequest<VerifyRequestBody>,
  res: MedusaResponse
) {
  const { reference, orderId } = req.body;

  // Validate input
  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Payment reference is required",
    });
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackSecretKey) {
    console.error("PAYSTACK_SECRET_KEY not configured");
    return res.status(500).json({
      success: false,
      message: "Payment verification is not configured",
    });
  }

  try {
    // Call Paystack's verify endpoint
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: PaystackVerifyResponse = await verifyResponse.json();

    if (!result.status) {
      console.error("Paystack verification failed:", result.message);
      return res.status(400).json({
        success: false,
        message: result.message || "Payment verification failed",
        verified: false,
      });
    }

    const paymentData = result.data;

    // Check payment status
    if (paymentData.status !== "success") {
      console.warn(`Payment not successful. Status: ${paymentData.status}`, {
        reference,
        orderId,
      });

      return res.status(400).json({
        success: false,
        message: `Payment ${paymentData.status}`,
        verified: false,
        paymentStatus: paymentData.status,
        gatewayResponse: paymentData.gateway_response,
      });
    }

    // Payment verified successfully
    console.log("Payment verified successfully:", {
      reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      orderId: paymentData.metadata?.order_id || orderId,
      paidAt: paymentData.paid_at,
    });

    // TODO: Update order status in Medusa if orderId provided
    // This would use Medusa's order service to mark payment as captured

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      verified: true,
      payment: {
        reference: paymentData.reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        channel: paymentData.channel,
        paidAt: paymentData.paid_at,
        orderId: paymentData.metadata?.order_id || orderId,
        customer: {
          email: paymentData.customer.email,
          name: paymentData.metadata?.customer_name,
        },
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
      verified: false,
    });
  }
}
