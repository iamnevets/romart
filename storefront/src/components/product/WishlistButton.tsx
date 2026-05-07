"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist-context";

interface WishlistButtonProps {
  productId: string;
  variantId: string;
  title: string;
  thumbnail: string | null;
  price: number;
  handle: string;
  className?: string;
  variant?: "icon" | "full";
  size?: "sm" | "default" | "lg";
}

export function WishlistButton({
  productId,
  variantId,
  title,
  thumbnail,
  price,
  handle,
  className,
  variant = "icon",
  size = "default",
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId,
      variantId,
      title,
      thumbnail,
      price,
      handle,
    });
  };

  if (variant === "full") {
    return (
      <Button
        variant={isWishlisted ? "secondary" : "outline"}
        size={size}
        onClick={handleClick}
        className={cn("gap-2", className)}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-all",
            isWishlisted && "fill-current text-red-500"
          )}
        />
        {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "rounded-full transition-all hover:scale-110",
        isWishlisted && "text-red-500 hover:text-red-600",
        className
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all",
          isWishlisted && "fill-current"
        )}
      />
    </Button>
  );
}
