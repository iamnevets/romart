"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { WishlistButton } from "./WishlistButton";

export interface ProductCardProps {
  id: string;
  title: string;
  thumbnail: string | null;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  handle: string;
  inStock?: boolean;
  isNew?: boolean;
  variantId?: string;
}

export function ProductCard({
  id,
  title,
  thumbnail,
  price,
  compareAtPrice,
  currency = "GHS",
  handle,
  inStock = true,
  isNew = false,
  variantId,
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();

  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;

    setIsLoading(true);
    try {
      await addItem({
        variantId: variantId || id,
        productId: id,
        title,
        thumbnail,
        price,
        quantity: 1,
      });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="group relative overflow-hidden card-hover border-0 shadow-warm bg-card">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {isNew && (
          <Badge className="bg-secondary text-secondary-foreground shadow-warm-sm font-medium">
            New Arrival
          </Badge>
        )}
        {hasDiscount && (
          <Badge className="bg-accent text-accent-foreground shadow-warm-sm font-medium">
            -{discountPercent}% Off
          </Badge>
        )}
        {!inStock && (
          <Badge variant="secondary" className="bg-muted/80 backdrop-blur-sm text-muted-foreground">
            Out of Stock
          </Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <WishlistButton
          productId={id}
          variantId={variantId || id}
          title={title}
          thumbnail={thumbnail}
          price={price}
          handle={handle}
          className="bg-card/80 backdrop-blur-sm shadow-warm-sm hover:bg-card"
        />
      </div>

      {/* Image */}
      <Link href={`/products/${handle}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="font-heading text-3xl text-primary/50">
                  {title.charAt(0)}
                </span>
              </div>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <Link href={`/products/${handle}`}>
          <h3 className="font-medium line-clamp-2 leading-snug hover:text-primary transition-colors duration-200">
            {title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-xl font-heading price",
            hasDiscount ? "text-accent" : "text-primary"
          )}>
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through price">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <Button
          className={cn(
            "w-full gap-2 transition-all duration-300 h-11",
            !inStock && "opacity-50 cursor-not-allowed",
            isAdded && "bg-success hover:bg-success text-success-foreground"
          )}
          disabled={!inStock || isLoading}
          variant={inStock ? "default" : "secondary"}
          onClick={handleAddToCart}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isAdded ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          <span className="font-medium">
            {isAdded ? "Added to Cart!" : inStock ? "Add to Cart" : "Out of Stock"}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
