"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { Header, Footer, Container } from "@/components/layout";
import { ShippingForm, OrderReview, PaymentSection, ShippingFormData } from "@/components/checkout";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

type CheckoutStep = "shipping" | "review" | "payment";

const steps = [
  { id: "shipping" as const, name: "Shipping", number: 1 },
  { id: "review" as const, name: "Review", number: 2 },
  { id: "payment" as const, name: "Payment", number: 3 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && currentStep === "shipping") {
      router.push("/cart");
    }
  }, [items.length, currentStep, router]);

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setCurrentStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReviewContinue = () => {
    setCurrentStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentSuccess = (orderId: string) => {
    router.push(`/checkout/success?order=${orderId}`);
  };

  const handleBackToShipping = () => {
    setCurrentStep("shipping");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToReview = () => {
    setCurrentStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCurrentStepNumber = () => {
    return steps.find((s) => s.id === currentStep)?.number || 1;
  };

  return (
    <>
      <Header />
      <main className="flex-1 py-8 bg-muted/30">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                          getCurrentStepNumber() > step.number
                            ? "bg-primary border-primary text-primary-foreground"
                            : getCurrentStepNumber() === step.number
                              ? "border-primary text-primary font-semibold"
                              : "border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {getCurrentStepNumber() > step.number ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm mt-2 font-medium",
                          getCurrentStepNumber() >= step.number
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1 mx-4 transition-colors",
                          getCurrentStepNumber() > step.number
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-background rounded-lg border p-6 md:p-8">
              {currentStep === "shipping" && (
                <ShippingForm
                  onSubmit={handleShippingSubmit}
                  initialData={shippingData || undefined}
                />
              )}

              {currentStep === "review" && shippingData && (
                <OrderReview
                  shippingData={shippingData}
                  onEdit={handleBackToShipping}
                  onContinue={handleReviewContinue}
                />
              )}

              {currentStep === "payment" && shippingData && (
                <PaymentSection
                  shippingData={shippingData}
                  onSuccess={handlePaymentSuccess}
                  onBack={handleBackToReview}
                />
              )}
            </div>

            {/* Security Notice */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Secure Checkout</span>
                <span>•</span>
                <span>SSL Encrypted</span>
                <span>•</span>
                <span>PCI Compliant</span>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
