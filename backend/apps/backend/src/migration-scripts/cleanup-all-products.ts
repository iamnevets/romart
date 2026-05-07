import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Cleanup script - Deletes ALL products, categories, and inventory items
 * Run with: npx medusa exec ./src/migration-scripts/cleanup-all-products.ts
 */

export default async function cleanup_all_products({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productService = container.resolve(Modules.PRODUCT);
  const inventoryService = container.resolve(Modules.INVENTORY);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Starting cleanup of all products, categories, and inventory...");

  // Get all products
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
  });

  logger.info(`Found ${products.length} products to delete.`);

  // Delete all products
  if (products.length > 0) {
    const productIds = products.map((p: { id: string }) => p.id);
    await productService.deleteProducts(productIds);
    logger.info(`Deleted ${products.length} products.`);
  }

  // Get all inventory items
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  logger.info(`Found ${inventoryItems.length} inventory items to delete.`);

  // Delete all inventory items
  if (inventoryItems.length > 0) {
    for (const item of inventoryItems) {
      try {
        await inventoryService.deleteInventoryItems([item.id]);
      } catch (e) {
        // Ignore errors for individual items
      }
    }
    logger.info(`Deleted inventory items.`);
  }

  // Get all categories
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  logger.info(`Found ${categories.length} categories to delete.`);

  // Delete all categories
  if (categories.length > 0) {
    const categoryIds = categories.map((c: { id: string }) => c.id);
    await productService.deleteProductCategories(categoryIds);
    logger.info(`Deleted ${categories.length} categories.`);
  }

  logger.info("Cleanup completed!");
}
