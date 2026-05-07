# Paystack Integration Guide

## Overview

Romart uses Paystack Inline (popup) for payment processing. This provides a seamless checkout experience where customers can pay using:
- Mobile Money (MTN, Vodafone, AirtelTigo)
- Debit/Credit Cards (Visa, Mastercard)
- Bank Transfer
- USSD

## Setup Instructions

### 1. Create a Paystack Account

1. Go to [Paystack](https://paystack.com/)
2. Sign up for a free account
3. Complete business verification (required for live transactions)

### 2. Get Your API Keys

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to **Settings > API Keys & Webhooks**
3. Copy your **Public Key**
   - Test key: `pk_test_xxxxxxxxxxxxxxxxx` (for development)
   - Live key: `pk_live_xxxxxxxxxxxxxxxxx` (for production)

### 3. Configure Environment Variables

Add your Paystack public key to `storefront/.env.local`:

```bash
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

**Important:**
- Use **test key** during development
- Use **live key** only in production
- Never commit API keys to version control

### 4. Test the Integration

1. Start the development server:
   ```bash
   cd storefront
   npm run dev
   ```

2. Add items to cart and proceed to checkout

3. On the payment page, click "Pay" to open Paystack popup

4. Use Paystack test cards for testing:
   ```
   Success: 4084084084084081
   CVV: 408
   Expiry: Any future date
   PIN: 0000
   OTP: 123456
   ```

### 5. Go Live

When ready for production:

1. Complete Paystack business verification
2. Activate your live mode in Paystack Dashboard
3. Update `.env.local` with your live public key
4. Test thoroughly before accepting real payments

## Payment Flow

```
1. Customer clicks "Pay" button
   ↓
2. Paystack popup opens
   ↓
3. Customer selects payment method
   ↓
4. Customer completes payment
   ↓
5. Paystack verifies transaction
   ↓
6. Order is created and saved
   ↓
7. Cart is cleared
   ↓
8. Customer sees order confirmation
```

## Security Notes

✅ **What's Implemented:**
- Client-side payment initialization
- Secure Paystack popup (PCI DSS compliant)
- Payment reference generation
- Order creation after successful payment
- Cart clearing

⚠️ **What's Needed for Production:**

1. **Backend Payment Verification**
   - Never trust client-side payment confirmation alone
   - Implement server-side verification endpoint
   - Call Paystack's verify endpoint from your backend
   - Example: `GET https://api.paystack.co/transaction/verify/:reference`

2. **Webhook Implementation**
   - Set up webhook URL in Paystack Dashboard
   - Handle `charge.success` event
   - Verify webhook signature
   - Update order status in database

3. **Database Integration**
   - Replace localStorage with proper database
   - Store orders in Medusa or separate database
   - Link payments to Medusa orders

## Test Cards

### Successful Transactions

| Card Number | Brand | CVV | PIN | OTP |
|-------------|-------|-----|-----|-----|
| 4084084084084081 | Visa | 408 | 0000 | 123456 |
| 5060666666666666666 | Verve | 123 | 1234 | 123456 |

### Failed Transactions

| Card Number | Reason |
|-------------|--------|
| 5060666666666666 | Insufficient funds |
| 507850785078507 | Card declined |

More test cards: https://paystack.com/docs/payments/test-payments

## Troubleshooting

### "Payment system not configured" Error
- Check that `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set in `.env.local`
- Restart the development server after adding env variables

### Paystack Popup Not Opening
- Check browser console for errors
- Ensure internet connection is stable
- Check if popup blocker is disabled
- Verify the public key is valid

### Payment Succeeds but Order Not Created
- Check browser console for errors
- Verify localStorage permissions
- Check that cart has items before payment

## Next Steps

For production deployment:

1. ✅ Complete Paystack business verification
2. ⬜ Implement backend payment verification API
3. ⬜ Set up Paystack webhooks
4. ⬜ Integrate with Medusa orders
5. ⬜ Add email notifications
6. ⬜ Implement order tracking

## Resources

- [Paystack Documentation](https://paystack.com/docs)
- [Inline Integration Guide](https://paystack.com/docs/payments/accept-payments/#popup)
- [Test Cards](https://paystack.com/docs/payments/test-payments)
- [API Reference](https://paystack.com/docs/api/)
- [Webhooks Guide](https://paystack.com/docs/payments/webhooks/)
