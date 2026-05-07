# Romart Electronics Shop

A Ghanaian e-commerce platform for electronics and home appliances, built with Medusa.js (headless backend) and Next.js (storefront).

**Currency**: Ghanaian Cedis (GHS)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Medusa.js 2.x |
| Database | PostgreSQL 15 |
| Cache/Sessions | Redis 7 |
| Payments | Paystack |

## Project Structure

```
romart/
├── backend/                 # Medusa.js backend (monorepo)
│   └── apps/
│       └── backend/         # Main Medusa application
├── storefront/              # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── product/     # Product components
│   │   │   └── cart/        # Cart components
│   │   └── lib/             # Utilities and context
│   └── public/              # Static assets
├── docker-compose.yml       # PostgreSQL & Redis containers
└── README.md
```

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

## Getting Started

### 1. Start Database Services

```bash
# From the project root
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 2. Start Medusa Backend

```bash
cd backend/apps/backend
npm run dev
```

The backend will be available at `http://localhost:9000`

**Admin Dashboard**: After starting, visit the URL shown in the terminal output to create your admin account.

### 3. Configure Publishable API Key

1. Log into the Medusa Admin at `http://localhost:9000/app`
2. Go to Settings > Publishable API Keys
3. Create a new key or copy the existing one
4. Add it to `storefront/.env.local`:

```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxxxxx
```

### 4. Start Storefront

```bash
cd storefront
npm run dev
```

The storefront will be available at `http://localhost:3000`

## Development

### Adding Products

1. Access the Medusa Admin dashboard
2. Navigate to Products > Add Product
3. Fill in product details, images, pricing, and inventory

### Product Categories

The storefront supports these categories:
- Fridges
- Stoves
- Air Conditioners
- Washing Machines
- Microwaves
- Dishwashers

Configure categories in Medusa Admin > Product Categories.

## Features

### Implemented (Phase 1)

- [x] Medusa backend with PostgreSQL
- [x] Next.js storefront with TypeScript
- [x] Tailwind CSS + shadcn/ui components
- [x] Product catalog with categories
- [x] Product detail pages with specifications
- [x] Shopping cart
- [x] Basic filtering and sorting
- [x] Responsive design

### Implemented (Phase 2)

- [x] Checkout flow (3-step process)
- [x] Paystack payment integration (Inline/Popup)
- [x] Order management (localStorage)
- [x] Order confirmation page

### Implemented (Phase 3)

- [x] Cart connected to Medusa API (full CRUD with fallback caching)
- [x] Backend payment verification endpoint
- [x] Paystack webhooks (charge.success, transfer, refund events)
- [x] Email notifications (order confirmation, low stock alerts)
- [x] Inventory tracking with Medusa (stock display, low stock monitoring)

### To Be Implemented (Phase 4+)

- [ ] Customer accounts
- [ ] Product search
- [ ] Product reviews

## Environment Variables

### Backend (`backend/apps/backend/.env`)

```env
DATABASE_URL=postgres://medusa:medusa_secret@localhost:5432/medusa_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:3000,http://localhost:9000
```

### Storefront (`storefront/.env.local`)

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_key
```

See [PAYSTACK_SETUP.md](./PAYSTACK_SETUP.md) for detailed Paystack configuration instructions.

## Deployment

See the [deployment section](./PLAN.md) in the implementation plan for VPS setup instructions.

## License

MIT
