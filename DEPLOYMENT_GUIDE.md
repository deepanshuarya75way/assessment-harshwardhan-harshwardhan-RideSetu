# RideSetu — Production Deployment & Operational Architecture Guide

> [!IMPORTANT]
> **Controlled Pilot Deployment Notice**:
> **LIVE PAYMENTS ARE STRICTLY DISABLED.** The application is configured exclusively in `SANDBOX / TEST` mode with `PAYMENT_PROVIDER=RAZORPAY` (Test API keys) or `MOCK`. No real financial transactions are enabled until legal, financial, payment, and KYC compliance reviews are finalized.

---

## 1. Local Development & Quickstart

```bash
# 1. Clone repository and install dependencies
git checkout release/pilot-v1
npm install

# 2. Configure local environment variables
cp .env.example .env.local

# 3. Seed database with verified Himalayan fleet and partner operators
npm run db:seed

# 4. Start Next.js development server
npm run dev
```

---

## 2. MongoDB Atlas Setup & Database Environments

| Environment | Purpose | Cluster Recommendation | Region |
| :--- | :--- | :--- | :--- |
| **Development** | Local testing & seed scripts | Atlas M0 Free Sandbox | `ap-south-1` (Mumbai) |
| **Controlled Pilot** | User acceptance & device testing | Atlas M10 Dedicated | `ap-south-1` (Mumbai) |
| **Production** | Commercial operations | Atlas M30+ High Availability | `ap-south-1` Multi-AZ |

### Network & Access Configuration
1. Configure Atlas Network Access IP whitelist (allow Vercel serverless IP ranges or `0.0.0.0/0` with strong multi-character database passwords).
2. Use separate database users and distinct cluster connection strings for Development, Pilot, and Production environments.

---

## 3. Environment Variables Configuration

Set these variables in the cloud hosting provider (e.g. Vercel Environment Variables dashboard):

| Variable | Scope | Description | Pilot Setting |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | Server Only | MongoDB Atlas Connection String | `mongodb+srv://...` |
| `JWT_SECRET` | Server Only | Session signing secret (min 32 chars) | Random 64-char key |
| `ENCRYPTION_KEY` | Server Only | AES-256-GCM hex key (32 bytes) | Random 64-hex key |
| `NEXT_PUBLIC_APP_URL` | Universal | Public root application URL | `https://ridesetu.com` |
| `PAYMENT_PROVIDER` | Server Only | Gateway mode (`RAZORPAY` or `MOCK`) | `RAZORPAY` |
| `RAZORPAY_KEY_ID` | Universal | Razorpay Test API Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Server Only | Razorpay Test API Secret | Server-side isolated |
| `RAZORPAY_WEBHOOK_SECRET` | Server Only | Webhook HMAC verification secret | Server-side isolated |
| `PAYOUT_PROVIDER` | Server Only | Vendor payout mode | `MOCK` |
| `NOTIFICATION_PROVIDER` | Server Only | Notification dispatch engine | `MOCK` |

> [!CAUTION]
> **Zero Credential Leaks**: Never expose `JWT_SECRET`, `ENCRYPTION_KEY`, `RAZORPAY_KEY_SECRET`, or `MONGODB_URI` to client JavaScript bundles.

---

## 4. Razorpay Test Mode Setup

1. Log in to the Razorpay Merchant Dashboard and toggle to **Test Mode**.
2. Generate API Keys under **Settings → API Keys**.
3. Set `RAZORPAY_KEY_ID=rzp_test_...` and `RAZORPAY_KEY_SECRET`.
4. Test payments will utilize simulated cards, net banking, and UPI sandbox handles without real money transfer.

---

## 5. Razorpay Webhook Configuration

1. In Razorpay Dashboard, navigate to **Settings → Webhooks**.
2. Add Webhook URL: `https://your-domain.com/api/payments/webhook`.
3. Secret: Enter a strong random secret and configure as `RAZORPAY_WEBHOOK_SECRET`.
4. Subscribed Events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
   - `refund.processed`
5. The endpoint performs raw-body HMAC-SHA256 signature verification and idempotent deduplication.

---

## 6. Vercel Deployment

1. Connect GitHub repository to Vercel and select branch `release/pilot-v1`.
2. Framework Preset: `Next.js`.
3. Build Command: `npm run build`.
4. Add all environment variables in project settings.
5. Deploy and inspect deployment logs.

---

## 7. Domain & SSL Configuration

1. Add custom domains: `ridesetu.com` and `www.ridesetu.com`.
2. Configure DNS A Record `@` to `76.76.21.21` and CNAME `www` to `cname.vercel-dns.com`.
3. Automatic TLS/SSL certificates are provisioned via Vercel Edge Network.

---

## 8. Health & Readiness Telemetry

- **Health Endpoint**: `GET /api/health` → Returns `{ status: 'ok', environment: 'sandbox', database: 'connected' }`.
- **Readiness Endpoint**: `GET /api/ready` → Verifies configuration validity, database reachability, and payment provider mode without exposing infrastructure secrets.

---

## 9. Database Backup Strategy & PITR

1. **Automated Daily Snapshots**: Retained for 30 days in MongoDB Atlas.
2. **Continuous Cloud Backups (PITR)**: Enables point-in-time recovery down to the second for the last 7 days.
3. **Manual Snapshot Trigger**: Take a manual snapshot before any major database migration.

---

## 10. Rollback Strategy

In the event of a deployment issue, instant zero-downtime rollbacks can be performed directly through the Vercel Dashboard under **Deployments → Select Previous Working Deployment → Promote to Production**.

---

## 11. Incident Response Runbook

Refer to [`INCIDENT_RESPONSE.md`](file:///C:/Users/Harshwardhan/.gemini/antigravity/scratch/ridesetu/INCIDENT_RESPONSE.md) for standard operational procedures covering payment discrepancies, database failover, and lock management.

---

## 12. Sandbox to Commercial Production Migration Checklist

Before transitioning from Controlled Pilot to Live Commercial Launch:
- [ ] Complete formal legal & terms of service compliance review.
- [ ] Complete payment aggregator banking KYC and activate live merchant account.
- [ ] Execute security penetration audit.
- [ ] Establish automated offsite database backups.
- [ ] Configure live customer SMS gateway and WhatsApp business credentials.
- [ ] Execute formal dual-operator sign-off before toggling `PAYMENT_PROVIDER` to live mode.
