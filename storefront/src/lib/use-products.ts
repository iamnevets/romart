"use client";

import { useState, useEffect, useCallback } from "react";
import { medusa } from "./medusa";

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

export interface ProductListParams {
  category_id?: string[];
  limit?: number;
  offset?: number;
  order?: string;
  q?: string; // search query
}

interface UseProductsResult {
  products: Product[];
  count: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseProductResult {
  product: Product | null;
  isLoading: boolean;
  error: Error | null;
}

// Map Medusa product response to our Product type
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

export function useProducts(params: ProductListParams = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, unknown> = {
        limit: params.limit || 12,
        offset: params.offset || 0,
        fields: "id,title,handle,description,thumbnail,images,variants,categories,created_at,metadata",
      };

      if (params.category_id && params.category_id.length > 0) {
        queryParams.category_id = params.category_id;
      }

      if (params.q) {
        queryParams.q = params.q;
      }

      if (params.order) {
        queryParams.order = params.order;
      }

      const response = await medusa.store.product.list(queryParams);

      const mappedProducts = response.products.map(mapProduct);
      setProducts(mappedProducts);
      setCount(response.count || mappedProducts.length);
    } catch (err) {
      console.error("Failed to fetch products from Medusa:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch products"));
      setProducts([]);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [params.category_id, params.limit, params.offset, params.order, params.q]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, count, isLoading, error, refetch: fetchProducts };
}

export function useProduct(handle: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await medusa.store.product.list({
          handle,
          fields: "id,title,handle,description,thumbnail,images,variants,categories,created_at,metadata",
          limit: 1,
        });

        if (response.products.length > 0) {
          setProduct(mapProduct(response.products[0]));
        } else {
          setError(new Error("Product not found"));
          setProduct(null);
        }
      } catch (err) {
        console.error("Failed to fetch product from Medusa:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch product"));
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (handle) {
      fetchProduct();
    }
  }, [handle]);

  return { product, isLoading, error };
}

// Helper to get price from variant
export function getProductPrice(product: Product, currencyCode = "ghs"): number {
  const variant = product.variants[0];
  if (!variant) return 0;

  const price = variant.prices.find(
    (p) => p.currency_code.toLowerCase() === currencyCode.toLowerCase()
  );
  return price?.amount || variant.prices[0]?.amount || 0;
}

// Helper to check if product is in stock
export function isProductInStock(product: Product): boolean {
  return product.variants.some(
    (v) => !v.manage_inventory || v.inventory_quantity > 0
  );
}

// Helper to get compare at price (if exists in metadata)
export function getCompareAtPrice(product: Product): number | undefined {
  return product.metadata?.compareAtPrice as number | undefined;
}

// Helper to check if product is new
export function isNewProduct(product: Product): boolean {
  return product.metadata?.isNew === true;
}
