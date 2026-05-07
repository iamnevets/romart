import { medusa } from "./medusa";

// Types
export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  thumbnail: string | null;
  images: { id: string; url: string }[];
  variants: ProductVariant[];
  categories: { id: string; name: string; handle: string }[];
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string | null;
  prices: { amount: number; currency_code: string }[];
  inventory_quantity: number;
  manage_inventory: boolean;
  options: { id: string; value: string }[];
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
}


// Map Medusa product to our type
function mapProduct(p: Record<string, unknown>): Product {
  return {
    id: p.id as string,
    title: p.title as string,
    handle: p.handle as string,
    description: (p.description as string) || null,
    thumbnail: (p.thumbnail as string) || null,
    images: ((p.images as { id: string; url: string }[]) || []).map((img) => ({
      id: img.id,
      url: img.url,
    })),
    variants: ((p.variants as Record<string, unknown>[]) || []).map((v) => ({
      id: v.id as string,
      title: (v.title as string) || "Default",
      sku: (v.sku as string) || null,
      prices: ((v.prices as { amount: number; currency_code: string }[]) || []).map((price) => ({
        amount: price.amount,
        currency_code: price.currency_code,
      })),
      inventory_quantity: (v.inventory_quantity as number) || 0,
      manage_inventory: (v.manage_inventory as boolean) ?? true,
      options: ((v.options as { id: string; value: string }[]) || []).map((opt) => ({
        id: opt.id,
        value: opt.value,
      })),
    })),
    categories: ((p.categories as { id: string; name: string; handle: string }[]) || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      handle: cat.handle,
    })),
    created_at: (p.created_at as string) || new Date().toISOString(),
    metadata: (p.metadata as Record<string, unknown>) || {},
  };
}

// Fetch products (server-side)
export async function fetchProducts(params: {
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ products: Product[]; count: number }> {
  try {
    const queryParams: Record<string, unknown> = {
      limit: params.limit || 12,
      offset: params.offset || 0,
      fields: "id,title,handle,description,thumbnail,images,variants,categories,created_at,metadata",
    };

    if (params.q) {
      queryParams.q = params.q;
    }

    // Note: Medusa uses category_id for filtering, we'd need to look up the ID from handle
    // For now, we'll filter after fetching if using handles

    const response = await medusa.store.product.list(queryParams);
    let products: Product[] = response.products.map(mapProduct);

    // Filter by category handle (client-side for now)
    if (params.category && params.category !== "all") {
      products = products.filter((p: Product) =>
        p.categories.some((c) => c.handle === params.category)
      );
    }

    // Filter by price
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      products = products.filter((p: Product) => {
        const price = getProductPrice(p);
        if (params.minPrice !== undefined && price < params.minPrice) return false;
        if (params.maxPrice !== undefined && price > params.maxPrice) return false;
        return true;
      });
    }

    // Sort
    if (params.sort === "price-asc") {
      products.sort((a: Product, b: Product) => getProductPrice(a) - getProductPrice(b));
    } else if (params.sort === "price-desc") {
      products.sort((a: Product, b: Product) => getProductPrice(b) - getProductPrice(a));
    } else if (params.sort === "newest") {
      products.sort((a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return { products, count: products.length };
  } catch (err) {
    console.error("Failed to fetch products from Medusa:", err);
    return { products: [], count: 0 };
  }
}

// Fetch single product by handle
export async function fetchProductByHandle(handle: string): Promise<Product | null> {
  try {
    const response = await medusa.store.product.list({
      handle,
      fields: "id,title,handle,description,thumbnail,images,variants,categories,created_at,metadata",
      limit: 1,
    });

    if (response.products.length > 0) {
      return mapProduct(response.products[0]);
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch product from Medusa:", err);
    return null;
  }
}

// Fetch categories
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await medusa.store.category.list({
      fields: "id,name,handle,description",
    });

    return response.product_categories.map((cat: { id: string; name: string; handle: string; description?: string }) => ({
      id: cat.id,
      name: cat.name,
      handle: cat.handle,
      description: cat.description,
    }));
  } catch (err) {
    console.error("Failed to fetch categories from Medusa:", err);
    return [];
  }
}

// Helper functions
export function getProductPrice(product: Product, currencyCode = "ghs"): number {
  const variant = product.variants[0];
  if (!variant) return 0;

  const price = variant.prices.find(
    (p) => p.currency_code.toLowerCase() === currencyCode.toLowerCase()
  );
  return price?.amount || variant.prices[0]?.amount || 0;
}

export function isProductInStock(product: Product): boolean {
  return product.variants.some(
    (v) => !v.manage_inventory || v.inventory_quantity > 0
  );
}

// Get inventory quantity for a product (first variant with stock, or total across variants)
export function getProductInventoryQuantity(product: Product, variantId?: string): number {
  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      return variant.manage_inventory ? variant.inventory_quantity : 99;
    }
  }

  // Default to first variant or sum of all variants
  const firstVariant = product.variants[0];
  if (!firstVariant) return 0;

  // If not managing inventory, allow unlimited (return high number)
  if (!firstVariant.manage_inventory) return 99;

  return firstVariant.inventory_quantity;
}

export function getCompareAtPrice(product: Product): number | undefined {
  return product.metadata?.compareAtPrice as number | undefined;
}

export function isNewProduct(product: Product): boolean {
  return product.metadata?.isNew === true;
}

export function getProductSpecifications(product: Product): { label: string; value: string }[] {
  return (product.metadata?.specifications as { label: string; value: string }[]) || [];
}

// ============================================
// CHECKOUT / ORDER API FUNCTIONS
// ============================================

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  province?: string;
  postal_code?: string;
  country_code: string;
  phone?: string;
}

export interface Order {
  id: string;
  display_id: number;
  email: string;
  items: OrderLineItem[];
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_total: number;
  total: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
}

export interface OrderLineItem {
  id: string;
  title: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
}

// Complete checkout - convert cart to order
export async function completeCheckout(
  cartId: string,
  _paymentData: { reference: string; transaction: string }
): Promise<Order | null> {
  try {
    // In Medusa 2.x, you complete the cart to create an order
    const response = await medusa.store.cart.complete(cartId);

    if (response.type === "order" && response.order) {
      const order = response.order as unknown as {
        id: string;
        display_id: number;
        email: string;
        items: { id: string; title: string; thumbnail: string | null; quantity: number; unit_price: number }[];
        shipping_address: ShippingAddress;
        subtotal: number;
        shipping_total: number;
        total: number;
        status: string;
        payment_status: string;
        fulfillment_status: string;
        created_at: string;
      };

      return {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
        items: order.items.map((item) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        shipping_address: order.shipping_address,
        subtotal: order.subtotal,
        shipping_total: order.shipping_total,
        total: order.total,
        status: order.status,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        created_at: order.created_at,
      };
    }

    return null;
  } catch (err) {
    console.error("Failed to complete checkout:", err);
    return null;
  }
}

// Add shipping address to cart
export async function addShippingAddress(
  cartId: string,
  address: ShippingAddress,
  email: string
): Promise<boolean> {
  try {
    await medusa.store.cart.update(cartId, {
      email,
      shipping_address: address,
      billing_address: address,
    });
    return true;
  } catch (err) {
    console.error("Failed to add shipping address:", err);
    return false;
  }
}

// Shipping option interface
export interface ShippingOption {
  id: string;
  name: string;
  amount: number;
}

// Fallback shipping options
const FALLBACK_SHIPPING_OPTIONS: ShippingOption[] = [
  { id: "standard", name: "Standard Delivery", amount: 2500 },
  { id: "express", name: "Express Delivery", amount: 5000 },
  { id: "free", name: "Free Delivery (Orders over GHS 500)", amount: 0 },
];

// Get shipping options for cart
export async function getShippingOptions(cartId: string): Promise<ShippingOption[]> {
  try {
    // Medusa 2.x SDK: list fulfillment/shipping options for a cart
    const response = await medusa.store.fulfillment.listCartOptions({ cart_id: cartId });

    if (response.shipping_options && response.shipping_options.length > 0) {
      return response.shipping_options.map((option: { id: string; name: string; amount: number }) => ({
        id: option.id,
        name: option.name,
        amount: option.amount || 0,
      }));
    }

    // No shipping options configured in backend, use fallback
    console.log("No shipping options in Medusa, using fallback");
    return FALLBACK_SHIPPING_OPTIONS;
  } catch (err) {
    console.warn("Failed to fetch shipping options from Medusa, using fallback:", err);
    return FALLBACK_SHIPPING_OPTIONS;
  }
}

// Add shipping method to cart
export async function addShippingMethod(cartId: string, optionId: string): Promise<boolean> {
  try {
    // Medusa 2.x SDK: add shipping method to cart
    await medusa.store.cart.addShippingMethod(cartId, { option_id: optionId });
    return true;
  } catch (err) {
    // If Medusa backend shipping is not configured, fall back to local storage
    console.warn("Failed to add shipping method to Medusa cart, storing locally:", err);
    // Store selection locally as fallback (used when Medusa shipping isn't configured)
    if (typeof window !== "undefined") {
      const shippingData = { cartId, optionId, selectedAt: new Date().toISOString() };
      localStorage.setItem("romart-selected-shipping", JSON.stringify(shippingData));
    }
    return true;
  }
}

// Initialize payment session
export async function initializePaymentSession(_cartId: string, _providerId: string): Promise<boolean> {
  // Note: Paystack integration is currently handled client-side
  // Medusa payment collection would be used for server-side payment processing
  try {
    // TODO: Implement when server-side payment verification is added
    // await medusa.store.cart.createPaymentCollection(cartId, { provider_id: providerId });
    console.log("Payment session initialization (client-side Paystack)");
    return true;
  } catch (err) {
    console.error("Failed to initialize payment session:", err);
    return false;
  }
}

// Payment verification response
export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  payment?: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    channel: string;
    paidAt: string | null;
    orderId?: string;
    customer: {
      email: string;
      name?: string;
    };
  };
}

// Verify payment server-side
// CRITICAL: Always call this after Paystack payment to ensure payment is genuine
export async function verifyPayment(
  reference: string,
  orderId?: string
): Promise<PaymentVerificationResult> {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

  try {
    const response = await fetch(`${backendUrl}/store/payment/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reference, orderId }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Payment verification failed:", result);
      return {
        success: false,
        verified: false,
        message: result.message || "Payment verification failed",
      };
    }

    return result as PaymentVerificationResult;
  } catch (err) {
    console.error("Payment verification error:", err);
    return {
      success: false,
      verified: false,
      message: "Unable to verify payment. Please contact support.",
    };
  }
}

// Send order confirmation email
interface OrderConfirmationEmailData {
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

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailData
): Promise<{ success: boolean; emailSent: boolean; message: string }> {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

  try {
    const response = await fetch(`${backendUrl}/store/notifications/order-confirmation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
    return {
      success: true, // Don't fail the order if email fails
      emailSent: false,
      message: "Order confirmed, but confirmation email could not be sent",
    };
  }
}

// Fetch order by ID
export async function fetchOrder(orderId: string): Promise<Order | null> {
  try {
    const response = await medusa.store.order.retrieve(orderId);
    const order = response.order as unknown as {
      id: string;
      display_id: number;
      email: string;
      items: { id: string; title: string; thumbnail: string | null; quantity: number; unit_price: number }[];
      shipping_address: ShippingAddress;
      subtotal: number;
      shipping_total: number;
      total: number;
      status: string;
      payment_status: string;
      fulfillment_status: string;
      created_at: string;
    };

    return {
      id: order.id,
      display_id: order.display_id,
      email: order.email,
      items: order.items.map((item) => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      shipping_address: order.shipping_address,
      subtotal: order.subtotal,
      shipping_total: order.shipping_total,
      total: order.total,
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      created_at: order.created_at,
    };
  } catch (err) {
    console.error("Failed to fetch order:", err);
    return null;
  }
}
