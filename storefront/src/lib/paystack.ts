// Paystack Inline Integration
// Documentation: https://paystack.com/docs/payments/accept-payments/#popup

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // in pesewas (smallest currency unit)
  currency?: string;
  ref?: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
    [key: string]: any;
  };
  onSuccess?: (response: PaystackResponse) => void;
  onClose?: () => void;
}

export interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  trans: string;
  transaction: string;
  trxref: string;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

/**
 * Load Paystack inline script dynamically
 */
export const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.PaystackPop) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));

    document.body.appendChild(script);
  });
};

/**
 * Generate a unique payment reference
 */
export const generatePaymentReference = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `ROM-${timestamp}-${random}`;
};

/**
 * Initialize Paystack payment
 */
export const initializePaystack = async (config: PaystackConfig): Promise<void> => {
  try {
    // Ensure script is loaded
    await loadPaystackScript();

    // Setup payment
    const handler = window.PaystackPop.setup({
      ...config,
      currency: config.currency || "GHS",
      ref: config.ref || generatePaymentReference(),
    });

    // Open payment popup
    handler.openIframe();
  } catch (error) {
    console.error("Paystack initialization error:", error);
    throw error;
  }
};

/**
 * Verify payment on the backend (to be implemented)
 * This should be called after payment success to verify the transaction
 */
export const verifyPayment = async (reference: string): Promise<boolean> => {
  try {
    // TODO: Implement backend verification
    // This should call your backend API which then calls Paystack's verification endpoint
    // POST /api/verify-payment with { reference }

    console.log("Verifying payment:", reference);

    // For now, we'll assume verification is successful
    // In production, you MUST verify on the backend
    return true;
  } catch (error) {
    console.error("Payment verification error:", error);
    return false;
  }
};
