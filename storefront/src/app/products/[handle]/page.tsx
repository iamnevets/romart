import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Truck, Shield, RotateCcw, Check } from "lucide-react";
import { Header, Footer, Container } from "@/components/layout";
import {
  ProductGallery,
  ProductSpecs,
  AddToCartButton,
  ProductCard,
  WishlistButton,
  ProductReviews,
} from "@/components/product";
import type { ProductCardProps } from "@/components/product";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  fetchProductByHandle,
  fetchProducts,
  getProductPrice,
  isProductInStock,
  getProductInventoryQuantity,
  getCompareAtPrice,
  isNewProduct,
  getProductSpecifications,
} from "@/lib/api";

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await fetchProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const price = getProductPrice(product);
  const compareAtPrice = getCompareAtPrice(product);
  const inStock = isProductInStock(product);
  const inventoryQuantity = getProductInventoryQuantity(product, product.variants[0]?.id);
  const isNew = isNewProduct(product);
  const specifications = getProductSpecifications(product);
  const category = product.categories[0];

  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);
  };

  // Fetch related products from the same category
  const { products: relatedProductsData } = await fetchProducts({
    category: category?.handle,
    limit: 3,
  });

  // Filter out current product and map to ProductCardProps
  const relatedProducts: ProductCardProps[] = relatedProductsData
    .filter((p) => p.id !== product.id)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      title: p.title,
      thumbnail: p.thumbnail,
      price: getProductPrice(p),
      compareAtPrice: getCompareAtPrice(p),
      handle: p.handle,
      inStock: isProductInStock(p),
      isNew: isNewProduct(p),
      variantId: p.variants[0]?.id,
    }));

  // Map images for gallery
  const galleryImages = product.images.length > 0
    ? product.images.map((img) => ({ id: img.id, url: img.url, alt: product.title }))
    : product.thumbnail
      ? [{ id: "thumb", url: product.thumbnail, alt: product.title }]
      : [];

  return (
    <>
      <Header />
      <main className="flex-1 py-8">
        <Container>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/products"
              className="hover:text-foreground transition-colors"
            >
              Products
            </Link>
            {category && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link
                  href={`/products?category=${category.handle}`}
                  className="hover:text-foreground transition-colors"
                >
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{product.title}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Gallery */}
            <div>
              {galleryImages.length > 0 ? (
                <ProductGallery images={galleryImages} />
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Badges */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {isNew && (
                    <Badge className="bg-secondary text-secondary-foreground shadow-warm-sm">
                      New Arrival
                    </Badge>
                  )}
                  {hasDiscount && (
                    <Badge className="bg-accent text-accent-foreground shadow-warm-sm">
                      Save {discountPercent}%
                    </Badge>
                  )}
                  {category && (
                    <Badge variant="secondary">{category.name}</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl">
                  {product.title}
                </h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-heading price ${hasDiscount ? "text-accent" : "text-primary"}`}>
                  {formatPrice(price)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through price">
                    {formatPrice(compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {inStock ? (
                  <>
                    <Check className="h-5 w-5 text-success" />
                    <span className="text-success font-medium">
                      {inventoryQuantity <= 5 && inventoryQuantity > 0
                        ? `Only ${inventoryQuantity} left in stock`
                        : "In Stock"}
                    </span>
                  </>
                ) : (
                  <span className="text-destructive font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              <Separator />

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              <Separator />

              {/* Add to Cart */}
              <AddToCartButton
                productId={product.id}
                variantId={product.variants[0]?.id || product.id}
                productTitle={product.title}
                productThumbnail={product.thumbnail}
                productPrice={price}
                inStock={inStock}
                maxQuantity={inventoryQuantity}
              />

              {/* Wishlist Button */}
              <WishlistButton
                productId={product.id}
                variantId={product.variants[0]?.id || product.id}
                title={product.title}
                thumbnail={product.thumbnail}
                price={price}
                handle={product.handle}
                variant="full"
                size="lg"
                className="w-full"
              />

              {/* Trust Signals */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Free Delivery
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Warranty Included
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Easy Returns
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          {specifications.length > 0 && (
            <div className="mt-12">
              <ProductSpecs specifications={specifications} />
            </div>
          )}

          {/* Customer Reviews */}
          <div className="mt-16">
            <ProductReviews productHandle={product.handle} />
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <div className="space-y-2 mb-8">
                <p className="text-sm uppercase tracking-[0.15em] text-primary font-medium">
                  Recommended
                </p>
                <h2>You May Also Like</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} {...relatedProduct} />
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await fetchProductByHandle(handle);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.title,
    description: product.description?.slice(0, 160) || `Shop ${product.title} at Romart Electronics`,
  };
}
