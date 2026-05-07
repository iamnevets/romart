"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface WishlistItem {
  productId: string;
  variantId: string;
  title: string;
  thumbnail: string | null;
  price: number;
  handle: string;
  addedAt: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  itemCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (item: Omit<WishlistItem, "addedAt">) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (item: Omit<WishlistItem, "addedAt">) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const WISHLIST_STORAGE_KEY = "romart-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load wishlist:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save wishlist:", error);
      }
    }
  }, [items, isInitialized]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.productId === productId);
    },
    [items]
  );

  const addToWishlist = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      setItems((prev) => {
        // Don't add if already in wishlist
        if (prev.some((i) => i.productId === item.productId)) {
          return prev;
        }
        return [
          ...prev,
          {
            ...item,
            addedAt: new Date().toISOString(),
          },
        ];
      });
    },
    []
  );

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const toggleWishlist = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      if (isInWishlist(item.productId)) {
        removeFromWishlist(item.productId);
      } else {
        addToWishlist(item);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const value: WishlistContextValue = {
    items,
    itemCount: items.length,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
