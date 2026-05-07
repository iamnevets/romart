/**
 * Email Service - Uses Resend API for transactional emails
 *
 * Environment Variables Required:
 * - RESEND_API_KEY: Your Resend API key
 * - EMAIL_FROM: Default sender email (e.g., "Romart <orders@romart.com>")
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface ResendResponse {
  id?: string;
  error?: {
    message: string;
    name: string;
  };
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.EMAIL_FROM || "Romart Electronics <noreply@example.com>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured - email will not be sent");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    const result: ResendResponse = await response.json();

    if (!response.ok || result.error) {
      console.error("Failed to send email:", result.error?.message || response.statusText);
      return { success: false, error: result.error?.message || "Failed to send email" };
    }

    console.log("Email sent successfully:", result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "An error occurred while sending email" };
  }
}

/**
 * Order Confirmation Email Template
 */
interface OrderConfirmationData {
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

export function generateOrderConfirmationEmail(data: OrderConfirmationData): string {
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);

  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Romart Electronics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C75000 0%, #E86800 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Romart Electronics</h1>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 30px;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Order Confirmed!</h2>
              <p style="margin: 0; color: #6b7280; font-size: 16px;">
                Thank you for your purchase, ${data.customerName}!
              </p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${data.orderId}</p>
                  </td>
                  <td style="text-align: right;">
                    <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">Payment Reference</p>
                    <p style="margin: 0; color: #111827; font-size: 14px; font-family: monospace;">${data.paymentReference}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; color: #6b7280;">Subtotal</td>
                    <td style="padding: 12px; text-align: right;">${formatPrice(data.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; color: #6b7280;">Shipping</td>
                    <td style="padding: 12px; text-align: right;">${data.shippingCost === 0 ? "Free" : formatPrice(data.shippingCost)}</td>
                  </tr>
                  <tr style="background-color: #f9fafb;">
                    <td colspan="2" style="padding: 12px; text-align: right; font-weight: 700; color: #111827;">Total</td>
                    <td style="padding: 12px; text-align: right; font-weight: 700; color: #C75000; font-size: 18px;">${formatPrice(data.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">Shipping Address</h3>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <p style="margin: 0; color: #374151; line-height: 1.6;">
                  ${data.customerName}<br>
                  ${data.shippingAddress.address}<br>
                  ${data.shippingAddress.city}, ${data.shippingAddress.region}<br>
                  Ghana
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="https://romart.com/orders/${data.orderId}"
                 style="display: inline-block; background-color: #C75000; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Track Your Order
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@romart.com" style="color: #C75000;">support@romart.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Romart Electronics. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  const html = generateOrderConfirmationEmail(data);

  return sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmed - ${data.orderId} | Romart Electronics`,
    html,
    replyTo: "support@romart.com",
  });
}

/**
 * Shipping Notification Email Data
 */
interface ShippingNotificationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    address: string;
    city: string;
    region: string;
  };
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  items: Array<{
    title: string;
    quantity: number;
  }>;
}

/**
 * Generate Shipping Notification Email HTML
 */
export function generateShippingNotificationEmail(data: ShippingNotificationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${item.title} × ${item.quantity}
        </li>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped - Romart Electronics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C75000 0%, #E86800 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Romart Electronics</h1>
            </td>
          </tr>

          <!-- Shipped Message -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 30px;">📦</span>
              </div>
              <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Your Order Has Shipped!</h2>
              <p style="margin: 0; color: #6b7280; font-size: 16px;">
                Great news, ${data.customerName}! Your order is on its way.
              </p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${data.orderId}</p>
                  </td>
                  ${data.trackingNumber ? `
                  <td style="text-align: right;">
                    <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">Tracking Number</p>
                    <p style="margin: 0; color: #111827; font-size: 14px; font-family: monospace;">${data.trackingNumber}</p>
                  </td>
                  ` : ""}
                </tr>
              </table>
            </td>
          </tr>

          ${data.carrier || data.estimatedDelivery ? `
          <!-- Delivery Info -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; border-left: 4px solid #3b82f6;">
                ${data.carrier ? `<p style="margin: 0 0 8px; color: #1e40af; font-weight: 600;">Carrier: ${data.carrier}</p>` : ""}
                ${data.estimatedDelivery ? `<p style="margin: 0; color: #1e40af;">Estimated Delivery: ${data.estimatedDelivery}</p>` : ""}
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- Items Being Shipped -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">Items Being Shipped</h3>
              <ul style="margin: 0; padding: 0; list-style: none; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                ${itemsHtml}
              </ul>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">Shipping To</h3>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <p style="margin: 0; color: #374151; line-height: 1.6;">
                  ${data.customerName}<br>
                  ${data.shippingAddress.address}<br>
                  ${data.shippingAddress.city}, ${data.shippingAddress.region}<br>
                  Ghana
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="https://romart.com/orders/${data.orderId}"
                 style="display: inline-block; background-color: #C75000; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Track Your Order
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@romart.com" style="color: #C75000;">support@romart.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Romart Electronics. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send Shipping Notification Email
 */
export async function sendShippingNotificationEmail(data: ShippingNotificationData) {
  const html = generateShippingNotificationEmail(data);

  return sendEmail({
    to: data.customerEmail,
    subject: `Your Order Has Shipped - ${data.orderId} | Romart Electronics`,
    html,
    replyTo: "support@romart.com",
  });
}

/**
 * Delivery Confirmation Email Data
 */
interface DeliveryConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
}

/**
 * Generate Delivery Confirmation Email HTML
 */
export function generateDeliveryConfirmationEmail(data: DeliveryConfirmationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Delivered - Romart Electronics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C75000 0%, #E86800 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Romart Electronics</h1>
            </td>
          </tr>

          <!-- Delivered Message -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 30px;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Your Order Has Been Delivered!</h2>
              <p style="margin: 0; color: #6b7280; font-size: 16px;">
                Hi ${data.customerName}, your order ${data.orderId} has been delivered.
              </p>
            </td>
          </tr>

          <!-- Thank You Message -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center;">
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for shopping with Romart Electronics! We hope you love your new appliance.
                If you have any questions or concerns, please don't hesitate to reach out.
              </p>
            </td>
          </tr>

          <!-- Review CTA -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">
                How was your experience?
              </p>
              <a href="https://romart.com/orders/${data.orderId}/review"
                 style="display: inline-block; background-color: #C75000; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Leave a Review
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@romart.com" style="color: #C75000;">support@romart.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Romart Electronics. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send Delivery Confirmation Email
 */
export async function sendDeliveryConfirmationEmail(data: DeliveryConfirmationData) {
  const html = generateDeliveryConfirmationEmail(data);

  return sendEmail({
    to: data.customerEmail,
    subject: `Your Order Has Been Delivered - ${data.orderId} | Romart Electronics`,
    html,
    replyTo: "support@romart.com",
  });
}
