# RideSetu — Production Deployment Checklist

> **Version**: 1.0.0  
> **Status**: Production Deployment Ready  
> **Platform**: Next.js 14 App Router, Vercel Serverless, MongoDB Atlas, Google Maps Platform, Razorpay Sandbox/Live

---

## 1. Pre-Deployment Configuration Verification

- [x] **MongoDB Atlas**:
  - MongoDB Atlas production cluster provisioned.
  - IP Access List configured with Vercel serverless IP ranges or `0.0.0.0/0` with strong password authentication.
  - Unique sparse indexes verified (`User.email`, `User.phone`, `Notification.idempotencyKey`, `TripLocation`).
- [x] **Google Maps Platform**:
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` restricted by HTTP Referrers (`https://ridesetu.com/*`, `https://*.vercel.app/*`).
  - `GOOGLE_MAPS_SERVER_API_KEY` restricted by server IP / API restrictions.
  - Maps JavaScript API, Places API, and Geocoding API enabled in Google Cloud Console.
- [x] **Google OAuth 2.0**:
  - Authorized Redirect URI set to `https://ridesetu.com/api/auth/google/callback`.
  - OAuth Consent Screen configured with production app name and support email.
- [x] **Razorpay Gateway**:
  - Production Webhook Endpoint set to `https://ridesetu.com/api/payments/webhook`.
  - Webhook Secret configured in Vercel environment variables.
- [x] **Environment Variables in Vercel**:
  - `MONGODB_URI` set
  - `JWT_SECRET` set (min 32 characters)
  - `ENCRYPTION_KEY` set (32 bytes hex)
  - `NEXT_PUBLIC_APP_URL` set to `https://ridesetu.com`
  - `PAYMENT_PROVIDER` set to `RAZORPAY_SANDBOX` / `RAZORPAY_LIVE`

---

## 2. Deployment Execution Steps

1. **Push to Main Branch**:
   ```bash
   git push origin main
   ```
2. **Vercel Build Execution**:
   - Vercel automatically runs `npm run build`.
   - Verify zero build or type-checking errors across all 95 routes.
3. **Domain Verification**:
   - Confirm SSL certificate (HTTPS) is active for `ridesetu.com`.

---

## 3. Post-Deployment Verification (Smoke Tests)

- [ ] **Customer Login & Google OAuth**: Test direct Google login redirect to `/dashboard`.
- [ ] **Partner KYC Onboarding**: Submit application and verify `/partner/onboarding` status.
- [ ] **Vehicle Search & Google Maps**: Open `/vehicles` and `/book/[id]`, verify Google Maps tiles load, Places search works, and draggable marker updates address.
- [ ] **Checkout & Razorpay Payment**: Complete checkout, verify order creation and HMAC SHA256 signature verification.
- [ ] **Live Telemetry Stream**: Test `/partner/bookings/[id]/delivery` and `/dashboard/trips/[id]` real-time GPS stream.
- [ ] **Ops Console & System Health**: Check `/ops/system-health` and verify all services report `HEALTHY`.

---

## 4. Rollback Strategy

1. **Immediate Deployment Rollback**:
   - Navigate to Vercel Console → Deployments → Select previous successful build → Click **Promote to Production**.
2. **Database State Protection**:
   - MongoDB Atlas Point-in-Time Recovery enables restoring to any second within the past 7 days.
