"use client";

import { useState, useEffect } from "react";
// import { medusa } from "./medusa";

export interface ShippingOption {
  id: string;
  name: string;
  amount: number; // in pesewas
  description?: string;
  estimatedDays?: string;
}

interface UseShippingOptionsResult {
  shippingOptions: ShippingOption[];
  isLoading: boolean;
  error: Error | null;
  selectedOption: ShippingOption | null;
  selectOption: (optionId: string) => void;
}

// Fallback shipping options when backend is unavailable
// In production, these should be fetched from Medusa backend based on cart region
const FALLBACK_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    name: "Standard Delivery",
    amount: 5000, // GHS 50.00 in pesewas
    description: "Delivery within Greater Accra",
    estimatedDays: "3-5 business days",
  },
  {
    id: "express",
    name: "Express Delivery",
    amount: 10000, // GHS 100.00 in pesewas
    description: "Fast delivery within Ghana",
    estimatedDays: "1-2 business days",
  },
  {
    id: "free",
    name: "Free Shipping",
    amount: 0,
    description: "Available for orders over GHS 500",
    estimatedDays: "5-7 business days",
  },
];

// Threshold for free shipping (in pesewas)
const FREE_SHIPPING_THRESHOLD = 50000; // GHS 500.00

export function useShippingOptions(
  subtotal: number,
  region?: string
): UseShippingOptionsResult {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchShippingOptions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Fetch shipping options from Medusa backend
        // When connecting to Medusa, use:
        // const { shipping_options } = await medusa.store.fulfillment.listCartOptions({
        //   cart_id: cartId
        // });

        // For now, use fallback options
        let options = [...FALLBACK_SHIPPING_OPTIONS];

        // Only show free shipping if subtotal meets threshold
        if (subtotal < FREE_SHIPPING_THRESHOLD) {
          options = options.filter(opt => opt.id !== "free");
        }

        setShippingOptions(options);

        // Auto-select the cheapest option or free shipping if available
        if (options.length > 0) {
          const freeOption = options.find(opt => opt.amount === 0);
          setSelectedOption(freeOption || options[0]);
        }
      } catch (err) {
        console.error("Failed to fetch shipping options:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch shipping options"));

        // Use fallback on error
        setShippingOptions(FALLBACK_SHIPPING_OPTIONS);
        setSelectedOption(FALLBACK_SHIPPING_OPTIONS[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippingOptions();
  }, [subtotal, region]);

  const selectOption = (optionId: string) => {
    const option = shippingOptions.find(opt => opt.id === optionId);
    if (option) {
      setSelectedOption(option);
    }
  };

  return {
    shippingOptions,
    isLoading,
    error,
    selectedOption,
    selectOption,
  };
}
