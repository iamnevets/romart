# Romart Electronics Shop - Implementation Plan

> **Plan Location**: This plan is saved at:
> - `/Users/iam_nevets/.claude/plans/wondrous-nibbling-elephant.md` (Claude internal)
> - `/Users/iam_nevets/Software Development/Projects/Romart/PLAN.md` (Project copy)

## Overview
Build an e-commerce website for an electronics shop (fridges, stoves, air conditioners, etc.) using **Medusa.js** as the headless backend with a **Next.js** storefront.

## Why Medusa.js + Next.js?
- **TypeScript-native**: Aligns with your preferred stack
- **Built-in inventory management**: Stock tracking, low-stock handling out of the box
- **Modular architecture**: Use only what you need, extend what you want
- **Full customization**: Own your frontend entirely, no template constraints
- **Active ecosystem**: ~27K GitHub stars, good documentation, plugin marketplace
- **Cost-effective**: Open-source, self-hostable on VPS (~$10-20/mo)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js       │────▶│   Medusa.js     │────▶│   PostgreSQL    │
│   Storefront    │ API │   Backend       │     │   Database      │
│   (Frontend)    │◀────│   (Headless)    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │   Redis         │
        │               │   (Sessions)    │
        │               └─────────────────┘
        ▼
┌─────────────────┐
│   Stripe/       │
│   Paystack      │
│   (Payments)    │
└─────────────────┘
```

---

## Core Features

### Phase 1: Foundation ✅
- [x] Medusa backend setup with PostgreSQL
- [x] Next.js storefront with TypeScript
- [x] Product catalog with categories (Fridges, Stoves, ACs, etc.)
- [x] Product detail pages with images, specs, pricing
- [x] Shopping cart functionality (client-side)
- [x] Basic filtering and sorting
- [x] Product search functionality

### Phase 2: E-commerce Essentials ✅
- [x] Checkout flow (3-step: Shipping → Review → Payment)
- [x] Payment integration (Paystack Inline/Popup)
- [x] Order management (localStorage - temporary)
- [x] Order confirmation page
- [x] Backend payment verification
- [x] Paystack webhooks
- [x] Email notifications (order confirmation via Resend)
- [ ] Customer accounts (optional - can do guest checkout)

### Phase 3: Inventory & Admin ✅
- [x] Connect cart to Medusa API
- [x] Connect products to Medusa API (with fallback data)
- [x] Connect checkout to Medusa API
- [x] Inventory tracking (stock display, quantity limits, low stock warnings)
- [x] Admin dashboard (Medusa Admin UI - available)
- [x] Product management via Medusa Admin
- [x] Order fulfillment workflow (shipping/delivery notifications)
- [x] Low-stock alerts (admin notifications via email)

### Phase 4: Enhancements ✅
- [x] Product reviews
- [x] Wishlist functionality
- [x] Related products section (implemented)
- [ ] Warranty tracking system (if needed)
- [ ] Analytics integration

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | Medusa.js 2.x |
| Database | PostgreSQL |
| Cache/Sessions | Redis |
| Payments | Paystack |
| File Storage | MinIO (self-hosted) or Cloudinary |
| Hosting | DigitalOcean Droplet or Railway |

---

## UI/Design System

### Design Approach
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for pre-built accessible components (buttons, modals, forms, etc.)
- **Responsive-first**: Mobile → Tablet → Desktop

### Component Library Structure
```
components/
├── ui/                    # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/                # Layout components
│   ├── Header.tsx         # Navigation, cart icon, search
│   ├── Footer.tsx
│   ├── Sidebar.tsx        # Category filters (mobile drawer)
│   └── Container.tsx
├── product/               # Product-specific components
│   ├── ProductCard.tsx    # Grid item display
│   ├── ProductGallery.tsx # Image carousel/zoom
│   ├── ProductSpecs.tsx   # Specifications table
│   └── ProductFilters.tsx # Category, price, brand filters
├── cart/                  # Cart components
│   ├── CartItem.tsx
│   ├── CartSummary.tsx
│   └── CartDrawer.tsx     # Slide-out cart
└── checkout/              # Checkout components
    ├── CheckoutForm.tsx
    ├── PaymentSection.tsx
    └── OrderSummary.tsx
```

### Key Pages Design

**Homepage**
- Hero banner with featured products/promotions
- Category cards (Fridges, Stoves, ACs, etc.) with images
- Featured/New arrivals product grid
- Trust signals (delivery info, warranty info, contact)

**Product Listing Page (PLP)**
- Sidebar filters: Category, Price range, Brand
- Sort: Price (low-high, high-low), Newest, Popular
- Product grid with image, name, price, "Add to Cart"
- Pagination or infinite scroll

**Product Detail Page (PDP)**
- Image gallery with zoom capability
- Product info: Name, price, description
- Specifications table (dimensions, power, features)
- Quantity selector + Add to Cart button
- Stock availability indicator
- Related products section

**Cart & Checkout**
- Slide-out cart drawer for quick view
- Full cart page with quantity controls
- Multi-step checkout: Shipping → Payment → Confirmation

### Color Palette (Suggestion)
```css
--primary: #2563eb;       /* Blue - trust, electronics */
--secondary: #64748b;     /* Slate gray */
--accent: #f59e0b;        /* Amber - highlights, CTAs */
--background: #ffffff;
--foreground: #0f172a;
--muted: #f1f5f9;
```

### Typography
- **Headings**: Inter or Geist Sans (modern, clean)
- **Body**: Same family, good readability
- Font sizes follow Tailwind's scale

---

## Security Considerations

### Authentication & Authorization
- **Admin access**: Medusa Admin uses JWT + secure sessions
- **Customer accounts**: Optional; if enabled, use bcrypt password hashing (Medusa default)
- **API authentication**: Medusa uses publishable API keys for storefront, secret keys for admin

### Payment Security
- **Never handle raw card data**: Paystack handles card collection via their SDK/popup
- **Webhook verification**: Always verify Paystack webhook signatures
- **HTTPS only**: All payment flows must be over TLS

### Data Protection
- **Environment variables**: Store secrets (API keys, DB credentials) in `.env`, never commit
- **Input validation**: Validate all user inputs server-side (Medusa handles most of this)
- **SQL injection**: Medusa uses MikroORM with parameterized queries (protected by default)
- **XSS prevention**: React auto-escapes output; avoid `dangerouslySetInnerHTML`

### Infrastructure Security
- **Firewall**: Only expose ports 80/443; DB and Redis should be internal only
- **SSL/TLS**: Use Let's Encrypt with auto-renewal (certbot)
- **Regular updates**: Keep Node.js, Medusa, and dependencies updated
- **Rate limiting**: Consider nginx rate limiting for API endpoints

### OWASP Top 10 Checklist
| Risk | Mitigation |
|------|------------|
| Injection | Parameterized queries (ORM default) |
| Broken Auth | Secure session handling, JWT |
| Sensitive Data Exposure | HTTPS, encrypted secrets |
| XXE | Not applicable (JSON APIs) |
| Broken Access Control | Medusa role-based access |
| Security Misconfiguration | Production env config, no debug |
| XSS | React escaping, CSP headers |
| Insecure Deserialization | Validate incoming data |
| Vulnerable Dependencies | npm audit, regular updates |
| Insufficient Logging | Log auth attempts, orders |

### Recommended Security Headers (nginx)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

---

## Hosting Setup (VPS)

**Recommended: DigitalOcean Droplet ($12-24/mo)**
- 2GB RAM / 1 vCPU minimum
- Docker Compose for easy deployment
- Nginx as reverse proxy
- SSL via Let's Encrypt (free)

**Alternative: Railway (~$5-20/mo usage-based)**
- Simpler deployment, less DevOps
- PostgreSQL and Redis add-ons available

---

## Project Structure

```
romart/
├── backend/                 # Medusa.js backend
│   ├── src/
│   │   ├── api/            # Custom API routes
│   │   ├── services/       # Custom services
│   │   ├── models/         # Extended models
│   │   └── subscribers/    # Event handlers
│   ├── medusa-config.js
│   └── package.json
│
├── storefront/             # Next.js frontend
│   ├── app/
│   │   ├── (main)/        # Main store pages
│   │   ├── products/      # Product pages
│   │   ├── cart/          # Cart page
│   │   └── checkout/      # Checkout flow
│   ├── components/
│   ├── lib/               # API clients, utils
│   └── package.json
│
├── docker-compose.yml      # Local dev & production
└── README.md
```

---

## Payment Integration: Paystack

**Approach:** Build a custom Paystack payment provider for Medusa

Medusa's payment provider architecture makes this straightforward:
1. Create a Paystack service extending `AbstractPaymentProvider`
2. Implement `initiatePayment`, `capturePayment`, `refundPayment` methods
3. Handle Paystack webhooks for payment confirmations

**Reference:**
- [Medusa Payment Provider Guide](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider)
- [Paystack API Documentation](https://paystack.com/docs/api/)

This is a one-time setup that will work for all transactions.

---

## Development Steps

### Step 0: Setup Claude Code Skills & MCP (Recommended)
```bash
# Install Medusa's e-commerce storefront skill (best practices embedded)
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install ecommerce-storefront@medusa

# Add Medusa MCP server (docs + API verification)
claude mcp add --transport http medusa https://docs.medusajs.com/mcp
```

**What this gives us:**
- Best practices for product listing pages with filtering/sorting
- Multi-step checkout flow patterns
- Responsive navigation with cart indicators
- Product detail pages with image galleries, variant selection
- Homepage layouts (hero, featured categories, promotions)

### Step 1: Setup Medusa Backend
```bash
npx create-medusa-app@latest romart-backend
cd romart-backend
# Configure PostgreSQL connection
# Start with: npx medusa develop
```

### Step 2: Setup Next.js Storefront
```bash
npx create-next-app@latest romart-storefront --typescript --tailwind
# Or use Medusa's Next.js starter:
# npx create-medusa-app@latest --with-nextjs-starter
```

### Step 3: Configure Products
- Use Medusa Admin UI to add product categories
- Add products with images, descriptions, prices
- Set up inventory levels

### Step 4: Customize Storefront
- Design homepage with featured products
- Build product listing pages
- Implement cart and checkout

### Step 5: Payment & Deployment
- Integrate payment provider
- Set up VPS with Docker
- Configure domain and SSL

---

## Verification Plan

1. **Local Development**: Run Medusa backend + Next.js storefront locally
2. **Admin Testing**: Add products via Medusa Admin, verify they appear on storefront
3. **Cart Flow**: Add to cart → Update quantity → Remove → Proceed to checkout
4. **Checkout Flow**: Complete test purchase with Stripe test mode
5. **Inventory**: Verify stock decrements after purchase
6. **Deployment**: Deploy to VPS, test full flow in production

---

## Estimated Timeline

| Phase | Scope |
|-------|-------|
| Phase 1 | Foundation setup, basic storefront |
| Phase 2 | Checkout, payments, orders |
| Phase 3 | Inventory, admin polish |
| Phase 4 | Enhancements as needed |

---

## Resources

- [Medusa Documentation](https://docs.medusajs.com/)
- [Medusa Next.js Starter](https://github.com/medusajs/nextjs-starter-medusa)
- [Medusa Admin](https://docs.medusajs.com/admin/quickstart)
- [Claude Code E-Commerce Skill](https://medusajs.com/blog/claude-code-ecommerce-storefront/) - Best practices for AI-assisted storefront development
- [Medusa Agent Skills Repo](https://github.com/medusajs/medusa-agent-skills)

---

## Sources

- [Medusa vs Saleor vs Vendure Comparison 2026](https://www.pkgpulse.com/blog/medusa-vs-saleor-vs-vendure-headless-ecommerce-2026)
- [Why MedusaJS is the Future of Headless Ecommerce](https://www.linearloop.io/blog/medusa-js-headless-ecommerce-guide)
- [Best Open Source Ecommerce Platforms 2026](https://www.shopify.com/blog/open-source-ecommerce)
- [Headless Platform Comparison](https://www.buildwithmatija.com/blog/headless-ecommerce-platforms-comparison)
