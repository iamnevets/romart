# Required GitHub Secrets

Add these secrets at: https://github.com/iamnevets/romart/settings/secrets/actions

## Backend Secrets

| Secret Name | Value |
|-------------|-------|
| `DATABASE_URL` | `postgresql://medusa:NMaCq9b6dP1ZLYBo82TDVGds13EC5r2c@romart-postgres.c5q0ywmaipda.eu-west-1.rds.amazonaws.com:5432/medusa_db` |
| `REDIS_URL` | `redis://romart-redis.owlmy5.0001.euw1.cache.amazonaws.com:6379` |
| `JWT_SECRET` | `4vlXy8i0ATRw5NyVaRTF2eZDC8DCZGdL7xDXAeR1gqk=` |
| `COOKIE_SECRET` | `zKeEmNayLofusE/gPORk/8T9VnTB3G5FmZl4X7+0BXw=` |
| `PAYSTACK_SECRET_KEY` | `sk_test_d080a5c4d51d2a0bf40fa44ba0decd1b42f75524` |

## Frontend Secrets (Already Added)

| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://api.romartkitchens.com` ✅ |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_c82a3fc946e385cfb66a5e008bcd423f5fc21b5373e535ced66124ce16bf1230` ✅ |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_test_d080a5c4d51d2a0bf40fa44ba0decd1b42f75524` ✅ |

## EC2 Connection Secrets (Already Added)

| Secret Name | Value |
|-------------|-------|
| `EC2_SSH_KEY` | (Your EC2 SSH private key) ✅ |
| `EC2_HOST` | `99.80.98.247` ✅ |

## Notes

- **PAYSTACK_SECRET_KEY**: Currently using test key. Update to `sk_live_xxxxx` for production.
- **NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY**: Currently using test key. Update to `pk_live_xxxxx` for production.
- JWT and Cookie secrets were generated securely and should be kept secret.
