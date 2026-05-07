"use client";

import { useState, useEffect } from "react";
import { medusa } from "./medusa";

export interface Category {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  parent_category_id?: string | null;
}

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Simple in-memory cache with TTL
let cachedCategories: Category[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && cachedCategories && now - cacheTimestamp < CACHE_TTL) {
      setCategories(cachedCategories);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch categories from Medusa backend
      // Using the SDK's store.category.list() method
      const response = await medusa.store.category.list({
        fields: "id,name,handle,description,parent_category_id",
      });

      const fetchedCategories: Category[] = response.product_categories.map(
        (cat: { id: string; name: string; handle: string; description?: string | null; parent_category_id?: string | null }) => ({
          id: cat.id,
          name: cat.name,
          handle: cat.handle,
          description: cat.description,
          parent_category_id: cat.parent_category_id,
        })
      );

      // Update cache
      cachedCategories = fetchedCategories;
      cacheTimestamp = now;

      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Failed to fetch categories from Medusa:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch categories"));
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const refetch = () => {
    fetchCategories(true);
  };

  return {
    categories,
    isLoading,
    error,
    refetch,
  };
}

// Helper function to get category URL
export function getCategoryUrl(handle: string): string {
  return `/products?category=${handle}`;
}
