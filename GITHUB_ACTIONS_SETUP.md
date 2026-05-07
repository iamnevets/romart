# GitHub Actions CI/CD Setup

Automated deployment pipeline that builds and deploys Romart on every push to `main`.

## How It Works

```
Push to main → GitHub Actions builds → Deploy to EC2 → Restart services
```

**Build happens on GitHub runners (7GB RAM)** - no memory issues!

---

## Setup Instructions

### Step 1: Add GitHub Secrets

Go to your repository: https://github.com/iamnevets/romart/settings/secrets/actions

Click **"New repository secret"** and add these:

#### 1. `EC2_SSH_KEY`
**Value:** Your private SSH key content

```bash
cat ~/.ssh/romart-ec2-key.pem
```

Copy the **entire output** (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

#### 2. `EC2_HOST`
**Value:** `99.80.98.247`

#### 3. `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
**Value:**
- Production: `https://api.romart.com` (after domain setup)
- For now: `http://99.80.98.247:9000`

#### 4. `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
**Value:** Get this from Medusa Admin after first deployment

**How to get it:**
1. SSH to server: `ssh -i ~/.ssh/romart-ec2-key.pem ubuntu@99.80.98.247`
2. Create admin user: `cd ~/romart/backend/apps/backend && npx medusa user -e admin@romart.com -p YOUR_PASSWORD`
3. Start backend temporarily: `npm run dev`
4. Visit `http://99.80.98.247:9000/app` in browser
5. Login → Settings → Publishable API Keys → Copy key
6. Add to GitHub secrets

#### 5. `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
**Value:** Your Paystack public key (production)
- Get from: https://dashboard.paystack.com/#/settings/developers
- Use: `pk_live_...` for production or `pk_test_...` for testing

---

### Step 2: Create Backend .env on Server

The workflow deploys code, but environment variables must be set on the server.

**SSH to server:**
```bash
ssh -i ~/.ssh/romart-ec2-key.pem ubuntu@99.80.98.247
```

**Create backend .env file:**
```bash
mkdir -p ~/romart/backend/apps/backend
cat > ~/romart/backend/apps/backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://medusa:NMaCq9b6dP1ZLYBo82TDVGds13EC5r2c@romart-postgres.c5q0ywmaipda.eu-west-1.rds.amazonaws.com:5432/medusa_db

# Redis
REDIS_URL=redis://romart-redis.owlmy5.0001.euw1.cache.amazonaws.com:6379

# JWT & Cookie Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=REPLACE_WITH_RANDOM_STRING
COOKIE_SECRET=REPLACE_WITH_RANDOM_STRING

# CORS (update after domain setup)
STORE_CORS=http://99.80.98.247,http://localhost:3000
ADMIN_CORS=http://99.80.98.247:9000,http://localhost:9000
AUTH_CORS=http://99.80.98.247,http://99.80.98.247:9000

# Paystack
PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY

# S3 Configuration
AWS_S3_BUCKET=romart-products-1778118128
AWS_S3_REGION=eu-west-1
AWS_ACCESS_KEY_ID=YOUR_S3_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_S3_SECRET_KEY

# Admin email
ADMIN_EMAIL=admin@romart.com

# Server config
NODE_ENV=production
PORT=9000
EOF
```

**Generate secrets:**
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "COOKIE_SECRET=$(openssl rand -base64 32)"
```

Update the `.env` file with the generated secrets.

**Create storefront .env file:**
```bash
mkdir -p ~/romart/storefront
cat > ~/romart/storefront/.env.local << 'EOF'
# These are placeholders - actual values come from GitHub secrets during build
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://99.80.98.247:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
EOF
```

---

### Step 3: Initial Deployment

Now trigger the first deployment:

**Option A: Push to GitHub**
```bash
cd /Users/iam_nevets/Software\ Development/Projects/Romart
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions CI/CD pipeline"
git push origin main
```

**Option B: Manual Trigger**
1. Go to: https://github.com/iamnevets/romart/actions
2. Click **"Deploy to AWS"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

---

### Step 4: Monitor Deployment

1. Go to: https://github.com/iamnevets/romart/actions
2. Click on the running workflow
3. Watch the build and deployment progress in real-time

**Expected duration:** 5-7 minutes
- Build Backend: ~2 min
- Build Storefront: ~2 min
- Deploy: ~1 min
- Restart services: ~30 sec

---

### Step 5: Verify Deployment

After successful deployment:

**Check backend:**
```bash
curl http://99.80.98.247:9000/health
```

**Check storefront:**
```bash
curl http://99.80.98.247:3000
```

**Check PM2 status:**
```bash
ssh -i ~/.ssh/romart-ec2-key.pem ubuntu@99.80.98.247 "pm2 list"
```

---

## Workflow Features

✅ **Automatic deployment** on push to `main`
✅ **Manual trigger** via GitHub Actions UI
✅ **Build caching** for faster subsequent builds
✅ **Zero-downtime deployment** (builds before stopping old version)
✅ **Database migrations** run automatically
✅ **PM2 process management** with auto-restart

---

## Deployment Process

When you push to `main`:

1. **GitHub Actions runner starts** (Ubuntu with 7GB RAM)
2. **Installs dependencies** and builds both backend + storefront
3. **Creates deployment package** (only production files, no source)
4. **Uploads to EC2** via secure SSH
5. **Stops running services** (gracefully)
6. **Extracts new files** to production directory
7. **Runs database migrations** (if any)
8. **Starts services** with PM2
9. **Saves PM2 config** for auto-restart on server reboot

---

## Troubleshooting

### Deployment failed at "Build Backend" or "Build Storefront"
- Check GitHub Actions logs for error details
- Usually a missing dependency or syntax error

### Deployment failed at "Deploy on EC2"
- Verify `EC2_SSH_KEY` secret is correct (include header/footer)
- Verify `EC2_HOST` secret is `99.80.98.247`
- Check if EC2 instance is running: `ssh -i ~/.ssh/romart-ec2-key.pem ubuntu@99.80.98.247`

### Services won't start after deployment
**SSH to server and check:**
```bash
ssh -i ~/.ssh/romart-ec2-key.pem ubuntu@99.80.98.247
pm2 logs romart-backend
pm2 logs romart-storefront
```

**Common issues:**
- Missing `.env` file → Create using Step 2 above
- Database connection error → Check DATABASE_URL in .env
- Port already in use → `pm2 delete all && pm2 flush`, then redeploy

### How to rollback a deployment
```bash
# Go to GitHub Actions
# Find the previous successful deployment
# Click "Re-run all jobs"
```

Or manually:
```bash
cd /Users/iam_nevets/Software\ Development/Projects/Romart
git log --oneline  # Find previous commit
git revert HEAD    # Revert last commit
git push origin main  # Triggers deployment of previous version
```

---

## Cost Savings

**Before (building on EC2):**
- Needed t3.medium (4GB) = $30/month
- Or add swap (slow builds, 10-15 min)

**After (building on GitHub Actions):**
- Can use t3.small (2GB) = $15/month
- Fast builds (3-5 min)
- 2000 free minutes/month on GitHub

**Savings: ~$15/month** 💰

---

## Future Improvements

Once this works, you can add:

- **Run tests** before deployment
- **Lint code** in pipeline
- **Build Docker images** instead of raw files
- **Deploy to staging** environment first
- **Slack/Discord notifications** on deployment
- **Automated rollback** on health check failure

---

## Next Steps

1. ✅ Add GitHub secrets (Step 1)
2. ✅ Create .env files on server (Step 2)
3. ✅ Push workflow to GitHub (Step 3)
4. ✅ Monitor first deployment (Step 4)
5. ✅ Verify services are running (Step 5)

After successful deployment, you can configure Nginx and SSL certificates.
