"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, CartItem as CartItemType } from "@/lib/cart-context";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);
  };

  return (
    <div className="flex gap-4 py-4">
      {/* Product Image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <Link
            href={`/products/${item.productId}`}
            className="font-medium hover:text-primary transition-colors line-clamp-2"
          >
            {item.title}
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeItem(item.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-1">
          {formatPrice(item.price)} each
        </p>

        <div className="flex items-center justify-between mt-auto">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="rounded-r-none"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= (item.maxQuantity || 10)}
              className="rounded-l-none"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Item Total */}
          <span className="font-semibold">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
