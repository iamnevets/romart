# Romart - Quick Start Commands

## First Time Setup

```bash
# 1. Start database services (PostgreSQL + Redis)
cd /Users/iam_nevets/Software\ Development/Projects/Romart
docker compose up -d

# 2. Start Medusa backend (in a new terminal)
cd /Users/iam_nevets/Software\ Development/Projects/Romart/backend/apps/backend
npm run dev

# 3. Start storefront (in a new terminal)
cd /Users/iam_nevets/Software\ Development/Projects/Romart/storefront
npm run dev
```

## Access URLs

| Service | URL |
|---------|-----|
| Storefront | http://localhost:3000 |
| Medusa Admin | http://localhost:9000/app |
| API Health Check | http://localhost:9000/health |

## Daily Development

```bash
# Terminal 1: Start databases (if not running)
docker compose up -d

# Terminal 2: Start backend
cd backend/apps/backend && npm run dev

# Terminal 3: Start storefront
cd storefront && npm run dev
```

## Stop Everything

```bash
# Stop storefront and backend: Ctrl+C in their terminals

# Stop database containers
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

## Check Status

```bash
# Check if databases are running
docker compose ps

# Check backend health
curl http://localhost:9000/health
```

## Troubleshooting

```bash
# Restart databases
docker compose restart

# View database logs
docker compose logs postgres
docker compose logs redis

# Rebuild storefront
cd storefront && npm run build
```
