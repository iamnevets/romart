"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { medusa } from "./medusa";

// Types for cart items
export interface CartItem {
  id: string; // line item ID from Medusa
  productId: string;
  variantId: string;
  title: string;
  thumbnail: string | null;
  price: number;
  quantity: number;
  maxQuantity?: number;
}

// Types for Medusa cart
interface MedusaCart {
  id: string;
  items: MedusaLineItem[];
  region_id: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  shipping_address?: ShippingAddress;
  email?: string;
}

interface MedusaLineItem {
  id: string;
  title: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  variant_id: string;
  product_id: string;
  variant?: {
    inventory_quantity?: number;
  };
}

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

interface CartState {
  cartId: string | null;
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  subtotal: number;
  total: number;
  shippingTotal: number;
}

interface CartContextValue extends CartState {
  itemCount: number;
  addItem: (item: { variantId: string; productId: string; title: string; thumbnail: string | null; price: number; quantity?: number }) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setShippingAddress: (address: ShippingAddress) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CART_ID_KEY = "romart-cart-id";
const FALLBACK_CART_KEY = "romart-cart-fallback";

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Map Medusa line items to our CartItem type
function mapLineItems(items: MedusaLineItem[]): CartItem[] {
  return items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    title: item.title,
    thumbnail: item.thumbnail,
    price: item.unit_price,
    quantity: item.quantity,
    maxQuantity: item.variant?.inventory_quantity,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    cartId: null,
    items: [],
    isOpen: false,
    isLoading: true,
    subtotal: 0,
    total: 0,
    shippingTotal: 0,
  });

  const [useFallback, setUseFallback] = useState(false);

  // Load cart on mount
  useEffect(() => {
    const initializeCart = async () => {
      const savedCartId = localStorage.getItem(CART_ID_KEY);

      if (savedCartId) {
        try {
          // Try to retrieve existing cart from Medusa
          const response = await medusa.store.cart.retrieve(savedCartId);
          const cart = response.cart as unknown as MedusaCart;

          setState((prev) => ({
            ...prev,
            cartId: cart.id,
            items: mapLineItems(cart.items),
            subtotal: cart.subtotal,
            total: cart.total,
            shippingTotal: cart.shipping_total,
            isLoading: false,
          }));
          return;
        } catch (err) {
          console.warn("Failed to retrieve cart from Medusa:", err);
          localStorage.removeItem(CART_ID_KEY);
        }
      }

      // Try to load fallback cart if backend unavailable
      const fallbackCart = localStorage.getItem(FALLBACK_CART_KEY);
      if (fallbackCart) {
        try {
          const items = JSON.parse(fallbackCart) as CartItem[];
          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          setState((prev) => ({
            ...prev,
            items,
            subtotal,
            total: subtotal,
            isLoading: false,
          }));
          setUseFallback(true);
        } catch {
          // Invalid fallback data
        }
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    };

    initializeCart();
  }, []);

  // Save fallback cart when items change (if using fallback)
  useEffect(() => {
    if (useFallback && state.items.length > 0) {
      localStorage.setItem(FALLBACK_CART_KEY, JSON.stringify(state.items));
    } else if (useFallback && state.items.length === 0) {
      localStorage.removeItem(FALLBACK_CART_KEY);
    }
  }, [state.items, useFallback]);

  // Create cart on Medusa
  const createCart = useCallback(async (): Promise<string | null> => {
    try {
      const response = await medusa.store.cart.create({});
      const cart = response.cart as unknown as MedusaCart;
      localStorage.setItem(CART_ID_KEY, cart.id);
      return cart.id;
    } catch (err) {
      console.warn("Failed to create cart on Medusa:", err);
      setUseFallback(true);
      return null;
    }
  }, []);

  // Refresh cart from Medusa
  const refreshCart = useCallback(async () => {
    if (!state.cartId) return;

    try {
      const response = await medusa.store.cart.retrieve(state.cartId);
      const cart = response.cart as unknown as MedusaCart;

      setState((prev) => ({
        ...prev,
        items: mapLineItems(cart.items),
        subtotal: cart.subtotal,
        total: cart.total,
        shippingTotal: cart.shipping_total,
      }));
    } catch (err) {
      console.warn("Failed to refresh cart:", err);
    }
  }, [state.cartId]);

  // Add item to cart
  const addItem = useCallback(
    async (item: {
      variantId: string;
      productId: string;
      title: string;
      thumbnail: string | null;
      price: number;
      quantity?: number;
    }) => {
      const quantity = item.quantity || 1;

      // If using fallback mode
      if (useFallback) {
        setState((prev) => {
          const existingIndex = prev.items.findIndex(
            (i) => i.variantId === item.variantId
          );

          let newItems: CartItem[];
          if (existingIndex > -1) {
            newItems = [...prev.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
          } else {
            newItems = [
              ...prev.items,
              {
                id: `fallback-${Date.now()}`,
                productId: item.productId,
                variantId: item.variantId,
                title: item.title,
                thumbnail: item.thumbnail,
                price: item.price,
                quantity,
              },
            ];
          }

          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return {
            ...prev,
            items: newItems,
            subtotal,
            total: subtotal,
            isOpen: true,
          };
        });
        return;
      }

      // Get or create cart
      let cartId = state.cartId;
      if (!cartId) {
        cartId = await createCart();
        if (!cartId) {
          // Fallback to local storage
          setUseFallback(true);
          await addItem(item);
          return;
        }
        setState((prev) => ({ ...prev, cartId }));
      }

      try {
        const response = await medusa.store.cart.createLineItem(cartId, {
          variant_id: item.variantId,
          quantity,
        });
        const cart = response.cart as unknown as MedusaCart;

        setState((prev) => ({
          ...prev,
          items: mapLineItems(cart.items),
          subtotal: cart.subtotal,
          total: cart.total,
          shippingTotal: cart.shipping_total,
          isOpen: true,
        }));
      } catch (err) {
        console.error("Failed to add item to cart:", err);
        // Fallback to local storage
        setUseFallback(true);
        await addItem(item);
      }
    },
    [state.cartId, useFallback, createCart]
  );

  // Remove item from cart
  const removeItem = useCallback(
    async (lineItemId: string) => {
      if (useFallback) {
        setState((prev) => {
          const newItems = prev.items.filter((i) => i.id !== lineItemId);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { ...prev, items: newItems, subtotal, total: subtotal };
        });
        return;
      }

      if (!state.cartId) return;

      try {
        const response = await medusa.store.cart.deleteLineItem(state.cartId, lineItemId);
        const cart = response.cart as unknown as MedusaCart;

        setState((prev) => ({
          ...prev,
          items: mapLineItems(cart.items),
          subtotal: cart.subtotal,
          total: cart.total,
          shippingTotal: cart.shipping_total,
        }));
      } catch (err) {
        console.error("Failed to remove item from cart:", err);
      }
    },
    [state.cartId, useFallback]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (lineItemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(lineItemId);
        return;
      }

      if (useFallback) {
        setState((prev) => {
          const newItems = prev.items.map((i) =>
            i.id === lineItemId ? { ...i, quantity } : i
          );
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { ...prev, items: newItems, subtotal, total: subtotal };
        });
        return;
      }

      if (!state.cartId) return;

      try {
        const response = await medusa.store.cart.updateLineItem(state.cartId, lineItemId, {
          quantity,
        });
        const cart = response.cart as unknown as MedusaCart;

        setState((prev) => ({
          ...prev,
          items: mapLineItems(cart.items),
          subtotal: cart.subtotal,
          total: cart.total,
          shippingTotal: cart.shipping_total,
        }));
      } catch (err) {
        console.error("Failed to update item quantity:", err);
      }
    },
    [state.cartId, useFallback, removeItem]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    if (useFallback) {
      setState((prev) => ({
        ...prev,
        items: [],
        subtotal: 0,
        total: 0,
      }));
      localStorage.removeItem(FALLBACK_CART_KEY);
      return;
    }

    // For Medusa, we need to remove each item
    if (state.cartId && state.items.length > 0) {
      try {
        for (const item of state.items) {
          await medusa.store.cart.deleteLineItem(state.cartId, item.id);
        }
      } catch (err) {
        console.error("Failed to clear cart:", err);
      }
    }

    setState((prev) => ({
      ...prev,
      items: [],
      subtotal: 0,
      total: 0,
      shippingTotal: 0,
    }));
  }, [state.cartId, state.items, useFallback]);

  // Set shipping address
  const setShippingAddress = useCallback(
    async (address: ShippingAddress) => {
      if (!state.cartId || useFallback) return;

      try {
        await medusa.store.cart.update(state.cartId, {
          shipping_address: address,
        });
        await refreshCart();
      } catch (err) {
        console.error("Failed to set shipping address:", err);
      }
    },
    [state.cartId, useFallback, refreshCart]
  );

  // Set email
  const setEmail = useCallback(
    async (email: string) => {
      if (!state.cartId || useFallback) return;

      try {
        await medusa.store.cart.update(state.cartId, { email });
      } catch (err) {
        console.error("Failed to set email:", err);
      }
    },
    [state.cartId, useFallback]
  );

  // UI actions
  const openCart = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeCart = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleCart = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        ...state,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        setShippingAddress,
        setEmail,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
