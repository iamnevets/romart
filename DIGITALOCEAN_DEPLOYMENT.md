# DigitalOcean Deployment Guide - Romart

Complete guide to deploying Romart Electronics Shop on DigitalOcean.

## Cost Breakdown

| Service | Spec | Monthly Cost |
|---------|------|--------------|
| **Droplet (App Server)** | Basic 2GB RAM, 1 vCPU, 50GB SSD | $12/month |
| **Managed PostgreSQL** | Basic 1GB RAM | $15/month |
| **Managed Redis** | Basic 1GB RAM | $15/month |
| **Spaces (Object Storage)** | 250GB storage, 1TB transfer | $5/month |
| **Domain (optional)** | .com/.net from DO | $12/year |

**Total: ~$47/month + $12/year domain**

**Alternative cheaper option:** Run PostgreSQL + Redis on the same droplet = **$17/month**

---

## Prerequisites

1. DigitalOcean account (get $200 credit: https://m.do.co/c/your-referral)
2. Domain name (buy from DigitalOcean or use existing)
3. SSH key for server access
4. Paystack account configured (production keys)

---

## Part 1: Create Infrastructure

### 1.1 Create Droplet

```bash
# Option A: Via DigitalOcean Web UI
1. Go to https://cloud.digitalocean.com/droplets/new
2. Choose:
   - Image: Ubuntu 24.04 LTS
   - Plan: Basic ($12/mo - 2GB RAM, 1 vCPU, 50GB SSD)
   - Datacenter: Frankfurt (best for Ghana) or London
   - Add your SSH key
   - Hostname: romart-production
3. Click "Create Droplet"
```

### 1.2 Create Managed PostgreSQL Database

```bash
1. Go to Databases → Create Database
2. Choose:
   - Engine: PostgreSQL 15
   - Plan: Basic ($15/mo - 1GB RAM)
   - Datacenter: Same as droplet
   - Database name: medusa-db
3. Click "Create Database Cluster"
4. Wait 5-10 minutes for provisioning
5. Go to "Users & Databases" tab
   - Create database: medusa_db
   - Note down connection string
```

### 1.3 Create Managed Redis

```bash
1. Go to Databases → Create Database
2. Choose:
   - Engine: Redis 7
   - Plan: Basic ($15/mo - 1GB RAM)
   - Datacenter: Same as droplet
3. Click "Create Database Cluster"
4. Note down connection string (format: rediss://username:password@host:port)
```

### 1.4 Create Spaces (Object Storage)

```bash
1. Go to Spaces Object Storage → Create Space
2. Choose:
   - Datacenter: Same region as droplet
   - Enable CDN
   - Name: romart-products
   - Restrict File Listing: Yes
3. Click "Create Space"
4. Go to API → Spaces Keys → Generate New Key
   - Save Access Key and Secret Key
```

---

## Part 2: Server Setup

### 2.1 Connect to Droplet

```bash
# Get your droplet's IP from DigitalOcean dashboard
ssh root@your_droplet_ip
```

### 2.2 Initial Server Configuration

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install essential tools
apt install -y git nginx certbot python3-certbot-nginx

# Install Docker (for local PostgreSQL/Redis if not using managed services)
# curl -fsSL https://get.docker.com -o get-docker.sh
# sh get-docker.sh

# Install PM2 for process management
npm install -g pm2

# Create deployment user (security best practice)
adduser --disabled-password --gecos "" romart
usermod -aG sudo romart
mkdir -p /home/romart/.ssh
cp /root/.ssh/authorized_keys /home/romart/.ssh/
chown -R romart:romart /home/romart/.ssh
chmod 700 /home/romart/.ssh
chmod 600 /home/romart/.ssh/authorized_keys

# Switch to romart user
su - romart
```

---

## Part 3: Deploy Application

### 3.1 Clone Repository

```bash
# As romart user
cd /home/romart
git clone https://github.com/YOUR_USERNAME/romart.git
cd romart
```

### 3.2 Configure Backend Environment

```bash
cd backend/apps/backend

# Create .env file
nano .env
```

**Backend `.env` file:**
```env
# Database (from DigitalOcean PostgreSQL connection string)
DATABASE_URL=postgresql://doadmin:PASSWORD@your-db-host:25060/medusa_db?sslmode=require

# Redis (from DigitalOcean Redis connection string)
REDIS_URL=rediss://default:PASSWORD@your-redis-host:25061

# JWT & Cookie Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_here
COOKIE_SECRET=your_generated_cookie_secret_here

# CORS - Update with your domain
STORE_CORS=https://romart.com
ADMIN_CORS=https://admin.romart.com
AUTH_CORS=https://romart.com,https://admin.romart.com

# Paystack (Production keys)
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key

# Spaces/S3 for product images
SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
SPACES_BUCKET=romart-products
SPACES_ACCESS_KEY=your_spaces_access_key
SPACES_SECRET_KEY=your_spaces_secret_key
SPACES_REGION=fra1

# Admin email for notifications
ADMIN_EMAIL=admin@romart.com

# Server config
NODE_ENV=production
PORT=9000
```

### 3.3 Install and Build Backend

```bash
# Install dependencies
npm install

# Run migrations
npm run build
npx medusa migrations run

# Create admin user (first time only)
npx medusa user --email admin@romart.com --password YOUR_SECURE_PASSWORD

# Seed products (optional, if you have seed data)
# npm run seed
```

### 3.4 Configure Storefront Environment

```bash
cd /home/romart/romart/storefront

# Create .env.local file
nano .env.local
```

**Storefront `.env.local` file:**
```env
# Backend URL (use internal droplet IP initially, then domain after Nginx setup)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.romart.com

# Get this from Medusa Admin after first login
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxxxxx

# Paystack public key (production)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
```

### 3.5 Install and Build Storefront

```bash
npm install
npm run build
```

---

## Part 4: Process Management with PM2

### 4.1 Start Backend with PM2

```bash
cd /home/romart/romart/backend/apps/backend

# Start backend
pm2 start npm --name "romart-backend" -- run start

# Or if you have a start script:
# pm2 start "npm run start" --name "romart-backend"
```

### 4.2 Start Storefront with PM2

```bash
cd /home/romart/romart/storefront

# Start storefront
pm2 start npm --name "romart-storefront" -- run start
```

### 4.3 Configure PM2 Startup

```bash
# Save PM2 process list
pm2 save

# Generate startup script (auto-restart on server reboot)
pm2 startup systemd -u romart --hp /home/romart

# Copy and run the command that PM2 outputs (as root)
```

### 4.4 Check Status

```bash
# View all processes
pm2 list

# View logs
pm2 logs romart-backend
pm2 logs romart-storefront

# Monitor
pm2 monit
```

---

## Part 5: Nginx Configuration

### 5.1 Configure Nginx as Reverse Proxy

```bash
# Switch to root user
exit  # or su - root

# Create Nginx config for backend
nano /etc/nginx/sites-available/romart-backend
```

**Backend Nginx config (`/etc/nginx/sites-available/romart-backend`):**
```nginx
server {
    listen 80;
    server_name api.romart.com;

    # Increase timeout for long-running operations
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Storefront Nginx config (`/etc/nginx/sites-available/romart-storefront`):**
```bash
nano /etc/nginx/sites-available/romart-storefront
```

```nginx
server {
    listen 80;
    server_name romart.com www.romart.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Enable Sites and Restart Nginx

```bash
# Enable sites
ln -s /etc/nginx/sites-available/romart-backend /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/romart-storefront /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## Part 6: Domain and SSL Setup

### 6.1 Configure DNS

In DigitalOcean Networking → Domains:

```
1. Add domain: romart.com
2. Create A records:
   - @ → your_droplet_ip (romart.com)
   - www → your_droplet_ip (www.romart.com)
   - api → your_droplet_ip (api.romart.com)
```

Wait 5-10 minutes for DNS propagation.

### 6.2 Install SSL Certificates (Let's Encrypt)

```bash
# Install SSL for backend
certbot --nginx -d api.romart.com

# Install SSL for storefront
certbot --nginx -d romart.com -d www.romart.com

# Follow prompts, select "Redirect HTTP to HTTPS"
```

### 6.3 Auto-renewal Test

```bash
# Certbot auto-renews via systemd timer
systemctl status certbot.timer

# Test renewal
certbot renew --dry-run
```

---

## Part 7: Post-Deployment Tasks

### 7.1 Get Publishable API Key

```bash
1. Visit https://api.romart.com/app
2. Login with admin credentials
3. Go to Settings → Publishable API Keys
4. Create new key or copy existing
5. Update storefront .env.local with the key:
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxx
6. Rebuild and restart storefront:
   cd /home/romart/romart/storefront
   npm run build
   pm2 restart romart-storefront
```

### 7.2 Configure Paystack Webhook

```bash
1. Login to Paystack Dashboard (paystack.com)
2. Go to Settings → Webhooks
3. Add webhook URL: https://api.romart.com/webhooks/paystack
4. Save
```

### 7.3 Upload Product Images to Spaces

```bash
# Option 1: Via Medusa Admin
1. Go to https://api.romart.com/app → Products
2. Add/Edit product → Upload images directly

# Option 2: Bulk upload via CLI (if you have local images)
# Install s3cmd or use DigitalOcean Spaces UI
```

### 7.4 Test the Store

1. Visit https://romart.com
2. Browse products
3. Add to cart
4. Complete checkout with test Paystack payment
5. Verify order confirmation email

---

## Part 8: Monitoring and Maintenance

### 8.1 Setup Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation (prevent disk filling)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8.2 Enable DigitalOcean Monitoring

```bash
1. Go to droplet → Monitoring tab
2. Install monitoring agent:
   curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

### 8.3 Setup Backups

**Database Backups (automatic with managed DB):**
- Daily automated backups included
- Retention: 7 days for Basic plan

**Droplet Backups:**
```bash
1. Go to Droplet → Backups
2. Enable weekly backups (+20% of droplet cost = $2.40/mo)
```

**Manual Backup Script:**
```bash
# Create backup script
nano /home/romart/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/romart/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/romart_app_$DATE.tar.gz /home/romart/romart

# Upload to Spaces (optional)
# s3cmd put $BACKUP_DIR/romart_app_$DATE.tar.gz s3://romart-backups/

# Keep only last 7 days
find $BACKUP_DIR -name "romart_app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /home/romart/backup.sh

# Schedule daily backup at 2 AM
crontab -e
# Add line:
0 2 * * * /home/romart/backup.sh >> /home/romart/backup.log 2>&1
```

---

## Part 9: Deployment Workflow (Updates)

### 9.1 Deploy Updates

```bash
# SSH into server
ssh romart@your_droplet_ip

# Pull latest changes
cd /home/romart/romart
git pull origin main

# Update backend
cd backend/apps/backend
npm install
npm run build
npx medusa migrations run  # if there are new migrations
pm2 restart romart-backend

# Update storefront
cd /home/romart/romart/storefront
npm install
npm run build
pm2 restart romart-storefront

# Check status
pm2 status
pm2 logs --lines 50
```

### 9.2 Rollback Strategy

```bash
# If deployment fails, rollback to previous commit
cd /home/romart/romart
git log --oneline  # Find previous working commit
git checkout <commit-hash>

# Rebuild and restart
cd backend/apps/backend
npm run build
pm2 restart romart-backend

cd /home/romart/romart/storefront
npm run build
pm2 restart romart-storefront
```

---

## Part 10: Security Hardening

### 10.1 Firewall Configuration

```bash
# Enable UFW firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Check status
ufw status
```

### 10.2 Fail2Ban (Brute Force Protection)

```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### 10.3 Automatic Security Updates

```bash
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs romart-backend

# Common issues:
# 1. Database connection - verify DATABASE_URL in .env
# 2. Redis connection - verify REDIS_URL in .env
# 3. Port already in use - check: lsof -i :9000
```

### Storefront not loading
```bash
# Check logs
pm2 logs romart-storefront

# Common issues:
# 1. NEXT_PUBLIC_MEDUSA_BACKEND_URL incorrect
# 2. Missing publishable key
# 3. Build failed - check npm run build output
```

### SSL certificate issues
```bash
# Renew manually
certbot renew

# Check certificate status
certbot certificates
```

### Disk space full
```bash
# Check disk usage
df -h

# Clean up PM2 logs
pm2 flush

# Clean up old node_modules
cd /home/romart/romart
rm -rf backend/node_modules storefront/node_modules
# Then reinstall: npm install in each directory
```

---

## Cost Optimization Tips

### Option: Run PostgreSQL + Redis on Droplet (Save $30/month)

**Upgrade to 4GB droplet ($24/mo) instead of managed databases:**

```bash
# On droplet, install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Redis
apt install redis-server -y

# Update .env files:
DATABASE_URL=postgresql://medusa:password@localhost:5432/medusa_db
REDIS_URL=redis://localhost:6379

# Total cost: $24/mo droplet + $5/mo Spaces = $29/mo (vs $47/mo)
```

**Trade-off:** No automatic backups, more maintenance, but saves ~$18/month.

---

## Next Steps

- [ ] Test complete checkout flow with real Paystack payment
- [ ] Add products via Admin dashboard
- [ ] Configure email SMTP (SendGrid/Mailgun) for order confirmations
- [ ] Setup Google Analytics (optional)
- [ ] Enable low stock alerts cron job
- [ ] Test backup and restore procedures

---

## Support Resources

- DigitalOcean Docs: https://docs.digitalocean.com
- Medusa Docs: https://docs.medusajs.com
- Paystack Docs: https://paystack.com/docs
- PM2 Docs: https://pm2.keymetrics.io
