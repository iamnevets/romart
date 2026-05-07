"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Header, Footer, Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);
  };

  const handleAddToCart = async (item: typeof items[0]) => {
    setAddingToCart(item.productId);
    try {
      await addItem({
        variantId: item.variantId,
        productId: item.productId,
        title: item.title,
        thumbnail: item.thumbnail,
        price: item.price,
        quantity: 1,
      });
      // Optionally remove from wishlist after adding to cart
      // removeFromWishlist(item.productId);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 py-8">
        <Container>
          {/* Page Header */}
          <div className="mb-8 space-y-2">
            <p className="text-sm uppercase tracking-[0.15em] text-primary font-medium">
              Your Collection
            </p>
            <div className="flex items-center justify-between">
              <h1 className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-primary" />
                Wishlist
              </h1>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearWishlist}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            <p className="text-muted-foreground">
              {items.length === 0
                ? "Your wishlist is empty"
                : `${items.length} ${items.length === 1 ? "item" : "items"} saved`}
            </p>
          </div>

          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center py-16 rounded-lg border bg-muted/30">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Save items you love by clicking the heart icon on any product.
                They&apos;ll appear here for easy access.
              </p>
              <Link href="/products">
                <Button className="gap-2">
                  Browse Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* Wishlist Items */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <Card
                  key={item.productId}
                  className="group relative overflow-hidden border-0 shadow-warm bg-card"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-warm-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Image */}
                  <Link href={`/products/${item.handle}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="font-heading text-3xl text-primary/50">
                              {item.title.charAt(0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-4 space-y-3">
                    {/* Title */}
                    <Link href={`/products/${item.handle}`}>
                      <h3 className="font-medium line-clamp-2 leading-snug hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                    </Link>

                    {/* Price */}
                    <span className="text-xl font-heading text-primary price">
                      {formatPrice(item.price)}
                    </span>

                    {/* Add to Cart Button */}
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleAddToCart(item)}
                      disabled={addingToCart === item.productId}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {addingToCart === item.productId ? "Adding..." : "Add to Cart"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
