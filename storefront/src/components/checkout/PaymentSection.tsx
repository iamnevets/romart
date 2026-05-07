"use client";

import { useState, useEffect } from "react";
import { CreditCard, Loader2, AlertCircle, ShieldCheck, Truck, RefreshCcw, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { ShippingFormData } from "./ShippingForm";
import { initializePaystack, generatePaymentReference, PaystackResponse } from "@/lib/paystack";
import { usePaymentProviders } from "@/lib/use-payment-providers";
import { useShippingOptions } from "@/lib/use-shipping-options";
import { addShippingAddress, addShippingMethod, completeCheckout, verifyPayment, sendOrderConfirmationEmail } from "@/lib/api";

interface PaymentSectionProps {
  shippingData: ShippingFormData;
  onSuccess: (orderId: string) => void;
  onBack: () => void;
}

export function PaymentSection({ shippingData, onSuccess, onBack }: PaymentSectionProps) {
  const { items, subtotal, clearCart, cartId, setShippingAddress, setEmail } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false);

  // Fetch shipping options and payment providers (ready for backend integration)
  const {
    shippingOptions,
    selectedOption: selectedShipping,
    selectOption: selectShippingOption,
    isLoading: shippingLoading,
  } = useShippingOptions(subtotal, shippingData.region);

  const {
    providers: paymentProviders,
    selectedProvider,
    selectProvider,
    isLoading: providersLoading,
  } = usePaymentProviders();

  // Add shipping address to cart when component mounts (if we have a Medusa cart)
  useEffect(() => {
    const prepareCheckout = async () => {
      if (!cartId) return;

      setIsPreparingCheckout(true);
      try {
        // Add shipping address and email to cart
        await addShippingAddress(
          cartId,
          {
            first_name: shippingData.firstName,
            last_name: shippingData.lastName,
            address_1: shippingData.address,
            city: shippingData.city,
            province: shippingData.region,
            country_code: "gh", // Ghana
            phone: shippingData.phone,
          },
          shippingData.email
        );

        // Also update via cart context
        await setShippingAddress({
          first_name: shippingData.firstName,
          last_name: shippingData.lastName,
          address_1: shippingData.address,
          city: shippingData.city,
          province: shippingData.region,
          country_code: "gh",
          phone: shippingData.phone,
        });
        await setEmail(shippingData.email);
      } catch (err) {
        console.warn("Failed to add shipping to Medusa cart:", err);
      } finally {
        setIsPreparingCheckout(false);
      }
    };

    prepareCheckout();
  }, [cartId, shippingData, setShippingAddress, setEmail]);

  // Add shipping method when selected
  useEffect(() => {
    const updateShippingMethod = async () => {
      if (!cartId || !selectedShipping) return;

      try {
        await addShippingMethod(cartId, selectedShipping.id);
      } catch (err) {
        console.warn("Failed to add shipping method:", err);
      }
    };

    updateShippingMethod();
  }, [cartId, selectedShipping]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount / 100);
  };

  const shippingCost = selectedShipping?.amount ?? 0;
  const total = subtotal + shippingCost;

  const handlePayment = async () => {
    setError(null);
    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!paystackPublicKey) {
      setError(
        "Payment system not configured. Please add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your environment variables."
      );
      return;
    }

    setIsProcessing(true);

    try {
      const paymentReference = generatePaymentReference();

      // Prepare order data
      const orderData = {
        id: `ORD-${Date.now()}`,
        reference: paymentReference,
        items: items.map((item) => ({
          productId: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        shipping: shippingData,
        shippingMethod: selectedShipping ? {
          id: selectedShipping.id,
          name: selectedShipping.name,
          cost: selectedShipping.amount,
        } : null,
        paymentMethod: selectedProvider?.name || "Paystack",
        subtotal,
        shippingCost,
        total,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      // Initialize Paystack payment
      await initializePaystack({
        key: paystackPublicKey,
        email: shippingData.email,
        amount: total, // Amount in pesewas
        currency: "GHS",
        ref: paymentReference,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: `${shippingData.firstName} ${shippingData.lastName}`,
            },
            {
              display_name: "Phone Number",
              variable_name: "phone",
              value: shippingData.phone,
            },
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: orderData.id,
            },
          ],
          order_id: orderData.id,
          customer_name: `${shippingData.firstName} ${shippingData.lastName}`,
          items_count: items.length,
        },
        onSuccess: async (response: PaystackResponse) => {
          console.log("Paystack callback received:", response);

          let finalOrderId = orderData.id;

          // CRITICAL: Verify payment server-side before confirming order
          // This prevents fraud from bypassing client-side payment
          const verification = await verifyPayment(response.reference, orderData.id);

          if (!verification.verified) {
            console.error("Payment verification failed:", verification.message);
            setError(
              verification.message ||
                "Payment could not be verified. Please contact support with reference: " +
                  response.reference
            );
            setIsProcessing(false);
            return;
          }

          console.log("Payment verified successfully:", verification.payment);

          // Try to complete checkout via Medusa if we have a cart ID
          if (cartId) {
            try {
              const medusaOrder = await completeCheckout(cartId, {
                reference: response.reference,
                transaction: String(response.transaction),
              });

              if (medusaOrder) {
                finalOrderId = medusaOrder.id;
                console.log("Order created in Medusa:", medusaOrder.id);
              }
            } catch (err) {
              console.warn("Failed to complete Medusa checkout, using fallback:", err);
            }
          }

          // Update order status for fallback storage
          const updatedOrder = {
            ...orderData,
            id: finalOrderId,
            status: "paid",
            paymentReference: response.reference,
            transactionId: response.transaction,
            verifiedAt: new Date().toISOString(),
            paidAt: verification.payment?.paidAt || new Date().toISOString(),
          };

          // Store order in localStorage as backup
          const existingOrders = JSON.parse(
            localStorage.getItem("romart-orders") || "[]"
          );
          localStorage.setItem(
            "romart-orders",
            JSON.stringify([...existingOrders, updatedOrder])
          );

          // Send order confirmation email (async, don't block)
          sendOrderConfirmationEmail({
            orderId: finalOrderId,
            customerName: `${shippingData.firstName} ${shippingData.lastName}`,
            customerEmail: shippingData.email,
            items: items.map((item) => ({
              title: item.title,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal,
            shippingCost,
            total,
            shippingAddress: {
              address: shippingData.address,
              city: shippingData.city,
              region: shippingData.region,
            },
            paymentReference: response.reference,
          }).then((emailResult) => {
            if (emailResult.emailSent) {
              console.log("Order confirmation email sent");
            } else {
              console.warn("Order confirmation email not sent:", emailResult.message);
            }
          });

          // Clear cart
          await clearCart();

          // Redirect to success page
          onSuccess(finalOrderId);
        },
        onClose: () => {
          console.log("Payment popup closed");
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Payment initialization error:", error);
      setError(
        "Failed to initialize payment. Please check your internet connection and try again."
      );
      setIsProcessing(false);
    }
  };

  const isLoading = shippingLoading || providersLoading || isPreparingCheckout;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Delivery & Payment</h2>
        <p className="text-sm text-muted-foreground">
          Choose your delivery method and complete your purchase
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Payment Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Method Selection */}
      <div className="rounded-lg border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Delivery Method
        </h3>

        {shippingLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading delivery options...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedShipping?.id === option.id
                    ? "bg-primary/5 border-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  value={option.id}
                  checked={selectedShipping?.id === option.id}
                  onChange={() => selectShippingOption(option.id)}
                  className="h-4 w-4 text-primary"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{option.name}</p>
                    <p className="font-medium">
                      {option.amount === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatPrice(option.amount)
                      )}
                    </p>
                  </div>
                  {option.description && (
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  )}
                  {option.estimatedDays && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated: {option.estimatedDays}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="rounded-lg border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </h3>

        {providersLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading payment options...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentProviders.map((provider) => (
              <label
                key={provider.id}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProvider?.id === provider.id
                    ? "bg-primary/5 border-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={provider.id}
                  checked={selectedProvider?.id === provider.id}
                  onChange={() => selectProvider(provider.id)}
                  className="h-4 w-4 text-primary"
                />
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                </div>
              </label>
            ))}

            {selectedProvider?.supportedMethods && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-2">Accepted Payment Methods:</p>
                <ul className="space-y-1 text-muted-foreground">
                  {selectedProvider.supportedMethods.map((method, index) => (
                    <li key={index}>• {method}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="rounded-lg border p-6 bg-muted/30">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Shipping ({selectedShipping?.name || "Standard"})
            </span>
            <span className="font-medium">
              {shippingCost === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(shippingCost)
              )}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-lg text-primary">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <p>
            Shipping to: {shippingData.address}, {shippingData.city}, {shippingData.region}
          </p>
          <p className="mt-1">Contact: {shippingData.email} | {shippingData.phone}</p>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <ShieldCheck className="h-5 w-5" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Truck className="h-5 w-5" />
          <span>Fast Delivery</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <RefreshCcw className="h-5 w-5" />
          <span>Easy Returns</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Phone className="h-5 w-5" />
          <span>24/7 Support</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isProcessing || isLoading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          size="lg"
          onClick={handlePayment}
          disabled={isProcessing || isLoading || !selectedProvider || !selectedShipping}
          className="flex-1 gap-2 h-12"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" />
              Pay {formatPrice(total)}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        By completing this purchase, you agree to our{" "}
        <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and{" "}
        <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
      </p>
    </div>
  );
}
