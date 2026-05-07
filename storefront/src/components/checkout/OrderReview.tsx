"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";
import { ShippingFormData } from "./ShippingForm";

interface OrderReviewProps {
  shippingData: ShippingFormData;
  onEdit: () => void;
  onContinue: () => void;
}

export function OrderReview({ shippingData, onEdit, onContinue }: OrderReviewProps) {
  const { items, subtotal } = useCart();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);
  };

  const shippingThreshold = 50000; // GHS 500
  const shippingCost = subtotal >= shippingThreshold ? 0 : 5000; // GHS 50
  const total = subtotal + shippingCost;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Order Review</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Review your order details before proceeding to payment
        </p>
      </div>

      {/* Shipping Information */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Shipping Information</h3>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">
              {shippingData.firstName} {shippingData.lastName}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{shippingData.email}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>{" "}
            <span className="font-medium">{shippingData.phone}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Address:</span>{" "}
            <span className="font-medium">
              {shippingData.address}, {shippingData.city}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Region:</span>{" "}
            <span className="font-medium">{shippingData.region}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-4">Order Items ({items.length})</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">
                  {formatPrice(item.price * item.quantity)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.price)} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shippingCost === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(shippingCost)
              )}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-lg">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={onContinue}>
        Continue to Payment
      </Button>
    </div>
  );
}
