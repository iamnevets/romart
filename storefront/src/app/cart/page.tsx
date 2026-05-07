"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { Header, Footer, Container } from "@/components/layout";
import { CartItem, CartSummary } from "@/components/cart";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const { items, itemCount, clearCart } = useCart();

  return (
    <>
      <Header />
      <main className="flex-1 py-8">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.15em] text-primary font-medium">
                Review
              </p>
              <h1>Shopping Cart</h1>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive gap-2"
                onClick={clearCart}
              >
                <Trash2 className="h-4 w-4" />
                Clear Cart
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-20 w-20 text-muted-foreground/50 mb-6" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Looks like you haven&apos;t added any items to your cart yet.
                Start shopping to find great deals on electronics and
                appliances!
              </p>
              <Link href="/products">
                <Button size="lg" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="rounded-lg border">
                  <div className="p-4 border-b bg-muted/30">
                    <span className="font-medium">
                      {itemCount} {itemCount === 1 ? "item" : "items"} in your
                      cart
                    </span>
                  </div>
                  <div className="divide-y px-4">
                    {items.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Link>
              </div>

              {/* Order Summary */}
              <div>
                <CartSummary />
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
