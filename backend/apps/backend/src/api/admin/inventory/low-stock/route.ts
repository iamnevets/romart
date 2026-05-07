import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import type { IInventoryService } from "@medusajs/framework/types";
import { sendEmail } from "../../../../lib/email";

interface LowStockItem {
  inventoryItemId: string;
  sku: string | null;
  title: string | null;
  description: string | null;
  stocked_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  threshold: number;
}

interface LowStockRequestBody {
  threshold?: number;
  sendNotification?: boolean;
  notificationEmail?: string;
}

/**
 * GET /admin/inventory/low-stock
 *
 * Returns products with inventory below the specified threshold.
 * Default threshold is 5 units.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const threshold = parseInt(req.query.threshold as string) || 5;

  try {
    // Resolve the inventory module service from Medusa 2.x
    const inventoryService = req.scope.resolve<IInventoryService>(Modules.INVENTORY);

    // Get all inventory levels with their inventory items
    const inventoryLevels = await inventoryService.listInventoryLevels(
      {},
      {
        relations: ["inventory_item"],
        take: 1000, // Get a reasonable batch
      }
    );

    // Filter items where available quantity is below threshold
    const lowStockItems: LowStockItem[] = inventoryLevels
      .filter((level) => {
        const availableQty = level.stocked_quantity - level.reserved_quantity;
        return availableQty < threshold && availableQty >= 0;
      })
      .map((level) => ({
        inventoryItemId: level.inventory_item_id,
        sku: null, // Note: inventory_item relation not available in Medusa 2.x
        title: null,
        description: null,
        stocked_quantity: level.stocked_quantity,
        reserved_quantity: level.reserved_quantity,
        available_quantity: level.stocked_quantity - level.reserved_quantity,
        threshold,
      }));

    return res.status(200).json({
      success: true,
      threshold,
      count: lowStockItems.length,
      items: lowStockItems,
      message: lowStockItems.length > 0
        ? `Found ${lowStockItems.length} items below stock threshold of ${threshold}`
        : "All items are sufficiently stocked",
    });
  } catch (error) {
    console.error("Failed to check low stock:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check low stock inventory",
    });
  }
}

/**
 * POST /admin/inventory/low-stock
 *
 * Checks for low stock items and optionally sends notification email.
 * Can be called manually or via a scheduled job/webhook.
 */
export async function POST(
  req: MedusaRequest<LowStockRequestBody>,
  res: MedusaResponse
) {
  const {
    threshold = 5,
    sendNotification = false,
    notificationEmail,
  } = req.body;

  try {
    // Resolve the inventory module service from Medusa 2.x
    const inventoryService = req.scope.resolve<IInventoryService>(Modules.INVENTORY);

    // Get all inventory levels with their inventory items
    const inventoryLevels = await inventoryService.listInventoryLevels(
      {},
      {
        relations: ["inventory_item"],
        take: 1000,
      }
    );

    // Filter items where available quantity is below threshold
    const lowStockItems: LowStockItem[] = inventoryLevels
      .filter((level) => {
        const availableQty = level.stocked_quantity - level.reserved_quantity;
        return availableQty < threshold && availableQty >= 0;
      })
      .map((level) => ({
        inventoryItemId: level.inventory_item_id,
        sku: null, // Note: inventory_item relation not available in Medusa 2.x
        title: null,
        description: null,
        stocked_quantity: level.stocked_quantity,
        reserved_quantity: level.reserved_quantity,
        available_quantity: level.stocked_quantity - level.reserved_quantity,
        threshold,
      }));

    // Send notification email if requested and there are low stock items
    if (sendNotification && lowStockItems.length > 0 && notificationEmail) {
      const emailHtml = generateLowStockAlertEmail(lowStockItems, threshold);

      const emailResult = await sendEmail({
        to: notificationEmail,
        subject: `[ALERT] ${lowStockItems.length} Products Low on Stock - Romart`,
        html: emailHtml,
      });

      return res.status(200).json({
        success: true,
        threshold,
        count: lowStockItems.length,
        items: lowStockItems,
        notificationSent: emailResult.success,
        message: emailResult.success
          ? `Low stock alert sent to ${notificationEmail}`
          : `Alert generated but email failed: ${emailResult.error}`,
      });
    }

    return res.status(200).json({
      success: true,
      threshold,
      count: lowStockItems.length,
      items: lowStockItems,
      notificationSent: false,
      message: lowStockItems.length > 0
        ? `Found ${lowStockItems.length} items below threshold`
        : "All items are sufficiently stocked",
    });
  } catch (error) {
    console.error("Low stock check failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check low stock inventory",
    });
  }
}

/**
 * Generate Low Stock Alert Email HTML
 */
function generateLowStockAlertEmail(items: LowStockItem[], threshold: number): string {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title || "Unnamed Item"}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${item.sku || "N/A"}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="color: ${item.available_quantity <= 2 ? "#dc2626" : "#f59e0b"}; font-weight: 600;">
              ${item.available_quantity}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            ${item.reserved_quantity}
          </td>
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
  <title>Low Stock Alert - Romart Electronics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #dc2626; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ⚠️ Low Stock Alert
              </h1>
            </td>
          </tr>

          <!-- Alert Message -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                The following <strong>${items.length} product${items.length > 1 ? "s" : ""}</strong>
                ${items.length > 1 ? "are" : "is"} below the stock threshold of <strong>${threshold} units</strong>:
              </p>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">SKU</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Available</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Reserved</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Action CTA -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="https://admin.romart.com/inventory"
                 style="display: inline-block; background-color: #C75000; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Manage Inventory
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated alert from Romart Electronics inventory system.
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
