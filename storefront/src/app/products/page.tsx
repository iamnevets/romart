import { Suspense } from "react";
import Link from "next/link";
import { X, Search } from "lucide-react";
import { Header, Footer, Container } from "@/components/layout";
import { ProductFilters, ProductGrid } from "@/components/product";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchProducts, getProductPrice, isProductInStock, getCompareAtPrice, isNewProduct } from "@/lib/api";
import type { ProductCardProps } from "@/components/product";

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  // Fetch products from Medusa API (with fallback)
  const { products, count } = await fetchProducts({
    category: params.category,
    sort: params.sort,
    minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
    q: params.q,
  });

  // Map to ProductCardProps
  const productCards: ProductCardProps[] = products.map((product) => ({
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    price: getProductPrice(product),
    compareAtPrice: getCompareAtPrice(product),
    currency: "GHS",
    handle: product.handle,
    inStock: isProductInStock(product),
    isNew: isNewProduct(product),
    variantId: product.variants[0]?.id,
  }));

  return (
    <>
      <Header />
      <main className="flex-1 py-8">
        <Container>
          {/* Page Header */}
          <div className="mb-8 space-y-2">
            <p className="text-sm uppercase tracking-[0.15em] text-primary font-medium">
              {params.q ? "Search Results" : "Shop"}
            </p>
            <h1>{params.q ? `Results for "${params.q}"` : "All Products"}</h1>
            <p className="text-muted-foreground">
              {params.q ? (
                <span className="flex items-center gap-2 flex-wrap">
                  Found {count} {count === 1 ? "product" : "products"}
                  <Link href="/products">
                    <Button variant="outline" size="sm" className="gap-1 h-7">
                      <X className="h-3 w-3" />
                      Clear search
                    </Button>
                  </Link>
                </span>
              ) : (
                "Browse our selection of quality home appliances"
              )}
            </p>
          </div>

          {/* No results message */}
          {params.q && count === 0 && (
            <div className="text-center py-12 mb-8 rounded-lg border bg-muted/30">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground mb-4">
                We couldn&apos;t find any products matching &quot;{params.q}&quot;
              </p>
              <Link href="/products">
                <Button>View all products</Button>
              </Link>
            </div>
          )}

          {/* Products Section */}
          <div className="flex flex-col lg:flex-row gap-8">
            <Suspense fallback={<div className="w-64 shrink-0" />}>
              <ProductFilters totalProducts={count} />
            </Suspense>

            <div className="flex-1">
              {/* Desktop product count */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  {count} products
                </p>
              </div>

              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid products={productCards} />
              </Suspense>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
