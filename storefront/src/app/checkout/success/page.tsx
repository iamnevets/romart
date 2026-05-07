"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Mail, ArrowRight } from "lucide-react";
import { Header, Footer, Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  items: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  shipping: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  status: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  const orderId = searchParams.get("order");

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    // Retrieve order from localStorage
    const orders = JSON.parse(localStorage.getItem("romart-orders") || "[]");
    const foundOrder = orders.find((o: Order) => o.id === orderId);

    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      router.push("/");
    }
  }, [orderId, router]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. Your order has been received.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-background rounded-lg border p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Number
            </h3>
            <p className="text-sm text-muted-foreground font-mono">{order.id}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Confirmation Email
            </h3>
            <p className="text-sm text-muted-foreground">
              Sent to {order.shipping.email}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">
                    {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                  </p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Shipping Address */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Shipping Address</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              {order.shipping.firstName} {order.shipping.lastName}
            </p>
            <p>{order.shipping.address}</p>
            <p>
              {order.shipping.city}, {order.shipping.region}
            </p>
            <p className="pt-2">Phone: {order.shipping.phone}</p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Order Total */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {order.shippingCost === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(order.shippingCost)
              )}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-muted/30 rounded-lg border p-6 mb-6">
        <h3 className="font-semibold mb-3">What's Next?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>You'll receive an email confirmation shortly at {order.shipping.email}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>We'll notify you when your order ships</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Track your order status in your account dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Expected delivery: 2-5 business days</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/products" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            Continue Shopping
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button size="lg" className="w-full gap-2">
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Support */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Need help? Contact us at{" "}
          <a href="mailto:support@romart.com" className="text-primary hover:underline">
            support@romart.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <>
      <Header />
      <main className="flex-1 py-12 bg-muted/30">
        <Container>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            }
          >
            <SuccessContent />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}
