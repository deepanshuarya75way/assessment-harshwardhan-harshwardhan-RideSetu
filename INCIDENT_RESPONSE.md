# RideSetu — Operational Incident Response Runbook

This runbook specifies standard operating procedures for detecting, containing, investigating, and recovering from production incidents during the Controlled Pilot deployment.

---

## 1. Core Operating Principles

1. **Zero Customer PII Exposure**: Never paste raw Driving Licence numbers, KYC document images, passwords, or payment card details into incident logs or public ticket threads.
2. **Escrow Deposit Protection**: Never modify deposit ledger balances manually without dual-operator administrative sign-off.
3. **Audit Trail Preservation**: All corrective actions must be recorded in the `AuditLog` collection.

---

## 2. Incident Scenarios & Standard Procedures

### Incident 1: Payment Amount Mismatch
* **Detection**: Automated reconciliation logs flag discrepancy between server pricing and Razorpay order amount.
* **Immediate Action**: Block automatic booking confirmation for the affected transaction; flag payment as `RECONCILIATION_REQUIRED`.
* **Containment**: Temporary freeze on automated order creation if systematic pricing drift is detected.
* **Verification**: Verify MongoDB `Payment.breakdown` against Razorpay dashboard order payload.
* **Recovery**: Process manual refund or issue corrected customer checkout link.
* **Post-Review**: Audit pricing matrix rules and tax computation helpers.

### Incident 2: Duplicate Booking Attempt
* **Detection**: Second booking attempt for overlapping dates on the same vehicle ID.
* **Immediate Action**: Distributed lock returns `409 Conflict`; transaction rejected.
* **Containment**: Review active `ReservationLock` records.
* **Verification**: Check `Booking` collection with date range queries.
* **Recovery**: Ensure lock TTL auto-cleans within 15 minutes.
* **Post-Review**: Confirm uniqueness of compound MongoDB index on `(vehicleId, status)`.

### Incident 3: Database Outage / Atlas Connectivity Loss
* **Detection**: Health check `GET /api/health` returns `503 Service Unavailable`.
* **Immediate Action**: Next.js returns graceful offline/degraded maintenance banner to users.
* **Containment**: Check MongoDB Atlas cluster metrics and network access IP whitelist.
* **Verification**: Test ping via `npm run test:availability`.
* **Recovery**: Restore connection from failover replica node.
* **Post-Review**: Audit connection pool size and Atlas cluster tier limits.

### Incident 4: Razorpay Webhook Failure / Signature Rejection
* **Detection**: Webhook endpoint returns `400 Bad Request` or signature mismatch.
* **Immediate Action**: Check `RAZORPAY_WEBHOOK_SECRET` environment variable configuration.
* **Containment**: Rely on synchronous `/api/payments/verify` client callback fallback.
* **Verification**: Run `npm run test:e2e` webhook test suite.
* **Recovery**: Trigger webhook replay from the Razorpay Merchant Dashboard.
* **Post-Review**: Verify raw body stream handling in `POST /api/payments/webhook`.

### Incident 5: Customer KYC Privacy Incident
* **Detection**: Report of customer document URL accessible without authentication.
* **Immediate Action**: Immediately revoke signed URL secret keys and cycle `ENCRYPTION_KEY`.
* **Containment**: Verify document routes enforce HMAC-SHA256 token verification and DL number masking.
* **Verification**: Run `test-security-scan.ts`.
* **Recovery**: Notify affected users per local data protection guidelines.
* **Post-Review**: Enforce strict server-side document proxying.

### Incident 6: Unauthorized Vendor Access Attempt
* **Detection**: Vendor attempting to view or edit another vendor's fleet or customer KYC documents.
* **Immediate Action**: Route guard returns `403 Forbidden` and records security AuditLog.
* **Containment**: Account suspension if repeated deliberate probing is detected.
* **Verification**: Review vendor authorization middleware.
* **Recovery**: Restore vendor profile permissions after security audit.
* **Post-Review**: Enhance RBAC test assertions in test suite.

### Incident 7: Refund Amount Mismatch
* **Detection**: Refund calculation exceeding captured amount.
* **Immediate Action**: Payment engine safety clamp rejects over-refund transactions.
* **Containment**: Review cancellation policy calculation tiers (>48h, 24-48h, 12-24h, <12h).
* **Verification**: Check `Payment.refundedAmount` vs `Payment.amount`.
* **Recovery**: Process correct policy-calculated refund amount.
* **Post-Review**: Ensure 100% deposit isolation logic is intact.

### Incident 8: Reservation Lock Corruption / Stale Hold
* **Detection**: Vehicle remains marked reserved after customer abandoned checkout.
* **Immediate Action**: TTL index automatically removes expired locks after 15 minutes.
* **Containment**: Run admin diagnostic release command if manual intervention is required.
* **Verification**: Query `ReservationLock.find({ expiresAt: { $lt: new Date() } })`.
* **Recovery**: Force release locks with `AvailabilityService.releaseReservation`.
* **Post-Review**: Verify MongoDB TTL background worker frequency.

### Incident 9: Production Deployment Failure
* **Detection**: Vercel deployment build fails or health check fails post-deploy.
* **Immediate Action**: Trigger instant rollback via `PRODUCTION_ROLLBACK.md` (`vercel rollback` or switch Git commit).
* **Containment**: Direct traffic to previous stable deployment snapshot (`release/pilot-v1`).
* **Verification**: Verify `GET /api/ready` returns 200 OK.
* **Recovery**: Rebuild and test locally with `npm run build`.
* **Post-Review**: Audit build log traces.
