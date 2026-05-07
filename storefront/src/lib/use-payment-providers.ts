"use client";

import { useState, useEffect } from "react";
// import { medusa } from "./medusa";

export interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  icon?: string; // Icon name from lucide-react
  supportedMethods?: string[];
}

interface UsePaymentProvidersResult {
  providers: PaymentProvider[];
  isLoading: boolean;
  error: Error | null;
  selectedProvider: PaymentProvider | null;
  selectProvider: (providerId: string) => void;
}

// Fallback payment providers when backend is unavailable
// In production, these should be fetched from Medusa backend
const FALLBACK_PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: "paystack",
    name: "Paystack",
    description: "Pay with Mobile Money, Card, or Bank Transfer",
    icon: "CreditCard",
    supportedMethods: [
      "Mobile Money (MTN, Vodafone, AirtelTigo)",
      "Debit/Credit Cards (Visa, Mastercard)",
      "Bank Transfer",
      "USSD",
    ],
  },
  // Add more providers as they become available in Medusa
  // {
  //   id: "manual",
  //   name: "Pay on Delivery",
  //   description: "Pay when your order arrives",
  //   icon: "Banknote",
  // },
];

export function usePaymentProviders(regionId?: string): UsePaymentProvidersResult {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPaymentProviders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Fetch payment providers from Medusa backend
        // When connecting to Medusa, use:
        // const { payment_providers } = await medusa.store.payment.listPaymentProviders({
        //   region_id: regionId
        // });
        //
        // Then map the providers to our PaymentProvider interface:
        // const mappedProviders = payment_providers.map(provider => ({
        //   id: provider.id,
        //   name: getProviderDisplayName(provider.id), // Map pp_stripe_stripe -> "Credit Card"
        //   description: getProviderDescription(provider.id),
        //   icon: getProviderIcon(provider.id),
        // }));

        // For now, use fallback providers
        setProviders(FALLBACK_PAYMENT_PROVIDERS);

        // Auto-select the first provider
        if (FALLBACK_PAYMENT_PROVIDERS.length > 0) {
          setSelectedProvider(FALLBACK_PAYMENT_PROVIDERS[0]);
        }
      } catch (err) {
        console.error("Failed to fetch payment providers:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch payment providers"));

        // Use fallback on error
        setProviders(FALLBACK_PAYMENT_PROVIDERS);
        setSelectedProvider(FALLBACK_PAYMENT_PROVIDERS[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentProviders();
  }, [regionId]);

  const selectProvider = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setSelectedProvider(provider);
    }
  };

  return {
    providers,
    isLoading,
    error,
    selectedProvider,
    selectProvider,
  };
}

// Helper functions for mapping Medusa payment provider IDs to display info
// These will be used when connecting to Medusa backend

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getProviderDisplayName(providerId: string): string {
  const displayNames: Record<string, string> = {
    "pp_stripe_stripe": "Credit/Debit Card",
    "pp_paystack": "Paystack",
    "pp_system_default": "Manual Payment",
    "pp_paypal": "PayPal",
  };
  return displayNames[providerId] || providerId;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getProviderDescription(providerId: string): string {
  const descriptions: Record<string, string> = {
    "pp_stripe_stripe": "Pay securely with Visa, Mastercard, or American Express",
    "pp_paystack": "Pay with Mobile Money, Card, or Bank Transfer",
    "pp_system_default": "Pay on delivery or via bank transfer",
    "pp_paypal": "Pay with your PayPal account",
  };
  return descriptions[providerId] || "Complete your payment";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getProviderIcon(providerId: string): string {
  const icons: Record<string, string> = {
    "pp_stripe_stripe": "CreditCard",
    "pp_paystack": "CreditCard",
    "pp_system_default": "Banknote",
    "pp_paypal": "Wallet",
  };
  return icons[providerId] || "CreditCard";
}
