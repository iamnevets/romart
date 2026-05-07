"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";

export function CartSummary() {
  const { items, subtotal } = useCart();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);
  };

  // Shipping calculation (free over GHS 500)
  const shippingThreshold = 50000; // GHS 500 in pesewas
  const shippingCost = subtotal >= shippingThreshold ? 0 : 5000; // GHS 50 shipping fee
  const total = subtotal + shippingCost;

  const amountToFreeShipping = shippingThreshold - subtotal;

  return (
    <div className="rounded-lg border p-6 space-y-4 sticky top-24">
      <h2 className="font-semibold text-lg">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
            items)
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shippingCost === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(shippingCost)
            )}
          </span>
        </div>
      </div>

      {amountToFreeShipping > 0 && (
        <div className="bg-primary/10 rounded-md p-3">
          <p className="text-sm text-primary">
            Add {formatPrice(amountToFreeShipping)} more for free shipping!
          </p>
          <div className="mt-2 h-2 rounded-full bg-primary/20 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.min((subtotal / shippingThreshold) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <Separator />

      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <Link href="/checkout">
        <Button size="lg" className="w-full gap-2">
          Proceed to Checkout
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      <p className="text-xs text-muted-foreground text-center">
        Taxes calculated at checkout
      </p>
    </div>
  );
}
