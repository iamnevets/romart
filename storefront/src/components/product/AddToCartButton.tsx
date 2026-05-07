"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";

interface AddToCartButtonProps {
  productId: string;
  productTitle: string;
  productThumbnail?: string | null;
  productPrice: number;
  variantId?: string;
  inStock: boolean;
  maxQuantity?: number;
}

export function AddToCartButton({
  productId,
  productTitle,
  productThumbnail,
  productPrice,
  variantId,
  inStock,
  maxQuantity = 10,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!inStock) return;

    setIsLoading(true);
    try {
      // Add item to cart
      await addItem({
        variantId: variantId || productId,
        productId,
        title: productTitle,
        thumbnail: productThumbnail || null,
        price: productPrice,
        quantity,
      });

      // Show success feedback
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);

      // Reset quantity
      setQuantity(1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center border rounded-lg">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || !inStock}
            className="rounded-r-none"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center tabular-nums">{quantity}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={increaseQuantity}
            disabled={quantity >= maxQuantity || !inStock}
            className="rounded-l-none"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className={cn(
          "w-full gap-2 transition-all",
          !inStock && "opacity-50 cursor-not-allowed",
          isAdded && "bg-green-600 hover:bg-green-600"
        )}
        disabled={!inStock || isLoading}
        onClick={handleAddToCart}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isAdded ? (
          <Check className="h-5 w-5" />
        ) : (
          <ShoppingCart className="h-5 w-5" />
        )}
        {isAdded
          ? "Added to Cart!"
          : inStock
            ? `Add to Cart - ${quantity} item${quantity > 1 ? "s" : ""}`
            : "Out of Stock"}
      </Button>

      {!inStock && (
        <p className="text-sm text-muted-foreground text-center">
          This product is currently out of stock. Please check back later.
        </p>
      )}
    </div>
  );
}
